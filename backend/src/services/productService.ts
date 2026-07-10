import { mongo } from "#/config/mongo.ts";
import { Product } from "#/types.js";
import { MongoError, MongoServerError, ObjectId } from "mongodb";

const db = mongo.collection<Product>("products")

export async function createProduct(product: Omit<Product, "uploadedAt">) {
  if (!product) {
    throw new Error("Product cannot be null or undefined");
  }

  try {
    const result = await db.insertOne({
      ...product,
      uploadedAt: Date.now()
    });
    return result.insertedId;
  } catch (error) {
    if (error instanceof MongoServerError) {
      if (error.code === 11000) {
        throw new Error(`Duplicate key error: ${JSON.stringify(error.keyPattern)}`);
      }
      if (error.code === 121) {
        throw new Error(`Document validation failed: ${error.errmsg}`);
      }
    }
    if (error instanceof MongoError) {
      throw new Error(`Database operation failed: ${error.message}`);
    }
    throw error;
  }
}

export async function deleteProduct(id: ObjectId) {
  const result = await db.deleteOne({ _id: id })
  if (result.deletedCount === 0) {
    return "document_not_found" as const
  }
}

export async function getProductById(id: ObjectId) {
  return await db.findOne({ _id: new ObjectId(id) })

}

const PAGE_SIZE = 15;
export async function listProducts(page: number = 1) {
  const skipCount = (page - 1) * PAGE_SIZE;
  const cursor = db.find({}).sort({ uploadedAt: -1 }).skip(skipCount).limit(PAGE_SIZE);

  return await cursor.toArray();
}

export async function updateProduct(id: ObjectId, newDetails: Partial<Product>) {
  const result = await db.updateOne({_id: id}, newDetails)
  if (result.matchedCount === 0) {
    return "product_not_found" as const
  }
}
