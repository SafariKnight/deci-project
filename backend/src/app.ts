import express, { NextFunction, Response, Request } from "express";
import cookieParser from "cookie-parser";
import routes from './routes/route.js';
import multer from "multer";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { logger } from "#src/utils/logger.js";

const app = express();

app.use(helmet());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
}));

app.use((req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    logger.info({
      timestamp: new Date().toISOString(),
      level: "info",
      method: req.method,
      url: req.url,
      status: res.statusCode,
      durationMs: duration,
      userAgent: req.get("user-agent") || "",
      ip: req.ip || "",
    }, "request");
  });
  next();
});

app.use(express.json({}));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);

app.use("/", routes);

app.get("/health", (req, res) => {
  logger.info({
    timestamp: new Date().toISOString(),
    level: "info",
    method: req.method,
    url: req.url,
  }, "Health check");
  res.status(200).send({ status: "OK" });
});

app.use((req: Request, res: Response) => {
  logger.warn({
    timestamp: new Date().toISOString(),
    level: "warn",
    method: req.method,
    url: req.url,
  }, "Route not found");
  res.status(404).json({ error: "Not found" });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error({
    timestamp: new Date().toISOString(),
    level: "error",
    err: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  }, "Unhandled error");
  if (
    err instanceof SyntaxError &&
    "status" in err &&
    err.status === 400 &&
    "body" in err
  ) {
    return res
      .status(400)
      .send({ message: "Invalid JSON", error: err.message });
  }
  next(err);
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    logger.error({
      timestamp: new Date().toISOString(),
      level: "error",
      err: err.message,
      code: err.code,
      url: req.url,
      method: req.method,
    }, "File upload error");
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ error: "File is too large. Max size is 10MB." });
    }
    if (err.code === "MISSING_FIELD_NAME") {
      return res.status(400).json({
        error: "Missing field name. Please provide the required field.",
      });
    }
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error({
    timestamp: new Date().toISOString(),
    level: "error",
    err: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  }, "Unhandled error");
  res.status(500).json({ error: "Internal server error" });
});


export default app;
const shutdown = async () => {
  logger.info({ timestamp: new Date().toISOString(), level: "info" }, "Shutting down...");
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
