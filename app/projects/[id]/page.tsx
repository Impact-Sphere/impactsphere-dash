"use client";

import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import { useCurrency } from "@/app/components/currency/currency-context";
import StripeCheckoutForm from "@/app/components/donate/stripe-checkout-form";
import { Badge } from "@/app/components/ui/badge";
import { ProgressBar } from "@/app/components/ui/progress-bar";
import { authClient } from "@/app/lib/auth-client";
import {
  createDefaultSlot,
  getEndMinTimeForDate,
  getMinEndDate,
  getNextHalfHourStart,
  getSlotValidation,
  getStartMinTimeForDate,
  mergeContiguousSlots,
} from "@/app/lib/meetings-utils";
import {
  getFundedPercent,
  getNgoName,
  getProjectImage,
} from "@/app/lib/project-utils";
import type { MeetingRequest, TimeSlot } from "@/app/types/meeting";
import type { Project } from "@/app/types/project";
import "react-datepicker/dist/react-datepicker.css";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set");
}

const stripePromise = loadStripe(publishableKey);

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: session } = authClient.useSession();
  const { format } = useCurrency();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [donateOpen, setDonateOpen] = useState(false);
  const [donateAmount, setDonateAmount] = useState("");
  const [donating, setDonating] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [userType, setUserType] = useState<string | null>(null);

  const [meetingOpen, setMeetingOpen] = useState(false);
  const [meetingTimes, setMeetingTimes] = useState<TimeSlot[]>([]);
  const [meetingNotes, setMeetingNotes] = useState("");
  const [savingMeeting, setSavingMeeting] = useState(false);
  const [existingRequest, setExistingRequest] = useState<MeetingRequest | null>(
    null,
  );
  const [loadingRequest, setLoadingRequest] = useState(false);

  const fetchProject = useCallback(async () => {
    const res = await fetch(`/api/projects/${id}`);
    if (res.ok) {
      const data = await res.json();
      setProject(data);
    }
    setLoading(false);
  }, [id]);

  const fetchExistingRequest = useCallback(async () => {
    if (!session?.user?.id || userType !== "COMPANY") return;
    setLoadingRequest(true);
    const res = await fetch(`/api/meeting-requests?projectId=${id}`);
    if (res.ok) {
      const requests = await res.json();
      const existing = requests.find((r: MeetingRequest) => r.projectId === id);
      if (existing) {
        setExistingRequest(existing);
        if (existing.proposedTimes && existing.proposedTimes.length > 0) {
          const convertedTimes = existing.proposedTimes.map(
            (slot: TimeSlot) => {
              const startDate = new Date(slot.start);
              const endDate = new Date(slot.end);

              return {
                start: startDate.toISOString(),
                end: endDate.toISOString(),
              };
            },
          );
          setMeetingTimes(mergeContiguousSlots(convertedTimes));
        }
        if (existing.notes) {
          setMeetingNotes(existing.notes.trim());
        }
      }
    }
    setLoadingRequest(false);
  }, [id, session?.user?.id, userType]);

  useEffect(() => {
    if (!id) return;
    fetchProject();
  }, [id, fetchProject]);

  useEffect(() => {
    if (!session) return;
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        setUserType(data.userType || null);
      })
      .catch(() => {});
  }, [session]);

  const openDonateModal = () => {
    setDonateOpen(true);
    setClientSecret(null);
    setDonateAmount("");
  };

  const closeDonateModal = () => {
    setDonateOpen(false);
    setClientSecret(null);
    setDonateAmount("");
  };

  const handleInitiatePayment = async () => {
    if (!donateAmount || Number(donateAmount) <= 0) return;
    setDonating(true);

    const res = await fetch(`/api/projects/${id}/donate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Number(donateAmount) }),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok && data.clientSecret) {
      setClientSecret(data.clientSecret);
    } else {
      alert(data.error || "Failed to initiate payment.");
    }

    setDonating(false);
  };

  const handlePaymentSuccess = () => {
    closeDonateModal();
    fetchProject();
  };

  const handleRequestMeeting = async () => {
    if (hasInvalidSlots) {
      alert(
        "Some meeting slots are invalid or overlapping. Please fix them before saving.",
      );

      return;
    }

    const mergedTimes = mergeContiguousSlots(meetingTimes);

    setSavingMeeting(true);

    const trimmedNotes = meetingNotes.trim();
    const res = await fetch(`/api/meeting-requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        projectId: id,
        proposedTimes: mergedTimes,
        notes: trimmedNotes,
      }),
    });

    setSavingMeeting(false);

    if (res.ok) {
      setMeetingOpen(false);
      setMeetingTimes([]);
      setMeetingNotes("");
      await fetchExistingRequest();
      alert("Meeting request sent successfully!");
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Failed to send meeting request.");
    }
  };

  const MAX_TIME_SLOTS = 10;

  const addTimeSlot = () => {
    setMeetingTimes((prev) =>
      prev.length >= MAX_TIME_SLOTS ? prev : [...prev, createDefaultSlot()],
    );
  };

  const updateSlotStart = (index: number, newStart: Date) => {
    const updated = [...meetingTimes];
    const currentEnd = new Date(updated[index].end);
    const minStart = getNextHalfHourStart();

    if (newStart.getTime() < minStart.getTime()) {
      newStart = minStart;
    }

    const duration =
      currentEnd.getTime() - new Date(updated[index].start).getTime();

    let newEnd = new Date(newStart.getTime() + duration);

    if (newEnd.getTime() - newStart.getTime() < 30 * 60000) {
      newEnd = new Date(newStart.getTime() + 30 * 60000);
    }

    updated[index] = {
      start: newStart.toISOString(),
      end: newEnd.toISOString(),
    };

    setMeetingTimes(updated);
  };

  const updateSlotEnd = (index: number, newEnd: Date) => {
    const updated = [...meetingTimes];
    const currentStart = new Date(updated[index].start);
    const minEnd = new Date(currentStart.getTime() + 30 * 60000);

    if (newEnd < minEnd) {
      newEnd = minEnd;
    }

    updated[index] = {
      ...updated[index],
      end: newEnd.toISOString(),
    };

    setMeetingTimes(updated);
  };

  const removeTimeSlot = (index: number) => {
    setMeetingTimes((prev) => prev.filter((_, i) => i !== index));
  };

  const hasInvalidSlots = meetingTimes.some((slot, index) => {
    const { invalidRange, pastStart, colliding } = getSlotValidation(
      slot,
      meetingTimes,
      index,
    );
    return invalidRange || pastStart || colliding;
  });

  if (loading) {
    return (
      <main className="ml-72 min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!project) {
    return (
      <main className="ml-72 min-h-screen flex items-center justify-center text-gray-500">
        Project not found.
      </main>
    );
  }

  const funded = getFundedPercent(project.currentAmount, project.targetBudget);
  const availableBudget = project.currentAmount - (project.serviceSpent || 0);
  const isLoggedIn = !!session?.user;
  const isNgo = userType === "NGO";
  const isOwner = isNgo && session?.user?.id === project.ngoId;
  const isAdmin = userType === "ADMIN";
  const isCompany = userType === "COMPANY";
  const showApprovalBadge = isOwner || isAdmin;
  const acquisitions = project.serviceAcquisitions || [];

  return (
    <main className="ml-72 min-h-screen bg-surface py-12 px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Image */}
        <div className="relative w-full h-80 rounded-2xl overflow-hidden">
          {/* biome-ignore lint/performance/noImgElement: user-provided project images may be from any external host */}
          <img
            src={getProjectImage(project.image)}
            alt={project.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Badge variant="primary">{project.category}</Badge>
            {project.status === "COMPLETED" && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-700">
                Fully Funded
              </span>
            )}
            {showApprovalBadge && (
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  project.approvalStatus === "APPROVED"
                    ? "bg-emerald-100 text-emerald-700"
                    : project.approvalStatus === "PENDING"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-red-100 text-red-700"
                }`}
              >
                {project.approvalStatus === "APPROVED"
                  ? "Approved"
                  : project.approvalStatus === "PENDING"
                    ? "Pending Approval"
                    : "Rejected"}
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold text-on-surface">
            {project.title}
          </h1>
          <p className="text-gray-500">
            by{" "}
            <a
              href={`/profile/${project.ngoId}`}
              className="text-primary font-medium hover:underline"
            >
              {getNgoName(project)}
            </a>
          </p>
        </div>

        {/* Funding bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-4">
          <div className="flex justify-between items-end">
            <span className="text-3xl font-black text-primary">
              {funded}%
              <span className="text-base font-medium text-on-surface-variant ml-2">
                funded
              </span>
            </span>
            <span className="text-lg font-bold">
              {format(project.currentAmount)}{" "}
              <span className="text-on-surface-variant font-normal">
                of {format(project.targetBudget)}
              </span>
            </span>
          </div>
          <ProgressBar value={funded} size="md" />
          <p className="text-sm text-gray-500">
            {project._count?.donations ?? project.donations?.length ?? 0}{" "}
            donation
            {(project._count?.donations ?? project.donations?.length ?? 0) !== 1
              ? "s"
              : ""}{" "}
            so far
          </p>

          {isLoggedIn && project.status === "ACTIVE" && (
            <button
              type="button"
              onClick={openDonateModal}
              className="flex items-center justify-center space-x-3 w-full md:w-auto bg-primary hover:bg-primary-container text-on-primary px-10 py-5 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-primary/30 active:scale-95"
            >
              <span className="material-symbols-outlined text-2xl transition-transform hover:scale-110">
                favorite
              </span>
              <span>Donate Now</span>
            </button>
          )}

          {isOwner && (
            <p className="text-sm text-gray-500">You created this project.</p>
          )}
        </div>

        {/* Budget Breakdown */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-4">
          <h2 className="text-lg font-semibold text-on-surface">Budget</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 rounded-xl p-4 space-y-1">
              <p className="text-xs text-gray-400">Total Donated</p>
              <p className="text-xl font-bold text-on-surface">
                {format(project.currentAmount)}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 space-y-1">
              <p className="text-xs text-gray-400">Spent on Services</p>
              <p className="text-xl font-bold text-amber-600">
                {format(project.serviceSpent || 0)}
              </p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-4 space-y-1">
              <p className="text-xs text-emerald-600">Available for Services</p>
              <p className="text-xl font-bold text-emerald-700">
                {format(availableBudget)}
              </p>
            </div>
          </div>
          {isOwner && availableBudget > 0 && (
            <button
              type="button"
              onClick={() => router.push(`/services?projectId=${project.id}`)}
              className="flex items-center justify-center space-x-2 w-full md:w-auto bg-primary hover:bg-primary-container text-on-primary px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-all duration-300 hover:-translate-y-0.5 active:scale-95"
            >
              <span className="material-symbols-outlined">shopping_cart</span>
              <span>Browse Services for this Project</span>
            </button>
          )}
          {isOwner && availableBudget <= 0 && (
            <p className="text-sm text-gray-500">
              No available budget to buy services. Wait for more donations!
            </p>
          )}
        </div>

        {/* Services Bought */}
        {acquisitions.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-4">
            <h2 className="text-lg font-semibold text-on-surface">
              Services Bought
            </h2>
            <div className="space-y-3">
              {acquisitions.map((acq) => (
                <div
                  key={acq.id}
                  className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-on-surface">
                        {acq.service.name}
                      </span>
                      <span className="text-primary text-sm">
                        — {acq.package.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 text-xs text-gray-500">
                      <span>
                        Provider:{" "}
                        {acq.service.provider.name ||
                          acq.service.provider.email}
                      </span>
                      <span>·</span>
                      <span
                        className={`font-medium ${
                          acq.status === "ACTIVE"
                            ? "text-emerald-600"
                            : acq.status === "DELIVERED"
                              ? "text-blue-600"
                              : acq.status === "REVISION_REQUESTED"
                                ? "text-amber-600"
                                : acq.status === "COMPLETED"
                                  ? "text-violet-600"
                                  : "text-gray-500"
                        }`}
                      >
                        {acq.status === "ACTIVE"
                          ? "In Progress"
                          : acq.status === "DELIVERED"
                            ? "Delivered"
                            : acq.status === "REVISION_REQUESTED"
                              ? "Revision Requested"
                              : acq.status === "COMPLETED"
                                ? "Completed"
                                : acq.status}
                      </span>
                    </div>
                    {acq.review && (
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-gray-400">Review:</span>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <span
                              key={s}
                              className={
                                s <= (acq.review?.rating ?? 0)
                                  ? "text-yellow-400"
                                  : "text-gray-300"
                              }
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-bold text-on-surface">
                      {format(acq.package.price)}
                    </span>
                    {acq.chat && (
                      <button
                        type="button"
                        onClick={() => router.push(`/chat/${acq.chat?.id}`)}
                        className="px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        Open Workroom
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-lg font-semibold text-on-surface mb-4">
            About this project
          </h2>
          <p className="text-gray-700 whitespace-pre-line leading-relaxed">
            {project.description}
          </p>
        </div>

        {/* Donations */}
        {project.donations && project.donations.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-4">
            <h2 className="text-lg font-semibold text-on-surface">
              Recent Donations
            </h2>
            <div className="space-y-3">
              {project.donations.map((donation) => (
                <div
                  key={donation.id}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-xs">
                      {(
                        donation.company.name ||
                        donation.company.companyInfo?.companyName ||
                        "?"
                      ).charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-on-surface">
                      {donation.company.companyInfo?.companyName ||
                        donation.company.name ||
                        "Anonymous"}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-primary">
                    {format(donation.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {isLoggedIn && isCompany && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-4">
            <h2 className="text-lg font-semibold text-on-surface">
              Want to know better the project before donating? Request a
              meeting!
            </h2>
            {loadingRequest ? (
              <div className="flex items-center justify-center py-6">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : existingRequest ? (
              <div className="space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800 font-medium">
                    You have already requested a meeting for this project
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Status:{" "}
                    <span className="font-semibold">
                      {existingRequest.status}
                    </span>
                  </p>
                </div>
                <div className="flex">
                  <button
                    type="button"
                    onClick={() => router.push("/profile?tab=meetings")}
                    className="flex-1 flex items-center justify-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-xl text-sm font-medium transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">
                      arrow_forward
                    </span>
                    <span>View in Profile</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex">
                <button
                  type="button"
                  onClick={() => setMeetingOpen(true)}
                  className="flex-1 flex items-center justify-center space-x-2 bg-primary hover:bg-primary-container text-on-primary px-6 py-3 rounded-xl text-sm font-medium transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">
                    calendar_month
                  </span>
                  <span>Request Meeting</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Donate Modal */}
      {donateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-on-surface">
              Make a Donation
            </h2>

            {!clientSecret ? (
              <>
                <p className="text-gray-500 text-sm">
                  Your contribution helps bring &quot;{project.title}&quot; to
                  life.
                </p>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-on-surface">
                    Amount (EUR)
                  </div>
                  <input
                    type="number"
                    value={donateAmount}
                    onChange={(e) => setDonateAmount(e.target.value)}
                    min={1}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="1000"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={closeDonateModal}
                    className="flex-1 py-2.5 px-4 border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleInitiatePayment}
                    disabled={
                      donating || !donateAmount || Number(donateAmount) <= 0
                    }
                    className="flex-1 py-2.5 px-4 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {donating ? "Processing..." : "Proceed to Payment"}
                  </button>
                </div>
              </>
            ) : (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <StripeCheckoutForm
                  projectTitle={project.title}
                  onSuccess={handlePaymentSuccess}
                  onCancel={closeDonateModal}
                />
              </Elements>
            )}
          </div>
        </div>
      )}

      {meetingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-on-surface">
              Request Meeting
            </h2>

            <p className="text-sm text-gray-500">
              Select the timeframes according to your availability (All times
              are shown in YOUR local timezone).
            </p>

            <div className="space-y-4">
              {hasInvalidSlots && (
                <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
                  Some time slots are invalid or overlapping. Fix the
                  highlighted ones before saving.
                </div>
              )}

              <div className="max-h-[38vh] overflow-y-auto space-y-4 pr-2">
                {meetingTimes.map((slot, index) => {
                  const { invalidRange, pastStart, colliding } =
                    getSlotValidation(slot, meetingTimes, index);
                  const invalid = invalidRange || pastStart || colliding;

                  return (
                    <div
                      key={`${slot.start}-${slot.end}-${index}`}
                      className={`p-4 rounded-xl border ${
                        invalid
                          ? "border-red-300 bg-red-50"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Start</div>

                          <DatePicker
                            selected={new Date(slot.start)}
                            onChange={(date: Date | null) => {
                              if (!date) return;

                              updateSlotStart(index, date);
                            }}
                            showTimeSelect
                            timeIntervals={30}
                            dateFormat="dd/MM/yyyy HH:mm"
                            timeFormat="HH:mm"
                            minDate={getNextHalfHourStart()}
                            minTime={getStartMinTimeForDate(
                              new Date(slot.start),
                            )}
                            maxTime={
                              new Date(
                                new Date(slot.start).setHours(23, 59, 59, 999),
                              )
                            }
                            filterTime={(time) => {
                              const selectedDate = new Date(time);
                              return (
                                selectedDate.getTime() >=
                                getStartMinTimeForDate(selectedDate).getTime()
                              );
                            }}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="text-sm font-medium">End</div>

                          <DatePicker
                            selected={new Date(slot.end)}
                            onChange={(date: Date | null) => {
                              if (!date) return;

                              updateSlotEnd(index, date);
                            }}
                            showTimeSelect
                            timeIntervals={30}
                            dateFormat="dd/MM/yyyy HH:mm"
                            timeFormat="HH:mm"
                            minDate={getMinEndDate(slot)}
                            minTime={getEndMinTimeForDate(
                              new Date(slot.end),
                              slot,
                            )}
                            maxTime={
                              new Date(
                                new Date(slot.end).setHours(23, 59, 59, 999),
                              )
                            }
                            filterTime={(time) => {
                              const selectedDate = new Date(time);
                              return (
                                selectedDate.getTime() >=
                                getEndMinTimeForDate(
                                  selectedDate,
                                  slot,
                                ).getTime()
                              );
                            }}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                          />
                        </div>
                      </div>

                      {pastStart && (
                        <div className="text-red-600 text-sm mt-3">
                          Start time must be in the future and at the next
                          available hour.
                        </div>
                      )}

                      {invalidRange && !pastStart && (
                        <div className="text-red-600 text-sm mt-3">
                          Slots must be at least 30 minutes long.
                        </div>
                      )}

                      {colliding && (
                        <div className="text-red-600 text-sm mt-3">
                          This slot overlaps another proposed slot.
                        </div>
                      )}

                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={() => removeTimeSlot(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={addTimeSlot}
                  disabled={meetingTimes.length >= MAX_TIME_SLOTS}
                  className="text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  + Add Time Slot
                </button>
                {meetingTimes.length >= MAX_TIME_SLOTS && (
                  <div className="text-sm text-gray-500">
                    Max {MAX_TIME_SLOTS} time slots allowed.
                  </div>
                )}
              </div>
            </div>

            {/* NOTES */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Additional Notes</div>

              <textarea
                value={meetingNotes}
                onChange={(e) => setMeetingNotes(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg resize-none"
              />
            </div>

            {/* ACTIONS */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setMeetingNotes("");
                  setMeetingTimes([]);
                  setMeetingOpen(false);
                }}
                className="flex-1 py-2.5 px-4 border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleRequestMeeting}
                disabled={
                  savingMeeting || meetingTimes.length === 0 || hasInvalidSlots
                }
                className="flex-1 py-2.5 px-4 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {savingMeeting ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
