"use client";

import Image from "next/image";
import Link from "next/link";
import { useSidebar } from "./sidebar-context";
import { useProfile } from "./use-profile";

export function MobileTopBar() {
  const { toggle } = useSidebar();
  const { session, profile } = useProfile();
  const profileImage = profile?.image ?? null;

  return (
    <div className="fixed top-0 left-0 right-0 z-30 h-14 bg-white/95 backdrop-blur border-b border-gray-200 flex items-center px-3 sm:px-4 gap-2 sm:gap-3 lg:hidden">
      <button
        type="button"
        onClick={toggle}
        aria-label="Open menu"
        className="w-10 h-10 -ml-1 flex items-center justify-center rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
      >
        <span className="material-symbols-outlined text-2xl">menu</span>
      </button>
      <Link href="/" className="flex items-center gap-2 min-w-0">
        <div className="w-7 h-7 sm:w-8 sm:h-8 relative shrink-0">
          <Image
            src="/images/logo.svg"
            alt="ImpactSphere"
            fill
            className="object-contain"
          />
        </div>
        <span className="text-base font-black text-violet-900 font-manrope truncate">
          ImpactSphere
        </span>
      </Link>

      {session?.user ? (
        <Link
          href="/profile"
          className="ml-auto flex items-center justify-center w-8 h-8 rounded-full bg-violet-100 overflow-hidden"
        >
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
            <span className="text-violet-700 font-bold text-sm">
              {session.user.name?.charAt(0) || session.user.email?.charAt(0)}
            </span>
          )}
        </Link>
      ) : (
        <Link
          href="/login"
          className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold text-violet-700 hover:bg-violet-50 transition-colors"
        >
          <span className="material-symbols-outlined text-base">login</span>
          <span>Sign in</span>
        </Link>
      )}
    </div>
  );
}
