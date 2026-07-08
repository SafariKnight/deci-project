import { JWTPayload, jwtVerify, SignJWT } from "jose"

const JWT_SECRET = process.env.JWT_SECRET
const ALG = "HS256"

if (!JWT_SECRET) {
  throw new Error('Missing "JWT_SECRET" environment variable.')
}

const secret = new TextEncoder().encode(JWT_SECRET)

export async function newJWT(data: Omit<JWTPayload, "iat" | "exp">) {
  return await new SignJWT(data)
    .setProtectedHeader({alg: ALG})
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(secret)

}

export async function verifyJWT(jwt: string) {
  return (await jwtVerify(jwt, secret, {algorithms: [ ALG ]})).payload
}
