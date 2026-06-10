import type { Metadata } from "next";
import { PublicProfileView } from "./public-profile-view";

export const metadata: Metadata = {
  title: "Profile | ImpactSphere",
  description: "View user profile",
};

export default function PublicProfilePage() {
  return (
    <main className="min-h-dvh bg-surface py-6 sm:py-8 lg:py-12 px-4 sm:px-6 lg:px-8">
      <PublicProfileView />
    </main>
  );
}
