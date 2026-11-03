import { useState } from 'react'
import {
  Boxes,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Package,
  History,
} from 'lucide-react'
import { useBakeryStore } from '../../store/useBakeryStore'
import { useApp } from '../../context/AppContext'
import { formatCurrency, formatDateTime } from '../../lib/utils'

export const InventoryView: React.FC = () => {
  const { locations } = useApp()
  const {
    ingredients,
    products,
    locationInventories,
    movements,
    adjustIngredientStock,
    adjustProductStock,
    receivePurchaseOrder,
  } = useBakeryStore()

  const [activeTier, setActiveTier] = useState<'ingredients' | 'finished_goods' | 'ledger'>('ingredients')
  const [selectedLocationId, setSelectedLocationId] = useState<string>('all')
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Inbound PO Modal
  const [isPOModalOpen, setIsPOModalOpen] = useState(false)
  const [selectedIngredientId, setSelectedIngredientId] = useState(ingredients[0]?.id || '')
  const [poQuantity, setPoQuantity] = useState<number>(25)
  const [poUnitCost, setPoUnitCost] = useState<number>(ingredients[0]?.unitCost || 2.0)
  const [poSupplier, setPoSupplier] = useState<string>(ingredients[0]?.supplier || '')
  const [poNumber, setPoNumber] = useState<string>(`PO-${Math.floor(1000 + Math.random() * 9000)}`)

  // Manual Adjustment Modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false)
  const [adjustTargetType, setAdjustTargetType] = useState<'ingredient' | 'product'>('ingredient')
  const [adjustItemId, setAdjustItemId] = useState<string>(ingredients[0]?.id || '')
  const [adjustLocationId, setAdjustLocationId] = useState<string>('loc-1')
  const [adjustNewStock, setAdjustNewStock] = useState<number>(0)
  const [adjustReason, setAdjustReason] = useState<string>('Physical stock recount verification')

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Filtered ingredients
  const filteredIngredients = ingredients.filter((i) =>
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.supplier.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Filtered Finished Goods by Location
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Filtered Movement Ledger
  const filteredMovements = movements.filter((mov) => {
    const matchesSearch =
      mov.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (mov.referenceId && mov.referenceId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (mov.reason && mov.reason.toLowerCase().includes(searchQuery.toLowerCase()))

    if (ledgerTypeFilter === 'all') return matchesSearch
    return matchesSearch && mov.type === ledgerTypeFilter
  })

  // Inbound PO submit
  const handlePOSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    receivePurchaseOrder(selectedIngredientId, poQuantity, poUnitCost, poSupplier, poNumber)
    setIsPOModalOpen(false)
    const ing = ingredients.find((i) => i.id === selectedIngredientId)
    showToast(`Received ${poQuantity} units of ${ing?.name} via ${poNumber}! Commissary stock updated.`)
    setPoNumber(`PO-${Math.floor(1000 + Math.random() * 9000)}`)
  }

  // Stock Adjustment submit
  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (adjustTargetType === 'ingredient') {
      adjustIngredientStock(adjustItemId, adjustNewStock, adjustReason)
      const ing = ingredients.find((i) => i.id === adjustItemId)
      showToast(`Adjusted ${ing?.name} stock to ${adjustNewStock} ${ing?.unit}!`)
    } else {
      adjustProductStock(adjustItemId, adjustLocationId, adjustNewStock, adjustReason)
      const p = products.find((prod) => prod.id === adjustItemId)
      showToast(`Adjusted ${p?.name} stock to ${adjustNewStock} ${p?.unit}!`)
    }
    setIsAdjustModalOpen(false)
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
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-stone-900">Two-Tier Inventory & Stock Movement Ledger</h2>
            <p className="text-xs text-stone-500">
              Raw ingredient commissary stock, multi-branch finished goods, and automated immutable transaction audit trail.
            </p>
          </div>
        </div>

        {/* Quick Modal Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPOModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Receive Inbound PO</span>
          </button>
          <button
            onClick={() => setIsAdjustModalOpen(true)}
            className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Stock Adjustment</span>
          </button>
        </div>
      </div>

      {/* Tier Switcher Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center bg-stone-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTier('ingredients')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTier === 'ingredients'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Boxes className="w-3.5 h-3.5 inline mr-1 text-orange-600" />
            Tier 1: Raw Ingredients (Commissary)
          </button>
          <button
            onClick={() => setActiveTier('finished_goods')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTier === 'finished_goods'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Package className="w-3.5 h-3.5 inline mr-1 text-blue-600" />
            Tier 2: Finished Goods (Multi-Store)
          </button>
          <button
            onClick={() => setActiveTier('ledger')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTier === 'ledger'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <History className="w-3.5 h-3.5 inline mr-1 text-amber-600" />
            Automated Audit Ledger ({movements.length})
          </button>
        </div>

        {/* Global Search within active tier */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items, PO #, reason..."
            className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-stone-200 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* ================= TIER 1: RAW INGREDIENTS ================= */}
      {activeTier === 'ingredients' && (
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div>
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Boxes className="w-4 h-4 text-orange-600" />
                Commissary Raw Materials & Reorder Dashboard
              </h3>
              <p className="text-xs text-stone-500">Track current warehouse quantities, safety stock, and unit costs</p>
            </div>
            <span className="text-xs text-stone-400 font-bold">
              {filteredIngredients.length} Tracked Ingredients
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider font-bold text-[10px] border-y border-stone-200">
                <tr>
                  <th className="py-3 px-3">Ingredient</th>
                  <th className="py-3 px-3">Item Code</th>
                  <th className="py-3 px-3">Current Stock</th>
                  <th className="py-3 px-3">Min Safety Threshold</th>
                  <th className="py-3 px-3">Unit Valuation</th>
                  <th className="py-3 px-3">Total Asset Value</th>
                  <th className="py-3 px-3">Primary Supplier</th>
                  <th className="py-3 px-3">Stock Condition</th>
                  <th className="py-3 px-3 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredIngredients.map((ing) => {
                  const isLow = ing.currentStock <= ing.minStockLevel
                  const totalValue = ing.currentStock * ing.unitCost

                  return (
                    <tr key={ing.id} className="hover:bg-stone-50/70">
                      <td className="py-3 px-3 font-bold text-stone-900">{ing.name}</td>
                      <td className="py-3 px-3 font-mono font-bold text-stone-600">{ing.code}</td>
                      <td className={`py-3 px-3 font-extrabold text-sm ${isLow ? 'text-rose-600' : 'text-stone-900'}`}>
                        {ing.currentStock} {ing.unit}
                      </td>
                      <td className="py-3 px-3 text-stone-500">{ing.minStockLevel} {ing.unit}</td>
                      <td className="py-3 px-3 font-semibold text-stone-700">{formatCurrency(ing.unitCost)}/{ing.unit}</td>
                      <td className="py-3 px-3 font-bold text-stone-900">{formatCurrency(totalValue)}</td>
                      <td className="py-3 px-3 text-stone-600">{ing.supplier}</td>
                      <td className="py-3 px-3">
                        {isLow ? (
                          <span className="text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                            <AlertCircle className="w-3 h-3" /> Reorder Alert
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full w-fit inline-block">
                            Optimal
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedIngredientId(ing.id)
                            setPoUnitCost(ing.unitCost)
                            setPoSupplier(ing.supplier)
                            setIsPOModalOpen(true)
                          }}
                          className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-[11px] rounded-lg transition-colors"
                        >
                          + Order PO
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TIER 2: FINISHED GOODS MULTI-LOCATION ================= */}
      {activeTier === 'finished_goods' && (
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
            <div>
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600" />
                Finished Bakery Products Multi-Location Distribution
              </h3>
              <p className="text-xs text-stone-500">Real-time inventory levels across Commissary HQ and retail store counters</p>
            </div>

            {/* Location Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-500 font-medium">Filter by Store:</span>
              <select
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value)}
                className="text-xs border border-stone-200 rounded-lg p-1.5 bg-stone-50"
              >
                <option value="all">Consolidated (All Locations)</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider font-bold text-[10px] border-y border-stone-200">
                <tr>
                  <th className="py-3 px-3">Product Name & Photo</th>
                  <th className="py-3 px-3">SKU</th>
                  <th className="py-3 px-3 text-center bg-amber-50/60 font-extrabold text-stone-900">
                    Commissary Central Stock
                  </th>
                  {locations
                    .filter((l) => l.type !== 'commissary')
                    .map((store) => (
                      <th key={store.id} className="py-3 px-3 text-center">
                        <span className="block font-extrabold text-stone-800">{store.code}</span>
                        <span className="text-[9px] font-normal text-stone-400 truncate max-w-[80px] inline-block">
                          {store.name.split(' ')[0]}
                        </span>
                      </th>
                    ))}
                  <th className="py-3 px-3 text-right">Retail Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredProducts.map((prod) => (
                  <tr key={prod.id} className="hover:bg-stone-50/70">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          className="w-8 h-8 rounded-lg object-cover ring-1 ring-stone-200"
                        />
                        <span className="font-bold text-stone-900">{prod.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-stone-600">{prod.code}</td>
                    <td className="py-3 px-3 text-center bg-amber-50/60 font-extrabold text-sm text-amber-950">
                      {prod.currentStock} {prod.unit}
                    </td>

                    {locations
                      .filter((l) => l.type !== 'commissary')
                      .map((store) => {
                        const locInv = locationInventories.find(
                          (li) => li.locationId === store.id && li.productId === prod.id
                        )
                        const stock = locInv ? locInv.currentStock : 0
                        return (
                          <td key={store.id} className="py-3 px-3 text-center">
                            {stock > 0 ? (
                              <span className="font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded">
                                {stock}
                              </span>
                            ) : (
                              <span className="text-stone-300 font-mono">-</span>
                            )}
                          </td>
                        )
                      })}

                    <td className="py-3 px-3 text-right font-bold text-stone-900">
                      {formatCurrency(prod.retailPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TIER 3: AUTOMATED AUDIT LEDGER ================= */}
      {activeTier === 'ledger' && (
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
            <div>
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <History className="w-4 h-4 text-amber-600" />
                Immutable Stock Movement Audit Ledger
              </h3>
              <p className="text-xs text-stone-500">
                System-generated journal tracking every receipt, production deduction, dispatch, and sale
              </p>
            </div>

            {/* Movement Type Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-500 font-medium">Filter Action:</span>
              <select
                value={ledgerTypeFilter}
                onChange={(e) => setLedgerTypeFilter(e.target.value)}
                className="text-xs border border-stone-200 rounded-lg p-1.5 bg-stone-50 font-semibold"
              >
                <option value="all">All Movements</option>
                <option value="purchase_in">purchase_in (Inbound PO)</option>
                <option value="production_out">production_out (Baking Usage)</option>
                <option value="production_in">production_in (Finished Yield)</option>
                <option value="dispatch_out">dispatch_out (Store Shipments)</option>
                <option value="receive_in">receive_in (Store Receiving)</option>
                <option value="sale_out">sale_out (Counter POS)</option>
                <option value="pullout_waste">pullout_waste (Leftovers)</option>
                <option value="adjustment">adjustment (Recounts)</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider font-bold text-[10px] border-y border-stone-200">
                <tr>
                  <th className="py-3 px-3">Timestamp</th>
                  <th className="py-3 px-3">Item Name</th>
                  <th className="py-3 px-3">Location</th>
                  <th className="py-3 px-3">Action Type</th>
                  <th className="py-3 px-3 text-center">Quantity</th>
                  <th className="py-3 px-3 text-center">Previous Stock</th>
                  <th className="py-3 px-3 text-center">New Balance</th>
                  <th className="py-3 px-3">Reason / Ref Number</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredMovements.map((mov) => {
                  const isDeduction =
                    mov.type === 'production_out' ||
                    mov.type === 'dispatch_out' ||
                    mov.type === 'sale_out' ||
                    mov.type === 'pullout_waste'

                  return (
                    <tr key={mov.id} className="hover:bg-stone-50/70">
                      <td className="py-3 px-3 text-stone-400 font-mono text-[11px]">
                        {formatDateTime(mov.timestamp)}
                      </td>
                      <td className="py-3 px-3 font-semibold text-stone-900">
                        {mov.itemName}
                        <span className="ml-1.5 text-[9px] uppercase px-1 rounded bg-stone-100 text-stone-500">
                          {mov.itemType}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-stone-600">{mov.locationName}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            isDeduction
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {mov.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td
                        className={`py-3 px-3 text-center font-bold ${
                          isDeduction ? 'text-rose-600' : 'text-emerald-700'
                        }`}
                      >
                        {isDeduction ? '-' : '+'}
                        {mov.quantity}
                      </td>
                      <td className="py-3 px-3 text-center text-stone-500 font-mono">
                        {mov.previousStock}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-extrabold text-stone-900 bg-stone-50">
                        {mov.newStock}
                      </td>
                      <td className="py-3 px-3 text-stone-500 text-[11px] max-w-sm">
                        {mov.reason}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= MODAL: RECEIVE INBOUND PO ================= */}
      {isPOModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-bold text-stone-900 text-sm">Receive Inbound Purchase Order (PO)</h3>
              <button
                onClick={() => setIsPOModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handlePOSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Purchase Order (PO) Number</label>
                <input
                  type="text"
                  required
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  className="w-full p-2 border border-stone-200 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Select Raw Ingredient</label>
                <select
                  value={selectedIngredientId}
                  onChange={(e) => {
                    setSelectedIngredientId(e.target.value)
                    const ing = ingredients.find((i) => i.id === e.target.value)
                    if (ing) {
                      setPoUnitCost(ing.unitCost)
                      setPoSupplier(ing.supplier)
                    }
                  }}
                  className="w-full p-2 border border-stone-200 rounded-lg bg-white"
                >
                  {ingredients.map((ing) => (
                    <option key={ing.id} value={ing.id}>
                      {ing.name} ({ing.unit}) - Current: {ing.currentStock} {ing.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Received Quantity</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={poQuantity}
                    onChange={(e) => setPoQuantity(Number(e.target.value))}
                    className="w-full p-2 border border-stone-200 rounded-lg text-center font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Unit Cost ($)</label>
                  <input
                    type="number"
                    step={0.01}
                    value={poUnitCost}
                    onChange={(e) => setPoUnitCost(Number(e.target.value))}
                    className="w-full p-2 border border-stone-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Supplier Name</label>
                <input
                  type="text"
                  value={poSupplier}
                  onChange={(e) => setPoSupplier(e.target.value)}
                  className="w-full p-2 border border-stone-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsPOModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-xs"
                >
                  Confirm Inbound Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: MANUAL STOCK RECOUNT ADJUSTMENT ================= */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-bold text-stone-900 text-sm">Record Inventory Adjustment</h3>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Target Item Type</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAdjustTargetType('ingredient')
                      setAdjustItemId(ingredients[0]?.id || '')
                      setAdjustLocationId('loc-1')
                    }}
                    className={`flex-1 py-1.5 rounded-lg border font-bold text-xs ${
                      adjustTargetType === 'ingredient'
                        ? 'bg-amber-500 text-stone-950 border-amber-400'
                        : 'bg-stone-50 text-stone-600'
                    }`}
                  >
                    Raw Ingredient
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAdjustTargetType('product')
                      setAdjustItemId(products[0]?.id || '')
                    }}
                    className={`flex-1 py-1.5 rounded-lg border font-bold text-xs ${
                      adjustTargetType === 'product'
                        ? 'bg-amber-500 text-stone-950 border-amber-400'
                        : 'bg-stone-50 text-stone-600'
                    }`}
                  >
                    Finished Product
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Select Item</label>
                <select
                  value={adjustItemId}
                  onChange={(e) => setAdjustItemId(e.target.value)}
                  className="w-full p-2 border border-stone-200 rounded-lg bg-white"
                >
                  {adjustTargetType === 'ingredient'
                    ? ingredients.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.name} (Current: {i.currentStock} {i.unit})
                        </option>
                      ))
                    : products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.unit})
                        </option>
                      ))}
                </select>
              </div>

              {adjustTargetType === 'product' && (
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Location</label>
                  <select
                    value={adjustLocationId}
                    onChange={(e) => setAdjustLocationId(e.target.value)}
                    className="w-full p-2 border border-stone-200 rounded-lg bg-white"
                  >
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="font-semibold text-stone-700 block mb-1">New Verified Physical Count</label>
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  required
                  value={adjustNewStock}
                  onChange={(e) => setAdjustNewStock(Number(e.target.value))}
                  className="w-full p-2.5 border border-stone-200 rounded-lg font-bold text-sm text-center"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Mandatory Audit Reason</label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Month-end physical verification recount"
                  className="w-full p-2 border border-stone-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl shadow-xs"
                >
                  Save Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
