import express, { NextFunction, Response, Request } from "express";
import cookieParser from "cookie-parser";
import routes from "./routes/route.ts";
import { fileURLToPath } from "url";
import path from "path";
import multer from "multer";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json({}));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/", routes);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof SyntaxError && "status" in err && err.status === 400 && "body" in err) {
    return res.status(400).send({ message: "Invalid JSON", error: err.message });
  }
  next(err);
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File is too large. Max size is 10MB.' });
    }
    if (err.code === 'MISSING_FIELD_NAME') {
      return res.status(400).json({ error: 'Missing field name. Please provide the required field.' });
    }
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

app.use("/image/by-name", express.static(path.resolve(__dirname, "../images")));

app.get("/health", (req, res) => {
  res.status(200).send({ status: "OK" });
});

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

export default app;
const shutdown = async () => {
  console.log(`Shutting down...`);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
