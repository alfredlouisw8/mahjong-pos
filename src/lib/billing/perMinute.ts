import type { PerMinuteState } from "@/types/billing"

export function computePerMinuteState(
  startTime: string,
  hourlyRate: number
): PerMinuteState {
  const now = Date.now()
  const start = new Date(startTime).getTime()
  const minutesElapsed = Math.floor((now - start) / 60_000)
  const tableCharge = Math.floor((minutesElapsed * hourlyRate) / 60)
  const hours = Math.floor(minutesElapsed / 60)
  const mins = minutesElapsed % 60
  const displayTime = `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`

  return { minutesElapsed, tableCharge, displayTime }
}

export function computePerMinuteCharge(
  startTime: string,
  endTime: string,
  hourlyRate: number
): number {
  const start = new Date(startTime).getTime()
  const end = new Date(endTime).getTime()
  const minutesElapsed = Math.floor((end - start) / 60_000)
  return Math.floor((minutesElapsed * hourlyRate) / 60)
}
