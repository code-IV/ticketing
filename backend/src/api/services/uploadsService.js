const { getClient } = require("../../config/db");
const { uploadToLocal } = require("../../utils/uploads");
const { Event } = require("../models/Event");
const { Media } = require("../models/Media");

const UploadsService = {
  // Inside your Service Layer
  async addMediaToProduct(productId, files) {
    const client = await getClient();

    try {
      await client.query("BEGIN");
      for (const file of files) {
        // 1. Physical upload (returns the final path/URL)
        const fileInfo = await uploadToLocal(file);

        // 2. Map the data for the DB
        const mediaData = {
          name: file.originalname, // From multer
          url: fileInfo.url, // From your upload function
          type: file.mimetype, // From multer (e.g., 'image/jpeg')
          provider: "LOCAL",
          metadata: {
            size: file.size,
            encoding: file.encoding,
          },
        };

        // 3. Insert into "public.media"
        const mediaId = await Event.createMedia(mediaData, client);

        // 4. Link to product_media
        await Event.linkProductMedia(productId, mediaId, client);
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      // TODO: Clean up uploadedFiles from disk
      throw error;
    } finally {
      client.release();
    }
  },

  async getAll() {
    const media = await Media.getAllMedia();
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
