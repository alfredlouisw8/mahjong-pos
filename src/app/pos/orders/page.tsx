"use client"

import { useState } from "react"
import { useTables } from "@/hooks/useTables"
import { useConfig } from "@/hooks/useConfig"
import { OrderPanel } from "@/components/pos/OrderPanel"
import { MenuGrid } from "@/components/pos/MenuGrid"
import { BillModal } from "@/components/pos/BillModal"
import { PageHeader } from "@/components/layout/PageHeader"

export default function OrdersPage() {
  const { data: tables } = useTables()
  const { data: config } = useConfig()
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
  const [showBill, setShowBill] = useState(false)

  const occupiedTables = (tables ?? []).filter((t) => t.status === "occupied" && t.current_session_id)
  const selectedTable = occupiedTables.find((t) => t.id === selectedTableId) ?? occupiedTables[0]
  const session = selectedTable?.sessions as any

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <PageHeader title="F&B Orders" />

      {occupiedTables.length === 0 ? (
        <div className="text-center py-16 text-[rgba(251,191,36,0.55)]">
          No active tables — start a session from the Floor view
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="lg:w-72 space-y-2">
            <p className="text-xs text-[rgba(251,191,36,0.55)] uppercase tracking-wide mb-3">Occupied Tables</p>
            {occupiedTables.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTableId(t.id)}
                className={`w-full py-3 px-4 rounded-xl text-left text-sm font-medium transition-colors ${
                  (selectedTable?.id === t.id)
                    ? "bg-[rgba(245,158,11,0.15)] border border-[rgba(251,191,36,0.25)] text-[#f59e0b]"
                    : "bg-[rgba(20,36,28,0.85)] border border-[rgba(255,255,255,0.08)] text-[#fef9ec] hover:border-[rgba(251,191,36,0.25)]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {selectedTable && session && (
            <div className="flex-1 space-y-4">
              <div className="bg-[rgba(20,36,28,0.85)] border border-[rgba(255,255,255,0.08)] rounded-2xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-[#fef9ec]">{selectedTable.label}</h2>
                  <button
                    onClick={() => setShowBill(true)}
                    className="px-3 py-1.5 rounded-lg bg-[rgba(245,158,11,0.15)] border border-[rgba(251,191,36,0.25)] text-[#f59e0b] text-xs"
                  >
                    View Bill
                  </button>
                </div>
                <OrderPanel
                  sessionId={session.id}
                  currencySymbol={config?.currency_symbol ?? "Rp"}
                />
              </div>

              <div className="bg-[rgba(20,36,28,0.85)] border border-[rgba(255,255,255,0.08)] rounded-2xl p-4">
                <h3 className="text-sm text-[rgba(251,191,36,0.55)] uppercase tracking-wide mb-4">Add Items</h3>
                <MenuGrid
                  sessionId={session.id}
                  currencySymbol={config?.currency_symbol ?? "Rp"}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {showBill && selectedTable && session && (
        <BillModal
          session={session}
          tableLabel={selectedTable.label}
          currencySymbol={config?.currency_symbol ?? "Rp"}
          onClose={() => setShowBill(false)}
        />
      )}
    </div>
  )
}
