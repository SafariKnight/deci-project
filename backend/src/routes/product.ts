import express from "express";
import { protectedRoute } from '#src/middleware/auth.js';
import {
  deleteRoute,
  getRoute,
  listRoute,
  listUserRoute,
  updateRoute,
  uploadRoute,
} from '#src/controllers/productController.js';
const app = express();

app.post("/", protectedRoute, uploadRoute);
app.delete("/:id", protectedRoute, deleteRoute);
app.get("/:id", getRoute);
app.patch("/:id", protectedRoute, updateRoute);
app.get("/", listRoute);
app.get("/user/:id", listUserRoute);

export default app;
