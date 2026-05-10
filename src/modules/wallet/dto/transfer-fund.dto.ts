import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class TransferFundsDto {
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  senderUserId: string;

  @IsString()
  @IsNotEmpty()
  receiverUserId: string;
}
