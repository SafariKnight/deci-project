import type { Request, Response } from "express";
import app from "./app.js";

export default async function handler(req: Request, res: Response) {
  app(req, res);
}
