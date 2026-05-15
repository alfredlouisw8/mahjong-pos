"use client"

import { useQuery } from "@tanstack/react-query"
import type { AppConfig } from "@/lib/config"

export function useConfig() {
  return useQuery<AppConfig>({
    queryKey: ["config"],
    queryFn: async () => {
      const res = await fetch("/api/admin/config")
      if (!res.ok) throw new Error("Failed to fetch config")
      return res.json()
    },
    staleTime: 60_000,
  })
}
