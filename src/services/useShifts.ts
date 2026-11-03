/**
 * Service Hook: useShifts
 * Encapsulates cashier shift opening float, mid-shift safe drops, and end-of-shift reconciliation.
 */
import { useBakeryStore } from '../store/useBakeryStore'

export function useShifts() {
  const { shifts, openShift, recordSafeDrop, closeShift } = useBakeryStore()

  return {
    shifts,
    openShift: (locationId: string, cashierId: string, cashierName: string, openingFloat: number) => {
      return openShift(locationId, cashierId, cashierName, openingFloat)
    },
    recordSafeDrop: (shiftId: string, amount: number) => {
      recordSafeDrop(shiftId, amount)
    },
    closeShift: (shiftId: string, countedCash: number, notes?: string) => {
      closeShift(shiftId, countedCash, notes)
    },
  }
}
