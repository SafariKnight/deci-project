import path from "path";
import fs from "fs";
import multer from "multer";

export const storagePath = path.resolve(__dirname, "../../images");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(storagePath)) fs.mkdirSync(storagePath);
    cb(null, storagePath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now().toString() + ext);
  },
});
export const upload = multer({ storage }).single("image");
