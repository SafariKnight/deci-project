import express from "express";
import { deleteRoute, uploadRoute } from "#/controllers/imageController.ts";
import { upload } from "#/middleware/image.ts";
import { protectedRoute } from "#/middleware/auth.ts";
const app = express();

app.post("/", protectedRoute, upload, uploadRoute);
app.delete("/by-name/:image", protectedRoute, deleteRoute);

export default app;
