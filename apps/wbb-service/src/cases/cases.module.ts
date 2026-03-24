import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CasesClient } from './cases.client';

@Module({
  imports: [HttpModule],
  providers: [CasesClient],
  exports: [CasesClient],
})
export class CasesClientModule {}
