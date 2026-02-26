/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // 1. Create Custom ENUMS
  await knex.raw(
    `CREATE TYPE game_status AS ENUM ('OPEN', 'ON_MAINTENANCE', 'UPCOMING', 'CLOSED')`,
  );
  await knex.raw(
    `CREATE TYPE ticket_status AS ENUM ('PENDING_PAYMENT', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'FULLY_USED')`,
  );
  await knex.raw(
    `CREATE TYPE ticket_game_status AS ENUM ('AVAILABLE', 'USED')`,
  );

  // 2. Games Table
  await knex.schema.createTable("games", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    table.string("name").notNullable();
    table.text("description");
    table.decimal("price", 10, 2).notNullable();
    table.text("rules"); // Optional field
    table.specificType("status", "game_status").defaultTo("OPEN");
    table.timestamps(true, true);
  });

  // 3. Tickets Table
  await knex.schema.table("tickets", (table) => {
    // 2. Remove old columns
    table.dropColumn("is_used");
    table.dropColumn("used_at");
    table.dropColumn("qr_data");

    // 3. Add new columns
    table.specificType("status", "ticket_status").defaultTo("PENDING_PAYMENT");
    table.timestamp("purchased_at").defaultTo(knex.fn.now());
    table.timestamp("expires_at").notNullable();
    table.decimal("total_price", 10, 2).defaultTo(0);
    table.string("payment_reference");
    table.string("buyer_contact");
    table.text("qr_token").notNullable(); // For the signed JWT

    table.index("expires_at");
  });

  // 4. TicketGame (Junction Table for Many-to-Many)
  await knex.schema.createTable("ticket_games", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    table
      .uuid("ticket_id")
      .references("id")
      .inTable("tickets")
      .onDelete("CASCADE");
    table.uuid("game_id").references("id").inTable("games").onDelete("CASCADE");
    table.specificType("status", "ticket_game_status").defaultTo("AVAILABLE");
    table.timestamp("used_at");
    // Renamed for clarity: references the staff member who scanned the ticket
    table
      .uuid("processed_by_staff_id")
      .references("id")
      .inTable("users")
      .onDelete("SET NULL");

    table.unique(["ticket_id", "game_id"]); // Prevents duplicate game entries on one ticket
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.table("tickets", (table) => {
    // 1. Re-add old columns
    table.boolean("is_used").defaultTo(false);
    table.timestamp("used_at");
    table.text("qr_data");

    // 2. Remove new columns
    table.dropColumn("status");
    table.dropColumn("purchased_at");
    table.dropColumn("expires_at");
    table.dropColumn("total_price");
    table.dropColumn("payment_reference");
    table.dropColumn("buyer_contact");
    table.dropColumn("qr_token");
  });
  await knex.schema.dropTableIfExists("ticket_games");
  await knex.schema.dropTableIfExists("games");

  await knex.raw("DROP TYPE IF EXISTS ticket_game_status");
  await knex.raw("DROP TYPE IF EXISTS ticket_status");
  await knex.raw("DROP TYPE IF EXISTS game_status");
};
