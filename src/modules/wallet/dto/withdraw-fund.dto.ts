import { IsUUID, IsNumber, IsString, Min } from 'class-validator';

export class WithdrawWalletDto {
  @IsUUID()
  userId: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(100, { message: 'Minimum withdrawal amount is 100' })
  amount: number;

  @IsString()
  reference: string;
}
