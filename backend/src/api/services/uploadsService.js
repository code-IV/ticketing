const fs = require("fs");
const { getClient } = require("../../config/db");
const { uploadToLocal, deleteFromLocal } = require("../../utils/uploads");
const { Event } = require("../models/Event");
const { Media } = require("../models/Media");
const { Product } = require("../models/Product");

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
            path: thumbInfo.path,
            type: thumb.mimetype,
            label: "thumbnail",
            provider: "LOCAL",
            metadata: {
              size: thumb.size,
              encoding: thumb.encoding,
              parent_label: label, // Helpful for context
            },
          };

          await Media.createMedia(thumbMediaData, client);
        }

        // 2. Handle Main File
        const fileInfo = await uploadToLocal(file);
        uploadedPaths.push(fileInfo.path);

        const mainMediaData = {
          name: file.originalname,
          url: fileInfo.url,
          path: fileInfo.path,
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
        const mainMediaId = await Media.createMedia(mainMediaData, client);
        await Media.linkProductMedia(productId, mainMediaId, client);
      }

      await client.query("COMMIT");
    } catch (error) {
      // 1. Rollback DB transaction first
      await client.query("ROLLBACK");

      // 2. CLEANUP FILES FIRST (Files are harder to track than DB rows)
      for (const path of uploadedPaths) {
        try {
          await fs.promises.unlink(path);
        } catch (e) {
          /* Log this, don't ignore it! */
        }
      }

      // 3. Delete the product
      try {
        await Product.deleteProduct(productId);
        console.error("PRODUCT HAS BEEN ROLLED BACK");
      } catch (dbError) {
        console.error(
          "CRITICAL: Failed to delete orphaned product:",
          productId,
        );
      }

      throw error;
    } finally {
      client.release();
    }
  },
  async deleteMediaFromProduct(mediaId) {
    const client = await getClient();
    try {
      await client.query("BEGIN");

      // 1. Fetch media details first to get the storage path/URL
      // You'll need a method like getMediaById in your Event model
      const media = await Media.getMediaById(mediaId);
      if (!media) {
        throw new Error("Media record not found");
      }

      // 2. Unlink from Product and Delete Media Record
      // This order respects foreign key constraints if you have them
      await Media.deleteMediaRecord(mediaId, client);

      // 3. Commit the DB changes
      await client.query("COMMIT");
      try {
        console.log("media.path", media.path);
        await deleteFromLocal(media.path);
      } catch (err) {
        console.error("Storage Cleanup Failed:", err);
        throw new Error("Media unlink failed");
      }

      return { success: true };
    } catch (error) {
      await client.query("ROLLBACK");
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
