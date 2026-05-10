import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('wallets', (table) => {
    table.uuid('id').primary();
    table.uuid('user_id').notNullable().unique();
    table.decimal('balance', 14, 2).defaultTo(0);
    table.enum('status', ['active', 'suspended']).defaultTo('active');
    table.foreign('user_id').references('users.id').onDelete('CASCADE');

    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('wallets');
}
