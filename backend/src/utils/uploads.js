const fs = require("fs").promises;
const path = require("path");
const { v4: uuidv4 } = require("uuid");

/**
 * Handles moving the file Multer already saved
 * @param {Object} file - The file object from multer (disk storage)
 * @returns {Promise<Object>} - Metadata for DB insertion
 */
exports.uploadToLocal = async (file) => {
  // 1. Define where you want the final file to live
  // Note: Multer's { dest: "uploads/" } saves to a root /uploads folder
  const finalDir = path.join(__dirname, "../../public/uploads");

  // 2. Ensure your final directory exists
  await fs.mkdir(finalDir, { recursive: true });

  // 3. Generate the new unique filename
  const fileExtension = path.extname(file.originalname);
  const fileName = `${uuidv4()}${fileExtension}`;
  const finalPath = path.join(finalDir, fileName);

  // 4. Move the file from Multer's temp path to your final path
  // file.path is the temporary path created by Multer
  await fs.rename(file.path, finalPath);

  return {
    name: file.originalname,
    url: `/uploads/${fileName}`,
    type: file.mimetype,
    provider: "LOCAL",
  };
};
