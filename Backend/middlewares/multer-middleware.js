const multer = require("multer");
const fs = require("fs");
const path = require("path");

const UPLOAD_ROOT = path.join(__dirname, "..", "uploads");

const folderFor = (req, file) => {
  const field = (file?.fieldname || "").toLowerCase();
  const baseUrl = `${req.baseUrl || ""}${req.path || ""}`.toLowerCase();

  if (
    field.includes("avatar") ||
    baseUrl.includes("/users") ||
    baseUrl.includes("/auth")
  ) {
    return "users";
  }
  if (
    field.includes("health") ||
    field.includes("proof") ||
    field.includes("certificate")
  ) {
    return "proofs";
  }
  if (field.includes("gallery")) return "gallery";
  if (field.includes("menu")) return "menu";
  if (field.includes("thumb")) return "thumbnails";
  if (field.includes("cover")) return "covers";
  if (baseUrl.includes("restaurants")) return "restaurants";
  return "misc";
};

const diskStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dest = path.join(UPLOAD_ROOT, folderFor(req, file));
    try {
      fs.mkdirSync(dest, { recursive: true });
      cb(null, dest);
    } catch (err) {
      cb(err, null);
    }
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || `.${(file.mimetype.split("/")[1] || "jpg")}`;
    const prefix = folderFor(req, file).replace(/s$/, "") || "file";
    cb(null, `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const fileType = file.mimetype.split("/")[0];
  if (fileType === "image") {
    cb(null, true);
  } else {
    cb(new Error("Only images are allowed"), false);
  }
};

const upload = multer({
  storage: diskStorage,
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024 },
});

const menuImageFields = Array.from({ length: 40 }, (_, index) => ({
  name: `menuImage_${index}`,
  maxCount: 1,
}));

const listingFields = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "cover", maxCount: 1 },
  { name: "coverImage", maxCount: 1 },
  { name: "thumbnail", maxCount: 1 },
  { name: "healthCertificate", maxCount: 1 },
  { name: "proof", maxCount: 1 },
  { name: "gallery", maxCount: 20 },
  { name: "menuImages", maxCount: 40 },
  ...menuImageFields,
]);

const avatarFields = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "avatar", maxCount: 1 },
]);

module.exports = upload;
module.exports.listingFields = listingFields;
module.exports.avatarFields = avatarFields;
module.exports.UPLOAD_ROOT = UPLOAD_ROOT;
