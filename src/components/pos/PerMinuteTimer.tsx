"use client"

import { useEffect, useState } from "react"
import { computePerMinuteState } from "@/lib/billing/perMinute"
import { fmtMoney } from "@/lib/formatters"
import type { Session } from "@/types/database"

interface PerMinuteTimerProps {
  session: Session
  currencySymbol?: string
  compact?: boolean
}

export function PerMinuteTimer({ session, currencySymbol = "Rp", compact }: PerMinuteTimerProps) {
  const [state, setState] = useState(() =>
    computePerMinuteState(session.start_time, session.hourly_rate)
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setState(computePerMinuteState(session.start_time, session.hourly_rate))
    }, 60_000)
    return () => clearInterval(interval)
  }, [session.start_time, session.hourly_rate])

  if (compact) {
    return (
      <div className="text-xs font-tabular font-bold text-[#f59e0b]">
        {state.displayTime}
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <div className="text-lg font-bold font-tabular text-[#f59e0b]">{state.displayTime}</div>
      <div className="text-xs text-[rgba(251,191,36,0.55)]">elapsed</div>
      <div className="text-sm text-[#fef9ec] font-tabular">
        {fmtMoney(state.tableCharge, currencySymbol)}
      </div>
    </div>
  )
}
