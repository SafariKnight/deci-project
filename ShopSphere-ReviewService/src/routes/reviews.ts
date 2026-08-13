import express from "express";
import { createReviewRoute, listReviewsRoute } from "../controllers/reviewController.js";

const router = express.Router();

router.post("/", createReviewRoute);
router.get("/product/:productId", listReviewsRoute);

export default router;
