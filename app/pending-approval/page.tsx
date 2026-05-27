import type { Metadata } from "next";
import { PendingApprovalContent } from "./pending-approval-content";

export const metadata: Metadata = {
  title: "Pending Approval | ImpactSphere",
  description: "Your account is pending approval",
};

export default function PendingApprovalPage() {
  return <PendingApprovalContent />;
}
