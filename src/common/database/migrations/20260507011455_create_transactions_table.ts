import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('transactions', (table) => {
    table.uuid('id').primary();

    table.uuid('wallet_id').notNullable();
    table.enum('type', ['fund', 'transfer', 'withdraw']).notNullable();

    table.decimal('amount', 14, 2).notNullable();

    table.string('reference').unique().notNullable();

    table.uuid('from_wallet_id').nullable();
    table.uuid('to_wallet_id').nullable();

    table.enum('status', ['pending', 'success', 'failed']).defaultTo('success');

    table.foreign('wallet_id').references('wallets.id').onDelete('CASCADE');

    table.decimal('balance_before', 14, 2).notNullable();
    table.decimal('balance_after', 14, 2).notNullable();

    table.string('description').notNullable();

    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('transactions');
}
