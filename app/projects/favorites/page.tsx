"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { Header } from "@/app/components/layout/header";
import { ProjectCard } from "@/app/components/project/project-card";
import { ProjectCardSkeleton } from "@/app/components/project/project-card-skeleton";
import { categories } from "@/app/lib/data";
import type { Project } from "@/app/types/project";

function DiscoverContent() {
  const router = useRouter();
  const searchPathname = "/discover";
  const searchParams = useSearchParams();

  // const q = searchParams.get("q") || "";

  // const [inputValue, setInputValue] = useState(q);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync input with URL on back/forward navigation
  // useEffect(() => {
  //   setInputValue(q);
  // }, [q]);

  const _updateUrl = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      const query = params.toString();
      router.replace(query ? `${searchPathname}?${query}` : searchPathname);
    },
    [router, searchParams],
  );

  // Fetch projects whenever URL params change
  useEffect(() => {
    const doFetch = async () => {
      setLoading(true);
      const _params = new URLSearchParams();
      // if (q) params.set("q", q);
      const res = await fetch(`/api/projects/favorites`);
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
      setLoading(false);
    };
    doFetch();
  }, []);
  // }, [q]);

  // const handleSearchChange = (value: string) => {
  //   setInputValue(value);
  // };

  // const handleSearchSubmit = () => {
  //   const trimmed = inputValue.trim();
  //   if (trimmed !== q) {
  //     updateUrl({ q: trimmed || null });
  //   }
  // };

  const hasNoResults = !loading && projects.length === 0;

  return (
    <main className="min-h-screen">
      <Header
        title="Favorite Projects"
        subtitle="Projects saved by you"
        // searchPlaceholder="Search initiatives..."
        // searchValue={inputValue}
        // onSearchChange={handleSearchChange}
        // onSearchSubmit={handleSearchSubmit}
      />

      <section className="px-4 sm:px-6 lg:px-12 py-6 sm:py-8 space-y-8 sm:space-y-12">
        {loading ? (
          <div className="grid grid-cols-12 gap-6 sm:gap-8">
            {["sk-a", "sk-b", "sk-c", "sk-d", "sk-e", "sk-f"].map((key) => (
              <ProjectCardSkeleton
                key={key}
                className="col-span-12 md:col-span-6 lg:col-span-4"
              />
            ))}
          </div>
        ) : hasNoResults ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4">
              search_off
            </span>
            <h3 className="text-xl font-bold text-on-surface mb-2">
              No favorites found
            </h3>
            <p className="text-sm text-on-surface-variant mb-6 max-w-md">
              It seems you don't have any favorites. Try browsing the{" "}
              <Link
                href="/discover"
                className="font-bold underline cursor-pointer"
              >
                discovery
              </Link>{" "}
              page!
            </p>
          </div>
        ) : (
          <>
            {/* Project Grid */}
            <div className="grid grid-cols-12 gap-6 sm:gap-8">
              {/* Standard Project Cards */}
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  className="col-span-12 md:col-span-6 lg:col-span-4"
                  transparentWhenNotFavorite
                />
              ))}
            </div>

            {/* Pagination */}
            <footer className="px-0 sm:px-2 lg:px-12 py-8 sm:py-12 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 text-center sm:text-left opacity-60">
              <span className="text-xs font-medium">
                Showing {projects.length} approved initiative
                {projects.length !== 1 ? "s" : ""}
              </span>
              <div className="flex justify-center space-x-2">
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
      </section>
    </main>
  );
}

function DiscoverFallback() {
  return (
    <main className="min-h-screen">
      <div className="sticky top-14 lg:top-0 z-20 bg-white/70 backdrop-blur-2xl px-4 sm:px-6 lg:px-12 py-6 flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div className="min-w-0">
          <div className="h-9 w-48 sm:w-64 bg-surface-container rounded-lg animate-pulse" />
          <div className="h-5 w-56 sm:w-96 bg-surface-container rounded mt-1 animate-pulse" />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 w-full lg:w-auto">
          <div className="w-full sm:w-72 lg:w-80 h-12 bg-surface-container rounded-full animate-pulse" />
          <div className="w-32 sm:w-40 h-10 bg-surface-container rounded-full animate-pulse" />
        </div>
      </div>
      <section className="px-4 sm:px-6 lg:px-12 py-6 sm:py-8 space-y-8 sm:space-y-12">
        <div className="flex flex-wrap gap-3">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="px-6 py-2.5 rounded-full bg-surface-container animate-pulse h-10 w-24"
            />
          ))}
        </div>
        <div className="grid grid-cols-12 gap-6 sm:gap-8">
          {[
            "fb-sk-a",
            "fb-sk-b",
            "fb-sk-c",
            "fb-sk-d",
            "fb-sk-e",
            "fb-sk-f",
          ].map((key) => (
            <ProjectCardSkeleton
              key={key}
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
