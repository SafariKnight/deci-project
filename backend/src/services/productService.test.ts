import "#src/config/index.ts";
import { mongo } from '#src/config/mongo.js';
import { ObjectId } from "mongodb";
import {
  createProduct,
  deleteProduct,
  getProductById,
  listProducts,
  listUserProducts,
  updateProduct,
} from './productService.js';
import { ERROR_CODES } from '#src/utils/errorCodes.js';
import { Product } from "#src/types.js";

const db = mongo.collection<Product>("products");
const filesDb = mongo.collection("files");

const sampleProduct: Omit<Product, "uploadedAt"> = {
  name: "Test Product",
  price: 29.99,
  description: "A product for testing",
  owner: 1,
  details: { color: "red", size: "M" },
  imageFilename: "",
};

beforeEach(async () => {
  await db.drop({});
  await filesDb.drop({});
});

describe("createProduct", () => {
  it("creates a product and returns an ObjectId", async () => {
    const result = await createProduct(sampleProduct);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.id).toBeInstanceOf(ObjectId);
    }
  });

  it("stores the product in the database", async () => {
    const result = await createProduct(sampleProduct);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const stored = await db.findOne({ _id: result.id });
    expect(stored).toBeDefined();
    expect(stored!.name).toBe("Test Product");
    expect(stored!.price).toBe(29.99);
    expect(stored!.uploadedAt).toBeDefined();
    expect(typeof stored!.uploadedAt).toBe("number");
  });

  it("returns INVALID_DATA when product is null", async () => {
    const result = await createProduct(null as any);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe(ERROR_CODES.PRODUCT.INVALID_DATA);
    }
  });
});

describe("getProductById", () => {
  it("returns a product when found", async () => {
    const createResult = await createProduct(sampleProduct);
    expect(createResult.ok).toBe(true);
    if (!createResult.ok) return;

    const result = await getProductById(createResult.id);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.product.name).toBe("Test Product");
    }
  });

  it("returns NOT_FOUND when product doesn't exist", async () => {
    const result = await getProductById(new ObjectId());

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe(ERROR_CODES.PRODUCT.NOT_FOUND);
    }
  });
});

describe("deleteProduct", () => {
  it("deletes an existing product", async () => {
    const createResult = await createProduct(sampleProduct);
    expect(createResult.ok).toBe(true);
    if (!createResult.ok) return;

    const result = await deleteProduct(createResult.id);

    expect(result.ok).toBe(true);

    const stored = await db.findOne({ _id: createResult.id });
    expect(stored).toBeNull();
  });

  it("returns DOCUMENT_NOT_FOUND when product doesn't exist", async () => {
    const result = await deleteProduct(new ObjectId());

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe(ERROR_CODES.PRODUCT.DOCUMENT_NOT_FOUND);
    }
  });
});

describe("listProducts", () => {
  it("returns an empty array when no products exist", async () => {
    const products = await listProducts(1);

    expect(products).toEqual([]);
  });

  it("returns paginated products sorted by newest first", async () => {
    const product1 = await createProduct({ ...sampleProduct, name: "First" });
    const product2 = await createProduct({ ...sampleProduct, name: "Second" });
    expect(product1.ok && product2.ok).toBe(true);

    const products = await listProducts(1);
    expect(products).toHaveLength(2);
    expect(products[0].name).toBe("Second");
    expect(products[1].name).toBe("First");
  });

  it("respects the page parameter", async () => {
    for (let i = 0; i < 10; i++) {
      await createProduct({ ...sampleProduct, name: `Product ${i}` });
    }

    const page1 = await listProducts(1);
    const page2 = await listProducts(2);

    expect(page1).toHaveLength(8);
    expect(page2).toHaveLength(2);
  });

  it("filters products by search term (case-insensitive)", async () => {
    await createProduct({ ...sampleProduct, name: "Red Chair" });
    await createProduct({ ...sampleProduct, name: "Blue Table" });
    await createProduct({ ...sampleProduct, name: "Red Lamp" });

    const results = await listProducts(1, "red");

    expect(results).toHaveLength(2);
    expect(results.every((p) => p.name.toLowerCase().includes("red"))).toBe(
      true,
    );
  });

  it("returns empty array when search matches nothing", async () => {
    await createProduct({ ...sampleProduct, name: "Chair" });

    const results = await listProducts(1, "NonExistent");

    expect(results).toHaveLength(0);
  });
});

describe("listUserProducts", () => {
  it("returns only products owned by the given user", async () => {
    await createProduct({ ...sampleProduct, name: "User 1 Product", owner: 1 });
    await createProduct({ ...sampleProduct, name: "User 2 Product", owner: 2 });
    await createProduct({ ...sampleProduct, name: "User 1 Another", owner: 1 });

    const products = await listUserProducts(1, 1);

    expect(products).toHaveLength(2);
    expect(products.every((p) => p.owner === 1)).toBe(true);
  });

  it("returns empty array for user with no products", async () => {
    await createProduct({ ...sampleProduct, name: "Some Product", owner: 1 });

    const products = await listUserProducts(1, 99);

    expect(products).toHaveLength(0);
  });
});

describe("updateProduct", () => {
  it("updates product fields", async () => {
    const createResult = await createProduct(sampleProduct);
    expect(createResult.ok).toBe(true);
    if (!createResult.ok) return;

    const result = await updateProduct(createResult.id, {
      name: "Updated Name",
      price: 49.99,
    });

    expect(result.ok).toBe(true);

    const stored = await db.findOne({ _id: createResult.id });
    expect(stored!.name).toBe("Updated Name");
    expect(stored!.price).toBe(49.99);
  });

  it("returns NOT_FOUND when product doesn't exist", async () => {
    const result = await updateProduct(new ObjectId(), { name: "New Name" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe(ERROR_CODES.PRODUCT.NOT_FOUND);
    }
  });

  it("returns FILE.NOT_FOUND when imageFilename references a non-existent file", async () => {
    const createResult = await createProduct(sampleProduct);
    expect(createResult.ok).toBe(true);
    if (!createResult.ok) return;

    const result = await updateProduct(createResult.id, {
      imageFilename: "non_existent_image.png",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe(ERROR_CODES.FILE.NOT_FOUND);
    }
  });
});
