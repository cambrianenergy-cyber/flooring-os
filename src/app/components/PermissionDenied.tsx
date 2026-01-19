import React from "react";

export function PermissionDenied({ message = "You do not have permission to access this resource." }) {
  return (
    <div className="p-6 text-center text-red-700 bg-red-50 border border-red-200 rounded">
      <div className="text-xl font-bold mb-2">Permission Denied</div>
      <div>{message}</div>
    </div>
  );
}
