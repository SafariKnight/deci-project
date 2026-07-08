import { loginRoute, refreshRoute, registerRoute } from "#/controllers/authController.ts";
import express from "express";
const app = express()

app.post("/register", registerRoute)
app.post("/login", loginRoute)
app.get("/refresh", refreshRoute)

export default app
