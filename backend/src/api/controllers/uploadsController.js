const { apiResponse } = require("../../utils/helpers");
const UploadsService = require("../services/uploadsService");

const UploadsController = {
  async uploadProductMedia(req, res, next) {
    try {
      const { label } = req.body; // This is an array of strings

      // req.files is now an object with keys 'mediaFiles' and thumbnail_0, thumbnail_1, etc.
      const files = req.files?.mediaFiles || [];

      if (files.length === 0) {
        return apiResponse(res, 400, false, "No files uploaded.");
      }

      const media = files.map((file, index) => {
        const thumb = req.files[`thumbnail_${index}`]?.[0] || null;
        return {
          file: file,
          thumb: thumb,
          label: label[index],
        };
      });

      const mediaResults = await UploadsService.addMediaToTemp(media);

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

  async updateMedia(req, res, next) {
    try {
      const id = req.params.id;
      const { label } = req.body;
      const thumb = req.files?.thumbnail || null;

      const updateResults = await UploadsService.updateMediaData(
        { id, label },
        thumb,
      );
      return apiResponse(
        res,
        200,
        true,
        "Media updated successfully.",
        updateResults,
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
      const { page = 1, limit = 32, type } = req.query;
      const result = await UploadsService.getAll(
        parseInt(page) || 1,
        parseInt(limit) || 32,
        type,
      );

      // Combine them into one object so apiResponse sends everything
      const responsePayload = {
        media: result.data,
        pagination: result.pagination,
      };

      return apiResponse(res, 200, true, "Media retrieved.", responsePayload);
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
      const { type, page = 1, limit = 32 } = req.query;
      if (type !== "image" && type !== "video") {
        return apiResponse(res, 400, false, "invalid query", {
          valid: false,
          reason: "INVALID_QUERY",
        });
      }
      const result = await UploadsService.getByType(
        type,
        parseInt(page) || 1,
        parseInt(limit) || 32,
      );
      return apiResponse(
        res,
        200,
        true,
        "Media retrieved",
        result.data,
        result.pagination,
      );
    } catch (err) {
      next(err);
    }
},

async updateMedia(req, res, next) {
  try {
    const { id } = req.params;
    const { label } = req.body;
    
    if (!id) {
      return apiResponse(res, 400, false, "Media ID required");
    }
    
    const result = await UploadsService.updateMedia(id, { label });
    
    return apiResponse(res, 200, true, "Media updated successfully", result);
  } catch (err) {
    next(err);
  }
  },
};

module.exports = { UploadsController };
