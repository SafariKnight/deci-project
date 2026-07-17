import "./config/index.js";
import app from './app.js';

let PORT: number;

if (!process.env.PORT) {
  console.log('Missing "PORT" environment variable, defaulting to 3000');
  PORT = 3000;
} else {
  PORT = parseInt(process.env.PORT);
}

if (isNaN(PORT)) {
  console.log('"PORT" environment variable should be a number, defaulting to 3000');
  PORT = 3000;
}

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
