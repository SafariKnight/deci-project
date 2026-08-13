import "./config/index.js";
import app from "./app.js";

export const config = {
  api: {
    bodyParser: true,
    duration: 30,
  },
};

let PORT: number;

if (!process.env.PORT) {
  console.log("Missing PORT environment variable, defaulting to 3000");
  PORT = 3000;
} else {
  PORT = parseInt(process.env.PORT);
}

if (isNaN(PORT)) {
  console.log('"PORT" environment variable should be a number, defaulting to 3000');
  PORT = 3000;
}

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
  });
}
