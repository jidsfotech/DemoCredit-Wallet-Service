import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Knex } from 'knex';
import { v4 as uuid } from 'uuid';
import { WalletRepository } from './repositories/wallets.repository';
import { TransactionsRepository } from '../transactions/repositories/transactions.repository';
import { InjectConnection } from 'nest-knexjs';
import { FundWalletDto } from './dto/fund-wallet.dto';
import { TransferFundsDto } from './dto/transfer-fund.dto';
import { WithdrawWalletDto } from './dto/withdraw-fund.dto';

@Injectable()
export class WalletService {
  private readonly DAILY_WITHDRAWAL_LIMIT = 500;
  private readonly MIN_WITHDRAWAL_AMOUNT = 100;

  constructor(
    private readonly walletRepository: WalletRepository,
    @InjectConnection() private readonly knex: Knex,
    private readonly transactionsRepository: TransactionsRepository,
  ) {}

  async fundWallet(dto: FundWalletDto) {
    const { userId, amount, reference } = dto;

    // amount must be positive
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    // Idempotency check, reject duplicate references
    // This is just in case the same request is sent twice
    const existingTransaction =
      await this.transactionsRepository.findByReference(reference);
    if (existingTransaction) {
      throw new UnprocessableEntityException(
        'Transaction with this reference already exists',
      );
    }

    const existingWallet = await this.walletRepository.findByUserId(userId);
    if (!existingWallet) {
      throw new NotFoundException(`Wallet not found for user ${userId}`);
    }

    return this.knex.transaction(async (trx) => {
      const wallet = await this.walletRepository.findByIdForUpdate(
        existingWallet.id,
        trx,
      );

      // wallet must be active
      if (wallet.status !== 'active') {
        throw new BadRequestException(
          'Wallet is suspended and cannot receive funds',
        );
      }

      const balanceBefore = Number(wallet.balance);
      const balanceAfter = balanceBefore + Number(amount);

      await this.walletRepository.updateBalance({
        walletId: wallet.id,
        balance: balanceAfter,
        trx,
      });

      await this.transactionsRepository.create(
        {
          id: uuid(),
          wallet_id: wallet.id,
          type: 'fund',
          amount,
          reference,
          status: 'success',
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          description: `Wallet funded with ${amount}`,
        },
        trx,
      );

      return {
        message: 'Wallet funded successfully',
        balance: balanceAfter,
      };
    });
  }

  async transfer(dto: TransferFundsDto) {
    const { senderUserId, receiverUserId, amount } = dto;

    // amount must be positive
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    // prevent self-transfer
    if (senderUserId === receiverUserId) {
      throw new BadRequestException('Cannot transfer funds to your own wallet');
    }

    const [senderWallet, receiverWallet] = await Promise.all([
      this.walletRepository.findByUserId(senderUserId),
      this.walletRepository.findByUserId(receiverUserId),
    ]);

    if (!senderWallet) {
      throw new NotFoundException(
        `Sender wallet not found for user ${senderUserId}`,
      );
    }

    if (!receiverWallet) {
      throw new NotFoundException(
        `Receiver wallet not found for user ${receiverUserId}`,
      );
    }

    // checking sufficient funds before opening transaction
    if (Number(senderWallet.balance) < amount) {
      // Log the failed attempt on a separate connection (outside trx so it persists)
      await this.transactionsRepository.create({
        id: uuid(),
        wallet_id: senderWallet.id,
        from_wallet_id: senderWallet.id,
        to_wallet_id: receiverWallet.id,
        type: 'transfer',
        amount,
        reference: uuid(),
        status: 'failed',
        balance_before: Number(senderWallet.balance),
        balance_after: Number(senderWallet.balance),
        description: 'Transfer failed: insufficient balance',
      });

      throw new BadRequestException('Insufficient balance');
    }

    return this.knex.transaction(async (trx) => {
      // Acquire locks in consistent order (lower UUID first) to prevent deadlocks
      const [firstId, secondId] = [senderWallet.id, receiverWallet.id].sort();
      const firstLocked = await this.walletRepository.findByIdForUpdate(
        firstId,
        trx,
      );
      const secondLocked = await this.walletRepository.findByIdForUpdate(
        secondId,
        trx,
      );

      const lockedSenderWallet =
        firstLocked.id === senderWallet.id ? firstLocked : secondLocked;

      const lockedReceiverWallet =
        firstLocked.id === receiverWallet.id ? firstLocked : secondLocked;

      // wallet must be active
      if (lockedSenderWallet.status !== 'active') {
        throw new BadRequestException('Sender wallet is suspended');
      }
      if (lockedReceiverWallet.status !== 'active') {
        throw new BadRequestException('Receiver wallet is suspended');
      }

      // Re-check balance on the locked row (balance may have changed since pre-check)
      if (Number(lockedSenderWallet.balance) < amount) {
        throw new BadRequestException('Insufficient balance');
      }

      const senderBalanceBefore = Number(lockedSenderWallet.balance);
      const senderBalanceAfter = senderBalanceBefore - amount;

      const receiverBalanceBefore = Number(lockedReceiverWallet.balance);
      const receiverBalanceAfter = receiverBalanceBefore + amount;

      await this.walletRepository.updateBalance({
        walletId: lockedSenderWallet.id,
        balance: senderBalanceAfter,
        trx,
      });

      await this.walletRepository.updateBalance({
        walletId: lockedReceiverWallet.id,
        balance: receiverBalanceAfter,
        trx,
      });

      await this.transactionsRepository.create(
        {
          id: uuid(),
          wallet_id: lockedSenderWallet.id,
          from_wallet_id: lockedSenderWallet.id,
          to_wallet_id: lockedReceiverWallet.id,
          type: 'transfer',
          amount,
          reference: uuid(),
          status: 'success',
          balance_before: senderBalanceBefore,
          balance_after: senderBalanceAfter,
          description: 'Transfer successful',
        },
        trx,
      );

      return {
        message: 'Transfer successful',
        balance: senderBalanceAfter,
      };
    });
  }

