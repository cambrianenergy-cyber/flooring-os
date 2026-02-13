import { useFounderDocusignQueue } from "@/hooks/founderDataHooks";
import React from "react";

export function DocusignHealthSummaryBar({ queue }: { queue: any[] }) {
  // Count by status (e.g., 'stuck', 'error', etc.)
  const counts = queue.reduce(
    (acc, item) => {
      const status = item.status || "unknown";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  return (
    <div className="flex gap-4 mb-2">
      {Object.entries(counts).map(([status, count]) => (
        <div key={status} className="flex flex-col items-center">
          <span className="font-bold text-sm">{Number(count)}</span>
          <span className="text-xs text-gray-500">{status}</span>
        </div>
      ))}
    </div>
  );
}

export function DocusignQueueMiniList({ queue }: { queue: any[] }) {
  if (!queue.length)
    return <div className="text-xs text-gray-400">No DocuSign issues.</div>;
  return (
    <ul className="text-xs list-disc ml-5">
      {queue.map((item) => (
        <li key={item.id} className="mb-1">
          {item.description || item.reason || JSON.stringify(item)}
        </li>
      ))}
    </ul>
  );
}

export function PanelFooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a href={href} className="block mt-2 text-blue-600 underline text-xs">
      {children}
    </a>
  );
}

export function DocusignHealthPanel({ founderId }: { founderId: string }) {
  const queue = useFounderDocusignQueue(founderId, { limitNum: 10 });
  return (
    <div className="bg-white rounded shadow p-4 mb-4">
      <div className="font-semibold mb-2">DocuSign Health</div>
      <DocusignHealthSummaryBar queue={queue} />
      <DocusignQueueMiniList queue={queue} />
      <PanelFooterLink href="/founder/contracts">
        View all DocuSign issues
      </PanelFooterLink>
    </div>
  );
}
