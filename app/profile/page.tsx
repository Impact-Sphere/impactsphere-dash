import type { Metadata } from "next";
import { Suspense } from "react";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = {
  title: "My Profile | ImpactSphere",
  description: "View and edit your profile",
};

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-surface py-12 px-6">
      <Suspense fallback={<div>Loading...</div>}>
        <ProfileForm />
      </Suspense>
    </main>
  );
}
