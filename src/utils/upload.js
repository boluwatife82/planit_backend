import multer from "multer";
import path from "path";

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/licenses"); // create this folder
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    if ([".jpg", ".jpeg", ".png", ".pdf"].includes(ext.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error("Only images or PDF files allowed"), false);
    }
  },
});

export default upload;
