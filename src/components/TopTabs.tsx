"use client";

import { NavItem } from "@/lib/navItems";
import Link from "next/link";
import { usePathname } from "next/navigation";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function TopTabs({ title, items }: { title: string; items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs uppercase tracking-wider text-neutral-500">
        {title}
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cx(
                "rounded-2xl px-4 py-2 text-sm shadow-sm transition",
                active
                  ? "bg-neutral-900 text-white"
                  : "bg-background text-neutral-800 hover:bg-neutral-100",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
