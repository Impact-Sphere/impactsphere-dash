"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { authClient } from "@/app/lib/auth-client";
import { footerNavItems, navItems } from "@/app/lib/data";
import { cn } from "@/app/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [userType, setUserType] = useState<string | null>(null);
  const [approvalStatus, setApprovalStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        setUserType(data.userType || null);
        setApprovalStatus(data.approvalStatus || null);

        const isPending =
          data.approvalStatus === "PENDING" &&
          ["NGO", "COMPANY"].includes(data.userType);

        if (isPending && pathname !== "/pending-approval") {
          router.push("/pending-approval");
        }
      })
      .catch(() => {});
  }, [session, pathname, router]);

  const isAdmin = userType === "ADMIN";
  const isApprovedNgo = userType === "NGO" && approvalStatus === "APPROVED";

  return (
    <aside className="h-screen w-72 fixed left-0 top-0 overflow-y-auto bg-slate-50 flex flex-col p-6 space-y-8 z-40">
      {/* Logo */}
      <Link href="/" className="flex items-center space-x-3">
        <div className="w-10 h-10 relative">
          <Image
            src="/images/logo.svg"
            alt="ImpactSphere"
            fill
            className="object-contain"
          />
        </div>
        <span className="text-xl font-black text-violet-900 font-manrope">
          ImpactSphere
        </span>
      </Link>

      {/* Main Navigation */}
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
        {isAdmin && (
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
            <span className="material-symbols-outlined">admin_panel_settings</span>
            <span className="text-sm font-semibold font-inter">
              Admin Dashboard
            </span>
          </Link>
        )}
      </nav>

      {/* CTA Button */}
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

      {/* Footer Navigation */}
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

      {/* Auth Section */}
      <div className="pt-4 border-t border-outline-variant/10 space-y-2">
        {session?.user ? (
          <div className="space-y-2">
            <Link
              href="/profile"
              className="flex items-center space-x-3 px-4 py-2 rounded-xl hover:bg-slate-200/50 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-sm">
                {session.user.name?.charAt(0) || session.user.email?.charAt(0)}
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
