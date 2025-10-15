import multer from "multer";
import fs from "fs";
import path from "path";

// Helper to ensure folder exists
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

/* ===== Banner Upload ===== */
const bannerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./uploads/bannerImages";
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

export const uploadBanner = multer({
  storage: bannerStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files allowed!"), false);
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

/* ===== Employee Documents Upload ===== */
const employeeDocStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./uploads/employeeDocs";
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

export const uploadEmployeeDocs = multer({
  storage: employeeDocStorage,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype === "application/pdf"
    )
      cb(null, true);
    else cb(new Error("Only images or PDFs allowed!"), false);
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});
  