import type { CollectionConfig } from "payload";

const DOCUMENT_TYPE_CODES = [
	{ label: "Carte d'identité nationale (CIN)", value: "DOC_ID_CIN" },
	{ label: "Acte de naissance", value: "DOC_CIV_BIRTH" },
	{ label: "Certificat de résidence", value: "DOC_RES_CERT" },
	{ label: "Enveloppe A3", value: "DOC_SUP_ENVELOPE_A3" },
	{ label: "Timbre / timbre fiscal", value: "DOC_SUP_STAMP" },
	{ label: "Chemise dossier", value: "DOC_SUP_FOLDING_FILE" },
	{ label: "Lettre de demande", value: "DOC_REQ_APPLICATION_LETTER" },
	{ label: "Formulaire de demande", value: "DOC_REQ_APPLICATION_FORM" },
	{ label: "Bordereau de versement bancaire", value: "DOC_PAY_BANK_SLIP" },
	{ label: "Facture", value: "DOC_PAY_INVOICE" },
	{ label: "Passeport", value: "DOC_ID_PASSPORT" },
	{ label: "Carte grise", value: "DOC_VEH_REG_CARD" },
	{ label: "Relevé de notes", value: "DOC_EDU_TRANSCRIPT" },
	{ label: "Attestation de réussite", value: "DOC_EDU_CERT_SUCCESS" },
	{ label: "Mémoire de recherche", value: "DOC_EDU_RESEARCH_MEMOIR" },
	{ label: "Fiche médicale", value: "DOC_HEALTH_MED_FORM" },
	{ label: "Bulletin / rapport d'analyse", value: "DOC_TECH_ANALYSIS_REPORT" },
	{ label: "Lettre d'introduction", value: "DOC_AUTH_INTRO_LETTER" },
	{ label: "Photo d'identité récente", value: "DOC_ID_PHOTO" },
];

