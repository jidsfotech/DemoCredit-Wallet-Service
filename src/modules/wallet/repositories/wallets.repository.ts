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

    return wallet!;
  }

  // Find wallet for update using transaction to avoid race condition
  async findByIdForUpdate(
    walletId: string,
    trx: Knex.Transaction,
  ): Promise<Wallet> {
    const wallet = await trx<Wallet>('wallets')
      .where({ id: walletId })
      .forUpdate()
      .first();

    return wallet!;
  }

  async updateBalance(ballanceDetails: {
    walletId: string;
    balance: number;
    trx?: Knex.Transaction;
  }) {
    const { walletId, balance, trx } = ballanceDetails;
    const db = trx || this.knex;

    return db('wallets').where({ id: walletId }).update({
      balance,
      updated_at: new Date(),
    });
  }

  async getTodayWithdrawalTotal(
    walletId: string,
    trx?: Knex.Transaction,
  ): Promise<number> {
    const db = trx ?? this.knex;

    const result = await db('transactions')
      .where({ wallet_id: walletId, type: 'withdraw', status: 'success' })
      .whereRaw('DATE(created_at) = CURDATE()')
      .sum('amount as total')
      .first();

    return Number(result?.total ?? 0);
  }
}
