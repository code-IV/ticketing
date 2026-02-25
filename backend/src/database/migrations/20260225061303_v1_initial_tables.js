/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // 1. Enable UUID Extension
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  // Create types
  // We use knex.raw because Knex doesn't have a native "createType" method
  await knex.raw(`CREATE TYPE user_role AS ENUM ('admin', 'visitor')`);
  await knex.raw(
    `CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'refunded')`,
  );
  await knex.raw(
    `CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded')`,
  );
  await knex.raw(
    `CREATE TYPE payment_method AS ENUM ('credit_card', 'debit_card', 'telebirr', 'cash')`,
  );
  await knex.raw(
    `CREATE TYPE ticket_type_category AS ENUM ('adult', 'child', 'senior', 'student', 'group')`,
  );

  // 2. Create Users Table
  await knex.schema.createTable("users", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    table.string("first_name", 100).notNullable();
    table.string("last_name", 100).notNullable();
    table.string("email", 255).unique().notNullable();
    table.string("phone", 20);
    table.string("password_hash", 255).notNullable();
    table.specificType("role", "user_role").defaultTo("visitor"); // ENUM 'user_role' created above via knex.raw
    table.boolean("is_active").defaultTo(true);
    table.timestamps(true, true); // Adds created_at and updated_at

    table.index("email", "idx_users_email");
    table.index("role", "idx_users_role");
  });

  // 3. Create Events Table
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
      .notNullable()
      .onDelete("RESTRICT");
    table.timestamps(true, true);

    table.index("event_date", "idx_events_date");
    table.index("created_by", "idx_events_created_by");
  });

  // 4. Create Ticket Types Table
  await knex.schema.createTable("ticket_types", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    table
      .uuid("event_id")
      .references("id")
      .inTable("events")
      .onDelete("CASCADE");
    table.string("name", 100).notNullable();
    table.specificType("category", "ticket_type_category").notNullable();
    table.decimal("price", 10, 2).notNullable();
    table.text("description");
    table.integer("max_quantity_per_booking").defaultTo(10);
    table.boolean("is_active").defaultTo(true);
    table.timestamps(true, true);

    table.index("event_id", "idx_ticket_types_event_id");
  });

  await knex.schema.createTable("bookings", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    table.string("booking_reference", 20).unique().notNullable();
    table
      .uuid("user_id")
      .references("id")
      .inTable("users")
      .onDelete("SET NULL");
    table
      .uuid("event_id")
      .references("id")
      .inTable("events")
      .onDelete("RESTRICT");
    table.decimal("total_amount", 10, 2).notNullable();
    table.specificType("booking_status", "booking_status").defaultTo("pending");
    table.specificType("payment_status", "payment_status").defaultTo("pending");
    table.specificType("payment_method", "payment_method");
    table.string("guest_email", 255);
    table.string("guest_name", 200);
    table.text("notes");
    table.timestamp("booked_at").defaultTo(knex.fn.now());
    table.timestamp("cancelled_at");
    table.timestamps(true, true);

    table.index("user_id", "idx_bookings_user_id");
    table.index("event_id", "idx_bookings_event_id");
  });

  // 6. Create Booking Items Table
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
    table.timestamp("created_at").defaultTo(knex.fn.now());

    table.index("booking_id", "idx_booking_items_booking_id");
    table.index("ticket_type_id", "idx_booking_items_ticket_type_id");
  });

  // 7. Create Tickets Table
  await knex.schema.createTable("tickets", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    table
      .uuid("booking_id")
      .references("id")
      .inTable("bookings")
      .onDelete("CASCADE");
    table
      .uuid("booking_item_id")
      .references("id")
      .inTable("booking_items")
      .onDelete("CASCADE");
    table.string("ticket_code", 50).unique().notNullable();
    table.text("qr_data").notNullable();
    table.boolean("is_used").defaultTo(false);
    table.timestamp("used_at");
    table.timestamp("created_at").defaultTo(knex.fn.now());

    table.index("booking_id", "idx_tickets_booking_id");
    table.index("booking_item_id", "idx_tickets_booking_item_id");
  });

  // 8. Create Payments Table
  await knex.schema.createTable("payments", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    table
      .uuid("booking_id")
      .references("id")
      .inTable("bookings")
      .onDelete("CASCADE");
    table.decimal("amount", 10, 2).notNullable();
    table.specificType("payment_method", "payment_method").notNullable();
    table.specificType("payment_status", "payment_status").defaultTo("pending");
    table.string("transaction_reference", 255);
    table.timestamp("paid_at");
    table.timestamps(true, true);

    table.index("booking_id", "idx_payments_booking_id");
  });

  // 9. Setup Auto-Update Triggers for updated_at
  // This part still requires Raw SQL as Knex doesn't have a native trigger builder
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  const tablesWithUpdatedAt = [
    "users",
    "events",
    "ticket_types",
    "bookings",
    "payments",
  ];
  for (const table of tablesWithUpdatedAt) {
    await knex.raw(`
      CREATE TRIGGER update_${table}_updated_at 
      BEFORE UPDATE ON ${table}
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  // Drop tables in reverse order to avoid foreign key conflicts
  await knex.schema.dropTableIfExists("payments");
  await knex.schema.dropTableIfExists("tickets");
  await knex.schema.dropTableIfExists("booking_items");
  await knex.schema.dropTableIfExists("bookings");
  await knex.schema.dropTableIfExists("ticket_types");
  await knex.schema.dropTableIfExists("events");
  await knex.schema.dropTableIfExists("users");

  await knex.raw("DROP TYPE IF EXISTS ticket_type_category");
  await knex.raw("DROP TYPE IF EXISTS payment_method");
  await knex.raw("DROP TYPE IF EXISTS payment_status");
  await knex.raw("DROP TYPE IF EXISTS booking_status");
  await knex.raw("DROP TYPE IF EXISTS user_role");

  // Optional: Drop function and extensions if you want a total wipe
  await knex.raw("DROP FUNCTION IF EXISTS update_updated_at_column CASCADE");
};
