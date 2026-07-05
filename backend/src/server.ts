import "dotenv/config"
import app from "./app.ts"

const PORT = process.env.PORT!

app.listen(PORT)

console.log(`Listening on port ${PORT}`)
