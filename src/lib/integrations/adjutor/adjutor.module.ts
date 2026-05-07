import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdjutorService } from './services/adjutor.service';
import { Env } from 'src/common/env';

@Module({
  imports: [
    ConfigModule,
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        baseURL: configService.get<string>(Env.ADJUTOR_BASE_URL),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${configService.get(Env.ADJUTOR_API_KEY)}`,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [],
  providers: [AdjutorService],
  exports: [AdjutorService],
})
export class AdjutorModule {}
