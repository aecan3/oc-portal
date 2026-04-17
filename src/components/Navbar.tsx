"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import SignOutButton from "@/app/components/SignOutButton";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { roleHomePath, resolveUserRole, type AppUserRole } from "@/lib/userRole";
import { cn } from "@/lib/utils";

const OWNER_NAV_ITEMS = [
  {
    href: "/owner-dashboard",
    label: "Dashboard",
    isActive: (p: string) => p === "/owner-dashboard",
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

const MANAGER_NAV_ITEMS = [
  {
    href: "/secretary-dashboard",
    label: "Dashboard",
    isActive: (p: string) => p === "/secretary-dashboard" || p === "/dashboard",
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

const HIDDEN_NAV_PATHS = new Set(["/", "/login", "/signup", "/onboarding", "/join-oc", "/setup-oc", "/join-success"]);
const HIDDEN_NAV_PREFIXES = ["/onboarding/", "/join-oc/", "/setup-oc/", "/join-success/"] as const;

const PORTAL_PATH_PREFIXES = [
  "/owner-dashboard",
  "/secretary-dashboard",
  "/dashboard",
  "/bank",
  "/documents",
  "/my-account",
] as const;

function shouldHideNavbar(pathname: string) {
  if (HIDDEN_NAV_PATHS.has(pathname)) return true;
  if (HIDDEN_NAV_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true;
  return !PORTAL_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [userRole, setUserRole] = useState<AppUserRole>("unknown");
  const [displayName, setDisplayName] = useState<string>("");
  const [propertyAddress, setPropertyAddress] = useState<string>("Your Property");

  const supabase = useMemo(() => {
    try {
      return createBrowserSupabaseClient();
    } catch {
      return null;
    }
  }, []);

  const hydrateUserContext = useCallback(
    async (sessionUser: User | null) => {
      if (!supabase) {
        setUser(null);
        setUserRole("unknown");
        setDisplayName("");
        setPropertyAddress("Your Property");
        setAuthReady(true);
        return;
      }

      setUser(sessionUser);
      if (!sessionUser) {
        setUserRole("unknown");
        setDisplayName("");
        setPropertyAddress("Your Property");
        setAuthReady(true);
        return;
      }

      const fallbackName = sessionUser.email ?? "User";
      setDisplayName(fallbackName);
      setPropertyAddress("Your Property");

      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name")
        .eq("id", sessionUser.id)
        .maybeSingle();
      if (profile && typeof profile === "object") {
        const firstName =
          "first_name" in profile && typeof profile.first_name === "string" ? profile.first_name.trim() : "";
        if (firstName) setDisplayName(firstName);
      }

      let role: AppUserRole = "unknown";
      try {
        role = await resolveUserRole(supabase, sessionUser.id);
      } catch {
        role = "unknown";
      }
      setUserRole(role);

      if (role === "manager") {
        const { data: managedProperty } = await supabase
          .from("properties")
          .select("address")
          .eq("manager_id", sessionUser.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (managedProperty?.address) {
          setPropertyAddress(managedProperty.address);
        }
      } else if (role === "owner") {
        const { data: approvedJoin } = await supabase
          .from("join_requests")
          .select("property_id")
          .eq("user_id", sessionUser.id)
          .eq("status", "approved")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (approvedJoin?.property_id) {
          const { data: property } = await supabase
            .from("properties")
            .select("address")
            .eq("id", approvedJoin.property_id)
            .maybeSingle();
          if (property?.address) {
            setPropertyAddress(property.address);
          }
        }
      }

      setAuthReady(true);
    },
    [supabase],
  );

  useEffect(() => {
    if (!supabase) {
      setUser(null);
      setUserRole("unknown");
      setDisplayName("");
      setPropertyAddress("Your Property");
      setAuthReady(true);
      return;
    }

    void supabase.auth.getUser().then(({ data }) => {
      void hydrateUserContext(data.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void hydrateUserContext(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [hydrateUserContext, supabase]);

  const appNavItems = userRole === "manager" ? MANAGER_NAV_ITEMS : OWNER_NAV_ITEMS;
  const navItems = !authReady || !user ? [] : appNavItems;
  const homeHref = user ? roleHomePath(userRole) : "/login";
  const hidden = shouldHideNavbar(pathname);
  const accountLabel = displayName.trim().split(" ")[0] || user?.email || "My Account";

  if (hidden || !user || !authReady) {
    return null;
  }

  return (
    <header className="sticky inset-x-0 top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-7xl items-stretch justify-between gap-3 px-3 sm:h-14 sm:gap-6 sm:px-6 lg:px-8">
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
                  "flex h-full shrink-0 -translate-y-0.5 items-center border-b-[3px] border-transparent px-2 text-sm transition-all duration-200 hover:-translate-y-1 sm:px-3",
                  active
                    ? "border-[#7C2D12] font-semibold text-[#7C2D12]"
                    : "font-medium text-slate-600 hover:text-[#7C2D12]",
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/my-account"
            className="text-sm font-semibold text-slate-700 transition hover:text-[#7C2D12]"
          >
            {accountLabel}
          </Link>
          <SignOutButton />
        </div>

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

      <div className="border-t border-slate-200/90 px-3 py-2.5 sm:px-6 sm:py-3 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <p className="truncate text-[11px] font-semibold uppercase tracking-widest text-slate-500 sm:text-xs">
            Welcome back, {displayName}
          </p>
          <Link
            href={homeHref}
            onClick={() => setMobileMenuOpen(false)}
            className="mt-1 block truncate text-2xl font-bold tracking-tight text-slate-900 transition-colors hover:text-[#7C2D12] sm:text-3xl"
          >
            {propertyAddress}
          </Link>
        </div>
      </div>

      {mobileMenuOpen ? (
        <nav
          id="mobile-nav-menu"
          className="border-t border-slate-200 bg-white/95 px-4 py-2 shadow-sm md:hidden sm:px-6"
          aria-label="Mobile navigation"
        >
          <div className="flex flex-col gap-1">
            <Link
              href="/my-account"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-100 hover:text-[#7C2D12]"
            >
              {accountLabel}
            </Link>
            {navItems.map(({ href, label, isActive }) => {
              const active = isActive(pathname);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm transition-all duration-200",
                    active
                      ? "bg-[#7C2D12]/10 font-semibold text-[#7C2D12]"
                      : "font-medium text-slate-700 hover:bg-slate-100 hover:text-[#7C2D12]",
                  )}
                >
                  {label}
                </Link>
              );
            })}
            <div className="px-3 pb-2 pt-1">
              <SignOutButton />
            </div>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
