import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Product,
  Ingredient,
  Recipe,
  LocationInventory,
  Order,
  ProductionBatch,
  StockMovement,
  Dispatch,
  PullOut,
  POSSale,
  POSCartItem,
  ShiftClosing,
  AttendanceRecord,
  BillingInvoice,
  BatchStatus,
} from '../types'
import {
  INITIAL_PRODUCTS,
  INITIAL_INGREDIENTS,
  INITIAL_RECIPES,
  INITIAL_LOCATION_INVENTORIES,
  INITIAL_ORDERS,
  INITIAL_BATCHES,
  INITIAL_MOVEMENTS,
  INITIAL_DISPATCHES,
  INITIAL_PULLOUTS,
  INITIAL_SHIFTS,
  INITIAL_ATTENDANCE,
  INITIAL_INVOICES,
  INITIAL_LOCATIONS,
} from '../mock/initialData'

interface BakeryStoreState {
  products: Product[]
  ingredients: Ingredient[]
  recipes: Recipe[]
  locationInventories: LocationInventory[]
  orders: Order[]
  batches: ProductionBatch[]
  movements: StockMovement[]
  dispatches: Dispatch[]
  pullouts: PullOut[]
  posSales: POSSale[]
  shifts: ShiftClosing[]
  attendanceRecords: AttendanceRecord[]
  invoices: BillingInvoice[]

  // Master Data & Recipe BOM
  addProduct: (product: Omit<Product, 'id'>) => Product
  addIngredient: (ingredient: Omit<Ingredient, 'id'>) => Ingredient
  saveRecipe: (recipe: Omit<Recipe, 'id'> & { id?: string }) => Recipe

  // Orders
  createOrder: (order: Omit<Order, 'id' | 'orderNumber' | 'status' | 'orderDate'>) => Order
  approveOrder: (orderId: string) => void
  sendOrderToProduction: (orderId: string) => void
  bulkSendOrdersToProduction: (orderIds: string[]) => void
  cancelOrder: (orderId: string) => void

  // Production Batches & BOM
  createBatch: (recipeId: string, plannedYield: number, scheduledDate: string, assignedTo?: string, notes?: string) => ProductionBatch
  startBatch: (batchId: string) => void
  advanceBatchStage: (batchId: string, nextStatus: BatchStatus) => void
  completeBatch: (batchId: string, actualYield: number, notes?: string) => void

  // Inventory & Inbound PO
  adjustIngredientStock: (ingredientId: string, newStock: number, reason: string) => void
  adjustProductStock: (productId: string, locationId: string, newStock: number, reason: string) => void
  receivePurchaseOrder: (
    ingredientId: string,
    quantity: number,
    unitCost: number,
    supplier: string,
    poNumber: string
  ) => void

  // Dispatch & Logistics
  createDispatch: (
    destinationLocationId: string,
    items: { productId: string; dispatchedQty: number }[],
    vehicleNumber: string,
    driverName: string,
    driverPhone: string,
    orderId?: string,
    notes?: string
  ) => Dispatch
  receiveDispatch: (
    dispatchId: string,
    receivedItems: { productId: string; receivedQty: number; discrepancyReason?: string }[]
  ) => void

  // Retail POS
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
  ) => POSSale
  syncOfflineSales: () => number

  // Pull-Outs & Leftovers
  recordPullOut: (
    locationId: string,
    productId: string,
    quantity: number,
    reason: PullOut['reason'],
    disposition: PullOut['disposition'],
    reportedBy: string
  ) => void

  // Shifts
  openShift: (locationId: string, cashierId: string, cashierName: string, openingFloat: number) => ShiftClosing
  recordSafeDrop: (shiftId: string, amount: number) => void
  closeShift: (shiftId: string, countedCash: number, notes?: string) => void

  // Attendance
  clockIn: (employeeId: string, employeeName: string, role: string, locationId: string, photoUrl?: string) => AttendanceRecord
  clockOut: (attendanceId: string) => void

  // Billing
  recordPayment: (invoiceId: string, amount: number) => void

  // Helper selectors
  getLowStockIngredients: () => Ingredient[]
  getPendingOrdersCount: () => number
  getActiveBatchesCount: () => number
  getProductStockAtLocation: (productId: string, locationId: string) => number

  // System
  resetToInitialData: () => void
}

