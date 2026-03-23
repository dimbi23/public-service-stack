import path from "node:path";
import { fileURLToPath } from "node:url";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { payloadCloudPlugin } from "@payloadcms/payload-cloud";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { buildConfig } from "payload";
import sharp from "sharp";
import { Applications } from "@/collections/Applications";
import { Categories } from "@/collections/Categories";
import { Departments } from "@/collections/Departments";
import { ExecutionMappings } from "@/collections/ExecutionMappings";
import { Services } from "@/collections/Services";
import { Tenants } from "@/collections/Tenants";
import { applicationBySubmissionEndpoint } from "@/endpoints/application-by-submission";
import { serviceImportStatusEndpoint } from "@/endpoints/service-import-status";
import { trackApplicationEndpoint } from "@/endpoints/track-application";
import { trackServiceViewEndpoint } from "@/endpoints/track-service-view";
import { updateApplicationStatusEndpoint } from "@/endpoints/update-application-status";
import { uploadServicesEndpoint } from "@/endpoints/upload-services";
import { plugins } from "@/plugins";

import { Media } from "./collections/Media";
import { ServiceViews } from "./collections/ServiceViews";
import { Users } from "./collections/users/Users";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
	admin: {
		user: Users.slug,
		importMap: {
			baseDir: path.resolve(dirname),
		},
	},
	//cors: ['http://localhost:3000/admin']
	collections: [
		Users,
		Media,
		Tenants,
		Departments,
		Services,
		ExecutionMappings,
		Categories,
		Applications,
		ServiceViews,
	],
	editor: lexicalEditor(),
	secret: process.env.PAYLOAD_SECRET ?? "",
	typescript: {
		outputFile: path.resolve(dirname, "payload-types.ts"),
	},
	db: postgresAdapter({
		pool: {
			connectionString: process.env.DATABASE_URL,
		},
	}),
	sharp,
	endpoints: [
		trackApplicationEndpoint,
		trackServiceViewEndpoint,
		applicationBySubmissionEndpoint,
		updateApplicationStatusEndpoint,
		uploadServicesEndpoint,
		serviceImportStatusEndpoint,
	],
	plugins: [payloadCloudPlugin(), ...plugins],
});
