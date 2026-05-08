import { Module } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { TransactionsRepository } from '../transactions/repositories/transactions.repository';
import { WalletRepository } from './repositories/wallets.repository';

@Module({
  controllers: [WalletController],
  providers: [WalletService, WalletRepository, TransactionsRepository],
})
export class WalletModule {}
