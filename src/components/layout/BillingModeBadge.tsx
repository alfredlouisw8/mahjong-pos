"use client"

import { useConfig } from "@/hooks/useConfig"
import { fmtMoney } from "@/lib/formatters"

export function BillingModeBadge() {
  const { data: config } = useConfig()
  if (!config) return null

  const label = config.billing_mode === "block_hour"
    ? `⏱ Block-Hour · ${fmtMoney(config.hourly_rate, config.currency_symbol)}/hr`
    : `⏱ Per-Minute · ${fmtMoney(config.hourly_rate, config.currency_symbol)}/hr`

  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-[rgba(245,158,11,0.15)] text-[#f59e0b] border border-[rgba(251,191,36,0.25)]">
      {label}
    </span>
  )
}
