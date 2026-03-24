import type { RawRow, NormalizedService, DocumentRequired, FeeRule, WorkflowStep } from './types';
import { inferDocumentTypeCode } from './document-type.map';
import { toRichText, toSlug, toServiceId, extractSlaDays, splitPipe, inferFeeModel } from './helpers';

// ── Step type inference ───────────────────────────────────────────────────────

const STEP_TYPE_RULES: Array<{
  type: WorkflowStep['stepType'];
  keywords: string[];
}> = [
  { type: 'submission',    keywords: ['dépôt', 'depot', 'soumission', 'submit', 'remise de dossier'] },
  { type: 'payment',       keywords: ['paiement', 'payer', 'payment', 'frais', 'droits', 'timbre'] },
  { type: 'verification',  keywords: ['vérification', 'verification', 'contrôle', 'controle', 'check'] },
  { type: 'inspection',    keywords: ['inspection', 'visite', 'constat'] },
  { type: 'instruction',   keywords: ['instruction', 'traitement', 'étude', 'etude', 'examen'] },
  { type: 'approval',      keywords: ['approbation', 'validation', 'approbation', 'visa'] },
  { type: 'decision',      keywords: ['décision', 'decision', 'arbitrage', 'arrêté', 'arrête'] },
  { type: 'notification',  keywords: ['notification', 'avis', 'convocation', 'information'] },
  { type: 'delivery',      keywords: ['remise', 'délivrance', 'delivrance', 'retrait', 'remise du titre'] },
  { type: 'archival',      keywords: ['archivage', 'archiv', 'classement'] },
];

function inferStepType(label: string): WorkflowStep['stepType'] {
  const lower = label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const rule of STEP_TYPE_RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      return rule.type;
    }
  }
  return 'other';
}

function inferStepActor(label: string, stepType: WorkflowStep['stepType']): WorkflowStep['actor'] {
  const lower = label.toLowerCase();
  if (lower.includes('citoyen') || lower.includes('usager') || lower.includes('demandeur') || lower.includes('requérant')) return 'citizen';
  if (lower.includes('entreprise') || lower.includes('société') || lower.includes('opérateur')) return 'business';
  if (lower.includes('service') || lower.includes('administration') || lower.includes('direction') || lower.includes('bureau')) return 'administration';

  // Heuristic from step type
  if (stepType === 'submission') return 'citizen';
  if (['verification', 'inspection', 'instruction', 'approval', 'decision', 'notification', 'delivery', 'archival'].includes(stepType)) return 'administration';
  return 'unknown';
}

// ── Access channel normalization ──────────────────────────────────────────────

function normalizeChannel(raw: string): 'online' | 'offline' | 'hybrid' | 'unknown' {
  const lower = raw.toLowerCase();
  if (['online', 'en ligne', 'numérique', 'internet'].some((k) => lower.includes(k))) return 'online';
  if (['offline', 'présentiel', 'guichet', 'physique', 'sur place'].some((k) => lower.includes(k))) return 'offline';
  if (['hybrid', 'mixte'].some((k) => lower.includes(k))) return 'hybrid';
  return 'unknown';
}

// ── Status normalization ──────────────────────────────────────────────────────

function normalizeStatus(raw: string): NormalizedService['status'] {
  const lower = raw.toLowerCase();
  if (lower === 'active' || lower === 'actif' || lower === 'actifve') return 'active';
  if (lower === 'draft' || lower === 'brouillon' || lower === 'en cours') return 'draft';
  if (lower === 'deprecated' || lower === 'retraité' || lower === 'retired' || lower === 'obsolète') return 'deprecated';
  return 'unknown';
}

// ── Main mapper ───────────────────────────────────────────────────────────────

