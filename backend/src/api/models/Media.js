const { query } = require("../../config/db");
const BACKEND_URL = require("../../config/settings");

const Media = {
  async createMedia(mediaData, client) {
    const sql = `
      INSERT INTO media (id, name, path, url, type, label, thumbnail_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id`;
    const { rows } = await client.query(sql, [
      mediaData.id,
      mediaData.name,
      mediaData.path,
      mediaData.url,
      mediaData.type,
      mediaData.label,
      mediaData.thumbnailUrl,
    ]);
    return rows[0].id;
  },
  async promoteMedia(id, mediaData, client) {
    const sql = `
      UPDATE media 
      SET 
          url = $2, 
          path = $3,
          thumbnail_url = $4
      WHERE id = $1
      RETURNING *;`;
    const { rows } = await client.query(sql, [
      id,
      mediaData.url,
      mediaData.path,
      mediaData.thumbnailUrl,
    ]);
    return rows[0].id;
  },
  async updateMedia(id, label = null, thumbnailUrl = null, client) {
    const sql = `
      UPDATE media 
SET 
    label = COALESCE($2, label), 
    thumbnail_url = COALESCE($3, thumbnail_url),
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;`;
    const { rows } = await client.query(sql, [id, label, thumbnailUrl]);
    return rows[0]?.id;
  },

  async linkProductMedia(productId, mediaId, client) {
    const sql = `INSERT INTO products_media (product_id, media_id) VALUES ($1, $2)`;
    await client.query(sql, [productId, mediaId]);
  },

  async getAllMedia() {
    const sql = `
        SELECT id, name,  url, type, provider, metadata FROM media;
        `;

    const media = await query(sql, [BACKEND_URL]);
    return media.rows;
  },
  async getAllMedia(page = 1, limit = 32, type = null) {
    try {
      // 1. Force inputs to valid numbers to prevent SQL/Logic errors
      const p = Math.max(1, parseInt(page));
      const l = Math.max(1, parseInt(limit));
      const offset = (p - 1) * l;

      // Get total count
      let countSql = `SELECT COUNT(*) as total FROM media`;
      let countParams = [];

      if (type) {
        countSql += ` WHERE type LIKE $1`;
        countParams.push(type + "/%");
      }

      const countResult = await query(countSql, countParams);

      // 2. Cast the string result from Postgres to a Number
      const totalCount = parseInt(countResult.rows[0]?.total || 0);

      if (totalCount === 0) {
        return {
          data: [],
          pagination: {
            page: p,
            limit: l,
            totalPages: 0,
            total: 0,
            hasNext: false,
          },
        };
      }

      // Get results
      let sql = `SELECT id, name,  url, type, provider, created_at, label FROM media`;
      let params = [BACKEND_URL];

      if (type) {
        sql += ` WHERE type LIKE $${params.length + 1}`;
        params.push(type + "/%");
      }

      // 3. Proper ORDER BY and Pagination
      sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(l, offset);

      const media = await query(sql, params);

      const totalPages = Math.ceil(totalCount / l);

      return {
        data: media.rows || [],
        pagination: {
          page: p,
          limit: l,
          totalPages: totalPages,
          total: totalCount,
          hasNext: p < totalPages, // Simpler check for next page
        },
      };
    } catch (error) {
      console.error("Error in getAllMedia:", error);
      throw error; // Throw the error so the service can handle it
    }
  },
  async getMediaById(id) {
    const sql = `
        SELECT id, name,  url, path, type, provider, metadata, label FROM media WHERE id=$2;
        `;

    const media = await query(sql, [id]);
    return media.rows[0];
  },

  async getMediaByName(name) {
    const sql = `
        SELECT id, name,  url, type, provider, metadata FROM media WHERE name=$2;
        `;

    const media = await query(sql, [BACKEND_URL, name]);
    return media.rows;
  },

  async getMediaByType(type) {
    // Use LIKE with a wildcard to match the prefix
    const sql = `
    SELECT id, name,  url, type, provider, metadata 
    FROM media 
    WHERE type LIKE $2 || '/%';
  `;

    const media = await query(sql, [BACKEND_URL, type]);
    return media.rows;
  },

  async deleteMediaRecord(id, client) {
    const sql = `
        DELETE FROM media WHERE id=$1 RETURNING*;
        `;

    const media = await client.query(sql, [id]);
    return media.rows[0];
  },

  async updateMediaLabel(id, label) {
    const sql = `UPDATE media SET label = $1 WHERE id = $2 RETURNING *`;
    const result = await query(sql, [label, id]);
    return result.rows[0];
  },
};

module.exports = { Media };
