import { changeRoleRoute, loginRoute, meRoute, refreshRoute, registerRoute } from "#/controllers/authController.ts";
import { protectedRoute, protectedRouteAdmin } from "#/middleware/auth.ts";
import express from "express";
const app = express();

app.post("/register", registerRoute);
app.post("/login", loginRoute);
app.get("/refresh", refreshRoute);
app.post("/change-role", protectedRouteAdmin, changeRoleRoute)
app.get("/me", protectedRoute, meRoute)

export default app;
