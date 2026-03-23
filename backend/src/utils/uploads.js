exports.uploadToLocal = async (file) => {
  // Multer has already saved the file to /public/uploads/UUID.ext
  if (!file.filename) {
    throw new Error(
      "File was not saved to disk. Check Multer storage configuration.",
    );
  }
  return {
    name: file.originalname,
    url: `/uploads/${file.filename}`, // file.filename is now the UUID
    type: file.mimetype,
    provider: "LOCAL",
  };
};
