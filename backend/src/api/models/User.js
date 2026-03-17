const { query, getClient } = require("../../config/db");
const bcrypt = require("bcrypt");

const SALT_ROUNDS = 12;

const User = {
  /**
   * Create a new user
   */
  async create({
    firstName,
    lastName,
    email,
    phone,
    password,
    roleName = "VISITOR", // Now passing the name to look up
  }) {
    const client = await getClient(); // Get a client for the transaction
    try {
      await client.query("BEGIN");

      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      // 1. Insert the User
      const userSql = `
      INSERT INTO users (first_name, last_name, email, phone, password_hash)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, first_name, last_name, email, phone, is_active, created_at`;

      const userRes = await client.query(userSql, [
        firstName,
        lastName,
        email,
        phone,
        passwordHash,
      ]);
      const newUser = userRes.rows[0];

      // 2. Assign the Role
      // This finds the ID of the role by name and inserts into the junction table
      const roleSql = `
      WITH inserted_role AS (
    INSERT INTO users_roles (user_id, role_id)
    VALUES ($1, (SELECT id FROM roles WHERE name = $2))
    RETURNING role_id
)
SELECT r.name 
FROM roles r
JOIN inserted_role ir ON r.id = ir.role_id;`;

      const roles = await client.query(roleSql, [newUser.id, roleName]);

      await client.query("COMMIT");

      // Return the user object (you might want to attach the roleName manually here)
      return { ...newUser, roles: roles.rows };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Find user by email
   */
  async findByEmail(email) {
    const sql = `
      SELECT u.*, COALESCE(json_agg(r.name) FILTER (WHERE r.name IS NOT NULL), '[]') as roles
        FROM users u
        LEFT JOIN users_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.email = $1
      GROUP BY u.id`;
    const result = await query(sql, [email]);
    return result.rows[0] || null;
  },

  /**
   * Find user by ID (excludes password hash)
   */
  async findById(id) {
    const sql = `
      SELECT 
    u.id, 
    u.first_name, 
    u.last_name, 
    u.email, 
    u.phone, 
    u.is_active, 
    u.created_at, 
    u.updated_at, 
    COALESCE(json_agg(r.name) FILTER (WHERE r.name IS  NOT NULL), '[]') as roles -- This creates the ["ADMIN", "VISITOR"] array
FROM users u 
LEFT JOIN users_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.id = $1
GROUP BY u.id;`;
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
    WITH updated AS (
      UPDATE users
      SET first_name = COALESCE($2, first_name),
          last_name = COALESCE($3, last_name),
          phone = COALESCE($4, phone),
          updated_at = NOW()
      WHERE id = $1
      RETURNING id, first_name, last_name, email, phone, is_active, updated_at
    )
    SELECT 
      u.*, 
      r.name as role 
    FROM updated u
    LEFT JOIN users_roles ur ON u.id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.id;
  `;

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

    // 1. Build the Main Query
    // We use LEFT JOIN so we don't accidentally hide users who might have no roles assigned
    let sql = `
    SELECT 
      u.id, u.first_name, u.last_name, u.email, u.phone, u.is_active, u.created_at, u.updated_at,
      STRING_AGG(r.name, ', ') as roles
    FROM users u
    LEFT JOIN users_roles ur ON u.id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.id
  `;

    const values = [];
    let paramIndex = 1;

    // 2. Filter by Role (if provided)
    if (role) {
      // We use a WHERE clause that checks if the user has the specific role in the junction table
      sql += ` WHERE u.id IN (
      SELECT user_id FROM users_roles ur 
      JOIN roles r ON ur.role_id = r.id 
      WHERE r.name = $${paramIndex}
    )`;
      values.push(role);
      paramIndex++;
    }

    // 3. Grouping and Pagination
    // Must group by user ID because of the STRING_AGG
    sql += ` GROUP BY u.id 
           ORDER BY u.created_at DESC 
           LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

    values.push(limit, offset);

    const result = await query(sql, values);

    // 4. Count Total Users (Filtering by role if necessary)
    let countSql = `SELECT COUNT(DISTINCT u.id) FROM users u`;
    const countValues = [];

    if (role) {
      countSql += ` 
      JOIN users_roles ur ON u.id = ur.user_id 
      JOIN roles r ON ur.role_id = r.id 
      WHERE r.name = $1`;
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
   * update user information (admin)
   */
  async updateUser(id, { firstName, lastName, email, phone, role, isActive }) {
    const client = await getClient();
    try {
      await client.query("BEGIN");

      // 1. Update the Users Table
      // Note: We removed 'role' from this SQL as it no longer lives here
      const userSql = `
      UPDATE users
      SET 
        first_name = COALESCE($2, first_name),
        last_name = COALESCE($3, last_name),
        email = COALESCE($4, email),
        phone = COALESCE($5, phone),
        is_active = COALESCE($6, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, first_name, last_name, email, phone, is_active, updated_at`;

      const userRes = await client.query(userSql, [
        id,
        firstName,
        lastName,
        email,
        phone,
        isActive,
      ]);

      if (userRes.rows.length === 0) {
        await client.query("ROLLBACK");
        return null;
      }

      const updatedUser = userRes.rows[0];

      // 2. Update the Role (If provided)
      if (role) {
        // First, we clear existing roles for this user (assuming 1 role per user for now)
        // If you want multiple roles, you'd change the logic here.
        await client.query("DELETE FROM users_roles WHERE user_id = $1", [id]);

        const roleSql = `
        INSERT INTO users_roles (user_id, role_id)
        VALUES ($1, (SELECT id FROM roles WHERE name = $2))`;

        await client.query(roleSql, [id, role]);
      }

      await client.query("COMMIT");

      // Fetch the current role name to return it in the object
      const finalRoleRes = await query(
        `SELECT r.name FROM roles r 
       JOIN users_roles ur ON r.id = ur.role_id 
       WHERE ur.user_id = $1`,
        [id],
      );

      return {
        ...updatedUser,
        role: finalRoleRes.rows[0]?.name || role,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
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
