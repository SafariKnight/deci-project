import "./config/index.ts"
import app from "./app.ts";

let PORT: number;

if (!process.env.PORT) {
  console.log('Missing "PORT" environment variable, defaulting to 3000')
  PORT = 3000
} else {
  PORT = parseInt(process.env.PORT)
}

if (isNaN(PORT)) {
  console.log('"PORT" environment variable should be a number, defaulting to 3000')
  PORT = 3000
}

console.log(process.env.DATABASE_URL)

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`)
})
