import type { CollectionConfig } from 'payload';

/**
 * ExecutionMappings — satellite collection for workflow execution specs.
 *
 * Each record mirrors one Services document (1-to-1 via `serviceId`).
 * Stored separately so that the public API profile can serve Services without
 * execution-mapping data (spec: execution-mapping MUST NOT appear in Public API Profile).
 *
 * Populated by the normalizer pipeline; refined manually by agents.
 */
export const ExecutionMappings: CollectionConfig = {
  slug: 'execution-mappings',
  admin: {
    useAsTitle: 'serviceId',
    defaultColumns: ['serviceId', 'version', 'reviewStatus', 'updatedAt'],
    description: 'Execution specs for the workflow engine (wbb-service). Not served in Public API.',
  },
  fields: [
    // ── Identity ─────────────────────────────────────────────────────────────
    {
      name: 'serviceId',
      label: 'Service ID',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Must match Services.serviceId (e.g. MAM-CENAM-B-P1)',
      },
    },
    {
      name: 'service',
      label: 'Service',
      type: 'relationship',
      relationTo: 'services',
      required: true,
      unique: true,
      admin: {
        description: 'Linked Services document',
      },
    },
    {
      name: 'version',
      label: 'Version',
      type: 'text',
      defaultValue: '1.0.0',
      admin: { description: 'SemVer — bump on any structural change' },
    },

    // ── Review ────────────────────────────────────────────────────────────────
    {
      name: 'reviewStatus',
      label: 'Statut de validation',
      type: 'select',
      required: true,
      defaultValue: 'review_required',
      admin: { position: 'sidebar' },
      options: [
        { label: 'Approuvé — publiable', value: 'approved' },
        { label: 'Révision requise', value: 'review_required' },
        { label: 'Traitement manuel requis', value: 'manual_required' },
      ],
    },
    {
      name: 'normalizationConfidence',
      label: 'Confiance normalisation',
      type: 'select',
      defaultValue: 'manual_required',
      admin: { position: 'sidebar', readOnly: true },
      options: [
        { label: 'Auto — haute', value: 'auto_high' },
        { label: 'Auto — moyenne', value: 'auto_medium' },
        { label: 'Manuel requis', value: 'manual_required' },
      ],
    },

    // ── GovStack WBB process definition ───────────────────────────────────────
    {
      name: 'process',
      label: 'Définition du processus',
      type: 'group',
      fields: [
        {
          name: 'processId',
          label: 'Process ID',
          type: 'text',
          admin: { description: 'Pattern: proc_<serviceId_slug>' },
        },
        {
          name: 'version',
          label: 'Version du processus',
          type: 'text',
          defaultValue: '1.0.0',
        },
        {
          name: 'actor',
          label: 'Acteur principal',
          type: 'select',
          options: [
            { label: 'Citoyen', value: 'citizen' },
            { label: 'Entreprise', value: 'business' },
            { label: 'Administration', value: 'administration' },
            { label: 'Mixte', value: 'mixed' },
          ],
        },
        {
          name: 'channel',
          label: 'Canal principal',
          type: 'select',
          options: [
            { label: 'En ligne', value: 'online' },
            { label: 'Présentiel', value: 'offline' },
            { label: 'Hybride', value: 'hybrid' },
          ],
        },
        {
          name: 'estimatedDurationDays',
          label: 'Durée estimée totale (jours)',
          type: 'number',
          min: 0,
        },
        // ── Steps ──────────────────────────────────────────────────────────────
        {
          name: 'steps',
          label: 'Étapes d\'exécution',
          type: 'array',
          fields: [
            {
              name: 'stepId',
              label: 'Step ID',
              type: 'text',
              required: true,
              admin: { description: 'Doit correspondre à workflow.steps[].stepId dans Services' },
            },
            {
              name: 'order',
              label: 'Ordre',
              type: 'number',
              required: true,
              min: 1,
            },
            {
              name: 'label',
              label: 'Libellé',
              type: 'text',
              required: true,
            },
            {
              name: 'stepType',
              label: 'Type',
              type: 'select',
              required: true,
              options: [
                { label: 'Soumission', value: 'submission' },
                { label: 'Vérification', value: 'verification' },
                { label: 'Inspection', value: 'inspection' },
                { label: 'Paiement', value: 'payment' },
                { label: 'Instruction', value: 'instruction' },
                { label: 'Approbation', value: 'approval' },
                { label: 'Décision', value: 'decision' },
                { label: 'Notification', value: 'notification' },
                { label: 'Remise', value: 'delivery' },
                { label: 'Archivage', value: 'archival' },
                { label: 'Autre', value: 'other' },
              ],
            },
            {
              name: 'actor',
              label: 'Acteur',
              type: 'select',
              options: [
                { label: 'Citoyen', value: 'citizen' },
                { label: 'Entreprise', value: 'business' },
                { label: 'Administration', value: 'administration' },
                { label: 'Mixte', value: 'mixed' },
                { label: 'Inconnu', value: 'unknown' },
              ],
            },
            {
              name: 'channel',
              label: 'Canal',
              type: 'select',
              options: [
                { label: 'Présentiel', value: 'offline' },
                { label: 'En ligne', value: 'online' },
                { label: 'Hybride', value: 'hybrid' },
                { label: 'Inconnu', value: 'unknown' },
              ],
            },
            {
              name: 'requiresPayment',
              label: 'Implique paiement',
              type: 'checkbox',
              defaultValue: false,
            },
            {
              name: 'slaDays',
              label: 'SLA (jours ouvrables)',
              type: 'number',
              min: 0,
            },
            {
              name: 'responsibleUnit',
              label: 'Unité responsable',
              type: 'text',
            },
            // WBB integration fields
            {
              name: 'wbbTaskType',
              label: 'WBB Task Type',
              type: 'select',
              admin: { description: 'GovStack WBB mapping' },
              options: [
                { label: 'UserTask', value: 'UserTask' },
                { label: 'ServiceTask', value: 'ServiceTask' },
                { label: 'Gateway', value: 'Gateway' },
                { label: 'Event', value: 'Event' },
              ],
            },
            {
              name: 'wbbAssigneeRole',
              label: 'WBB Assignee Role',
              type: 'text',
              admin: { description: 'RBAC role in wbb-service (e.g. OFFICER, CITIZEN)' },
            },
            {
              name: 'automatable',
              label: 'Automatisable',
              type: 'checkbox',
              defaultValue: false,
            },
            {
              name: 'confidence',
              label: 'Confiance classification',
              type: 'select',
              defaultValue: 'manual_required',
              options: [
                { label: 'Auto — haute', value: 'auto_high' },
                { label: 'Auto — moyenne', value: 'auto_medium' },
                { label: 'Manuel requis', value: 'manual_required' },
              ],
            },
          ],
        },
      ],
    },

    // ── Notes ─────────────────────────────────────────────────────────────────
    {
      name: 'reviewNotes',
      label: 'Notes de révision',
      type: 'textarea',
      admin: { description: 'Commentaires de l\'équipe de validation' },
    },
  ],
};
