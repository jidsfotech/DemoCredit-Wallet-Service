import { Injectable } from '@nestjs/common';
import { InjectConnection } from 'nest-knexjs';
import { Knex } from 'knex';
import { Wallet } from '../interface/wallet';

@Injectable()
export class WalletRepository {
  constructor(@InjectConnection() private readonly knex: Knex) {}

  async create(
    payload: { id: string; balance: number; user_id: string },
    trx?: Knex.Transaction,
  ): Promise<Wallet> {
    const db = trx || this.knex;

    await db('wallets').insert(payload);
    const wallet = await db<Wallet>('wallets')
      .where({ id: payload.id })
      .first();

    if (!wallet) throw new Error('Wallet creation failed');
    return wallet;
  }

  async findByUserId(user_id: string): Promise<Wallet> {
    const wallet = await this.knex<Wallet>('wallets')
      .where({ user_id })
      .first();

    if (!wallet) throw new Error(`Wallet with user_id ${user_id} not found`);
    return wallet;
  }

  async find(params: { id: string; user_id: string }): Promise<Wallet> {
    const wallet = await this.knex<Wallet>('wallets').where(params).first();

    if (!wallet) throw new Error('Wallet not found');
    return wallet;
  }
}