export const useBakeryStore = create<BakeryStoreState>()(
  persist(
    (set, get) => ({
      products: INITIAL_PRODUCTS,
      ingredients: INITIAL_INGREDIENTS,
      recipes: INITIAL_RECIPES,
      locationInventories: INITIAL_LOCATION_INVENTORIES,
      orders: INITIAL_ORDERS,
      batches: INITIAL_BATCHES,
      movements: INITIAL_MOVEMENTS,
      dispatches: INITIAL_DISPATCHES,
      pullouts: INITIAL_PULLOUTS,
      posSales: [],
      shifts: INITIAL_SHIFTS,
      attendanceRecords: INITIAL_ATTENDANCE,
      invoices: INITIAL_INVOICES,

      // === MASTER DATA & RECIPES ===
      addProduct: (prodInput) => {
        const newProd: Product = {
          ...prodInput,
          id: `prd-${Date.now()}`,
        }
        set((state) => ({ products: [newProd, ...state.products] }))
        return newProd
      },

      addIngredient: (ingInput) => {
        const newIng: Ingredient = {
          ...ingInput,
          id: `ing-${Date.now()}`,
        }
        set((state) => ({ ingredients: [newIng, ...state.ingredients] }))
        return newIng
      },

      saveRecipe: (recipeInput) => {
        let savedRecipe: Recipe
        if (recipeInput.id) {
          // Update existing
          savedRecipe = recipeInput as Recipe
          set((state) => ({
            recipes: state.recipes.map((r) => (r.id === recipeInput.id ? savedRecipe : r)),
          }))
        } else {
          // Create new
          savedRecipe = {
            ...recipeInput,
            id: `rcp-${Date.now()}`,
          } as Recipe
          set((state) => ({
            recipes: [savedRecipe, ...state.recipes],
            products: state.products.map((p) =>
              p.id === savedRecipe.productId ? { ...p, recipeId: savedRecipe.id } : p
            ),
          }))
        }
        return savedRecipe
      },

      // === ORDERS ACTIONS ===
      createOrder: (orderInput) => {
        const orderNumber = `ORD-${Math.floor(1000 + Math.random() * 9000)}`
        const newOrder: Order = {
          ...orderInput,
          id: `ord-${Date.now()}`,
          orderNumber,
          status: 'submitted',
          orderDate: new Date().toISOString(),
        }

        set((state) => ({
          orders: [newOrder, ...state.orders],
        }))
        return newOrder
      },

      approveOrder: (orderId) => {
        set((state) => ({
          orders: state.orders.map((o) => (o.id === orderId ? { ...o, status: 'approved' } : o)),
        }))
      },

      sendOrderToProduction: (orderId) => {
        const state = get()
        const order = state.orders.find((o) => o.id === orderId)
        if (!order) return

        // For each item in the order, auto-create a production batch if recipe exists
        const newBatches: ProductionBatch[] = []
        order.items.forEach((item) => {
          const recipe = state.recipes.find((r) => r.productId === item.productId)
          if (recipe) {
            const batchNum = `B-${Math.floor(100 + Math.random() * 900)}`
            newBatches.push({
              id: `bat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              batchNumber: batchNum,
              recipeId: recipe.id,
              productId: item.productId,
              productName: item.productName,
              plannedYield: item.quantity,
              status: 'planned',
              scheduledDate: new Date().toISOString().split('T')[0],
              assignedTo: 'Tomas Kowalski',
              notes: `Generated from Order ${order.orderNumber}`,
            })
          }
        })

        set((prevState) => ({
          orders: prevState.orders.map((o) =>
            o.id === orderId ? { ...o, status: 'in_production' } : o
          ),
          batches: [...newBatches, ...prevState.batches],
        }))
      },

      bulkSendOrdersToProduction: (orderIds) => {
        const state = get()
        const targetOrders = state.orders.filter((o) => orderIds.includes(o.id))
        if (targetOrders.length === 0) return

        // Aggregate item quantities across all selected orders to optimize batch scheduling
        const aggregatedDemand: Record<string, { productName: string; quantity: number }> = {}
        targetOrders.forEach((ord) => {
          ord.items.forEach((item) => {
            if (!aggregatedDemand[item.productId]) {
              aggregatedDemand[item.productId] = { productName: item.productName, quantity: 0 }
            }
            aggregatedDemand[item.productId].quantity += item.quantity
          })
        })

        const newBatches: ProductionBatch[] = []
        Object.entries(aggregatedDemand).forEach(([productId, data]) => {
          const recipe = state.recipes.find((r) => r.productId === productId)
          if (recipe) {
            const batchNum = `B-${Math.floor(100 + Math.random() * 900)}`
            newBatches.push({
              id: `bat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              batchNumber: batchNum,
              recipeId: recipe.id,
              productId,
              productName: data.productName,
              plannedYield: data.quantity,
              status: 'planned',
              scheduledDate: new Date().toISOString().split('T')[0],
              assignedTo: 'Tomas Kowalski',
              notes: `Consolidated daily batch across ${targetOrders.length} stores`,
            })
          }
        })

        set((prevState) => ({
          orders: prevState.orders.map((o) =>
            orderIds.includes(o.id) ? { ...o, status: 'in_production' } : o
          ),
          batches: [...newBatches, ...prevState.batches],
        }))
      },

      cancelOrder: (orderId) => {
        set((state) => ({
          orders: state.orders.map((o) => (o.id === orderId ? { ...o, status: 'cancelled' } : o)),
        }))
      },

      // === PRODUCTION BATCHES & RECIPE BOM ===
      createBatch: (recipeId, plannedYield, scheduledDate, assignedTo, notes) => {
        const state = get()
        const recipe = state.recipes.find((r) => r.id === recipeId)
        if (!recipe) throw new Error('Recipe not found')

        const batchNumber = `B-${Math.floor(100 + Math.random() * 900)}`
        const newBatch: ProductionBatch = {
          id: `bat-${Date.now()}`,
          batchNumber,
          recipeId,
          productId: recipe.productId,
          productName: recipe.productName,
          plannedYield,
          status: 'planned',
          scheduledDate,
          assignedTo,
          notes,
        }

        set((prevState) => ({
          batches: [newBatch, ...prevState.batches],
        }))
        return newBatch
      },

      startBatch: (batchId) => {
        const state = get()
        const batch = state.batches.find((b) => b.id === batchId)
        if (!batch) return

        const recipe = state.recipes.find((r) => r.id === batch.recipeId)
        if (!recipe) return

        // BOM Ingredient Deduction:
        // multiplier = plannedYield / recipe.yieldQuantity
        const multiplier = batch.plannedYield / (recipe.yieldQuantity || 1)
        const updatedIngredients = [...state.ingredients]
        const newMovements: StockMovement[] = []

        recipe.ingredients.forEach((recItem) => {
          const reqQty = Number((recItem.quantity * multiplier).toFixed(2))
          const ingIndex = updatedIngredients.findIndex((i) => i.id === recItem.ingredientId)

          if (ingIndex !== -1) {
            const ing = updatedIngredients[ingIndex]
            const prevStock = ing.currentStock
            const newStock = Math.max(0, Number((prevStock - reqQty).toFixed(2)))
            updatedIngredients[ingIndex] = { ...ing, currentStock: newStock }

            // Log stock movement
            newMovements.push({
              id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              timestamp: new Date().toISOString(),
              itemId: ing.id,
              itemName: ing.name,
              itemType: 'ingredient',
              locationId: 'loc-1',
              locationName: 'Central Commissary HQ',
              type: 'production_out',
              quantity: reqQty,
              previousStock: prevStock,
              newStock,
              referenceId: batch.batchNumber,
              reason: `Consumed for Batch ${batch.batchNumber} (${batch.productName})`,
            })
          }
        })

        set((prevState) => ({
          ingredients: updatedIngredients,
          movements: [...newMovements, ...prevState.movements],
          batches: prevState.batches.map((b) =>
            b.id === batchId ? { ...b, status: 'mixing', startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } : b
          ),
        }))
      },

      advanceBatchStage: (batchId, nextStatus) => {
        set((state) => ({
          batches: state.batches.map((b) => (b.id === batchId ? { ...b, status: nextStatus } : b)),
        }))
      },

      completeBatch: (batchId, actualYield, notes) => {
        const state = get()
        const batch = state.batches.find((b) => b.id === batchId)
        if (!batch) return

        const variance = actualYield - batch.plannedYield

        // Add finished products to Commissary finished goods inventory
        const updatedProducts = state.products.map((p) => {
          if (p.id === batch.productId) {
            return { ...p, currentStock: p.currentStock + actualYield }
          }
          return p
        })

        const newMovement: StockMovement = {
          id: `mov-${Date.now()}`,
          timestamp: new Date().toISOString(),
          itemId: batch.productId,
          itemName: batch.productName,
          itemType: 'finished_product',
          locationId: 'loc-1',
          locationName: 'Central Commissary HQ',
          type: 'production_in',
          quantity: actualYield,
          previousStock: state.products.find((p) => p.id === batch.productId)?.currentStock || 0,
          newStock: (state.products.find((p) => p.id === batch.productId)?.currentStock || 0) + actualYield,
          referenceId: batch.batchNumber,
          reason: `Production yield completed for Batch ${batch.batchNumber} (Variance: ${variance})`,
        }

        set((prevState) => ({
          products: updatedProducts,
          movements: [newMovement, ...prevState.movements],
          batches: prevState.batches.map((b) =>
            b.id === batchId
              ? {
                  ...b,
                  status: 'completed',
                  actualYield,
                  variance,
                  endTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  notes: notes || b.notes,
                }
              : b
          ),
        }))
      },

      // === INVENTORY ADJUSTMENTS ===
      adjustIngredientStock: (ingredientId, newStock, reason) => {
        const state = get()
        const ing = state.ingredients.find((i) => i.id === ingredientId)
        if (!ing) return

        const prevStock = ing.currentStock
        const diff = newStock - prevStock

        const movement: StockMovement = {
          id: `mov-${Date.now()}`,
          timestamp: new Date().toISOString(),
          itemId: ing.id,
          itemName: ing.name,
          itemType: 'ingredient',
          locationId: 'loc-1',
          locationName: 'Central Commissary HQ',
          type: 'adjustment',
          quantity: Math.abs(diff),
          previousStock: prevStock,
          newStock,
          reason,
        }

        set((prevState) => ({
          ingredients: prevState.ingredients.map((i) =>
            i.id === ingredientId ? { ...i, currentStock: newStock } : i
          ),
          movements: [movement, ...prevState.movements],
        }))
      },

      adjustProductStock: (productId, locationId, newStock, reason) => {
        const state = get()
        const product = state.products.find((p) => p.id === productId)
        if (!product) return

        const loc = INITIAL_LOCATIONS.find((l) => l.id === locationId)
        const existingLocInv = state.locationInventories.find(
          (li) => li.productId === productId && li.locationId === locationId
        )

        const prevStock = existingLocInv ? existingLocInv.currentStock : (locationId === 'loc-1' ? product.currentStock : 0)
        const diff = newStock - prevStock

        const movement: StockMovement = {
          id: `mov-${Date.now()}`,
          timestamp: new Date().toISOString(),
          itemId: product.id,
          itemName: product.name,
          itemType: 'finished_product',
          locationId,
          locationName: loc ? loc.name : 'Unknown Location',
          type: 'adjustment',
          quantity: Math.abs(diff),
          previousStock: prevStock,
          newStock,
          reason,
        }

        if (locationId === 'loc-1') {
          // Commissary central stock
          set((prevState) => ({
            products: prevState.products.map((p) =>
              p.id === productId ? { ...p, currentStock: newStock } : p
            ),
            movements: [movement, ...prevState.movements],
          }))
        } else {
          // Store specific stock
          const updatedLocInvs = [...state.locationInventories]
          const existingIdx = updatedLocInvs.findIndex(
            (li) => li.productId === productId && li.locationId === locationId
          )

          if (existingIdx !== -1) {
            updatedLocInvs[existingIdx] = {
              ...updatedLocInvs[existingIdx],
              currentStock: newStock,
              lastUpdated: new Date().toISOString(),
            }
          } else {
            updatedLocInvs.push({
              id: `li-${Date.now()}`,
              locationId,
              productId,
              productName: product.name,
              currentStock: newStock,
              minStockLevel: product.minStockLevel,
              lastUpdated: new Date().toISOString(),
            })
          }

          set((prevState) => ({
            locationInventories: updatedLocInvs,
            movements: [movement, ...prevState.movements],
          }))
        }
      },

      receivePurchaseOrder: (ingredientId, quantity, unitCost, supplier, poNumber) => {
        const state = get()
        const ing = state.ingredients.find((i) => i.id === ingredientId)
        if (!ing) return

        const prevStock = ing.currentStock
        const newStock = Number((prevStock + quantity).toFixed(2))

        const movement: StockMovement = {
          id: `mov-${Date.now()}`,
          timestamp: new Date().toISOString(),
          itemId: ing.id,
          itemName: ing.name,
          itemType: 'ingredient',
          locationId: 'loc-1',
          locationName: 'Central Commissary HQ',
          type: 'purchase_in',
          quantity,
          previousStock: prevStock,
          newStock,
          referenceId: poNumber,
          reason: `Inbound PO ${poNumber} received from ${supplier}`,
        }

        set((prevState) => ({
          ingredients: prevState.ingredients.map((i) =>
            i.id === ingredientId
              ? {
                  ...i,
                  currentStock: newStock,
                  unitCost: unitCost || i.unitCost,
                  supplier: supplier || i.supplier,
                }
              : i
          ),
          movements: [movement, ...prevState.movements],
        }))
      },

      // === DISPATCH & RECEIVING ===
      createDispatch: (destinationLocationId, items, vehicleNumber, driverName, driverPhone, orderId, notes) => {
        const state = get()
        const destLoc = INITIAL_LOCATIONS.find((l) => l.id === destinationLocationId)
        const dispatchNumber = `DSP-${Math.floor(100 + Math.random() * 900)}`

        // Deduct finished goods from Central Commissary HQ
        const updatedProducts = [...state.products]
        const newMovements: StockMovement[] = []

        const dispatchItems = items.map((item) => {
          const product = updatedProducts.find((p) => p.id === item.productId)
          const pName = product ? product.name : 'Unknown Item'

          if (product) {
            const prevStock = product.currentStock
            const newStock = Math.max(0, prevStock - item.dispatchedQty)
            product.currentStock = newStock

            newMovements.push({
              id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              timestamp: new Date().toISOString(),
              itemId: product.id,
              itemName: product.name,
              itemType: 'finished_product',
              locationId: 'loc-1',
              locationName: 'Central Commissary HQ',
              type: 'dispatch_out',
              quantity: item.dispatchedQty,
              previousStock: prevStock,
              newStock,
              referenceId: dispatchNumber,
              reason: `Dispatched to ${destLoc ? destLoc.name : 'Store'} via ${vehicleNumber}`,
            })
          }

          return {
            productId: item.productId,
            productName: pName,
            dispatchedQty: item.dispatchedQty,
          }
        })

        const newDispatch: Dispatch = {
          id: `dsp-${Date.now()}`,
          dispatchNumber,
          orderId,
          sourceLocationId: 'loc-1',
          destinationLocationId,
          destinationName: destLoc ? destLoc.name : 'Destination Store',
          vehicleNumber,
          driverName,
          driverPhone,
          status: 'in_transit',
          departureTime: new Date().toISOString(),
          items: dispatchItems,
          notes,
        }

        set((prevState) => ({
          products: updatedProducts,
          movements: [...newMovements, ...prevState.movements],
          dispatches: [newDispatch, ...prevState.dispatches],
          orders: orderId
            ? prevState.orders.map((o) => (o.id === orderId ? { ...o, status: 'dispatched' } : o))
            : prevState.orders,
        }))

        return newDispatch
      },

      receiveDispatch: (dispatchId, receivedItems) => {
        const state = get()
        const dispatch = state.dispatches.find((d) => d.id === dispatchId)
        if (!dispatch) return

        let hasDiscrepancy = false
        const updatedLocInvs = [...state.locationInventories]
        const newMovements: StockMovement[] = []

        const finalItems = dispatch.items.map((item) => {
          const report = receivedItems.find((r) => r.productId === item.productId)
          const recQty = report ? report.receivedQty : item.dispatchedQty
          const discrepancy = report?.discrepancyReason

          if (recQty !== item.dispatchedQty) {
            hasDiscrepancy = true
          }

          // Add to store stock
          const existingIdx = updatedLocInvs.findIndex(
            (li) => li.locationId === dispatch.destinationLocationId && li.productId === item.productId
          )

          const prevStock = existingIdx !== -1 ? updatedLocInvs[existingIdx].currentStock : 0
          const newStock = prevStock + recQty

          if (existingIdx !== -1) {
            updatedLocInvs[existingIdx] = {
              ...updatedLocInvs[existingIdx],
              currentStock: newStock,
              lastUpdated: new Date().toISOString(),
            }
          } else {
            updatedLocInvs.push({
              id: `li-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              locationId: dispatch.destinationLocationId,
              productId: item.productId,
              productName: item.productName,
              currentStock: newStock,
              minStockLevel: 15,
              lastUpdated: new Date().toISOString(),
            })
          }

          newMovements.push({
            id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            timestamp: new Date().toISOString(),
            itemId: item.productId,
            itemName: item.productName,
            itemType: 'finished_product',
            locationId: dispatch.destinationLocationId,
            locationName: dispatch.destinationName,
            type: 'receive_in',
            quantity: recQty,
            previousStock: prevStock,
            newStock,
            referenceId: dispatch.dispatchNumber,
            reason: discrepancy ? `Received with note: ${discrepancy}` : `Received from ${dispatch.dispatchNumber}`,
          })

          return {
            ...item,
            receivedQty: recQty,
            discrepancyReason: discrepancy,
          }
        })

        set((prevState) => ({
          locationInventories: updatedLocInvs,
          movements: [...newMovements, ...prevState.movements],
          dispatches: prevState.dispatches.map((d) =>
            d.id === dispatchId
              ? {
                  ...d,
                  status: hasDiscrepancy ? 'received_with_discrepancy' : 'delivered',
                  deliveredTime: new Date().toISOString(),
                  items: finalItems,
                }
              : d
          ),
          orders: dispatch.orderId
            ? prevState.orders.map((o) => (o.id === dispatch.orderId ? { ...o, status: 'delivered' } : o))
            : prevState.orders,
        }))
      },

      // === RETAIL POS ===
      recordSale: (
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
        isOffline = false
      ) => {
        const state = get()
        const receiptNumber = `RCP-${Date.now().toString().slice(-6)}`
        const change = Math.max(0, amountTendered - total)

        // Deduct items from location inventory
        const updatedLocInvs = [...state.locationInventories]
        const newMovements: StockMovement[] = []
        const loc = INITIAL_LOCATIONS.find((l) => l.id === locationId)

        items.forEach((item) => {
          const idx = updatedLocInvs.findIndex(
            (li) => li.locationId === locationId && li.productId === item.productId
          )

          if (idx !== -1) {
            const prev = updatedLocInvs[idx].currentStock
            const newStock = Math.max(0, prev - item.quantity)
            updatedLocInvs[idx] = {
              ...updatedLocInvs[idx],
              currentStock: newStock,
              lastUpdated: new Date().toISOString(),
            }

            newMovements.push({
              id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              timestamp: new Date().toISOString(),
              itemId: item.productId,
              itemName: item.productName,
              itemType: 'finished_product',
              locationId,
              locationName: loc ? loc.name : 'Store Counter',
              type: 'sale_out',
              quantity: item.quantity,
              previousStock: prev,
              newStock,
              referenceId: receiptNumber,
              reason: `Retail POS Sale ${receiptNumber}`,
            })
          }
        })

        // Update active shift if any
        const updatedShifts = state.shifts.map((s) => {
          if (s.locationId === locationId && s.status === 'open') {
            const isCash = paymentMethod === 'cash'
            const isCard = paymentMethod === 'card'
            const isQr = paymentMethod === 'qr_wallet'

            return {
              ...s,
              cashSales: isCash ? s.cashSales + total : s.cashSales,
              cardSales: isCard ? s.cardSales + total : s.cardSales,
              qrSales: isQr ? s.qrSales + total : s.qrSales,
              totalSales: s.totalSales + total,
              expectedCash: isCash ? s.expectedCash + total : s.expectedCash,
            }
          }
          return s
        })

        const newSale: POSSale = {
          id: `sale-${Date.now()}`,
          receiptNumber,
          locationId,
          cashierId,
          cashierName,
          timestamp: new Date().toISOString(),
          items,
          subtotal,
          tax,
          discount,
          total,
          paymentMethod,
          amountTendered,
          change,
          isOfflineSynced: !isOffline,
        }

        set((prevState) => ({
          posSales: [newSale, ...prevState.posSales],
          locationInventories: updatedLocInvs,
          movements: [...newMovements, ...prevState.movements],
          shifts: updatedShifts,
        }))

        return newSale
      },

      syncOfflineSales: () => {
        const state = get()
        const unsynced = state.posSales.filter((s) => !s.isOfflineSynced)
        if (unsynced.length === 0) return 0

        set((prevState) => ({
          posSales: prevState.posSales.map((s) => ({ ...s, isOfflineSynced: true })),
        }))

        return unsynced.length
      },

      // === PULL-OUTS & LEFTOVERS ===
      recordPullOut: (locationId, productId, quantity, reason, disposition, reportedBy) => {
        const state = get()
        const product = state.products.find((p) => p.id === productId)
        const loc = INITIAL_LOCATIONS.find((l) => l.id === locationId)

        // Deduct from location inventory
        const updatedLocInvs = [...state.locationInventories]
        const idx = updatedLocInvs.findIndex(
          (li) => li.locationId === locationId && li.productId === productId
        )

        let prev = 0
        let newStock = 0
        if (idx !== -1) {
          prev = updatedLocInvs[idx].currentStock
          newStock = Math.max(0, prev - quantity)
          updatedLocInvs[idx] = {
            ...updatedLocInvs[idx],
            currentStock: newStock,
            lastUpdated: new Date().toISOString(),
          }
        }

        const newPullOut: PullOut = {
          id: `po-${Date.now()}`,
          locationId,
          locationName: loc ? loc.name : 'Store',
          date: new Date().toISOString().split('T')[0],
          productId,
          productName: product ? product.name : 'Bakery Item',
          quantity,
          reason,
          disposition,
          reportedBy,
        }

        const movement: StockMovement = {
          id: `mov-${Date.now()}`,
          timestamp: new Date().toISOString(),
          itemId: productId,
          itemName: product ? product.name : 'Bakery Item',
          itemType: 'finished_product',
          locationId,
          locationName: loc ? loc.name : 'Store',
          type: 'pullout_waste',
          quantity,
          previousStock: prev,
          newStock,
          referenceId: newPullOut.id,
          reason: `Pull-out: ${reason} (${disposition})`,
        }

        set((prevState) => ({
          pullouts: [newPullOut, ...prevState.pullouts],
          locationInventories: updatedLocInvs,
          movements: [movement, ...prevState.movements],
        }))
      },

      // === SHIFT CLOSING ===
      openShift: (locationId, cashierId, cashierName, openingFloat) => {
        const shiftNumber = `SFT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(10 + Math.random() * 90)}`
        const newShift: ShiftClosing = {
          id: `sft-${Date.now()}`,
          locationId,
          cashierId,
          cashierName,
          shiftNumber,
          openedAt: new Date().toISOString(),
          openingFloat,
          cashSales: 0,
          cardSales: 0,
          qrSales: 0,
          totalSales: 0,
          expectedCash: openingFloat,
          countedCash: 0,
          variance: 0,
          status: 'open',
        }

        set((prevState) => ({
          shifts: [newShift, ...prevState.shifts],
        }))
        return newShift
      },

      recordSafeDrop: (shiftId, amount) => {
        set((state) => ({
          shifts: state.shifts.map((s) => {
            if (s.id === shiftId) {
              const prevDrops = s.safeDrops || 0
              const newDrops = prevDrops + amount
              const newExpected = Math.max(0, s.expectedCash - amount)
              return {
                ...s,
                safeDrops: newDrops,
                expectedCash: newExpected,
              }
            }
            return s
          }),
        }))
      },

      closeShift: (shiftId, countedCash, notes) => {
        set((state) => ({
          shifts: state.shifts.map((s) => {
            if (s.id === shiftId) {
              const variance = countedCash - s.expectedCash
              return {
                ...s,
                status: 'closed',
                closedAt: new Date().toISOString(),
                countedCash,
                variance,
                notes,
              }
            }
            return s
          }),
        }))
      },

      // === ATTENDANCE ===
      clockIn: (employeeId, employeeName, role, locationId, photoUrl) => {
        const newAtt: AttendanceRecord = {
          id: `att-${Date.now()}`,
          employeeId,
          employeeName,
          role,
          locationId,
          date: new Date().toISOString().split('T')[0],
          clockIn: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          photoUrl: photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
          status: 'present',
        }

        set((prevState) => ({
          attendanceRecords: [newAtt, ...prevState.attendanceRecords],
        }))
        return newAtt
      },

      clockOut: (attendanceId) => {
        set((state) => ({
          attendanceRecords: state.attendanceRecords.map((a) =>
            a.id === attendanceId
              ? {
                  ...a,
                  clockOut: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                }
              : a
          ),
        }))
      },

      // === BILLING & INVOICES ===
      recordPayment: (invoiceId, amount) => {
        set((state) => ({
          invoices: state.invoices.map((inv) => {
            if (inv.id === invoiceId) {
              const newPaid = inv.paidAmount + amount
              const newBal = Math.max(0, inv.totalAmount - newPaid)
              return {
                ...inv,
                paidAmount: newPaid,
                balance: newBal,
                status: newBal === 0 ? 'paid' : 'partially_paid',
              }
            }
            return inv
          }),
        }))
      },

      // === SELECTORS ===
      getLowStockIngredients: () => {
        return get().ingredients.filter((ing) => ing.currentStock <= ing.minStockLevel)
      },

      getPendingOrdersCount: () => {
        return get().orders.filter((o) => o.status === 'submitted' || o.status === 'approved').length
      },

      getActiveBatchesCount: () => {
        return get().batches.filter((b) => b.status === 'mixing' || b.status === 'baking' || b.status === 'cooling').length
      },

      getProductStockAtLocation: (productId, locationId) => {
        if (locationId === 'loc-1') {
          const p = get().products.find((prod) => prod.id === productId)
          return p ? p.currentStock : 0
        }
        const li = get().locationInventories.find(
          (item) => item.productId === productId && item.locationId === locationId
        )
        return li ? li.currentStock : 0
      },

      // === RESET TO INITIAL CLEAN STATE ===
      resetToInitialData: () => {
        set({
          products: INITIAL_PRODUCTS,
          ingredients: INITIAL_INGREDIENTS,
          recipes: INITIAL_RECIPES,
          locationInventories: INITIAL_LOCATION_INVENTORIES,
          orders: INITIAL_ORDERS,
          batches: INITIAL_BATCHES,
          movements: INITIAL_MOVEMENTS,
          dispatches: INITIAL_DISPATCHES,
          pullouts: INITIAL_PULLOUTS,
          posSales: [],
          shifts: INITIAL_SHIFTS,
          attendanceRecords: INITIAL_ATTENDANCE,
          invoices: INITIAL_INVOICES,
        })
      },
    }),
    {
      name: 'bakery-commissary-pos-storage',
    }
  )
)
