import express from "express";
import { protectedRoute } from "#/middleware/auth.ts";
import {
  deleteRoute,
  getRoute,
  listRoute,
  updateRoute,
  uploadRoute,
} from "#/controllers/productController.ts";
const app = express();

app.post("/", protectedRoute, uploadRoute);
app.delete("/:id", protectedRoute, deleteRoute);
app.get("/:id", getRoute);
app.patch("/:id", protectedRoute, updateRoute);
app.get("/", listRoute);

export default app;
