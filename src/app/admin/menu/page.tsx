"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useMenu } from "@/hooks/useMenu"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { fmtMoney } from "@/lib/formatters"
import { Pencil, Trash2 } from "lucide-react"
import type { MenuItem } from "@/types/database"

const BLANK = { name: "", category: "", price: 0, cogs: 0, is_available: true, track_inventory: false, description: "" }

export default function AdminMenuPage() {
  const queryClient = useQueryClient()
  const { data: items = [] } = useMenu(true)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<MenuItem | null>(null)
  const [form, setForm] = useState(BLANK)

  const save = useMutation({
    mutationFn: async () => {
      const url = editItem ? `/api/admin/menu/${editItem.id}` : "/api/admin/menu"
      const method = editItem ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, price: Number(form.price), cogs: Number(form.cogs) }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu"] })
      toast.success(editItem ? "Item updated" : "Item created")
      setShowForm(false)
      setEditItem(null)
      setForm(BLANK)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/menu/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error((await res.json()).error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu"] })
      toast.success("Item removed")
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const categories = Array.from(new Set(items.map((i) => i.category)))

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Menu Management"
        action={
          <Button onClick={() => { setShowForm(true); setEditItem(null); setForm(BLANK) }} className="bg-[#f59e0b] hover:bg-[#d97706] text-black font-bold">
            + Add Item
          </Button>
        }
      />

      {categories.map((cat) => (
        <div key={cat}>
          <h3 className="text-sm text-[rgba(251,191,36,0.55)] uppercase tracking-wide mb-2">{cat}</h3>
          <div className="space-y-2">
            {items.filter((i) => i.category === cat).map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-[rgba(20,36,28,0.85)] border border-[rgba(255,255,255,0.08)] rounded-xl p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#fef9ec]">{item.name}</span>
                    {!item.is_available && <span className="text-xs text-gray-500 bg-gray-500/10 px-2 py-0.5 rounded-full">Unavailable</span>}
                    {item.track_inventory && <span className="text-xs text-[#3b82f6] bg-[rgba(59,130,246,0.1)] px-2 py-0.5 rounded-full">📦 Tracked</span>}
                  </div>
                  <div className="text-xs text-[rgba(251,191,36,0.55)] mt-1">
                    Price: {fmtMoney(item.price, "Rp")} · COGS: {fmtMoney(item.cogs, "Rp")} · Margin: {item.price > 0 ? Math.round(((item.price - item.cogs) / item.price) * 100) : 0}%
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditItem(item)
                      setForm({ name: item.name, category: item.category, price: item.price, cogs: item.cogs, is_available: item.is_available, track_inventory: item.track_inventory, description: item.description ?? "" })
                      setShowForm(true)
                    }}
                    className="text-[rgba(254,249,236,0.5)] hover:text-[#fef9ec]"
                  >
                    <Pencil size={14} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { if (confirm(`Delete ${item.name}?`)) deleteItem.mutate(item.id) }}
                    className="text-[rgba(244,63,94,0.5)] hover:text-[#f43f5e]"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {(showForm) && (
        <Dialog open onOpenChange={() => { setShowForm(false); setEditItem(null) }}>
          <DialogContent className="bg-[rgba(20,36,28,0.95)] border-[rgba(255,255,255,0.08)] text-[#fef9ec] max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-[#f59e0b]">{editItem ? "Edit Item" : "Add Menu Item"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[rgba(251,191,36,0.55)]">Name *</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-[rgba(40,56,44,0.6)] border-[rgba(255,255,255,0.08)] text-[#fef9ec]" />
              </div>
              <div>
                <label className="text-xs text-[rgba(251,191,36,0.55)]">Category *</label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Tea, Food, Drinks…" className="bg-[rgba(40,56,44,0.6)] border-[rgba(255,255,255,0.08)] text-[#fef9ec]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[rgba(251,191,36,0.55)]">Price (Rp) *</label>
                  <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="bg-[rgba(40,56,44,0.6)] border-[rgba(255,255,255,0.08)] text-[#fef9ec]" />
                </div>
                <div>
                  <label className="text-xs text-[rgba(251,191,36,0.55)]">COGS (Rp) *</label>
                  <Input type="number" value={form.cogs} onChange={(e) => setForm({ ...form, cogs: Number(e.target.value) })} className="bg-[rgba(40,56,44,0.6)] border-[rgba(255,255,255,0.08)] text-[#fef9ec]" />
                </div>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.is_available} onChange={(e) => setForm({ ...form, is_available: e.target.checked })} className="accent-[#f59e0b]" />
                  <span className="text-[rgba(254,249,236,0.7)]">Available</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.track_inventory} onChange={(e) => setForm({ ...form, track_inventory: e.target.checked })} className="accent-[#f59e0b]" />
                  <span className="text-[rgba(254,249,236,0.7)]">Track Inventory</span>
                </label>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => { setShowForm(false); setEditItem(null) }} className="flex-1 border-[rgba(255,255,255,0.08)]">Cancel</Button>
                <Button onClick={() => save.mutate()} disabled={!form.name || !form.category || save.isPending} className="flex-1 bg-[#f59e0b] hover:bg-[#d97706] text-black font-bold">Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
