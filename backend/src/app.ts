import express, { NextFunction, Response, Request } from "express"
import cookieParser from "cookie-parser"
import routes from "./routes/route.ts"
import { fileURLToPath } from "url";
import path from "path";

const app = express()

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json({}));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
   if (err instanceof SyntaxError && 'status' in err && err.status === 400 && 'body' in err) {
       console.error(err);
       return res.status(400).send({ error: err.message })
   }
   next();
});

app.use("/image/by-name", express.static(path.resolve(__dirname, "../images")))

app.use("/", routes)

app.get("/health", (req, res) => {
  res.status(200).send({ status: "OK"})
})

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.path}`)
  next()
})

export default app
const shutdown = async () => {
  console.log(`Shutting down...`)
}

process.on("SIGTERM", shutdown)
process.on("SIGINT", shutdown)
