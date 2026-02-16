import React from "react";
import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const [showPanel, setShowPanel] = React.useState(false);
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* Left Panel: Brand / Trust / Value */}
      <div className={`md:w-1/2 w-full flex flex-col justify-center items-center bg-green-500 text-white p-8 md:p-16 transition-all duration-300 ${showPanel ? 'max-h-[1000px]' : 'max-h-0 overflow-hidden'} md:max-h-full md:overflow-visible`}>
        {/* Mobile toggle */}
        <button
          className="md:hidden absolute top-4 left-4 bg-green-700 bg-opacity-80 rounded-full p-2 z-20"
          onClick={() => setShowPanel(v => !v)}
          aria-label={showPanel ? 'Hide info panel' : 'Show info panel'}
        >
          {showPanel ? '✕' : '☰'}
        </button>
        {/* Logo + App Name */}
        <div className="flex items-center mb-6 mt-8 md:mt-0">
          <Image src="/logo.svg" alt="SquareOS Logo" width={40} height={40} className="mr-3" />
          <span className="text-3xl font-bold tracking-tight">SquareOS</span>
        </div>
        {/* Headline */}
        <h2 className="text-2xl font-bold mb-2 text-center max-w-xs">From leads to estimates to installs — all in one place.</h2>
        {/* Subheadline */}
        <p className="text-lg mb-6 text-center max-w-xs">Create your workspace and start generating estimates in minutes.</p>
        {/* Value Bullets */}
        <ul className="mb-6 space-y-2 text-lg">
          <li>• Fast estimating + margin protection</li>
          <li>• Team roles, approvals, and workflows</li>
          <li>• Customer-ready proposals instantly</li>
        </ul>
        {/* Trust Row */}
        <div className="flex flex-row items-center gap-4 text-xs opacity-80 mb-4">
          <span>🔒 Secure sign-in</span>
          <span>🛡️ Encrypted data</span>
          <span>💳 Stripe billing</span>
        </div>
        {/* Optional: Product Screenshot Mock */}
        <div className="bg-white bg-opacity-10 rounded-lg p-2 mt-2 flex flex-col items-center">
          <Image src="/mock-dashboard.png" alt="Product Screenshot" width={256} height={144} className="rounded shadow-lg object-cover" />
          <span className="text-xs mt-2 opacity-80">Product preview</span>
        </div>
      </div>
      {/* Right Panel: Auth Card */}
      <div className="md:w-1/2 w-full flex flex-col justify-center items-center bg-white p-8 md:p-16 relative">
        {/* Mobile: Brand + Value Bullets above card */}
        <div className="md:hidden flex flex-col items-center mb-6">
          <div className="flex items-center mb-3">
            <Image src="/logo.svg" alt="SquareOS Logo" width={32} height={32} className="mr-2" />
            <span className="text-xl font-bold tracking-tight">SquareOS</span>
          </div>
          <h2 className="text-lg font-bold mb-1 text-center max-w-xs">From leads to estimates to installs — all in one place.</h2>
          <ul className="mb-2 space-y-1 text-sm">
            <li>• Fast estimating + margin protection</li>
            <li>• Team roles, approvals, and workflows</li>
            <li>• Customer-ready proposals instantly</li>
          </ul>
        </div>
        {children}
      </div>
    </div>
  );
}
