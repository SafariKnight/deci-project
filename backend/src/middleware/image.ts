import multer from "multer";

const MEGABYTE = 1024 * 1024;

export const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * MEGABYTE } }).single("image");
