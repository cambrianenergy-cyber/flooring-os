export type NavItem = {
  label: string;
  href: string;
  group: "workflow" | "other" | "founder";
  founderOnly?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  // Workflow
  { label: "Workflow", href: "/dashboard", group: "workflow" },
  { label: "Estimates", href: "/dashboard/estimates", group: "workflow" },
  { label: "Jobs", href: "/dashboard/jobs", group: "workflow" },
  { label: "Invoices", href: "/dashboard/invoices", group: "workflow" },
  { label: "Reviews", href: "/dashboard/reviews", group: "workflow" },
  { label: "Leads", href: "/dashboard/leads", group: "workflow" },
  { label: "Schedule", href: "/dashboard/schedule", group: "workflow" },
  { label: "Change Orders", href: "/dashboard/change-orders", group: "workflow" },

  // Other
  { label: "Contacts", href: "/dashboard/contacts", group: "other" },
  { label: "Analytics", href: "/dashboard/analytics", group: "other" },
  { label: "Settings", href: "/dashboard/settings", group: "other" },

  // Founder Essentials
  { label: "Team & Roles", href: "/dashboard/founder/team", group: "founder", founderOnly: true },
  { label: "Audit Log", href: "/dashboard/founder/audit", group: "founder", founderOnly: true },
  { label: "Policy Engine", href: "/dashboard/founder/policies", group: "founder", founderOnly: true },
  { label: "Integrations", href: "/dashboard/founder/integrations", group: "founder", founderOnly: true },
  { label: "Risk & Compliance", href: "/dashboard/founder/risk", group: "founder", founderOnly: true },
];
