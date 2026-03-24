import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ProceduresClient } from './procedures.client';

@Module({
  imports: [HttpModule],
  providers: [ProceduresClient],
  exports: [ProceduresClient],
})
export class ProceduresClientModule {}
