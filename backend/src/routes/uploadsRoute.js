const express = require("express");
const router = express.Router();
const upload = require("../config/file");
const { isAuthenticated, isAdmin } = require("../middleware/auth");
const { uuidParamRule, handleValidation } = require("../middleware/validate");
const { UploadsController } = require("../api/controllers/uploadsController");

router.post(
  "/upload",
  isAuthenticated,
  isAdmin,
  upload.fields([
    { name: "mediaFiles", maxCount: 10 },
    { name: "thumbnail_0", maxCount: 1 },
    { name: "thumbnail_1", maxCount: 1 },
    { name: "thumbnail_2", maxCount: 1 },
    { name: "thumbnail_3", maxCount: 1 },
    { name: "thumbnail_4", maxCount: 1 },
    { name: "thumbnail_5", maxCount: 1 },
    { name: "thumbnail_6", maxCount: 1 },
    { name: "thumbnail_7", maxCount: 1 },
    { name: "thumbnail_8", maxCount: 1 },
    { name: "thumbnail_9", maxCount: 1 },
    { name: "thumbnail", maxCount: 10 }, // TEMP: Accept old field name
  ]),
  (req, res, next) => {
    console.log("🔍 Received fields:", Object.keys(req.body));
    console.log("🔍 Received files:", Object.keys(req.files || {}));
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

router.patch(
  "/upload/:id",
  isAuthenticated,
  isAdmin,
  uuidParamRule("id"),
  handleValidation,
  upload.fields([{ name: "thumbnail", maxCount: 1 }]),
  UploadsController.updateMedia,
);

router.post(
  "/persist/:id",
  isAuthenticated,
  isAdmin,
  uuidParamRule("id"),
  handleValidation,
  UploadsController.persistMediaUpload,
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
router.patch(
  "/:id",
  isAuthenticated,
  isAdmin,
  uuidParamRule("id"),
  handleValidation,
  UploadsController.updateMedia,
);

module.exports = router;
