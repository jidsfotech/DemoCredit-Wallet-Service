import {
  IsEmail,
  IsNotEmpty,
  Matches,
  IsString,
  IsOptional,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @Matches(/^[0-9]{11,15}$/)
  @IsOptional()
  phone: string;
}
