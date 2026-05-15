"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useMenu } from "@/hooks/useMenu"
import { fmtMoney } from "@/lib/formatters"
import { Plus } from "lucide-react"

interface MenuGridProps {
  sessionId: string
  currencySymbol: string
}

export function MenuGrid({ sessionId, currencySymbol }: MenuGridProps) {
  const { data: items = [] } = useMenu()
  const queryClient = useQueryClient()
  const [selectedCategory, setSelectedCategory] = useState<string>("All")

  const categories = ["All", ...Array.from(new Set(items.map((i) => i.category)))]
  const filtered = selectedCategory === "All" ? items : items.filter((i) => i.category === selectedCategory)

  const addOrder = useMutation({
    mutationFn: async (menuItemId: string) => {
      const res = await fetch(`/api/sessions/${sessionId}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuItemId, quantity: 1 }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders", sessionId] }),
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? "bg-[rgba(245,158,11,0.2)] text-[#f59e0b] border border-[rgba(251,191,36,0.3)]"
                : "bg-[rgba(40,56,44,0.6)] text-[rgba(254,249,236,0.7)] border border-[rgba(255,255,255,0.08)]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {filtered.map((item) => (
          <button
            key={item.id}
            onClick={() => addOrder.mutate(item.id)}
            disabled={addOrder.isPending}
            className="bg-[rgba(20,36,28,0.85)] border border-[rgba(255,255,255,0.08)] rounded-xl p-3 text-left hover:border-[rgba(251,191,36,0.25)] hover:bg-[rgba(40,56,44,0.6)] transition-all group"
          >
            <div className="text-sm font-medium text-[#fef9ec] mb-1 leading-tight">{item.name}</div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[rgba(251,191,36,0.55)] font-tabular">{fmtMoney(item.price, currencySymbol)}</span>
              <Plus size={14} className="text-[rgba(254,249,236,0.4)] group-hover:text-[#f59e0b] transition-colors" />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
