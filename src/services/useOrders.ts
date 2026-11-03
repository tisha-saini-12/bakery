/**
 * Service Hook: useOrders
 * Encapsulates order management data access.
 * Currently backed by reactive local mock store.
 * Seamless migration path: Replace internal calls with `@supabase/supabase-js` client queries.
 */
import { useBakeryStore } from '../store/useBakeryStore'
import type { Order } from '../types'

export function useOrders() {
  const {
    orders,
    createOrder,
    approveOrder,
    sendOrderToProduction,
    bulkSendOrdersToProduction,
    cancelOrder,
    getPendingOrdersCount,
  } = useBakeryStore()

  return {
    orders,
    pendingOrdersCount: getPendingOrdersCount(),
    createOrder: (order: Omit<Order, 'id' | 'orderNumber' | 'status' | 'orderDate'>) => {
      // In Production with Supabase:
      // const { data, error } = await supabase.from('orders').insert([order]).select().single()
      return createOrder(order)
    },
    approveOrder: (orderId: string) => {
      // In Production with Supabase:
      // await supabase.from('orders').update({ status: 'approved' }).eq('id', orderId)
      approveOrder(orderId)
    },
    sendOrderToProduction: (orderId: string) => {
      // In Production with Supabase:
      // await supabase.from('orders').update({ status: 'in_production' }).eq('id', orderId)
      sendOrderToProduction(orderId)
    },
    bulkSendOrdersToProduction: (orderIds: string[]) => {
      bulkSendOrdersToProduction(orderIds)
    },
    cancelOrder: (orderId: string) => {
      cancelOrder(orderId)
    },
  }
}
