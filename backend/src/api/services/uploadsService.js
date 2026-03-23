const fs = require("fs");
const { getClient } = require("../../config/db");
const { uploadToLocal } = require("../../utils/uploads");
const { Event } = require("../models/Event");
const { Media } = require("../models/Media");

const UploadsService = {
  async addMediaToProduct(productId, files) {
    const client = await getClient();
    // Array to keep track of uploaded files for cleanup if the DB fails
    const uploadedPaths = [];

    try {
      await client.query("BEGIN");

      for (const item of files) {
        const { file, thumb, label } = item; // Using the keys from your controller

        if (!file) {
          throw new Error("File is required for each upload item");
        }

        // 1. Handle Thumbnail First (to get its URL/ID for the main image)
        let thumbInfo = null;

        if (thumb) {
          thumbInfo = await uploadToLocal(thumb);
          uploadedPaths.push(thumbInfo.path); // Store path for potential cleanup

          const thumbMediaData = {
            name: thumb.originalname,
            url: thumbInfo.url,
            type: thumb.mimetype,
            label: "thumbnail",
            provider: "LOCAL",
            metadata: {
              size: thumb.size,
              encoding: thumb.encoding,
              parent_label: label, // Helpful for context
            },
          };

          await Event.createMedia(thumbMediaData, client);
        }

        // 2. Handle Main File
        const fileInfo = await uploadToLocal(file);
        uploadedPaths.push(fileInfo.path);

        const mainMediaData = {
          name: file.originalname,
          url: fileInfo.url,
          type: file.mimetype,
          label: label,
          thumbnail_url: thumbInfo ? thumbInfo.url : null, // The string URL
          provider: "LOCAL",
          metadata: {
            size: file.size,
            encoding: file.encoding,
          },
        };

        // 3. Insert Main Media and Link to Product
        const mainMediaId = await Event.createMedia(mainMediaData, client);
        await Event.linkProductMedia(productId, mainMediaId, client);
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");

      // CLEANUP: Delete files from disk so you don't have "ghost" images
      for (const path of uploadedPaths) {
        try {
          await fs.promises.unlink(path);
        } catch (e) {
          /* ignore */
        }
      }

      throw error;
    } finally {
      client.release();
    }
  },

  async getAll() {
    const media = await Media.getAllMedia();
    return media;
  },
  async getById(id) {
    if (!id || typeof id !== "string") {
      throw new Error("Invalid media id provided");
    }
    const media = await Media.getMediaById(id);
    return media;
  },
  async getByName(name) {
    if (!name || typeof name !== "string") {
      throw new Error("Invalid media name provided");
    }
    const media = await Media.getMediaByName(name);
    return media;
  },
  async getByType(type) {
    if (!type || typeof type !== "string") {
      throw new Error("Invalid media type provided");
    }
    const media = await Media.getMediaByType(type);
    return media;
  },
};

module.exports = UploadsService;
