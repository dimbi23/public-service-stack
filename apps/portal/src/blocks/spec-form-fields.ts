/**
 * Spec-extended form field blocks.
 *
 * Each standard form-builder block is wrapped with three additional fields
 * (spec: form-definition section):
 *   - fieldId              — stable machine ID, auto-derived from `name`
 *   - mapsToDocumentTypeCode — links this field to the document taxonomy
 *   - mapsToWorkflowStepId   — links this field to a workflow step
 *
 * These mappings allow case-api to know which documents have been provided
 * at submission time, and allow wbb-service to route step completion.
 */
import { fields } from "@payloadcms/plugin-form-builder";
import type { Block, Field } from "payload";
import { DOCUMENT_TYPE_CODES } from "@org/normalizer";

// ── Shared spec extension fields ──────────────────────────────────────────────

const SPEC_FIELDS: Field[] = [
	{
		name: "fieldId",
		type: "text",
		admin: {
			description:
				"Identifiant stable (snake_case). Auto-généré depuis name si vide.",
		},
		hooks: {
			beforeValidate: [
				({ value, siblingData }) => {
					if (!value && siblingData?.name) {
						return String(siblingData.name)
							.toLowerCase()
							.replace(/[^a-z0-9]+/g, "_")
							.replace(/^_+|_+$/g, "");
					}
					return value;
				},
			],
		},
	},
	{
		name: "mapsToDocumentTypeCode",
		type: "select",
		label: "Mappe vers (code document)",
		admin: {
			description:
				"Si ce champ collecte un document, sélectionner le code taxonomie correspondant.",
		},
		options: DOCUMENT_TYPE_CODES.map((code) => ({ label: code, value: code })),
	},
	{
		name: "mapsToWorkflowStepId",
		type: "text",
		label: "Mappe vers (étape workflow)",
		admin: {
			description:
				"stepId de l'étape de workflow à laquelle ce champ appartient (ex: step_depot_dossier).",
		},
	},
];

// ── Block factory ─────────────────────────────────────────────────────────────

function extendBlock(base: Block): Block {
	return {
		...base,
		fields: [...base.fields, ...SPEC_FIELDS],
	};
}

function resolveBlock(fieldDef: Block | (() => Block)): Block {
	return typeof fieldDef === "function" ? fieldDef() : fieldDef;
}

// ── Extended field blocks ─────────────────────────────────────────────────────

export const specTextField = extendBlock(resolveBlock(fields.text));
export const specTextareaField = extendBlock(resolveBlock(fields.textarea));
export const specSelectField = extendBlock(resolveBlock(fields.select));
export const specEmailField = extendBlock(resolveBlock(fields.email));
export const specNumberField = extendBlock(resolveBlock(fields.number));
export const specCheckboxField = extendBlock(resolveBlock(fields.checkbox));
export const specMessageField = extendBlock(resolveBlock(fields.message));
