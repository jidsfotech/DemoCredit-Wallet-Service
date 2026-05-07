import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('blacklist_checks', (table) => {
    table.uuid('id').primary();

    table.uuid('user_id').notNullable();
    table.boolean('is_blacklisted').defaultTo(false);
    table.text('raw_response').nullable();

    table.foreign('user_id').references('users.id').onDelete('CASCADE');

    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('blacklist_checks');
}
