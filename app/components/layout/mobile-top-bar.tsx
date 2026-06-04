"use client";

import Image from "next/image";
import Link from "next/link";
import { useSidebar } from "./sidebar-context";

export function MobileTopBar() {
  const { toggle } = useSidebar();
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
    </div>
  );
}
