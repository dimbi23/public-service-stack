interface OAuth {
	tokenURL: string;
	clientId: string;
	clientSecret: string;
	scope: string;
}

interface TokenCacheEntry {
	token: string;
	expiresAt: number;
}

interface TokenResponse {
	access_token: string;
	expires_in?: number;
	token_type?: string;
}

// In-memory token cache (tenant URL as key)
const tokenCache = new Map<string, TokenCacheEntry>();

export const getBearerToken = async (oauth: OAuth): Promise<string> => {
	const cacheKey = `${oauth.tokenURL}:${oauth.clientId}`;

	// Check cache first
	const cached = tokenCache.get(cacheKey);
	if (cached && cached.expiresAt > Date.now()) {
		return cached.token;
	}

	// Fetch new token
	const res = await fetch(oauth.tokenURL, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			grant_type: "client_credentials",
			client_id: oauth.clientId,
			client_secret: oauth.clientSecret,
			scope: oauth.scope || "",
		}),
	});

	if (!res.ok) {
		const errorText = await res.text().catch(() => "Unknown error");
		throw new Error(
			`OAuth token failed: ${res.status} ${res.statusText} - ${errorText}`
		);
	}

	const json = (await res.json()) as TokenResponse;

	if (!json.access_token) {
		throw new Error("OAuth response missing access_token");
	}

	// Cache the token (default 1 hour if expires_in not provided, with 5 minute buffer)
	const expiresIn = json.expires_in || 3600;
	const expiresAt = Date.now() + (expiresIn - 300) * 1000; // 5 min buffer

	tokenCache.set(cacheKey, {
		token: json.access_token,
		expiresAt,
	});

	return json.access_token;
};
