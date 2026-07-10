import path from "path";
import multer from "multer";

export const storagePath = path.resolve(__dirname, "../../images");
const MEGABYTE = 1024 * 1024;

const storage = multer.diskStorage({
  destination: storagePath,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now().toString() + ext);
  },
});
export const upload = multer({ storage, limits: { fileSize: 10 * MEGABYTE } }).single("image");
