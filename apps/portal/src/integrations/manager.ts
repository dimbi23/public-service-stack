import { RestIntegrationStrategy } from "./strategies/rest.strategy";
import type {
	IntegrationConfig,
	IntegrationStrategy,
	SubmissionData,
} from "./types";

export class IntegrationManager {
	private readonly strategies: Map<string, IntegrationStrategy> = new Map();
	private static instance: IntegrationManager;

	private constructor() {
		// Register default strategies
		this.registerStrategy(new RestIntegrationStrategy());
	}

	static getInstance(): IntegrationManager {
		if (!IntegrationManager.instance) {
			IntegrationManager.instance = new IntegrationManager();
		}
		return IntegrationManager.instance;
	}

	registerStrategy(strategy: IntegrationStrategy): void {
		this.strategies.set(strategy.name, strategy);
	}

	async execute(
		data: SubmissionData,
		config: IntegrationConfig
	): Promise<void> {
		const strategy = this.strategies.get(config.type);

		if (!strategy) {
			throw new Error(`Integration strategy '${config.type}' not found`);
		}

		await strategy.execute(data, config);
	}
}