export const Services: CollectionConfig = {
	slug: "services",
	admin: {
		useAsTitle: "name",
		defaultColumns: ["name", "serviceId", "status"],
		components: {
			beforeListTable: [
				"@/components/admin/ServiceUploader#ServiceUploader",
			],
		},
	},
	fields: [
		// ── Identity ─────────────────────────────────────────────────────────
		{
			name: "serviceId",
			label: "Service ID",
			type: "text",
			required: true,
			unique: true,
			admin: {
				position: "sidebar",
				description: "Identifiant unique. Convention : MINISTRY-DOMAIN-NNN (ex : MID-AUTH-001)",
			},
		},
		{
			name: "slug",
			type: "text",
			required: true,
			unique: true,
			admin: { position: "sidebar" },
			hooks: {
				beforeValidate: [
					({ value, data }) => {
						if (!value && data?.name) {
							return data.name
								.toLowerCase()
								.replace(/ /g, "-")
								.replace(/[^\w-]+/g, "");
						}
						return value;
					},
				],
			},
		},
		{
			name: "name",
			label: "Nom officiel de la procédure",
			type: "text",
			required: true,
		},
		{
			name: "description",
			label: "Description",
			type: "richText",
		},
		{
			// Free text per spec — no controlled vocabulary enforced
			name: "type",
			label: "Type de procédure",
			type: "text",
			admin: {
				description: "Ex : autorisation, attestation, enregistrement",
			},
		},
		{
			name: "status",
			label: "Statut",
			type: "select",
			required: true,
			defaultValue: "draft",
			options: [
				{ label: "Actif", value: "active" },
				{ label: "Brouillon", value: "draft" },
				{ label: "Déprécié", value: "deprecated" },
				{ label: "Inconnu", value: "unknown" },
			],
			admin: { position: "sidebar" },
		},
		{
			name: "url",
			label: "URL officielle",
			type: "text",
			admin: {
				position: "sidebar",
				description: "URL canonique de la page officielle de la procédure",
			},
		},

		// ── Ownership ─────────────────────────────────────────────────────────
		{
			name: "owner",
			label: "Institution responsable",
			type: "group",
			fields: [
				{
					name: "ministry",
					label: "Ministère",
					type: "text",
					required: true,
					admin: {
						description: "Code court ou nom complet (ex : MID, Ministère de l'Intérieur)",
					},
				},
				{
					name: "entity",
					label: "Entité / Agence",
					type: "text",
					admin: {
						description: "Entité autonome sous tutelle du ministère (ex : Office du Tourisme)",
					},
				},
				{
					name: "directorate",
					label: "Direction",
					type: "text",
				},
				{
					name: "serviceUnit",
					label: "Service / Unité",
					type: "text",
				},
			],
		},
		{
			name: "category",
			label: "Catégorie",
			type: "relationship",
			relationTo: "categories",
			hasMany: false,
			admin: { position: "sidebar" },
		},
		{
			// Geographic department — null for nationally applicable procedures
			name: "department",
			label: "Département géographique",
			type: "relationship",
			relationTo: "departments",
			hasMany: false,
			admin: {
				position: "sidebar",
				description: "Laisser vide pour une procédure d'application nationale",
			},
		},

		// ── Audience & Eligibility ────────────────────────────────────────────
		{
			name: "audience",
			label: "Public cible",
			type: "text",
			admin: {
				description: "Ex : Particuliers, Entreprises, Associations",
			},
		},
		{
			name: "eligibility",
			label: "Conditions d'éligibilité",
			type: "textarea",
		},
		{
			name: "languages",
			label: "Langues disponibles",
			type: "array",
			fields: [
				{
					name: "code",
					label: "Code BCP 47",
					type: "text",
					admin: { description: "Ex : fr, mg, en" },
				},
			],
		},
		{
			name: "tags",
			label: "Tags",
			type: "array",
			fields: [{ name: "tag", type: "text" }],
		},

		// ── Access ────────────────────────────────────────────────────────────
		{
			name: "access",
			label: "Modalités d'accès",
			type: "group",
			fields: [
				{
					name: "channel",
					label: "Canal principal",
					type: "select",
					options: [
						{ label: "En ligne", value: "online" },
						{ label: "Présentiel", value: "offline" },
						{ label: "Hybride", value: "hybrid" },
						{ label: "Inconnu", value: "unknown" },
					],
				},
				{
					name: "submissionPoints",
					label: "Points de dépôt / soumission",
					type: "array",
					fields: [
						{
							name: "point",
							type: "text",
							admin: {
								description: "Ex : Commune de résidence, portail.gov.mg",
							},
						},
					],
				},
			],
		},

		// ── Processing Time ───────────────────────────────────────────────────
		{
			name: "processingTime",
			label: "Délai de traitement",
			type: "group",
			fields: [
				{
					name: "slaDays",
					label: "SLA (jours ouvrables)",
					type: "number",
					min: 0,
					admin: {
						description: "Délai réglementaire ou déclaré en jours ouvrables",
					},
				},
				{
					name: "rawText",
					label: "Texte source",
					type: "text",
					admin: {
						description:
							"Texte exact tel qu'extrait (ex : 15 jours ouvrables à compter de la réception du dossier complet)",
					},
				},
			],
		},

		// ── Documents Required ────────────────────────────────────────────────
		{
			name: "documentsRequired",
			label: "Pièces à fournir",
			type: "array",
			fields: [
				{
					name: "documentTypeCode",
					label: "Code document",
					type: "select",
					required: true,
					options: DOCUMENT_TYPE_CODES,
					admin: { description: "Code issu du dictionnaire de taxonomie" },
				},
				{
					name: "label",
					label: "Libellé affiché",
					type: "text",
					required: true,
				},
				{
					name: "requirementLevel",
					label: "Niveau d'exigence",
					type: "select",
					required: true,
					defaultValue: "required",
					options: [
						{ label: "Obligatoire", value: "required" },
						{ label: "Conditionnel", value: "conditional" },
						{ label: "Facultatif", value: "optional" },
					],
				},
				{
					name: "condition",
					label: "Condition d'application",
					type: "text",
					admin: {
						description:
							"Renseigner uniquement si conditionnel (ex : Pour les demandeurs étrangers)",
					},
				},
			],
		},

		// ── Fee ───────────────────────────────────────────────────────────────
		{
			name: "fee",
			label: "Structure tarifaire",
			type: "group",
			fields: [
				{
					name: "currency",
					label: "Devise",
					type: "select",
					defaultValue: "MGA",
					options: [{ label: "Ariary (MGA)", value: "MGA" }],
					admin: { position: "sidebar" },
				},
				{
					name: "model",
					label: "Modèle tarifaire",
					type: "select",
					defaultValue: "unknown",
					options: [
						{ label: "Fixe", value: "fixed" },
						{ label: "Conditionnel", value: "conditional" },
						{ label: "Fourchette", value: "range" },
						{ label: "Composite", value: "composite" },
						{ label: "Pourcentage", value: "percentage" },
						{ label: "Inconnu", value: "unknown" },
					],
				},
				{
					name: "rules",
					label: "Règles tarifaires",
					type: "array",
					fields: [
						{
							name: "ruleId",
							label: "ID règle",
							type: "text",
							required: true,
							admin: { description: "Pattern : rule_xxx (ex : rule_fixed_base)" },
						},
						{
							name: "type",
							label: "Type",
							type: "select",
							required: true,
							options: [
								{ label: "Fixe", value: "fixed" },
								{ label: "Fourchette", value: "range" },
								{ label: "Pourcentage", value: "percentage" },
								{ label: "Composant", value: "component" },
								{ label: "Inconnu", value: "unknown" },
							],
						},
						{ name: "amount", label: "Montant (MGA)", type: "number", min: 0 },
						{
							name: "minAmount",
							label: "Montant min (MGA)",
							type: "number",
							min: 0,
						},
						{
							name: "maxAmount",
							label: "Montant max (MGA)",
							type: "number",
							min: 0,
						},
						{
							name: "percentage",
							label: "Pourcentage (%)",
							type: "number",
							min: 0,
							max: 100,
						},
						{ name: "condition", label: "Condition", type: "text" },
						{ name: "appliesTo", label: "Applicable à", type: "text" },
						{
							name: "componentLabel",
							label: "Libellé composant",
							type: "text",
						},
					],
				},
				{
					name: "summary",
					label: "Résumé tarifaire",
					type: "group",
					fields: [
						{
							name: "isConditional",
							label: "Tarif conditionnel ?",
							type: "checkbox",
							defaultValue: false,
						},
						{
							name: "minAmount",
							label: "Montant min (MGA)",
							type: "number",
							min: 0,
						},
						{
							name: "maxAmount",
							label: "Montant max (MGA)",
							type: "number",
							min: 0,
						},
						{
							name: "defaultAmount",
							label: "Montant par défaut (MGA)",
							type: "number",
							min: 0,
						},
						{
							name: "ruleCount",
							label: "Nombre de règles",
							type: "number",
							min: 0,
							admin: {
								description:
									"Doit correspondre au nombre d'entrées dans Règles tarifaires (BR-005)",
							},
						},
					],
				},
			],
		},

		// ── Workflow ──────────────────────────────────────────────────────────
		{
			name: "workflow",
			label: "Workflow de la procédure",
			type: "group",
			fields: [
				{
					name: "normalizationConfidence",
					label: "Confiance globale",
					type: "select",
					defaultValue: "manual_required",
					options: [
						{ label: "Auto — haute confiance", value: "auto_high" },
						{ label: "Auto — confiance moyenne", value: "auto_medium" },
						{ label: "Révision manuelle requise", value: "manual_required" },
					],
				},
				{
					name: "reviewStatus",
					label: "Statut de validation",
					type: "select",
					defaultValue: "review_required",
					options: [
						{
							label: "Approuvé automatiquement (publiable)",
							value: "approved_auto",
						},
						{ label: "Révision requise", value: "review_required" },
						{ label: "Traitement manuel requis", value: "manual_required" },
					],
				},
				{
					name: "steps",
					label: "Étapes",
					type: "array",
					fields: [
						{
							name: "stepId",
							label: "ID étape",
							type: "text",
							required: true,
							admin: {
								description:
									"Pattern : step_xxx (ex : step_depot_dossier)",
							},
						},
						{
							name: "order",
							label: "Ordre d'exécution",
							type: "number",
							required: true,
							min: 1,
						},
						{
							name: "label",
							label: "Libellé",
							type: "text",
							required: true,
						},
						{
							name: "description",
							label: "Description",
							type: "textarea",
						},
						{
							name: "stepType",
							label: "Type d'étape",
							type: "select",
							required: true,
							options: [
								{ label: "Soumission", value: "submission" },
								{ label: "Vérification", value: "verification" },
								{ label: "Inspection", value: "inspection" },
								{ label: "Paiement", value: "payment" },
								{ label: "Instruction", value: "instruction" },
								{ label: "Approbation", value: "approval" },
								{ label: "Décision", value: "decision" },
								{ label: "Notification", value: "notification" },
								{ label: "Remise", value: "delivery" },
								{ label: "Archivage", value: "archival" },
								{ label: "Autre", value: "other" },
							],
						},
						{
							name: "actor",
							label: "Acteur",
							type: "select",
							options: [
								{ label: "Citoyen", value: "citizen" },
								{ label: "Entreprise", value: "business" },
								{ label: "Administration", value: "administration" },
								{ label: "Mixte", value: "mixed" },
								{ label: "Inconnu", value: "unknown" },
							],
						},
						{
							name: "channel",
							label: "Canal",
							type: "select",
							options: [
								{ label: "Présentiel", value: "offline" },
								{ label: "En ligne", value: "online" },
								{ label: "Hybride", value: "hybrid" },
								{ label: "Inconnu", value: "unknown" },
							],
						},
						{
							name: "requiresPayment",
							label: "Implique un paiement",
							type: "checkbox",
							defaultValue: false,
						},
						{
							name: "slaDays",
							label: "SLA (jours ouvrables)",
							type: "number",
							min: 0,
						},
						{
							name: "documentsIn",
							label: "Documents consommés à cette étape",
							type: "array",
							fields: [
								{
									name: "documentTypeCode",
									label: "Code document",
									type: "select",
									options: DOCUMENT_TYPE_CODES,
								},
							],
						},
						{
							name: "documentsOut",
							label: "Documents produits à cette étape",
							type: "array",
							fields: [
								{
									name: "documentTypeCode",
									label: "Code document",
									type: "select",
									options: DOCUMENT_TYPE_CODES,
								},
							],
						},
						{
							name: "responsibleUnit",
							label: "Unité responsable",
							type: "text",
						},
						{
							name: "confidence",
							label: "Confiance",
							type: "select",
							defaultValue: "manual_required",
							options: [
								{ label: "Auto — haute", value: "auto_high" },
								{ label: "Auto — moyenne", value: "auto_medium" },
								{ label: "Révision manuelle", value: "manual_required" },
							],
						},
					],
				},
			],
		},

		// ── Support Contact ───────────────────────────────────────────────────
		{
			name: "supportContact",
			label: "Contact du support",
			type: "group",
			admin: { position: "sidebar" },
			fields: [
				{ name: "phone", label: "Téléphone", type: "text" },
				{ name: "email", label: "Email", type: "email" },
				{
					name: "officeAddress",
					label: "Adresse physique",
					type: "textarea",
				},
			],
		},

		// ── Form link ─────────────────────────────────────────────────────────
		{
			name: "form",
			type: "relationship",
			relationTo: "forms",
			label: "Formulaire de soumission associé",
			admin: {
				position: "sidebar",
				description:
					"Super admins can see all forms; others see forms from their tenant.",
			},
		},

		// ── Metrics (computed by normalisation pipeline) ───────────────────────
		{
			name: "metrics",
			label: "Indicateurs qualité",
			type: "group",
			admin: {
				description:
					"Champs calculés par le pipeline de normalisation — ne pas modifier manuellement",
			},
			fields: [
				{
					name: "frictionScore",
					label: "Score de friction",
					type: "number",
					admin: { readOnly: true },
				},
				{
					name: "documentsCount",
					label: "Nombre de documents",
					type: "number",
					min: 0,
					admin: { readOnly: true },
				},
				{
					name: "manualRequiredShare",
					label: "Part d'étapes manuelles",
					type: "number",
					min: 0,
					max: 1,
					admin: {
						readOnly: true,
						description: "Valeur entre 0.0 et 1.0",
					},
				},
			],
		},
	],
	hooks: {
		beforeChange: [
			async ({ data, req }) => {
				if (data.department && data.tenant && req.payload) {
					try {
						const departmentId =
							typeof data.department === "object"
								? data.department.id
								: data.department;

						if (departmentId) {
							const department = await req.payload.findByID({
								collection: "departments",
								id: departmentId,
							});

							if (!department) {
								throw new Error(
									`Department with ID ${departmentId} not found`,
								);
							}

							const serviceTenantId =
								typeof data.tenant === "object"
									? data.tenant.id
									: data.tenant;

							const departmentTenantId =
								typeof department.tenant === "object"
									? department.tenant?.id
									: department.tenant;

							if (
								serviceTenantId &&
								departmentTenantId &&
								serviceTenantId !== departmentTenantId &&
								!req.user?.roles?.includes("admin")
							) {
								throw new Error(
									"Department must belong to the same tenant as the service",
								);
							}
						}
					} catch (error) {
						if (
							error instanceof Error &&
							(error.message.includes("Department") ||
								error.message.includes("not found"))
						) {
							throw error;
						}
					}
				}

				return data;
			},
		],
	},
};
