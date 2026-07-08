import { postgres } from "#/config/postgres.ts"
import { PrismaClientKnownRequestError } from "#prisma/internal/prismaNamespace.ts"
import { UserCreateInput, UserSelect } from "#prisma/models.ts"
import { JWTPayload } from "jose"
import { createAccessToken, makeRefreshToken } from "./jwtService.ts"
import { comparePassword, hashPassword } from "./passwordService.ts"

export async function createUser(data: UserCreateInput) {
  return await postgres.user.create({
    omit: {
      password: true
    },
    data
  })
}

export async function findUserByEmail(email: string, select: UserSelect | undefined) {
  return await postgres.user.findUnique({
    where: {
      email
    },
    select
  })
}

export async function findUserByAccessTokenPayload(accessTokenPayload: JWTPayload) {
  return await postgres.user.findUnique({
    where: {
      email: accessTokenPayload.sub
    },
    omit: {
      password: true
    }
  })
}

export async function register(username: string, email: string, password: string): Promise<
  { ok: false; error: "email_in_use" }
  | { ok: true; user: { id: number, username: string, email: string} }> {
    let user;

    try {
      user = await createUser({
        username: username,
        email: email,
        password: await hashPassword(password)
      })
    } catch (e){
      if (e instanceof PrismaClientKnownRequestError) {
        if (e.code === "P2002") {
          return { ok: false, error: "email_in_use"}
        }
      }
      throw e
    }
    return { ok: true, user }
}

export async function login(email: string, password: string): Promise<
  { ok: false; error: "email_wasnt_found" | "wrong_password" }
  | { ok: true; accessToken: string; refreshToken: string}> {
  const user = await findUserByEmail(email, {
    email: true,
    password: true,
    id: true
  })

  if (!user) {
    return { ok: false, error: "email_wasnt_found" } as const
  }

  if (await comparePassword(user.password, password)) {
    const accessToken = await createAccessToken({ sub: email })
    const refreshToken = await makeRefreshToken()

    await postgres.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
      }
    })
    return { ok: true, accessToken, refreshToken } as const
  }

  return { ok: false, error: "wrong_password" } as const
}

export async function refresh(refreshToken: string): Promise<{ok: false, error: "invalid_token"} | { ok: true, accessToken: string  }> {
  const token = await postgres.refreshToken.findUnique({
    where: {
      token: refreshToken
    },
    include: {
      user: true
    }
  })
  if (!token) {
    return { ok: false, error: "invalid_token"}
  }
  return {
    ok: true,
    accessToken: await createAccessToken({ sub: token.user.email })
  }
}
