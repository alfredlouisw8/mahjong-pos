"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import type { Table } from "@/types/database"
import { QrCode, Trash2, Pencil } from "lucide-react"

const STATUS_COLORS: Record<string, string> = {
  available: "bg-[rgba(16,185,129,0.2)] text-[#10b981]",
  occupied: "bg-[rgba(245,158,11,0.2)] text-[#f59e0b]",
  reserved: "bg-[rgba(59,130,246,0.2)] text-[#3b82f6]",
  maintenance: "bg-gray-500/20 text-gray-400",
}

export default function AdminTablesPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editTable, setEditTable] = useState<Table | null>(null)
  const [showQR, setShowQR] = useState<Table | null>(null)
  const [form, setForm] = useState({ label: "", notes: "" })
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

  const { data: tables = [] } = useQuery<Table[]>({
    queryKey: ["admin-tables"],
    queryFn: async () => {
      const res = await fetch("/api/tables")
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
  })

  const createTable = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error((await res.json()).error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tables"] })
      toast.success("Table created")
      setShowForm(false)
      setForm({ label: "", notes: "" })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const updateTable = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Table> }) => {
      const res = await fetch(`/api/tables/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error((await res.json()).error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tables"] })
      toast.success("Table updated")
      setEditTable(null)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const deleteTable = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tables/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error((await res.json()).error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tables"] })
      toast.success("Table removed")
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const regenerateQR = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tables/${id}/qr/regenerate`, { method: "POST" })
      if (!res.ok) throw new Error((await res.json()).error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tables"] })
      toast.success("QR regenerated — please reprint")
      setShowQR(null)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const openQR = async (table: Table) => {
    setShowQR(table)
    const res = await fetch(`/api/tables/${table.id}/qr`)
    if (res.ok) {
      const blob = await res.blob()
      setQrDataUrl(URL.createObjectURL(blob))
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Table Management"
        action={
          <Button
            onClick={() => setShowForm(true)}
            className="bg-[#f59e0b] hover:bg-[#d97706] text-black font-bold"
          >
            + Add Table
          </Button>
        }
      />

      <div className="space-y-2">
        {tables.map((table) => (
          <div
            key={table.id}
            className="flex items-center justify-between bg-[rgba(20,36,28,0.85)] border border-[rgba(255,255,255,0.08)] rounded-xl p-4"
          >
            <div className="flex items-center gap-4">
              <span className="font-medium text-[#fef9ec]">{table.label}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[table.status]}`}>
                {table.status}
              </span>
              {!table.is_active && <span className="text-xs text-gray-500">Inactive</span>}
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={() => openQR(table)} className="text-[rgba(251,191,36,0.55)] hover:text-[#f59e0b]">
                <QrCode size={16} />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => { setEditTable(table); setForm({ label: table.label, notes: table.notes ?? "" }) }}
                className="text-[rgba(254,249,236,0.5)] hover:text-[#fef9ec]"
              >
                <Pencil size={16} />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (confirm(`Delete ${table.label}?`)) deleteTable.mutate(table.id)
                }}
                className="text-[rgba(244,63,94,0.5)] hover:text-[#f43f5e]"
                disabled={table.status === "occupied"}
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {(showForm || editTable) && (
        <Dialog open onOpenChange={() => { setShowForm(false); setEditTable(null) }}>
          <DialogContent className="bg-[rgba(20,36,28,0.95)] border-[rgba(255,255,255,0.08)] text-[#fef9ec]">
            <DialogHeader>
              <DialogTitle className="text-[#f59e0b]">{editTable ? "Edit Table" : "Add Table"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[rgba(251,191,36,0.55)]">Label *</label>
                <Input
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder="e.g. Table 14, VIP Room A"
                  className="bg-[rgba(40,56,44,0.6)] border-[rgba(255,255,255,0.08)] text-[#fef9ec]"
                />
              </div>
              <div>
                <label className="text-xs text-[rgba(251,191,36,0.55)]">Notes</label>
                <Input
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="bg-[rgba(40,56,44,0.6)] border-[rgba(255,255,255,0.08)] text-[#fef9ec]"
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => { setShowForm(false); setEditTable(null) }} className="flex-1 border-[rgba(255,255,255,0.08)]">Cancel</Button>
                <Button
                  onClick={() => {
                    if (editTable) {
                      updateTable.mutate({ id: editTable.id, data: form })
                    } else {
                      createTable.mutate()
                    }
                  }}
                  disabled={!form.label || createTable.isPending || updateTable.isPending}
                  className="flex-1 bg-[#f59e0b] hover:bg-[#d97706] text-black font-bold"
                >
                  Save
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {showQR && (
        <Dialog open onOpenChange={() => { setShowQR(null); setQrDataUrl(null) }}>
          <DialogContent className="bg-[rgba(20,36,28,0.95)] border-[rgba(255,255,255,0.08)] text-[#fef9ec]">
            <DialogHeader>
              <DialogTitle className="text-[#f59e0b]">QR Code — {showQR.label}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4">
              {qrDataUrl && (
                <img src={qrDataUrl} alt="QR Code" className="w-48 h-48 bg-white p-2 rounded-xl" />
              )}
              <p className="text-xs text-[rgba(251,191,36,0.55)] text-center">
                Token: <span className="font-mono">{showQR.qr_token.slice(0, 16)}…</span>
              </p>
              <div className="flex gap-3 w-full">
                {qrDataUrl && (
                  <a
                    href={qrDataUrl}
                    download={`qr-${showQR.label}.png`}
                    className="flex-1 py-2 text-center rounded-lg bg-[rgba(40,56,44,0.6)] border border-[rgba(255,255,255,0.08)] text-sm text-[#fef9ec]"
                  >
                    Download PNG
                  </a>
                )}
                <Button
                  onClick={() => {
                    if (confirm("This will invalidate the existing QR sticker. Continue?")) {
                      regenerateQR.mutate(showQR.id)
                    }
                  }}
                  className="flex-1 bg-orange-500/20 border border-orange-500/30 text-orange-400 hover:bg-orange-500/30"
                >
                  Regenerate
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
