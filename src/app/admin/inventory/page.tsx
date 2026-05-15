"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useInventory } from "@/hooks/useInventory"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Pencil, Trash2, Plus } from "lucide-react"
import type { InventoryItem } from "@/types/database"

function StockBadge({ item }: { item: InventoryItem }) {
  if (item.current_stock === 0) return <span className="text-xs px-2 py-0.5 rounded-full bg-[rgba(244,63,94,0.15)] text-[#f43f5e]">🔴 Out</span>
  if (item.current_stock <= item.low_stock_threshold) return <span className="text-xs px-2 py-0.5 rounded-full bg-[rgba(245,158,11,0.15)] text-[#f59e0b]">🟡 Low</span>
  return <span className="text-xs px-2 py-0.5 rounded-full bg-[rgba(16,185,129,0.15)] text-[#10b981]">🟢 OK</span>
}

const BLANK = { name: "", unit: "", current_stock: 0, low_stock_threshold: 5, cost_per_unit: 0 }

export default function InventoryPage() {
  const queryClient = useQueryClient()
  const { data: items = [] } = useInventory()
  const [filter, setFilter] = useState<"all" | "low" | "out">("all")
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<InventoryItem | null>(null)
  const [showRestock, setShowRestock] = useState<InventoryItem | null>(null)
  const [form, setForm] = useState(BLANK)
  const [restockQty, setRestockQty] = useState("")
  const [restockPrice, setRestockPrice] = useState("")

  const filtered = items.filter((i) => {
    if (filter === "low") return i.current_stock <= i.low_stock_threshold && i.current_stock > 0
    if (filter === "out") return i.current_stock === 0
    return true
  })

  const save = useMutation({
    mutationFn: async () => {
      const url = editItem ? `/api/admin/inventory/${editItem.id}` : "/api/admin/inventory"
      const method = editItem ? "PATCH" : "POST"
      const body = { ...form, current_stock: Number(form.current_stock), low_stock_threshold: Number(form.low_stock_threshold), cost_per_unit: Number(form.cost_per_unit) }
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error((await res.json()).error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] })
      toast.success(editItem ? "Updated" : "Created")
      setShowForm(false)
      setEditItem(null)
      setForm(BLANK)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const doRestock = useMutation({
    mutationFn: async () => {
      const item = showRestock!
      const qty = Number(restockQty)
      const price = Number(restockPrice)

      const res = await fetch(`/api/admin/inventory/${item.id}/restock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: qty }),
      })
      if (!res.ok) throw new Error((await res.json()).error)

      if (price > 0 && qty > 0) {
        const total = qty * price
        const today = new Date().toISOString().slice(0, 10)
        await fetch("/api/admin/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: total,
            category: "supplies",
            date: today,
            description: `Restock: ${item.name} ×${qty} ${item.unit} @ Rp${price.toLocaleString("id-ID")}`,
          }),
        })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] })
      queryClient.invalidateQueries({ queryKey: ["expenses"] })
      toast.success("Restocked" + (Number(restockPrice) > 0 ? " · expense recorded" : ""))
      setShowRestock(null)
      setRestockQty("")
      setRestockPrice("")
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/inventory/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error((await res.json()).error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] })
      toast.success("Deleted")
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Inventory"
        action={
          <Button onClick={() => { setShowForm(true); setEditItem(null); setForm(BLANK) }} className="bg-[#f59e0b] hover:bg-[#d97706] text-black font-bold">
            + Add Item
          </Button>
        }
      />

      <div className="flex gap-2">
        {(["all", "low", "out"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${filter === f ? "bg-[rgba(245,158,11,0.2)] text-[#f59e0b] border border-[rgba(251,191,36,0.3)]" : "bg-[rgba(40,56,44,0.6)] text-[rgba(254,249,236,0.7)] border border-[rgba(255,255,255,0.08)]"}`}>
            {f} {f === "low" ? `(${items.filter((i) => i.current_stock <= i.low_stock_threshold && i.current_stock > 0).length})` : f === "out" ? `(${items.filter((i) => i.current_stock === 0).length})` : ""}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((item) => (
          <div key={item.id} className="flex items-center justify-between bg-[rgba(20,36,28,0.85)] border border-[rgba(255,255,255,0.08)] rounded-xl p-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-[#fef9ec]">{item.name}</span>
                <StockBadge item={item} />
              </div>
              <p className="text-xs text-[rgba(251,191,36,0.55)] mt-1">
                {item.current_stock} {item.unit} · Threshold: {item.low_stock_threshold}
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => { setShowRestock(item); setRestockPrice(item.cost_per_unit > 0 ? String(item.cost_per_unit) : "") }} className="text-xs bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.2)] text-[#10b981] hover:bg-[rgba(16,185,129,0.2)]">
                <Plus size={12} className="mr-1" /> Restock
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setEditItem(item); setForm({ name: item.name, unit: item.unit, current_stock: item.current_stock, low_stock_threshold: item.low_stock_threshold, cost_per_unit: item.cost_per_unit }); setShowForm(true) }} className="text-[rgba(254,249,236,0.5)] hover:text-[#fef9ec]">
                <Pencil size={14} />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete?")) deleteItem.mutate(item.id) }} className="text-[rgba(244,63,94,0.5)] hover:text-[#f43f5e]">
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <Dialog open onOpenChange={() => { setShowForm(false); setEditItem(null) }}>
          <DialogContent className="bg-[rgba(20,36,28,0.95)] border-[rgba(255,255,255,0.08)] text-[#fef9ec]">
            <DialogHeader><DialogTitle className="text-[#f59e0b]">{editItem ? "Edit" : "Add"} Inventory Item</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-[rgba(251,191,36,0.55)]">Name</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Beer 330ml" className="bg-[rgba(40,56,44,0.6)] border-[rgba(255,255,255,0.08)] text-[#fef9ec]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-[rgba(251,191,36,0.55)]">Unit</label>
                  <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="pcs, kg, bottle…" className="bg-[rgba(40,56,44,0.6)] border-[rgba(255,255,255,0.08)] text-[#fef9ec]" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-[rgba(251,191,36,0.55)]">Current Stock</label>
                  <Input type="number" value={form.current_stock} onChange={(e) => setForm({ ...form, current_stock: Number(e.target.value) })} className="bg-[rgba(40,56,44,0.6)] border-[rgba(255,255,255,0.08)] text-[#fef9ec]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-[rgba(251,191,36,0.55)]">Low Stock Threshold</label>
                  <Input type="number" value={form.low_stock_threshold} onChange={(e) => setForm({ ...form, low_stock_threshold: Number(e.target.value) })} className="bg-[rgba(40,56,44,0.6)] border-[rgba(255,255,255,0.08)] text-[#fef9ec]" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-[rgba(251,191,36,0.55)]">Cost per Unit (Rp)</label>
                  <Input type="number" value={form.cost_per_unit} onChange={(e) => setForm({ ...form, cost_per_unit: Number(e.target.value) })} className="bg-[rgba(40,56,44,0.6)] border-[rgba(255,255,255,0.08)] text-[#fef9ec]" />
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => { setShowForm(false); setEditItem(null) }} className="flex-1 border-[rgba(255,255,255,0.08)]">Cancel</Button>
                <Button onClick={() => save.mutate()} disabled={!form.name || save.isPending} className="flex-1 bg-[#f59e0b] hover:bg-[#d97706] text-black font-bold">Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {showRestock && (
        <Dialog open onOpenChange={() => { setShowRestock(null); setRestockQty(""); setRestockPrice("") }}>
          <DialogContent className="bg-[rgba(20,36,28,0.95)] border-[rgba(255,255,255,0.08)] text-[#fef9ec]">
            <DialogHeader><DialogTitle className="text-[#f59e0b]">Restock — {showRestock.name}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-[rgba(251,191,36,0.55)]">Current: {showRestock.current_stock} {showRestock.unit}</p>
              <div className="space-y-1">
                <label className="text-xs text-[rgba(251,191,36,0.55)]">Quantity ({showRestock.unit})</label>
                <Input type="number" value={restockQty} onChange={(e) => setRestockQty(e.target.value)} className="bg-[rgba(40,56,44,0.6)] border-[rgba(255,255,255,0.08)] text-[#fef9ec]" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-[rgba(251,191,36,0.55)]">Cost per unit, Rp (optional — records an expense)</label>
                <Input type="number" value={restockPrice} onChange={(e) => setRestockPrice(e.target.value)} placeholder={showRestock.cost_per_unit > 0 ? String(showRestock.cost_per_unit) : "0"} className="bg-[rgba(40,56,44,0.6)] border-[rgba(255,255,255,0.08)] text-[#fef9ec]" />
              </div>
              {Number(restockQty) > 0 && Number(restockPrice) > 0 && (
                <p className="text-sm text-[rgba(254,249,236,0.6)]">
                  Total expense: <span className="text-[#f59e0b] font-medium">Rp{(Number(restockQty) * Number(restockPrice)).toLocaleString("id-ID")}</span>
                </p>
              )}
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => { setShowRestock(null); setRestockQty(""); setRestockPrice("") }} className="flex-1 border-[rgba(255,255,255,0.08)]">Cancel</Button>
                <Button onClick={() => doRestock.mutate()} disabled={!restockQty || doRestock.isPending} className="flex-1 bg-[#f59e0b] hover:bg-[#d97706] text-black font-bold">Restock</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
