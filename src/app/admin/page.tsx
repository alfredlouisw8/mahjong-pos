"use client"

import { useQuery } from "@tanstack/react-query"
import { PageHeader } from "@/components/layout/PageHeader"
import { fmtMoney, fmtPercent } from "@/lib/formatters"
import type { ReportSummary } from "@/types/api"
import { useTables } from "@/hooks/useTables"
import { useInventory } from "@/hooks/useInventory"

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-[rgba(20,36,28,0.85)] border border-[rgba(255,255,255,0.08)] rounded-2xl p-5">
      <p className="text-xs text-[rgba(251,191,36,0.55)] uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-[#fef9ec] mt-1 font-tabular">{value}</p>
      {sub && <p className="text-xs text-[rgba(251,191,36,0.55)] mt-1">{sub}</p>}
    </div>
  )
}

export default function AdminDashboard() {
  const today = new Date().toISOString().split("T")[0]

  const { data: summary } = useQuery<ReportSummary>({
    queryKey: ["summary-today"],
    queryFn: async () => {
      const res = await fetch(`/api/reports/summary?from=${today}&to=${today}`)
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
    refetchInterval: 60_000,
  })

  const { data: tables = [] } = useTables()
  const { data: inventory = [] } = useInventory()

  const occupied = tables.filter((t) => t.status === "occupied").length
  const lowStock = inventory.filter((i) => i.current_stock <= i.low_stock_threshold).length

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader title="Dashboard" subtitle={`Today · ${today}`} />

      {lowStock > 0 && (
        <div className="px-4 py-3 bg-orange-500/10 border border-orange-500/30 rounded-xl text-sm text-orange-400">
          ⚠ {lowStock} item{lowStock > 1 ? "s" : ""} low on stock —{" "}
          <a href="/admin/inventory" className="underline hover:text-orange-300">View inventory</a>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Tables Occupied" value={`${occupied} / ${tables.length}`} />
        <StatCard label="Today Revenue" value={fmtMoney(summary?.totalRevenue ?? 0, "Rp")} />
        <StatCard label="Net Profit" value={fmtMoney(summary?.netProfit ?? 0, "Rp")} />
        <StatCard label="Net Margin" value={fmtPercent(summary?.netMargin ?? 0)} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Table Income" value={fmtMoney(summary?.tableIncome ?? 0, "Rp")} />
        <StatCard label="F&B Income" value={fmtMoney(summary?.fbIncome ?? 0, "Rp")} />
        <StatCard label="Sessions" value={String(summary?.sessionCount ?? 0)} />
        <StatCard label="Table Hours" value={`${summary?.tableHours ?? 0}h`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[rgba(20,36,28,0.85)] border border-[rgba(255,255,255,0.08)] rounded-2xl p-5">
          <h3 className="text-sm font-medium text-[rgba(251,191,36,0.55)] uppercase tracking-wide mb-3">Live Floor</h3>
          <div className="grid grid-cols-3 gap-2">
            {tables.map((t) => (
              <div
                key={t.id}
                className={`rounded-lg p-2 text-center text-xs font-medium ${
                  t.status === "occupied" ? "bg-[rgba(245,158,11,0.15)] text-[#f59e0b]"
                  : t.status === "reserved" ? "bg-[rgba(59,130,246,0.15)] text-[#3b82f6]"
                  : "bg-[rgba(40,56,44,0.4)] text-[rgba(254,249,236,0.5)]"
                }`}
              >
                {t.label}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[rgba(20,36,28,0.85)] border border-[rgba(255,255,255,0.08)] rounded-2xl p-5">
          <h3 className="text-sm font-medium text-[rgba(251,191,36,0.55)] uppercase tracking-wide mb-3">Quick P&L</h3>
          <div className="space-y-2 text-sm">
            {[
              ["Table Income", summary?.tableIncome ?? 0],
              ["F&B Income", summary?.fbIncome ?? 0],
              ["F&B COGS", -(summary?.fbCogs ?? 0)],
              ["Gross Profit", summary?.grossProfit ?? 0],
              ["Expenses", -(summary?.operatingExpenses ?? 0)],
              ["Net Profit", summary?.netProfit ?? 0],
            ].map(([label, val]) => (
              <div key={String(label)} className="flex justify-between">
                <span className="text-[rgba(254,249,236,0.7)]">{label}</span>
                <span className={`font-tabular font-medium ${(val as number) < 0 ? "text-[#f43f5e]" : "text-[#fef9ec]"}`}>
                  {fmtMoney(Math.abs(val as number), "Rp")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
