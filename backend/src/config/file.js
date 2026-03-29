const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");

// Updated to point to the temporary directory
const UPLOAD_DIR = path.join(process.cwd(), "public/tmp/uploads");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // This will create /public/tmp/uploads if it doesn't exist
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const fileExtension = path.extname(file.originalname);
    cb(null, `${uuidv4()}${fileExtension}`);
  },
});

const upload = multer({ storage: storage });

// const tmpDir = path.join(__dirname, "../public/tmp/uploads/");
// fs.readdir(tmpDir, (err, files) => {
//   files.forEach((f) => {
//     const filePath = path.join(tmpDir, f);
//     fs.stat(filePath, (err, stats) => {
//       if (Date.now() - stats.mtimeMs > 24 * 60 * 60 * 1000) {
//         // older than 24h
//         fs.unlink(filePath, () => {});
//       }
//     });
//   });
// });

module.exports = upload;
