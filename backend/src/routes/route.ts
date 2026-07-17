import express from "express";
import authRouter from './auth.js';
import imageRouter from './image.js';
import productRouter from './product.js';
import reviewRouter from './review.js';
import cartRouter from './cart.js';
const app = express();

app.use("/auth", authRouter);
app.use("/image", imageRouter);
app.use("/product", productRouter);
app.use("/review", reviewRouter);
app.use("/cart", cartRouter);

export default app;
