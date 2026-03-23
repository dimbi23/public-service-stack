/**
 * Type for Lexical rich text structure from Payload
 */
type LexicalRichText =
	| {
			root: {
				type: string;
				children: {
					type: string;
					version: number;
					[key: string]: unknown;
				}[];
				direction: ("ltr" | "rtl") | null;
				format:
					| "left"
					| "start"
					| "center"
					| "right"
					| "end"
					| "justify"
					| "";
				indent: number;
				version: number;
			};
			[key: string]: unknown;
	  }
	| null
	| undefined;

/**
 * Extracts plain text from Lexical rich text JSON
 */
export function lexicalToPlainText(lexical: LexicalRichText): string {
	if (!(lexical && lexical.root)) {
		return "";
	}

	const extractText = (node: {
		type?: string;
		children?: unknown[];
		text?: string;
		[key: string]: unknown;
	}): string => {
		if (node.text) {
			return String(node.text);
		}

		if (node.children && Array.isArray(node.children)) {
			return node.children
				.map((child) => extractText(child as typeof node))
				.join("");
		}

		return "";
	};

	return extractText(lexical.root);
}

/**
 * Converts Lexical rich text to HTML
 * This is a basic implementation - can be enhanced with proper HTML rendering
 */
export function lexicalToHTML(lexical: LexicalRichText): string {
	if (!(lexical && lexical.root)) {
		return "";
	}

	const renderNode = (node: {
		type?: string;
		children?: unknown[];
		text?: string;
		tag?: string;
		format?: number | string;
		[key: string]: unknown;
	}): string => {
		if (node.text) {
			let text = String(node.text);
			// Basic formatting (format is a number for text nodes)
			if (node.format && typeof node.format === "number") {
				const format = node.format;
				if (format & 1) text = `<strong>${text}</strong>`; // Bold
				if (format & 2) text = `<em>${text}</em>`; // Italic
				if (format & 4) text = `<u>${text}</u>`; // Underline
			}
			return text;
		}

		if (node.children && Array.isArray(node.children)) {
			const childrenHTML = node.children
				.map((child) => renderNode(child as typeof node))
				.join("");

			const tag = node.tag || node.type || "div";
			return `<${tag}>${childrenHTML}</${tag}>`;
		}

		return "";
	};

	return renderNode(lexical.root);
}
