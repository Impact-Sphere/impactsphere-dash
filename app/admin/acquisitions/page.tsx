"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { authClient } from "@/app/lib/auth-client";

interface Acquisition {
  id: string;
  status: string;
  createdAt: string;
  service: {
    name: string;
    category: string;
    provider: { name: string | null; email: string };
  };
  package: {
    name: string;
    price: number;
  };
  project: {
    title: string;
    ngo: {
      name: string | null;
      email: string;
      ngoInfo: { ngoName: string } | null;
    };
  };
  chat: { id: string } | null;
}

export default function AdminAcquisitionsPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [acquisitions, setAcquisitions] = useState<Acquisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const loadAcquisitions = useCallback(async () => {
    const res = await fetch("/api/admin/acquisitions");
    if (res.ok) {
      setAcquisitions(await res.json());
    }
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
          loadAcquisitions();
        }
      })
      .catch(() => router.push("/discover"));
  }, [session, isPending, router, loadAcquisitions]);

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      ACTIVE: "bg-emerald-100 text-emerald-700",
      COMPLETED: "bg-blue-100 text-blue-700",
      CANCELLED: "bg-gray-100 text-gray-600",
    };
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-600"}`}
      >
        {status}
      </span>
    );
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
              Service Acquisitions
            </h1>
            <p className="text-gray-500">
              Overview of all service acquisitions across projects.
            </p>
          </div>
          <Link
            href="/admin"
            className="self-start sm:self-auto px-4 py-2 border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            Back to Dashboard
          </Link>
        </div>

        <div className="space-y-4">
          {acquisitions.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-12 text-center text-gray-500">
              No service acquisitions yet.
            </div>
          ) : (
            acquisitions.map((acq) => (
              <div
                key={acq.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 gap-1.5">
                      <h3 className="text-lg font-semibold text-on-surface break-words">
                        {acq.service.name}
                        <span className="text-primary font-medium">
                          {" "}
                          — {acq.package.name}
                        </span>
                      </h3>
                      {statusBadge(acq.status)}
                    </div>
                    <p className="text-sm text-gray-500 break-words">
                      Project:{" "}
                      <span className="font-medium">{acq.project.title}</span>
                      {" · "}
                      NGO:{" "}
                      <span className="font-medium">
                        {acq.project.ngo.ngoInfo?.ngoName ||
                          acq.project.ngo.name ||
                          acq.project.ngo.email}
                      </span>
                    </p>
                  </div>
                  {acq.chat && (
                    <Link
                      href={`/chat/${acq.chat.id}`}
                      className="self-start sm:self-auto px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors text-sm"
                    >
                      Open Workroom
                    </Link>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-sm">
                  <div className="space-y-1">
                    <span className="text-gray-400">Category</span>
                    <p className="font-medium text-on-surface break-words">
                      {acq.service.category}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-gray-400">Package Cost</span>
                    <p className="font-medium text-on-surface break-words">
                      €{acq.package.price.toFixed(2)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-gray-400">Provider</span>
                    <p className="font-medium text-on-surface break-words">
                      {acq.service.provider.name || acq.service.provider.email}
                    </p>
                  </div>
                </div>

                <div className="text-xs text-gray-400">
                  Acquired on {new Date(acq.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
