import Papa from "papaparse";

import * as XLSX from "xlsx";
import type { Service } from "@/payload-types";

export interface ParsedServiceRow {
	rowNumber: number;
	data: Partial<Service>;
	errors: string[];
}

export interface ParseResult {
	rows: ParsedServiceRow[];
	totalRows: number;
	validRows: number;
	invalidRows: number;
}

/**
 * Parse Excel or CSV file and extract service data
 */
export async function parseServiceCatalog(
	fileBuffer: Buffer,
	fileName: string
): Promise<ParseResult> {
	const fileExtension = fileName.split(".").pop()?.toLowerCase();

	if (fileExtension === "csv") {
		return parseCSV(fileBuffer);
	}
	if (["xlsx", "xls"].includes(fileExtension || "")) {
		return parseExcel(fileBuffer);
	}
	throw new Error(
		`Unsupported file format: ${fileExtension}. Supported formats: CSV, XLSX, XLS`
	);
}

/**
 * Parse CSV file
 */
function parseCSV(fileBuffer: Buffer): ParseResult {
	const csvContent = fileBuffer.toString("utf-8");
	const parseResult = Papa.parse(csvContent, {
		header: true,
		skipEmptyLines: true,
		transformHeader: (header) => header.trim(),
	});

	const rows: ParsedServiceRow[] = [];
	let validRows = 0;
	let invalidRows = 0;

	parseResult.data.forEach((row: any, index: number) => {
		const rowNumber = index + 2; // +2 because index is 0-based and we skip header
		const parsed = parseServiceRow(row, rowNumber);
		rows.push(parsed);

		if (parsed.errors.length === 0) {
			validRows++;
		} else {
			invalidRows++;
		}
	});

	return {
		rows,
		totalRows: rows.length,
		validRows,
		invalidRows,
	};
}

/**
 * Parse Excel file
 */
function parseExcel(fileBuffer: Buffer): ParseResult {
	const workbook = XLSX.read(fileBuffer, { type: "buffer" });
	const firstSheetName = workbook.SheetNames[0];
	const worksheet = workbook.Sheets[firstSheetName];

	// Convert to JSON with header row
	const jsonData = XLSX.utils.sheet_to_json(worksheet, {
		raw: false,
		defval: "",
	});

	const rows: ParsedServiceRow[] = [];
	let validRows = 0;
	let invalidRows = 0;

	jsonData.forEach((row: any, index: number) => {
		const rowNumber = index + 2; // +2 because index is 0-based and we skip header
		const parsed = parseServiceRow(row, rowNumber);
		rows.push(parsed);

		if (parsed.errors.length === 0) {
			validRows++;
		} else {
			invalidRows++;
		}
	});

	return {
		rows,
		totalRows: rows.length,
		validRows,
		invalidRows,
	};
}

/**
 * Parse a single row of service data
 */
