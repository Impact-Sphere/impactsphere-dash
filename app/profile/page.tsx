import type { Metadata } from "next";
import { Suspense } from "react";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = {
  title: "My Profile | ImpactSphere",
  description: "View and edit your profile",
};

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-surface py-6 sm:py-8 lg:py-12 px-4 sm:px-6 lg:px-8">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <ProfileForm />
      </Suspense>
    </main>
  );
}
