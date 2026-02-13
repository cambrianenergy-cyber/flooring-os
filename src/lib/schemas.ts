export type Role = "founder" | "owner" | "admin" | "manager" | "rep" | "viewer";

export type UserDoc = {
  displayName: string;
  email: string;
  isFounder: boolean;
  primaryWorkspaceId?: string;
  createdAt: Date | string | number;
};

export type WorkspaceDoc = {
  name: string;
  industry: "flooring" | string;
  ownerUserId: string;
  createdAt: Date | string | number;
};

export type WorkspaceMemberDoc = {
  workspaceId: string;
  userId: string;
  role: Role;
  createdAt: Date | string | number;
};

export type BillingDoc = {
  workspaceId: string;
  planId: "free" | "starter" | "pro" | "enterprise";
  isActive: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodEnd?: Date | string | number;
  updatedAt: Date | string | number;
};

export type CustomerDoc = {
  workspaceId: string;
  name: string;
  phones?: string[];
  emails?: string[];
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  createdAt: Date | string | number;
};

export type ProductDoc = {
  workspaceId: string;
  name: string;
  sku?: string;
  unit?: "sqft" | "each" | "box" | string;
  cost?: number;
  price?: number;
  active: boolean;
  createdAt: Date | string | number;
};

export type EstimateDoc = {
  workspaceId: string;
  customerId: string;
  status: "draft" | "sent" | "signed" | "won" | "lost";
  rooms: Array<{
    name: string;
    sqft: number;
    productId?: string;
    materialRate?: number;
    laborRate?: number;
  }>;
  pricing: {
    minTotal: number;
    maxTotal: number;
    selectedTotal: number;
    commissionPct: number; // 0.04 - 0.10
    enterpriseRequested?: boolean;
    enterpriseApproved?: boolean;
    enterpriseApprovedByUserId?: string;
    enterpriseApprovedAt?: Date | string | number;
  };
  updatedAt: Date | string | number;
  createdAt: Date | string | number;
};

export type AppointmentDoc = {
  workspaceId: string;
  title: string;
  customerId?: string;
  assignedToUserId: string;
  startAt: Date | string | number;
  endAt: Date | string | number;
  location?: string;
  status: "scheduled" | "enroute" | "arrived" | "completed" | "canceled";
  createdAt: Date | string | number;
  updatedAt: Date | string | number;
};

export type AuditLogDoc = {
  workspaceId: string;
  actorUserId: string;
  action: string; // e.g. "estimate.create"
  targetType?: string; // "estimate"
  targetId?: string;
  createdAt: Date | string | number;
  meta?: Record<string, unknown>;
};
