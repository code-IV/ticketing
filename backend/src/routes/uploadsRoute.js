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
  uuidParamRule("productId"),
  handleValidation,
  upload.fields([
    { name: "mediaFiles", maxCount: 10 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  (req, res, next) => {
    if (req.body.label) {
      req.body.label = Array.isArray(req.body.label)
        ? req.body.label
        : [req.body.label];
    } else {
      req.body.label = [];
    }
    next();
  },
  //
  UploadsController.uploadProductMedia,
);
router.delete(
  "/rm/:id",
  isAuthenticated,
  isAdmin,
  uuidParamRule("id"),
  handleValidation,
  UploadsController.deleteMediaById,
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
