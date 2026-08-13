import express from "express";
import { protectedRoute } from '#src/middleware/auth.js';
import { mongo } from '#src/config/mongo.js';
import { ObjectId } from "mongodb";
import { ERROR_CODES } from '#src/utils/errorCodes.js';

const router = express.Router();

const REVIEW_SERVICE_URL = process.env.REVIEW_SERVICE_URL || "http://localhost:3004";
const productsDb = mongo.collection("products");

router.post("/", protectedRoute, async (req, res) => {
  const { productId } = req.body;

  const product = await productsDb.findOne({ _id: new ObjectId(productId) });
  if (!product) {
    return res.status(404).json({
      message: "Product not found",
      error: ERROR_CODES.REVIEW.PRODUCT_NOT_FOUND,
    });
  }

  try {
    const response = await fetch(`${REVIEW_SERVICE_URL}/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": String(req.user.id),
        "x-username": req.user.username,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(502).json({ message: "Failed to connect to review service" });
  }
});

router.get("/product/:productId", async (req, res) => {
  try {
    const response = await fetch(
      `${REVIEW_SERVICE_URL}/reviews/product/${req.params.productId}`,
    );

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(502).json({ message: "Failed to connect to review service" });
  }
});

export default router;
