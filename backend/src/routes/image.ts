import express from "express";
import { deleteRoute, uploadRoute } from "#/controllers/imageController.ts";
import { upload } from "#/middleware/image.ts";
import { protectedRoute } from "#/middleware/auth.ts";
const app = express();

app.use("/", protectedRoute);

app.post("/", upload, uploadRoute);
app.delete("/by-name/:image", deleteRoute);

export default app;
