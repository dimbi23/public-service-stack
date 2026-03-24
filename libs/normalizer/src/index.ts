export { normalizeRow, normalizeCatalog } from './normalizer';
export type { CatalogNormalizeResult } from './normalizer';
export { mapFormDefinition } from './form-definition.mapper';
export type { FormDefinitionDraft, FormFieldDraft } from './form-definition.mapper';
export type {
  RawRow,
  NormalizeResult,
  NormalizedService,
  DocumentRequired,
  FeeStructure,
  FeeRule,
  WorkflowGroup,
  WorkflowStep,
  LexicalContent,
} from './types';
export { inferDocumentTypeCode, DOCUMENT_TYPE_CODES } from './document-type.map';
export type { DocumentTypeCode } from './document-type.map';
