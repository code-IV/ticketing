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
    roleName = "VISITOR",
  }) {
    const client = await getClient();
    try {
      await client.query("BEGIN");

      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      // 1. Insert the User and link the role in one go
      // We look up the role_id by name inside the INSERT statement
      const userSql = `
      INSERT INTO users (first_name, last_name, email, phone, password_hash, role_id)
      VALUES ($1, $2, $3, $4, $5, (SELECT id FROM roles WHERE name = $6))
      RETURNING id, first_name, last_name, email, phone, role_id, is_active, created_at`;

      const userRes = await client.query(userSql, [
        firstName,
        lastName,
        email,
        phone,
        passwordHash,
        roleName,
      ]);

      const newUser = userRes.rows[0];

      // 2. Fetch the assigned role name AND all inherited roles (permissions)
      // We get the rank of the assigned role, then select all roles with rank <= that.
      const permissionSql = `
      WITH user_role_info AS (
        SELECT name, rank FROM roles WHERE id = $1
      )
      SELECT name FROM roles 
      WHERE rank <= (SELECT rank FROM user_role_info)
      ORDER BY rank DESC;
    `;

      const permRes = await client.query(permissionSql, [newUser.role_id]);

      // The first item in the sorted list (highest rank) is their actual role
      const permissions = permRes.rows.map((r) => r.name);
      const assignedRole = permissions[0];

      await client.query("COMMIT");

      return {
        ...newUser,
        role: assignedRole,
        permissions: permissions,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  async searchUser({ term = "", page = 1, limit = 15 }) {
    const offset = (page - 1) * limit;

    // Use a template literal or array to manage params if you add more filters later
    const searchTerm = `%${term.replace(/[%_\\]/g, "\\$&")}%`;

    const whereClause = `
     (u.first_name || ' ' || u.last_name) ILIKE $1 ESCAPE '\\' OR
     u.email ILIKE $1 ESCAPE '\\' OR
     u.phone ILIKE $1 ESCAPE '\\'
   `;

    const sql = `
    SELECT 
      u.id,
      u.first_name,
      u.last_name,
      u.email,
      u.phone,
      u.is_active,
      r.name AS role
      
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE ${whereClause}
    ORDER BY u.first_name ASC
    LIMIT $2 OFFSET $3;
  `;

    const countSql = `
     SELECT COUNT(*) FROM users u
     WHERE ${whereClause}
   `;

    // Pass the calculated limit and offset to the query
    const result = await query(sql, [searchTerm, limit, offset]);
    const countResult = await query(countSql, [searchTerm]);
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
   * Find user by email
   */
  async findByEmail(email) {
    const sql = `
      SELECT 
    u.*, 
    r.name AS role,
    COALESCE(
        (SELECT jsonb_agg(p.name ORDER BY p.rank DESC) 
         FROM roles p 
         WHERE p.rank <= r.rank),
        '[]'
    ) AS permissions
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
WHERE u.email = $1;`;
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
    -- The user's actual assigned role name
    user_role.name AS role,
    -- All roles with rank <= user's rank
    COALESCE(
        (SELECT json_agg(r_sub.name ORDER BY r_sub.rank DESC)
         FROM roles r_sub
         WHERE r_sub.rank <= user_role.rank), 
        '[]'
    ) AS permissions
FROM users u
LEFT JOIN roles user_role ON u.role_id = user_role.id
WHERE u.id = $1`;
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
  SET 
    first_name = COALESCE($2, first_name),
    last_name = COALESCE($3, last_name),
    phone = COALESCE($4, phone),
    updated_at = NOW()
  WHERE id = $1
  RETURNING id, first_name, last_name, email, phone, is_active, role_id, updated_at
)
SELECT 
  u.id,
  u.first_name,
  u.last_name,
  u.email,
  u.phone,
  u.is_active,
  u.updated_at,
  r.name AS role 
FROM updated u
LEFT JOIN roles r ON u.role_id = r.id;
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
  async findAll({ page = 1, limit = 20, role = null, status = null }) {
    const offset = (page - 1) * limit;
    const values = [];
    let paramIndex = 1;

    // 1. Build the Main Query
    // We join directly with the roles table via u.role_id
    let sql = `
    SELECT 
      u.id, u.first_name, u.last_name, u.email, u.phone, u.is_active, 
      u.created_at, u.updated_at,
      r.name as role_name,
      r.rank as role_rank
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
  `;

    // 2. Build WHERE clause with filters
    const whereConditions = [];

    if (role) {
      whereConditions.push(`r.name = $${paramIndex}`);
      values.push(role);
      paramIndex++;
    }

    if (status) {
      const isActive = status === "active";
      whereConditions.push(`u.is_active = $${paramIndex}`);
      values.push(isActive);
      paramIndex++;
    }

    if (whereConditions.length > 0) {
      sql += ` WHERE ${whereConditions.join(" AND ")}`;
    }

    // 3. Ordering and Pagination
    // No GROUP BY needed anymore because there's only 1 role per user
    sql += ` ORDER BY u.created_at DESC 
           LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

    values.push(limit, offset);

    const result = await query(sql, values);

    // 4. Count Total Users
    let countSql = `SELECT COUNT(*) FROM users u`;
    const countValues = [];
    let countParamIndex = 1;

    if (role || status) {
      const countConditions = [];

      if (role) {
        countSql += ` JOIN roles r ON u.role_id = r.id`;
        countConditions.push(`r.name = $${countParamIndex}`);
        countValues.push(role);
        countParamIndex++;
      }

      if (status) {
        const isActive = status === "active";
        if (role) {
          countConditions.push(`u.is_active = $${countParamIndex}`);
        } else {
          countConditions.push(`u.is_active = $${countParamIndex}`);
        }
        countValues.push(isActive);
        countParamIndex++;
      }

      countSql += ` WHERE ${countConditions.join(" AND ")}`;
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
  async updateUser(
    id,
    { firstName, lastName, email, phone, roleName, isActive },
  ) {
    const client = await getClient();
    try {
      await client.query("BEGIN");

      // 1. Resolve Role ID if a role name was provided
      let roleId = null;
      if (roleName) {
        const roleRes = await client.query(
          "SELECT id FROM roles WHERE name = $1",
          [roleName],
        );
        if (roleRes.rows.length === 0) {
          throw new Error(`Role '${roleName}' does not exist.`);
        }
        roleId = roleRes.rows[0].id;
      }

      // 2. Update the Users Table
      // We include role_id directly in the main UPDATE statement
      const userSql = `
      UPDATE users
      SET 
        first_name = COALESCE($2, first_name),
        last_name = COALESCE($3, last_name),
        email = COALESCE($4, email),
        phone = COALESCE($5, phone),
        role_id = COALESCE($6, role_id),
        is_active = COALESCE($7, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, first_name, last_name, email, phone, role_id, is_active, updated_at`;

      const userRes = await client.query(userSql, [
        id,
        firstName,
        lastName,
        email,
        phone,
        roleId, // Passing the UUID resolved above
        isActive,
      ]);

      if (userRes.rows.length === 0) {
        await client.query("ROLLBACK");
        return null;
      }

      await client.query("COMMIT");

      // 3. Fetch the final object including the role name for the response
      const finalUserRes = await client.query(
        `SELECT u.id, u.first_name, u.last_name, u.email, u.phone, 
                u.is_active, u.created_at, u.updated_at, r.name as role_name 
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.id 
       WHERE u.id = $1`,
        [id],
      );

      return finalUserRes.rows[0];
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
