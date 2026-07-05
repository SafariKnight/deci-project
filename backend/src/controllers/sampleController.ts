import { Request, Response, NextFunction } from "express";

export function sample(_req: Request, res: Response, _next: NextFunction) {
  res.status(200).send({ status: "OK" })
}
