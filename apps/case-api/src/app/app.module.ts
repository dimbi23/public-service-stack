import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CasesModule } from '../cases/cases.module';
import { EventsModule } from '../events/events.module';
import { HealthModule } from '../health/health.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    EventsModule,
    CasesModule,
    HealthModule,
  ],
})
export class AppModule {}
