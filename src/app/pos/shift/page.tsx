"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useState } from "react"
import { useShiftStore } from "@/store/shift"
import { PageHeader } from "@/components/layout/PageHeader"
import { fmtDate } from "@/lib/formatters"
import type { Shift } from "@/types/database"

export default function ShiftPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { cashierName, shiftId, clearCashierSession } = useShiftStore()
  const [closingCash, setClosingCash] = useState("")
  const [showCloseForm, setShowCloseForm] = useState(false)

  const { data: shift } = useQuery<Shift>({
    queryKey: ["current-shift"],
    queryFn: async () => {
      const res = await fetch("/api/shifts/current")
      if (!res.ok) throw new Error("No active shift")
      return res.json()
    },
    enabled: !!shiftId,
  })

  const clockOut = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/shifts/${shiftId}/clockout`, { method: "POST" })
      if (!res.ok) throw new Error((await res.json()).error)
      return res.json()
    },
    onSuccess: (data) => {
      clearCashierSession()
      if (data.isLastEmployee) {
        toast.success("Shift closed. Goodbye!")
      } else {
        toast.success("Clocked out successfully")
      }
      router.push("/")
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const closeShift = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/shifts/${shiftId}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ closingCash: Number(closingCash) || 0 }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      return res.json()
    },
    onSuccess: (data) => {
      clearCashierSession()
      toast.success(`Shift closed. Cash variance: ${data.cashVariance >= 0 ? "+" : ""}${data.cashVariance}`)
      router.push("/")
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const employees = (shift as any)?.shift_employees ?? []
  const myEntry = employees.find((e: any) => !e.left_at)

  return (
    <div className="p-4 max-w-lg mx-auto">
      <PageHeader title="My Shift" />

      <div className="bg-[rgba(20,36,28,0.85)] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6 space-y-4">
        <div>
          <p className="text-[rgba(251,191,36,0.55)] text-sm">Cashier</p>
          <p className="text-xl font-medium text-[#fef9ec]">{cashierName ?? "Unknown"}</p>
        </div>

        {myEntry && (
          <div>
            <p className="text-[rgba(251,191,36,0.55)] text-sm">Clocked in at</p>
            <p className="text-[#fef9ec]">{fmtDate(myEntry.joined_at)}</p>
          </div>
        )}

        {shift && (
          <>
            <div>
              <p className="text-[rgba(251,191,36,0.55)] text-sm">Shift started</p>
              <p className="text-[#fef9ec]">{fmtDate(shift.start_time)}</p>
            </div>

            <div>
              <p className="text-[rgba(251,191,36,0.55)] text-sm mb-2">Employees on shift</p>
              <div className="space-y-1">
                {employees.map((e: any) => (
                  <div key={e.id} className="flex items-center justify-between text-sm">
                    <span className="text-[#fef9ec]">{e.cashiers?.name ?? "Unknown"}</span>
                    <span className={`text-xs ${e.left_at ? "text-gray-500" : "text-[#10b981]"}`}>
                      {e.left_at ? "Clocked out" : "Active"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="space-y-2 pt-2">
          <button
            onClick={() => clockOut.mutate()}
            disabled={clockOut.isPending}
            className="w-full py-3 rounded-xl bg-[rgba(244,63,94,0.15)] border border-[rgba(244,63,94,0.3)] text-[#f43f5e] font-medium hover:bg-[rgba(244,63,94,0.25)] transition-colors disabled:opacity-50"
          >
            Clock Out
          </button>

          {!showCloseForm ? (
            <button
              onClick={() => setShowCloseForm(true)}
              className="w-full py-3 rounded-xl bg-[rgba(40,56,44,0.6)] border border-[rgba(255,255,255,0.08)] text-[rgba(254,249,236,0.7)] text-sm hover:text-[#fef9ec] transition-colors"
            >
              End Shift (close all)
            </button>
          ) : (
            <div className="space-y-2">
              <label className="text-xs text-[rgba(251,191,36,0.55)]">Closing Cash Count</label>
              <input
                type="number"
                value={closingCash}
                onChange={(e) => setClosingCash(e.target.value)}
                className="w-full px-4 py-2 bg-[rgba(40,56,44,0.6)] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#fef9ec] outline-none focus:border-[rgba(251,191,36,0.25)]"
              />
              <button
                onClick={() => closeShift.mutate()}
                disabled={closeShift.isPending}
                className="w-full py-3 rounded-xl bg-[rgba(245,158,11,0.15)] border border-[rgba(251,191,36,0.25)] text-[#f59e0b] font-bold hover:bg-[rgba(245,158,11,0.25)] transition-colors"
              >
                Confirm Close Shift
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
