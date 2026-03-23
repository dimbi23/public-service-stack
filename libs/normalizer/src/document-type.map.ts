/**
 * Fuzzy mapping from raw document label keywords → taxonomy code.
 * Each entry lists lowercase keywords; first match wins.
 * Codes mirror DOCUMENT_TYPE_CODES in apps/portal/src/collections/Services.ts.
 */
export const DOCUMENT_TYPE_CODES = [
  'DOC_ID_CIN',
  'DOC_CIV_BIRTH',
  'DOC_RES_CERT',
  'DOC_SUP_ENVELOPE_A3',
  'DOC_SUP_STAMP',
  'DOC_SUP_FOLDING_FILE',
  'DOC_REQ_APPLICATION_LETTER',
  'DOC_REQ_APPLICATION_FORM',
  'DOC_PAY_BANK_SLIP',
  'DOC_PAY_INVOICE',
  'DOC_ID_PASSPORT',
  'DOC_VEH_REG_CARD',
  'DOC_EDU_TRANSCRIPT',
  'DOC_EDU_CERT_SUCCESS',
  'DOC_EDU_RESEARCH_MEMOIR',
  'DOC_HEALTH_MED_FORM',
  'DOC_TECH_ANALYSIS_REPORT',
  'DOC_AUTH_INTRO_LETTER',
  'DOC_ID_PHOTO',
] as const;

export type DocumentTypeCode = typeof DOCUMENT_TYPE_CODES[number];

interface KeywordRule {
  code: DocumentTypeCode;
  keywords: string[];
}

const KEYWORD_RULES: KeywordRule[] = [
  { code: 'DOC_ID_CIN',              keywords: ['cin', 'carte nationale', 'carte d\'identité', 'identité nationale'] },
  { code: 'DOC_ID_PASSPORT',         keywords: ['passeport', 'passport'] },
  { code: 'DOC_ID_PHOTO',            keywords: ['photo', 'photo d\'identité', 'récente'] },
  { code: 'DOC_CIV_BIRTH',           keywords: ['acte de naissance', 'naissance', 'birth'] },
  { code: 'DOC_RES_CERT',            keywords: ['résidence', 'residence', 'certificat de résidence'] },
  { code: 'DOC_SUP_ENVELOPE_A3',     keywords: ['enveloppe', 'a3'] },
  { code: 'DOC_SUP_STAMP',           keywords: ['timbre', 'fiscal', 'stamp'] },
  { code: 'DOC_SUP_FOLDING_FILE',    keywords: ['chemise', 'dossier', 'folder'] },
  { code: 'DOC_REQ_APPLICATION_LETTER', keywords: ['lettre de demande', 'demande écrite', 'courrier de demande'] },
  { code: 'DOC_REQ_APPLICATION_FORM',   keywords: ['formulaire', 'form', 'fiche de demande', 'imprimé'] },
  { code: 'DOC_PAY_BANK_SLIP',       keywords: ['bordereau', 'versement', 'virement', 'bancaire', 'reçu bancaire'] },
  { code: 'DOC_PAY_INVOICE',         keywords: ['facture', 'invoice', 'quittance', 'reçu de paiement'] },
  { code: 'DOC_VEH_REG_CARD',        keywords: ['carte grise', 'immatriculation', 'vehicle', 'véhicule'] },
  { code: 'DOC_EDU_TRANSCRIPT',      keywords: ['relevé de notes', 'bulletin scolaire', 'transcript'] },
  { code: 'DOC_EDU_CERT_SUCCESS',    keywords: ['attestation de réussite', 'réussite', 'diplôme'] },
  { code: 'DOC_EDU_RESEARCH_MEMOIR', keywords: ['mémoire', 'thèse', 'recherche', 'memoir'] },
  { code: 'DOC_HEALTH_MED_FORM',     keywords: ['fiche médicale', 'médical', 'medical', 'santé', 'certificat médical'] },
  { code: 'DOC_TECH_ANALYSIS_REPORT',keywords: ['rapport', 'analyse', 'bulletin d\'analyse', 'analysis'] },
  { code: 'DOC_AUTH_INTRO_LETTER',   keywords: ['lettre d\'introduction', 'introduction', 'présentation'] },
];

/**
 * Returns the best-matching taxonomy code for a raw document label,
 * or null if no keyword matches.
 */
export function inferDocumentTypeCode(rawLabel: string): DocumentTypeCode | null {
  const lower = rawLabel.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const rule of KEYWORD_RULES) {
    for (const kw of rule.keywords) {
      const normalizedKw = kw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (lower.includes(normalizedKw)) {
        return rule.code;
      }
    }
  }
  return null;
}
