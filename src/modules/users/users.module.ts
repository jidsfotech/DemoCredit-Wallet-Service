import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { AdjutorModule } from 'src/lib/integrations/adjutor/adjutor.module';
import { UsersRepository } from './repository/users.repository';
import { WalletRepository } from '../wallet/repositories/wallets.repository';
import { UsersService } from './users.service';

@Module({
  imports: [AdjutorModule],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository, WalletRepository],
  exports: [UsersService],
})
export class UsersModule {}
