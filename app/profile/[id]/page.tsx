import type { Metadata } from "next";
import { PublicProfileView } from "./public-profile-view";

export const metadata: Metadata = {
  title: "Profile | ImpactSphere",
  description: "View user profile",
};

export default function PublicProfilePage() {
  return (
    <main className="min-h-screen bg-surface py-12 px-6">
      <PublicProfileView />
    </main>
  );
}
