import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdjutorService } from './services/adjutor.service';

@Module({
  imports: [
    ConfigModule,
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        baseURL: configService.get<string>('ADJUTOR_BASE_URL'),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${configService.get('ADJUTOR_API_KEY')}`,
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
