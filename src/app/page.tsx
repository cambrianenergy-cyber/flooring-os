

"use client";
import Link from "next/link";

// Utility to sanitize dynamic data for JSX
function sanitize(str: string): string {
  return str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Minimal, valid Next.js page component
export default function Home() {
  // Example dynamic data
  const dynamicTitle = sanitize("Welcome to <Flooring OS>");
  const dynamicDescription = sanitize("All your flooring projects in one place.");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-page-bg text-foreground">
      <nav className="w-full flex justify-center py-4 mb-8 bg-page-surface shadow">
        <ul className="flex gap-6">
          <li>
            <Link href="/" className="text-lg font-semibold text-accent hover:underline">Home</Link>
          </li>
          <li>
            <Link href="/dashboard" className="text-lg font-semibold text-accent hover:underline">Dashboard</Link>
          </li>
        </ul>
      </nav>
      <div className="rounded-lg bg-page-surface p-8 shadow-lg flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-4" dangerouslySetInnerHTML={{ __html: dynamicTitle }} />
        <p className="text-lg text-muted mb-6" dangerouslySetInnerHTML={{ __html: dynamicDescription }} />
        <div className="flex flex-col gap-4 w-full max-w-xs mb-6">
          <a
            href="/login"
            className="w-full inline-block rounded bg-accent px-4 py-2 text-white font-semibold text-center hover:bg-accent/80 transition"
          >
            Owner Login
          </a>
          <a
            href="/onboarding"
            className="w-full inline-block rounded bg-primary px-4 py-2 text-white font-semibold text-center hover:bg-primary/80 transition"
          >
            Start Onboarding
          </a>
        </div>
        <a
          href="https://github.com/finan/squareos"
          className="inline-block rounded bg-muted px-4 py-2 text-foreground font-semibold hover:bg-muted/80 transition"
          target="_blank"
          rel="noopener noreferrer"
        >
          View on GitHub
        </a>
      </div>
    </main>
  );
}
