import type { Tenant } from "@/payload-types";

export function resolveAgencyRoute(agency: Tenant, serviceSlug: string) {
	const base = agency.baseUrl;
	const path = `/api/submissions/${serviceSlug}`;
	const auth = agency.auth;
	return {
		url: `${base}${path}`,
		auth,
		timeoutMs: agency.retries?.timeout,
		retries: agency.retries?.max,
	};
}
