const { apiResponse } = require("../../utils/helpers");
const UploadsService = require("../services/uploadsService");

const UploadsController = {
  async uploadProductMedia(req, res, next) {
    try {
      const { productId } = req.params; // We link media to the Product
      if (!productId) {
        return apiResponse(res, 400, false, "Product ID is required.");
      }
      const { label } = req.body; // This is an array of strings

      // req.files is now an object with keys 'mediaFiles' and 'thumbnail'
      const files = req.files?.mediaFiles || [];
      const thumbs = req.files?.thumbnail || [];

      if (files.length === 0) {
        return apiResponse(res, 400, false, "No files uploaded.");
      }

      const media = files.map((file, index) => ({
        file: file,
        thumb: thumbs[index] || null, // Pairs 1st thumb with 1st file
        label: label[index],
      }));

      const mediaResults = await UploadsService.addMediaToProduct(
        productId,
        media,
      );

      return apiResponse(
        res,
        200,
        true,
        "Media uploaded successfully.",
        mediaResults,
      );
    } catch (err) {
      console.log(err);
      next(err);
    }
  },

  async deleteMediaById(req, res, next) {
    try {
      const id = req.params.id;
      const result = await UploadsService.deleteMediaFromProduct(id);

      return apiResponse(res, 200, true, "Media removed.", result);
    } catch (err) {
      next(err);
    }
  },

  async getAll(req, res, next) {
    try {
      const result = await UploadsService.getAll();

      return apiResponse(res, 200, true, "Media retrieved.", result);
    } catch (err) {
      next(err);
    }
  },
  async getById(req, res, next) {
    try {
      const id = req.params.id;
      if (!id) {
        return apiResponse(
          res,
          400,
          false,
          "id missing from request param (id)",
          {
            valid: false,
            reason: "MISSING_PARAMS",
          },
        );
      }
      const result = await UploadsService.getById(id);

      if (!result) {
        return apiResponse(res, 404, false, "Media not found.");
      }

      return apiResponse(res, 200, true, "Media retrieved.", result);
    } catch (err) {
      next(err);
    }
  },

  async getByName(req, res, next) {
    try {
      const { name } = req.query;
      if (!name) {
        return apiResponse(
          res,
          400,
          false,
          "name missing from request query (name)",
          {
            valid: false,
            reason: "MISSING_QUERY",
          },
        );
      }
      const result = await UploadsService.getByName(name);

      if (!result) {
        return apiResponse(res, 404, false, "Media not found.");
      }

      return apiResponse(res, 200, true, "Media retrieved.", result);
    } catch (err) {
      next(err);
    }
  },
  async getByType(req, res, next) {
    try {
      const { type } = req.query;
      if (type !== "image" && type !== "video") {
        return apiResponse(res, 400, false, "invalid query", {
          valid: false,
          reason: "INVALID_QUERY",
        });
      }
      const result = await UploadsService.getByType(type);
      return apiResponse(res, 200, true, "Media retrieved", result);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = { UploadsController };
