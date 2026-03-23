const express = require("express");
const router = express.Router();
const upload = require("../config/file");
const { isAuthenticated, isAdmin } = require("../middleware/auth");
const { stringParamRule, handleValidation } = require("../middleware/validate");
const { UploadsController } = require("../api/controllers/uploadsController");

router.post(
  "/uploads/:productId",
  isAuthenticated,
  isAdmin,
  upload.array("mediaFiles"),
  UploadsController.uploadProductMedia,
);

router.get("/", isAuthenticated, isAdmin, UploadsController.getAll);
router.get("/t", isAuthenticated, isAdmin, UploadsController.getByType);
router.get(
  "/:name",
  isAuthenticated,
  isAdmin,
  stringParamRule("name"),
  handleValidation,
  UploadsController.getByName,
);

module.exports = router;
