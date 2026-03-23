import { getBearerToken } from "@/utilities/get-bearer-token";

export const callAgency = async ({
	url,
	auth,
	body,
	timeoutMs,
	idempotencyKey,
}: any) => {
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
		"Idempotency-Key": idempotencyKey,
	};

	const token = await getBearerToken(auth.oauth);
	headers.Authorization = `Bearer ${token}`;

	const controller = new AbortController();
	const t = setTimeout(() => controller.abort(), timeoutMs || 8000);

	try {
		const res = await fetch(url, {
			method: "POST",
			headers,
			body: JSON.stringify(body),
			signal: controller.signal,
		});
		clearTimeout(t);

		return await res.json().catch(() => ({}));
	} catch (e: any) {
		clearTimeout(t);
		throw new Error(`Agency ${e.status}`);
	}
};
