import { RequestHandler } from "express";
import {
  addToCart,
  clearCart,
  ensureCart,
  removeFromCart,
} from '#src/services/cartService.js';
import { isNonEmpty, isString, Schema, validate } from '#src/utils/validation.js';
import { ERROR_CODES } from '#src/utils/errorCodes.js';

export const getCartRoute: RequestHandler = async (req, res) => {
  const userId = req.user.id;

  const result = await ensureCart(userId);

  if (!result.ok) {
    return res.status(500).json({
      message: "Failed to retrieve cart",
      error: result.error,
    });
  }

  res.status(200).json(result.cart);
};

type addItemBody = {
  productId: string;
};

const addItemSchema: Schema<addItemBody> = {
  productId: [isString, isNonEmpty],
};

export const addItemRoute: RequestHandler = async (req, res) => {
  const userId = req.user.id;

  const result = validate(req.body, addItemSchema);
  if (!result.ok) {
    return res.status(422).json({ errors: result.errors });
  }

  const body = result.value;
  const quantity =
    typeof req.body.quantity === "number" && req.body.quantity > 0
      ? req.body.quantity
      : 1;

  const cartResult = await addToCart(userId, body.productId, quantity);

  if (!cartResult.ok) {
    return res.status(500).json({
      message: "Failed to add item to cart",
      error: cartResult.error,
    });
  }

  res.status(200).json(cartResult.cart);
};

type removeItemBody = {
  productId: string;
};

const removeItemSchema: Schema<removeItemBody> = {
  productId: [isString, isNonEmpty],
};

export const removeItemRoute: RequestHandler = async (req, res) => {
  const userId = req.user.id;

  const result = validate(req.body, removeItemSchema);
  if (!result.ok) {
    return res.status(422).json({ errors: result.errors });
  }

  const body = result.value;

  const cartResult = await removeFromCart(
    userId,
    body.productId,
    req.body.quantity,
  );

  if (!cartResult.ok) {
    if (cartResult.error === ERROR_CODES.CART.NOT_FOUND) {
      return res.status(404).json({
        message: "Cart not found",
        error: cartResult.error,
      });
    }
    if (cartResult.error === ERROR_CODES.CART.PRODUCT_NOT_FOUND) {
      return res.status(404).json({
        message: "Product not found in cart",
        error: cartResult.error,
      });
    }
    return res.status(500).json({
      message: "Failed to remove item from cart",
      error: cartResult.error,
    });
  }

  res.status(200).json(cartResult.cart);
};

export const clearCartRoute: RequestHandler = async (req, res) => {
  const userId = req.user.id;

  const result = await clearCart(userId);

  if (!result.ok) {
    if (result.error === ERROR_CODES.CART.NOT_FOUND) {
      return res.status(404).json({
        message: "Cart not found",
        error: result.error,
      });
    }
    return res.status(500).json({
      message: "Failed to clear cart",
      error: result.error,
    });
  }

  res.status(204).send();
};
