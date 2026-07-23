import { RequestHandler, Request, Response } from "express";
import {
  isString,
  isNonEmpty,
  Schema,
  isEmail,
  validate,
  minLength,
  isNum,
  oneOf,
} from '#src/utils/validation.js';
import {
  changeUserRole,
  getUserById,
  login,
  refresh,
  register,
} from '#src/services/userService.js';
import { Role } from '#prisma/enums.js';
import { invalidateRefreshToken } from '#src/services/tokenService.js';
import { ERROR_CODES } from '#src/utils/errorCodes.js';

const PASSWORD_MIN_LENGTH = 8;

type registerRequest = {
  username: string;
  email: string;
  password: string;
};
const registerSchema: Schema<registerRequest> = {
  username: [isString, isNonEmpty],
  email: [isString, isEmail],
  password: [isString, isNonEmpty, minLength(8)],
};

export const registerRoute: RequestHandler = async (req, res) => {
  const result = validate(req.body, registerSchema);
  if (!result.ok) {
    res.status(422).json({
      errors: result.errors,
    });
    return;
  }

  const body = result.value;

  const registerResult = await register(
    body.username,
    body.email,
    body.password,
  );

  if (!registerResult.ok) {
    const status =
      registerResult.error === ERROR_CODES.AUTH.EMAIL_IN_USE ? 409 : 422;
    res
      .status(status)
      .json({ message: "Email already in use", error: registerResult.error });
    return;
  }

  const user = registerResult.user;

  res.status(201).json(user);
};

type loginRequest = {
  email: string;
  password: string;
};

const loginSchema: Schema<loginRequest> = {
  email: [isString, isEmail],
  password: [isString, isNonEmpty, minLength(PASSWORD_MIN_LENGTH)],
};

export const loginRoute: RequestHandler = async (req, res) => {
  const result = validate(req.body, loginSchema);
  if (!result.ok) {
    res.status(422).json({
      errors: result.errors,
    });
    return;
  }

  const body = result.value;

  const loginResult = await login(body.email, body.password);
  if (!loginResult.ok) {
    const status = 401;
    res
      .status(status)
      .json({ message: "Invalid credentials", error: loginResult.error });
    return;
  }
  const { refreshToken, accessToken, user } = loginResult;

  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("auth_refresh_token", refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/auth/",
  });

  res.status(200).json({
    accessToken,
    user,
  });
};

export const logoutRoute: RequestHandler = async (req, res) => {
  const refreshToken = req.cookies["auth_refresh_token"];

  if (!refreshToken) {
    return res.status(401).json({
      message: "Missing token",
      error: ERROR_CODES.AUTH.MISSING_TOKEN,
    });
  }

  const result = await invalidateRefreshToken(refreshToken);
  if (!result.ok) {
    return res
      .status(401)
      .json({ message: "Token was not found", error: result.error });
  }

  res.clearCookie("auth_refresh_token");
  res.status(204).send();
};

export const refreshRoute: RequestHandler = async (req, res) => {
  const refreshToken = req.cookies["auth_refresh_token"];

  if (!refreshToken) {
    return res.status(401).json({
      message: "Missing token",
      error: ERROR_CODES.AUTH.MISSING_TOKEN,
    });
  }

  const result = await refresh(refreshToken);

  if (!result.ok) {
    return res
      .status(401)
      .json({ message: "Invalid Token", error: result.error });
  }
  res.status(200).json({ accessToken: result.accessToken });
};

type changeRoleRequest = {
  id: number;
  newRole: Role;
};

const changeRoleSchema: Schema<changeRoleRequest> = {
  id: [isNum],
  newRole: [isString, oneOf(["USER", "ADMIN", "OWNER"])],
};

export const changeRoleRoute: RequestHandler = async (req, res) => {
  // oxlint-disable-next-line no-unused-vars
  const user = req.user;

  const result = validate(req.body, changeRoleSchema);

  if (!result.ok) {
    return res.status(422).json({ errors: result.errors });
  }

  const body = result.value;

  const userResult = await getUserById(body.id, { role: true });
  if (userResult.ok && userResult.user.role === "OWNER") {
    return res.status(403).json({
      message: "Cannot change owner's role",
      error: ERROR_CODES.USER.FORBIDDEN,
    });
  }
  if (user.role === "ADMIN" && body.newRole === "OWNER") {
    return res.status(403).json({
      message: "Admin cannot make owner",
      error: ERROR_CODES.USER.FORBIDDEN,
    });
  }

  const changeResult = await changeUserRole(body.id, body.newRole);

  if (!changeResult.ok) {
    return res.status(404).json({
      message: "Cannot find user",
      error: changeResult.error,
    });
  }

  return res.status(204).send();
};

export const meRoute: RequestHandler = async (req, res) => {
  return res.json(req.user);
};

export const userDetailsRoute = async (
  req: Request<{ id: number }>,
  res: Response,
) => {
  const id = parseInt(req.params.id.toString());

  if (isNaN(id)) {
    return res.status(404).json({
      message: "Invalid ID",
      error: "invalid_id",
    });
  }

  const result = await getUserById(id, {
    email: true,
    id: true,
    role: true,
    username: true,
  });

  if (!result.ok) {
    return res.status(404).json({
      message: "User Not Found",
      error: result.error,
    });
  }
  res.status(200).json(result.user);
};
