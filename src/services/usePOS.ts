/**
 * Service Hook: usePOS
 * Encapsulates retail counter point-of-sale transactions and offline-first queue resilience.
 * Seamless migration path: Replace internal calls with `@supabase/supabase-js` client queries and Supabase Realtime.
 */
import { useBakeryStore } from '../store/useBakeryStore'
import type { POSCartItem } from '../types'

export function usePOS() {
  const {
    products,
    locationInventories,
    posSales,
    recordSale,
    syncOfflineSales,
  } = useBakeryStore()

  return {
    products,
    locationInventories,
    posSales,
    recordSale: (
      locationId: string,
      cashierId: string,
      cashierName: string,
      items: POSCartItem[],
      subtotal: number,
      tax: number,
      discount: number,
      total: number,
      paymentMethod: 'cash' | 'card' | 'qr_wallet',
      amountTendered: number,
      isOffline?: boolean
    ) => {
      // In Production with Supabase:
      // if (navigator.onLine) {
      //   const { data } = await supabase.from('pos_sales').insert([{ ... }])
      // } else {
      //   await indexedDBQueue.add({ ... })
      // }
      return recordSale(
        locationId,
        cashierId,
        cashierName,
        items,
        subtotal,
        tax,
        discount,
        total,
        paymentMethod,
        amountTendered,
        isOffline
      )
    },
    syncOfflineSales: () => {
      return syncOfflineSales()
    },
  }
}
