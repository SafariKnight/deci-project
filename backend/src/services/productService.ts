import { mongo } from '#src/config/mongo.js';
import { Product } from "#src/types.js";
import { MongoError, ObjectId } from "mongodb";
import { getFileByFilename } from './fileService.js';
import { ERROR_CODES, Result } from '#src/utils/errorCodes.js';

const db = mongo.collection<Product>("products");

export async function createProduct(
  product: Omit<Product, "uploadedAt">,
): Promise<Result<{ id: ObjectId }>> {
  if (!product) {
    return { ok: false, error: ERROR_CODES.PRODUCT.INVALID_DATA };
  }

  try {
    const result = await db.insertOne({
      ...product,
      uploadedAt: Date.now(),
    });
    return { ok: true, id: result.insertedId };
  } catch (error) {
    if (error instanceof MongoError) {
      return { ok: false, error: ERROR_CODES.PRODUCT.DATABASE_ERROR };
    }
    return { ok: false, error: ERROR_CODES.FILE.UNKNOWN };
  }
}

export async function deleteProduct(
  id: ObjectId,
): Promise<Result<{ ok: true }>> {
  const result = await db.deleteOne({ _id: id });
  if (result.deletedCount === 0) {
    return {
      ok: false,
      error: ERROR_CODES.PRODUCT.DOCUMENT_NOT_FOUND,
    };
  }
  return { ok: true };
}

export async function getProductById(
  id: ObjectId,
): Promise<Result<{ product: Product }>> {
  const product = await db.findOne({ _id: new ObjectId(id) });
  if (!product) {
    return { ok: false, error: ERROR_CODES.PRODUCT.NOT_FOUND };
  }
  return { ok: true, product };
}

const PAGE_SIZE = 8;
export async function listProducts(page: number = 1, search?: string) {
  const skipCount = (page - 1) * PAGE_SIZE;
  const query = search ? { name: { $regex: search, $options: "i" } } : {};
  const cursor = db
    .find(query)
    .sort({ uploadedAt: -1 })
    .skip(skipCount)
    .limit(PAGE_SIZE);

  return await cursor.toArray();
}

export async function listUserProducts(page: number = 1, userId: number) {
  const skipCount = (page - 1) * PAGE_SIZE;
  const cursor = db
    .find({ owner: userId })
    .sort({ uploadedAt: -1 })
    .skip(skipCount)
    .limit(PAGE_SIZE);

  return await cursor.toArray();
}

export async function updateProduct(
  id: ObjectId,
  newDetails: Partial<Omit<Product, "uploadedAt" | "owner">>,
): Promise<Result<{ ok: true }>> {
  if (newDetails.imageFilename) {
    const result = await getFileByFilename(newDetails.imageFilename);
    if (!result.ok) {
      return { ok: false, error: ERROR_CODES.FILE.NOT_FOUND };
    }

    const file = result.metadata;
  }
  const result = await db.updateOne({ _id: id }, { $set: newDetails });
  if (result.matchedCount === 0) {
    return { ok: false, error: ERROR_CODES.PRODUCT.NOT_FOUND };
  }
  return { ok: true };
}
