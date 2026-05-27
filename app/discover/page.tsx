"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/app/components/layout/header";
import { CategoryFilter } from "@/app/components/project/category-filter";
import { FeaturedProjectCard } from "@/app/components/project/featured-project-card";
import { ProjectCard } from "@/app/components/project/project-card";
import { ProjectCardSkeleton } from "@/app/components/project/project-card-skeleton";
import { ImpactPulse } from "@/app/components/widgets/impact-pulse";
import { categories } from "@/app/lib/data";
import type { Project } from "@/app/types/project";

function DiscoverContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const q = searchParams.get("q") || "";
  const category = searchParams.get("category") || "all";
  const tab = (searchParams.get("tab") as "all" | "recent") || "all";

  const [inputValue, setInputValue] = useState(q);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync input with URL on back/forward navigation
  useEffect(() => {
    setInputValue(q);
  }, [q]);

  const updateUrl = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    },
    [pathname, router, searchParams],
  );

  // Debounced search update
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = inputValue.trim();
      if (trimmed !== q) {
        updateUrl({ q: trimmed || null });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [inputValue, q, updateUrl]);

  // Fetch projects whenever URL params change
  useEffect(() => {
    const doFetch = async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (category !== "all") params.set("category", category);
      if (tab === "recent" && !q) params.set("recent", "true");
      if (q) params.set("q", q);
      const res = await fetch(`/api/projects?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
      setLoading(false);
    };
    doFetch();
  }, [q, category, tab]);

  const handleSearchChange = (value: string) => {
    setInputValue(value);
  };

  const handleSearchSubmit = () => {
    const trimmed = inputValue.trim();
    if (trimmed !== q) {
      updateUrl({ q: trimmed || null });
    }
  };

  const handleCategoryChange = (cat: string) => {
    updateUrl({ category: cat !== "all" ? cat : null });
  };

  const handleTabChange = (t: "all" | "recent") => {
    updateUrl({ tab: t !== "all" ? t : null });
  };

  const clearFilters = () => {
    router.replace(pathname);
  };

  const isSearching = Boolean(q);
  const featured = !isSearching
    ? projects.find((p) => p.featured) || projects[0]
    : null;
  const rest = featured
    ? projects.filter((p) => p.id !== featured.id)
    : projects;

  const hasNoResults = !loading && projects.length === 0;

  return (
    <main className="ml-72 min-h-screen">
      <Header
        title="Project Discovery"
        subtitle="Explore high-impact initiatives awaiting your partnership."
        searchPlaceholder="Search initiatives..."
        searchValue={inputValue}
        onSearchChange={handleSearchChange}
        onSearchSubmit={handleSearchSubmit}
        activeTab={tab}
        onTabChange={handleTabChange}
      />

      <section className="px-12 py-8 space-y-12">
        {/* Category Filters */}
        <CategoryFilter
          categories={categories}
          activeCategory={category}
          onCategoryChange={handleCategoryChange}
        />

        {loading ? (
          <div className="grid grid-cols-12 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProjectCardSkeleton
                key={i}
                className="col-span-12 md:col-span-6 lg:col-span-4"
              />
            ))}
          </div>
        ) : (
          <>
            {hasNoResults ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4">
                  search_off
                </span>
                <h3 className="text-xl font-bold text-on-surface mb-2">
                  No initiatives found
                </h3>
                <p className="text-sm text-on-surface-variant mb-6 max-w-md">
                  {q
                    ? `We couldn't find any projects matching "${q}". Try different keywords or clear your filters.`
                    : "We couldn't find any projects with the current filters."}
                </p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="px-6 py-3 bg-primary text-white rounded-full text-sm font-bold hover:bg-primary/90 transition-colors"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <>
                {/* Project Grid */}
                <div className="grid grid-cols-12 gap-8">
                  {/* Featured Project */}
                  {!isSearching && featured && (
                    <FeaturedProjectCard project={featured} />
                  )}

                  {/* Standard Project Cards */}
                  {rest.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      className="col-span-12 md:col-span-6 lg:col-span-4"
                    />
                  ))}

                  {/* Impact Pulse Widget */}
                  {!isSearching && (
                    <ImpactPulse percentage={64} amount="$24.8k" />
                  )}
                </div>

                {/* Pagination */}
                <footer className="px-12 py-12 flex justify-between items-center opacity-60">
                  <span className="text-xs font-medium">
                    Showing {projects.length} active initiative
                    {projects.length !== 1 ? "s" : ""}
                  </span>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      className="w-10 h-10 rounded-full border border-outline-variant/20 flex items-center justify-center hover:bg-surface-container transition-colors"
                      aria-label="Previous page"
                    >
                      <span className="material-symbols-outlined text-sm">
                        chevron_left
                      </span>
                    </button>
                    <button
                      type="button"
                      className="w-10 h-10 rounded-full border border-outline-variant/20 flex items-center justify-center bg-primary text-white"
                    >
                      1
                    </button>
                  </div>
                </footer>
              </>
            )}
          </>
        )}
      </section>
    </main>
  );
}

function DiscoverFallback() {
  return (
    <main className="ml-72 min-h-screen">
      <div className="sticky top-0 z-30 bg-white/70 backdrop-blur-2xl px-12 py-6 flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <div className="h-9 w-64 bg-surface-container rounded-lg animate-pulse" />
          <div className="h-5 w-96 bg-surface-container rounded mt-1 animate-pulse" />
        </div>
        <div className="flex items-center space-x-6">
          <div className="w-80 h-12 bg-surface-container rounded-full animate-pulse" />
          <div className="w-40 h-10 bg-surface-container rounded-full animate-pulse" />
        </div>
      </div>
      <section className="px-12 py-8 space-y-12">
        <div className="flex flex-wrap gap-3">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="px-6 py-2.5 rounded-full bg-surface-container animate-pulse h-10 w-24"
            />
          ))}
        </div>
        <div className="grid grid-cols-12 gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProjectCardSkeleton
              key={i}
              className="col-span-12 md:col-span-6 lg:col-span-4"
            />
          ))}
        </div>
      </section>
    </main>
  );
}

export default function DiscoverPage() {
  return (
    <Suspense fallback={<DiscoverFallback />}>
      <DiscoverContent />
    </Suspense>
  );
}
