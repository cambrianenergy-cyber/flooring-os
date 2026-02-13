import React from "react";

// Placeholder components for shell structure
// These props should be passed from the page using the layout
// For demo, fallback to local state and localStorage
function FounderViewToggle() {
  const [viewMode, setViewMode] = React.useState(() => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      const param = url.searchParams.get("view");
      if (param === "founder" || param === "user") return param;
      const local = window.localStorage.getItem("squareos_viewMode");
      if (local === "founder" || local === "user") return local;
    }
    return "founder";
  });
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("squareos_viewMode", viewMode);
      const url = new URL(window.location.href);
      url.searchParams.set("view", viewMode);
      window.history.replaceState({}, "", url.toString());
    }
  }, [viewMode]);
  return (
    <div className="mr-4 flex gap-1 items-center">
      <button
        className={`px-2 py-1 rounded ${viewMode === "founder" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
        onClick={() => setViewMode("founder")}
      >
        Founder
      </button>
      <button
        className={`px-2 py-1 rounded ${viewMode === "user" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
        onClick={() => setViewMode("user")}
      >
        User
      </button>
    </div>
  );
}

function WorkspaceScopePicker() {
  // For demo, just a select. In real app, get workspaces from context/props
  const [scope, setScope] = React.useState("all");
  const workspaces = [
    { id: "all", name: "All Workspaces" },
    { id: "ws1", name: "Workspace 1" },
    { id: "ws2", name: "Workspace 2" },
  ];
  return (
    <select
      className="mr-4 border rounded px-2 py-1"
      value={scope}
      onChange={(e) => setScope(e.target.value)}
    >
      {workspaces.map((ws) => (
        <option key={ws.id} value={ws.id}>
          {ws.name}
        </option>
      ))}
    </select>
  );
}

function DateRangePicker() {
  const [range, setRange] = React.useState("30d");
  const options = ["7d", "30d", "90d", "YTD"];
  return (
    <div className="mr-4 flex gap-1">
      {options.map((opt) => (
        <button
          key={opt}
          className={`px-2 py-1 rounded ${range === opt ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
          onClick={() => setRange(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function QuickActionsMenu() {
  return (
    <div className="mr-4 flex gap-2">
      <button className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded shadow">
        Billing
      </button>
      <button className="bg-blue-100 text-blue-800 px-3 py-1 rounded shadow">
        DocuSign
      </button>
      <button className="bg-red-100 text-red-800 px-3 py-1 rounded shadow">
        System
      </button>
    </div>
  );
}

function UserMenu() {
  // For demo, just a dropdown
  const [open, setOpen] = React.useState(false);
  return (
    <div className="ml-auto relative">
      <button
        className="px-3 py-1 rounded bg-gray-200 text-gray-700"
        onClick={() => setOpen((o) => !o)}
      >
        User ▾
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow z-50">
          <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
            Profile
          </div>
          <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
            Sign Out
          </div>
        </div>
      )}
    </div>
  );
}

function FounderTopBar() {
  return (
    <header className="w-full h-12 bg-white shadow flex items-center px-4 gap-2">
      <FounderViewToggle />
      <WorkspaceScopePicker />
      <DateRangePicker />
      <QuickActionsMenu />
      <UserMenu />
    </header>
  );
}

function FounderSideNav() {
  const navItems = [
    { label: "Overview", href: "/founder" },
    { label: "Workspaces", href: "/founder/workspaces" },
    { label: "Revenue", href: "/founder/revenue" },
    { label: "Sales Ops", href: "/founder/sales-ops" },
    { label: "Contracts", href: "/founder/contracts" },
    { label: "Billing", href: "/founder/billing" },
    { label: "Agents", href: "/founder/agents" },
    { label: "System Health", href: "/founder/system-health" },
    { label: "Admin Tools", href: "/founder/admin-tools" },
  ];
  return (
    <nav className="w-56 bg-gray-50 h-full shadow-inner p-4">
      <ul className="space-y-2">
        {navItems.map((item) => (
          <li key={item.href}>
            <a
              href={item.href}
              className="block px-3 py-2 rounded hover:bg-blue-100 text-gray-800 font-medium"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function FounderContentArea({ children }: { children: React.ReactNode }) {
  return <main className="flex-1 p-6 overflow-auto">{children}</main>;
}

function ToastHost() {
  return <div id="toast-host" className="fixed bottom-4 right-4 z-50" />;
}

type ErrorBoundaryProps = { children: React.ReactNode };
type ErrorBoundaryState = { error: Error | null };

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(_: Error, __: React.ErrorInfo): void {
    // You can log the error to an error reporting service here
    // console.error(error, errorInfo);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="p-8 text-red-700">
          Error: {this.state.error.message}
        </div>
      );
    }
    return this.props.children;
  }
}

function GlobalErrorBoundary({ children }: { children: React.ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}

export default function FounderShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GlobalErrorBoundary>
      <div className="flex flex-col min-h-screen bg-gray-100">
        <FounderTopBar />
        <div className="flex flex-1">
          <FounderSideNav />
          <FounderContentArea>{children}</FounderContentArea>
        </div>
        <ToastHost />
      </div>
    </GlobalErrorBoundary>
  );
}
