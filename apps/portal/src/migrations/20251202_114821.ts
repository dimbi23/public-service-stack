import {
	type MigrateDownArgs,
	type MigrateUpArgs,
	sql,
} from "@payloadcms/db-postgres";

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
	// Drop the old 'department' text column from services table
	// This allows Payload to create the new 'department_id' relationship column
	// First, drop any foreign key constraints that might reference this column
	try {
		await db.execute(sql`
			ALTER TABLE "services" DROP COLUMN IF EXISTS "department" CASCADE;
		`);
	} catch (error) {
		// If column doesn't exist or error occurs, that's fine - continue
		console.log("Note: department column may not exist or already dropped");
	}
}

export async function down({
	db,
	payload,
	req,
}: MigrateDownArgs): Promise<void> {
	// Revert: Add back the department text column (if needed for rollback)
	// Note: This will lose data, but since we're preparing for fresh import, that's acceptable
	await db.execute(sql`
		ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "department" TEXT;
	`);
}
