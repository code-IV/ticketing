const express = require("express");
const router = express.Router();
const {
  PromotionsController,
} = require("../api/controllers/promotionsController");
const { isAuthenticated, isAdmin } = require("../middleware/auth");

router.post("/", isAuthenticated, isAdmin, PromotionsController.create);

module.exports = router;
