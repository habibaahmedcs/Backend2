const path = require("path");

const toStoredPath = (fileOrPath) => {
  if (!fileOrPath) return "";
  const raw = typeof fileOrPath === "string" ? fileOrPath : fileOrPath.path;
  if (!raw) return "";
  const normalized = String(raw).replace(/\\/g, "/");
  const idx = normalized.toLowerCase().lastIndexOf("/uploads/");
  if (idx !== -1) {
    return normalized.slice(idx + 1);
  }
  if (normalized.startsWith("uploads/")) return normalized;
  return `uploads/${path.basename(normalized)}`;
};

const collectFiles = (req) => {
  const out = [];
  if (req.file) out.push(req.file);
  if (Array.isArray(req.files)) {
    out.push(...req.files);
  } else if (req.files && typeof req.files === "object") {
    Object.values(req.files).forEach((entry) => {
      if (Array.isArray(entry)) out.push(...entry);
      else if (entry) out.push(entry);
    });
  }
  return out;
};

const firstFilePath = (req, fieldNames) => {
  const files = collectFiles(req);
  const names = Array.isArray(fieldNames) ? fieldNames : [fieldNames];
  const match = files.find((file) => names.includes(file.fieldname));
  return match ? toStoredPath(match) : "";
};

const allFilePaths = (req, fieldName) =>
  collectFiles(req)
    .filter((file) => file.fieldname === fieldName)
    .map(toStoredPath);

const applyMenuImages = (menu, req) => {
  if (!Array.isArray(menu)) return menu;
  const files = collectFiles(req);
  const sequential = allFilePaths(req, "menuImages");
  let sequentialIndex = 0;

  return menu.map((item, index) => {
    const next = { ...(item || {}) };
    const named = files.find((file) => file.fieldname === `menuImage_${index}`);
    if (named) {
      next.imageUrl = toStoredPath(named);
      next.image = next.imageUrl;
    } else if (!next.imageUrl && sequential[sequentialIndex]) {
      next.imageUrl = sequential[sequentialIndex];
      next.image = next.imageUrl;
      sequentialIndex += 1;
    } else if (next.imageUrl && !next.image) {
      next.image = next.imageUrl;
    }
    return next;
  });
};

module.exports = {
  toStoredPath,
  collectFiles,
  firstFilePath,
  allFilePaths,
  applyMenuImages,
};
