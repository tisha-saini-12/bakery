import { useState } from 'react'
import {
  ShoppingCart,
  ChefHat,
  Play,
  CheckCircle2,
  Search,
  Plus,
  Clock,
  Layers,
  Eye,
} from 'lucide-react'
import { useBakeryStore } from '../../store/useBakeryStore'
import { useApp } from '../../context/AppContext'
import { formatCurrency } from '../../lib/utils'
import type { Order, OrderItem } from '../../types'

export const OrdersView: React.FC = () => {
  const { locations } = useApp()
  const {
    orders,
    products,
    recipes,
    approveOrder,
    sendOrderToProduction,
    bulkSendOrdersToProduction,
    createOrder,
  } = useBakeryStore()

  const [activeTab, setActiveTab] = useState<'matrix' | 'orders'>('matrix')
  const [orderSearch, setOrderSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // New Order Modal
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false)
  const [newOrderDestinationId, setNewOrderDestinationId] = useState<string>(
    locations.find((l) => l.type !== 'commissary')?.id || locations[1]?.id
  )
  const [newOrderItems, setNewOrderItems] = useState<{ productId: string; quantity: number }[]>([
    { productId: products[0]?.id || '', quantity: 50 },
  ])
  const [newOrderNotes, setNewOrderNotes] = useState('')

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Submitted & Approved orders waiting for baking
  const pendingOrders = orders.filter((o) => o.status === 'submitted' || o.status === 'approved')

  // Calculate Aggregated Demand Matrix across all non-cancelled orders for upcoming production
  const relevantOrders = orders.filter((o) => o.status !== 'cancelled')

  // List of stores that have placed orders
  const storeLocations = locations.filter((l) => l.type !== 'commissary')

  // Build matrix data: for each product, count by store
  const demandMatrix = products.map((prod) => {
    const storeQuantities: Record<string, number> = {}
    let totalNeeded = 0

    storeLocations.forEach((store) => {
      const storeOrders = relevantOrders.filter((o) => o.locationId === store.id)
      let storeTotal = 0
      storeOrders.forEach((o) => {
        const item = o.items.find((i) => i.productId === prod.id)
        if (item) storeTotal += item.quantity
      })
      storeQuantities[store.id] = storeTotal
      totalNeeded += storeTotal
    })

    const hasRecipe = recipes.some((r) => r.productId === prod.id)

    return {
      product: prod,
      storeQuantities,
      totalNeeded,
      hasRecipe,
    }
  }).filter((entry) => entry.totalNeeded > 0)

  // Filtered Orders List
  const filteredOrders = orders.filter((ord) => {
    const matchesSearch =
      ord.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
      ord.locationName.toLowerCase().includes(orderSearch.toLowerCase())
    if (statusFilter === 'all') return matchesSearch
    return matchesSearch && ord.status === statusFilter
  })

  // Bulk Send All Pending Orders to Production
  const handleBulkPushToKitchen = () => {
    const pendingIds = pendingOrders.map((o) => o.id)
    if (pendingIds.length === 0) {
      showToast('No pending orders to send to production.')
      return
    }
    bulkSendOrdersToProduction(pendingIds)
    showToast(`Successfully consolidated ${pendingIds.length} orders into Commissary production batches!`)
  }

  // Create Order Handler
  const handleCreateOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const targetLoc = locations.find((l) => l.id === newOrderDestinationId)
    if (!targetLoc) return

    const items: OrderItem[] = newOrderItems
      .filter((item) => item.quantity > 0)
      .map((item) => {
        const prod = products.find((p) => p.id === item.productId)
        const price = prod ? prod.wholesalePrice : 2.0
        return {
          productId: item.productId,
          productName: prod ? prod.name : 'Item',
          quantity: item.quantity,
          unitPrice: price,
          subtotal: Number((price * item.quantity).toFixed(2)),
        }
      })

    if (items.length === 0) return

    const totalAmt = items.reduce((acc, i) => acc + i.subtotal, 0)

    const created = createOrder({
      locationId: targetLoc.id,
      locationName: targetLoc.name,
      type: targetLoc.type === 'franchise' ? 'franchise' : 'store_replenishment',
      deliveryDate: 'Tomorrow, 06:00 AM',
      items,
      totalAmount: totalAmt,
      notes: newOrderNotes || 'Standard daily store replenishment',
    })

    setIsNewOrderModalOpen(false)
    showToast(`Order ${created.orderNumber} placed for ${targetLoc.name}!`)
  }

  const addOrderItemRow = () => {
    setNewOrderItems([...newOrderItems, { productId: products[0]?.id || '', quantity: 20 }])
  }

  const updateOrderItemRow = (index: number, productId: string, quantity: number) => {
    const updated = [...newOrderItems]
    updated[index] = { productId, quantity }
    setNewOrderItems(updated)
  }

  const removeOrderItemRow = (index: number) => {
    setNewOrderItems(newOrderItems.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-stone-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-amber-500/30 flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-stone-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-500 text-stone-950 shadow-xs">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-stone-900">Consolidated Order Intake & Aggregation</h2>
            <p className="text-xs text-stone-500">
              Aggregates orders across all company stores, franchises, and wholesale catering before the baking cut-off.
            </p>
          </div>
        </div>

        {/* Tab & Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-stone-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'matrix'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 inline mr-1 text-amber-600" />
              Consolidated Demand Matrix
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'orders'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5 inline mr-1 text-blue-600" />
              Store Orders List ({orders.length})
            </button>
          </div>

          <button
            onClick={() => setIsNewOrderModalOpen(true)}
            className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Place Store Order</span>
          </button>
        </div>
      </div>

      {/* ================= TAB 1: CONSOLIDATED DEMAND MATRIX ================= */}
      {activeTab === 'matrix' && (
        <div className="space-y-5">
          {/* Production Cut-off & Bulk Push Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-stone-900 via-stone-850 to-stone-800 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <Clock className="w-4 h-4" />
                <span>Tomorrow's Morning Bake Cut-off: 02:00 AM (Locked for Kitchen)</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Aggregated Bakery Demand: {demandMatrix.reduce((a, b) => a + b.totalNeeded, 0)} Items across {relevantOrders.length} Branch Orders
              </h3>
              <p className="text-xs text-stone-300 max-w-xl">
                One-click explosion: Automatically translates multi-store demand into optimized central bakery batches based on master recipe BOMs.
              </p>
            </div>

            <div className="flex items-center gap-2.5 self-start md:self-auto">
              <button
                onClick={handleBulkPushToKitchen}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-xs rounded-xl shadow-lg transition-transform active:scale-95 flex items-center gap-2"
              >
                <ChefHat className="w-4 h-4" />
                <span>Bulk Push to Kitchen ({pendingOrders.length} Pending)</span>
              </button>
            </div>
          </div>

          {/* Aggregated Demand Matrix Table */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-600" />
                  Store-by-Store Aggregated SKU Demand Matrix
                </h4>
                <p className="text-xs text-stone-500">Live quantities demanded for tomorrow's 06:00 AM dispatch</p>
              </div>
              <span className="text-[11px] font-bold text-stone-400">
                {demandMatrix.length} Scheduled SKUs
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider font-bold text-[10px] border-y border-stone-200">
                  <tr>
                    <th className="py-3 px-3">Product Name & SKU</th>
                    {storeLocations.map((loc) => (
                      <th key={loc.id} className="py-3 px-3 text-center">
                        <span className="block text-stone-900 font-extrabold">{loc.code}</span>
                        <span className="text-[9px] font-normal lowercase">{loc.type}</span>
                      </th>
                    ))}
                    <th className="py-3 px-3 text-center font-extrabold text-stone-900 bg-amber-50/70 border-x border-amber-200">
                      Total Production Demand
                    </th>
                    <th className="py-3 px-3 text-right">Recipe Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {demandMatrix.map(({ product, storeQuantities, totalNeeded, hasRecipe }) => (
                    <tr key={product.id} className="hover:bg-stone-50/70">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-8 h-8 rounded-lg object-cover ring-1 ring-stone-200"
                          />
                          <div>
                            <span className="font-bold text-stone-900 block">{product.name}</span>
                            <span className="text-[10px] text-stone-400 font-mono">{product.code}</span>
                          </div>
                        </div>
                      </td>

                      {storeLocations.map((loc) => {
                        const qty = storeQuantities[loc.id] || 0
                        return (
                          <td key={loc.id} className="py-3 px-3 text-center">
                            {qty > 0 ? (
                              <span className="font-extrabold text-stone-800 bg-stone-100 px-2 py-0.5 rounded text-xs">
                                {qty}
                              </span>
                            ) : (
                              <span className="text-stone-300 font-mono">-</span>
                            )}
                          </td>
                        )
                      })}

                      <td className="py-3 px-3 text-center bg-amber-50/70 border-x border-amber-200 font-extrabold text-stone-950 text-sm">
                        <span className="bg-amber-200/60 text-amber-950 px-2.5 py-1 rounded-lg">
                          {totalNeeded} {product.unit}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        {hasRecipe ? (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            BOM Configured
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            Needs Recipe
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: STORE ORDERS TABLE ================= */}
      {activeTab === 'orders' && (
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Status Filter Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { label: 'All Orders', val: 'all' },
                { label: 'Submitted', val: 'submitted' },
                { label: 'Approved', val: 'approved' },
                { label: 'In Production', val: 'in_production' },
                { label: 'Dispatched', val: 'dispatched' },
                { label: 'Delivered', val: 'delivered' },
              ].map((tab) => (
                <button
                  key={tab.val}
                  onClick={() => setStatusFilter(tab.val)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    statusFilter === tab.val
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="Search order # or store..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-stone-200 bg-stone-50 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Orders Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider font-bold text-[10px] border-y border-stone-200">
                <tr>
                  <th className="py-3 px-3">Order Number</th>
                  <th className="py-3 px-3">Ordering Branch</th>
                  <th className="py-3 px-3">Order Type</th>
                  <th className="py-3 px-3">Items Requested</th>
                  <th className="py-3 px-3">Delivery Date</th>
                  <th className="py-3 px-3">Wholesale Value</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-stone-50/70">
                    <td className="py-3 px-3 font-mono font-bold text-stone-900">{ord.orderNumber}</td>
                    <td className="py-3 px-3 font-bold text-stone-800">{ord.locationName}</td>
                    <td className="py-3 px-3">
                      <span className="text-[10px] font-semibold bg-stone-100 text-stone-700 px-2 py-0.5 rounded capitalize">
                        {ord.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-stone-600 max-w-xs truncate">
                      {ord.items.map((i) => `${i.quantity} ${i.productName}`).join(', ')}
                    </td>
                    <td className="py-3 px-3 text-stone-500">{ord.deliveryDate}</td>
                    <td className="py-3 px-3 font-extrabold text-stone-900">
                      {formatCurrency(ord.totalAmount)}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          ord.status === 'in_production'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : ord.status === 'approved'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : ord.status === 'dispatched'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : ord.status === 'delivered'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-stone-100 text-stone-800 border border-stone-200'
                        }`}
                      >
                        {ord.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedOrderDetails(ord)}
                          className="p-1 rounded hover:bg-stone-100 text-stone-500 hover:text-stone-900"
                          title="View Order Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {ord.status === 'submitted' && (
                          <button
                            onClick={() => {
                              approveOrder(ord.id)
                              showToast(`Order ${ord.orderNumber} approved!`)
                            }}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-[10px] rounded-lg shadow-2xs"
                          >
                            Approve
                          </button>
                        )}
                        {ord.status === 'approved' && (
                          <button
                            onClick={() => {
                              sendOrderToProduction(ord.id)
                              showToast(`Order ${ord.orderNumber} sent to kitchen floor!`)
                            }}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] rounded-lg shadow-2xs flex items-center gap-1"
                          >
                            <Play className="w-3 h-3" />
                            Send to Kitchen
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="font-bold text-stone-900 text-sm">
                  Order Details: {selectedOrderDetails.orderNumber}
                </h3>
                <p className="text-[11px] text-stone-500">
                  {selectedOrderDetails.locationName} &bull; Delivery: {selectedOrderDetails.deliveryDate}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-stone-50 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-stone-400">Delivery Notes:</span>
                <p className="text-stone-700 italic">{selectedOrderDetails.notes || 'None provided'}</p>
              </div>

              <div className="border border-stone-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 font-bold text-[10px] text-stone-500 uppercase">
                    <tr>
                      <th className="py-2 px-3">Item</th>
                      <th className="py-2 px-3 text-center">Qty</th>
                      <th className="py-2 px-3 text-right">Transfer Price</th>
                      <th className="py-2 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {selectedOrderDetails.items.map((i, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-semibold text-stone-900">{i.productName}</td>
                        <td className="py-2 px-3 text-center font-bold">{i.quantity}</td>
                        <td className="py-2 px-3 text-right">{formatCurrency(i.unitPrice)}</td>
                        <td className="py-2 px-3 text-right font-bold text-stone-900">
                          {formatCurrency(i.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between text-sm font-extrabold pt-2 text-stone-900">
                <span>Total Billing Amount:</span>
                <span>{formatCurrency(selectedOrderDetails.totalAmount)}</span>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-stone-100">
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Store Replenishment Order Modal */}
      {isNewOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="font-bold text-stone-900 text-sm">Create Store Replenishment Order</h3>
                <p className="text-[11px] text-stone-500">Order products from the Central Commissary for delivery</p>
              </div>
              <button
                onClick={() => setIsNewOrderModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateOrderSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Destination Branch</label>
                <select
                  value={newOrderDestinationId}
                  onChange={(e) => setNewOrderDestinationId(e.target.value)}
                  className="w-full p-2.5 border border-stone-200 rounded-xl bg-white"
                >
                  {locations
                    .filter((l) => l.type !== 'commissary')
                    .map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} ({loc.code})
                      </option>
                    ))}
                </select>
              </div>

              {/* Order Items List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-stone-700">Order Items</label>
                  <button
                    type="button"
                    onClick={addOrderItemRow}
                    className="text-[11px] font-bold text-amber-600 hover:text-amber-700"
                  >
                    + Add Product Line
                  </button>
                </div>

                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {newOrderItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <select
                        value={item.productId}
                        onChange={(e) => updateOrderItemRow(idx, e.target.value, item.quantity)}
                        className="flex-1 p-2 border border-stone-200 rounded-lg bg-white text-xs"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({formatCurrency(p.wholesalePrice)} wholesale)
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateOrderItemRow(idx, item.productId, Number(e.target.value))}
                        className="w-20 p-2 border border-stone-200 rounded-lg text-center font-bold text-xs"
                        placeholder="Qty"
                      />
                      {newOrderItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeOrderItemRow(idx)}
                          className="p-2 text-rose-500 hover:text-rose-700 font-bold"
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Special Packing / Delivery Instructions</label>
                <textarea
                  rows={2}
                  value={newOrderNotes}
                  onChange={(e) => setNewOrderNotes(e.target.value)}
                  placeholder="e.g. Please deliver before 6 AM morning rush"
                  className="w-full p-2 border border-stone-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsNewOrderModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl shadow-xs"
                >
                  Submit Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
