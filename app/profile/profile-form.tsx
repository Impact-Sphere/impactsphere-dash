"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ImageUploadField } from "@/app/components/ui/image-upload-field";
import { authClient } from "@/app/lib/auth-client";
import { cn } from "@/app/lib/utils";
import { Meetings } from "./project-meetings";
import { UserProjects } from "./user-projects";

type ProfileData = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  userType: "NGO" | "COMPANY" | "ADMIN" | null;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED" | null;
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

export function ProfileForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "projects" | "meetings" | "details"
  >("projects");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [taxIdentificationNumber, setTaxIdentificationNumber] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [causesSupported, setCausesSupported] = useState("");
  const [mainGoals, setMainGoals] = useState("");
  const [challenges, setChallenges] = useState("");

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setName(data.name || "");
        setImage(data.image || "");
        if (data.ngoInfo) {
          setOrganizationName(data.ngoInfo.ngoName || "");
          setTaxIdentificationNumber(
            data.ngoInfo.taxIdentificationNumber || "",
          );
          setContactInfo(data.ngoInfo.contactInfo || "");
          setMainGoals(data.ngoInfo.mainGoals || "");
          setChallenges(data.ngoInfo.challenges || "");
        }
        if (data.companyInfo) {
          setOrganizationName(data.companyInfo.companyName || "");
          setTaxIdentificationNumber(
            data.companyInfo.taxIdentificationNumber || "",
          );
          setContactInfo(data.companyInfo.contactInfo || "");
          setCausesSupported(data.companyInfo.causesSupported || "");
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!sessionPending && !session) {
      router.push("/login");
      return;
    }
    if (session) {
      fetchProfile();
    }
  }, [session, sessionPending, router, fetchProfile]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "projects" || tab === "meetings" || tab === "details") {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);

    const payload: Record<string, string | undefined> = {
      name: name || undefined,
      image: image || undefined,
      organizationName: organizationName || undefined,
      taxIdentificationNumber: taxIdentificationNumber || undefined,
      contactInfo: contactInfo || undefined,
    };

    if (profile.userType === "COMPANY") {
      payload.causesSupported = causesSupported || undefined;
    } else if (profile.userType === "NGO") {
      payload.mainGoals = mainGoals || undefined;
      payload.challenges = challenges || undefined;
    }

    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);

    if (res.ok) {
      setIsEditing(false);
      await fetchProfile();
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Failed to save profile.");
    }
  };

  const handleCancel = () => {
    if (!profile) return;
    setName(profile.name || "");
    setImage(profile.image || "");
    if (profile.ngoInfo) {
      setOrganizationName(profile.ngoInfo.ngoName || "");
      setTaxIdentificationNumber(profile.ngoInfo.taxIdentificationNumber || "");
      setContactInfo(profile.ngoInfo.contactInfo || "");
      setMainGoals(profile.ngoInfo.mainGoals || "");
      setChallenges(profile.ngoInfo.challenges || "");
    }
    if (profile.companyInfo) {
      setOrganizationName(profile.companyInfo.companyName || "");
      setTaxIdentificationNumber(
        profile.companyInfo.taxIdentificationNumber || "",
      );
      setContactInfo(profile.companyInfo.contactInfo || "");
      setCausesSupported(profile.companyInfo.causesSupported || "");
    }
    setIsEditing(false);
  };

  if (sessionPending || loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500">
        Failed to load profile.
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

  const approvalStatusConfig =
    profile.approvalStatus === "APPROVED"
      ? { label: "Approved", color: "bg-emerald-100 text-emerald-700", icon: "check_circle" }
      : profile.approvalStatus === "REJECTED"
        ? { label: "Rejected", color: "bg-red-100 text-red-700", icon: "cancel" }
        : profile.approvalStatus === "PENDING"
          ? { label: "Pending", color: "bg-amber-100 text-amber-700", icon: "hourglass_empty" }
          : null;

  const avatarUrl = profile.image || undefined;
  const initials = (profile.name || profile.email || "?")
    .charAt(0)
    .toUpperCase();

  const TabButton = ({
    tab,
    label,
    icon,
  }: {
    tab: "projects" | "meetings" | "details";
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
              {avatarUrl || image ? (
                // biome-ignore lint/performance/noImgElement: user-provided avatar URLs may be external
                <img
                  src={image || avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                initials
              )}
              {isEditing && (
                <button
                  type="button"
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/*";
                    input.onchange = async (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (!file) return;
                      const formData = new FormData();
                      formData.append("file", file);
                      const res = await fetch("/api/upload", {
                        method: "POST",
                        body: formData,
                      });
                      const data = await res.json();
                      if (data.url) setImage(data.url);
                    };
                    input.click();
                  }}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity"
                >
                  <span className="material-symbols-outlined text-white text-xl">
                    photo_camera
                  </span>
                </button>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-on-surface">
                  {profile.name || "Unnamed User"}
                </h1>
              </div>
              <p className="text-gray-500">{profile.email}</p>
              <div className="flex items-center gap-2 flex-wrap">
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
                {approvalStatusConfig && profile.userType !== "ADMIN" && (
                  <div
                    className={cn(
                      "inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-sm font-medium",
                      approvalStatusConfig.color,
                    )}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {approvalStatusConfig.icon}
                    </span>
                    <span>{approvalStatusConfig.label}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          {!isEditing && (
            <button
              type="button"
              onClick={() => {
                setActiveTab("details");
                setIsEditing(true);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">
                edit
              </span>
              <span>Edit Profile</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2">
        <TabButton tab="projects" label="Projects" icon="grid_view" />
        {(profile.userType === "NGO" || profile.userType === "COMPANY") && (
          <TabButton
            tab="meetings"
            label="Meeting Requests"
            icon="calendar_month"
          />
        )}
        <TabButton tab="details" label="Organization Details" icon="badge" />
      </div>

      {/* Projects Tab */}
      {activeTab === "projects" && (
        <div className="space-y-6">
          {(profile.userType === "NGO" || profile.userType === "COMPANY") && (
            <UserProjects userType={profile.userType} />
          )}
        </div>
      )}

      {/* Meetings Tab */}
      {activeTab === "meetings" && <Meetings userType={profile.userType} />}

      {/* Details Tab */}
      {activeTab === "details" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="text-sm font-medium text-on-surface">
                Display Name
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Your name"
                />
              ) : (
                <p className="text-gray-700">{profile.name || "—"}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <div className="text-sm font-medium text-on-surface">
                Profile Photo
              </div>
              {isEditing ? (
                <ImageUploadField
                  value={image}
                  onChange={setImage}
                  label="Upload profile photo"
                  previewClassName="w-32 h-32 rounded-2xl object-cover"
                />
              ) : (
                <p className="text-gray-700">{profile.image || "—"}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-on-surface">
                {profile.userType === "COMPANY"
                  ? "Company Name"
                  : "Organization Name"}
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Organization name"
                />
              ) : (
                <p className="text-gray-700">{organizationName || "—"}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-on-surface">
                Tax Identification Number
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={taxIdentificationNumber}
                  onChange={(e) => setTaxIdentificationNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="123456789"
                />
              ) : (
                <p className="text-gray-700">
                  {taxIdentificationNumber || "—"}
                </p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <div className="text-sm font-medium text-on-surface">
                Contact Info
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Phone or email"
                />
              ) : (
                <p className="text-gray-700">{contactInfo || "—"}</p>
              )}
            </div>

            {profile.userType === "COMPANY" && (
              <div className="space-y-2 md:col-span-2">
                <div className="text-sm font-medium text-on-surface">
                  Causes Supported
                </div>
                {isEditing ? (
                  <textarea
                    value={causesSupported}
                    onChange={(e) => setCausesSupported(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    placeholder="List causes your company supports..."
                  />
                ) : (
                  <p className="text-gray-700 whitespace-pre-line">
                    {causesSupported || "—"}
                  </p>
                )}
              </div>
            )}

            {profile.userType === "NGO" && (
              <>
                <div className="space-y-2 md:col-span-2">
                  <div className="text-sm font-medium text-on-surface">
                    Main Goals
                  </div>
                  {isEditing ? (
                    <textarea
                      value={mainGoals}
                      onChange={(e) => setMainGoals(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                      placeholder="Describe your primary mission and goals..."
                    />
                  ) : (
                    <p className="text-gray-700 whitespace-pre-line">
                      {mainGoals || "—"}
                    </p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <div className="text-sm font-medium text-on-surface">
                    Challenges
                  </div>
                  {isEditing ? (
                    <textarea
                      value={challenges}
                      onChange={(e) => setChallenges(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                      placeholder="What challenges does your organization face?"
                    />
                  ) : (
                    <p className="text-gray-700 whitespace-pre-line">
                      {challenges || "—"}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          {isEditing && (
            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 py-2.5 px-4 border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 px-4 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
