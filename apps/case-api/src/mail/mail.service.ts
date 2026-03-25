import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { CaseStatus } from '@org/dto';

const STATUS_LABELS: Record<CaseStatus, string> = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  pending_documents: 'Pending Documents',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    this.from = this.config.get<string>('MAIL_FROM', 'no-reply@taxononie.gov.mg');
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('SMTP_HOST', 'localhost'),
      port: this.config.get<number>('SMTP_PORT', 1025),
      secure: false,
    });
  }

  async sendStatusChanged(opts: {
    to: string;
    caseId: string;
    previousStatus: CaseStatus;
    newStatus: CaseStatus;
    note?: string;
  }): Promise<void> {
    const label = STATUS_LABELS[opts.newStatus] ?? opts.newStatus;
    try {
      await this.transporter.sendMail({
        from: this.from,
        to: opts.to,
        subject: `Your application status: ${label}`,
        text: [
          `Your application (ref: ${opts.caseId}) has been updated.`,
          ``,
          `Status: ${STATUS_LABELS[opts.previousStatus]} → ${label}`,
          opts.note ? `Note: ${opts.note}` : '',
        ].filter(Boolean).join('\n'),
        html: `
          <p>Your application <strong>${opts.caseId}</strong> has been updated.</p>
          <p>Status: <em>${STATUS_LABELS[opts.previousStatus]}</em> → <strong>${label}</strong></p>
          ${opts.note ? `<p>Note: ${opts.note}</p>` : ''}
        `,
      });
    } catch (err) {
      this.logger.error(`Failed to send status email to ${opts.to}: ${(err as Error).message}`);
    }
  }
}
