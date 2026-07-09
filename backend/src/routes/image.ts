import express from "express";
import { uploadRoute } from "#/controllers/imageController.ts";
import { upload } from "#/middleware/image.ts";
const app = express()

app.post("/", upload, uploadRoute)

export default app
