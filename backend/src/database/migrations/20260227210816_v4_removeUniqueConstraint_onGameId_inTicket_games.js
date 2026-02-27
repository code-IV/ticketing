/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // 3. Remove the Unique Constraint on ticket_games to allow multiple rides
  await knex.raw(`
    ALTER TABLE ticket_games 
    DROP CONSTRAINT IF EXISTS ticket_games_ticket_id_game_id_unique;
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  // Remove duplicate entries, keeping the first occurrence
  await knex.raw(`
    DELETE FROM ticket_games a
    USING ticket_games b
    WHERE a.id > b.id
      AND a.ticket_id = b.ticket_id
      AND a.game_id = b.game_id;
  `);

  await knex.raw(`
    ALTER TABLE ticket_games 
    ADD CONSTRAINT ticket_games_ticket_id_game_id_unique UNIQUE (ticket_id, game_id);
  `);
};
