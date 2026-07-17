import express from "express";
import { protectedRoute } from '#src/middleware/auth.js';
import {
  createReviewRoute,
  listReviewsRoute,
} from '#src/controllers/reviewController.js';

const app = express();

app.post("/", protectedRoute, createReviewRoute);
app.get("/product/:productId", listReviewsRoute);

export default app;
