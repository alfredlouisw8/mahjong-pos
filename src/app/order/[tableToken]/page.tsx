"use client"

import { useState, use } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { fmtMoney } from "@/lib/formatters"
import { Plus, Minus, ShoppingCart, X, CheckCircle } from "lucide-react"
import type { MenuItem } from "@/types/database"

interface CartItem {
  item: MenuItem
  quantity: number
  note: string
}

export default function CustomerOrderPage({ params }: { params: Promise<{ tableToken: string }> }) {
  const { tableToken } = use(params)
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [showCart, setShowCart] = useState(false)
  const [noteTarget, setNoteTarget] = useState<string | null>(null)
  const [ordered, setOrdered] = useState(false)

  const { data: menuItems = [], isLoading } = useQuery<MenuItem[]>({
    queryKey: ["menu-public"],
    queryFn: async () => {
      const res = await fetch("/api/menu")
      if (!res.ok) throw new Error("Failed to load menu")
      return res.json()
    },
  })

  const categories = ["All", ...Array.from(new Set(menuItems.map((i) => i.category)))]
  const filtered = selectedCategory === "All" ? menuItems : menuItems.filter((i) => i.category === selectedCategory)

  function addToCart(item: MenuItem) {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id)
      if (existing) return prev.map((c) => c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c)
      return [...prev, { item, quantity: 1, note: "" }]
    })
  }

  function removeFromCart(itemId: string) {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === itemId)
      if (!existing) return prev
      if (existing.quantity <= 1) return prev.filter((c) => c.item.id !== itemId)
      return prev.map((c) => c.item.id === itemId ? { ...c, quantity: c.quantity - 1 } : c)
    })
  }

  function setNote(itemId: string, note: string) {
    setCart((prev) => prev.map((c) => c.item.id === itemId ? { ...c, note } : c))
  }

  function getQty(itemId: string) {
    return cart.find((c) => c.item.id === itemId)?.quantity ?? 0
  }

  const total = cart.reduce((s, c) => s + Number(c.item.price) * c.quantity, 0)
  const itemCount = cart.reduce((s, c) => s + c.quantity, 0)

  const placeOrder = useMutation({
    mutationFn: async () => {
      const items = cart.map((c) => ({ menuItemId: c.item.id, quantity: c.quantity, note: c.note || undefined }))
      const res = await fetch("/api/orders/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableToken, items }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? "Order failed")
    },
    onSuccess: () => {
      setCart([])
      setShowCart(false)
      setOrdered(true)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  if (ordered) {
    return (
      <div className="min-h-screen bg-[#0a120e] flex flex-col items-center justify-center p-6 text-center">
        <CheckCircle size={64} className="text-[#10b981] mb-4" />
        <h1 className="text-2xl font-bold text-[#fef9ec] mb-2">Order Placed!</h1>
        <p className="text-[rgba(254,249,236,0.6)] mb-6">Your order has been sent to the kitchen. Staff will confirm it shortly.</p>
        <button
          onClick={() => setOrdered(false)}
          className="px-6 py-3 rounded-xl bg-[rgba(245,158,11,0.15)] border border-[rgba(251,191,36,0.25)] text-[#f59e0b] font-medium"
        >
          Order More
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a120e] pb-24">
      <div className="sticky top-0 z-10 bg-[#0a120e]/90 backdrop-blur-sm border-b border-[rgba(255,255,255,0.06)] px-4 py-3">
        <h1 className="text-lg font-bold text-[#f59e0b]">Order Menu</h1>
        <p className="text-xs text-[rgba(254,249,236,0.5)]">Add items to your order</p>
      </div>

      <div className="px-4 pt-3">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
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
      </div>

      {isLoading && (
        <div className="text-center py-12 text-[rgba(251,191,36,0.55)] text-sm">Loading menu…</div>
      )}

      <div className="px-4 pt-3 space-y-2">
        {filtered.map((item) => {
          const qty = getQty(item.id)
          return (
            <div key={item.id} className="bg-[rgba(20,36,28,0.85)] border border-[rgba(255,255,255,0.08)] rounded-xl p-4 flex items-center gap-3">
              <div className="flex-1">
                <p className="font-medium text-[#fef9ec] text-sm">{item.name}</p>
                <p className="text-xs text-[rgba(251,191,36,0.55)] mt-0.5">{item.category}</p>
                <p className="text-sm font-medium text-[#f59e0b] mt-1">{fmtMoney(item.price, "Rp")}</p>
              </div>
              <div className="flex items-center gap-2">
                {qty > 0 ? (
                  <>
                    <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 rounded-full bg-[rgba(244,63,94,0.15)] border border-[rgba(244,63,94,0.3)] text-[#f43f5e] flex items-center justify-center">
                      <Minus size={14} />
                    </button>
                    <span className="text-[#fef9ec] font-bold w-5 text-center">{qty}</span>
                  </>
                ) : null}
                <button onClick={() => addToCart(item)} className="w-8 h-8 rounded-full bg-[rgba(16,185,129,0.15)] border border-[rgba(16,185,129,0.3)] text-[#10b981] flex items-center justify-center">
                  <Plus size={14} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {itemCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-20">
          <button
            onClick={() => setShowCart(true)}
            className="w-full py-4 rounded-2xl bg-[#f59e0b] text-black font-bold flex items-center justify-between px-5"
          >
            <span className="bg-black/20 rounded-full w-6 h-6 flex items-center justify-center text-xs">{itemCount}</span>
            <span>View Order</span>
            <span>{fmtMoney(total, "Rp")}</span>
          </button>
        </div>
      )}

      {showCart && (
        <div className="fixed inset-0 z-30 flex flex-col bg-[#0a120e]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(255,255,255,0.06)]">
            <h2 className="text-lg font-bold text-[#fef9ec]">Your Order</h2>
            <button onClick={() => setShowCart(false)} className="text-[rgba(254,249,236,0.5)]">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.map((c) => (
              <div key={c.item.id} className="bg-[rgba(20,36,28,0.85)] border border-[rgba(255,255,255,0.08)] rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-[#fef9ec] text-sm">{c.item.name}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => removeFromCart(c.item.id)} className="w-7 h-7 rounded-full bg-[rgba(244,63,94,0.15)] border border-[rgba(244,63,94,0.3)] text-[#f43f5e] flex items-center justify-center">
                      <Minus size={12} />
                    </button>
                    <span className="text-[#fef9ec] font-bold w-5 text-center text-sm">{c.quantity}</span>
                    <button onClick={() => addToCart(c.item)} className="w-7 h-7 rounded-full bg-[rgba(16,185,129,0.15)] border border-[rgba(16,185,129,0.3)] text-[#10b981] flex items-center justify-center">
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[rgba(251,191,36,0.55)]">{fmtMoney(Number(c.item.price) * c.quantity, "Rp")}</span>
                  {noteTarget === c.item.id ? (
                    <input
                      autoFocus
                      value={c.note}
                      onChange={(e) => setNote(c.item.id, e.target.value)}
                      onBlur={() => setNoteTarget(null)}
                      placeholder="Add note…"
                      className="text-xs bg-transparent border-b border-[rgba(251,191,36,0.3)] text-[rgba(254,249,236,0.7)] outline-none w-32"
                    />
                  ) : (
                    <button onClick={() => setNoteTarget(c.item.id)} className="text-xs text-[rgba(251,191,36,0.4)] hover:text-[rgba(251,191,36,0.7)]">
                      {c.note || "+ Note"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-[rgba(255,255,255,0.06)] space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-[rgba(254,249,236,0.7)]">Total ({itemCount} items)</span>
              <span className="font-bold text-[#fef9ec]">{fmtMoney(total, "Rp")}</span>
            </div>
            <button
              onClick={() => placeOrder.mutate()}
              disabled={placeOrder.isPending}
              className="w-full py-4 rounded-2xl bg-[#f59e0b] text-black font-bold disabled:opacity-50"
            >
              {placeOrder.isPending ? "Placing Order…" : "Place Order"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
