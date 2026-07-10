import {
  createProduct,
  deleteProduct as deleteProductById,
  getProductById,
  listProducts,
  updateProduct,
} from "#/services/productService.ts";
import { Product } from "#/types.js";
import { isNonEmpty, isNum, isString, Schema, validate } from "#/utils/validation.ts";
import { RequestHandler } from "express";
import { Request, Response } from "express";
import { ObjectId } from "mongodb";

type uploadRequest = {
  imageFilename: string;
  productName: string;
  price: number;
  details: Record<string, string | number>;
};

const uploadSchema: Schema<uploadRequest> = {
  imageFilename: [isString, isNonEmpty],
  productName: [isString, isNonEmpty],
  price: [isNum],
  details: {},
};

export const uploadRoute: RequestHandler = async (req, res) => {
  const result = validate(req.body, uploadSchema);
  if (!result.ok) {
    return res.status(422).json({
      errors: result.errors,
    });
  }
  const body = result.value;
  const user = req.user;
  const productId = await createProduct({
    name: body.productName,
    imageFilename: body.imageFilename,
    price: body.price,
    owner: user.id,
    details: body.details,
  });

  return res.status(201).json({
    id: productId,
  });
};

export const deleteRoute = async (req: Request<{ id: string }>, res: Response) => {
  const id = req.params.id;
  const user = req.user;
  const product = await getProductById(new ObjectId(id));

  if (!product) {
    return res.status(404).json({
      message: "Product Not Found",
      error: "missing_product",
    });
  }

  if (user.id !== product.owner && user.role !== "ADMIN" && user.role !== "OWNER") {
    return res.status(403).json({
      message: "Not Authorized to delete this product",
      error: "not_authorized",
    });
  }

  const deleteResult = await deleteProductById(new ObjectId(id));

  if (deleteResult) {
    return res.status(403).json({
      message: "Product not found",
      error: deleteResult,
    });
  }

  return res.status(204).send();
};

export const getRoute = async (req: Request<{ id: string }>, res: Response) => {
  const id = req.params.id;
  const product = await getProductById(new ObjectId(id));
  if (!product) {
    return res.status(404).json({
      message: "Product Not Found",
      error: "missing_product",
    });
  }
  res.status(200).json(product);
};

export const listRoute: RequestHandler = async (req, res) => {
  let page = parseInt(req.query.page?.toString() as any);

  if (isNaN(page)) {
    page = 1;
  }
  const products = await listProducts(page);

  res.status(200).json({ products });
};

export const updateRoute = async (req: Request<{ id: string }>, res: Response) => {
  const id = req.params.id;
  const user = req.user;
  const product = await getProductById(new ObjectId(id));
  if (!product) {
    return res.status(404).json({
      message: "Product Not Found",
      error: "missing_product",
    });
  }

  if (product.owner !== user.id && user.role !== "ADMIN" && user.role !== "OWNER") {
    return res.status(403).json({
      message: "Not Authorized",
      error: "not_authorized",
    });
  }

  const body = req.body;

  let newDetails: Partial<Omit<Product, "uploadedAt" | "owner">> = {};

  let messages: string[] = [];

  if (body.productName) {
    if (typeof body.productName !== "string") {
      messages.push('["name"]: must be a string');
    } else if (body.productName.trim() === "") {
      messages.push('["name"]: must be non-empty');
    }
  }

  if (body.price) {
    if (typeof body.price !== "number") {
      messages.push('["price"]: must be a positive number');
    } else if (body.price <= 0) {
      messages.push('["price"]: must be a positive number');
    }
  }

  if (body.imageFilename) {
    if (typeof body.imageFilename !== "string") {
      messages.push('["imageFilename"]: must be a string');
    } else if (body.imageFilename.trim() === "") {
      messages.push('["imageFilename"]: must be non-empty');
    }
  }

  if (body.details) {
    if (typeof body.details !== "object") {
      messages.push('["details"]: must be an object');
    }
  }

  if (messages.length !== 0) {
    return res.status(422).json({
      errors: messages,
    });
  }

  if (body.productName) newDetails.name = body.productName;
  if (body.imageFilename) newDetails.imageFilename = body.imageFilename;
  if (body.details) newDetails.details = body.details;
  if (body.price) newDetails.price = body.price;

  await updateProduct(new ObjectId(id), newDetails);
  res.status(204).send();
};
