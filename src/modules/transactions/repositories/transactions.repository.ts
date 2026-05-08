import { Injectable } from '@nestjs/common';

import { Knex } from 'knex';
import { InjectConnection } from 'nest-knexjs';
import { Transaction } from '../interface/transaction.interface';
import { CreateTransactionInterface } from '../interface/create-transaction.interface';

@Injectable()
export class TransactionsRepository {
  constructor(@InjectConnection() private readonly knex: Knex) {}

  async create(
    payload: CreateTransactionInterface,
    trx?: Knex.Transaction,
  ): Promise<Transaction> {
    const db = trx || this.knex;

    await db('transactions').insert(payload);

    const transaction = await db<Transaction>('transactions')
      .where({ id: payload.id })
      .first();

    return transaction!;
  }

  async findByReference(
    id: string,
    trx?: Knex.Transaction,
  ): Promise<Transaction> {
    const db = trx || this.knex;

    const transaction = await db<Transaction>('transactions')
      .where({ reference: id })
      .first();

    return transaction!;
  }

  async updateStatus(
    id: string,
    status: 'pending' | 'success' | 'failed',
    trx?: Knex.Transaction,
  ) {
    const db = trx || this.knex;

    return db('transactions').where({ id }).update({ status });
  }
}
