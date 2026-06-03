"use client";

import { useRouter } from "next/navigation";
import { type Dispatch, type SetStateAction, useEffect, useState } from "react";
import { authClient } from "@/app/lib/auth-client";

type Step =
  | "select-type"
  | "identity"
  | "contact"
  | "legal"
  | "representative"
  | "activity"
  | "declaration";

type UserType = "NGO" | "COMPANY";

type UploadedFile = {
  id: string; // <-- added
  url: string;
  fileName: string;
  mimeType?: string;
  size?: number;
};

type ValidationError = {
  field: string;
  message: string;
};

const NGO_TYPES = [
  "education",
  "health",
  "environment",
  "humanitarian",
  "other",
];
const ID_TYPES = ["Passport", "National ID"];
const INDUSTRY_TYPES = [
  "Technology",
  "Finance",
  "Health",
  "Education",
  "Energy",
  "Manufacturing",
  "Consumer Goods",
  "Services",
  "Other",
];

const STEP_LABELS: Record<Exclude<Step, "select-type">, string> = {
  identity: "Organization identity",
  contact: "Contact information",
  legal: "Legal / formal identity",
  representative: "Representative identity",
  activity: "Activity proof",
  declaration: "Declaration",
};

const COMPANY_STEPS: Step[] = [
  "identity",
  "contact",
  "legal",
  "representative",
  "declaration",
];
const NGO_STEPS: Step[] = [
  "identity",
  "contact",
  "legal",
  "representative",
  "activity",
  "declaration",
];

const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const isValidPhoneNumber = (value: string) =>
  !value || /^[+0-9()\s-]{7,25}$/.test(value.trim());

