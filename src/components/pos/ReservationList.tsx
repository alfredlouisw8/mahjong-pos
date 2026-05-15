"use client"

import { useState } from "react"
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { useReservations } from "@/hooks/useReservations"
import { fmtDate } from "@/lib/formatters"
import type { Table } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const STATUS_COLORS: Record<string, string> = {
  booked: "bg-[rgba(245,158,11,0.2)] text-[#f59e0b] border-[rgba(251,191,36,0.3)]",
  seated: "bg-[rgba(16,185,129,0.2)] text-[#10b981] border-[rgba(16,185,129,0.3)]",
  cancelled: "bg-[rgba(244,63,94,0.2)] text-[#f43f5e] border-[rgba(244,63,94,0.3)]",
  no_show: "bg-[rgba(107,114,128,0.2)] text-gray-400 border-gray-500/30",
}

const BLANK_FORM = { guest_name: "", datetime: "", party_size: 2, phone: "", notes: "", table_id: "" }

const INPUT_CLASS = "bg-[rgba(40,56,44,0.6)] border-[rgba(255,255,255,0.08)] text-[#fef9ec]"
const LABEL_CLASS = "text-xs text-[rgba(251,191,36,0.55)]"

export function ReservationList() {
  const queryClient = useQueryClient()
  const { data: reservations = [] } = useReservations()
  const { data: tables = [] } = useQuery<Table[]>({
    queryKey: ["tables-list"],
    queryFn: async () => {
      const res = await fetch("/api/tables")
      if (!res.ok) throw new Error("Failed to fetch tables")
      return res.json()
    },
    staleTime: 60_000,
  })
  const [filter, setFilter] = useState<"upcoming" | "all" | "cancelled">("upcoming")
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(BLANK_FORM)

  const now = new Date()

  const filtered = reservations.filter((r) => {
    if (filter === "upcoming") return r.status === "booked" && new Date(r.datetime) > now
    if (filter === "cancelled") return r.status === "cancelled" || r.status === "no_show"
    return true
  })

  const create = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = {
        guest_name: form.guest_name,
        datetime: new Date(form.datetime).toISOString(),
        party_size: Number(form.party_size),
        status: "booked",
      }
      if (form.phone) body.phone = form.phone
      if (form.notes) body.notes = form.notes
      if (form.table_id) body.table_id = form.table_id

      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error((await res.json()).error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] })
      toast.success("Reservation created")
      setShowCreate(false)
      setForm(BLANK_FORM)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/reservations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reservations"] }),
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(["upcoming", "all", "cancelled"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
                filter === f
                  ? "bg-[rgba(245,158,11,0.2)] text-[#f59e0b] border border-[rgba(251,191,36,0.3)]"
                  : "bg-[rgba(40,56,44,0.6)] text-[rgba(254,249,236,0.7)] border border-[rgba(255,255,255,0.08)]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="bg-[#f59e0b] hover:bg-[#d97706] text-black font-bold text-sm"
        >
          + New Reservation
        </Button>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-[rgba(251,191,36,0.55)] text-sm">No reservations</div>
      )}

      <div className="space-y-2">
        {filtered.map((r) => (
          <div key={r.id} className="bg-[rgba(20,36,28,0.85)] border border-[rgba(255,255,255,0.08)] rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-[#fef9ec]">{r.guest_name}</p>
                <p className="text-sm text-[rgba(251,191,36,0.55)]">{fmtDate(r.datetime)}</p>
                <p className="text-xs text-[rgba(254,249,236,0.5)]">
                  Party of {r.party_size}
                  {r.phone && ` · ${r.phone}`}
                  {(r.tables as any)?.label && ` · ${(r.tables as any).label}`}
                </p>
                {r.notes && <p className="text-xs text-[rgba(254,249,236,0.4)] mt-0.5 italic">{r.notes}</p>}
              </div>
              <span className={`text-xs px-2 py-1 rounded-full border ${STATUS_COLORS[r.status]}`}>
                {r.status.toUpperCase()}
              </span>
            </div>
            {r.status === "booked" && (
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={() => updateStatus.mutate({ id: r.id, status: "seated" })}
                  className="text-xs bg-[rgba(16,185,129,0.15)] border border-[rgba(16,185,129,0.3)] text-[#10b981] hover:bg-[rgba(16,185,129,0.25)]"
                >
                  Seat
                </Button>
                <Button
                  size="sm"
                  onClick={() => updateStatus.mutate({ id: r.id, status: "no_show" })}
                  className="text-xs bg-gray-500/10 border border-gray-500/30 text-gray-400 hover:bg-gray-500/20"
                >
                  No Show
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {showCreate && (
        <Dialog open onOpenChange={() => { setShowCreate(false); setForm(BLANK_FORM) }}>
          <DialogContent className="bg-[rgba(20,36,28,0.95)] border-[rgba(255,255,255,0.08)] text-[#fef9ec]">
            <DialogHeader>
              <DialogTitle className="text-[#f59e0b]">New Reservation</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className={LABEL_CLASS}>Guest Name</label>
                <Input
                  value={form.guest_name}
                  onChange={(e) => setForm({ ...form, guest_name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className={INPUT_CLASS}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={LABEL_CLASS}>Date & Time</label>
                  <Input
                    type="datetime-local"
                    value={form.datetime}
                    onChange={(e) => setForm({ ...form, datetime: e.target.value })}
                    className={INPUT_CLASS}
                  />
                </div>
                <div className="space-y-1">
                  <label className={LABEL_CLASS}>Party Size</label>
                  <Input
                    type="number"
                    min={1}
                    value={form.party_size}
                    onChange={(e) => setForm({ ...form, party_size: Number(e.target.value) })}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={LABEL_CLASS}>Phone (optional)</label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+62..."
                    className={INPUT_CLASS}
                  />
                </div>
                <div className="space-y-1">
                  <label className={LABEL_CLASS}>Table (optional)</label>
                  <select
                    value={form.table_id}
                    onChange={(e) => setForm({ ...form, table_id: e.target.value })}
                    className={`w-full h-10 rounded-md border px-3 text-sm ${INPUT_CLASS}`}
                  >
                    <option value="">— Any table —</option>
                    {tables.map((t) => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className={LABEL_CLASS}>Notes (optional)</label>
                <Input
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Special requests…"
                  className={INPUT_CLASS}
                />
              </div>
              <div className="flex gap-3 pt-1">
                <Button
                  variant="outline"
                  onClick={() => { setShowCreate(false); setForm(BLANK_FORM) }}
                  className="flex-1 border-[rgba(255,255,255,0.08)]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => create.mutate()}
                  disabled={!form.guest_name || !form.datetime || create.isPending}
                  className="flex-1 bg-[#f59e0b] hover:bg-[#d97706] text-black font-bold"
                >
                  Create
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
