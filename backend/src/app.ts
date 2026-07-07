import express from "express"
import routes from "./routes/route.ts"

const app = express()

app.use("/", routes)

app.get("/health", (req, res) => {
  res.status(200).send({ status: "OK"})
})

export default app
