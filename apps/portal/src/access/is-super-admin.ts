import type { Access } from "payload";
import type { User } from "@/payload-types";

export const isSuperAdminAccess: Access = ({ req }): boolean =>
	isSuperAdmin(req.user);

export const isSuperAdmin = (user: User | null): boolean =>
	Boolean(user?.roles?.includes("admin"));
