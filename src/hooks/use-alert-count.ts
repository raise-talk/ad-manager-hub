"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

type Alert = {
  status: "NEW" | "READ" | "RESOLVED";
};

export const useAlertCount = () => {
  return useQuery({
    queryKey: ["alerts", "count"],
    queryFn: async () => {
      const alerts = await apiFetch<Alert[]>("/api/alerts?status=new");
      return alerts.length;
    },
  });
};
