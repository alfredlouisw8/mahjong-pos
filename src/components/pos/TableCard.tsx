"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { BlockHourTimer } from "./BlockHourTimer"
import { PerMinuteTimer } from "./PerMinuteTimer"
import { BillModal } from "./BillModal"
import { ExtendBlockDialog } from "./ExtendBlockDialog"
import type { Table } from "@/types/database"

const STATUS_STYLES: Record<string, string> = {
  available: "border-[rgba(16,185,129,0.3)] bg-[rgba(16,185,129,0.05)]",
  occupied: "border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.05)]",
  reserved: "border-[rgba(59,130,246,0.3)] bg-[rgba(59,130,246,0.05)]",
  maintenance: "border-[rgba(255,255,255,0.08)] bg-[rgba(40,56,44,0.3)] opacity-60",
}

const STATUS_DOT: Record<string, string> = {
  available: "bg-[#10b981]",
  occupied: "bg-[#f59e0b]",
  reserved: "bg-[#3b82f6]",
  maintenance: "bg-gray-500",
}

interface TableCardProps {
  table: Table
  currencySymbol?: string
  billingMode?: string
}

export function TableCard({ table, currencySymbol = "Rp", billingMode = "block_hour" }: TableCardProps) {
  const [showBill, setShowBill] = useState(false)
  const [showExtend, setShowExtend] = useState(false)
  const queryClient = useQueryClient()

  const startSession = useMutation({
    mutationFn: async (blocksCount: number) => {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableId: table.id, blocksCount }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] })
      toast.success(`Session started on ${table.label}`)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const session = table.sessions as any
  const isOccupied = table.status === "occupied" && session
  const isBlockHour = session?.billing_mode === "block_hour"
  const isExpiring = isBlockHour && session?.block_ends_at &&
    (new Date(session.block_ends_at).getTime() - Date.now()) <= 15 * 60_000 &&
    Date.now() < new Date(session.block_ends_at).getTime()
  const isOvertime = isBlockHour && session?.block_ends_at &&
    Date.now() > new Date(session.block_ends_at).getTime()

  return (
    <>
      <div
        className={cn(
          "rounded-2xl border p-4 flex flex-col gap-3 transition-all",
          STATUS_STYLES[table.status] ?? STATUS_STYLES.available
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", STATUS_DOT[table.status])} />
            <span className="font-semibold text-[#fef9ec]">{table.label}</span>
          </div>
          {isExpiring && !isOvertime && (
            <span className="text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full">⚠ Expiring</span>
          )}
          {isOvertime && (
            <span className="text-xs bg-[#f43f5e]/20 text-[#f43f5e] border border-[#f43f5e]/30 px-2 py-0.5 rounded-full">🔴 OVERTIME</span>
          )}
        </div>

        {isOccupied && (
          <div className="min-h-[60px]">
            {isBlockHour ? (
              <BlockHourTimer session={session} currencySymbol={currencySymbol} />
            ) : (
              <PerMinuteTimer session={session} currencySymbol={currencySymbol} />
            )}
          </div>
        )}

        {table.status === "reserved" && (
          <div className="text-xs text-[#3b82f6]">Reserved</div>
        )}

        <div className="flex gap-2 mt-auto">
          {table.status === "available" && (
            <button
              onClick={() => startSession.mutate(billingMode === "block_hour" ? 1 : 0)}
              disabled={startSession.isPending}
              className="flex-1 py-2 rounded-lg bg-[rgba(16,185,129,0.15)] border border-[rgba(16,185,129,0.3)] text-[#10b981] text-sm font-medium hover:bg-[rgba(16,185,129,0.25)] transition-colors disabled:opacity-50"
            >
              Start
            </button>
          )}
          {isOccupied && (
            <>
              <button
                onClick={() => setShowBill(true)}
                className="flex-1 py-2 rounded-lg bg-[rgba(245,158,11,0.15)] border border-[rgba(251,191,36,0.25)] text-[#f59e0b] text-sm font-medium hover:bg-[rgba(245,158,11,0.25)] transition-colors"
              >
                Bill
              </button>
              {isBlockHour && (
                <button
                  onClick={() => setShowExtend(true)}
                  className={cn(
                    "flex-1 py-2 rounded-lg border text-sm font-medium transition-colors",
                    isExpiring || isOvertime
                      ? "bg-orange-500/20 border-orange-500/30 text-orange-400 animate-pulse"
                      : "bg-[rgba(40,56,44,0.6)] border-[rgba(255,255,255,0.08)] text-[rgba(254,249,236,0.7)]"
                  )}
                >
                  Extend
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {showBill && session && (
        <BillModal
          session={session}
          tableLabel={table.label}
          currencySymbol={currencySymbol}
          onClose={() => setShowBill(false)}
        />
      )}

      {showExtend && session && (
        <ExtendBlockDialog
          session={session}
          currencySymbol={currencySymbol}
          onClose={() => setShowExtend(false)}
        />
      )}
    </>
  )
}
