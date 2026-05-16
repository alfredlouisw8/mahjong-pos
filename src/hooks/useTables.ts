"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { TableWithSession } from "@/types/database"

export function useTables() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  const query = useQuery<TableWithSession[]>({
    queryKey: ["tables"],
    queryFn: async () => {
      const res = await fetch("/api/tables")
      if (!res.ok) throw new Error("Failed to fetch tables")
      return res.json()
    },
    refetchInterval: 30_000,
  })

  useEffect(() => {
    const channel = supabase
      .channel("tables-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "tables" }, () => {
        queryClient.invalidateQueries({ queryKey: ["tables"] })
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "sessions" }, () => {
        queryClient.invalidateQueries({ queryKey: ["tables"] })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [queryClient, supabase])

  return query
}
