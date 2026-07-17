import { RequestHandler } from "express";
import {
  isNonEmpty,
  isNum,
  isString,
  oneOf,
  Schema,
  validate,
} from '#src/utils/validation.js';
import { createReview, getReviewsByProduct } from '#src/services/reviewService.js';
import { ERROR_CODES } from '#src/utils/errorCodes.js';

type createReviewRequest = {
  productId: string;
  rating: number;
  comment: string;
};

const createReviewSchema: Schema<createReviewRequest> = {
  productId: [isString, isNonEmpty],
  rating: [isNum, oneOf([1, 2, 3, 4, 5])],
  comment: [isString, isNonEmpty],
};

export const createReviewRoute: RequestHandler = async (req, res) => {
  const result = validate(req.body, createReviewSchema);
  if (!result.ok) {
    return res.status(422).json({ errors: result.errors });
  }

  const body = result.value;
  const userId = req.user.id;
  const username = req.user.username;

  const reviewResult = await createReview({
    productId: body.productId,
    userId,
    username,
    rating: body.rating,
    comment: body.comment,
  });

  if (!reviewResult.ok) {
    if (reviewResult.error === ERROR_CODES.REVIEW.PRODUCT_NOT_FOUND) {
      return res.status(404).json({
        message: "Product not found",
        error: reviewResult.error,
      });
    }
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
