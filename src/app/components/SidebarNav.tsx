"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navSections = [
  {
    label: "Workflow",
    items: [
      { key: "estimates", label: "Estimates", href: "/estimates" },
      { key: "jobs", label: "Jobs", href: "/jobs" },
      { key: "invoices", label: "Invoices", href: "/invoices" },
      { key: "reviews", label: "Reviews", href: "/reviews" },
    ],
  },
  {
    label: "Other",
    items: [
      { key: "contacts", label: "Contacts", href: "/contacts" },
      { key: "analytics", label: "Analytics", href: "/analytics" },
      { key: "settings", label: "Settings", href: "/settings" },
    ],
  },
];

export function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav className="w-56 bg-[#1a2233] h-full flex flex-col py-6 px-2 border-r border-[#232c43]">
      {navSections.map(section => (
        <div key={section.label} className="mb-6">
          <div className="text-xs uppercase tracking-wider text-[#7985a8] mb-2 pl-2">{section.label}</div>
          {section.items.map(item => (
            <Link
              key={item.key}
              href={item.href}
              className={`block px-4 py-2 rounded font-medium mb-1 transition-colors ${
                (pathname || "").startsWith(item.href)
                  ? "bg-indigo-600 text-white"
                  : "text-[#e8edf7] hover:bg-[#232c43]"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}
