import {
  createProduct,
  deleteProduct as deleteProductById,
  getProductById,
  listProducts,
  listUserProducts,
  updateProduct,
} from '#src/services/productService.js';
import { Product } from "#src/types.js";
import {
  isNonEmpty,
  isNum,
  isPositive,
  isString,
  Schema,
  validate,
} from '#src/utils/validation.js';
import { RequestHandler } from "express";
import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { ERROR_CODES } from '#src/utils/errorCodes.js';

type uploadRequest = {
  imageFilename: string;
  productName: string;
  price: number;
  details: Record<string, string | number>;
};

const uploadSchema: Schema<uploadRequest> = {
  imageFilename: [isString, isNonEmpty],
  productName: [isString, isNonEmpty],
  price: [isNum, isPositive],
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
  const productIdResult = await createProduct({
    name: body.productName,
    imageFilename: body.imageFilename,
    price: body.price,
    description: req.body.description || "",
    owner: user.id,
    details: body.details,
  });

  if (!productIdResult.ok) {
    return res.status(500).json({
      message: "Failed to create product",
      error: productIdResult.error,
    });
  }

  return res.status(201).json({
    id: productIdResult.id,
  });
};

export const deleteRoute = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  const id = req.params.id;
  const user = req.user;
  const productResult = await getProductById(new ObjectId(id));

  if (!productResult.ok) {
    return res.status(404).json({
      message: "Product Not Found",
      error: productResult.error,
    });
  }

  const product = productResult.product;

  if (
    user.id !== product.owner &&
    user.role !== "ADMIN" &&
    user.role !== "OWNER"
  ) {
    return res.status(403).json({
      message: "Not Authorized to delete this product",
      error: ERROR_CODES.USER.FORBIDDEN,
    });
  }

  const deleteResult = await deleteProductById(new ObjectId(id));

  if (!deleteResult.ok) {
    return res.status(404).json({
      message: "Product not found",
      error: deleteResult.error,
    });
  }

  return res.status(204).send();
};

function mapProduct(p: any) {
  const { _id, ...rest } = p;
  return { id: _id.toString(), ...rest };
}

export const getRoute = async (req: Request<{ id: string }>, res: Response) => {
  const id = req.params.id;
  const productResult = await getProductById(new ObjectId(id));
  if (!productResult.ok) {
    return res.status(404).json({
      message: "Product Not Found",
      error: productResult.error,
    });
  }
  res.status(200).json(mapProduct(productResult.product));
};

export const listRoute: RequestHandler = async (req, res) => {
  let page = parseInt(req.query.page?.toString() as any);

  if (isNaN(page)) {
    page = 1;
  }

  const search = req.query.search?.toString();

  const products = await listProducts(page, search);

  res.status(200).json({ products: products.map(mapProduct) });
};

export const listUserRoute = async (
  req: Request<{ id: number }>,
  res: Response,
) => {
  let page = parseInt(req.query.page?.toString() as any);
  const user = parseInt(req.params.id.toString());

  if (isNaN(page)) {
    page = 1;
  }

  if (isNaN(user)) {
    return res.status(422).json({
      message: "Invalid user id",
      error: "invalid_id",
    });
  }

  const products = await listUserProducts(page, user);

  res.status(200).json({ products: products.map(mapProduct) });
};

export const updateRoute = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  const id = req.params.id;
  const user = req.user;
  const productResult = await getProductById(new ObjectId(id));
  if (!productResult.ok) {
    return res.status(404).json({
      message: "Product Not Found",
      error: productResult.error,
    });
  }

  const product = productResult.product;

  if (
    product.owner !== user.id &&
    user.role !== "ADMIN" &&
    user.role !== "OWNER"
  ) {
    return res.status(403).json({
      message: "Not Authorized",
      error: ERROR_CODES.USER.FORBIDDEN,
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

  if (body.description) {
    if (typeof body.description !== "string") {
      messages.push('["description"]: must be a string');
    } else if (body.description.trim() === "") {
      messages.push('["description"]: must be non-empty');
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
  if (body.description) newDetails.description = body.description;
  if (body.details) newDetails.details = body.details;
  if (body.price) newDetails.price = body.price;

  const updateResult = await updateProduct(new ObjectId(id), newDetails);
  if (!updateResult.ok) {
    return res.status(404).json({
      message: "Product not found",
      error: updateResult.error,
    });
  }
  res.status(204).send();
};
