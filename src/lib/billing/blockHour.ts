import type { BlockHourState } from "@/types/billing"

const EXPIRY_WARNING_MINUTES = 15

export function computeBlockHourState(
  startTime: string,
  blockEndsAt: string,
  hourlyRate: number,
  blocksPurchased: number
): BlockHourState {
  const now = Date.now()
  const endsAt = new Date(blockEndsAt).getTime()
  const msRemaining = endsAt - now
  const isOvertime = msRemaining <= 0
  const overtimeMs = isOvertime ? Math.abs(msRemaining) : 0
  const isExpiring = !isOvertime && msRemaining <= EXPIRY_WARNING_MINUTES * 60_000

  return {
    blocksCount: blocksPurchased,
    blockEndsAt: new Date(blockEndsAt),
    tableCharge: hourlyRate * blocksPurchased,
    msRemaining,
    isExpiring,
    isOvertime,
    overtimeMs,
  }
}

export function computeBlockEndsAt(startTime: string, blocks: number): Date {
  return new Date(new Date(startTime).getTime() + blocks * 3_600_000)
}

export function computeBlockCharge(blocks: number, hourlyRate: number): number {
  return blocks * hourlyRate
}
