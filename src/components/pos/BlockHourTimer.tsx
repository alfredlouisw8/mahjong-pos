"use client"

import { useEffect, useState } from "react"
import { computeBlockHourState } from "@/lib/billing/blockHour"
import { fmtDuration, fmtTime, fmtMoney } from "@/lib/formatters"
import type { Session } from "@/types/database"

interface BlockHourTimerProps {
  session: Session
  currencySymbol?: string
  compact?: boolean
}

export function BlockHourTimer({ session, currencySymbol = "Rp", compact }: BlockHourTimerProps) {
  const [state, setState] = useState(() =>
    computeBlockHourState(
      session.start_time,
      session.block_ends_at!,
      session.hourly_rate,
      session.blocks_purchased
    )
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setState(computeBlockHourState(
        session.start_time,
        session.block_ends_at!,
        session.hourly_rate,
        session.blocks_purchased
      ))
    }, 1000)
    return () => clearInterval(interval)
  }, [session.start_time, session.block_ends_at, session.hourly_rate, session.blocks_purchased])

  if (compact) {
    if (state.isOvertime) {
      return (
        <div className="text-[#f43f5e] text-xs font-tabular font-bold">
          🔴 +{fmtDuration(state.overtimeMs)}
        </div>
      )
    }
    return (
      <div className={`text-xs font-tabular font-bold ${state.isExpiring ? "text-orange-400" : "text-[#10b981]"}`}>
        {fmtDuration(state.msRemaining)}
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {state.isOvertime ? (
        <div className="text-[#f43f5e] text-lg font-bold font-tabular">
          🔴 OVERTIME +{fmtDuration(state.overtimeMs)}
        </div>
      ) : (
        <div className={`text-lg font-bold font-tabular ${state.isExpiring ? "text-orange-400" : "text-[#10b981]"}`}>
          {fmtDuration(state.msRemaining)}
        </div>
      )}
      <div className="text-xs text-[rgba(251,191,36,0.55)]">
        {state.blocksCount} block{state.blocksCount !== 1 ? "s" : ""} · ends {fmtTime(session.block_ends_at!)}
      </div>
      <div className="text-sm text-[#fef9ec] font-tabular">
        {fmtMoney(state.tableCharge, currencySymbol)}
      </div>
    </div>
  )
}
