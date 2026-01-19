// Schema for workspace_members collection
export interface WorkspaceMember {
  workspaceId: string;
  uid: string;
  role: string;
  status: string;
  invitedEmail?: string;
  createdAt?: string;
  updatedAt?: string;
}