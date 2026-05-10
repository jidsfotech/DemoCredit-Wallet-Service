import { Module } from '@nestjs/common';
import { KnexModule } from 'nest-knexjs';
import KnexConfig from './knexfile';

const env = process.env.NODE_ENV || 'development';
@Module({
  imports: [KnexModule.forRoot({ config: KnexConfig[env] })],
  exports: [],
})
export class DatabaseModule {}
