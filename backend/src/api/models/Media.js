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

  async getMediaByName(name) {
    const sql = `
        SELECT id, name, ($1 || url) AS url, type, provider, metadata FROM media WHERE name=$2;
        `;

    const media = await query(sql, [BACKEND_URL, name]);
    return media.rows;
  },
};

module.exports = { Media };
