import express from "express";
import {sample} from "#/controllers/sampleController.ts"
const app = express()

app.get("/", sample)

export default app
