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

  // 3. TICKET_TYPES: Use the category ENUM
  await knex.schema.createTable("ticket_types", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("product_id")
      .references("id")
      .inTable("products")
      .onDelete("CASCADE");
    table.specificType("category", "ticket_category").notNullable();
    table.decimal("price", 10, 2).notNullable();
    table.integer("max_quantity").nullable();
    table.timestamp("deleted_at").nullable();
    table.timestamps(true, true);
  });

  await knex.raw(`
  CREATE UNIQUE INDEX idx_ticket_types_product_category_active 
  ON ticket_types (product_id, category) 
  WHERE deleted_at IS NULL
`);

  await knex.schema.createTable("promotions", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string("name").notNullable(); // e.g., "Summer Sale"
    table.text("description");
    table.boolean("is_active").defaultTo(true);

    // Global limits
    table.integer("max_global_usages").nullable(); // e.g., First 100 tickets
    table.integer("total_usages").defaultTo(0);

    // Time windows
    table.timestamp("starts_at").notNullable();
    table.timestamp("ends_at").notNullable();

    // Action: How much to take off
    table.enu("discount_type", ["PERCENTAGE", "FLAT_AMOUNT"]).notNullable();
    table.decimal("discount_value", 10, 2).notNullable();

    table.timestamps(true, true);
  });

  // 2. Rules Table (The logic)
  await knex.schema.createTable("promotion_rules", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("promotion_id")
      .references("id")
      .inTable("promotions")
      .onDelete("CASCADE")
      .notNullable();
    table.index("promotion_id", "idx_promotion_rules_promotion_id");

    // Rule types: 'USER_LOGGED_IN', 'MIN_PURCHASE', 'PRODUCT_SPECIFIC', 'USAGE_COUNT'
    table.string("rule_type").notNullable();
    table.jsonb("rule_data").notNullable(); // e.g., { "min_amount": 500 } or { "first_n": 100 }
  });

  // 3. Coupon Codes (Optional access)
  await knex.schema.createTable("coupon_codes", (table) => {
    table.string("code").primary(); // e.g., "SAVE20"
    table
      .uuid("promotion_id")
      .references("id")
      .inTable("promotions")
      .onDelete("CASCADE")
      .notNullable();
    table.integer("max_usages_per_user").defaultTo(1);
    table.boolean("is_active").defaultTo(true);
    table.timestamps(true, true);
  });

  // 4. BOOKINGS: Use the booking_status ENUM
  await knex.schema.createTable("bookings", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string("booking_reference", 20).unique().notNullable();
    table.uuid("user_id").nullable();
    table.decimal("total_amount", 10, 2).notNullable();
    table.specificType("status", "booking_status").defaultTo("PENDING");
    table
      .uuid("promotion_id")
      .nullable()
      .references("id")
      .inTable("promotions")
      .onDelete("SET NULL");
    table.string("coupon_code").nullable();
    table.decimal("discount_total", 10, 2).defaultTo(0);
    table.timestamps(true, true);
  });

  // 5. BOOKING_ITEMS
  await knex.schema.createTable("booking_items", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
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
    table.decimal("discount_amount", 10, 2).defaultTo(0);
    table.index("booking_id", "idx_booking_items_booking_id");
  });

  // 6. PAYMENTS
  await knex.schema.createTable("payments", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
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
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
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
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
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
    table
      .uuid("ticket_type_id")
      .references("id")
      .inTable("ticket_types")
      .onDelete("RESTRICT");
    table.integer("total_quantity").notNullable();
    table.integer("used_quantity").defaultTo(0);
    table
      .specificType("status", "ticket_product_status")
      .defaultTo("AVAILABLE");
    table.timestamp("last_used_at").nullable();
    table.index("ticket_id", "idx_ticket_products_ticket_id");
  });

  await knex.schema.createTable("upload_sessions", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.timestamp("expires_at").notNullable();
    table.jsonb("metadata").notNullable();
    table.jsonb("product_data").nullable();
    table.boolean("confirmed").defaultTo(false);
    table.timestamp("created_at").defaultTo(knex.fn.now());

    table.index("expires_at", "idx_upload_sessions_expiry");
  });

  await knex.schema.createTable("promotion_rule_products", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("rule_id")
      .references("id")
      .inTable("promotion_rules")
      .onDelete("CASCADE");
    table
      .uuid("ticket_type_id")
      .references("id")
      .inTable("ticket_types")
      .onDelete("CASCADE");

    table.unique(["rule_id", "ticket_type_id"]);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  // Drop tables in REVERSE order of creation to respect Foreign Keys
  await knex.schema.dropTableIfExists("upload_sessions");
  await knex.schema.dropTableIfExists("ticket_products");
  await knex.schema.dropTableIfExists("tickets");
  await knex.schema.dropTableIfExists("payments");
  await knex.schema.dropTableIfExists("booking_items");
  await knex.schema.dropTableIfExists("bookings");
  await knex.schema.dropTableIfExists("ticket_types");

  // Drop custom types
  await knex.raw(`DROP TYPE IF EXISTS ticket_product_status`);
  await knex.raw(`DROP TYPE IF EXISTS ticket_status`);
  await knex.raw(`DROP TYPE IF EXISTS ticket_category`);
  await knex.raw(`DROP TYPE IF EXISTS payment_method`);
  await knex.raw(`DROP TYPE IF EXISTS payment_status`);
  await knex.raw(`DROP TYPE IF EXISTS booking_status`);
};
