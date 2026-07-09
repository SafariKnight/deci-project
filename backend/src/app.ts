import express, { NextFunction, Response, Request } from "express"
import cookieParser from "cookie-parser"
import routes from "./routes/route.ts"
import { protectedRoute } from "./middleware/auth.ts";

const app = express()

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

app.use("/", routes)

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.path}`)
  next()
})

app.get("/health", (req, res) => {
  res.status(200).send({ status: "OK"})
})

app.use("/protected", protectedRoute)

app.get("/protected", (req, res) => {
  res.send(req.user)
})

export default app
const shutdown = async () => {
  console.log(`Shutting down...`)
}

process.on("SIGTERM", shutdown)
process.on("SIGINT", shutdown)
