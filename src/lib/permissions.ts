import type { Role } from "@/types";

export type Permission =
  | "donation:create"
  | "donation:readOwn"
  | "donation:readAll"
  | "donation:updateOwn"
  | "donation:updateAny"
  | "donation:cancel"
  | "request:manage"
  | "donor:readAll"
  | "moderator:manage"
  | "campaign:manage"
  | "report:admin"
  | "settings:manage";

const MATRIX: Record<Role, Permission[]> = {
  ADMIN: [
    "donation:readAll",
    "donation:updateAny",
    "donation:cancel",
    "request:manage",
    "donor:readAll",
    "moderator:manage",
    "campaign:manage",
    "report:admin",
    "settings:manage",
  ],
  MODERATOR: ["donation:create", "donation:readOwn", "donation:updateOwn", "request:manage"],
};

export function hasPermission(role: Role, perm: Permission) {
  return MATRIX[role].includes(perm);
}
