"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    tags: "",
    image: "",
    featured: false,
    packages: [
      { name: "Basic", description: "", price: "", deliveryDays: "", revisions: "1" },
      { name: "Standard", description: "", price: "", deliveryDays: "", revisions: "2" },
      { name: "Premium", description: "", price: "", deliveryDays: "", revisions: "3" },
    ],
  });

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
  }, [session, isPending, router]);

  const loadData = async () => {
    const res = await fetch("/api/admin/services");
    if (res.ok) setServices(await res.json());
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "",
      tags: "",
      image: "",
      featured: false,
      packages: [
        { name: "Basic", description: "", price: "", deliveryDays: "", revisions: "1" },
        { name: "Standard", description: "", price: "", deliveryDays: "", revisions: "2" },
        { name: "Premium", description: "", price: "", deliveryDays: "", revisions: "3" },
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
      alert("At least one package with price and description is required");
      return;
    }

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...formData,
        id: editingService?.id,
        tags: formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
        providerId: session?.user.id,
        packages,
      }),
    });

    if (res.ok) {
      setShowModal(false);
      resetForm();
      loadData();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Failed to save service");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    const res = await fetch(`/api/admin/services?id=${id}`, { method: "DELETE" });
    if (res.ok) loadData();
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
      <main className="ml-72 min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="ml-72 min-h-screen bg-surface py-12 px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-on-surface">Services Management</h1>
            <p className="text-gray-500">Create and manage services with packages.</p>
          </div>
          <button
            type="button"
            onClick={() => { resetForm(); setShowModal(true); }}
            className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90"
          >
            + New Service
          </button>
        </div>

        <div className="space-y-4">
          {services.map((service) => (
            <div key={service.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{service.name}</h3>
                    {service.featured && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Featured</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${service.active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                      {service.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{service.category}</p>
                  <div className="flex gap-4 text-sm">
                    {service.packages.map((p) => (
                      <span key={p.id} className="text-gray-600">
                        {p.name}: €{p.price.toFixed(0)}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleToggleActive(service)} className="px-3 py-1.5 border text-sm rounded-lg">{service.active ? "Deactivate" : "Activate"}</button>
                  <button onClick={() => openEdit(service)} className="px-3 py-1.5 border text-sm rounded-lg">Edit</button>
                  <button onClick={() => handleDelete(service.id)} className="px-3 py-1.5 border border-red-200 text-red-600 text-sm rounded-lg">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold">{editingService ? "Edit Service" : "New Service"}</h3>

            <div className="space-y-4">
              <input type="text" placeholder="Service Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              <textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-3 py-2 border rounded-lg resize-none" />
              <input type="text" placeholder="Category" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              <input type="text" placeholder="Tags (comma separated)" value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              <input type="url" placeholder="Image URL" value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formData.featured} onChange={(e) => setFormData({ ...formData, featured: e.target.checked })} />
                <span className="text-sm">Featured</span>
              </label>

              <div className="space-y-4">
                <h4 className="font-medium">Packages</h4>
                {formData.packages.map((pkg, idx) => (
                  <div key={idx} className="border rounded-lg p-4 space-y-3">
                    <h5 className="font-medium text-sm">{pkg.name}</h5>
                    <input type="text" placeholder="Description" value={pkg.description} onChange={(e) => {
                      const newPackages = [...formData.packages];
                      newPackages[idx].description = e.target.value;
                      setFormData({ ...formData, packages: newPackages });
                    }} className="w-full px-3 py-2 border rounded-lg text-sm" />
                    <div className="grid grid-cols-3 gap-2">
                      <input type="number" placeholder="Price (€)" value={pkg.price} onChange={(e) => {
                        const newPackages = [...formData.packages];
                        newPackages[idx].price = e.target.value;
                        setFormData({ ...formData, packages: newPackages });
                      }} className="px-3 py-2 border rounded-lg text-sm" />
                      <input type="number" placeholder="Days" value={pkg.deliveryDays} onChange={(e) => {
                        const newPackages = [...formData.packages];
                        newPackages[idx].deliveryDays = e.target.value;
                        setFormData({ ...formData, packages: newPackages });
                      }} className="px-3 py-2 border rounded-lg text-sm" />
                      <input type="number" placeholder="Revisions" value={pkg.revisions} onChange={(e) => {
                        const newPackages = [...formData.packages];
                        newPackages[idx].revisions = e.target.value;
                        setFormData({ ...formData, packages: newPackages });
                      }} className="px-3 py-2 border rounded-lg text-sm" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 border text-gray-600 rounded-lg">Cancel</button>
              <button onClick={handleSubmit} disabled={!formData.name || !formData.description || !formData.category} className="flex-1 py-2.5 bg-primary text-white rounded-lg disabled:opacity-50">{editingService ? "Update" : "Create"}</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
