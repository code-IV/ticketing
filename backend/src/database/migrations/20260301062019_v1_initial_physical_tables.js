/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // 2. Create Base Types
  await knex.raw(
    `CREATE TYPE game_status AS ENUM ('OPEN', 'ON_MAINTENANCE', 'UPCOMING', 'CLOSED')`,
  );

  // Roles table
  await knex.schema.createTable("roles", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string("name").unique().notNullable(); // SUPERADMIN, ADMIN, etc.
    table.integer("rank").notNullable();
    table.string("description").nullable();
    table.timestamps(true, true);
  });

  // Seed default roles
  await knex("roles").insert([
    { name: "SUPERADMIN", rank: 100, description: "System Owner" },
    { name: "ADMIN", rank: 50, description: "General Administrator" },
    { name: "STAFF", rank: 20, description: "Park/Staff Manager" },
    { name: "VISITOR", rank: 0, description: "Standard Customer" },
  ]);

  // 3. Create Users Table
  await knex.schema.createTable("users", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string("first_name", 100).notNullable();
    table.string("last_name", 100).notNullable();
    table.string("email", 255).unique().notNullable();
    table.string("phone", 20);
    table.string("password_hash", 255).notNullable();
    table
      .uuid("role_id")
      .references("id")
      .inTable("roles")
      .onDelete("SET NULL");
    table.boolean("is_active").defaultTo(true);
    table.timestamps(true, true);
  });

  // 4. Create Events Table (Physical Entity)
  await knex.schema.createTable("events", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
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
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string("name").notNullable();
    table.text("description");
    table.text("rules");
    table.specificType("status", "game_status").defaultTo("OPEN");
    table.timestamps(true, true);
  });

  // PRODUCTS: The Definition
  await knex.schema.createTable("products", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string("name").notNullable();
    table.enu("product_type", ["GAME", "EVENT"]).notNullable();
    table
      .uuid("game_id")
      .nullable()
      .references("id")
      .inTable("games")
      .onDelete("CASCADE");
    table
      .uuid("event_id")
      .nullable()
      .references("id")
      .inTable("events")
      .onDelete("CASCADE");
    table.integer("valid_days").defaultTo(1);
    table.boolean("is_active").defaultTo(true);
    table.timestamps(true, true);
  });

  await knex.raw(`
    ALTER TABLE products ADD CONSTRAINT chk_product_type_fk
    CHECK (
      (product_type = 'GAME' AND game_id IS NOT NULL AND event_id IS NULL) OR
      (product_type = 'EVENT' AND event_id IS NOT NULL AND game_id IS NULL)
    )
  `);

  await knex.schema.createTable("media", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string("name").notNullable();
    table.string("url").unique().notNullable();
    table.string("path").unique().notNullable();
    table.string("type").notNullable(); // e.g., 'image/jpeg', 'video/mp4'
    table.string("provider").defaultTo("LOCAL"); // e.g., 'local', 's3', 'cloudinary'
    table
      .enu("label", ["poster", "banner", "gallery", "thumbnail"])
      .notNullable()
      .defaultTo("poster");
    table.string("thumbnail_url").nullable();
    table.jsonb("metadata").nullable(); // Store { size: 1024, width: 1920, etc }
    table.timestamps(true, true);
  });

  await knex.schema.createTable("products_media", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
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
  await knex.raw(
    "ALTER TABLE IF EXISTS products DROP CONSTRAINT IF EXISTS chk_product_type_fk",
  );
  await knex.schema.dropTableIfExists("products");
  await knex.schema.dropTableIfExists("games");
  await knex.schema.dropTableIfExists("events");
  await knex.schema.dropTableIfExists("users_roles");
  await knex.schema.dropTableIfExists("users");
  await knex.schema.dropTableIfExists("roles");
  await knex.raw("DROP TYPE IF EXISTS game_status");
};
