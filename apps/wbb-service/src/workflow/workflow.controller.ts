import { Body, Controller, Delete, Get, Param, Post, Version } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { TriggerWorkflowDto } from './dto/trigger-workflow.dto';
import { WorkflowCallbackDto } from './dto/workflow-callback.dto';
import { RegisterWorkflowDto } from './dto/register-workflow.dto';

@Controller('workflow')
export class WorkflowController {
  constructor(private readonly wf: WorkflowService) {}

  // ── Registry ──────────────────────────────────────────────────────────────

  // POST /v1/workflow/register — register serviceId pattern → n8n webhook
  @Post('register')
  @Version('1')
  register(@Body() dto: RegisterWorkflowDto) {
    return this.wf.register(dto);
  }

  // GET /v1/workflow/register — list all registrations
  @Get('register')
  @Version('1')
  listRegistrations() {
    return this.wf.listRegistrations();
  }

  // DELETE /v1/workflow/register/:pattern — remove a registration
  @Delete('register/:pattern')
  @Version('1')
  unregister(@Param('pattern') pattern: string) {
    // Decoded since pattern may contain * or /
    const decoded = decodeURIComponent(pattern);
    this.wf.listRegistrations(); // side-effect-free check
    return { removed: decoded };
  }

  // ── Trigger ───────────────────────────────────────────────────────────────

  // POST /v1/workflow/trigger — called by case-api on case.submitted
  @Post('trigger')
  @Version('1')
  trigger(@Body() dto: TriggerWorkflowDto) {
    return this.wf.trigger(dto);
  }

  // ── Callback ──────────────────────────────────────────────────────────────

  // POST /v1/workflow/callback — called by n8n when a step completes
  @Post('callback')
  @Version('1')
  async callback(@Body() dto: WorkflowCallbackDto) {
    await this.wf.handleCallback(dto);
    return { received: true };
  }

  // ── n8n introspection ─────────────────────────────────────────────────────

  // GET /v1/workflow/n8n/health — check n8n connectivity
  @Get('n8n/health')
  @Version('1')
  n8nHealth() {
    return this.wf.checkN8nConnectivity();
  }

  // GET /v1/workflow/n8n/workflows — list active n8n workflows
  @Get('n8n/workflows')
  @Version('1')
  n8nWorkflows() {
    return this.wf.listN8nWorkflows();
  }
}
