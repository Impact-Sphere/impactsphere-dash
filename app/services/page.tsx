"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useCurrency } from "@/app/components/currency/currency-context";
import { StatusMessage } from "@/app/components/ui/status-message";
import { authClient } from "@/app/lib/auth-client";

interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  deliveryDays: number;
  revisions: number;
}

interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  image: string | null;
  portfolioImages: string[];
  featured: boolean;
  rating: number;
  reviewCount: number;
  provider: { name: string | null; email: string; providerBio: string | null };
  packages: Package[];
}

interface Project {
  id: string;
  title: string;
  currentAmount: number;
  serviceSpent: number;
}

function ServicesCatalogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { format } = useCurrency();
  const preselectedProjectId = searchParams.get("projectId");
  const { data: session, isPending } = authClient.useSession();
  const [services, setServices] = useState<Service[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [acquiringService, setAcquiringService] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string>(
    preselectedProjectId || "",
  );
  const [selectedPackage, setSelectedPackage] = useState<string>("");
  const [showAcquireModal, setShowAcquireModal] = useState(false);
  const [activeService, setActiveService] = useState<Service | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: "error" | "success" | "info";
    message: string;
  } | null>(null);

  const activeProject = projects.find((p) => p.id === selectedProject);
  const availableBudget = activeProject
    ? activeProject.currentAmount - (activeProject.serviceSpent || 0)
    : 0;

  useEffect(() => {
    if (isPending) return;
    if (!session) {
      router.push("/login");
      return;
    }

    Promise.all([
      fetch("/api/services").then((r) => r.json()),
      fetch("/api/projects?mine=true").then((r) => r.json()),
    ]).then(([servicesData, projectsData]) => {
      setServices(servicesData);
      setProjects(projectsData);
      setLoading(false);
    });
  }, [session, isPending, router]);

  useEffect(() => {
    if (preselectedProjectId) {
      setSelectedProject(preselectedProjectId);
    }
  }, [preselectedProjectId]);

  const categories = [
    "all",
    ...Array.from(new Set(services.map((s) => s.category))),
  ];

  const filteredServices = services.filter((s) => {
    if (selectedCategory !== "all" && s.category !== selectedCategory)
      return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const confirmAcquire = async () => {
    if (!activeService || !selectedProject || !selectedPackage) return;

    setAcquiringService(activeService.id);
    const res = await fetch("/api/services/acquire", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: selectedProject,
        serviceId: activeService.id,
        packageId: selectedPackage,
      }),
    });

    setAcquiringService(null);
    setShowAcquireModal(false);

    if (res.ok) {
      router.push("/chat");
    } else {
      const data = await res.json().catch(() => ({}));
      setStatusMessage({
        type: "error",
        message: data.error || "Failed to acquire service",
      });
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-sm ${star <= Math.round(rating) ? "text-yellow-400" : "text-gray-200"}`}
          >
            ★
          </span>
        ))}
        <span className="text-xs text-gray-500 ml-1">
          ({rating.toFixed(1)})
        </span>
      </div>
    );
  };

  if (isPending || loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface py-6 sm:py-8 lg:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-on-surface">
            Services Catalog
          </h1>
          <p className="text-gray-500">
            Browse professional services to boost your project impact
          </p>
          {activeProject && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-gray-500">Buying for:</span>
              <span className="font-medium text-on-surface">
                {activeProject.title}
              </span>
              <span className="text-gray-400">·</span>
              <span className="text-emerald-600 font-medium">
                {format(availableBudget)} available
              </span>
            </div>
          )}
          {statusMessage && (
            <StatusMessage
              type={statusMessage.type}
              message={statusMessage.message}
              onClose={() => setStatusMessage(null)}
            />
          )}
        </div>

        {/* Search */}
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === cat
                  ? "bg-primary text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {cat === "all" ? "All Categories" : cat}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        <div className="space-y-8">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
              {/* Service Header */}
              <div className="p-4 sm:p-6 border-b border-gray-100">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="space-y-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      {service.featured && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                          Featured
                        </span>
                      )}
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700">
                        {service.category}
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-on-surface">
                      {service.name}
                    </h3>
                    <p className="text-gray-500 max-w-2xl">
                      {service.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                      {renderStars(service.rating)}
                      <span className="text-gray-400">
                        {service.reviewCount} reviews
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {service.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="md:text-right shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-sm shrink-0">
                        {service.provider.name?.charAt(0) ||
                          service.provider.email.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {service.provider.name || service.provider.email}
                        </p>
                        {service.provider.providerBio && (
                          <p className="text-xs text-gray-500 md:max-w-[200px] truncate">
                            {service.provider.providerBio}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fiverr-style Package Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                {service.packages.map((pkg, idx) => {
                  const canAfford =
                    !activeProject || availableBudget >= pkg.price;
                  return (
                    <div
                      key={pkg.id}
                      className={`p-4 sm:p-6 ${idx === 1 ? "bg-violet-50/50" : ""}`}
                    >
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-on-surface">
                            {pkg.name}
                          </h4>
                          <p className="text-sm text-gray-500 mt-1">
                            {pkg.description}
                          </p>
                        </div>

                        <div className="text-2xl font-bold text-on-surface">
                          {format(pkg.price)}
                        </div>

                        {activeProject && !canAfford && (
                          <p className="text-xs text-red-500 font-medium">
                            Needs {format(pkg.price)} — you have{" "}
                            {format(availableBudget)}
                          </p>
                        )}

                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-base">
                              schedule
                            </span>
                            {pkg.deliveryDays} day delivery
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-base">
                              replay
                            </span>
                            {pkg.revisions} revision
                            {pkg.revisions !== 1 ? "s" : ""}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveService(service);
                            setSelectedPackage(pkg.id);
                            setShowAcquireModal(true);
                          }}
                          disabled={
                            acquiringService === service.id || !canAfford
                          }
                          className={`w-full py-2.5 font-medium rounded-lg transition-colors ${
                            idx === 1
                              ? "bg-primary text-white hover:bg-primary/90"
                              : "border-2 border-primary text-primary hover:bg-primary/5"
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {acquiringService === service.id
                            ? "..."
                            : !canAfford
                              ? "Insufficient Funds"
                              : "Continue"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {filteredServices.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            No services found. Try a different search or category.
          </div>
        )}
      </div>

      {/* Acquire Modal */}
      {showAcquireModal && activeService && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-w-md w-full p-5 sm:p-6 space-y-6 max-h-[100dvh] sm:max-h-[90vh] overflow-y-auto">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-on-surface">
                Acquire {activeService.name}
              </h3>
              <p className="text-gray-500">
                Select which project will use this service.
              </p>
            </div>

            {/* Selected Package Summary */}
            {selectedPackage && (
              <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-2">
                <div className="flex justify-between font-medium">
                  <span>Package</span>
                  <span>
                    {
                      activeService.packages.find(
                        (p) => p.id === selectedPackage,
                      )?.name
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Price</span>
                  <span className="font-medium">
                    {format(
                      activeService.packages.find(
                        (p) => p.id === selectedPackage,
                      )?.price || 0,
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Delivery</span>
                  <span className="font-medium">
                    {
                      activeService.packages.find(
                        (p) => p.id === selectedPackage,
                      )?.deliveryDays
                    }{" "}
                    days
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <label
                htmlFor="project-select"
                className="text-sm font-medium text-on-surface"
              >
                Select Project
              </label>
              <select
                id="project-select"
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Choose a project...</option>
                {projects.map((project) => {
                  const remaining =
                    project.currentAmount - (project.serviceSpent || 0);
                  return (
                    <option key={project.id} value={project.id}>
                      {project.title} ({format(remaining)} available)
                    </option>
                  );
                })}
              </select>
              {activeProject && (
                <p className="text-xs text-gray-500">
                  This project has{" "}
                  {format(
                    availableBudget -
                      (activeService.packages.find(
                        (p) => p.id === selectedPackage,
                      )?.price || 0),
                  )}{" "}
                  available after service spending.
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowAcquireModal(false)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmAcquire}
                disabled={
                  !selectedProject || acquiringService === activeService.id
                }
                className="flex-1 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function ServicesCatalogPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </main>
      }
    >
      <ServicesCatalogContent />
    </Suspense>
  );
}
