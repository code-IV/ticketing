/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // 1. Enable UUID Extension
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  // 2. Create Base Types
  await knex.raw(`CREATE TYPE user_role AS ENUM ('ADMIN', 'STAFF', 'VISITOR')`);
  await knex.raw(
    `CREATE TYPE game_status AS ENUM ('OPEN', 'ON_MAINTENANCE', 'UPCOMING', 'CLOSED')`,
  );

  // 3. Create Users Table
  await knex.schema.createTable("users", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    table.string("first_name", 100).notNullable();
    table.string("last_name", 100).notNullable();
    table.string("email", 255).unique().notNullable();
    table.string("phone", 20);
    table.string("password_hash", 255).notNullable();
    table.specificType("role", "user_role").defaultTo("VISITOR");
    table.boolean("is_active").defaultTo(true);
    table.timestamps(true, true);
  });

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
      .onDelete("RESTRICT");
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
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("games");
  await knex.schema.dropTableIfExists("events");
  await knex.schema.dropTableIfExists("users");

  await knex.raw("DROP TYPE IF EXISTS game_status");
  await knex.raw("DROP TYPE IF EXISTS user_role");
};
