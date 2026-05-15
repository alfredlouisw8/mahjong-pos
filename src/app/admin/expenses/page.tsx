"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Pencil, Trash2, Copy } from "lucide-react"
import { fmtMoney, fmtDate } from "@/lib/formatters"
import type { Expense } from "@/types/database"

const CATEGORIES = ["Utilities", "Rent", "Salaries", "Supplies", "Maintenance", "Marketing", "Other"]

const BLANK = { date: new Date().toISOString().slice(0, 10), category: "Other", description: "", amount: 0 }

function groupByMonth(expenses: Expense[]) {
  const map = new Map<string, Expense[]>()
  for (const e of expenses) {
    const key = e.date.slice(0, 7)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(e)
  }
  return map
}

export default function ExpensesPage() {
  const queryClient = useQueryClient()
  const [from, setFrom] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10)
  })
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10))
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<Expense | null>(null)
  const [form, setForm] = useState(BLANK)

  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ["expenses", from, to],
    queryFn: async () => {
      const res = await fetch(`/api/admin/expenses?from=${from}&to=${to}`)
      if (!res.ok) throw new Error("Failed to load")
      return res.json()
    },
  })

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const grouped = groupByMonth(expenses)

  const save = useMutation({
    mutationFn: async () => {
      const url = editItem ? `/api/admin/expenses/${editItem.id}` : "/api/admin/expenses"
      const method = editItem ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: Number(form.amount) }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] })
      toast.success(editItem ? "Updated" : "Added")
      setShowForm(false)
      setEditItem(null)
      setForm(BLANK)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const del = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/expenses/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error((await res.json()).error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] })
      toast.success("Deleted")
    },
    onError: (e: Error) => toast.error(e.message),
  })

  function openEdit(e: Expense) {
    setEditItem(e)
    setForm({ date: e.date, category: e.category, description: e.description ?? "", amount: Number(e.amount) })
    setShowForm(true)
  }

  function openDuplicate(e: Expense) {
    setEditItem(null)
    setForm({ date: new Date().toISOString().slice(0, 10), category: e.category, description: e.description ?? "", amount: Number(e.amount) })
    setShowForm(true)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Expenses"
        action={
          <Button onClick={() => { setShowForm(true); setEditItem(null); setForm(BLANK) }} className="bg-[#f59e0b] hover:bg-[#d97706] text-black font-bold">
            + Add Expense
          </Button>
        }
      />

      <div className="flex gap-3 items-center flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-xs text-[rgba(251,191,36,0.55)]">From</label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-36 bg-[rgba(40,56,44,0.6)] border-[rgba(255,255,255,0.08)] text-[#fef9ec] text-xs" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-[rgba(251,191,36,0.55)]">To</label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-36 bg-[rgba(40,56,44,0.6)] border-[rgba(255,255,255,0.08)] text-[#fef9ec] text-xs" />
        </div>
        <div className="ml-auto text-sm text-[rgba(251,191,36,0.7)]">
          Total: <span className="text-[#f59e0b] font-bold">{fmtMoney(total, "Rp")}</span>
        </div>
      </div>

      {expenses.length === 0 && (
        <div className="text-center py-12 text-[rgba(251,191,36,0.55)] text-sm">No expenses in this period</div>
      )}

      {Array.from(grouped.entries()).map(([month, items]) => (
        <div key={month} className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-[rgba(251,191,36,0.55)]">
              {new Date(month + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </h3>
            <span className="text-xs text-[rgba(251,191,36,0.55)]">{fmtMoney(items.reduce((s, e) => s + Number(e.amount), 0), "Rp")}</span>
          </div>
          {items.map((expense) => (
            <div key={expense.id} className="flex items-center justify-between bg-[rgba(20,36,28,0.85)] border border-[rgba(255,255,255,0.08)] rounded-xl p-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[rgba(245,158,11,0.1)] border border-[rgba(251,191,36,0.2)] text-[rgba(251,191,36,0.7)]">{expense.category}</span>
                  <span className="font-medium text-[#fef9ec] text-sm">{expense.description || "—"}</span>
                </div>
                <p className="text-xs text-[rgba(251,191,36,0.4)] mt-1">{fmtDate(expense.date)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-tabular font-medium text-[#fef9ec]">{fmtMoney(Number(expense.amount), "Rp")}</span>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => openDuplicate(expense)} className="text-[rgba(254,249,236,0.3)] hover:text-[#fef9ec]" title="Duplicate">
                    <Copy size={13} />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => openEdit(expense)} className="text-[rgba(254,249,236,0.5)] hover:text-[#fef9ec]">
                    <Pencil size={14} />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete?")) del.mutate(expense.id) }} className="text-[rgba(244,63,94,0.5)] hover:text-[#f43f5e]">
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}

      {showForm && (
        <Dialog open onOpenChange={() => { setShowForm(false); setEditItem(null) }}>
          <DialogContent className="bg-[rgba(20,36,28,0.95)] border-[rgba(255,255,255,0.08)] text-[#fef9ec]">
            <DialogHeader>
              <DialogTitle className="text-[#f59e0b]">{editItem ? "Edit" : "Add"} Expense</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[rgba(251,191,36,0.55)] block mb-1">Date</label>
                  <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="bg-[rgba(40,56,44,0.6)] border-[rgba(255,255,255,0.08)] text-[#fef9ec]" />
                </div>
                <div>
                  <label className="text-xs text-[rgba(251,191,36,0.55)] block mb-1">Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 bg-[rgba(40,56,44,0.6)] border border-[rgba(255,255,255,0.08)] rounded-md text-[#fef9ec] text-sm">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="bg-[rgba(40,56,44,0.6)] border-[rgba(255,255,255,0.08)] text-[#fef9ec]" />
              <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} placeholder="Amount" className="bg-[rgba(40,56,44,0.6)] border-[rgba(255,255,255,0.08)] text-[#fef9ec]" />
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => { setShowForm(false); setEditItem(null) }} className="flex-1 border-[rgba(255,255,255,0.08)]">Cancel</Button>
                <Button onClick={() => save.mutate()} disabled={!form.amount || save.isPending} className="flex-1 bg-[#f59e0b] hover:bg-[#d97706] text-black font-bold">Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
