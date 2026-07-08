import express from "express";
import authRouter from "./auth.ts"
const app = express()

app.use("/auth", authRouter)

export default app
