"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/90 bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-stretch justify-between gap-4 px-4 sm:gap-6 sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          className="flex shrink-0 items-center text-lg font-bold tracking-tight text-indigo-600 transition hover:text-indigo-700"
          onClick={() => setMobileMenuOpen(false)}
        >
          OC Portal
        </Link>

        <nav
          className="-mr-1 hidden min-w-0 flex-1 flex-nowrap items-stretch justify-end gap-1 overflow-x-auto pr-1 [-ms-overflow-style:none] [scrollbar-width:none] md:flex md:gap-2 [&::-webkit-scrollbar]:hidden"
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

        <div className="flex items-center md:hidden">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileMenuOpen ? (
        <nav
          id="mobile-nav-menu"
          className="border-t border-slate-200 bg-white px-4 py-2 shadow-sm md:hidden sm:px-6"
          aria-label="Mobile navigation"
        >
          <div className="flex flex-col gap-1">
            {NAV_ITEMS.map(({ href, label, isActive }) => {
              const active = isActive(pathname);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-indigo-50 font-semibold text-indigo-700"
                      : "font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900",
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
