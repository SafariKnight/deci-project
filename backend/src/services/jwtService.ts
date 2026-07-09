import { JWTPayload, jwtVerify, SignJWT } from "jose";
import { randomBytes } from "crypto";

const JWT_SECRET = process.env.JWT_SECRET;
const ALG = "HS256";
const ACCESS_TOKEN_EXPIRY = "15m";

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
