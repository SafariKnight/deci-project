import { mongo } from "#src/config/mongo.js";
import { Cart } from "#src/types.js";
import { ERROR_CODES, Result } from "#src/utils/errorCodes.js";

const db = mongo.collection<Cart>("carts");

export async function getCartByUserId(
  userId: number,
): Promise<Result<{ cart: Cart }>> {
  const cart = await db.findOne({ userId });
  if (!cart) {
    return { ok: false, error: ERROR_CODES.CART.NOT_FOUND };
  }
  return { ok: true, cart };
}

export async function ensureCart(
  userId: number,
): Promise<Result<{ cart: Cart }>> {
  const existing = await db.findOne({ userId });
  if (existing) {
    return { ok: true, cart: existing };
  }

  const newCart: Cart = { userId, products: [] };
  await db.insertOne(newCart);
  return { ok: true, cart: newCart };
}

export async function addToCart(
  userId: number,
  productId: string,
  quantity: number = 1,
): Promise<Result<{ cart: Cart }>> {
  if (quantity <= 0) {
    return { ok: false, error: ERROR_CODES.CART.INVALID_DATA };
  }

  const cart = await db.findOne({ userId });

  if (!cart) {
    const newCart: Cart = {
      userId,
      products: [{ productId, quantity, addedAt: Date.now() }],
    };
    await db.insertOne(newCart);
    return { ok: true, cart: newCart };
  }

  const existingIndex = cart.products.findIndex(
    (p) => p.productId === productId,
  );

  if (existingIndex !== -1) {
    cart.products[existingIndex].quantity += quantity;
  } else {
    cart.products.push({ productId, quantity, addedAt: Date.now() });
  }

  await db.updateOne({ userId }, { $set: { products: cart.products } });
  return { ok: true, cart };
}

export async function removeFromCart(
  userId: number,
  productId: string,
  quantity?: number,
): Promise<Result<{ cart: Cart }>> {
  const cart = await db.findOne({ userId });
  if (!cart) {
    return { ok: false, error: ERROR_CODES.CART.NOT_FOUND };
  }

  const existingIndex = cart.products.findIndex(
    (p) => p.productId === productId,
  );

  if (existingIndex === -1) {
    return { ok: false, error: ERROR_CODES.CART.PRODUCT_NOT_FOUND };
  }

  if (
    quantity === undefined ||
    quantity >= cart.products[existingIndex].quantity
  ) {
    // Remove the item entirely
    cart.products.splice(existingIndex, 1);
  } else {
    // Decrement quantity
    cart.products[existingIndex].quantity -= quantity;
  }

  await db.updateOne({ userId }, { $set: { products: cart.products } });
  return { ok: true, cart };
}

export async function clearCart(userId: number): Promise<Result<{ ok: true }>> {
  const result = await db.updateOne({ userId }, { $set: { products: [] } });
  if (result.matchedCount === 0) {
    return { ok: false, error: ERROR_CODES.CART.NOT_FOUND };
  }
  return { ok: true };
}
