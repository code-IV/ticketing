const express = require("express");
const router = express.Router();
const upload = require("../config/file");
const { isAuthenticated, isAdmin } = require("../middleware/auth");
const { uuidParamRule, handleValidation } = require("../middleware/validate");
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
router.get("/n", isAuthenticated, isAdmin, UploadsController.getByName);
router.get(
  "/:id",
  isAuthenticated,
  isAdmin,
  uuidParamRule("id"),
  handleValidation,
  UploadsController.getById,
);

module.exports = router;
