import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { ProceduresModule } from '../procedures/procedures.module';
import { InternalModule } from '../internal/internal.module';
import { HealthController } from '../health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HttpModule,
    ProceduresModule,
    InternalModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
