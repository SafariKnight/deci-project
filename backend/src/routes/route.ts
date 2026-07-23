import express from "express";
import authRouter from './auth.js';
import imageRouter from './image.js';
import productRouter from './product.js';
import reviewRouter from './review.js';
import cartRouter from './cart.js';
const app = express();

const apiRouter = express.Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/image", imageRouter);
apiRouter.use("/product", productRouter);
apiRouter.use("/review", reviewRouter);
apiRouter.use("/cart", cartRouter);

app.use("/api", apiRouter);
app.use("/", apiRouter);

export default app;
