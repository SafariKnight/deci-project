import {
  changeRoleRoute,
  loginRoute,
  logoutRoute,
  meRoute,
  refreshRoute,
  registerRoute,
  userDetailsRoute,
} from '#src/controllers/authController.js';
import { protectedRoute, protectedRouteAdmin } from '#src/middleware/auth.js';
import express from "express";
const app = express();

app.post("/register", registerRoute);
app.post("/login", loginRoute);
app.get("/logout", protectedRoute, logoutRoute);
app.get("/refresh", refreshRoute);
app.get("/me", protectedRoute, meRoute);
app.get("/users/:id", userDetailsRoute);
app.post("/change-role", protectedRouteAdmin, changeRoleRoute);

export default app;
