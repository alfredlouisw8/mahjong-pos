import { format, formatDuration, intervalToDuration } from "date-fns"
import { toZonedTime } from "date-fns-tz"

export function fmtMoney(amount: number, symbol = "Rp"): string {
  return `${symbol}${amount.toLocaleString("id-ID")}`
}

export function fmtDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const mins = Math.floor((totalSeconds % 3600) / 60)
  const secs = totalSeconds % 60
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
}

export function fmtHHMM(ms: number): string {
  const totalMins = Math.floor(ms / 60_000)
  const hours = Math.floor(totalMins / 60)
  const mins = totalMins % 60
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`
}

export function fmtDate(date: string | Date, tz = "Asia/Jakarta"): string {
  const d = typeof date === "string" ? new Date(date) : date
  const zonedDate = toZonedTime(d, tz)
  return format(zonedDate, "dd/MM/yyyy HH:mm")
}

export function fmtDateShort(date: string | Date, tz = "Asia/Jakarta"): string {
  const d = typeof date === "string" ? new Date(date) : date
  const zonedDate = toZonedTime(d, tz)
  return format(zonedDate, "dd/MM/yyyy")
}

export function fmtTime(date: string | Date, tz = "Asia/Jakarta"): string {
  const d = typeof date === "string" ? new Date(date) : date
  const zonedDate = toZonedTime(d, tz)
  return format(zonedDate, "HH:mm")
}

export function fmtSessionDuration(startTime: string, endTime?: string | null): string {
  const start = new Date(startTime)
  const end = endTime ? new Date(endTime) : new Date()
  const duration = intervalToDuration({ start, end })
  return formatDuration(duration, { format: ["hours", "minutes"] }) || "0 minutes"
}

export function fmtPercent(value: number): string {
  return `${value.toFixed(1)}%`
}
