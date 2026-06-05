"use client";

import { useSidebar } from "./sidebar-context";

export function SidebarBackdrop() {
  const { open, close } = useSidebar();
  if (!open) return null;
  return (
    <button
      type="button"
      onClick={close}
      aria-label="Close menu"
      className="fixed inset-0 z-30 bg-black/50 lg:hidden cursor-default"
    />
  );
}
