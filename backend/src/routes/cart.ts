import express from "express";
import { protectedRoute } from '#src/middleware/auth.js';
import {
  addItemRoute,
  clearCartRoute,
  getCartRoute,
  removeItemRoute,
} from '#src/controllers/cartController.js';

const app = express();

app.get("/", protectedRoute, getCartRoute);
app.post("/items", protectedRoute, addItemRoute);
app.delete("/items", protectedRoute, removeItemRoute);
app.delete("/", protectedRoute, clearCartRoute);

export default app;
