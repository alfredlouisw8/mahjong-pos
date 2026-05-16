"use client"

import { useQuery } from "@tanstack/react-query"
import type { ReservationWithTable } from "@/types/database"

export function useReservations(status?: string) {
  return useQuery<ReservationWithTable[]>({
    queryKey: ["reservations", status],
    queryFn: async () => {
      const params = status ? `?status=${status}` : ""
      const res = await fetch(`/api/reservations${params}`)
      if (!res.ok) throw new Error("Failed to fetch reservations")
      return res.json()
    },
  })
}
