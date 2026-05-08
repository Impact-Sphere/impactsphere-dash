"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ImageUploadField } from "@/app/components/ui/image-upload-field";
import { authClient } from "@/app/lib/auth-client";

const CATEGORY_OPTIONS = [
  "Environment",
  "Education",
  "Healthcare",
  "Tech Equity",
  "Disaster Relief",
];

export default function NewProjectPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Environment");
  const [image, setImage] = useState("");
  const [targetBudget, setTargetBudget] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (isPending) return;
    if (!session) {
      router.push("/login");
      return;
    }
    // Verify user is approved NGO
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.userType !== "NGO" || data.approvalStatus !== "APPROVED") {
          router.push("/discover");
        } else {
          setChecking(false);
        }
      })
      .catch(() => router.push("/discover"));
  }, [session, isPending, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        category,
        image: image || undefined,
        targetBudget: Number(targetBudget),
      }),
    });

    setSubmitting(false);

    if (res.ok) {
      const project = await res.json();
      router.push(`/projects/${project.id}`);
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Failed to create project.");
    }
  };

  if (isPending || checking) {
    return (
      <main className="ml-72 min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="ml-72 min-h-screen bg-surface py-12 px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-on-surface">
              Create a New Project
            </h1>
            <p className="text-gray-500">
              Launch your initiative and start receiving funding from
              impact-driven companies.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <div className="text-sm font-medium text-on-surface">
                Project Title
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="e.g. Clean Water for Rural Schools"
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-on-surface">
                Category
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-on-surface">
                Description
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={5}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                placeholder="Describe your project, its goals, and the impact it will create..."
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-on-surface">
                Cover Image
              </div>
              <ImageUploadField
                value={image}
                onChange={setImage}
                label="Upload cover image"
              />
              <p className="text-xs text-gray-400">
                Optional. Leave blank for a default image.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-on-surface">
                Target Budget (USD)
              </div>
              <input
                type="number"
                value={targetBudget}
                onChange={(e) => setTargetBudget(e.target.value)}
                required
                min={1}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="50000"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.push("/discover")}
                className="flex-1 py-2.5 px-4 border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !title || !description || !targetBudget}
                className="flex-1 py-2.5 px-4 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? "Creating..." : "Create Project"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
