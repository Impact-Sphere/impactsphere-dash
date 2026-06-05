"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/app/lib/auth-client";

interface ProfileData {
  userType: string | null;
  approvalStatus: string | null;
  image: string | null;
}

export function useProfile() {
  const { data: session } = authClient.useSession();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }

    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        setProfile({
          userType: data.userType || null,
          approvalStatus: data.approvalStatus || null,
          image: data.image || null,
        });
      })
      .catch(() => {
        setProfile(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [session]);

  return { session, profile, loading };
}
