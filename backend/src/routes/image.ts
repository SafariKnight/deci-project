import express from "express";
import { deleteRoute, getRoute, uploadRoute } from '#src/controllers/imageController.js';
import { upload } from '#src/middleware/image.js';
import { protectedRoute } from '#src/middleware/auth.js';
const app = express();

app.post("/", protectedRoute, upload, uploadRoute);
app.get("/by-name/:image", getRoute);
app.delete("/by-name/:image", protectedRoute, deleteRoute);

export default app;