export function mapRow(
  row: RawRow,
  rowNumber: number,
): { service: NormalizedService; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // ── Identity ──────────────────────────────────────────────────────────────

  const rawId = (row.ID ?? '').trim();
  const name = (row.SERVICE_NAME ?? '').trim();

  if (!rawId && !name) {
    errors.push(`Row ${rowNumber}: ID and SERVICE_NAME are both empty`);
  }

  const serviceId = rawId ? toServiceId(rawId) : `AUTO-${rowNumber.toString().padStart(4, '0')}`;
  const slug = toSlug(name || serviceId);

  // ── Ownership ─────────────────────────────────────────────────────────────

  const ministry =
    (row.TENANT ?? row['ENTITE MERE'] ?? row['MINISTRY'] ?? '').trim();

  if (!ministry) {
    errors.push(`Row ${rowNumber}: TENANT (ministry) is missing`);
  }

  // ── Status ────────────────────────────────────────────────────────────────

  const status: NormalizedService['status'] = row.STATUS
    ? normalizeStatus(row.STATUS)
    : 'draft';

  if (!row.STATUS) {
    warnings.push(`Row ${rowNumber}: STATUS not set, defaulting to 'draft'`);
  }

  // ── Description ───────────────────────────────────────────────────────────

  const descParts: string[] = [];
  if (row.DESCRIPTION?.trim()) descParts.push(row.DESCRIPTION.trim());
  if (row.LEGAL_TEXT?.trim()) descParts.push(row.LEGAL_TEXT.trim());

  const description = descParts.length > 0
    ? toRichText(descParts.join('\n\n'))
    : undefined;

  // ── Access ────────────────────────────────────────────────────────────────

  const accessChannel: NormalizedService['access']['channel'] = row.ACCESS_MODE
    ? normalizeChannel(row.ACCESS_MODE)
    : 'unknown';

  if (accessChannel === 'unknown' && row.ACCESS_MODE) {
    warnings.push(`Row ${rowNumber}: ACCESS_MODE "${row.ACCESS_MODE}" could not be mapped, defaulting to 'unknown'`);
  }

  // ── Processing time ───────────────────────────────────────────────────────

  const ptRaw = [row.PROCESSING_TIME, row.PROCESSING_TIME_NOTES]
    .filter(Boolean)
    .join(' — ')
    .trim() || undefined;

  const slaDays = ptRaw ? extractSlaDays(ptRaw) : undefined;

  if (ptRaw && slaDays === undefined) {
    warnings.push(`Row ${rowNumber}: Could not extract numeric SLA from "${ptRaw}"`);
  }

  // ── Documents required ────────────────────────────────────────────────────

  const documentsRequired: DocumentRequired[] = [];

  if (row.DOCUMENTS) {
    for (const rawDoc of splitPipe(row.DOCUMENTS)) {
      const code = inferDocumentTypeCode(rawDoc);
      if (!code) {
        warnings.push(`Row ${rowNumber}: Could not infer document type code for "${rawDoc}", using DOC_REQ_APPLICATION_FORM as fallback`);
      }
      documentsRequired.push({
        documentTypeCode: code ?? 'DOC_REQ_APPLICATION_FORM',
        label: rawDoc,
        requirementLevel: 'required',
      });
    }
  }

  // ── Fee ───────────────────────────────────────────────────────────────────

  const costMin = row.COST_MIN && row.COST_MIN.trim() !== ''
    ? parseFloat(row.COST_MIN.replace(/[^\d.]/g, ''))
    : undefined;
  const costMax = row.COST_MAX && row.COST_MAX.trim() !== ''
    ? parseFloat(row.COST_MAX.replace(/[^\d.]/g, ''))
    : undefined;
  const currency = (row.COST_CURRENCY ?? 'MGA').trim() || 'MGA';

  const feeModel = inferFeeModel(
    isNaN(costMin as number) ? undefined : costMin,
    isNaN(costMax as number) ? undefined : costMax,
  );

  const feeRules: FeeRule[] = [];

  if (feeModel === 'fixed' && (costMin !== undefined || costMax !== undefined)) {
    const amount = costMin ?? costMax!;
    feeRules.push({ ruleId: 'rule_fixed_base', type: 'fixed', amount });
  } else if (feeModel === 'range') {
    feeRules.push({ ruleId: 'rule_range_base', type: 'range', minAmount: costMin, maxAmount: costMax });
  }

  const fee: NormalizedService['fee'] = {
    currency,
    model: feeModel,
    rules: feeRules,
    summary: {
      isConditional: false,
      minAmount: isNaN(costMin as number) ? undefined : costMin,
      maxAmount: isNaN(costMax as number) ? undefined : costMax,
      defaultAmount: costMin,
      ruleCount: feeRules.length,
    },
  };

  // ── Workflow / Steps ──────────────────────────────────────────────────────

  const rawSteps = row.STEPS ? splitPipe(row.STEPS) : [];

  const steps: WorkflowStep[] = rawSteps.map((label, idx) => {
    const order = idx + 1;
    const stepType = inferStepType(label);
    const actor = inferStepActor(label, stepType);
    const stepId = `step_${toSlug(label).substring(0, 40) || String(order).padStart(2, '0')}`;

    return {
      stepId,
      order,
      label,
      stepType,
      actor,
      channel: accessChannel,
      requiresPayment: stepType === 'payment',
      confidence: 'manual_required',
    };
  });

  // Confidence heuristic: if all step types were inferred (none 'other'), bump to medium
  const hasUnknownStep = steps.some((s) => s.stepType === 'other');
  const normalizationConfidence: WorkflowStep['confidence'] =
    steps.length > 0 && !hasUnknownStep ? 'auto_medium' : 'manual_required';

  const workflow: NormalizedService['workflow'] = {
    normalizationConfidence,
    reviewStatus: normalizationConfidence === 'manual_required' ? 'manual_required' : 'review_required',
    steps,
  };

  // ── Support contact ───────────────────────────────────────────────────────

  let supportContact: NormalizedService['supportContact'];
  if (row.SUPPORT_CONTACT?.trim()) {
    const contact = row.SUPPORT_CONTACT.trim();
    if (contact.includes('@')) {
      supportContact = { email: contact };
    } else if (/^\+?[\d\s\-()]+$/.test(contact)) {
      supportContact = { phone: contact };
    } else {
      supportContact = { officeAddress: contact };
    }
  }

  // ── Output name → workflow label ──────────────────────────────────────────

  if (row.OUTPUT_NAME?.trim() && steps.length > 0) {
    // Annotate last step as delivery with the output name
    const last = steps[steps.length - 1];
    if (!last.documentsOut?.length) {
      last.documentsOut = [];
      warnings.push(`Row ${rowNumber}: OUTPUT_NAME "${row.OUTPUT_NAME}" noted but no DOC code mapped — add manually`);
    }
  }

  // ── Assemble ──────────────────────────────────────────────────────────────

  const service: NormalizedService = {
    serviceId,
    name: name || serviceId,
    slug,
    type: row.SERVICE_TYPE?.trim() || undefined,
    status,
    owner: {
      ministry: ministry || 'UNKNOWN',
      entity: undefined,
      directorate: undefined,
      serviceUnit: undefined,
    },
    _categoryName: row.CATEGORY?.trim() || undefined,
    _departmentName: row.DEPARTMENT?.trim() || undefined,
    audience: row.AUDIENCE?.trim() || undefined,
    eligibility: row.ELIGIBILITY?.trim() || undefined,
    description,
    access: {
      channel: accessChannel,
    },
    processingTime: {
      slaDays,
      rawText: ptRaw,
    },
    documentsRequired,
    fee,
    workflow,
    supportContact,
  };

  return { service, errors, warnings };
}
