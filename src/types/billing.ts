import type { BillingMode } from './database'

export interface BlockHourState {
  blocksCount: number
  blockEndsAt: Date
  tableCharge: number
  msRemaining: number
  isExpiring: boolean
  isOvertime: boolean
  overtimeMs: number
}

export interface PerMinuteState {
  minutesElapsed: number
  tableCharge: number
  displayTime: string
}

export interface SessionChargeResult {
  mode: BillingMode
  tableCharge: number
  fbRevenue: number
  fbCogs: number
  sessionTotal: number
  sessionProfit: number
}
