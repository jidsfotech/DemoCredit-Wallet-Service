import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class FundWalletDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  reference: string;
}
