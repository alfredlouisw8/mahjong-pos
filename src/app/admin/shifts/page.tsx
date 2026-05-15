"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ChevronDown, ChevronRight, Pencil } from "lucide-react"
import { fmtDate, fmtMoney } from "@/lib/formatters"
import type { Shift } from "@/types/database"

interface ShiftEmployee {
  id: string
  joined_at: string
  left_at: string | null
  cashiers: { name: string } | null
}

interface ShiftWithMeta extends Omit<Shift, "shift_employees"> {
  shift_employees: ShiftEmployee[]
  session_count: number
  revenue: number
}

export default function ShiftsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const PAGE = 15
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [editShift, setEditShift] = useState<ShiftWithMeta | null>(null)
  const [notes, setNotes] = useState("")

  const { data } = useQuery<{ shifts: ShiftWithMeta[]; total: number }>({
    queryKey: ["admin-shifts", page],
    queryFn: async () => {
      const res = await fetch(`/api/admin/shifts?page=${page}&limit=${PAGE}`)
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
  })

  const update = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/shifts/${editShift!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-shifts"] })
      toast.success("Updated")
      setEditShift(null)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const shifts = data?.shifts ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / PAGE)

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader title="Shift Log" />

      <div className="space-y-2">
        {shifts.map((shift) => {
          const isOpen = expanded.has(shift.id)
          const isActive = !shift.end_time
          return (
            <div key={shift.id} className="bg-[rgba(20,36,28,0.85)] border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden">
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-[rgba(255,255,255,0.02)]"
                onClick={() => toggleExpand(shift.id)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-[rgba(251,191,36,0.5)]">{isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[#fef9ec] text-sm">{fmtDate(shift.start_time)}</span>
                      {isActive && <span className="text-xs px-2 py-0.5 rounded-full bg-[rgba(16,185,129,0.15)] text-[#10b981]">Active</span>}
                    </div>
                    <p className="text-xs text-[rgba(251,191,36,0.55)] mt-0.5">
                      {shift.shift_employees.map((e) => e.cashiers?.name).filter(Boolean).join(", ")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-right">
                  <div>
                    <p className="text-xs text-[rgba(251,191,36,0.4)]">Revenue</p>
                    <p className="text-sm font-medium text-[#fef9ec]">{fmtMoney(shift.revenue ?? 0, "Rp")}</p>
                  </div>
                  {shift.opening_cash != null && (
                    <div>
                      <p className="text-xs text-[rgba(251,191,36,0.4)]">Opening</p>
                      <p className="text-sm text-[#fef9ec]">{fmtMoney(Number(shift.opening_cash), "Rp")}</p>
                    </div>
                  )}
                  {shift.closing_cash != null && (
                    <div>
                      <p className="text-xs text-[rgba(251,191,36,0.4)]">Variance</p>
                      <p className={`text-sm font-medium ${Number(shift.cash_variance ?? 0) >= 0 ? "text-[#10b981]" : "text-[#f43f5e]"}`}>
                        {Number(shift.cash_variance ?? 0) >= 0 ? "+" : ""}{fmtMoney(Number(shift.cash_variance ?? 0), "Rp")}
                      </p>
                    </div>
                  )}
                  <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setEditShift(shift); setNotes(shift.notes ?? "") }} className="text-[rgba(254,249,236,0.5)] hover:text-[#fef9ec]">
                    <Pencil size={13} />
                  </Button>
                </div>
              </div>

              {isOpen && (
                <div className="border-t border-[rgba(255,255,255,0.06)] px-4 py-3 space-y-2">
                  {shift.shift_employees.map((emp) => (
                    <div key={emp.id} className="flex items-center justify-between text-sm">
                      <span className="text-[rgba(254,249,236,0.7)]">{emp.cashiers?.name ?? "Unknown"}</span>
                      <div className="text-xs text-[rgba(251,191,36,0.4)]">
                        {fmtDate(emp.joined_at)} → {emp.left_at ? fmtDate(emp.left_at) : <span className="text-[#10b981]">Still active</span>}
                      </div>
                    </div>
                  ))}
                  {shift.notes && (
                    <p className="text-xs text-[rgba(254,249,236,0.5)] mt-2 italic">"{shift.notes}"</p>
                  )}
                  <div className="flex gap-4 text-xs text-[rgba(251,191,36,0.4)] pt-1">
                    <span>Closed: {shift.end_time ? fmtDate(shift.end_time) : "—"}</span>
                    <span>Sessions: {shift.session_count ?? 0}</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-[rgba(251,191,36,0.55)]">{total} shifts total</span>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="text-xs text-[rgba(254,249,236,0.5)]">← Prev</Button>
            <span className="text-xs text-[rgba(254,249,236,0.5)] self-center">{page} / {totalPages}</span>
            <Button size="sm" variant="ghost" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="text-xs text-[rgba(254,249,236,0.5)]">Next →</Button>
          </div>
        </div>
      )}

      {editShift && (
        <Dialog open onOpenChange={() => setEditShift(null)}>
          <DialogContent className="bg-[rgba(20,36,28,0.95)] border-[rgba(255,255,255,0.08)] text-[#fef9ec]">
            <DialogHeader>
              <DialogTitle className="text-[#f59e0b]">Edit Shift Notes</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Shift notes…"
                rows={4}
                className="w-full px-3 py-2 bg-[rgba(40,56,44,0.6)] border border-[rgba(255,255,255,0.08)] rounded-md text-[#fef9ec] text-sm resize-none focus:outline-none focus:border-[rgba(251,191,36,0.25)]"
              />
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setEditShift(null)} className="flex-1 border-[rgba(255,255,255,0.08)]">Cancel</Button>
                <Button onClick={() => update.mutate()} disabled={update.isPending} className="flex-1 bg-[#f59e0b] hover:bg-[#d97706] text-black font-bold">Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
