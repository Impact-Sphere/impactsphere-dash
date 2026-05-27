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
  const [projectDocuments, setProjectDocuments] = useState<
    {
      id: string;
      url: string;
      fileName: string;
      mimeType?: string;
      size?: number;
    }[]
  >([]);
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

  const handleUploadDocuments = async (files: FileList | null) => {
    if (!files?.length) return;

    const countLeft = 5 - projectDocuments.length;
    if (countLeft <= 0) {
      alert("You can only upload up to 5 documents.");
      return;
    }

    const selectedFiles = Array.from(files).slice(0, countLeft);
    if (files.length > countLeft) {
      alert(
        `Only ${countLeft} more document${countLeft === 1 ? "" : "s"} can be added.`,
      );
    }

    const uploaded: typeof projectDocuments = [];
    for (const file of selectedFiles) {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        uploaded.push({
          id: data.id,
          url: data.url,
          fileName: file.name,
          mimeType: file.type,
          size: file.size,
        });
      } else {
        const error = await res
          .json()
          .catch(() => ({ error: "Upload failed" }));
        alert(error.error || "Unable to upload document.");
      }
    }

    setProjectDocuments((current) => [...current, ...uploaded]);
  };

  const removeDocument = (id: string) => {
    setProjectDocuments((current) => current.filter((doc) => doc.id !== id));
  };

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
        projectDocuments: projectDocuments.map((doc) => doc.id),
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
                Supporting Documents
              </div>
              <input
                type="file"
                multiple
                onChange={(e) => handleUploadDocuments(e.target.files)}
                disabled={projectDocuments.length >= 5}
                className="w-full text-sm text-gray-500 file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-gray-700 file:rounded-lg file:hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
              />
              {projectDocuments.length ? (
                <div className="flex flex-wrap gap-3 mt-3">
                  {projectDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="group relative flex items-center justify-center w-28 h-28 rounded-2xl border border-gray-200 bg-gray-50 p-3 text-xs text-left overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-white/60 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                      <div className="relative z-10 w-full h-full flex flex-col justify-between">
                        <div className="text-xs font-semibold text-gray-800 truncate">
                          {doc.fileName}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary underline text-[11px]"
                          >
                            Open
                          </a>
                          <button
                            type="button"
                            onClick={() => removeDocument(doc.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 opacity-0 transition-opacity duration-200 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600"
                            aria-label="Remove document"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">
                  Optional. Add documents that explain your project purpose.
                </p>
              )}
              <p className="text-xs text-gray-400">Up to 5 documents.</p>
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
