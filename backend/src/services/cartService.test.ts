import "#src/config/index.ts";
import { mongo } from '#src/config/mongo.js';
import {
  addToCart,
  clearCart,
  ensureCart,
  getCartByUserId,
  removeFromCart,
} from './cartService.js';
import { ERROR_CODES } from '#src/utils/errorCodes.js';
import { Cart } from "#src/types.js";

const db = mongo.collection<Cart>("carts");

beforeEach(async () => {
  await db.drop({});
});

const testUserId = 1;
const testProductId = "507f1f77bcf86cd799439011";

describe("getCartByUserId", () => {
  it("returns a cart when found", async () => {
    await db.insertOne({ userId: testUserId, products: [] });

    const result = await getCartByUserId(testUserId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.cart.userId).toBe(testUserId);
      expect(result.cart.products).toEqual([]);
    }
  });

  it("returns NOT_FOUND when cart doesn't exist", async () => {
    const result = await getCartByUserId(testUserId);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe(ERROR_CODES.CART.NOT_FOUND);
    }
  });
});

describe("ensureCart", () => {
  it("returns existing cart if one exists", async () => {
    await db.insertOne({ userId: testUserId, products: [] });

    const result = await ensureCart(testUserId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.cart.userId).toBe(testUserId);
      expect(result.cart.products).toEqual([]);
    }
  });

  it("creates and returns a new empty cart if none exists", async () => {
    const result = await ensureCart(testUserId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.cart.userId).toBe(testUserId);
      expect(result.cart.products).toEqual([]);
    }

    const stored = await db.findOne({ userId: testUserId });
    expect(stored).toBeDefined();
  });
});

describe("addToCart", () => {
  it("adds a new product to an existing cart", async () => {
    await db.insertOne({ userId: testUserId, products: [] });

    const result = await addToCart(testUserId, testProductId, 2);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.cart.products).toHaveLength(1);
      expect(result.cart.products[0].productId).toBe(testProductId);
      expect(result.cart.products[0].quantity).toBe(2);
    }
  });

  it("creates a new cart and adds product when no cart exists", async () => {
    const result = await addToCart(testUserId, testProductId, 1);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.cart.products).toHaveLength(1);
      expect(result.cart.products[0].productId).toBe(testProductId);
      expect(result.cart.products[0].quantity).toBe(1);
    }
  });

  it("increments quantity when product already in cart", async () => {
    await db.insertOne({
      userId: testUserId,
      products: [
        { productId: testProductId, quantity: 1, addedAt: Date.now() },
      ],
    });

    const result = await addToCart(testUserId, testProductId, 3);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.cart.products).toHaveLength(1);
      expect(result.cart.products[0].quantity).toBe(4);
    }
  });

  it("defaults quantity to 1", async () => {
    const result = await addToCart(testUserId, testProductId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.cart.products[0].quantity).toBe(1);
    }
  });

  it("returns INVALID_DATA when quantity is zero", async () => {
    const result = await addToCart(testUserId, testProductId, 0);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe(ERROR_CODES.CART.INVALID_DATA);
    }
  });

  it("returns INVALID_DATA when quantity is negative", async () => {
    const result = await addToCart(testUserId, testProductId, -1);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe(ERROR_CODES.CART.INVALID_DATA);
    }
  });

  it("persists the updated cart to the database", async () => {
    await addToCart(testUserId, testProductId, 2);

    const stored = await db.findOne({ userId: testUserId });
    expect(stored).toBeDefined();
    expect(stored!.products[0].quantity).toBe(2);
  });
});

describe("removeFromCart", () => {
  it("decrements quantity when quantity is specified", async () => {
    await db.insertOne({
      userId: testUserId,
      products: [
        { productId: testProductId, quantity: 5, addedAt: Date.now() },
      ],
    });

    const result = await removeFromCart(testUserId, testProductId, 2);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.cart.products[0].quantity).toBe(3);
    }
  });

  it("removes item entirely when specified quantity equals current quantity", async () => {
    await db.insertOne({
      userId: testUserId,
      products: [
        { productId: testProductId, quantity: 3, addedAt: Date.now() },
      ],
    });

    const result = await removeFromCart(testUserId, testProductId, 3);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.cart.products).toHaveLength(0);
    }
  });

  it("removes item entirely when specified quantity exceeds current quantity", async () => {
    await db.insertOne({
      userId: testUserId,
      products: [
        { productId: testProductId, quantity: 2, addedAt: Date.now() },
      ],
    });

    const result = await removeFromCart(testUserId, testProductId, 10);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.cart.products).toHaveLength(0);
    }
  });

  it("removes item entirely when quantity is omitted", async () => {
    await db.insertOne({
      userId: testUserId,
      products: [
        { productId: testProductId, quantity: 4, addedAt: Date.now() },
      ],
    });

    const result = await removeFromCart(testUserId, testProductId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.cart.products).toHaveLength(0);
    }
  });

  it("returns NOT_FOUND when cart doesn't exist", async () => {
    const result = await removeFromCart(testUserId, testProductId);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe(ERROR_CODES.CART.NOT_FOUND);
    }
  });

  it("returns PRODUCT_NOT_FOUND when product is not in cart", async () => {
    await db.insertOne({ userId: testUserId, products: [] });

    const result = await removeFromCart(testUserId, testProductId);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe(ERROR_CODES.CART.PRODUCT_NOT_FOUND);
    }
  });
});

describe("clearCart", () => {
  it("empties the products array", async () => {
    await db.insertOne({
      userId: testUserId,
      products: [
        { productId: testProductId, quantity: 1, addedAt: Date.now() },
      ],
    });

    const result = await clearCart(testUserId);

    expect(result.ok).toBe(true);

    const stored = await db.findOne({ userId: testUserId });
    expect(stored!.products).toEqual([]);
  });

  it("returns NOT_FOUND when cart doesn't exist", async () => {
    const result = await clearCart(testUserId);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe(ERROR_CODES.CART.NOT_FOUND);
    }
  });
});
