import { JWTPayload, jwtVerify, SignJWT } from "jose";
import { randomBytes } from "crypto";
import { postgres } from '#src/config/postgres.js';
import { PrismaClientKnownRequestError } from '#prisma/internal/prismaNamespace.js';
import { ERROR_CODES, Result } from '#src/utils/errorCodes.js';

const JWT_SECRET = process.env.JWT_SECRET;
const ALG = "HS256";
const ACCESS_TOKEN_EXPIRY = "1hour";

if (!JWT_SECRET) {
  throw new Error('Missing "JWT_SECRET" environment variable.');
}

const secret = new TextEncoder().encode(JWT_SECRET);

export async function createAccessToken(data: Omit<JWTPayload, "iat" | "exp">) {
  return await new SignJWT(data)
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(secret);
}

export async function makeRefreshToken() {
  return randomBytes(32).toString("hex");
}

export async function verifyJWT(jwt: string) {
  return (await jwtVerify(jwt, secret, { algorithms: [ALG] })).payload;
}

export async function invalidateRefreshToken(
  token: string,
): Promise<Result<{ ok: true }>> {
  try {
    await postgres.refreshToken.update({
      where: {
        token: token,
        valid: true,
      },
      data: {
        valid: false,
      },
    });
    return { ok: true };
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError && e.code === "P2025") {
      return { ok: false, error: ERROR_CODES.AUTH.TOKEN_NOT_FOUND };
    }
    throw e;
  }
}
