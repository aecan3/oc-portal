"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Dashboard",
    isActive: (p: string) => p === "/dashboard" || p === "/",
  },
  {
    href: "/my-account",
    label: "My Account",
    isActive: (p: string) => p === "/my-account" || p.startsWith("/my-account/"),
  },
  {
    href: "/bank",
    label: "Bank Account",
    isActive: (p: string) => p === "/bank" || p.startsWith("/bank/"),
  },
  {
    href: "/documents",
    label: "Document Library",
    isActive: (p: string) => p === "/documents" || p.startsWith("/documents/"),
  },
] as const;

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/90 bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-stretch justify-between gap-4 px-4 sm:gap-6 sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          className="flex shrink-0 items-center text-lg font-bold tracking-tight text-indigo-600 transition hover:text-indigo-700"
        >
          OC Portal
        </Link>

        <nav
          className="-mr-1 flex min-w-0 flex-1 flex-nowrap items-stretch justify-end gap-1 overflow-x-auto pr-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-2 [&::-webkit-scrollbar]:hidden"
          aria-label="Main"
        >
          {NAV_ITEMS.map(({ href, label, isActive }) => {
            const active = isActive(pathname);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-full shrink-0 items-center border-b-2 border-transparent px-2 text-sm transition-colors sm:px-3",
                  active
                    ? "border-indigo-600 font-semibold text-slate-900"
                    : "font-medium text-slate-600 hover:text-slate-900",
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
