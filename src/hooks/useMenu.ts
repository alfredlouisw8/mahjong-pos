"use client"

import { useQuery } from "@tanstack/react-query"
import type { MenuItem } from "@/types/database"

export function useMenu(adminView = false) {
  return useQuery<MenuItem[]>({
    queryKey: ["menu", adminView],
    queryFn: async () => {
      const url = adminView ? "/api/admin/menu" : "/api/menu"
      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to fetch menu")
      return res.json()
    },
  })
}
