import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { N8nClient } from './n8n.client';

@Module({
  imports: [HttpModule],
  providers: [N8nClient],
  exports: [N8nClient],
})
export class N8nModule {}
