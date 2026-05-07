import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary();
    table.string('email').unique().notNullable();
    table.string('password').unique().notNullable();
    table.string('phone').unique().notNullable();
    table.string('first_name').notNullable();
    table.string('last_name').notNullable();
    table.boolean('is_blacklisted').defaultTo(false);
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('users');
}
