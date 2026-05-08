"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { authClient } from "@/app/lib/auth-client";

type Step = "select-type" | "ngo-details" | "company-details";

export function OnboardingForm() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [step, setStep] = useState<Step>("select-type");
  const [submitting, setSubmitting] = useState(false);

  const [organizationName, setOrganizationName] = useState("");
  const [taxIdentificationNumber, setTaxIdentificationNumber] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [causesSupported, setCausesSupported] = useState("");
  const [mainGoals, setMainGoals] = useState("");
  const [challenges, setChallenges] = useState("");

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
      return;
    }

    const checkOnboarding = async () => {
      const res = await fetch("/api/onboarding");
      const data = await res.json();
      if (!data.needsOnboarding) {
        router.push("/");
      }
    };

    if (!isPending && session) {
      checkOnboarding();
    }
  }, [session, isPending, router]);

  const handleSelectType = (type: "NGO" | "COMPANY") => {
    setStep(type === "NGO" ? "ngo-details" : "company-details");
  };

  const handleSubmit = async (userType: "NGO" | "COMPANY") => {
    setSubmitting(true);

    const payload: Record<string, string | undefined> = {
      userType,
      organizationName,
      taxIdentificationNumber,
      contactInfo,
    };

    if (userType === "COMPANY") {
      payload.causesSupported = causesSupported;
    } else {
      payload.mainGoals = mainGoals;
      payload.challenges = challenges;
    }

    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSubmitting(false);

    if (res.ok) {
      router.push("/pending-approval");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Something went wrong. Please try again.");
    }
  };

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (step === "select-type") {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-lg font-semibold text-on-surface">
            What type of organization do you represent?
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => handleSelectType("NGO")}
            className="group relative flex flex-col items-center justify-center p-8 border-2 border-gray-200 rounded-2xl hover:border-violet-500 hover:bg-violet-50 transition-all duration-200"
          >
            <span className="material-symbols-outlined text-5xl text-violet-600 mb-4 group-hover:scale-110 transition-transform">
              diversity_3
            </span>
            <h3 className="text-lg font-bold text-on-surface mb-2">
              Non-Governmental Organization
            </h3>
            <p className="text-sm text-gray-500 text-center">
              I represent an NGO looking for funding and partnerships
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleSelectType("COMPANY")}
            className="group relative flex flex-col items-center justify-center p-8 border-2 border-gray-200 rounded-2xl hover:border-violet-500 hover:bg-violet-50 transition-all duration-200"
          >
            <span className="material-symbols-outlined text-5xl text-violet-600 mb-4 group-hover:scale-110 transition-transform">
              business
            </span>
            <h3 className="text-lg font-bold text-on-surface mb-2">Company</h3>
            <p className="text-sm text-gray-500 text-center">
              I represent a company looking to invest in impact projects
            </p>
          </button>
        </div>
      </div>
    );
  }

  if (step === "company-details") {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-lg font-semibold text-on-surface">
            Company Details
          </h2>
          <p className="text-sm text-gray-500">
            Tell us more about your company
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="companyName"
              className="text-sm font-medium text-on-surface"
            >
              Company Name
            </label>
            <input
              id="companyName"
              type="text"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Acme Corp"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="taxId"
              className="text-sm font-medium text-on-surface"
            >
              Tax Identification Number
            </label>
            <input
              id="taxId"
              type="text"
              value={taxIdentificationNumber}
              onChange={(e) => setTaxIdentificationNumber(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="123456789"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="contact"
              className="text-sm font-medium text-on-surface"
            >
              Contact (Phone or Email)
            </label>
            <input
              id="contact"
              type="text"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="+1 234 567 890"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="causes"
              className="text-sm font-medium text-on-surface"
            >
              Causes You Support
            </label>
            <textarea
              id="causes"
              value={causesSupported}
              onChange={(e) => setCausesSupported(e.target.value)}
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              placeholder="LGBT rights, Women's rights, Disability rights, Climate action..."
            />
            <p className="text-xs text-gray-400">
              List the causes your company supports or invests in
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep("select-type")}
              className="flex-1 py-2.5 px-4 border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => handleSubmit("COMPANY")}
              disabled={
                submitting ||
                !organizationName ||
                !taxIdentificationNumber ||
                !contactInfo ||
                !causesSupported
              }
              className="flex-1 py-2.5 px-4 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "Saving..." : "Finish"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "ngo-details") {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-lg font-semibold text-on-surface">NGO Details</h2>
          <p className="text-sm text-gray-500">
            Tell us more about your organization
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="ngoName"
              className="text-sm font-medium text-on-surface"
            >
              NGO Name
            </label>
            <input
              id="ngoName"
              type="text"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Helping Hands Foundation"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="taxId"
              className="text-sm font-medium text-on-surface"
            >
              Tax Identification Number
            </label>
            <input
              id="taxId"
              type="text"
              value={taxIdentificationNumber}
              onChange={(e) => setTaxIdentificationNumber(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="123456789"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="contact"
              className="text-sm font-medium text-on-surface"
            >
              Contact (Phone or Email)
            </label>
            <input
              id="contact"
              type="text"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="+1 234 567 890"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="goals"
              className="text-sm font-medium text-on-surface"
            >
              Main Goals
            </label>
            <textarea
              id="goals"
              value={mainGoals}
              onChange={(e) => setMainGoals(e.target.value)}
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              placeholder="Provide education to underprivileged children, reduce hunger..."
            />
            <p className="text-xs text-gray-400">
              Describe your organization&apos;s primary mission and goals
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="challenges"
              className="text-sm font-medium text-on-surface"
            >
              Challenges
            </label>
            <textarea
              id="challenges"
              value={challenges}
              onChange={(e) => setChallenges(e.target.value)}
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              placeholder="Lack of funding, limited volunteer base, access to remote areas..."
            />
            <p className="text-xs text-gray-400">
              What are the main challenges your organization faces?
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep("select-type")}
              className="flex-1 py-2.5 px-4 border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => handleSubmit("NGO")}
              disabled={
                submitting ||
                !organizationName ||
                !taxIdentificationNumber ||
                !contactInfo ||
                !mainGoals ||
                !challenges
              }
              className="flex-1 py-2.5 px-4 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "Saving..." : "Finish"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
