"use client"

import { useState, useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useConfig } from "@/hooks/useConfig"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[rgba(20,36,28,0.85)] border border-[rgba(255,255,255,0.08)] rounded-xl p-5 space-y-4">
      <h3 className="text-sm font-semibold text-[#f59e0b]">{title}</h3>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-4 items-center">
      <label className="text-sm text-[rgba(254,249,236,0.7)] col-span-1">{label}</label>
      <div className="col-span-2">{children}</div>
    </div>
  )
}

const INPUT_CLASS = "bg-[rgba(40,56,44,0.6)] border-[rgba(255,255,255,0.08)] text-[#fef9ec] focus:border-[rgba(251,191,36,0.25)]"

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const { data: config } = useConfig()
  const [form, setForm] = useState<Record<string, string>>({})
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (config && !dirty) {
      setForm({
        place_name: config.place_name,
        currency: config.currency,
        currency_symbol: config.currency_symbol,
        timezone: config.timezone,
        hourly_rate: String(config.hourly_rate),
        billing_mode: config.billing_mode,
        qr_base_url: config.qr_base_url,
        receipt_header_1: config.receipt_header_1,
        receipt_header_2: config.receipt_header_2,
        receipt_header_3: config.receipt_header_3,
        receipt_footer: config.receipt_footer,
        receipt_paper_width: config.receipt_paper_width,
        receipt_show_cogs: config.receipt_show_cogs ? "true" : "false",
        low_stock_threshold: String(config.low_stock_threshold),
      })
    }
  }, [config, dirty])

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
    setDirty(true)
  }

  const save = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error((await res.json()).error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config"] })
      toast.success("Settings saved")
      setDirty(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  if (!config) return <div className="p-8 text-center text-[rgba(251,191,36,0.55)] text-sm">Loading…</div>

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader title="Settings" />

      <Section title="General">
        <Field label="Venue Name">
          <Input value={form.place_name ?? ""} onChange={(e) => set("place_name", e.target.value)} className={INPUT_CLASS} />
        </Field>
        <Field label="Timezone">
          <Input value={form.timezone ?? ""} onChange={(e) => set("timezone", e.target.value)} placeholder="Asia/Manila" className={INPUT_CLASS} />
        </Field>
        <Field label="Currency Code">
          <Input value={form.currency ?? ""} onChange={(e) => set("currency", e.target.value)} placeholder="IDR" className={INPUT_CLASS} />
        </Field>
        <Field label="Currency Symbol">
          <Input value={form.currency_symbol ?? ""} onChange={(e) => set("currency_symbol", e.target.value)} placeholder="Rp" className={INPUT_CLASS} />
        </Field>
      </Section>

      <Section title="Billing">
        <Field label="Billing Mode">
          <select
            value={form.billing_mode ?? "block_hour"}
            onChange={(e) => set("billing_mode", e.target.value)}
            className="w-full px-3 py-2 bg-[rgba(40,56,44,0.6)] border border-[rgba(255,255,255,0.08)] rounded-md text-[#fef9ec] text-sm focus:outline-none focus:border-[rgba(251,191,36,0.25)]"
          >
            <option value="block_hour">Block Hour</option>
            <option value="per_minute">Per Minute</option>
          </select>
        </Field>
        <Field label="Hourly Rate">
          <Input type="number" value={form.hourly_rate ?? ""} onChange={(e) => set("hourly_rate", e.target.value)} className={INPUT_CLASS} />
        </Field>
        <Field label="Low Stock Threshold">
          <Input type="number" value={form.low_stock_threshold ?? ""} onChange={(e) => set("low_stock_threshold", e.target.value)} className={INPUT_CLASS} />
        </Field>
      </Section>

      <Section title="QR Ordering">
        <Field label="QR Base URL">
          <Input value={form.qr_base_url ?? ""} onChange={(e) => set("qr_base_url", e.target.value)} placeholder="https://yourdomain.com/order" className={INPUT_CLASS} />
        </Field>
      </Section>

      <Section title="Receipt">
        <Field label="Header Line 1">
          <Input value={form.receipt_header_1 ?? ""} onChange={(e) => set("receipt_header_1", e.target.value)} placeholder="Venue name" className={INPUT_CLASS} />
        </Field>
        <Field label="Header Line 2">
          <Input value={form.receipt_header_2 ?? ""} onChange={(e) => set("receipt_header_2", e.target.value)} placeholder="Address" className={INPUT_CLASS} />
        </Field>
        <Field label="Header Line 3">
          <Input value={form.receipt_header_3 ?? ""} onChange={(e) => set("receipt_header_3", e.target.value)} placeholder="Phone / Social" className={INPUT_CLASS} />
        </Field>
        <Field label="Footer Message">
          <Input value={form.receipt_footer ?? ""} onChange={(e) => set("receipt_footer", e.target.value)} placeholder="Thank you!" className={INPUT_CLASS} />
        </Field>
        <Field label="Paper Width">
          <select
            value={form.receipt_paper_width ?? "80mm"}
            onChange={(e) => set("receipt_paper_width", e.target.value)}
            className="w-full px-3 py-2 bg-[rgba(40,56,44,0.6)] border border-[rgba(255,255,255,0.08)] rounded-md text-[#fef9ec] text-sm focus:outline-none focus:border-[rgba(251,191,36,0.25)]"
          >
            <option value="58mm">58mm</option>
            <option value="80mm">80mm</option>
          </select>
        </Field>
        <Field label="Show COGS on Receipt">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.receipt_show_cogs === "true"}
              onChange={(e) => set("receipt_show_cogs", e.target.checked ? "true" : "false")}
              className="accent-[#f59e0b]"
            />
            <span className="text-sm text-[rgba(254,249,236,0.7)]">Enabled</span>
          </label>
        </Field>
      </Section>

      <div className="flex justify-end">
        <Button onClick={() => save.mutate()} disabled={!dirty || save.isPending} className="bg-[#f59e0b] hover:bg-[#d97706] text-black font-bold px-8">
          {save.isPending ? "Saving…" : "Save Settings"}
        </Button>
      </div>
    </div>
  )
}
