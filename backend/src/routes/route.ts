import express from "express";
import sampleRouter from "./sample.ts";
const app = express()

app.use("/hello", sampleRouter)


export default app
