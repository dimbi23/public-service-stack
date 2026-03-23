import { Module } from '@nestjs/common';
import { InternalController } from './internal.controller';
import { ProceduresModule } from '../procedures/procedures.module';

@Module({
  imports: [ProceduresModule],
  controllers: [InternalController],
})
export class InternalModule {}
