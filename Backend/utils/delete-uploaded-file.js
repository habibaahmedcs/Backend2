const fs = require("fs").promises;
const path = require("path");

async function deleteUploadedFile(foldername, filename) {
  const filePath = path.join(
    __dirname,
    "..",
    "uploads",
    foldername,
    filename
  );

  try {
    await fs.unlink(filePath);
    console.log(`Successfully deleted old file: ${filename}`);
  } catch (err) {
    console.log("Error deleting file:", err.message);
  }
}

module.exports = deleteUploadedFile;