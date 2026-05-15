"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Pencil, Trash2, Eye, EyeOff } from "lucide-react"
import type { Cashier } from "@/types/database"

const BLANK = { name: "", pin: "", confirmPin: "" }

export default function CashiersPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<Cashier | null>(null)
  const [form, setForm] = useState(BLANK)
  const [showPin, setShowPin] = useState(false)

  const { data: cashiers = [] } = useQuery<Cashier[]>({
    queryKey: ["cashiers"],
    queryFn: async () => {
      const res = await fetch("/api/admin/cashiers")
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
  })

  const save = useMutation({
    mutationFn: async () => {
      if (!editItem && form.pin !== form.confirmPin) throw new Error("PINs do not match")
      if (!editItem && form.pin.length < 4) throw new Error("PIN must be at least 4 digits")
      const url = editItem ? `/api/admin/cashiers/${editItem.id}` : "/api/admin/cashiers"
      const method = editItem ? "PATCH" : "POST"
      const body: Record<string, string> = { name: form.name }
      if (form.pin) body.pin = form.pin
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error((await res.json()).error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cashiers"] })
      toast.success(editItem ? "Updated" : "Created")
      setShowForm(false)
      setEditItem(null)
      setForm(BLANK)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const del = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/cashiers/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error((await res.json()).error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cashiers"] })
      toast.success("Deactivated")
    },
    onError: (e: Error) => toast.error(e.message),
  })

  function openEdit(c: Cashier) {
    setEditItem(c)
    setForm({ name: c.name, pin: "", confirmPin: "" })
    setShowForm(true)
  }

  const active = cashiers.filter((c) => c.is_active !== false)
  const inactive = cashiers.filter((c) => c.is_active === false)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="Cashiers"
        action={
          <Button onClick={() => { setShowForm(true); setEditItem(null); setForm(BLANK) }} className="bg-[#f59e0b] hover:bg-[#d97706] text-black font-bold">
            + Add Cashier
          </Button>
        }
      />

      <div className="space-y-2">
        {active.map((c) => (
          <div key={c.id} className="flex items-center justify-between bg-[rgba(20,36,28,0.85)] border border-[rgba(255,255,255,0.08)] rounded-xl p-4">
            <div>
              <p className="font-medium text-[#fef9ec]">{c.name}</p>
              <p className="text-xs text-[rgba(251,191,36,0.55)] mt-0.5">Active cashier</p>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => openEdit(c)} className="text-[rgba(254,249,236,0.5)] hover:text-[#fef9ec]">
                <Pencil size={14} />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { if (confirm(`Deactivate ${c.name}?`)) del.mutate(c.id) }} className="text-[rgba(244,63,94,0.5)] hover:text-[#f43f5e]">
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {inactive.length > 0 && (
        <div>
          <p className="text-xs text-[rgba(251,191,36,0.4)] mb-2">Deactivated</p>
          <div className="space-y-2">
            {inactive.map((c) => (
              <div key={c.id} className="flex items-center justify-between bg-[rgba(20,36,28,0.5)] border border-[rgba(255,255,255,0.04)] rounded-xl p-4 opacity-50">
                <p className="font-medium text-[#fef9ec] line-through">{c.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <Dialog open onOpenChange={() => { setShowForm(false); setEditItem(null) }}>
          <DialogContent className="bg-[rgba(20,36,28,0.95)] border-[rgba(255,255,255,0.08)] text-[#fef9ec]">
            <DialogHeader>
              <DialogTitle className="text-[#f59e0b]">{editItem ? "Edit" : "New"} Cashier</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" className="bg-[rgba(40,56,44,0.6)] border-[rgba(255,255,255,0.08)] text-[#fef9ec]" />
              <div className="relative">
                <Input
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  value={form.pin}
                  onChange={(e) => setForm({ ...form, pin: e.target.value })}
                  placeholder={editItem ? "New PIN (leave blank to keep)" : "PIN (4+ digits)"}
                  className="bg-[rgba(40,56,44,0.6)] border-[rgba(255,255,255,0.08)] text-[#fef9ec] pr-10"
                />
                <button type="button" onClick={() => setShowPin((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgba(254,249,236,0.4)]">
                  {showPin ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {(!editItem || form.pin) && (
                <Input
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  value={form.confirmPin}
                  onChange={(e) => setForm({ ...form, confirmPin: e.target.value })}
                  placeholder="Confirm PIN"
                  className="bg-[rgba(40,56,44,0.6)] border-[rgba(255,255,255,0.08)] text-[#fef9ec]"
                />
              )}
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => { setShowForm(false); setEditItem(null) }} className="flex-1 border-[rgba(255,255,255,0.08)]">Cancel</Button>
                <Button onClick={() => save.mutate()} disabled={!form.name || save.isPending} className="flex-1 bg-[#f59e0b] hover:bg-[#d97706] text-black font-bold">Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
