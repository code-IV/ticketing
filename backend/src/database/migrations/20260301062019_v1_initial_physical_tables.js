/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // 1. Enable UUID Extension
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  // 2. Create Base Types
  await knex.raw(
    `CREATE TYPE game_status AS ENUM ('OPEN', 'ON_MAINTENANCE', 'UPCOMING', 'CLOSED')`,
  );

  // Roles table
  await knex.schema.createTable("roles", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    table.string("name").unique().notNullable(); // SUPERADMIN, ADMIN, etc.
    table.integer("level").notNullable();
    table.string("description").nullable();
    table.timestamps(true, true);
  });

  // 3. Create Users Table
  await knex.schema.createTable("users", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    table.string("first_name", 100).notNullable();
    table.string("last_name", 100).notNullable();
    table.string("email", 255).unique().notNullable();
    table.string("phone", 20);
    table.string("password_hash", 255).notNullable();
    table.boolean("is_active").defaultTo(true);
    table.timestamps(true, true);
  });

  //Join table for users and roles
  await knex.schema.createTable("users_roles", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    table
      .uuid("user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table
      .uuid("role_id")
      .notNullable()
      .references("id")
      .inTable("roles")
      .onDelete("CASCADE");

    // Ensure a user can't have the same role twice
    table.unique(["user_id", "role_id"]);
  });

  const roles = [
    {
      id: "00000000-0000-0000-0000-000000000001",
      name: "SUPERADMIN",
      level: 100,
      description: "System Owner",
    },
    {
      id: "00000000-0000-0000-0000-000000000002",
      name: "ADMIN",
      level: 50,
      description: "General Administrator",
    },
    {
      id: "00000000-0000-0000-0000-000000000003",
      name: "STAFF",
      level: 20,
      description: "Park/Staff Manager",
    },
    {
      id: "00000000-0000-0000-0000-000000000004",
      name: "VISITOR",
      level: 0,
      description: "Standard Customer",
    },
  ];

  for (const role of roles) {
    await knex("roles").insert(role).onConflict("id").ignore();
  }

  // Enforce Only One Superadmin
  await knex.raw(`
    CREATE UNIQUE INDEX single_superadmin_idx 
    ON users_roles (role_id) 
    WHERE role_id = '00000000-0000-0000-0000-000000000001'
  `);

  // 4. Create Events Table (Physical Entity)
  await knex.schema.createTable("events", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    table.string("name", 255).notNullable();
    table.text("description");
    table.date("event_date").notNullable();
    table.time("start_time").notNullable();
    table.time("end_time").notNullable();
    table.integer("capacity").notNullable();
    table.integer("tickets_sold").defaultTo(0);
    table.boolean("is_active").defaultTo(true);
    table
      .uuid("created_by")
      .references("id")
      .inTable("users")
      .onDelete("SET NULL");
    table.timestamps(true, true);

    table.index("event_date", "idx_events_date");
  });

  // 5. Games Table (Physical Entity - NO PRICE HERE)
  await knex.schema.createTable("games", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    table.string("name").notNullable();
    table.text("description");
    table.text("rules");
    table.specificType("status", "game_status").defaultTo("OPEN");
    table.timestamps(true, true);
  });

  // PRODUCTS: The Definition
  await knex.schema.createTable("products", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    table.string("name").notNullable();
    table.enu("product_type", ["GAME", "EVENT"]).notNullable();
    table
      .uuid("game_id")
      .nullable()
      .references("id")
      .inTable("games")
      .onDelete("SET NULL");
    table
      .uuid("event_id")
      .nullable()
      .references("id")
      .inTable("events")
      .onDelete("SET NULL");
    table.integer("valid_days").defaultTo(1);
    table.boolean("is_active").defaultTo(true);
    table.timestamps(true, true);
  });

  await knex.schema.createTable("media", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    table.string("name").notNullable();
    table.string("url").notNullable();
    table.string("type").notNullable(); // e.g., 'image/jpeg', 'video/mp4'
    table.string("provider").defaultTo("LOCAL"); // e.g., 'local', 's3', 'cloudinary'
    table.jsonb("metadata").nullable(); // Store { size: 1024, width: 1920, etc }
    table.timestamps(true, true);
  });

  await knex.schema.createTable("products_media", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    table
      .uuid("product_id")
      .notNullable()
      .references("id")
      .inTable("products")
      .onDelete("CASCADE");
    table
      .uuid("media_id")
      .notNullable()
      .references("id")
      .inTable("media")
      .onDelete("CASCADE");
    table.integer("sort_order").defaultTo(0);
    table.unique(["product_id", "media_id"]);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("products_media");
  await knex.schema.dropTableIfExists("media");
  await knex.schema.dropTableIfExists("products");
  await knex.schema.dropTableIfExists("games");
  await knex.schema.dropTableIfExists("events");
  await knex.schema.dropTableIfExists("users_roles");
  await knex.schema.dropTableIfExists("users");
  await knex.schema.dropTableIfExists("roles");

  await knex.raw("DROP TYPE IF EXISTS game_status");
};
