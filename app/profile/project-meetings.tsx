"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  createDefaultSlot,
  getEndMinTimeForDate,
  getMinEndDate,
  getNextHalfHourStart,
  getSlotValidation,
  getStartMinTimeForDate,
  mergeContiguousSlots,
  sortSlotsByStart,
} from "@/app/lib/meetings-utils";
import type { MeetingRequest, TimeSlot } from "@/app/types/meeting";

export function Meetings({
  userType,
}: {
  userType: "NGO" | "COMPANY" | "ADMIN" | null;
}) {
  const [meetingRequests, setMeetingRequests] = useState<MeetingRequest[]>([]);
  const [loadingMeetings, setLoadingMeetings] = useState(false);
  const [editingRequest, setEditingRequest] = useState<MeetingRequest | null>(
    null,
  );

  const [meetingTimes, setMeetingTimes] = useState<TimeSlot[]>([]);
  const [meetingNotes, setMeetingNotes] = useState("");
  const [savingMeeting, setSavingMeeting] = useState(false);

  const [schedulingRequest, setSchedulingRequest] =
    useState<MeetingRequest | null>(null);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(0);
  const [selectedMeetingStart, setSelectedMeetingStart] = useState<Date | null>(
    null,
  );

  const formatUserLocal = (iso: string) => {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
      hourCycle: "h23",
    }).format(new Date(iso));
  };

  const MAX_TIME_SLOTS = 10;

  const hasInvalidSlots = meetingTimes.some((slot, index) => {
    const { invalidRange, pastStart, colliding } = getSlotValidation(
      slot,
      meetingTimes,
      index,
    );
    return invalidRange || pastStart || colliding;
  });

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

  const fetchMeetingRequests = useCallback(async () => {
    setLoadingMeetings(true);

    try {
      const res = await fetch("/api/meeting-requests");

      if (res.ok) {
        const data = await res.json();

        const sortedData = data.map((req: MeetingRequest) => ({
          ...req,
          proposedTimes: mergeContiguousSlots(
            sortSlotsByStart(req.proposedTimes || []),
          ),
        }));

        setMeetingRequests(sortedData);
      }
    } finally {
      setLoadingMeetings(false);
    }
  }, []);

  useEffect(() => {
    fetchMeetingRequests();
  }, [fetchMeetingRequests]);

  const handleCancelMeeting = async (id: string) => {
    const ok = confirm("Cancel this meeting request?");

    if (!ok) return;

    const res = await fetch(`/api/meeting-requests/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      fetchMeetingRequests();
    }
  };

  const handleSaveMeeting = async () => {
    if (!editingRequest) return;

    if (hasInvalidSlots) {
      alert(
        "Some meeting slots are invalid or overlapping. Please fix them before saving.",
      );
      return;
    }

    setSavingMeeting(true);

    const mergedTimes = mergeContiguousSlots(meetingTimes);
    const trimmedNotes = meetingNotes.trim();

    const res = await fetch(`/api/meeting-requests/${editingRequest.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        proposedTimes: mergedTimes,
        notes: trimmedNotes,
      }),
    });

    setSavingMeeting(false);

    if (res.ok) {
      setEditingRequest(null);
      fetchMeetingRequests();
    }
  };

  // NGO SCHEDULING

  const selectedSlot = useMemo(() => {
    if (!schedulingRequest?.proposedTimes?.length) {
      return null;
    }

    return schedulingRequest.proposedTimes[selectedSlotIndex];
  }, [schedulingRequest, selectedSlotIndex]);

  const selectedSlotStart = selectedSlot ? new Date(selectedSlot.start) : null;
  const selectedSlotEnd = selectedSlot ? new Date(selectedSlot.end) : null;
  const isSelectedMeetingWithinSlot =
    selectedMeetingStart && selectedSlotStart && selectedSlotEnd
      ? selectedMeetingStart.getTime() >= selectedSlotStart.getTime() &&
        selectedMeetingStart.getTime() <= selectedSlotEnd.getTime()
      : false;

  const getSlotMinTime = (date: Date) => {
    if (!selectedSlotStart) return new Date(date.setHours(0, 0, 0, 0));

    const minTime = new Date(date);
    if (date.toDateString() === selectedSlotStart.toDateString()) {
      minTime.setHours(
        selectedSlotStart.getHours(),
        selectedSlotStart.getMinutes(),
        selectedSlotStart.getSeconds(),
        selectedSlotStart.getMilliseconds(),
      );
    } else {
      minTime.setHours(0, 0, 0, 0);
    }
    return minTime;
  };

  const getSlotMaxTime = (date: Date) => {
    if (!selectedSlotEnd) return new Date(date.setHours(23, 59, 59, 999));

    const maxTime = new Date(date);
    if (date.toDateString() === selectedSlotEnd.toDateString()) {
      maxTime.setHours(
        selectedSlotEnd.getHours(),
        selectedSlotEnd.getMinutes(),
        selectedSlotEnd.getSeconds(),
        selectedSlotEnd.getMilliseconds(),
      );
    } else {
      maxTime.setHours(23, 59, 59, 999);
    }
    return maxTime;
  };

  useEffect(() => {
    if (!selectedSlot) return;
    setSelectedMeetingStart(new Date(selectedSlot.start));
  }, [selectedSlot]);

  const handleConfirmSchedule = async () => {
    if (!schedulingRequest || !selectedSlot || !selectedMeetingStart) {
      return;
    }

    const selected = selectedMeetingStart.getTime();

    const slotStart = new Date(selectedSlot.start).getTime();

    const slotEnd = new Date(selectedSlot.end).getTime();

    if (selected < slotStart || selected > slotEnd) {
      alert("Selected time is outside the proposed range.");

      return;
    }

    const res = await fetch(`/api/meeting-requests/${schedulingRequest.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "SCHEDULED",
        selectedTime: selectedMeetingStart.toISOString(),
      }),
    });

    if (res.ok) {
      setSchedulingRequest(null);
      setSelectedMeetingStart(null);
      fetchMeetingRequests();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h2 className="text-xl font-bold text-on-surface mb-6">
          Meeting Requests
        </h2>

        {loadingMeetings ? (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : meetingRequests.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            No meeting requests yet.
          </div>
        ) : (
          <div className="space-y-4">
            {meetingRequests.map((req) => (
              <div
                key={req.id}
                className="border border-gray-100 rounded-xl p-5 space-y-3"
              >
                <div className="flex justify-between">
                  <h3 className="font-semibold text-on-surface">
                    {req.project.title}
                  </h3>

                  <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                    {req.status}
                  </span>
                </div>

                {/* PROPOSED SLOTS */}
                <div className="max-h-52 overflow-y-auto space-y-2 pr-2">
                  {req.proposedTimes?.map((slot) => (
                    <div
                      key={`${req.id}-${slot.start}-${slot.end}`}
                      className="text-sm text-gray-600 bg-gray-50 rounded-lg p-2"
                    >
                      <div>Start: {formatUserLocal(slot.start)}</div>

                      <div>End: {formatUserLocal(slot.end)}</div>
                    </div>
                  ))}
                </div>

                {req.notes?.trim() && (
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                    <div className="font-semibold text-gray-900 mb-1">
                      Meeting notes
                    </div>
                    <div className="max-h-32 overflow-y-auto whitespace-pre-wrap pr-1">
                      {req.notes.trim()}
                    </div>
                  </div>
                )}

                {/* FINAL SCHEDULE */}
                {req.selectedTime && (
                  <div className="text-sm text-green-700 bg-green-50 p-3 rounded-lg">
                    Scheduled: {formatUserLocal(req.selectedTime)}
                  </div>
                )}

                {/* ACTIONS */}
                <div className="flex gap-4">
                  {userType === "COMPANY" && req.status !== "SCHEDULED" && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingRequest(req);

                          setMeetingTimes(
                            mergeContiguousSlots(
                              sortSlotsByStart(
                                (req.proposedTimes || []) as TimeSlot[],
                              ),
                            ),
                          );

                          setMeetingNotes(req.notes?.trim() ?? "");
                        }}
                        className="flex-1 flex items-center justify-center space-x-2 bg-primary hover:bg-primary-container text-on-primary px-6 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCancelMeeting(req.id)}
                        className="flex-1 flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-on-primary px-6 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  )}

                  {userType === "NGO" && req.status !== "SCHEDULED" && (
                    <button
                      type="button"
                      onClick={() => {
                        setSchedulingRequest({
                          ...req,
                          proposedTimes: mergeContiguousSlots(
                            sortSlotsByStart(req.proposedTimes || []),
                          ),
                        });

                        setSelectedSlotIndex(0);

                        setSelectedMeetingStart(null);
                      }}
                      className="flex-1 flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-on-primary px-6 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Schedule
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* EDIT MODAL */}
      {editingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-on-surface">Edit Meeting</h2>

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
                          available half hour.
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
                onClick={() => setEditingRequest(null)}
                className="flex-1 py-2.5 px-4 border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveMeeting}
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

      {/* NGO SCHEDULE MODAL */}
      {schedulingRequest && selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-8 space-y-6">
            <h2 className="text-xl font-bold">Schedule Meeting</h2>

            <div className="space-y-4">
              <div className="flex gap-3 overflow-x-auto pb-2">
                {schedulingRequest.proposedTimes.map((slot, index) => {
                  const isSelected = index === selectedSlotIndex;

                  return (
                    <button
                      type="button"
                      key={`${slot.start}-${slot.end}-${index}`}
                      onClick={() => {
                        setSelectedSlotIndex(index);
                        setSelectedMeetingStart(null);
                      }}
                      className={
                        "min-w-[240px] flex-shrink-0 rounded-2xl border p-4 text-left transition-shadow " +
                        (isSelected
                          ? "border-green-600 bg-green-50 shadow-sm"
                          : "border-gray-200 bg-white hover:border-gray-300")
                      }
                    >
                      <div className="text-xs uppercase tracking-wide text-gray-500">
                        Option {index + 1}
                      </div>
                      <div className="mt-2 text-sm font-semibold text-on-surface">
                        {formatUserLocal(slot.start)}
                      </div>
                      <div className="text-sm text-gray-600">
                        until {formatUserLocal(slot.end)}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="bg-gray-50 rounded-xl p-4 text-sm">
                <div>Available from:</div>

                <div className="font-medium">
                  {formatUserLocal(selectedSlot.start)}
                </div>

                <div className="mt-2">Until:</div>

                <div className="font-medium">
                  {formatUserLocal(selectedSlot.end)}
                </div>
              </div>

              {schedulingRequest.notes?.trim() && (
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                  <div className="font-semibold text-gray-900 mb-1">
                    Meeting notes
                  </div>
                  <div className="max-h-32 overflow-y-auto whitespace-pre-wrap pr-1">
                    {schedulingRequest.notes.trim()}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="text-sm font-medium">
                  Select exact meeting time
                </div>

                <DatePicker
                  selected={selectedMeetingStart}
                  onChange={(d: Date | null) => {
                    if (!d) {
                      setSelectedMeetingStart(null);
                      return;
                    }

                    if (
                      selectedSlotStart &&
                      selectedSlotEnd &&
                      (d.getTime() < selectedSlotStart.getTime() ||
                        d.getTime() > selectedSlotEnd.getTime())
                    ) {
                      setSelectedMeetingStart(new Date(selectedSlot.start));
                      return;
                    }

                    setSelectedMeetingStart(d);
                  }}
                  showTimeSelect
                  timeIntervals={15}
                  dateFormat="dd/MM/yyyy HH:mm"
                  timeFormat="HH:mm"
                  minDate={selectedSlotStart ?? undefined}
                  maxDate={selectedSlotEnd ?? undefined}
                  minTime={
                    selectedMeetingStart
                      ? getSlotMinTime(selectedMeetingStart)
                      : (selectedSlotStart ?? undefined)
                  }
                  maxTime={
                    selectedMeetingStart
                      ? getSlotMaxTime(selectedMeetingStart)
                      : (selectedSlotEnd ?? undefined)
                  }
                  filterTime={(time) => {
                    if (!selectedSlotStart || !selectedSlotEnd) return true;

                    const current = selectedMeetingStart
                      ? new Date(selectedMeetingStart)
                      : new Date(selectedSlot.start);
                    current.setHours(
                      time.getHours(),
                      time.getMinutes(),
                      time.getSeconds(),
                      time.getMilliseconds(),
                    );

                    return (
                      current.getTime() >= selectedSlotStart.getTime() &&
                      current.getTime() <= selectedSlotEnd.getTime()
                    );
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                />

                {!isSelectedMeetingWithinSlot && selectedMeetingStart && (
                  <div className="text-red-600 text-sm mt-2">
                    Please choose a date/time inside the selected slot range.
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSchedulingRequest(null)}
                className="flex-1 py-2.5 px-4 border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmSchedule}
                disabled={!selectedMeetingStart}
                className="flex-1 flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-on-primary px-6 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Confirm Meeting
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
