const express = require("express");
const router = express.Router();
const upload = require("../config/file");
const { isAuthenticated, isAdmin } = require("../middleware/auth");
const { UploadsController } = require("../api/controllers/uploadsController");

router.post(
  "/uploads/:productId",
  isAuthenticated,
  isAdmin,
  upload.array("mediaFiles"),
  UploadsController.uploadProductMedia,
);

router.get("/", isAuthenticated, isAdmin, UploadsController.getAll);
module.exports = router;
