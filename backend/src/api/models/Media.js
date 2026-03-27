const { query } = require("../../config/db");
const BACKEND_URL = require("../../config/settings");

const Media = {
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
      countParams.push(type + '/%');
    }
    
    const countResult = await query(countSql, countParams);
    
    // 2. Cast the string result from Postgres to a Number
    const totalCount = parseInt(countResult.rows[0]?.total || 0);
    
    if (totalCount === 0) {
      return { data: [], pagination: { page: p, limit: l, totalPages: 0, total: 0, hasNext: false } };
    }

    // Get results
    let sql = `SELECT id, name, ($1 || url) AS url, type, provider, created_at, label FROM media`;
    let params = [BACKEND_URL];
    
    if (type) {
      sql += ` WHERE type LIKE $${params.length + 1}`;
      params.push(type + '/%');
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
        hasNext: p < totalPages // Simpler check for next page
      }
    };
  } catch (error) {
    console.error('Error in getAllMedia:', error);
    throw error; // Throw the error so the service can handle it
  }
},
  async getMediaById(id) {
    const sql = `
        SELECT id, name, ($1 || url) AS url, type, provider, metadata, label FROM media WHERE id=$2;
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
