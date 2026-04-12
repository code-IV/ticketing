const { apiResponse } = require("../../utils/helpers");
const { PromotionsService } = require("../services/promotionsService");

const PromotionsController = {
  async create(req, res, next) {
    try {
      const { promotion } = req.body;
      const response = await PromotionsService.createPromotion(promotion);
      return apiResponse(
        res,
        201,
        true,
        "Successfully added new discount",
        response,
      );
    } catch (err) {
      console.log(err);
      next(err);
    }
  },
};

module.exports = { PromotionsController };
