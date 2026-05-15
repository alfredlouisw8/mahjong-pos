import { create } from "zustand"
import { persist } from "zustand/middleware"

interface ShiftState {
  cashierId: string | null
  cashierName: string | null
  shiftId: string | null
  setCashierSession: (cashierId: string, cashierName: string, shiftId: string) => void
  clearCashierSession: () => void
}

export const useShiftStore = create<ShiftState>()(
  persist(
    (set) => ({
      cashierId: null,
      cashierName: null,
      shiftId: null,
      setCashierSession: (cashierId, cashierName, shiftId) =>
        set({ cashierId, cashierName, shiftId }),
      clearCashierSession: () =>
        set({ cashierId: null, cashierName: null, shiftId: null }),
    }),
    {
      name: "cashier-session",
    }
  )
)
