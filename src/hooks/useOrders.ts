"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import type { Order } from "@/types/database"

export function useOrders(sessionId: string | null) {
  const queryClient = useQueryClient()
  const supabase = createClient()

  const query = useQuery<Order[]>({
    queryKey: ["orders", sessionId],
    queryFn: async () => {
      if (!sessionId) return []
      const res = await fetch(`/api/sessions/${sessionId}/orders`)
      if (!res.ok) throw new Error("Failed to fetch orders")
      return res.json()
    },
    enabled: !!sessionId,
  })

  useEffect(() => {
    if (!sessionId) return

    const channel = supabase
      .channel(`orders-${sessionId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders", filter: `session_id=eq.${sessionId}` },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["orders", sessionId] })
          const order = payload.new as Order
          if (order.source === "customer_qr") {
            toast("📱 New QR order received!", {
              description: `${order.quantity}x item from customer`,
            })
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `session_id=eq.${sessionId}` },
        () => queryClient.invalidateQueries({ queryKey: ["orders", sessionId] })
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [sessionId, queryClient, supabase])

  return query
}
