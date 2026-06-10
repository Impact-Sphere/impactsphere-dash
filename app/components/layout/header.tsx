import { SearchInput } from "@/app/components/ui/search-input";
import { cn } from "@/app/lib/utils";

interface HeaderProps {
  title: string;
  subtitle: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: () => void;
  activeTab?: "all" | "recent";
  onTabChange?: (tab: "all" | "recent") => void;
}

export function Header({
  title,
  subtitle,
  searchPlaceholder = "Search initiatives...",
  searchValue = "",
  onSearchChange,
  onSearchSubmit,
  activeTab = "all",
  onTabChange,
}: HeaderProps) {
  return (
    <header className="sticky top-14 lg:top-0 z-20 bg-white/70 backdrop-blur-2xl px-4 sm:px-6 lg:px-12 py-6 flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 overflow-hidden">
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
          {title}
        </h1>
        <p className="text-sm text-on-surface-variant font-medium mt-1">
          {subtitle}
        </p>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 lg:gap-6 w-full lg:w-auto">
        {onSearchChange && (
          <SearchInput
            placeholder={searchPlaceholder}
            className="w-full sm:w-72 lg:w-80"
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSearchSubmit?.();
            }}
          />
        )}
        {onTabChange && (
          <div className="flex items-center space-x-2 p-1 bg-surface-container-low rounded-full self-start sm:self-auto">
            <button
              type="button"
              onClick={() => onTabChange?.("all")}
              className={cn(
                "px-4 py-2 text-xs font-bold rounded-full transition-all",
                activeTab === "all"
                  ? "bg-white shadow-sm text-primary"
                  : "text-on-surface-variant hover:text-primary",
              )}
            >
              All Projects
            </button>
            <button
              type="button"
              onClick={() => onTabChange?.("recent")}
              className={cn(
                "px-4 py-2 text-xs font-bold rounded-full transition-all",
                activeTab === "recent"
                  ? "bg-white shadow-sm text-primary"
                  : "text-on-surface-variant hover:text-primary",
              )}
            >
              Recent
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
