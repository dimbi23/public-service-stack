import { Module } from '@nestjs/common';
import { N8nModule } from '../n8n/n8n.module';
import { ProceduresClientModule } from '../procedures/procedures.module';
import { CasesClientModule } from '../cases/cases.module';
import { WorkflowRegistry } from './workflow.registry';
import { WorkflowService } from './workflow.service';
import { WorkflowController } from './workflow.controller';

@Module({
  imports: [N8nModule, ProceduresClientModule, CasesClientModule],
  providers: [WorkflowRegistry, WorkflowService],
  controllers: [WorkflowController],
})
export class WorkflowModule {}
