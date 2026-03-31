const fs = require("fs");
const path = require("path");
const { getClient } = require("../../config/db");
const {
  uploadToTemp,
  deleteFromLocal,
  promoteFile,
} = require("../../utils/uploads");
const { Media } = require("../models/Media");
const { Cipheriv } = require("crypto");

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
              metadata: {
                size: thumb.size,
                encoding: thumb.encoding,
                parent_label: file.label,
              },
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
        if (!media) throw new Error("No staged media found");

        // 1️⃣ Skip if already permanent or if it's a thumbnail
        // (We handle thumbnails inside the main file's logic below)
        if (!media.path.includes("/tmp/uploads/")) continue;
        if (media.label === "thumbnail") continue;

        let finalThumbnailUrl = null;

        // 2️⃣ Handle Thumbnail Promotion FIRST
        const thumbId = media.metadata?.thumbnail_id;
        if (thumbId) {
          const thumbMedia = await Media.getMediaById(thumbId, client);
          if (thumbMedia && thumbMedia.path.includes("/tmp/uploads/")) {
            const promotedThumb = await promoteFile(
              thumbMedia.path,
              thumbMedia.name,
            );
            promotedPaths.push(promotedThumb.path);

            // Update the thumbnail record itself to permanent
            await Media.promoteMedia(
              thumbId,
              {
                path: promotedThumb.path,
                url: promotedThumb.url,
              },
              client,
            );

            finalThumbnailUrl = promotedThumb.url;
          } else {
            finalThumbnailUrl = thumbMedia?.url;
          }
        }

        // 3️⃣ Handle Main File Promotion
        const promotedMain = await promoteFile(media.path, media.name);
        promotedPaths.push(promotedMain.path);

        await Media.promoteMedia(
          media.id,
          {
            path: promotedMain.path,
            url: promotedMain.url,
            thumbnailUrl: finalThumbnailUrl, // Now points to permanent storage!
          },
          client,
        );

        await Media.linkProductMedia(productId, media.id, client);
      }

      return { productId, promotedMedia: promotedPaths };
    } catch (err) {
      for (const p of promotedPaths) {
        await fs.promises.unlink(p).catch(() => {});
      }
      throw err;
    }
  },
  async persistMedia(uploads, productId) {
    const client = await getClient();
    try {
      await client.query("BEGIN");

      for (const upload of uploads) {
        await Media.createMedia(upload, client);
        await Media.linkProductMedia(productId, upload.id, client);
      }
      await client.query("COMMIT");
      return { success: true };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },
  async updateMediaData(media, thumb = null) {
    const client = await getClient();
    const paths = [];
    let promoted = null;
    try {
      await client.query("BEGIN");
      if (thumb) {
        const tempThumb = await uploadToTemp(thumb);
        paths.push(tempThumb.path);
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
            parent_label: media.label,
          },
        };

        await Media.createMedia(thumbMediaData, client);
        promoted = await promoteFile(thumbMediaData.path, thumbMediaData.name);
        paths.push(promoted.path);
      }
      await Media.updateMedia(media.id, media.label, promoted?.url, client);
      await client.query("COMMIT");
      return { success: true };
    } catch (err) {
      for (const p of paths) {
        await fs.promises.unlink(p).catch(() => {});
      }
      await client.query("ROLLBACK");
      throw err;
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

  async updateMedia(id, { label }) {
    if (!id) {
      throw new Error("Media ID is required");
    }

    const result = await Media.updateMediaLabel(id, label);
    return result;
  },
};

module.exports = UploadsService;
