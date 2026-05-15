"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Trash2, Minus, Plus } from "lucide-react"
import { useOrders } from "@/hooks/useOrders"
import { fmtMoney } from "@/lib/formatters"
import type { Order, MenuItem } from "@/types/database"

interface OrderPanelProps {
  sessionId: string
  currencySymbol: string
}

export function OrderPanel({ sessionId, currencySymbol }: OrderPanelProps) {
  const queryClient = useQueryClient()
  const { data: orders = [] } = useOrders(sessionId)

  const updateOrder = useMutation({
    mutationFn: async ({ id, qty }: { id: string; qty: number }) => {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: qty }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders", sessionId] }),
    onError: (e: Error) => toast.error(e.message),
  })

  const removeOrder = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/orders/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error((await res.json()).error)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders", sessionId] }),
    onError: (e: Error) => toast.error(e.message),
  })

  const confirmOrder = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "confirmed" }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders", sessionId] }),
    onError: (e: Error) => toast.error(e.message),
  })

  const activeOrders = orders.filter((o) => o.status !== "cancelled")
  const total = activeOrders
    .filter((o) => o.status === "confirmed")
    .reduce((sum, o) => sum + o.unit_price * o.quantity, 0)

  if (!activeOrders.length) {
    return (
      <div className="text-center py-8 text-[rgba(251,191,36,0.55)] text-sm">
        No orders yet
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {activeOrders.map((order) => {
        const menuItem = order.menu_items as Pick<MenuItem, "id" | "name" | "category"> | undefined
        const isPending = order.status === "pending"
        return (
          <div
            key={order.id}
            className={`flex items-center gap-2 p-2 rounded-lg ${isPending ? "bg-orange-500/10 border border-orange-500/20" : "bg-[rgba(40,56,44,0.4)]"}`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                {order.source === "customer_qr" && <span className="text-xs">📱</span>}
                <span className="text-sm text-[#fef9ec] truncate">{menuItem?.name}</span>
              </div>
              <span className="text-xs font-tabular text-[rgba(251,191,36,0.55)]">
                {fmtMoney(order.unit_price * order.quantity, currencySymbol)}
              </span>
            </div>

            {isPending ? (
              <div className="flex gap-1">
                <button
                  onClick={() => confirmOrder.mutate(order.id)}
                  className="text-xs px-2 py-1 rounded bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30"
                >Confirm</button>
                <button
                  onClick={() => removeOrder.mutate(order.id)}
                  className="text-xs px-2 py-1 rounded bg-[#f43f5e]/20 text-[#f43f5e] border border-[#f43f5e]/30"
                >✕</button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => updateOrder.mutate({ id: order.id, qty: order.quantity - 1 })}
                  disabled={order.quantity <= 1}
                  className="w-6 h-6 rounded flex items-center justify-center bg-[rgba(40,56,44,0.6)] text-[rgba(254,249,236,0.7)] hover:text-[#fef9ec] disabled:opacity-30"
                >
                  <Minus size={10} />
                </button>
                <span className="text-sm w-5 text-center">{order.quantity}</span>
                <button
                  onClick={() => updateOrder.mutate({ id: order.id, qty: order.quantity + 1 })}
                  className="w-6 h-6 rounded flex items-center justify-center bg-[rgba(40,56,44,0.6)] text-[rgba(254,249,236,0.7)] hover:text-[#fef9ec]"
                >
                  <Plus size={10} />
                </button>
                <button
                  onClick={() => removeOrder.mutate(order.id)}
                  className="w-6 h-6 rounded flex items-center justify-center text-[rgba(244,63,94,0.6)] hover:text-[#f43f5e] ml-1"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            )}
          </div>
        )
      })}

      <div className="pt-2 border-t border-[rgba(255,255,255,0.08)] flex justify-between text-sm font-medium">
        <span className="text-[rgba(251,191,36,0.55)]">F&B Total</span>
        <span className="font-tabular text-[#fef9ec]">{fmtMoney(total, currencySymbol)}</span>
      </div>
    </div>
  )
}
