"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useReservations } from "@/hooks/useReservations"
import { ReservationList } from "@/components/pos/ReservationList"
import { PageHeader } from "@/components/layout/PageHeader"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export default function ReservationsPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    guest_name: "",
    phone: "",
    party_size: 2,
    date: "",
    time: "",
    notes: "",
  })

  const create = useMutation({
    mutationFn: async () => {
      const datetime = new Date(`${form.date}T${form.time}`).toISOString()
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, datetime, party_size: Number(form.party_size) }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] })
      toast.success("Reservation created")
      setShowForm(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <PageHeader
        title="Reservations"
        action={
          <Button
            onClick={() => setShowForm(true)}
            className="bg-[#f59e0b] hover:bg-[#d97706] text-black font-bold"
          >
            + New
          </Button>
        }
      />

      <ReservationList />

      {showForm && (
        <Dialog open onOpenChange={setShowForm}>
          <DialogContent className="bg-[rgba(20,36,28,0.95)] border-[rgba(255,255,255,0.08)] text-[#fef9ec]">
            <DialogHeader>
              <DialogTitle className="text-[#f59e0b]">New Reservation</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[rgba(251,191,36,0.55)]">Guest Name *</label>
                <Input
                  value={form.guest_name}
                  onChange={(e) => setForm({ ...form, guest_name: e.target.value })}
                  className="bg-[rgba(40,56,44,0.6)] border-[rgba(255,255,255,0.08)] text-[#fef9ec]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[rgba(251,191,36,0.55)]">Phone</label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="bg-[rgba(40,56,44,0.6)] border-[rgba(255,255,255,0.08)] text-[#fef9ec]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[rgba(251,191,36,0.55)]">Party Size *</label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={form.party_size}
                    onChange={(e) => setForm({ ...form, party_size: Number(e.target.value) })}
                    className="bg-[rgba(40,56,44,0.6)] border-[rgba(255,255,255,0.08)] text-[#fef9ec]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[rgba(251,191,36,0.55)]">Date *</label>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="bg-[rgba(40,56,44,0.6)] border-[rgba(255,255,255,0.08)] text-[#fef9ec]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[rgba(251,191,36,0.55)]">Time *</label>
                  <Input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    className="bg-[rgba(40,56,44,0.6)] border-[rgba(255,255,255,0.08)] text-[#fef9ec]"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-[rgba(251,191,36,0.55)]">Notes</label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="bg-[rgba(40,56,44,0.6)] border-[rgba(255,255,255,0.08)] text-[#fef9ec]"
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1 border-[rgba(255,255,255,0.08)]">Cancel</Button>
                <Button
                  onClick={() => create.mutate()}
                  disabled={create.isPending || !form.guest_name || !form.date || !form.time}
                  className="flex-1 bg-[#f59e0b] hover:bg-[#d97706] text-black font-bold"
                >
                  Save
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
