"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  type CurrencyCode,
  SUPPORTED_CURRENCIES,
  useCurrency,
} from "@/app/components/currency/currency-context";
import { authClient } from "@/app/lib/auth-client";
import { footerNavItems, navItems } from "@/app/lib/data";
import { cn } from "@/app/lib/utils";
import { useSidebar } from "./sidebar-context";
import { useProfile } from "./use-profile";

export function Sidebar() {
  const { open, close } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const { profile } = useProfile();
  const {
    currency,
    setCurrency,
    symbol,
    loading: currencyLoading,
  } = useCurrency();
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  const userType = profile?.userType ?? null;
  const approvalStatus = profile?.approvalStatus ?? null;
  const profileImage = profile?.image ?? null;

  useEffect(() => {
    if (!session || !profile) return;

    const isPending =
      approvalStatus === "PENDING" &&
      ["NGO", "COMPANY"].includes(userType || "");

    if (isPending && pathname !== "/pending-approval") {
      router.push("/pending-approval");
      return;
    }

    // Redirect users who haven't completed onboarding
    fetch("/api/onboarding")
      .then((res) => res.json())
      .then((onData) => {
        if (
          onData.needsOnboarding &&
          pathname !== "/onboarding" &&
          pathname !== "/resubmit" &&
          pathname !== "/login"
        ) {
          router.push("/onboarding");
        }
      })
      .catch(() => {});
  }, [session, profile, pathname, router, userType, approvalStatus]);

  const isAdmin = userType === "ADMIN";
  const isApprovedNgo = userType === "NGO" && approvalStatus === "APPROVED";

  return (
    <aside
      data-state={open ? "open" : "closed"}
      aria-label="Primary navigation"
      className={cn(
        "h-screen w-72 fixed left-0 top-0 overflow-y-auto bg-slate-50 flex flex-col p-6 space-y-8 z-50",
        "transition-transform duration-300 ease-in-out will-change-transform",
        "lg:translate-x-0 lg:z-40",
        open ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div className="flex items-center justify-between -mt-2">
        <Link href="/" className="flex items-center space-x-3 min-w-0">
          <div className="w-10 h-10 relative shrink-0">
            <Image
              src="/images/logo.svg"
              alt="ImpactSphere"
              fill
              className="object-contain"
            />
          </div>
          <span className="text-xl font-black text-violet-900 font-manrope truncate">
            ImpactSphere
          </span>
        </Link>
        <button
          type="button"
          onClick={close}
          aria-label="Close menu"
          className="w-10 h-10 -mr-2 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200/50 lg:hidden"
        >
          <span className="material-symbols-outlined text-2xl">close</span>
        </button>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ease-in-out active:scale-98",
                "hover:translate-x-1",
                isActive
                  ? "bg-white text-violet-700 shadow-sm"
                  : "text-slate-500 hover:bg-slate-200/50",
              )}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="text-sm font-semibold font-inter">
                {item.label}
              </span>
            </Link>
          );
        })}
        {session?.user && (
          <>
            <Link
              href="/projects/favorites"
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ease-in-out active:scale-98",
                "hover:translate-x-1",
                pathname === "/projects/favorites"
                  ? "bg-white text-violet-700 shadow-sm"
                  : "text-slate-500 hover:bg-slate-200/50",
              )}
            >
              <span className="material-symbols-outlined">star</span>
              <span className="text-sm font-semibold font-inter">
                Favorite Projects
              </span>
            </Link>
            {userType === "COMPANY" && (
              <Link
                href="/matching-request"
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ease-in-out active:scale-98",
                  "hover:translate-x-1",
                  pathname === "/matching-request"
                    ? "bg-white text-violet-700 shadow-sm"
                    : "text-slate-500 hover:bg-slate-200/50",
                )}
              >
                <span className="material-symbols-outlined">handshake</span>
                <span className="text-sm font-semibold font-inter">
                  Find Projects
                </span>
              </Link>
            )}
            <Link
              href="/support"
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ease-in-out active:scale-98",
                "hover:translate-x-1",
                pathname === "/support"
                  ? "bg-white text-violet-700 shadow-sm"
                  : "text-slate-500 hover:bg-slate-200/50",
              )}
            >
              <span className="material-symbols-outlined">chat</span>
              <span className="text-sm font-semibold font-inter">
                Contact ImpactSphere
              </span>
            </Link>
          </>
        )}
        {isAdmin && (
          <>
            <Link
              href="/admin"
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ease-in-out active:scale-98",
                "hover:translate-x-1",
                pathname === "/admin"
                  ? "bg-white text-violet-700 shadow-sm"
                  : "text-slate-500 hover:bg-slate-200/50",
              )}
            >
              <span className="material-symbols-outlined">
                admin_panel_settings
              </span>
              <span className="text-sm font-semibold font-inter">
                Admin Dashboard
              </span>
            </Link>
            <Link
              href="/admin/acquisitions"
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ease-in-out active:scale-98",
                "hover:translate-x-1",
                pathname === "/admin/acquisitions"
                  ? "bg-white text-violet-700 shadow-sm"
                  : "text-slate-500 hover:bg-slate-200/50",
              )}
            >
              <span className="material-symbols-outlined">workspaces</span>
              <span className="text-sm font-semibold font-inter">
                Service Workrooms
              </span>
            </Link>
          </>
        )}
        {isApprovedNgo && (
          <>
            <Link
              href="/services"
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ease-in-out active:scale-98",
                "hover:translate-x-1",
                pathname === "/services"
                  ? "bg-white text-violet-700 shadow-sm"
                  : "text-slate-500 hover:bg-slate-200/50",
              )}
            >
              <span className="material-symbols-outlined">handshake</span>
              <span className="text-sm font-semibold font-inter">Services</span>
            </Link>
            <Link
              href="/my-services"
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ease-in-out active:scale-98",
                "hover:translate-x-1",
                pathname === "/my-services"
                  ? "bg-white text-violet-700 shadow-sm"
                  : "text-slate-500 hover:bg-slate-200/50",
              )}
            >
              <span className="material-symbols-outlined">inventory_2</span>
              <span className="text-sm font-semibold font-inter">
                My Services
              </span>
            </Link>
          </>
        )}
      </nav>

      {(isAdmin || isApprovedNgo) && (
        <div className="pt-6 border-t border-outline-variant/10">
          <Link
            href="/projects/new"
            className="block w-full py-4 rounded-xl bg-gradient-to-r from-primary to-primary-container text-white font-bold text-sm shadow-xl shadow-primary/20 active:scale-95 transition-transform text-center"
          >
            Create Project
          </Link>
        </div>
      )}

      <div className="space-y-2 mt-auto">
        {footerNavItems.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="flex items-center space-x-3 px-4 py-3 text-slate-500 hover:bg-slate-200/50 rounded-xl hover:translate-x-1 transition-transform duration-300 ease-in-out"
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="text-sm font-semibold font-inter">
              {item.label}
            </span>
          </Link>
        ))}
      </div>

      <div className="pt-4 border-t border-outline-variant/10 relative">
        <button
          type="button"
          onClick={() => setShowCurrencyPicker((s) => !s)}
          disabled={currencyLoading}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-200/50 transition-colors"
        >
          <span className="material-symbols-outlined">currency_exchange</span>
          <span className="text-sm font-semibold font-inter">
            {currencyLoading ? "Loading..." : `${symbol} ${currency}`}
          </span>
          <span className="material-symbols-outlined text-base ml-auto">
            {showCurrencyPicker ? "expand_less" : "expand_more"}
          </span>
        </button>
        {showCurrencyPicker && (
          <div className="absolute bottom-full left-0 right-0 mb-1 bg-white rounded-xl shadow-lg border border-gray-100 max-h-60 overflow-y-auto p-1 z-50">
            {SUPPORTED_CURRENCIES.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => {
                  setCurrency(c.code as CurrencyCode);
                  setShowCurrencyPicker(false);
                }}
                className={cn(
                  "w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  currency === c.code
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-slate-600 hover:bg-slate-50",
                )}
              >
                <span className="w-6 text-center">{c.symbol}</span>
                <span>{c.name}</span>
                {currency === c.code && (
                  <span className="material-symbols-outlined text-base ml-auto text-primary">
                    check
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-outline-variant/10 space-y-2">
        {session?.user ? (
          <div className="space-y-2">
            <Link
              href="/profile"
              className="flex items-center space-x-3 px-4 py-2 rounded-xl hover:bg-slate-200/50 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-sm overflow-hidden">
                {profileImage ? (
                  <Image
                    src={profileImage}
                    alt="Avatar"
                    width={32}
                    height={32}
                    unoptimized
                    className="object-cover w-full h-full"
                  />
                ) : (
                  session.user.name?.charAt(0) || session.user.email?.charAt(0)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-on-surface truncate">
                  {session.user.name || session.user.email}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {session.user.email}
                </p>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => authClient.signOut()}
              className="w-full flex items-center space-x-3 px-4 py-3 text-slate-500 hover:bg-slate-200/50 rounded-xl transition-colors"
            >
              <span className="material-symbols-outlined">logout</span>
              <span className="text-sm font-semibold font-inter">Sign out</span>
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center space-x-3 px-4 py-3 text-slate-500 hover:bg-slate-200/50 rounded-xl transition-colors"
          >
            <span className="material-symbols-outlined">login</span>
            <span className="text-sm font-semibold font-inter">Sign in</span>
          </Link>
        )}
      </div>
    </aside>
  );
}
