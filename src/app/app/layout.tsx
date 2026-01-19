import AuthGuard from "@/components/AuthGuard";
import { SidebarNav } from "@/app/components/SidebarNav";
import { WorkflowProvider } from "../../lib/WorkflowProvider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  // Gate KPI strip until real data is provided
  const showKpiStrip = false;

  return (
    <AuthGuard>
      <WorkflowProvider>
        <div className="min-h-screen flex flex-col md:flex-row bg-page-bg">
          <SidebarNav />
          <main className="app-shell flex-1 p-6 bg-page-bg text-foreground">{children}</main>
          {showKpiStrip && (
            <aside className="hidden lg:block w-72 border-l bg-page-surface border-dark-border p-6">
              <div className="rounded-xl shadow-lg bg-page-panel border border-dark-muted p-4">
                <h2 className="text-xl font-bold mb-4 text-accent">KPI</h2>
                <ul className="space-y-3 text-base">
                  <li><span className="font-semibold text-foreground">Today's appointments:</span> <span className="text-accent"></span></li>
                  <li><span className="font-semibold text-foreground">Open estimates:</span> <span className="text-accent"></span></li>
                  <li><span className="font-semibold text-foreground">Close rate (7/30 days):</span> <span className="text-accent"></span></li>
                  <li><span className="font-semibold text-foreground">Avg ticket:</span> <span className="text-accent"></span></li>
                  <li><span className="font-semibold text-foreground">Gross margin:</span> <span className="text-accent"></span></li>
                  <li><span className="font-semibold text-foreground">Install backlog days:</span> <span className="text-accent"></span></li>
                  <li><span className="font-semibold text-foreground">Callbacks / rework %:</span> <span className="text-accent"></span></li>
                  <li><span className="font-semibold text-foreground">Review requests sent / received:</span> <span className="text-accent"></span></li>
                </ul>
              </div>
            </aside>
          )}
        </div>
      </WorkflowProvider>
    </AuthGuard>
  );
}
