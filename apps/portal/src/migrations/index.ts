import * as migration_20250822_182625 from "./20250822_182625";
import * as migration_20251202_114821 from "./20251202_114821";

export const migrations = [
	{
		up: migration_20250822_182625.up,
		down: migration_20250822_182625.down,
		name: "20250822_182625",
	},
	{
		up: migration_20251202_114821.up,
		down: migration_20251202_114821.down,
		name: "20251202_114821",
	},
];
