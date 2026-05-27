export type MeetingRequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "SCHEDULED"
  | "CANCELLED";

export interface TimeSlot {
  start: string;
  end: string;
}

export interface MeetingRequest {
  id: string;
  projectId: string;
  project: {
    id: string;
    title: string;
    ngo: {
      id: string;
      name: string | null;
      ngoInfo?: { ngoName: string } | null;
    };
  };
  companyId: string;
  company: {
    id: string;
    name: string | null;
    companyInfo?: { companyName: string } | null;
  };
  requestedAt: string;
  status: MeetingRequestStatus;
  proposedTimes: TimeSlot[];
  selectedTime: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
