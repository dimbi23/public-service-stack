import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CasesModule } from '../cases/cases.module';
import { EventsModule } from '../events/events.module';
import { HealthModule } from '../health/health.module';
import { MailModule } from '../mail/mail.module';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    EventsModule,
    MailModule,
    StorageModule,
    CasesModule,
    HealthModule,
  ],
})
export class AppModule {}
