"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const APP_NAV_ITEMS = [
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

const AUTH_NAV_ITEMS = [
  {
    href: "/login",
    label: "Sign In",
    isActive: (p: string) => p === "/login" || p.startsWith("/login/"),
  },
  {
    href: "/signup",
    label: "Sign Up",
    isActive: (p: string) => p === "/signup",
  },
] as const;

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const supabase = useMemo(() => {
    try {
      return createBrowserSupabaseClient();
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      setUser(null);
      setAuthReady(true);
      return;
    }

    let cancelled = false;

    void supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      setUser(data.user ?? null);
      setAuthReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthReady(true);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Until auth is resolved, show only Sign In / Sign Up so app routes never appear without a session.
  const navItems = !authReady || !user ? AUTH_NAV_ITEMS : APP_NAV_ITEMS;
  const homeHref = user ? "/dashboard" : "/login";
  const isGuestNav = !user;

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/90 bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-stretch justify-between gap-4 px-4 sm:gap-6 sm:px-6 lg:px-8">
        <Link
          href={homeHref}
          className="flex shrink-0 items-center text-lg font-bold tracking-tight text-indigo-600 transition hover:text-indigo-700"
          onClick={() => setMobileMenuOpen(false)}
        >
          OC Portal
        </Link>

        <nav
          className="-mr-1 hidden min-w-0 flex-1 flex-nowrap items-stretch justify-end gap-1 overflow-x-auto pr-1 [-ms-overflow-style:none] [scrollbar-width:none] md:flex md:gap-2 [&::-webkit-scrollbar]:hidden"
          aria-label="Main"
        >
          {navItems.map(({ href, label, isActive }) => {
            const active = isActive(pathname);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-full shrink-0 items-center border-b-2 border-transparent px-2 text-sm transition-colors sm:px-3",
                  active && !isGuestNav
                    ? "border-indigo-600 font-semibold text-slate-900"
                    : active && isGuestNav
                      ? "font-semibold text-slate-900"
                      : "font-medium text-slate-600 hover:text-slate-900",
                  isGuestNav &&
                    href === "/signup" &&
                    "rounded-lg border-0 bg-indigo-600 px-3 text-white hover:bg-indigo-700 hover:text-white md:ml-1",
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
            {navItems.map(({ href, label, isActive }) => {
              const active = isActive(pathname);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm transition-colors",
                    active && !isGuestNav
                      ? "bg-indigo-50 font-semibold text-indigo-700"
                      : active && isGuestNav
                        ? "bg-slate-100 font-semibold text-slate-900"
                        : "font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900",
                    isGuestNav &&
                      href === "/signup" &&
                      "bg-indigo-600 text-center font-semibold text-white hover:bg-indigo-700 hover:text-white",
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
