"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

type Branding = {
  brandName: string;
  profilePhoto: string | null;
};

export function useBranding(): Branding {
  const [brandName, setBrandName] = useState<string>("Seu negócio");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  const { data: businessData, refetch: refetchBusiness } = useQuery<{
    businessName: string;
    businessLogo: string | null;
  }>({
    queryKey: ["branding", "business"],
    queryFn: () => apiFetch("/api/settings/business"),
  });

  const { data: profileData, refetch: refetchProfile } = useQuery<{
    profileImage: string | null;
  }>({
    queryKey: ["branding", "profile"],
    queryFn: () => apiFetch("/api/settings/profile"),
  });

  useEffect(() => {
    if (businessData?.businessName) {
      setBrandName(businessData.businessName);
    }
  }, [businessData?.businessName]);

  useEffect(() => {
    if (profileData?.profileImage !== undefined) {
      setProfilePhoto(profileData.profileImage);
    }
  }, [profileData?.profileImage]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const listener = () => {
      refetchBusiness();
      refetchProfile();
    };
    window.addEventListener("rt-branding-updated", listener as EventListener);
    return () => {
      window.removeEventListener("rt-branding-updated", listener as EventListener);
    };
  }, [refetchBusiness, refetchProfile]);

  return { brandName, profilePhoto };
}
