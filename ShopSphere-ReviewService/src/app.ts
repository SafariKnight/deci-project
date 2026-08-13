import express from "express";
import cors from "cors";
import helmet from "helmet";
import reviewRouter from "./routes/reviews.js";

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));
app.use(express.json({}));
app.use(express.urlencoded({ extended: true }));

app.use("/reviews", reviewRouter);

app.get("/health", (req, res) => {
  res.status(200).send({ status: "OK" });
});

export default app;

const shutdown = async () => {
  console.log("Shutting down...");
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
