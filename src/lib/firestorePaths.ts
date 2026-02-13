export function wsPath(workspaceId: string) {
  return `workspaces/${workspaceId}`;
}

export function col(workspaceId: string, name: string) {
  return `${wsPath(workspaceId)}/${name}`;
}

export function docPath(workspaceId: string, collection: string, id: string) {
  return `${col(workspaceId, collection)}/${id}`;
}
