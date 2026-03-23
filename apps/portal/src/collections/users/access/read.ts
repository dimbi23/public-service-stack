import { getTenantFromCookie } from "@payloadcms/plugin-multi-tenant/utilities";
import type { Access, Where } from "payload";
import { isSuperAdmin } from "@/access/is-super-admin";
import { isAccessingSelf } from "@/collections/users/access/is-accessing-self";
import type { User } from "@/payload-types";
import { getCollectionIDType } from "@/utilities/get-collection-id-type";
import { getUserTenantIDs } from "@/utilities/get-user-tenant-id";

export const readAccess: Access<User> = ({ req, id }) => {
	if (!req?.user) {
		return false;
	}

	if (isAccessingSelf({ id, user: req.user })) {
		return true;
	}

	const superAdmin = isSuperAdmin(req.user);
	const selectedTenant = getTenantFromCookie(
		req.headers,
		getCollectionIDType({ payload: req.payload, collectionSlug: "tenants" })
	);
	const adminTenantAccessIDs = getUserTenantIDs(req.user, "tenant-admin");

	if (selectedTenant) {
		const hasTenantAccess = adminTenantAccessIDs.some(
			(id) => id === selectedTenant
		);
		if (superAdmin || hasTenantAccess) {
			return {
				"tenants.tenant": {
					equals: selectedTenant,
				},
			};
		}
	}

	if (superAdmin) {
		return true;
	}

	return {
		or: [
			{
				id: {
					equals: req.user.id,
				},
			},
			{
				"tenants.tenant": {
					in: adminTenantAccessIDs,
				},
			},
		],
	} as Where;
};
