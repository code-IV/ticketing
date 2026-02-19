const { query } = require('../config/db');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;

const User = {
  /**
   * Create a new user
   */
  async create({ firstName, lastName, email, phone, password, role = 'visitor' }) {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const sql = `
      INSERT INTO users (first_name, last_name, email, phone, password_hash, role)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, first_name, last_name, email, phone, role, is_active, created_at`;
    const values = [firstName, lastName, email, phone, passwordHash, role];
    const result = await query(sql, values);
    return result.rows[0];
  },

  /**
   * Find user by email
   */
  async findByEmail(email) {
    const sql = `SELECT * FROM users WHERE email = $1`;
    const result = await query(sql, [email]);
    return result.rows[0] || null;
  },

  /**
   * Find user by ID (excludes password hash)
   */
  async findById(id) {
    const sql = `
      SELECT id, first_name, last_name, email, phone, role, is_active, created_at, updated_at
      FROM users WHERE id = $1`;
    const result = await query(sql, [id]);
    return result.rows[0] || null;
  },

  /**
   * Find user by ID (includes password hash for auth)
   */
  async findByIdWithPassword(id) {
    const sql = `SELECT * FROM users WHERE id = $1`;
    const result = await query(sql, [id]);
    return result.rows[0] || null;
  },

  /**
   * Update user profile
   */
  async update(id, { firstName, lastName, phone }) {
    const sql = `
      UPDATE users
      SET first_name = COALESCE($2, first_name),
          last_name = COALESCE($3, last_name),
          phone = COALESCE($4, phone)
      WHERE id = $1
      RETURNING id, first_name, last_name, email, phone, role, is_active, updated_at`;
    const result = await query(sql, [id, firstName, lastName, phone]);
    return result.rows[0] || null;
  },

  /**
   * Update password
   */
  async updatePassword(id, newPassword) {
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    const sql = `UPDATE users SET password_hash = $2 WHERE id = $1 RETURNING id`;
    const result = await query(sql, [id, passwordHash]);
    return result.rows[0] || null;
  },

  /**
   * Compare password with hash
   */
  async comparePassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  },

  /**
   * Get all users (admin)
   */
  async findAll({ page = 1, limit = 20, role = null }) {
    const offset = (page - 1) * limit;
    let sql = `
      SELECT id, first_name, last_name, email, phone, role, is_active, created_at
      FROM users`;
    const values = [];
    let paramIndex = 1;

    if (role) {
      sql += ` WHERE role = $${paramIndex}`;
      values.push(role);
      paramIndex++;
    }

    sql += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(limit, offset);

    const result = await query(sql, values);

    // Count total
    let countSql = `SELECT COUNT(*) FROM users`;
    const countValues = [];
    if (role) {
      countSql += ` WHERE role = $1`;
      countValues.push(role);
    }
    const countResult = await query(countSql, countValues);
    const total = parseInt(countResult.rows[0].count, 10);

    return {
      users: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Toggle user active status (admin)
   */
  async toggleActive(id) {
    const sql = `
      UPDATE users SET is_active = NOT is_active
      WHERE id = $1
      RETURNING id, first_name, last_name, email, is_active`;
    const result = await query(sql, [id]);
    return result.rows[0] || null;
  },
};

module.exports = User;
