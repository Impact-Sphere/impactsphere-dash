"use client";

import { useEffect, useState } from "react";
import { Header } from "@/app/components/layout/header";
import { CategoryFilter } from "@/app/components/project/category-filter";
import { FeaturedProjectCard } from "@/app/components/project/featured-project-card";
import { ProjectCard } from "@/app/components/project/project-card";
import { ImpactPulse } from "@/app/components/widgets/impact-pulse";
import { categories } from "@/app/lib/data";
import type { Project } from "@/app/types/project";

export default function DiscoverPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeTab, setActiveTab] = useState<"all" | "recent">("all");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const doFetch = async () => {
      setLoading(true);
      const url =
        activeCategory === "all"
          ? "/api/projects"
          : `/api/projects?category=${encodeURIComponent(activeCategory)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
      setLoading(false);
    };
    doFetch();
  }, [activeCategory]);

  const featured = projects.find((p) => p.featured) || projects[0];
  const rest = featured
    ? projects.filter((p) => p.id !== featured.id)
    : projects;

  return (
    <main className="ml-72 min-h-screen">
      <Header
        title="Project Discovery"
        subtitle="Explore high-impact initiatives awaiting your partnership."
        searchPlaceholder="Search initiatives..."
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <section className="px-12 py-8 space-y-12">
        {/* Category Filters */}
        <CategoryFilter
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Project Grid */}
            <div className="grid grid-cols-12 gap-8">
              {/* Featured Project */}
              {featured && <FeaturedProjectCard project={featured} />}

              {/* Standard Project Cards */}
              {rest.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  className="col-span-12 md:col-span-6 lg:col-span-4"
                />
              ))}

              {/* Impact Pulse Widget */}
              <ImpactPulse percentage={64} amount="€24.8k" />
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
      </section>
    </main>
  );
}
