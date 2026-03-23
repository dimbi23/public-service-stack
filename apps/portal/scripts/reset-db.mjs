#!/usr/bin/env node
import * as dotenv from "dotenv";
import { Client } from "pg";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
	console.error("DATABASE_URL environment variable is not set");
	process.exit(1);
}

// Extract database name from connection string
const url = new URL(DATABASE_URL);
const dbName = url.pathname.slice(1); // Remove leading '/'
const adminUrl = DATABASE_URL.replace(`/${dbName}`, "/postgres"); // Connect to postgres database to drop/create

const client = new Client({ connectionString: adminUrl });

try {
	await client.connect();
	console.log("Connected to PostgreSQL");

	// Terminate existing connections to the database
	console.log(`Terminating connections to database: ${dbName}`);
	await client.query(
		`
    SELECT pg_terminate_backend(pg_stat_activity.pid)
    FROM pg_stat_activity
    WHERE pg_stat_activity.datname = $1
      AND pid <> pg_backend_pid();
  `,
		[dbName]
	);

	// Drop the database
	console.log(`Dropping database: ${dbName}`);
	await client.query(`DROP DATABASE IF EXISTS "${dbName}";`);

	// Create the database
	console.log(`Creating database: ${dbName}`);
	await client.query(`CREATE DATABASE "${dbName}";`);

	console.log("✅ Database reset successfully!");
	console.log(
		"You can now start the dev server and Payload will create the schema."
	);
} catch (error) {
	console.error("Error resetting database:", error.message);
	process.exit(1);
} finally {
	await client.end();
}
