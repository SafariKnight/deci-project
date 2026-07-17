import { postgres } from '#src/config/postgres.js';
import { PrismaClientKnownRequestError } from '#prisma/internal/prismaNamespace.js';
import { UserCreateInput, UserSelect } from '#prisma/models.js';
import { JWTPayload } from "jose";
import { createAccessToken, makeRefreshToken } from './tokenService.js';
import { comparePassword, hashPassword } from './passwordService.js';
import { Role } from '#prisma/enums.js';
import { User } from '#prisma/client.js';
import { LoginAPIError } from "#src/types.js";
import { ERROR_CODES, Result } from '#src/utils/errorCodes.js';

export async function createUser(
  data: UserCreateInput,
): Promise<Result<{ user: Omit<User, "password"> }>> {
  const user = await postgres.user.create({
    omit: {
      password: true,
    },
    data,
  });
  return { ok: true, user };
}

export async function getUserById(
  id: number,
  select: UserSelect | undefined,
): Promise<Result<{ user: User }>> {
  const user = await postgres.user.findUnique({
    where: {
      id,
    },
    select,
  });
  if (!user) {
    return { ok: false, error: ERROR_CODES.USER.NOT_FOUND };
  }
  return { ok: true, user };
}

export async function getUserByEmail(
  email: string,
  select: UserSelect | undefined,
): Promise<Result<{ user: User }>> {
  const user = await postgres.user.findUnique({
    where: {
      email,
    },
    select,
  });
  if (!user) {
    return { ok: false, error: ERROR_CODES.USER.NOT_FOUND };
  }
  return { ok: true, user };
}

export async function getUserByAccessTokenPayload(
  accessTokenPayload: JWTPayload,
): Promise<Result<{ user: Omit<User, "password"> }>> {
  const user = await postgres.user.findUnique({
    where: {
      email: accessTokenPayload.sub,
    },
    omit: {
      password: true,
    },
  });
  if (!user) {
    return { ok: false, error: ERROR_CODES.USER.NOT_FOUND };
  }
  return { ok: true, user };
}

export async function changeUserRole(
  id: number,
  newRole: Role,
): Promise<Result<{ ok: true }>> {
  try {
    await postgres.user.update({
      where: {
        id,
      },
      data: {
        role: newRole,
      },
    });
    return { ok: true };
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError && e.code === "P2025") {
      return { ok: false, error: ERROR_CODES.USER.MISSING };
    }
    throw e;
  }
}

export async function register(
  username: string,
  email: string,
  password: string,
): Promise<Result<{ user: { id: number; username: string; email: string } }>> {
  try {
    const result = await createUser({
      username: username,
      email: email,
      password: await hashPassword(password),
    });

    if (result.ok) {
      return { ok: true, user: result.user };
    }

    return { ok: false, error: result.error };
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError) {
      if (e.code === "P2002") {
        return { ok: false, error: ERROR_CODES.AUTH.EMAIL_IN_USE };
      }
    }
    throw e;
  }
}

export async function login(
  email: string,
  password: string,
): Promise<
  | Result<{
      accessToken: string;
      refreshToken: string;
      user: Omit<User, "password">;
    }>
  | { ok: false; error: LoginAPIError }
> {
  const user = await getUserByEmail(email, {
    id: true,
    email: true,
    role: true,
    username: true,
    password: true,
  });

  if (!user.ok) {
    return { ok: false, error: ERROR_CODES.AUTH.EMAIL_MISSING };
  }

  if (!(await comparePassword(user.user.password, password))) {
    return { ok: false, error: ERROR_CODES.AUTH.WRONG_PASSWORD };
  }

  const accessToken = await createAccessToken({ sub: email });
  const refreshToken = await makeRefreshToken();

  await postgres.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.user.id,
    },
  });
  return {
    ok: true,
    accessToken,
    refreshToken,
    user: {
      id: user.user.id,
      email: user.user.email,
      role: user.user.role,
      username: user.user.username,
    },
  };
}

export async function refresh(
  refreshToken: string,
): Promise<Result<{ accessToken: string }>> {
  if (!refreshToken) {
    return { ok: false, error: ERROR_CODES.AUTH.INVALID_TOKEN };
  }

  const token = await postgres.refreshToken.findUnique({
    where: {
      token: refreshToken,
      valid: true,
    },
    include: {
      user: true,
    },
  });
  if (!token) {
    return { ok: false, error: ERROR_CODES.AUTH.INVALID_TOKEN };
  }
  return {
    ok: true,
    accessToken: await createAccessToken({ sub: token.user.email }),
  };
}
