"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { authClient } from "@/app/lib/auth-client";
import { cn } from "@/app/lib/utils";
import { UserProjects } from "../user-projects";

type ProfileData = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  userType: "NGO" | "COMPANY" | "ADMIN" | null;
  createdAt: string;
  ngoInfo: {
    ngoName: string;
    taxIdentificationNumber: string;
    contactInfo: string;
    mainGoals: string;
    challenges: string;
  } | null;
  companyInfo: {
    companyName: string;
    taxIdentificationNumber: string;
    contactInfo: string;
    causesSupported: string;
  } | null;
};

export function PublicProfileView() {
  const params = useParams();
  const id = params.id as string;
  const { data: session } = authClient.useSession();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"projects" | "details">(
    "projects",
  );

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch(`/api/profile/${id}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      } else {
        setError("User not found.");
      }
    } catch {
      setError("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fetchProfile();
  }, [id, fetchProfile]);

  const isOwnProfile = session?.user?.id === id;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500">
        {error || "Failed to load profile."}
      </div>
    );
  }

  const typeLabel =
    profile.userType === "NGO"
      ? "Non-Governmental Organization"
      : profile.userType === "COMPANY"
        ? "Company"
        : profile.userType === "ADMIN"
          ? "Administrator"
          : "Unknown";

  const typeIcon =
    profile.userType === "NGO"
      ? "diversity_3"
      : profile.userType === "COMPANY"
        ? "business"
        : "person";

  const typeColor =
    profile.userType === "NGO"
      ? "bg-emerald-100 text-emerald-700"
      : profile.userType === "COMPANY"
        ? "bg-blue-100 text-blue-700"
        : "bg-violet-100 text-violet-700";

  const avatarUrl = profile.image || undefined;
  const initials = (profile.name || profile.email || "?")
    .charAt(0)
    .toUpperCase();

  const orgName =
    profile.ngoInfo?.ngoName || profile.companyInfo?.companyName || "—";
  const taxId =
    profile.ngoInfo?.taxIdentificationNumber ||
    profile.companyInfo?.taxIdentificationNumber ||
    "—";
  const contact =
    profile.ngoInfo?.contactInfo || profile.companyInfo?.contactInfo || "—";

  const TabButton = ({
    tab,
    label,
    icon,
  }: {
    tab: "projects" | "details";
    label: string;
    icon: string;
  }) => (
    <button
      type="button"
      onClick={() => setActiveTab(tab)}
      className={cn(
        "flex items-center space-x-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all",
        activeTab === tab
          ? "bg-primary text-white shadow-lg shadow-primary/25"
          : "text-on-surface-variant hover:bg-surface-container-high",
      )}
    >
      <span className="material-symbols-outlined text-[18px]">{icon}</span>
      <span>{label}</span>
    </button>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-6">
            <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-violet-100 flex items-center justify-center text-3xl font-bold text-violet-700">
              {avatarUrl ? (
                // biome-ignore lint/performance/noImgElement: user-provided avatar URLs may be external
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-on-surface">
                {profile.name || "Unnamed User"}
              </h1>
              <p className="text-gray-500">{profile.email}</p>
              <div
                className={cn(
                  "inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-sm font-medium",
                  typeColor,
                )}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {typeIcon}
                </span>
                <span>{typeLabel}</span>
              </div>
            </div>
          </div>
          {isOwnProfile && (
            <a
              href="/profile"
              className="flex items-center space-x-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">
                edit
              </span>
              <span>Edit Profile</span>
            </a>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2">
        <TabButton tab="projects" label="Projects" icon="grid_view" />
        <TabButton tab="details" label="Organization Details" icon="badge" />
      </div>

      {/* Projects Tab */}
      {activeTab === "projects" &&
        (profile.userType === "NGO" || profile.userType === "COMPANY") && (
          <UserProjects
            userType={profile.userType}
            userId={profile.id}
            isPublic
          />
        )}

      {/* Details Tab */}
      {activeTab === "details" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
          <h2 className="text-lg font-semibold text-on-surface flex items-center space-x-2">
            <span className="material-symbols-outlined text-violet-600">
              badge
            </span>
            <span>Organization Details</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="text-sm font-medium text-on-surface">
                {profile.userType === "COMPANY"
                  ? "Company Name"
                  : "Organization Name"}
              </div>
              <p className="text-gray-700">{orgName}</p>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-on-surface">
                Tax Identification Number
              </div>
              <p className="text-gray-700">{taxId}</p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <div className="text-sm font-medium text-on-surface">
                Contact Info
              </div>
              <p className="text-gray-700">{contact}</p>
            </div>

            {profile.userType === "COMPANY" && profile.companyInfo && (
              <div className="space-y-2 md:col-span-2">
                <div className="text-sm font-medium text-on-surface">
                  Causes Supported
                </div>
                <p className="text-gray-700 whitespace-pre-line">
                  {profile.companyInfo.causesSupported || "—"}
                </p>
              </div>
            )}

            {profile.userType === "NGO" && profile.ngoInfo && (
              <>
                <div className="space-y-2 md:col-span-2">
                  <div className="text-sm font-medium text-on-surface">
                    Main Goals
                  </div>
                  <p className="text-gray-700 whitespace-pre-line">
                    {profile.ngoInfo.mainGoals || "—"}
                  </p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <div className="text-sm font-medium text-on-surface">
                    Challenges
                  </div>
                  <p className="text-gray-700 whitespace-pre-line">
                    {profile.ngoInfo.challenges || "—"}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
