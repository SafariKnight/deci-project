import { RequestHandler } from "express";
import { isString, isNonEmpty, Schema, isEmail, validate, minLength, isNum, oneOf } from "#/utils/validation.ts";
import { changeUserRole, getUserById, login, refresh, register } from "#/services/userService.ts";
import { Role } from "#prisma/enums.ts";

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
    res.status(422).send({
      errors: result.errors,
    });
    return;
  }

  const body = result.value;

  const registerResult = await register(body.username, body.email, body.password);

  if (!registerResult.ok) {
    res.status(422).json({ message: "Email already in use", error: registerResult.error });
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
    res.status(422).send({
      errors: result.errors,
    });
    return;
  }

  const body = result.value;

  const loginResult = await login(body.email, body.password);
  if (!loginResult.ok) {
    switch (loginResult.error) {
      case "email_wasnt_found":
        res.status(401).send({ message: "Email is missing", error: loginResult.error });
        return;
      case "wrong_password":
        res.status(401).send({ message: "Wrong Password", error: loginResult.error });
        return;
    }
  }
  const { refreshToken, accessToken } = loginResult;

  res.cookie("auth_refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/auth/refresh",
  });

  res.status(200).json({ accessToken });
};

export const refreshRoute: RequestHandler = async (req, res) => {
  const refreshToken = req.cookies["auth_refresh_token"];

  if (!refreshToken) {
    res.status(401).json({ message: "Missing token", error: "missing_token" });
  }

  const result = await refresh(refreshToken);

  if (!result.ok) {
    res.json(401).send({ message: "Invalid Token", error: "invalid_token" });
    return;
  }
  res.status(200).json({ accessToken: result.accessToken });
};

type changeRoleRequest = {
  id: number,
  newRole: Role
}

const changeRoleSchema: Schema<changeRoleRequest> = {
  id: [
    isNum
  ],
  newRole: [
    isString,
    oneOf(["USER", "ADMIN", "OWNER"])
  ]
}

export const changeRoleRoute: RequestHandler = async (req, res) => {
  // oxlint-disable-next-line no-unused-vars
  const user = req.user

  const result = validate(req.body, changeRoleSchema)

  if (!result.ok) {
    return res.status(422).json({ errors: result.errors })
  }

  const body = result.value

  if ((await getUserById(body.id, { role: true }))?.role === "OWNER") {
    return res.status(403).json({
      message: "Cannot change owner's role",
      error: "owner_must_not_change"
    })
  }
  if (user.role === "ADMIN", body.newRole === "OWNER") {
    return res.status(403).json({
      message: "Admin cannot make owner",
      error: "not_authorized"
    })
  }

  const changeResult = await changeUserRole(body.id, body.newRole)

  if (!changeResult.ok) {
    return res.status(404).json({
      message: "Cannot find user",
      error: changeResult.error
    })
  }

  return res.status(204).send()
}

export const meRoute: RequestHandler = async (req, res) => {
  return res.json(req.user)
}
