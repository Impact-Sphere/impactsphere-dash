"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ConfirmModal } from "@/app/components/ui/confirm-modal";
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
  active: boolean;
  featured: boolean;
  rating: number;
  reviewCount: number;
  provider: { name: string | null; email: string };
  packages: Package[];
  _count: { acquisitions: number };
}

export default function AdminServicesPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: "error" | "success" | "info";
    message: string;
  } | null>(null);

  const [deleteServiceId, setDeleteServiceId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    tags: "",
    image: "",
    featured: false,
    packages: [
      {
        name: "Basic",
        description: "",
        price: "",
        deliveryDays: "",
        revisions: "1",
      },
      {
        name: "Standard",
        description: "",
        price: "",
        deliveryDays: "",
        revisions: "2",
      },
      {
        name: "Premium",
        description: "",
        price: "",
        deliveryDays: "",
        revisions: "3",
      },
    ],
  });

  const loadData = useCallback(async () => {
    const res = await fetch("/api/admin/services");
    if (res.ok) setServices(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isPending) return;
    if (!session) {
      router.push("/login");
      return;
    }

    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.userType !== "ADMIN") {
          router.push("/discover");
        } else {
          setIsAdmin(true);
          loadData();
        }
      })
      .catch(() => router.push("/discover"));
  }, [session, isPending, router, loadData]);

  const resetForm = () => {
    setStatusMessage(null);
    setFormData({
      name: "",
      description: "",
      category: "",
      tags: "",
      image: "",
      featured: false,
      packages: [
        {
          name: "Basic",
          description: "",
          price: "",
          deliveryDays: "",
          revisions: "1",
        },
        {
          name: "Standard",
          description: "",
          price: "",
          deliveryDays: "",
          revisions: "2",
        },
        {
          name: "Premium",
          description: "",
          price: "",
          deliveryDays: "",
          revisions: "3",
        },
      ],
    });
    setEditingService(null);
  };

  const handleSubmit = async () => {
    const url = "/api/admin/services";
    const method = editingService ? "PATCH" : "POST";

    const packages = formData.packages
      .filter((p) => p.price && p.description)
      .map((p) => ({
        name: p.name,
        description: p.description,
        price: Number(p.price),
        deliveryDays: Number(p.deliveryDays),
        revisions: Number(p.revisions),
      }));

    if (packages.length === 0) {
      setStatusMessage({
        type: "error",
        message: "At least one package with price and description is required",
      });
      return;
    }

    setStatusMessage(null);
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...formData,
        id: editingService?.id,
        tags: formData.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        providerId: session?.user.id,
        packages,
      }),
    });

    if (res.ok) {
      setShowModal(false);
      resetForm();
      loadData();
      setStatusMessage({
        type: "success",
        message: "Service saved successfully.",
      });
    } else {
      const data = await res.json().catch(() => ({}));
      setStatusMessage({
        type: "error",
        message: data.error || "Failed to save service",
      });
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/admin/services?id=${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      loadData();
      setStatusMessage({
        type: "success",
        message: "Service deleted successfully.",
      });
    }
    setDeleteServiceId(null);
  };

  const handleToggleActive = async (service: Service) => {
    const res = await fetch("/api/admin/services", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: service.id, active: !service.active }),
    });
    if (res.ok) loadData();
  };

  const openEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description,
      category: service.category,
      tags: service.tags.join(", "),
      image: service.image || "",
      featured: service.featured,
      packages: service.packages.map((p) => ({
        name: p.name,
        description: p.description,
        price: p.price.toString(),
        deliveryDays: p.deliveryDays.toString(),
        revisions: p.revisions.toString(),
      })),
    });
    setShowModal(true);
  };

  if (isPending || loading || !isAdmin) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface py-6 sm:py-8 lg:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-2 min-w-0">
            <h1 className="text-2xl font-bold text-on-surface">
              Services Management
            </h1>
            <p className="text-gray-500">
              Create and manage services with packages.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="self-start sm:self-auto px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90"
          >
            + New Service
          </button>
        </div>
        <ConfirmModal
          open={Boolean(deleteServiceId)}
          title="Delete service"
          description="Are you sure you want to delete this service? This action cannot be undone."
          confirmText="Yes, delete"
          cancelText="Cancel"
          onConfirm={() => deleteServiceId && handleDelete(deleteServiceId)}
          onCancel={() => setDeleteServiceId(null)}
        />

        {statusMessage && (
          <StatusMessage
            type={statusMessage.type}
            message={statusMessage.message}
            onClose={() => setStatusMessage(null)}
          />
        )}

        <div className="space-y-4">
          {services.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold break-words">
                      {service.name}
                    </h3>
                    {service.featured && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                        Featured
                      </span>
                    )}
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${service.active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}
                    >
                      {service.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{service.category}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    {service.packages.map((p) => (
                      <span key={p.id} className="text-gray-600">
                        {p.name}: €{p.price.toFixed(0)}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(service)}
                    className="px-3 py-1.5 border text-sm rounded-lg"
                  >
                    {service.active ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(service)}
                    className="px-3 py-1.5 border text-sm rounded-lg"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteServiceId(service.id)}
                    className="px-3 py-1.5 border border-red-200 text-red-600 text-sm rounded-lg"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-w-2xl w-full p-5 sm:p-6 space-y-6 max-h-[100dvh] sm:max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold">
              {editingService ? "Edit Service" : "New Service"}
            </h3>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Service Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg"
              />
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border rounded-lg resize-none"
              />
              <input
                type="text"
                placeholder="Category"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Tags (comma separated)"
                value={formData.tags}
                onChange={(e) =>
                  setFormData({ ...formData, tags: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg"
              />
              <input
                type="url"
                placeholder="Image URL"
                value={formData.image}
                onChange={(e) =>
                  setFormData({ ...formData, image: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg"
              />
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) =>
                    setFormData({ ...formData, featured: e.target.checked })
                  }
                />
                <span className="text-sm">Featured</span>
              </label>

              <div className="space-y-4">
                <h4 className="font-medium">Packages</h4>
                {formData.packages.map((pkg, idx) => (
                  <div
                    key={pkg.name}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <h5 className="font-medium text-sm">{pkg.name}</h5>
                    <input
                      type="text"
                      placeholder="Description"
                      value={pkg.description}
                      onChange={(e) => {
                        const newPackages = [...formData.packages];
                        newPackages[idx].description = e.target.value;
                        setFormData({ ...formData, packages: newPackages });
                      }}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="number"
                        placeholder="Price (€)"
                        value={pkg.price}
                        onChange={(e) => {
                          const newPackages = [...formData.packages];
                          newPackages[idx].price = e.target.value;
                          setFormData({ ...formData, packages: newPackages });
                        }}
                        className="px-3 py-2 border rounded-lg text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Days"
                        value={pkg.deliveryDays}
                        onChange={(e) => {
                          const newPackages = [...formData.packages];
                          newPackages[idx].deliveryDays = e.target.value;
                          setFormData({ ...formData, packages: newPackages });
                        }}
                        className="px-3 py-2 border rounded-lg text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Revisions"
                        value={pkg.revisions}
                        onChange={(e) => {
                          const newPackages = [...formData.packages];
                          newPackages[idx].revisions = e.target.value;
                          setFormData({ ...formData, packages: newPackages });
                        }}
                        className="px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 border text-gray-600 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={
                  !formData.name || !formData.description || !formData.category
                }
                className="flex-1 py-2.5 bg-primary text-white rounded-lg disabled:opacity-50"
              >
                {editingService ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
