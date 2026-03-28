const fs = require("fs");
const path = require("path");
const { getClient } = require("../../config/db");
const {
  uploadToTemp,
  deleteFromLocal,
  promoteFile,
} = require("../../utils/uploads");
const { Media } = require("../models/Media");

const UploadsService = {
  async addMediaToTemp(files) {
    const client = await getClient();
    const tempPaths = []; // For cleanup
    const mediaIds = []; // Collect IDs to return

    try {
      await client.query("BEGIN");

      for (const item of files) {
        const { file, thumb, label } = item;

        if (!file) throw new Error("File is required for each upload item");

        // 1️⃣ Handle Thumbnail
        let tempThumb;
        if (thumb) {
          tempThumb = await uploadToTemp(thumb);
          tempPaths.push(tempThumb.path);

          const thumbMediaData = {
            name: thumb.originalname,
            url: tempThumb.url,
            path: tempThumb.path,
            type: thumb.mimetype,
            label: "thumbnail",
            provider: "LOCAL",
            metadata: {
              size: thumb.size,
              encoding: thumb.encoding,
              parent_label: label,
            },
          };

          const thumbId = await Media.createMedia(thumbMediaData, client);
          mediaIds.push(thumbId);
          tempThumb.id = thumbId; // store id for reference by main file
        }

        // 2️⃣ Handle Main File
        const tempFile = await uploadToTemp(file);
        tempPaths.push(tempFile.path);

        const mainMediaData = {
          name: file.originalname,
          url: tempFile.url,
          path: tempFile.path,
          type: file.mimetype,
          label: label,
          thumbnail_url: tempThumb ? tempThumb.url : null,
          provider: "LOCAL",
          metadata: {
            size: file.size,
            encoding: file.encoding,
            thumbnail_id: tempThumb ? tempThumb.id : null, // optional reference
          },
        };

        const mainMediaId = await Media.createMedia(mainMediaData, client);
        mediaIds.push(mainMediaId);
      }

      await client.query("COMMIT");

      return { mediaIds: mediaIds }; // ✅ return all created media IDs
    } catch (error) {
      console.log("addMediaToTemp", error);
      await client.query("ROLLBACK");

      // Cleanup temp files
      for (const path of tempPaths) {
        try {
          console.log("cleaning", path);
          await fs.promises.unlink(path);
        } catch (e) {}
      }

      throw error;
    } finally {
      client.release();
    }
  },
  async addMediaToProduct(productId, mediaIds, client) {
    const promotedPaths = [];

    try {
      for (const id of mediaIds) {
        const media = await Media.getMediaById(id, client);
        if (!media) {
          throw new Error("No staged media found");
        }

        const tempPath = media.path;

        // ✅ Skip already promoted files (idempotency)
        if (!tempPath.includes("/tmp/uploads/")) continue;

        // ✅ Ensure file exists
        if (!tempPath || !fs.existsSync(tempPath)) {
          throw new Error(`Temp file missing: ${tempPath}`);
        }

        // ✅ Use safe filename (UUID-based)
        const filename = path.basename(tempPath);

        const promoted = await promoteFile(tempPath, productId, media.name);
        promotedPaths.push(promoted.path);

        await Media.updateMedia(
          media.id,
          {
            path: promoted.path,
            url: promoted.url,
          },
          client,
        );

        await Media.linkProductMedia(productId, media.id, client);
      }

      return { productId, promotedMedia: promotedPaths };
    } catch (err) {
      // cleanup only what we already moved
      for (const p of promotedPaths) {
        await fs.promises.unlink(p).catch(() => {});
      }

      throw err;
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

  async getAll(page = 1, limit = 32, type = null) {
    const media = await Media.getAllMedia(page, limit, type);
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
