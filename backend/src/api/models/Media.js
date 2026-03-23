const { query } = require("../../config/db");
const BACKEND_URL = require("../../config/settings");

const Media = {
  async getAllMedia() {
    const sql = `
        SELECT id, name, ($1 || url) AS url, type, provider, metadata FROM media;
        `;

    const media = await query(sql, [BACKEND_URL]);
    return media.rows;
  },
  async getMediaById(id) {
    const sql = `
        SELECT id, name, ($1 || url) AS url, type, provider, metadata FROM media WHERE id=$2;
        `;

    const media = await query(sql, [BACKEND_URL, id]);
    return media.rows[0];
  },

  async getMediaByName(name) {
    const sql = `
        SELECT id, name, ($1 || url) AS url, type, provider, metadata FROM media WHERE name=$2;
        `;

    const media = await query(sql, [BACKEND_URL, name]);
    return media.rows;
  },

  async getMediaByType(type) {
    // Use LIKE with a wildcard to match the prefix
    const sql = `
    SELECT id, name, ($1 || url) AS url, type, provider, metadata 
    FROM media 
    WHERE type LIKE $2 || '/%';
  `;

    const media = await query(sql, [BACKEND_URL, type]);
    return media.rows;
  },
};

module.exports = { Media };
