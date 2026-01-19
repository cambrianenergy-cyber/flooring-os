// src/lib/roles.ts
// Role and permission definitions for the flooring SaaS app

export type UserRole =
  | "owner"
  | "admin"
  | "manager"
  | "sales"
  | "installer"
  | "warehouse"
  | "accounting";

export const ROLE_LABELS: Record<UserRole, string> = {
  owner: "Owner/Admin",
  admin: "Admin",
  manager: "Manager",
  sales: "Sales Rep",
  installer: "Installer/Crew",
  warehouse: "Warehouse/Runner",
  accounting: "Accounting",
};

// Permissions for each role
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  owner: [
    "all",
    "settings",
    "kpi",
    "financials",
    "jobs",
    "scheduling",
    "approvals",
    "team_performance",
    "leads",
    "measures",
    "estimates",
    "contracts",
    "followups",
    "photos",
    "punchlist",
    "timelogs",
    "picklists",
    "deliveries",
    "invoices",
    "payments",
    "margins",
    "commissions",
  ],
  admin: [
    "all",
    "settings",
    "kpi",
    "financials",
    "jobs",
    "scheduling",
    "approvals",
    "team_performance",
    "leads",
    "measures",
    "estimates",
    "contracts",
    "followups",
    "photos",
    "punchlist",
    "timelogs",
    "picklists",
    "deliveries",
    "invoices",
    "payments",
    "margins",
    "commissions",
  ],
  manager: [
    "jobs",
    "scheduling",
    "approvals",
    "team_performance",
  ],
  sales: [
    "leads",
    "measures",
    "estimates",
    "contracts",
    "followups",
  ],
  installer: [
    "schedules",
    "checklists",
    "photos",
    "punchlist",
    "timelogs",
  ],
  warehouse: [
    "picklists",
    "accessories",
    "deliveries",
  ],
  accounting: [
    "invoices",
    "payments",
    "margins",
    "commissions",
  ],
};

// Utility: check if a user has a permission
export function hasPermission(role: UserRole, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[role];
  return perms.includes("all") || perms.includes(permission);
}
