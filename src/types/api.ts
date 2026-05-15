export interface ApiError {
  error: string
  details?: string
}

export interface CashierAuthRequest {
  cashierId: string
  pin: string
}

export interface CashierTokenPayload {
  cashierId: string
  cashierName: string
  shiftId: string
}

export interface StartSessionRequest {
  tableId: string
  blocksCount?: number
}

export interface ExtendSessionRequest {
  blocks: number
}

export interface CloseSessionRequest {
  notes?: string
}

export interface AddOrderRequest {
  menuItemId: string
  quantity: number
  note?: string
}

export interface CustomerOrderRequest {
  tableToken: string
  items: Array<{
    menuItemId: string
    quantity: number
    note?: string
  }>
}

export interface StartShiftRequest {
  openingCash: number
  cashierId: string
}

export interface JoinShiftRequest {
  cashierId: string
}

export interface CloseShiftRequest {
  closingCash: number
  notes?: string
}

export interface ReportSummaryQuery {
  from: string
  to: string
}

export interface ReportSummary {
  totalRevenue: number
  tableIncome: number
  fbIncome: number
  fbCogs: number
  grossProfit: number
  operatingExpenses: number
  netProfit: number
  netMargin: number
  sessionCount: number
  tableHours: number
  avgRevenuePerSession: number
}
