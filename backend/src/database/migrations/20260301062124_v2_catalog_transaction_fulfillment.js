/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // 1. Create Custom ENUMS (Postgres specific)
  await knex.raw(
    `CREATE TYPE booking_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'REFUNDED')`,
  );
  await knex.raw(
    `CREATE TYPE payment_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')`,
  );
  await knex.raw(
    `CREATE TYPE payment_method AS ENUM ('CREDIT_CARD', 'DEBIT_CARD', 'TELEBIRR', 'CASH')`,
  );
  await knex.raw(
    `CREATE TYPE ticket_category AS ENUM ('ADULT', 'CHILD', 'SENIOR', 'STUDENT', 'GROUP')`,
  );
  await knex.raw(
    `CREATE TYPE ticket_status AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED', 'FULLY_USED')`,
  );
  await knex.raw(
    `CREATE TYPE ticket_product_status AS ENUM ('AVAILABLE', 'USED')`,
  );

  // 2. PRODUCTS: The Definition
  await knex.schema.createTable("products", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    table.string("name").notNullable();
    table.enu("product_type", ["GAME", "EVENT", "BUNDLE"]).notNullable();
    table.uuid("game_id").nullable();
    table.uuid("event_id").nullable();
    table.integer("valid_days").defaultTo(1);
    table.boolean("is_active").defaultTo(true);
    table.timestamps(true, true);
  });

  // 3. TICKET_TYPES: Use the category ENUM
  await knex.schema.createTable("ticket_types", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    table
      .uuid("product_id")
      .references("id")
      .inTable("products")
      .onDelete("CASCADE");
    table.specificType("category", "ticket_category").notNullable();
    table.decimal("price", 10, 2).notNullable();
    table.integer("max_quantity").nullable();
    table.timestamps(true, true);
  });

  // 4. BOOKINGS: Use the booking_status ENUM
  await knex.schema.createTable("bookings", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    table.string("booking_reference", 20).unique().notNullable();
    table.uuid("user_id").nullable();
    table.decimal("total_amount", 10, 2).notNullable();
    table.specificType("status", "booking_status").defaultTo("PENDING");
    table.string("guest_email").nullable();
    table.string("guest_name").nullable();
    table.timestamps(true, true);
  });

  // 5. BOOKING_ITEMS
  await knex.schema.createTable("booking_items", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    table
      .uuid("booking_id")
      .references("id")
      .inTable("bookings")
      .onDelete("CASCADE");
    table
      .uuid("ticket_type_id")
      .references("id")
      .inTable("ticket_types")
      .onDelete("RESTRICT");
    table.integer("quantity").notNullable();
    table.decimal("unit_price", 10, 2).notNullable();
    table.decimal("subtotal", 10, 2).notNullable();
    table.index("booking_id", "idx_booking_items_booking_id");
  });

  // 6. PAYMENTS
  await knex.schema.createTable("payments", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    table
      .uuid("booking_id")
      .references("id")
      .inTable("bookings")
      .onDelete("CASCADE");
    table.decimal("amount", 10, 2).notNullable();
    table.specificType("method", "payment_method").notNullable();
    table.specificType("status", "payment_status").defaultTo("PENDING");
    table.string("transaction_reference").unique();
    table.timestamp("paid_at");
    table.timestamps(true, true);
    table.index("booking_id", "idx_payments_booking_id");
  });

  // 7. TICKETS: Use ticket_status ENUM
  await knex.schema.createTable("tickets", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    table
      .uuid("booking_id")
      .references("id")
      .inTable("bookings")
      .onDelete("CASCADE");
    table.string("ticket_code").unique().notNullable();
    table.text("qr_token").notNullable();
    table.specificType("status", "ticket_status").defaultTo("ACTIVE");
    table.timestamp("expires_at").notNullable();
    table.timestamps(true, true);
  });

  // 8. TICKET_PRODUCTS: Use ticket_product_status ENUM
  await knex.schema.createTable("ticket_products", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    table
      .uuid("ticket_id")
      .references("id")
      .inTable("tickets")
      .onDelete("CASCADE");
    table
      .uuid("product_id")
      .references("id")
      .inTable("products")
      .onDelete("RESTRICT");
    table.integer("total_quantity").notNullable();
    table.integer("used_quantity").defaultTo(0);
    table
      .specificType("status", "ticket_product_status")
      .defaultTo("AVAILABLE");
    table.timestamp("last_used_at").nullable();
    table.index("ticket_id", "idx_ticket_products_ticket_id");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  // Drop tables in REVERSE order of creation to respect Foreign Keys
  await knex.schema.dropTableIfExists("ticket_products");
  await knex.schema.dropTableIfExists("tickets");
  await knex.schema.dropTableIfExists("payments");
  await knex.schema.dropTableIfExists("booking_items");
  await knex.schema.dropTableIfExists("bookings");
  await knex.schema.dropTableIfExists("ticket_types");
  await knex.schema.dropTableIfExists("products");

  // Drop custom types
  await knex.raw(`DROP TYPE IF EXISTS ticket_product_status`);
  await knex.raw(`DROP TYPE IF EXISTS ticket_status`);
  await knex.raw(`DROP TYPE IF EXISTS ticket_category`);
  await knex.raw(`DROP TYPE IF EXISTS payment_method`);
  await knex.raw(`DROP TYPE IF EXISTS payment_status`);
  await knex.raw(`DROP TYPE IF EXISTS booking_status`);
};
