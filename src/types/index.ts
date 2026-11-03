export type UserRole =
  | 'admin'
  | 'commissary_manager'
  | 'production_staff'
  | 'inventory_manager'
  | 'dispatch_staff'
  | 'store_manager'
  | 'cashier'
  | 'finance_staff'
  | 'attendance_manager'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  assignedLocationId: string
  avatarUrl?: string
}

export interface Location {
  id: string
  name: string
  code: string
  type: 'commissary' | 'store' | 'franchise' | 'counter'
  address: string
  phone: string
}

export interface Product {
  id: string
  name: string
  code: string
  category: 'Breads' | 'Pastries' | 'Cakes' | 'Beverages' | 'Seasonal'
  unit: string
  retailPrice: number
  wholesalePrice: number
  costPrice: number
  minStockLevel: number
  currentStock: number
  imageUrl?: string
  recipeId?: string
}

export interface Ingredient {
  id: string
  name: string
  code: string
  unit: 'kg' | 'g' | 'L' | 'ml' | 'pcs' | 'bags'
  currentStock: number
  minStockLevel: number
  unitCost: number
  supplier: string
}

export interface LocationInventory {
  id: string
  locationId: string
  productId: string
  productName: string
  currentStock: number
  minStockLevel: number
  lastUpdated: string
}

export interface RecipeItem {
  ingredientId: string
  ingredientName?: string
  quantity: number
  unit: string
}

export interface Recipe {
  id: string
  productId: string
  productName: string
  yieldQuantity: number
  yieldUnit: string
  ingredients: RecipeItem[]
  preparationTimeMinutes: number
  bakingTimeMinutes: number
  instructions?: string
}

export type OrderStatus =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'in_production'
  | 'dispatched'
  | 'delivered'
  | 'cancelled'

export interface OrderItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface Order {
  id: string
  orderNumber: string
  locationId: string
  locationName: string
  type: 'store_replenishment' | 'franchise' | 'business_catering'
  status: OrderStatus
  orderDate: string
  deliveryDate: string
  items: OrderItem[]
  totalAmount: number
  notes?: string
}

export type BatchStatus = 'planned' | 'mixing' | 'baking' | 'cooling' | 'completed' | 'cancelled'

export interface ProductionBatch {
  id: string
  batchNumber: string
  recipeId: string
  productId: string
  productName: string
  plannedYield: number
  actualYield?: number
  variance?: number
  status: BatchStatus
  scheduledDate: string
  startTime?: string
  endTime?: string
  assignedTo?: string
  notes?: string
}

export type MovementType =
  | 'purchase_in'
  | 'production_in'
  | 'production_out'
  | 'dispatch_out'
  | 'receive_in'
  | 'sale_out'
  | 'pullout_waste'
  | 'adjustment'

export interface StockMovement {
  id: string
  timestamp: string
  itemId: string
  itemName: string
  itemType: 'ingredient' | 'finished_product'
  locationId: string
  locationName: string
  type: MovementType
  quantity: number
  previousStock: number
  newStock: number
  referenceId?: string
  reason?: string
}

export type DispatchStatus = 'packing' | 'in_transit' | 'delivered' | 'received_with_discrepancy'

export interface DispatchItem {
  productId: string
  productName: string
  dispatchedQty: number
  receivedQty?: number
  discrepancyReason?: string
}

export interface Dispatch {
  id: string
  dispatchNumber: string
  orderId?: string
  sourceLocationId: string
  destinationLocationId: string
  destinationName: string
  vehicleNumber: string
  driverName: string
  driverPhone: string
  status: DispatchStatus
  departureTime: string
  deliveredTime?: string
  items: DispatchItem[]
  notes?: string
}

export interface PullOut {
  id: string
  locationId: string
  locationName: string
  date: string
  productId: string
  productName: string
  quantity: number
  reason: 'unsold_day_old' | 'expired' | 'damaged' | 'quality_issue'
  disposition: 'discarded' | 'discount_sale' | 'repurposed' | 'returned_to_commissary'
  reportedBy: string
}

export interface POSCartItem {
  productId: string
  productName: string
  retailPrice: number
  quantity: number
  subtotal: number
}

export interface POSSale {
  id: string
  receiptNumber: string
  locationId: string
  cashierId: string
  cashierName: string
  timestamp: string
  items: POSCartItem[]
  subtotal: number
  tax: number
  discount: number
  total: number
  paymentMethod: 'cash' | 'card' | 'qr_wallet'
  amountTendered: number
  change: number
  isOfflineSynced: boolean
}

export interface ShiftClosing {
  id: string
  locationId: string
  cashierId: string
  cashierName: string
  shiftNumber: string
  openedAt: string
  closedAt?: string
  openingFloat: number
  cashSales: number
  cardSales: number
  qrSales: number
  totalSales: number
  safeDrops?: number
  expectedCash: number
  countedCash: number
  variance: number
  status: 'open' | 'closed'
  notes?: string
}

export interface AttendanceRecord {
  id: string
  employeeId: string
  employeeName: string
  role: string
  locationId: string
  date: string
  clockIn: string
  clockOut?: string
  photoUrl?: string
  status: 'present' | 'late' | 'half_day'
}

export interface BillingInvoice {
  id: string
  invoiceNumber: string
  customerOrLocationId: string
  customerName: string
  issueDate: string
  dueDate: string
  totalAmount: number
  paidAmount: number
  balance: number
  status: 'unpaid' | 'partially_paid' | 'paid' | 'overdue'
  deliveries: string[]
}
