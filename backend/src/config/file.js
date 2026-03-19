const multer = require("multer");
const upload = multer({
  dest: "uploads/",
});
// ,
//   limits: {
//     fileSize: 5 * 1024 * 1024, // 5MB limit, adjust as needed
//     files: 1, // Limit number of files per request
//   },
module.exports = upload;
