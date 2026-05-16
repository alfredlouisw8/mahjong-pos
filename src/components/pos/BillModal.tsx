"use client"

import { useRef } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useReactToPrint } from "react-to-print"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useOrders } from "@/hooks/useOrders"
import { fmtMoney, fmtDate, fmtTime } from "@/lib/formatters"
import { computeBlockHourState } from "@/lib/billing/blockHour"
import { computePerMinuteState } from "@/lib/billing/perMinute"
import { ReceiptTemplate } from "@/components/receipt/ReceiptTemplate"
import type { Session } from "@/types/database"

interface BillModalProps {
  session: Session
  tableLabel: string
  currencySymbol: string
  onClose: () => void
}

export function BillModal({ session, tableLabel, currencySymbol, onClose }: BillModalProps) {
  const queryClient = useQueryClient()
  const receiptRef = useRef<HTMLDivElement>(null)
  const { data: orders = [] } = useOrders(session.id)

  const confirmedOrders = orders.filter((o) => o.status === "confirmed")
  const pendingOrders = orders.filter((o) => o.status === "pending")
  const fbRevenue = confirmedOrders.reduce((sum, o) => sum + o.unit_price * o.quantity, 0)

  const isBlockHour = session.billing_mode === "block_hour"
  const tableCharge = isBlockHour
    ? session.table_charge ?? 0
    : computePerMinuteState(session.start_time, session.hourly_rate).tableCharge
  const grandTotal = tableCharge + fbRevenue

  const closeSession = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/sessions/${session.id}/close`, { method: "POST" })
      if (!res.ok) throw new Error((await res.json()).error)
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] })
      toast.success("Session closed successfully")
      onClose()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const confirmOrder = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "confirmed" }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders", session.id] }),
    onError: (e: Error) => toast.error(e.message),
  })

  const cancelOrder = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders", session.id] }),
    onError: (e: Error) => toast.error(e.message),
  })

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    pageStyle: `@page { size: 80mm auto; margin: 0; } body { margin: 0; }`,
  })

  return (
    <>
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="bg-[rgba(20,36,28,0.95)] border-[rgba(255,255,255,0.08)] text-[#fef9ec] max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#f59e0b]">Bill — {tableLabel}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            <div className="flex justify-between text-[rgba(251,191,36,0.55)]">
              <span>Started</span>
              <span>{fmtDate(session.start_time)}</span>
            </div>

            <Separator className="bg-[rgba(255,255,255,0.08)]" />

            <div>
              <p className="text-xs text-[rgba(251,191,36,0.55)] mb-2 uppercase tracking-wide">Table Time</p>
              {isBlockHour ? (
                <div className="flex justify-between">
                  <span>{session.blocks_purchased} block{(session.blocks_purchased ?? 1) > 1 ? "s" : ""} × {fmtMoney(session.hourly_rate, currencySymbol)}</span>
                  <span className="font-tabular font-medium">{fmtMoney(tableCharge, currencySymbol)}</span>
                </div>
              ) : (
                <div className="flex justify-between">
                  <span>{computePerMinuteState(session.start_time, session.hourly_rate).minutesElapsed} min @ {fmtMoney(session.hourly_rate, currencySymbol)}/hr</span>
                  <span className="font-tabular font-medium">{fmtMoney(tableCharge, currencySymbol)}</span>
                </div>
              )}
            </div>

            {pendingOrders.length > 0 && (
              <div>
                <p className="text-xs text-orange-400 mb-2 uppercase tracking-wide">Pending QR Orders — Confirm or Cancel</p>
                <div className="space-y-2">
                  {pendingOrders.map((o) => (
                    <div key={o.id} className="flex items-center gap-2 bg-orange-500/10 rounded-lg p-2">
                      <span className="text-xs">📱</span>
                      <span className="flex-1">{o.menu_items?.name} × {o.quantity}</span>
                      <Button size="sm" className="h-6 text-xs bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30 hover:bg-[#10b981]/30" onClick={() => confirmOrder.mutate(o.id)}>Confirm</Button>
                      <Button size="sm" className="h-6 text-xs bg-[#f43f5e]/20 text-[#f43f5e] border border-[#f43f5e]/30 hover:bg-[#f43f5e]/30" onClick={() => cancelOrder.mutate(o.id)}>Cancel</Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {confirmedOrders.length > 0 && (
              <div>
                <p className="text-xs text-[rgba(251,191,36,0.55)] mb-2 uppercase tracking-wide">F&B Orders</p>
                <div className="space-y-1">
                  {confirmedOrders.map((o) => (
                    <div key={o.id} className="flex justify-between">
                      <span className="flex items-center gap-1">
                        {o.source === "customer_qr" && <span className="text-xs">📱</span>}
                        {o.menu_items?.name} × {o.quantity}
                      </span>
                      <span className="font-tabular">{fmtMoney(o.unit_price * o.quantity, currencySymbol)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-[rgba(251,191,36,0.55)]">
                  <span>F&B Subtotal</span>
                  <span className="font-tabular">{fmtMoney(fbRevenue, currencySymbol)}</span>
                </div>
              </div>
            )}

            <Separator className="bg-[rgba(255,255,255,0.08)]" />

            <div className="flex justify-between text-lg font-bold">
              <span>Grand Total</span>
              <span className="font-tabular text-[#f59e0b]">{fmtMoney(grandTotal, currencySymbol)}</span>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => handlePrint()}
                className="flex-1 border-[rgba(255,255,255,0.08)]"
              >
                🖨 Print Receipt
              </Button>
              <Button
                onClick={() => closeSession.mutate()}
                disabled={closeSession.isPending}
                className="flex-1 bg-[#f59e0b] hover:bg-[#d97706] text-black font-bold"
              >
                Settle & Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="hidden">
        <ReceiptTemplate
          ref={receiptRef}
          session={session}
          orders={confirmedOrders}
          tableLabel={tableLabel}
          tableCharge={tableCharge}
          currencySymbol={currencySymbol}
        />
      </div>
    </>
  )
}
