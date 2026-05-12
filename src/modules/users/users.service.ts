import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { AdjutorService } from 'src/lib/integrations/adjutor/services/adjutor.service';
import { UsersRepository } from './repository/users.repository';
import { WalletRepository } from '../wallet/repositories/wallets.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { Knex } from 'knex';
import { InjectConnection } from 'nest-knexjs';
import { v4 as uuid } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly adjutorService: AdjutorService,
    private readonly usersRepository: UsersRepository,
    private readonly walletsRepository: WalletRepository,
    @InjectConnection() private readonly knex: Knex,
    private readonly configService: ConfigService,
  ) {}

  // Check if user is blacklisted
  async isBlacklisted(email: string): Promise<boolean> {
    return await this.adjutorService.checkKarma(email);
  }

  async register(dto: CreateUserDto) {
    const { email, phone } = dto;

    // Check if user with email or phone is already existing
    const existingUserByEmail = await this.usersRepository.findByEmail(email);
    if (existingUserByEmail) {
      throw new BadRequestException('User with this email already exists');
    }

    const existingUserByPhone = await this.usersRepository.findByPhone(phone);
    if (existingUserByPhone) {
      throw new BadRequestException(
        'User with this phone number already exists',
      );
    }

    const isBlacklisted = await this.isBlacklisted(dto.phone);

    if (isBlacklisted) {
      throw new BadRequestException('User is blacklisted');
    }

    // Wrapped in transaction to ensure data consistency
    // If any of the operations fail, the transaction will be rolled back
    return this.knex.transaction(async (trx) => {
      const userId = uuid();

      const user = await this.usersRepository.create(
        {
          id: userId,
          first_name: dto.firstName,
          last_name: dto.lastName,
          email: dto.email,
          password: dto.password, // This should be hashed in a real application
          phone: dto.phone,
        },
        trx,
      );

      await this.walletsRepository.create(
        {
          id: uuid(),
          user_id: userId,
          balance: 0,
        },
        trx,
      );

      return {
        message: 'User created successfully',
        data: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          phone: user.phone,
        },
      };
    });
  }

  async login(dto: LoginDto) {
    const { email, password } = dto;

    const user = await this.usersRepository.findByEmail(email);
    if (!user) throw new BadRequestException('Login failed');

    // Simulate JWT password check logic
    const token = this.configService.get('JWT_TOKEN');
    if (user.password !== password)
      throw new BadRequestException('Login failed');

    return {
      message: 'Login successful',
      data: {
        id: user.id,
        token,
      },
    };
  }
}
