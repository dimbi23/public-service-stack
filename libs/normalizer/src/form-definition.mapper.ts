import type { NormalizedService } from './types.js';
import { toSlug } from './helpers.js';

// ── Output types ──────────────────────────────────────────────────────────────

export interface FormFieldDraft {
  /** Stable machine ID used by case-api and wbb-service */
  fieldId: string;
  /** Payload form-builder blockType */
  blockType: 'text' | 'textarea' | 'select' | 'email' | 'number' | 'checkbox' | 'message';
  label: string;
  name: string;
  required: boolean;
  /** Taxonomy code — set for document-collecting fields */
  mapsToDocumentTypeCode?: string;
  /** Workflow step that consumes this field */
  mapsToWorkflowStepId?: string;
  /** Select options (blockType === 'select') */
  options?: { label: string; value: string }[];
}

export interface FormDefinitionDraft {
  /** Matches Services.slug — used to link this form to a service */
  serviceId: string;
  title: string;
  fields: FormFieldDraft[];
  submitButtonLabel: string;
  confirmationMessage: string;
}

// ── Step ID of the first submission step (heuristic) ─────────────────────────

function findSubmissionStepId(svc: NormalizedService): string | undefined {
  return svc.workflow.steps.find((s) => s.stepType === 'submission')?.stepId;
}

// ── Field builder helpers ─────────────────────────────────────────────────────

function identityFields(): FormFieldDraft[] {
  return [
    {
      fieldId: 'field_applicant_name',
      blockType: 'text',
      label: 'Nom complet',
      name: 'applicantName',
      required: true,
    },
    {
      fieldId: 'field_applicant_contact',
      blockType: 'email',
      label: 'Adresse e-mail',
      name: 'applicantEmail',
      required: true,
    },
    {
      fieldId: 'field_applicant_phone',
      blockType: 'text',
      label: 'Téléphone',
      name: 'applicantPhone',
      required: false,
    },
  ];
}

function documentField(
  doc: NormalizedService['documentsRequired'][number],
  submissionStepId: string | undefined,
  index: number,
): FormFieldDraft {
  const slug = toSlug(doc.label).substring(0, 40) || `doc_${index}`;
  return {
    fieldId: `field_doc_${slug}`,
    blockType: 'text',
    label: `${doc.requirementLevel === 'required' ? '* ' : ''}${doc.label}`,
    name: `doc_${slug}`,
    required: doc.requirementLevel === 'required',
    mapsToDocumentTypeCode: doc.documentTypeCode,
    mapsToWorkflowStepId: submissionStepId,
  };
}

// ── Main mapper ───────────────────────────────────────────────────────────────

/**
 * Derives a FormDefinitionDraft from a NormalizedService.
 *
 * The draft is a starting point — a human reviewer should:
 *   1. Verify or correct mapsToDocumentTypeCode and mapsToWorkflowStepId
 *   2. Choose the correct blockType for each field (text vs file upload, etc.)
 *   3. Import the draft into Payload via the form-builder plugin
 */
export function mapFormDefinition(svc: NormalizedService): FormDefinitionDraft {
  const submissionStepId = findSubmissionStepId(svc);

  const fields: FormFieldDraft[] = [
    ...identityFields(),
    ...svc.documentsRequired.map((doc, i) =>
      documentField(doc, submissionStepId, i),
    ),
  ];

  // If the service has a notes / eligibility field, add it
  if (svc.eligibility) {
    fields.push({
      fieldId: 'field_eligibility_confirm',
      blockType: 'checkbox',
      label: `Je déclare remplir les conditions d'éligibilité : ${svc.eligibility.substring(0, 120)}`,
      name: 'eligibilityConfirm',
      required: true,
    });
  }

  return {
    serviceId: svc.serviceId,
    title: `Demande — ${svc.name}`,
    fields,
    submitButtonLabel: 'Soumettre la demande',
    confirmationMessage:
      `Votre demande a été enregistrée. Délai de traitement estimé : ` +
      (svc.processingTime.slaDays != null
        ? `${svc.processingTime.slaDays} jours ouvrables`
        : svc.processingTime.rawText ?? 'voir les conditions'),
  };
}
