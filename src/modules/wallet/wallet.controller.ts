import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { FundWalletDto } from './dto/fund-wallet.dto';
import { WalletService } from './wallet.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { TransferFundsDto } from './dto/transfer-fund.dto';
import { WithdrawWalletDto } from './dto/withdraw-fund.dto';

@UseGuards(AuthGuard)
@Controller({
  path: 'wallet',
  version: '1',
})
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post('/fund')
  async fundWallet(@Body() dto: FundWalletDto) {
    return this.walletService.fundWallet(dto);
  }

  @Post('/transfer')
  async transfer(@Body() dto: TransferFundsDto) {
    return this.walletService.transfer(dto);
  }

  @Post('/withdraw')
  async withdraw(@Body() dto: WithdrawWalletDto) {
    return this.walletService.withdraw(dto);
  }
}
