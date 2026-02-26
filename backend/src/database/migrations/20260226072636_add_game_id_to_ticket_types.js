/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.table("ticket_types", (table) => {
    // 1. Make event_id nullable (in case it was NOT NULL previously)
    table.uuid("event_id").nullable().alter();

    // 2. Add game_id as a nullable reference
    table
      .uuid("game_id")
      .nullable()
      .references("id")
      .inTable("games")
      .onDelete("CASCADE");

    // 3. Add an index for the new column
    table.index("game_id", "idx_ticket_types_game_id");
  });

  await knex.schema.table("games", (table) => {
    table.dropColumn("price");
  });

  await knex.raw(`
  ALTER TABLE ticket_types 
  ADD CONSTRAINT event_or_game_check 
  CHECK (
    (event_id IS NOT NULL AND game_id IS NULL) OR 
    (event_id IS NULL AND game_id IS NOT NULL) OR
    (event_id IS NULL AND game_id IS NULL) -- For general park passes
  );
`);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw(`
    ALTER TABLE ticket_types
    DROP CONSTRAINT event_or_game_check;
  `);
  await knex.schema.table("ticket_types", (table) => {
    table.dropIndex("game_id", "idx_ticket_types_game_id");
    table.dropColumn("game_id");
  });
  await knex.schema.table("games", (table) => {
    table.decimal("price", 10, 2);
  });
};
