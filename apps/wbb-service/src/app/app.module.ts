import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { HealthModule } from '../health/health.module';
import { N8nModule } from '../n8n/n8n.module';
import { ProceduresClientModule } from '../procedures/procedures.module';
import { CasesClientModule } from '../cases/cases.module';
import { WorkflowModule } from '../workflow/workflow.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HttpModule,
    HealthModule,
    N8nModule,
    ProceduresClientModule,
    CasesClientModule,
    WorkflowModule,
  ],
})
export class AppModule {}
