import { verifyJWT } from "#/services/jwtService.ts";
import { findUserByAccessTokenPayload } from "#/services/userService.ts";
import { RequestHandler } from "express";
import { errors } from "jose";

export const protectedRoute: RequestHandler = async (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return
  }

  const token = authHeader.split(" ")[1]

  if (!token) {
    res.status(401).json({
      message: "Missing bearer token",
      error: "bearer_token_missing"
    })
    return
  }

  try {
    const payload = await verifyJWT(token)

    const user = await findUserByAccessTokenPayload(payload)

    if (!user) {
      res.status(401).json({
        message: "User doesn't exist",
        error: "user_doesnt_exist"
      })
      return
    }
    req.user = user
    next()
  } catch (e) {
    if (e instanceof errors.JWTExpired) {
      res.status(401).json({
        message: "Bearer Token has expired",
        error: "bearer_token_expired"
      })
      return
    }
    if (e instanceof errors.JWSSignatureVerificationFailed) {
      res.status(401).json({
        message: "Bearer Token has invalid_signature",
        error: "bearer_token_invalid_signature"
      })
      return
    }
    if (e instanceof errors.JWTInvalid) {
      res.status(401).json({
        message: "Bearer Token is invalid",
        error: "bearer_token_invalid"
      })
      return
    }
    res.status(401).json({
      message: "Bearer Token unknown error",
      error: "bearer_token_unknown_error"
    })
    return
  }
}