  async withdraw(dto: WithdrawWalletDto) {
    const { userId, amount, reference } = dto;

    // amount must meet minimum
    if (amount < this.MIN_WITHDRAWAL_AMOUNT) {
      throw new BadRequestException(
        `Minimum withdrawal amount is ₦${this.MIN_WITHDRAWAL_AMOUNT}`,
      );
    }

    // idempotency check: reject duplicate requests
    const existingTransaction =
      await this.transactionsRepository.findByReference(reference);
    if (existingTransaction) {
      throw new UnprocessableEntityException(
        'Transaction with this reference already exists',
      );
    }

    const existingWallet = await this.walletRepository.findByUserId(userId);
    if (!existingWallet) {
      throw new NotFoundException(`Wallet not found for user ${userId}`);
    }

    // wallet must be active
    if (existingWallet.status !== 'active') {
      throw new BadRequestException(
        'Wallet is suspended and cannot process withdrawals',
      );
    }

    // insufficient funds check
    if (Number(existingWallet.balance) < amount) {
      await this.transactionsRepository.create({
        id: uuid(),
        wallet_id: existingWallet.id,
        type: 'withdraw',
        amount,
        reference,
        status: 'failed',
        balance_before: Number(existingWallet.balance),
        balance_after: Number(existingWallet.balance),
        description: 'Withdrawal failed: insufficient balance',
      });

      throw new BadRequestException('Insufficient balance');
    }

    // daily limit check
    const todayTotal = await this.walletRepository.getTodayWithdrawalTotal(
      existingWallet.id,
    );

    if (todayTotal + amount > this.DAILY_WITHDRAWAL_LIMIT) {
      const remaining = this.DAILY_WITHDRAWAL_LIMIT - todayTotal;

      await this.transactionsRepository.create({
        id: uuid(),
        wallet_id: existingWallet.id,
        type: 'withdraw',
        amount,
        reference,
        status: 'failed',
        balance_before: Number(existingWallet.balance),
        balance_after: Number(existingWallet.balance),
        description: `Withdrawal failed: daily limit exceeded. Remaining limit: ₦${remaining}`,
      });

      throw new BadRequestException(
        `Daily withdrawal limit of ₦${this.DAILY_WITHDRAWAL_LIMIT.toLocaleString()} exceeded. You have ₦${remaining.toLocaleString()} remaining today`,
      );
    }

    return this.knex.transaction(async (trx) => {
      const wallet = await this.walletRepository.findByIdForUpdate(
        existingWallet.id,
        trx,
      );

      // Re-check balance on locked row, concurrent requests may have changed it
      if (Number(wallet.balance) < amount) {
        throw new BadRequestException('Insufficient balance');
      }

      // Re-check daily limit on locked context
      const todayTotalLocked =
        await this.walletRepository.getTodayWithdrawalTotal(wallet.id, trx);

      if (todayTotalLocked + amount > this.DAILY_WITHDRAWAL_LIMIT) {
        const remaining = this.DAILY_WITHDRAWAL_LIMIT - todayTotalLocked;
        throw new BadRequestException(
          `Daily withdrawal limit exceeded. Remaining: ₦${remaining.toLocaleString()}`,
        );
      }

      const balanceBefore = Number(wallet.balance);
      const balanceAfter = balanceBefore - amount;

      await this.walletRepository.updateBalance({
        walletId: wallet.id,
        balance: balanceAfter,
        trx,
      });

      await this.transactionsRepository.create(
        {
          id: uuid(),
          wallet_id: wallet.id,
          type: 'withdraw',
          amount,
          reference,
          status: 'success',
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          description: `Withdrawal of ₦${amount.toLocaleString()} processed successfully`,
        },
        trx,
      );

      return {
        message: 'Withdrawal successful',
        balance: balanceAfter,
      };
    });
  }
}
