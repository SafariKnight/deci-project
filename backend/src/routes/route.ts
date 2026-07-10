import express from "express";
import authRouter from "./auth.ts";
import imageRouter from "./image.ts";
import productRouter from "./product.ts";
const app = express();

app.use("/auth", authRouter);
app.use("/image", imageRouter);
app.use("/product", productRouter);

export default app;
