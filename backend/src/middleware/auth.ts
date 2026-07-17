import { verifyJWT } from '#src/services/tokenService.js';
import { getUserByAccessTokenPayload } from '#src/services/userService.js';
import { RequestHandler } from "express";
import { errors } from "jose";

export const protectedRoute: RequestHandler = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return;
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({
      message: "Missing bearer token",
      error: "bearer_token_missing",
    });
    return;
  }

  try {
    const payload = await verifyJWT(token);

    const result = await getUserByAccessTokenPayload(payload);

    if (!result.ok) {
      res.status(401).json({
        message: "User doesn't exist",
        error: result.error,
      });
      return;
    }
    req.user = result.user;
    next();
  } catch (e) {
    if (e instanceof errors.JWTExpired) {
      res.status(401).json({
        message: "Bearer Token has expired",
        error: "bearer_token_expired",
      });
      return;
    }
    if (e instanceof errors.JWSSignatureVerificationFailed) {
      res.status(401).json({
        message: "Bearer Token has invalid_signature",
        error: "bearer_token_invalid_signature",
      });
      return;
    }
    if (e instanceof errors.JWTInvalid) {
      res.status(401).json({
        message: "Bearer Token is invalid",
        error: "bearer_token_invalid",
      });
      return;
    }
    res.status(401).json({
      message: "Bearer Token Invalid User",
      error: "bearer_token_invalid_user",
    });
    return;
  }
};

export const protectedRouteAdmin: RequestHandler = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return;
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({
      message: "Missing bearer token",
      error: "bearer_token_missing",
    });
    return;
  }

  try {
    const payload = await verifyJWT(token);

    const result = await getUserByAccessTokenPayload(payload);

    if (!result.ok) {
      return res.status(404).json({
        message: "User doesn't exist",
        error: "user_doesnt_exist",
      });
    }

    const user = result.user;

    if (user.role === "OWNER" || user.role === "ADMIN") {
      req.user = user;
      return next();
    }

    res.status(403).json({
      message: "User must be an admin",
      error: "not_authorized",
    });
  } catch (e) {
    if (e instanceof errors.JWTExpired) {
      res.status(401).json({
        message: "Bearer Token has expired",
        error: "bearer_token_expired",
      });
      return;
    }
    if (e instanceof errors.JWSSignatureVerificationFailed) {
      res.status(401).json({
        message: "Bearer Token has invalid_signature",
        error: "bearer_token_invalid_signature",
      });
      return;
    }
    if (e instanceof errors.JWTInvalid) {
      res.status(401).json({
        message: "Bearer Token is invalid",
        error: "bearer_token_invalid",
      });
      return;
    }
    return res.status(401).json({
      message: "Bearer Token unknown user",
      error: "bearer_token_unknown_user",
    });
  }
};