function parseServiceRow(row: any, rowNumber: number): ParsedServiceRow {
	const errors: string[] = [];
	const data: Partial<Service> = {};

	// Required fields
	if (!(row.SERVICE_NAME || row.ID)) {
		errors.push("SERVICE_NAME or ID is required");
	}

	// Service name (required)
	if (row.SERVICE_NAME) {
		data.name = String(row.SERVICE_NAME).trim();
	} else if (row.ID) {
		// Fallback to ID if name is missing
		data.name = String(row.ID).trim();
	}

	// Slug - will be auto-generated from name if not provided
	if (row.ID) {
		const idSlug = String(row.ID)
			.toLowerCase()
			.replace(/[^\w-]+/g, "-");
		// We'll let the hook generate the slug, but we can use ID as a reference
	}

	// Service type (required)
	if (row.SERVICE_TYPE) {
		const type = String(row.SERVICE_TYPE).trim().toUpperCase();
		if (["G2C", "G2B", "G2G"].includes(type)) {
			data.type = type as "G2C" | "G2B" | "G2G";
		} else {
			errors.push(
				`Invalid SERVICE_TYPE: ${type}. Must be G2C, G2B, or G2G`
			);
		}
	} else {
		errors.push("SERVICE_TYPE is required");
	}

	// Tenant (Ministry) - column 3, might be named "2-ENTITE MERE" (original format) or "TENANT" (template format)
	// Try multiple possible column names
	const tenantName =
		row["TENANT"] ||
		row["2-ENTITE MERE"] ||
		row["ENTITE MERE"] ||
		row["MINISTRY"] ||
		row["MINISTERE"] ||
		row["ENTITE"];

	(data as any).tenantName = tenantName ? String(tenantName).trim() : null;

	// Department - will be resolved later, store the name for now
	// We'll store it in a temporary field that the job will process
	(data as any).departmentName = row.DEPARTMENT
		? String(row.DEPARTMENT).trim()
		: null;

	if (!(data as any).departmentName) {
		errors.push("DEPARTMENT is required");
	}

	// Category - will be resolved later, store the name for now
	// We'll store it in a temporary field that the job will process
	(data as any).categoryName = row.CATEGORY
		? String(row.CATEGORY).trim()
		: null;

	// Description (rich text)
	if (row.DESCRIPTION) {
		const description = String(row.DESCRIPTION).trim();
		// Convert plain text to Lexical format
		data.description = {
			root: {
				type: "root",
				children: [
					{
						type: "paragraph",
						children: [
							{
								type: "text",
								text: description,
								format: 0,
								style: "",
								mode: "normal",
								version: 1,
							},
						],
						direction: "ltr",
						format: "",
						indent: 0,
						version: 1,
					},
				],
				direction: "ltr",
				format: "",
				indent: 0,
				version: 1,
			},
		};
	}

	// Legal text - append to description if exists
	if (row.LEGAL_TEXT && data.description) {
		const legalText = String(row.LEGAL_TEXT).trim();
		const existingText =
			data.description.root.children[0]?.children[0]?.text || "";
		if (existingText) {
			data.description.root.children[0].children[0].text = `${existingText}\n\n${legalText}`;
		}
	}

	// Costs
	if (row.COST_MIN || row.COST_MAX) {
		const costs: { cost: number }[] = [];
		const costMin = Number.parseFloat(String(row.COST_MIN || 0));
		const costMax = Number.parseFloat(String(row.COST_MAX || 0));

		if (costMin > 0) {
			costs.push({ cost: costMin });
		}
		if (costMax > 0 && costMax !== costMin) {
			costs.push({ cost: costMax });
		}

		if (costs.length > 0) {
			data.costs = costs;
		}
	}

	// Documents required
	if (row.DOCUMENTS) {
		const documents = String(row.DOCUMENTS)
			.split("|")
			.map((doc) => doc.trim())
			.filter((doc) => doc.length > 0)
			.map((doc) => ({ documentName: doc }));

		if (documents.length > 0) {
			data.documentsRequired = documents;
		}
	}

	// Processing time
	if (row.PROCESSING_TIME) {
		data.processingTime = String(row.PROCESSING_TIME).trim();
	}

	// Steps
	if (row.STEPS) {
		const steps = String(row.STEPS)
			.split("|")
			.map((step) => step.trim())
			.filter((step) => step.length > 0)
			.map((step) => ({ stepDescription: step }));

		if (steps.length > 0) {
			data.steps = steps;
		}
	}

	// Access mode
	if (row.ACCESS_MODE) {
		const access = String(row.ACCESS_MODE).trim().toLowerCase();
		if (["online", "offline", "hybrid"].includes(access)) {
			data.access = access as "online" | "offline" | "hybrid";
		}
	}

	// Status
	if (row.STATUS) {
		const status = String(row.STATUS).trim().toLowerCase();
		if (["active", "upcoming", "retired"].includes(status)) {
			data.status = status as "active" | "upcoming" | "retired";
		}
	} else {
		// Default to active
		data.status = "active";
	}

	// Audience
	if (row.AUDIENCE) {
		const audience = String(row.AUDIENCE)
			.split(",")
			.map((a) => a.trim().toLowerCase())
			.filter((a) =>
				["citizens", "businesses", "residents", "tourists"].includes(a)
			);

		if (audience.length > 0) {
			data.audience = audience as Array<
				"citizens" | "businesses" | "residents" | "tourists"
			>;
		}
	}

	// Support contact (email)
	if (row.SUPPORT_CONTACT) {
		const email = String(row.SUPPORT_CONTACT).trim();
		// Basic email validation
		if (email.includes("@") && email.includes(".")) {
			data.supportContact = email;
		}
	}

	// Eligibility
	if (row.ELIGIBILITY) {
		data.eligibility = String(row.ELIGIBILITY).trim();
	}

	return {
		rowNumber,
		data,
		errors,
	};
}
