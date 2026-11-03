/**
 * Service Hook: useInventory
 * Encapsulates raw ingredient stock, finished goods inventory, and stock movement ledger.
 * Seamless migration path: Replace internal calls with `@supabase/supabase-js` client queries.
 */
import { useBakeryStore } from '../store/useBakeryStore'

export function useInventory() {
  const {
    ingredients,
    products,
    locationInventories,
    movements,
    adjustIngredientStock,
    adjustProductStock,
    receivePurchaseOrder,
    getLowStockIngredients,
    getProductStockAtLocation,
  } = useBakeryStore()

  return {
    ingredients,
    products,
    locationInventories,
    movements,
    lowStockIngredients: getLowStockIngredients(),
    getProductStockAtLocation,
    adjustIngredientStock: (ingredientId: string, newStock: number, reason: string) => {
      // In Production with Supabase:
      // await supabase.from('ingredients').update({ current_stock: newStock }).eq('id', ingredientId)
      // await supabase.from('stock_movements').insert([{ ... }])
      adjustIngredientStock(ingredientId, newStock, reason)
    },
    adjustProductStock: (productId: string, locationId: string, newStock: number, reason: string) => {
      adjustProductStock(productId, locationId, newStock, reason)
    },
    receivePurchaseOrder: (
      ingredientId: string,
      quantity: number,
      unitCost: number,
      supplier: string,
      poNumber: string
    ) => {
      receivePurchaseOrder(ingredientId, quantity, unitCost, supplier, poNumber)
    },
  }
}
