import express from "express";
import authRouter from "./auth.ts"
import imageRouter from "./image.ts"
const app = express()

app.use("/auth", authRouter)
app.use("/image", imageRouter)

export default app