export function OnboardingForm() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [step, setStep] = useState<Step>("select-type");
  const [userType, setUserType] = useState<UserType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<ValidationError[]>([]);

  const [organizationName, setOrganizationName] = useState("");
  const [country, setCountry] = useState("");
  const [cityRegion, setCityRegion] = useState("");
  const [ngoType, setNgoType] = useState(NGO_TYPES[0]);
  const [industryType, setIndustryType] = useState(INDUSTRY_TYPES[0]);
  const [yearFounded, setYearFounded] = useState("");
  const [missionStatement, setMissionStatement] = useState("");
  const [activitiesDescription, setActivitiesDescription] = useState("");
  const [currentOrPastProjects, setCurrentOrPastProjects] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [website, setWebsite] = useState("");
  const [registeredAddress, setRegisteredAddress] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [taxVatNumber, setTaxVatNumber] = useState("");
  const [representativeFullName, setRepresentativeFullName] = useState("");
  const [representativeRole, setRepresentativeRole] = useState("");
  const [representativeJobTitle, setRepresentativeJobTitle] = useState("");
  const [representativeIdType, setRepresentativeIdType] = useState(ID_TYPES[0]);
  const [representativeIdNumber, setIdNumber] = useState("");
  const [registrationDocuments, setRegistrationDocuments] = useState<
    UploadedFile[]
  >([]);
  const [idDocumentUrl, setIdDocumentUrl] = useState("");
  const [activityProofUrls, setActivityProofUrls] = useState<UploadedFile[]>(
    [],
  );
  const [activityProofLink, setActivityProofLink] = useState("");
  const [declarationConfirmed, setDeclarationConfirmed] = useState(false);

  const getFieldError = (field: string) =>
    fieldErrors.find((e) => e.field === field)?.message;

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
      return;
    }

    const checkOnboarding = async () => {
      const res = await fetch("/api/onboarding");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Unable to check onboarding status.");
        return;
      }
      const data = await res.json();
      if (!data.needsOnboarding) {
        router.push("/");
      }
    };

    if (!isPending && session) {
      checkOnboarding();
    }
  }, [session, isPending, router]);

  // Returns { id, url } from the upload API
  const uploadFile = async (
    file: File,
  ): Promise<{ id: string; url: string }> => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Upload failed.");
    }
    return { id: data.id, url: data.url };
  };

  const removeUploadedFile = (
    url: string,
    setter: Dispatch<SetStateAction<UploadedFile[]>>,
  ) => {
    setter((current) => current.filter((item) => item.url !== url));
  };

  const handleUploadFiles = async (
    files: FileList | null,
    setter: Dispatch<SetStateAction<UploadedFile[]>>,
    currentCount = 0,
  ) => {
    if (!files || files.length === 0) return;

    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    const MAX_FILES = 5;
    const ALLOWED_TYPES = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "video/mp4",
      "video/webm",
      "video/quicktime",
    ];

    if (currentCount + files.length > MAX_FILES) {
      setError(`You can upload a maximum of ${MAX_FILES} files.`);
      return;
    }

    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE) {
        setError(`${file.name} exceeds the 10MB limit.`);
        return;
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(`${file.name} has an unsupported file type.`);
        return;
      }
    }

    setError("");

    const uploadedFiles: UploadedFile[] = [];
    for (const file of Array.from(files)) {
      try {
        const { id, url } = await uploadFile(file);
        uploadedFiles.push({
          id,
          url,
          fileName: file.name,
          mimeType: file.type,
          size: file.size,
        });
      } catch (uploadError) {
        setError((uploadError as Error).message);
      }
    }

    if (uploadedFiles.length > 0) {
      setter((current) => [...current, ...uploadedFiles]);
    }
  };

  const handleTypeSelection = (type: UserType) => {
    setUserType(type);
    setStep("identity");
  };

  const currentSteps = userType
    ? userType === "COMPANY"
      ? COMPANY_STEPS
      : NGO_STEPS
    : [];

  const currentStepIndex = currentSteps.indexOf(step);
  const isFinalStep = step === "declaration";

  const validateStep = (stepToValidate: Step): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (!userType) {
      errors.push({
        field: "userType",
        message: "Please select organization type.",
      });
      return errors;
    }

    switch (stepToValidate) {
      case "identity":
        if (!organizationName)
          errors.push({
            field: "organizationName",
            message: "Organization name is required.",
          });
        if (!country)
          errors.push({ field: "country", message: "Country is required." });
        if (userType === "COMPANY") {
          if (!businessDescription)
            errors.push({
              field: "businessDescription",
              message: "Business description is required.",
            });
        } else {
          if (!missionStatement)
            errors.push({
              field: "missionStatement",
              message: "Mission statement is required.",
            });
          if (!activitiesDescription)
            errors.push({
              field: "activitiesDescription",
              message: "Activities description is required.",
            });
          if (!currentOrPastProjects)
            errors.push({
              field: "currentOrPastProjects",
              message: "Project history is required.",
            });
        }
        break;
      case "contact":
        if (!contactEmail)
          errors.push({
            field: "contactEmail",
            message: "Contact email is required.",
          });
        else if (!isValidEmail(contactEmail))
          errors.push({
            field: "contactEmail",
            message: "Enter a valid email address.",
          });
        if (!isValidPhoneNumber(phoneNumber))
          errors.push({
            field: "phoneNumber",
            message: "Enter a valid phone number or leave it blank.",
          });
        if (userType === "COMPANY" && !registeredAddress)
          errors.push({
            field: "registeredAddress",
            message: "Registered address is required for companies.",
          });
        break;
      case "legal":
        if (!registrationNumber)
          errors.push({
            field: "registrationNumber",
            message: "Registration number is required.",
          });
        if (registrationDocuments.length === 0)
          errors.push({
            field: "registrationDocuments",
            message: "Upload at least one registration document.",
          });
        break;
      case "representative":
        if (!representativeFullName)
          errors.push({
            field: "representativeFullName",
            message: "Representative full name is required.",
          });
        if (!representativeIdType)
          errors.push({
            field: "representativeIdType",
            message: "Select an ID type.",
          });
        if (!representativeIdNumber)
          errors.push({
            field: "representativeIdNumber",
            message: "ID number is required.",
          });
        if (!idDocumentUrl)
          errors.push({
            field: "idDocumentUrl",
            message: "Upload an ID document.",
          });
        if (userType === "COMPANY" && !representativeJobTitle)
          errors.push({
            field: "representativeJobTitle",
            message: "Representative job title is required.",
          });
        if (userType === "NGO" && !representativeRole)
          errors.push({
            field: "representativeRole",
            message: "Representative role is required.",
          });
        break;
      case "activity":
        if (userType === "NGO") {
          if (activityProofUrls.length === 0 && !activityProofLink)
            errors.push({
              field: "activityProof",
              message: "Provide at least one activity proof file or link.",
            });
          if (activityProofLink && !/^https?:\/\//.test(activityProofLink))
            errors.push({
              field: "activityProofLink",
              message: "Enter a valid URL for the proof link.",
            });
        }
        break;
      case "declaration":
        if (!declarationConfirmed)
          errors.push({
            field: "declarationConfirmed",
            message: "You must confirm the declaration to continue.",
          });
        break;
    }

    return errors;
  };

  const currentStepErrors = validateStep(step);
  const stepIsValid = () =>
    !userType ? false : validateStep(step).length === 0;

  const handleBack = () => {
    if (step === "select-type") return;
    if (currentStepIndex > 0) {
      setStep(currentSteps[currentStepIndex - 1]);
    } else {
      setStep("select-type");
    }
  };

  const handleNext = async () => {
    const errors = validateStep(step);
    if (errors.length > 0) {
      setFieldErrors(errors);
      setError(errors[0].message);
      return;
    }
    setFieldErrors([]);
    setError("");
    if (isFinalStep) {
      await handleSubmit();
      return;
    }
    setStep(currentSteps[currentStepIndex + 1]);
  };

  const validateForm = (): ValidationError[] => {
    const errors: ValidationError[] = [];
    if (!userType)
      errors.push({
        field: "userType",
        message: "Please select organization type.",
      });
    if (!organizationName)
      errors.push({
        field: "organizationName",
        message: "Organization name is required.",
      });
    if (!country)
      errors.push({ field: "country", message: "Country is required." });
    if (!contactEmail)
      errors.push({
        field: "contactEmail",
        message: "Contact email is required.",
      });
    else if (!isValidEmail(contactEmail))
      errors.push({
        field: "contactEmail",
        message: "Email format is invalid.",
      });
    if (!registrationNumber)
      errors.push({
        field: "registrationNumber",
        message: "Registration number is required.",
      });
    if (!declarationConfirmed)
      errors.push({
        field: "declarationConfirmed",
        message: "You must confirm the declaration.",
      });
    if (!idDocumentUrl)
      errors.push({
        field: "idDocumentUrl",
        message: "ID document must be uploaded.",
      });
    if (registrationDocuments.length === 0)
      errors.push({
        field: "registrationDocuments",
        message: "At least one document is required.",
      });
    if (
      userType === "NGO" &&
      activityProofUrls.length === 0 &&
      !activityProofLink
    ) {
      errors.push({
        field: "activityProof",
        message: "Provide at least one activity proof (file or link).",
      });
    }
    return errors;
  };

  const handleSubmit = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      setFieldErrors(errors);
      setError(errors[0].message);
      return;
    }

    setSubmitting(true);

    const payload = {
      userType,
      organizationName,
      country,
      cityRegion: userType === "NGO" ? cityRegion : undefined,
      ngoType: userType === "NGO" ? ngoType : undefined,
      industryType: userType === "COMPANY" ? industryType : undefined,
      yearFounded: yearFounded ? Number(yearFounded) : undefined,
      missionStatement: userType === "NGO" ? missionStatement : undefined,
      activitiesDescription:
        userType === "NGO" ? activitiesDescription : undefined,
      currentOrPastProjects:
        userType === "NGO" ? currentOrPastProjects : undefined,
      businessDescription:
        userType === "COMPANY" ? businessDescription : undefined,
      contactEmail,
      phoneNumber: phoneNumber || undefined,
      website: website || undefined,
      registeredAddress: userType === "COMPANY" ? registeredAddress : undefined,
      registrationNumber: registrationNumber || undefined,
      taxVatNumber:
        userType === "COMPANY" ? taxVatNumber || undefined : undefined,
      // Send only the IDs — Prisma connect expects string IDs
      registrationDocuments: registrationDocuments.map((f) => f.id),
      representativeFullName,
      representativeRole: userType === "NGO" ? representativeRole : undefined,
      representativeJobTitle:
        userType === "COMPANY" ? representativeJobTitle : undefined,
      representativeIdType,
      representativeIdNumber,
      idDocumentUrl,
      activityProofUrls:
        userType === "NGO" ? activityProofUrls.map((f) => f.id) : undefined,
      activityProofLink:
        userType === "NGO" ? activityProofLink || undefined : undefined,
      declarationConfirmed,
    } as const;

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
      setError(data.error || "Something went wrong. Please try again.");
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
          <p className="text-sm text-gray-500">
            Choose the account type that best matches your organization.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => handleTypeSelection("NGO")}
            className="group relative flex flex-col items-center justify-center p-8 border-2 border-gray-200 rounded-2xl hover:border-violet-500 hover:bg-violet-50 transition-all duration-200"
          >
            <span className="material-symbols-outlined text-5xl text-violet-600 mb-4 group-hover:scale-110 transition-transform">
              diversity_3
            </span>
            <h3 className="text-lg font-bold text-on-surface mb-2">
              Non-Governmental Organization
            </h3>
            <p className="text-sm text-gray-500 text-center">
              I represent an NGO seeking verification and impact support.
            </p>
          </button>
          <button
            type="button"
            onClick={() => handleTypeSelection("COMPANY")}
            className="group relative flex flex-col items-center justify-center p-8 border-2 border-gray-200 rounded-2xl hover:border-violet-500 hover:bg-violet-50 transition-all duration-200"
          >
            <span className="material-symbols-outlined text-5xl text-violet-600 mb-4 group-hover:scale-110 transition-transform">
              business
            </span>
            <h3 className="text-lg font-bold text-on-surface mb-2">Company</h3>
            <p className="text-sm text-gray-500 text-center">
              I represent a company requesting verification and approval.
            </p>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-lg font-semibold text-on-surface">
          {userType === "NGO" ? "NGO Registration" : "Company Registration"}
        </h2>
        <p className="text-sm text-gray-500">
          Provide details that verify your organization and support approval.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {userType && (
        <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                Step {currentStepIndex + 1} of {currentSteps.length}
              </p>
              <p className="text-sm font-semibold text-on-surface">
                {STEP_LABELS[step]}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {currentSteps.map((item, index) => {
                const disabled = index > currentStepIndex;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      if (!disabled) setStep(item);
                    }}
                    disabled={disabled}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition select-none ${
                      item === step
                        ? "bg-primary text-white border-primary"
                        : disabled
                          ? "bg-gray-200 text-gray-400 border-gray-200 cursor-not-allowed"
                          : "bg-gray-100 text-gray-600 border-gray-200"
                    }`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {currentStepErrors.length > 0 && (
        <div className="rounded-2xl bg-yellow-50 border border-amber-200 p-4 text-sm text-amber-800">
          <p className="font-semibold">Fix the following before continuing:</p>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            {currentStepErrors.map((e) => (
              <li key={e.field}>{e.message}</li>
            ))}
          </ul>
        </div>
      )}

      {step === "identity" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
          <div className="text-lg font-semibold">
            {userType === "NGO" ? "Organization identity" : "Company identity"}
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-on-surface">
                {userType === "NGO" ? "Organization name *" : "Company name *"}
              </span>
              <input
                type="text"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder={
                  userType === "NGO" ? "Helping Hands Foundation" : "Acme Corp"
                }
              />
              {getFieldError("organizationName") && (
                <p className="text-xs text-red-600">
                  {getFieldError("organizationName")}
                </p>
              )}
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-on-surface">
                Country *
              </span>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Country"
              />
              {getFieldError("country") && (
                <p className="text-xs text-red-600">
                  {getFieldError("country")}
                </p>
              )}
            </label>

            {userType === "NGO" && (
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-on-surface">
                  City / region *
                </span>
                <input
                  type="text"
                  value={cityRegion}
                  onChange={(e) => setCityRegion(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Lagos, West Africa"
                />
              </label>
            )}

            {userType === "NGO" ? (
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-on-surface">
                  Type of NGO *
                </span>
                <select
                  value={ngoType}
                  onChange={(e) => setNgoType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {NGO_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-on-surface">
                  Industry type *
                </span>
                <select
                  value={industryType}
                  onChange={(e) => setIndustryType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {INDUSTRY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-on-surface">
                Year founded *
              </span>
              <input
                type="number"
                value={yearFounded}
                onChange={(e) => setYearFounded(e.target.value)}
                min={1800}
                max={new Date().getFullYear()}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="2015"
              />
            </label>

            <label className="flex flex-col gap-2 md:col-span-2">
              <span className="text-sm font-medium text-on-surface">
                {userType === "NGO"
                  ? "Mission statement *"
                  : "Description of business *"}
              </span>
              <textarea
                value={
                  userType === "NGO" ? missionStatement : businessDescription
                }
                onChange={(e) =>
                  userType === "NGO"
                    ? setMissionStatement(e.target.value)
                    : setBusinessDescription(e.target.value)
                }
                rows={4}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                placeholder={
                  userType === "NGO"
                    ? "Describe your mission in one or two sentences"
                    : "Describe your business activities"
                }
              />
              {getFieldError(
                userType === "NGO" ? "missionStatement" : "businessDescription",
              ) && (
                <p className="text-xs text-red-600">
                  {getFieldError(
                    userType === "NGO"
                      ? "missionStatement"
                      : "businessDescription",
                  )}
                </p>
              )}
            </label>

            {userType === "NGO" && (
              <>
                <label className="flex flex-col gap-2 md:col-span-2">
                  <span className="text-sm font-medium text-on-surface">
                    Description of activities *
                  </span>
                  <textarea
                    value={activitiesDescription}
                    onChange={(e) => setActivitiesDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    placeholder="Describe the main activities your organization carries out"
                  />
                  {getFieldError("activitiesDescription") && (
                    <p className="text-xs text-red-600">
                      {getFieldError("activitiesDescription")}
                    </p>
                  )}
                </label>
                <label className="flex flex-col gap-2 md:col-span-2">
                  <span className="text-sm font-medium text-on-surface">
                    Current or past projects *
                  </span>
                  <textarea
                    value={currentOrPastProjects}
                    onChange={(e) => setCurrentOrPastProjects(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    placeholder="Describe at least one project you've delivered or supported"
                  />
                  {getFieldError("currentOrPastProjects") && (
                    <p className="text-xs text-red-600">
                      {getFieldError("currentOrPastProjects")}
                    </p>
                  )}
                </label>
              </>
            )}
          </div>
        </div>
      )}

      {step === "contact" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
          <div className="text-lg font-semibold">Contact information</div>
          <div className="grid gap-6 md:grid-cols-2">
            <label className="flex flex-col gap-2 md:col-span-2">
              <span className="text-sm font-medium text-on-surface">
                Contact email
              </span>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="contact@example.org"
              />
              {getFieldError("contactEmail") && (
                <p className="text-xs text-red-600">
                  {getFieldError("contactEmail")}
                </p>
              )}
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-on-surface">
                Phone number
              </span>
              <input
                type="tel"
                inputMode="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Optional"
              />
              {getFieldError("phoneNumber") && (
                <p className="text-xs text-red-600">
                  {getFieldError("phoneNumber")}
                </p>
              )}
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-on-surface">
                Website or social media link
              </span>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="https://example.org"
              />
            </label>
            {userType === "COMPANY" && (
              <label className="flex flex-col gap-2 md:col-span-2">
                <span className="text-sm font-medium text-on-surface">
                  Registered address
                </span>
                <input
                  type="text"
                  value={registeredAddress}
                  onChange={(e) => setRegisteredAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Registered address"
                />
                {getFieldError("registeredAddress") && (
                  <p className="text-xs text-red-600">
                    {getFieldError("registeredAddress")}
                  </p>
                )}
              </label>
            )}
          </div>
        </div>
      )}

      {step === "legal" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
          <div className="text-lg font-semibold">Legal / formal identity</div>
          <div className="grid gap-6 md:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-on-surface">
                {userType === "NGO"
                  ? "Registration number"
                  : "Company registration number"}
              </span>
              <input
                type="text"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Use 'not applicable' if informal"
              />
              {getFieldError("registrationNumber") && (
                <p className="text-xs text-red-600">
                  {getFieldError("registrationNumber")}
                </p>
              )}
            </label>
            {userType === "COMPANY" && (
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-on-surface">
                  Tax / VAT number
                </span>
                <input
                  type="text"
                  value={taxVatNumber}
                  onChange={(e) => setTaxVatNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Optional"
                />
              </label>
            )}
            <label className="flex flex-col gap-2 md:col-span-2">
              <span className="text-sm font-medium text-on-surface">
                Upload registration document
              </span>
              <input
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.txt,.mp4,.webm,.mov"
                onChange={(e) =>
                  handleUploadFiles(
                    e.target.files,
                    setRegistrationDocuments,
                    registrationDocuments.length,
                  )
                }
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
              />
              <p className="text-xs text-gray-400">
                Upload at least one registration or founding document.
              </p>
              {getFieldError("registrationDocuments") && (
                <p className="text-xs text-red-600">
                  {getFieldError("registrationDocuments")}
                </p>
              )}
              {registrationDocuments.length > 0 && (
                <>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {registrationDocuments.map((file) => (
                      <div
                        key={file.url}
                        className="group relative flex h-28 w-28 flex-col items-center justify-center gap-2 overflow-hidden rounded-3xl border border-gray-200 bg-gray-50 p-3 text-center transition hover:border-primary"
                      >
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary shadow-sm">
                          <span className="material-symbols-outlined">
                            insert_drive_file
                          </span>
                        </span>
                        <p
                          className="mt-1 text-[11px] font-medium text-gray-700 truncate"
                          title={file.fileName}
                        >
                          {file.fileName}
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            removeUploadedFile(
                              file.url,
                              setRegistrationDocuments,
                            )
                          }
                          className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-gray-500 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                        >
                          <span className="material-symbols-outlined text-sm">
                            close
                          </span>
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                    <span>
                      {registrationDocuments.length} / 5 documents uploaded
                    </span>
                    <span className="italic">Hover to remove</span>
                  </div>
                </>
              )}
            </label>
          </div>
        </div>
      )}

      {step === "representative" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
          <div className="text-lg font-semibold">Representative identity</div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 md:col-span-2">
              <span className="text-sm font-medium text-on-surface">
                Full name
              </span>
              <input
                type="text"
                value={representativeFullName}
                onChange={(e) => setRepresentativeFullName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Jane Doe"
              />
              {getFieldError("representativeFullName") && (
                <p className="text-xs text-red-600">
                  {getFieldError("representativeFullName")}
                </p>
              )}
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-on-surface">
                {userType === "NGO"
                  ? "Representative role"
                  : "Representative job title"}
              </span>
              <input
                type="text"
                value={
                  userType === "NGO"
                    ? representativeRole
                    : representativeJobTitle
                }
                onChange={(e) =>
                  userType === "NGO"
                    ? setRepresentativeRole(e.target.value)
                    : setRepresentativeJobTitle(e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder={userType === "NGO" ? "Executive Director" : "CEO"}
              />
              {getFieldError(
                userType === "NGO"
                  ? "representativeRole"
                  : "representativeJobTitle",
              ) && (
                <p className="text-xs text-red-600">
                  {getFieldError(
                    userType === "NGO"
                      ? "representativeRole"
                      : "representativeJobTitle",
                  )}
                </p>
              )}
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-on-surface">
                ID type
              </span>
              <select
                value={representativeIdType}
                onChange={(e) => setRepresentativeIdType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {ID_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-on-surface">
                ID number
              </span>
              <input
                type="text"
                value={representativeIdNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="123456789"
              />
              {getFieldError("representativeIdNumber") && (
                <p className="text-xs text-red-600">
                  {getFieldError("representativeIdNumber")}
                </p>
              )}
            </label>
            <label className="flex flex-col gap-2 md:col-span-2">
              <span className="text-sm font-medium text-on-surface">
                Upload ID document
              </span>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.txt,.mp4,.webm,.mov"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const { url } = await uploadFile(file);
                    setIdDocumentUrl(url);
                    setError("");
                  } catch (uploadError) {
                    setError((uploadError as Error).message);
                  }
                }}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
              />
              {getFieldError("idDocumentUrl") && (
                <p className="text-xs text-red-600">
                  {getFieldError("idDocumentUrl")}
                </p>
              )}
              {idDocumentUrl && (
                <p className="text-sm text-gray-700 mt-2">
                  Uploaded:{" "}
                  <a
                    href={idDocumentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline text-primary"
                  >
                    View ID document
                  </a>
                </p>
              )}
            </label>
          </div>
        </div>
      )}

      {step === "activity" && userType === "NGO" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
          <div className="text-lg font-semibold">Activity proof</div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 md:col-span-2">
              <span className="text-sm font-medium text-on-surface">
                Upload proof of activity
              </span>
              <input
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.txt,.mp4,.webm,.mov"
                onChange={(e) =>
                  handleUploadFiles(
                    e.target.files,
                    setActivityProofUrls,
                    activityProofUrls.length,
                  )
                }
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
              />
              <p className="text-xs text-gray-400">
                Upload project reports, activity photos, videos, partner
                letters, or other proof.
              </p>
              {getFieldError("activityProof") && (
                <p className="text-xs text-red-600">
                  {getFieldError("activityProof")}
                </p>
              )}
              {activityProofUrls.length > 0 && (
                <>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {activityProofUrls.map((file) => (
                      <div
                        key={file.url}
                        className="group relative flex h-28 w-28 flex-col items-center justify-center gap-2 overflow-hidden rounded-3xl border border-gray-200 bg-gray-50 p-3 text-center transition hover:border-primary"
                      >
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary shadow-sm">
                          <span className="material-symbols-outlined">
                            insert_drive_file
                          </span>
                        </span>
                        <p
                          className="mt-1 text-[11px] font-medium text-gray-700 truncate"
                          title={file.fileName}
                        >
                          {file.fileName}
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            removeUploadedFile(file.url, setActivityProofUrls)
                          }
                          className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-gray-500 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                        >
                          <span className="material-symbols-outlined text-sm">
                            close
                          </span>
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                    <span>{activityProofUrls.length} / 5 files uploaded</span>
                    <span className="italic">Hover to remove</span>
                  </div>
                </>
              )}
            </label>
            <label className="flex flex-col gap-2 md:col-span-2">
              <span className="text-sm font-medium text-on-surface">
                Evidence link (optional)
              </span>
              <input
                type="url"
                value={activityProofLink}
                onChange={(e) => setActivityProofLink(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="https://instagram.com/your-impact-story"
              />
              {getFieldError("activityProofLink") && (
                <p className="text-xs text-red-600">
                  {getFieldError("activityProofLink")}
                </p>
              )}
            </label>
          </div>
        </div>
      )}

      {step === "declaration" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div className="text-lg font-semibold">Declaration</div>
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={declarationConfirmed}
              onChange={(e) => setDeclarationConfirmed(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm text-on-surface">
              I confirm this organization is legitimate and I am authorized to
              represent it.
            </span>
          </label>
        </div>
      )}

      <div className="flex flex-col gap-3 md:flex-row">
        <button
          type="button"
          onClick={handleBack}
          className="flex-1 py-3 px-4 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
        >
          {step === "identity" ? "Back to type" : "Back"}
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={submitting || !stepIsValid()}
          className="flex-1 py-3 px-4 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isFinalStep
            ? submitting
              ? "Submitting..."
              : "Submit registration"
            : "Next"}
        </button>
      </div>
    </div>
  );
}
