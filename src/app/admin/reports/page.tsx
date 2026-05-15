"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { fmtMoney, fmtDate, fmtDuration, fmtPercent } from "@/lib/formatters"
import { Download } from "lucide-react"
import type { ReportSummary } from "@/types/api"

interface SessionRow {
  id: string
  table_label: string
  billing_mode: string
  start_time: string
  end_time: string | null
  duration_minutes: number
  table_charge: number
  food_total: number
  total: number
  status: string
  cashier_name: string
}

interface TopItem {
  name: string
  category: string
  qty: number
  revenue: number
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-[rgba(20,36,28,0.85)] border border-[rgba(255,255,255,0.08)] rounded-xl p-4">
      <p className="text-xs text-[rgba(251,191,36,0.55)] mb-1">{label}</p>
      <p className="text-xl font-bold text-[#fef9ec]">{value}</p>
      {sub && <p className="text-xs text-[rgba(254,249,236,0.4)] mt-1">{sub}</p>}
    </div>
  )
}

export default function ReportsPage() {
  const [from, setFrom] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10)
  })
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10))
  const [sessionPage, setSessionPage] = useState(1)
  const PAGE = 20

  const { data: summary } = useQuery<ReportSummary>({
    queryKey: ["reports-summary", from, to],
    queryFn: async () => {
      const res = await fetch(`/api/reports/summary?from=${from}&to=${to}`)
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
  })

  const { data: sessionsData } = useQuery<{ sessions: SessionRow[]; total: number }>({
    queryKey: ["reports-sessions", from, to, sessionPage],
    queryFn: async () => {
      const res = await fetch(`/api/reports/sessions?from=${from}&to=${to}&page=${sessionPage}&limit=${PAGE}`)
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
  })

  const { data: topItems } = useQuery<TopItem[]>({
    queryKey: ["reports-items", from, to],
    queryFn: async () => {
      const res = await fetch(`/api/reports/items?from=${from}&to=${to}&limit=10`)
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
  })

  function exportCSV(type: "sessions" | "pnl") {
    window.open(`/api/export/${type}?from=${from}&to=${to}`, "_blank")
  }

  const sessions = sessionsData?.sessions ?? []
  const totalSessions = sessionsData?.total ?? 0
  const totalPages = Math.ceil(totalSessions / PAGE)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Reports"
        action={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => exportCSV("sessions")} className="border-[rgba(255,255,255,0.08)] text-[rgba(254,249,236,0.7)] hover:text-[#fef9ec] text-xs">
              <Download size={13} className="mr-1" /> Sessions CSV
            </Button>
            <Button size="sm" variant="outline" onClick={() => exportCSV("pnl")} className="border-[rgba(255,255,255,0.08)] text-[rgba(254,249,236,0.7)] hover:text-[#fef9ec] text-xs">
              <Download size={13} className="mr-1" /> P&L CSV
            </Button>
          </div>
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
      </div>

      {summary && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <StatCard label="Revenue" value={fmtMoney(summary.totalRevenue, "Rp")} />
            <StatCard label="Table Revenue" value={fmtMoney(summary.tableIncome, "Rp")} sub={fmtPercent(summary.tableIncome / (summary.totalRevenue || 1))} />
            <StatCard label="F&B Revenue" value={fmtMoney(summary.fbIncome, "Rp")} sub={fmtPercent(summary.fbIncome / (summary.totalRevenue || 1))} />
            <StatCard label="Expenses" value={fmtMoney(summary.operatingExpenses, "Rp")} />
            <StatCard label="Net Profit" value={fmtMoney(summary.netProfit, "Rp")} sub={fmtPercent(summary.netMargin)} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard label="Sessions" value={String(summary.sessionCount)} />
            <StatCard label="Avg Session" value={fmtMoney(summary.avgRevenuePerSession, "Rp")} />
            <StatCard label="Table Hours" value={`${Math.round(summary.tableHours)}h`} />
          </div>

          <div className="bg-[rgba(20,36,28,0.85)] border border-[rgba(255,255,255,0.08)] rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-[#f59e0b]">P&L Statement</h3>
            {[
              { label: "Table Revenue", value: summary.tableIncome },
              { label: "F&B Revenue", value: summary.fbIncome },
              { label: "Gross Profit", value: summary.grossProfit, bold: true },
              { label: "Operating Expenses", value: -summary.operatingExpenses },
              { label: "Net Profit", value: summary.netProfit, bold: true, accent: true },
            ].map((row) => (
              <div key={row.label} className={`flex justify-between text-sm ${row.bold ? "font-bold border-t border-[rgba(255,255,255,0.08)] pt-2" : ""}`}>
                <span className="text-[rgba(254,249,236,0.7)]">{row.label}</span>
                <span className={row.accent ? (row.value >= 0 ? "text-[#10b981]" : "text-[#f43f5e]") : "text-[#fef9ec]"}>
                  {fmtMoney(Math.abs(row.value), "Rp")}{row.value < 0 ? " (loss)" : ""}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {topItems && topItems.length > 0 && (
        <div className="bg-[rgba(20,36,28,0.85)] border border-[rgba(255,255,255,0.08)] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#f59e0b] mb-3">Top Menu Items</h3>
          <div className="space-y-2">
            {topItems.map((item, i) => (
              <div key={item.name} className="flex items-center gap-3">
                <span className="text-xs text-[rgba(251,191,36,0.4)] w-5 text-right">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <span className="text-sm text-[#fef9ec]">{item.name}</span>
                    <span className="text-sm text-[#fef9ec] font-tabular">{fmtMoney(item.revenue, "Rp")}</span>
                  </div>
                  <div className="flex justify-between text-xs text-[rgba(251,191,36,0.4)] mt-0.5">
                    <span>{item.category}</span>
                    <span>{item.qty} sold</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-[rgba(20,36,28,0.85)] border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[rgba(255,255,255,0.08)]">
          <h3 className="text-sm font-semibold text-[#f59e0b]">Session Log</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.06)]">
                {["Table", "Mode", "Start", "Duration", "Table Rev", "F&B", "Total", "Status"].map((h) => (
                  <th key={h} className="px-4 py-2 text-left text-xs text-[rgba(251,191,36,0.55)] font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)]">
                  <td className="px-4 py-2 text-[#fef9ec]">{s.table_label}</td>
                  <td className="px-4 py-2 text-[rgba(254,249,236,0.5)] text-xs">{s.billing_mode}</td>
                  <td className="px-4 py-2 text-[rgba(254,249,236,0.5)] text-xs">{fmtDate(s.start_time)}</td>
                  <td className="px-4 py-2 text-[rgba(254,249,236,0.5)] text-xs">{s.duration_minutes ? `${Math.round(s.duration_minutes)}m` : "—"}</td>
                  <td className="px-4 py-2 font-tabular text-[#fef9ec]">{fmtMoney(s.table_charge, "Rp")}</td>
                  <td className="px-4 py-2 font-tabular text-[#fef9ec]">{fmtMoney(s.food_total, "Rp")}</td>
                  <td className="px-4 py-2 font-tabular font-medium text-[#f59e0b]">{fmtMoney(s.total, "Rp")}</td>
                  <td className="px-4 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${s.status === "closed" ? "bg-[rgba(16,185,129,0.15)] text-[#10b981]" : s.status === "void" ? "bg-[rgba(244,63,94,0.15)] text-[#f43f5e]" : "bg-[rgba(245,158,11,0.15)] text-[#f59e0b]"}`}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="p-4 flex items-center justify-between border-t border-[rgba(255,255,255,0.08)]">
            <span className="text-xs text-[rgba(251,191,36,0.55)]">{totalSessions} sessions</span>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" disabled={sessionPage <= 1} onClick={() => setSessionPage((p) => p - 1)} className="text-xs text-[rgba(254,249,236,0.5)]">← Prev</Button>
              <span className="text-xs text-[rgba(254,249,236,0.5)] self-center">{sessionPage} / {totalPages}</span>
              <Button size="sm" variant="ghost" disabled={sessionPage >= totalPages} onClick={() => setSessionPage((p) => p + 1)} className="text-xs text-[rgba(254,249,236,0.5)]">Next →</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
