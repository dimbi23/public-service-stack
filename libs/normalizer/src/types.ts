/**
 * Raw CSV/Excel row as read from the service catalog template.
 * All fields are strings (or undefined) because CSV has no types.
 *
 * Column reference (Template.csv):
 *   ID, SERVICE_NAME, SERVICE_TYPE, TENANT, DEPARTMENT, CATEGORY,
 *   DESCRIPTION, LEGAL_TEXT, COST_MIN, COST_MAX, COST_CURRENCY, COST_NOTES,
 *   DOCUMENTS, PROCESSING_TIME, PROCESSING_TIME_NOTES, STEPS, ACCESS_MODE,
 *   STATUS, AUDIENCE, SUPPORT_CONTACT, ELIGIBILITY, OUTPUT_NAME
 */
export interface RawRow {
  ID?: string;
  SERVICE_NAME?: string;
  SERVICE_TYPE?: string;
  /** Ministry / parent institution (e.g. "MAM", "Ministère de l'Artisanat") */
  TENANT?: string;
  /** Also accepted as legacy column name */
  'ENTITE MERE'?: string;
  DEPARTMENT?: string;
  CATEGORY?: string;
  DESCRIPTION?: string;
  LEGAL_TEXT?: string;
  COST_MIN?: string;
  COST_MAX?: string;
  COST_CURRENCY?: string;
  COST_NOTES?: string;
  /** Pipe-separated list of required documents */
  DOCUMENTS?: string;
  PROCESSING_TIME?: string;
  PROCESSING_TIME_NOTES?: string;
  /** Pipe-separated list of workflow steps */
  STEPS?: string;
  ACCESS_MODE?: string;
  STATUS?: string;
  AUDIENCE?: string;
  SUPPORT_CONTACT?: string;
  ELIGIBILITY?: string;
  OUTPUT_NAME?: string;
  [key: string]: string | undefined;
}

/**
 * Result produced by normalizeRow().
 * `service` is shaped to match the Payload Services collection REST API.
 * `errors` are non-fatal issues (field skipped / fallback applied).
 * `warnings` are informational (low confidence, missing optional field).
 */
export interface NormalizeResult {
  service: NormalizedService;
  errors: string[];
  warnings: string[];
  rowNumber?: number;
}

export interface NormalizedService {
  serviceId: string;
  name: string;
  slug: string;
  type?: string;
  status: 'active' | 'draft' | 'deprecated' | 'unknown';
  url?: string;
  description?: LexicalContent;
  owner: {
    ministry: string;
    entity?: string;
    directorate?: string;
    serviceUnit?: string;
  };
  /** Raw name — Payload job resolves to relationship ID */
  _categoryName?: string;
  /** Raw name — Payload job resolves to relationship ID */
  _departmentName?: string;
  audience?: string;
  eligibility?: string;
  languages?: { code: string }[];
  access: {
    channel: 'online' | 'offline' | 'hybrid' | 'unknown';
    submissionPoints?: { point: string }[];
  };
  processingTime: {
    slaDays?: number;
    rawText?: string;
  };
  documentsRequired: DocumentRequired[];
  fee: FeeStructure;
  workflow: WorkflowGroup;
  supportContact?: {
    phone?: string;
    email?: string;
    officeAddress?: string;
  };
}

export interface DocumentRequired {
  documentTypeCode: string;
  label: string;
  requirementLevel: 'required' | 'conditional' | 'optional';
  condition?: string;
}

export interface FeeStructure {
  currency: string;
  model: 'fixed' | 'range' | 'conditional' | 'composite' | 'percentage' | 'unknown';
  rules: FeeRule[];
  summary: {
    isConditional: boolean;
    minAmount?: number;
    maxAmount?: number;
    defaultAmount?: number;
    ruleCount: number;
  };
}

export interface FeeRule {
  ruleId: string;
  type: 'fixed' | 'range' | 'percentage' | 'component' | 'unknown';
  amount?: number;
  minAmount?: number;
  maxAmount?: number;
  condition?: string;
}

export interface WorkflowGroup {
  normalizationConfidence: 'auto_high' | 'auto_medium' | 'manual_required';
  reviewStatus: 'approved_auto' | 'review_required' | 'manual_required';
  steps: WorkflowStep[];
}

export interface WorkflowStep {
  stepId: string;
  order: number;
  label: string;
  stepType: 'submission' | 'verification' | 'inspection' | 'payment' | 'instruction' | 'approval' | 'decision' | 'notification' | 'delivery' | 'archival' | 'other';
  actor: 'citizen' | 'business' | 'administration' | 'mixed' | 'unknown';
  channel: 'online' | 'offline' | 'hybrid' | 'unknown';
  requiresPayment: boolean;
  slaDays?: number;
  documentsIn?: { documentTypeCode: string }[];
  documentsOut?: { documentTypeCode: string }[];
  responsibleUnit?: string;
  confidence: 'auto_high' | 'auto_medium' | 'manual_required';
}

export interface LexicalContent {
  root: {
    type: 'root';
    children: LexicalNode[];
    direction: 'ltr' | 'rtl';
    format: string;
    indent: number;
    version: number;
  };
}

export interface LexicalNode {
  type: string;
  children?: LexicalNode[];
  text?: string;
  format?: number | string;
  style?: string;
  mode?: string;
  version: number;
  direction?: string;
  indent?: number;
}
