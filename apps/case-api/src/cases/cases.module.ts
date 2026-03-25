import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { MailModule } from '../mail/mail.module';
import { StorageModule } from '../storage/storage.module';
import { CasesController } from './cases.controller';
import { CasesRepository } from './cases.repository';
import { CasesService } from './cases.service';

@Module({
  imports: [EventsModule, MailModule, StorageModule],
  controllers: [CasesController],
  providers: [CasesService, CasesRepository],
})
export class CasesModule {}
