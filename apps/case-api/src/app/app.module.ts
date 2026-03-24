import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CasesModule } from '../cases/cases.module';
import { EventsModule } from '../events/events.module';
import { HealthModule } from '../health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventsModule,
    CasesModule,
    HealthModule,
  ],
})
export class AppModule {}
