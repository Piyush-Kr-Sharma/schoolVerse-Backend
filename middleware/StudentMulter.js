const multer = require("multer");
const { cloudinary, CloudinaryStorage } = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "uploads/students",
    resource_type: "auto",
    public_id: (req, file) => `${Date.now()}-${file.originalname}`,
  },
});

const uploadStudent = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only PDFs, JPEGs, and PNGs are allowed."));
    }
    cb(null, true);
  },
});

module.exports = uploadStudent;
