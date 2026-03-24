export { normalizeRow, normalizeCatalog } from './normalizer.js';
export type { CatalogNormalizeResult } from './normalizer.js';
export { mapFormDefinition } from './form-definition.mapper.js';
export type { FormDefinitionDraft, FormFieldDraft } from './form-definition.mapper.js';
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
} from './types.js';
export { inferDocumentTypeCode, DOCUMENT_TYPE_CODES } from './document-type.map.js';
export type { DocumentTypeCode } from './document-type.map.js';
