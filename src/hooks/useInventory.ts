"use client"

import { useQuery } from "@tanstack/react-query"
import type { InventoryItem } from "@/types/database"

export function useInventory() {
  return useQuery<InventoryItem[]>({
    queryKey: ["inventory"],
    queryFn: async () => {
      const res = await fetch("/api/admin/inventory")
      if (!res.ok) throw new Error("Failed to fetch inventory")
      return res.json()
    },
  })
}
