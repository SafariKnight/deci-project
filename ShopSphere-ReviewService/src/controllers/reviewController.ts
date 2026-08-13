import { RequestHandler } from "express";
import { Request, Response } from "express";
import { createReview, getReviewsByProduct } from "../services/reviewService.js";

interface CreateReviewRequest {
  productId: string;
  rating: number;
  comment: string;
}

export const createReviewRoute: RequestHandler = async (req, res) => {
  const body = req.body as CreateReviewRequest;

  if (!body.productId || !body.rating || !body.comment) {
    return res.status(422).json({
      errors: ["Missing required fields: productId, rating, comment"],
    });
  }

  if (body.rating < 1 || body.rating > 5) {
    return res.status(422).json({
      errors: ["Rating must be between 1 and 5"],
    });
  }

  // The review service receives userId and username from the main app
  // via a JWT-decoded payload or headers
  const userId = parseInt(req.headers["x-user-id"] as string || "0");
  const username = req.headers["x-username"] as string || "anonymous";

  const reviewResult = await createReview({
    productId: body.productId,
    userId,
    username,
    rating: body.rating,
    comment: body.comment,
  });

  if (!reviewResult.ok) {
    return res.status(500).json({
      message: "Failed to create review",
      error: reviewResult.error,
    });
  }

  return res.status(201).json({ id: reviewResult.id });
};

export const listReviewsRoute: RequestHandler = async (req, res) => {
  const productId = req.params.productId as string;

  if (!productId) {
    return res.status(422).json({
      message: "Missing product ID",
      error: "missing_product_id",
    });
  }

  const result = await getReviewsByProduct(productId);
  if (!result.ok) {
    return res.status(500).json({
      message: "Failed to fetch reviews",
      error: result.error,
    });
  }

  res.status(200).json({ reviews: result.reviews });
};
