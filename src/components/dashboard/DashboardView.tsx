import { useState } from 'react'
import {
  ShoppingCart,
  ChefHat,
  Boxes,
  Truck,
  DollarSign,
  ArrowUpRight,
  Sparkles,
  Zap,
  Play,
  RotateCcw,
  History,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useBakeryStore } from '../../store/useBakeryStore'
import { formatCurrency, formatDateTime } from '../../lib/utils'

export const DashboardView: React.FC = () => {
  const { currentLocation, currentRole, setActiveModule } = useApp()

  // Live state from centralized bakery store
  const {
    orders,
    batches,
    ingredients,
    products,
    dispatches,
    posSales,
    movements,
    createOrder,
    sendOrderToProduction,
    startBatch,
    recordSale,
    resetToInitialData,
  } = useBakeryStore()

  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Derived live metrics
  const pendingOrdersCount = orders.filter((o) => o.status === 'submitted' || o.status === 'approved').length
  const activeBatches = batches.filter((b) => b.status === 'mixing' || b.status === 'baking' || b.status === 'cooling')
  const lowStockIngredients = ingredients.filter((ing) => ing.currentStock <= ing.minStockLevel)
  const inTransitCount = dispatches.filter((d) => d.status === 'in_transit').length
  const totalPOSSales = posSales.reduce((acc, s) => acc + s.total, 1840.5)

  // Simulation handlers to showcase reactive multi-module data flow
  const handleSimulateNewOrder = () => {
    const newOrd = createOrder({
      locationId: 'loc-2',
      locationName: 'Downtown Store #1',
      type: 'store_replenishment',
      deliveryDate: 'Tomorrow, 06:00 AM',
      items: [
        { productId: 'prd-1', productName: 'Butter Croissant', quantity: 100, unitPrice: 2.1, subtotal: 210.0 },
        { productId: 'prd-2', productName: 'Pain au Chocolat', quantity: 60, unitPrice: 2.6, subtotal: 156.0 },
      ],
      totalAmount: 366.0,
      notes: 'Urgent weekend replenishment request',
    })
    showToast(`Created order ${newOrd.orderNumber}! Orders count updated dynamically.`)
  }

  const handleSimulateSendToProduction = () => {
    const pendingOrd = orders.find((o) => o.status === 'submitted' || o.status === 'approved')
    if (pendingOrd) {
      sendOrderToProduction(pendingOrd.id)
      showToast(`Order ${pendingOrd.orderNumber} sent to kitchen! Production batches auto-scheduled.`)
    } else {
      showToast('No pending orders to send to production.')
    }
  }

  const handleSimulateStartBatch = () => {
    const plannedBatch = batches.find((b) => b.status === 'planned')
    if (plannedBatch) {
      startBatch(plannedBatch.id)
      showToast(`Batch ${plannedBatch.batchNumber} started! Raw ingredients deducted from Commissary stock.`)
    } else {
      showToast('No planned batches waiting to start.')
    }
  }

  const handleSimulatePOSSale = () => {
    const croissant = products.find((p) => p.id === 'prd-1')
    if (croissant) {
      recordSale(
        currentLocation.id,
        'usr-7',
        'Maya Patel',
        [{ productId: croissant.id, productName: croissant.name, retailPrice: croissant.retailPrice, quantity: 2, subtotal: croissant.retailPrice * 2 }],
        croissant.retailPrice * 2,
        0.5,
        0,
        croissant.retailPrice * 2 + 0.5,
        'cash',
        10.0,
        false
      )
      showToast(`Counter sale completed ($${(croissant.retailPrice * 2 + 0.5).toFixed(2)})! Stock deducted.`)
    }
  }

  const stats = [
    {
      title: "Today's Orders",
      value: `${orders.length} Orders`,
      sub: `${pendingOrdersCount} pending approval`,
      icon: ShoppingCart,
      color: 'bg-amber-500 text-white',
      trend: `${orders.filter((o) => o.status === 'in_production').length} in baking`,
      trendUp: true,
      onClick: () => setActiveModule('orders'),
    },
    {
      title: 'Active Baking Batches',
      value: `${activeBatches.length} Batches`,
      sub: `${activeBatches.reduce((acc, b) => acc + b.plannedYield, 0)} units in ovens`,
      icon: ChefHat,
      color: 'bg-orange-500 text-white',
      trend: 'Deck Oven #1 & #2 Active',
      trendUp: true,
      onClick: () => setActiveModule('production'),
    },
    {
      title: 'Low Stock Alerts',
      value: `${lowStockIngredients.length} Items`,
      sub: lowStockIngredients.map((i) => i.name.split(' ')[0]).join(', ') || 'All stock normal',
      icon: Boxes,
      color: lowStockIngredients.length > 0 ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white',
      trend: lowStockIngredients.length > 0 ? 'Below reorder threshold' : 'Stock levels optimal',
      trendUp: lowStockIngredients.length === 0,
      onClick: () => setActiveModule('inventory'),
    },
    {
      title: 'In-Transit Dispatches',
      value: `${inTransitCount} Vans En Route`,
      sub: `${dispatches.length} manifests today`,
      icon: Truck,
      color: 'bg-blue-500 text-white',
      trend: 'Fleet active',
      trendUp: true,
      onClick: () => setActiveModule('dispatch'),
    },
    {
      title: 'Total Counter Sales',
      value: formatCurrency(totalPOSSales),
      sub: `${posSales.length + 18} transactions today`,
      icon: DollarSign,
      color: 'bg-emerald-500 text-white',
      trend: 'Live register revenue',
      trendUp: true,
      onClick: () => setActiveModule('pos'),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-stone-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-amber-500/30 flex items-center gap-3 animate-in fade-in slide-in-from-top-3 duration-200">
          <Zap className="w-4 h-4 text-amber-400 animate-bounce flex-shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Location Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-stone-900 via-stone-850 to-stone-800 text-white shadow-lg">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Active Operational Hub: {currentLocation.name}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            Daily Bakery Production & Logistics Pulse
          </h2>
          <p className="text-stone-300 text-xs sm:text-sm mt-1 max-w-2xl">
            Live centralized operations across Commissary, 4 store outlets, and retail counters.
            Currently viewing with <span className="text-amber-400 font-bold">{currentRole.replace('_', ' ').toUpperCase()}</span> permissions.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setActiveModule('production')}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5"
          >
            <ChefHat className="w-4 h-4" />
            <span>Open Production Board</span>
          </button>
        </div>
      </div>

      {/* Reactive Simulation Controls Toolbar */}
      <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-500 text-stone-950">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-amber-950 block">Interactive Mock Store Simulation:</span>
            <span className="text-[11px] text-amber-800">
              Test dynamic cross-module data propagation in real-time (Orders &rarr; Kitchen &rarr; Stock &rarr; POS)
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSimulateNewOrder}
            className="px-3 py-1.5 bg-white hover:bg-stone-50 border border-amber-300 text-stone-800 text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-amber-600" />
            + New Order
          </button>
          <button
            onClick={handleSimulateSendToProduction}
            className="px-3 py-1.5 bg-white hover:bg-stone-50 border border-amber-300 text-stone-800 text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1"
          >
            <Play className="w-3.5 h-3.5 text-blue-600" />
            Order &rarr; Kitchen
          </button>
          <button
            onClick={handleSimulateStartBatch}
            className="px-3 py-1.5 bg-white hover:bg-stone-50 border border-amber-300 text-stone-800 text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1"
          >
            <ChefHat className="w-3.5 h-3.5 text-orange-600" />
            Start Batch & Deduct Stock
          </button>
          <button
            onClick={handleSimulatePOSSale}
            className="px-3 py-1.5 bg-white hover:bg-stone-50 border border-amber-300 text-stone-800 text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1"
          >
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            Simulate POS Sale
          </button>
          <button
            onClick={() => {
              resetToInitialData()
              showToast('Reset all store data back to initial clean state!')
            }}
            title="Reset Mock State"
            className="p-1.5 bg-white hover:bg-rose-50 border border-stone-200 text-stone-500 hover:text-rose-600 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <div
              key={i}
              onClick={stat.onClick}
              className="p-4 rounded-xl bg-white border border-stone-200 shadow-xs hover:shadow-md hover:border-amber-400 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-stone-500">{stat.title}</span>
                <div className={`p-2 rounded-lg ${stat.color} shadow-xs group-hover:scale-110 transition-transform`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl font-extrabold text-stone-900 tracking-tight">{stat.value}</div>
              <p className="text-[11px] text-stone-500 mt-0.5">{stat.sub}</p>
              <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between text-[10px]">
                <span className={`font-semibold ${stat.trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {stat.trend}
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-600 transition-colors" />
              </div>
            </div>
          )
        })}
      </div>

      {/* Middle Grid: Active Baking Batches + Consolidated Orders Intake */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active Production Batches (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
            <div>
              <h3 className="font-bold text-stone-900 text-sm sm:text-base flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-amber-600" />
                Commissary Baking Batches in Progress ({batches.length})
              </h3>
              <p className="text-xs text-stone-500">Live production tracking across mixing, ovens, and cooling racks</p>
            </div>
            <button
              onClick={() => setActiveModule('production')}
              className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              View All Batches <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {batches.slice(0, 5).map((batch) => {
              const progressPct =
                batch.status === 'completed'
                  ? 100
                  : batch.status === 'cooling'
                  ? 85
                  : batch.status === 'baking'
                  ? 65
                  : batch.status === 'mixing'
                  ? 30
                  : 10

              const statusBadgeColor =
                batch.status === 'completed'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  : batch.status === 'baking'
                  ? 'bg-orange-100 text-orange-800 border-orange-200'
                  : batch.status === 'mixing'
                  ? 'bg-blue-100 text-blue-800 border-blue-200'
                  : 'bg-stone-100 text-stone-800 border-stone-200'

              return (
                <div key={batch.id} className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/50 hover:bg-stone-50 transition-colors">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-stone-700 bg-stone-200 px-1.5 py-0.5 rounded text-[10px]">
                        {batch.batchNumber}
                      </span>
                      <span className="font-bold text-stone-900">{batch.productName}</span>
                    </div>
                    <span className="font-bold text-stone-700">{batch.plannedYield} pcs planned</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-stone-500 mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border capitalize ${statusBadgeColor}`}>
                      {batch.status}
                    </span>
                    <span className="text-stone-400 text-[10px]">
                      {batch.assignedTo || 'Unassigned'} &bull; {batch.startTime || 'Not started'}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        batch.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Incoming Daily Orders (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
              <div>
                <h3 className="font-bold text-stone-900 text-sm sm:text-base flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-amber-600" />
                  Store Orders Intake ({orders.length})
                </h3>
                <p className="text-xs text-stone-500">Replenishment demand aggregated across locations</p>
              </div>
              <button
                onClick={() => setActiveModule('orders')}
                className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
              >
                Orders Board <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {orders.slice(0, 4).map((ord) => (
                <div key={ord.id} className="p-3 rounded-xl border border-stone-200 hover:border-stone-300 transition-colors">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-stone-900">{ord.locationName}</span>
                    <span className="font-extrabold text-stone-900">{formatCurrency(ord.totalAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-stone-500 mb-2">
                    <span>{ord.items.length} SKUs ({ord.items.reduce((a, b) => a + b.quantity, 0)} items)</span>
                    <span className="text-[10px] text-stone-400 font-mono">{ord.orderNumber}</span>
                  </div>
                  <span
                    className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border capitalize ${
                      ord.status === 'in_production'
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : ord.status === 'approved'
                        ? 'bg-blue-100 text-blue-800 border-blue-200'
                        : ord.status === 'dispatched'
                        ? 'bg-purple-100 text-purple-800 border-purple-200'
                        : ord.status === 'delivered'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : 'bg-stone-100 text-stone-800 border-stone-200'
                    }`}
                  >
                    {ord.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
            <span className="text-stone-500">Total Pipeline Value:</span>
            <span className="font-bold text-stone-900">
              {formatCurrency(orders.reduce((acc, o) => acc + o.totalAmount, 0))}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Stock Movement Ledger Preview */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-amber-600" />
            <div>
              <h3 className="font-bold text-stone-900 text-sm sm:text-base">
                Live Inventory Movement Ledger (Audit Trail)
              </h3>
              <p className="text-xs text-stone-500">
                Automated stock updates triggered by Production, Dispatches, and POS sales
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveModule('inventory')}
            className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
          >
            Full Ledger <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider font-bold text-[10px] border-y border-stone-200">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Item Name</th>
                <th className="py-2.5 px-3">Location</th>
                <th className="py-2.5 px-3">Action Type</th>
                <th className="py-2.5 px-3">Qty</th>
                <th className="py-2.5 px-3">Balance After</th>
                <th className="py-2.5 px-3">Reason / Ref</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {movements.slice(0, 5).map((mov) => {
                const isDeduction =
                  mov.type === 'production_out' ||
                  mov.type === 'dispatch_out' ||
                  mov.type === 'sale_out' ||
                  mov.type === 'pullout_waste'

                return (
                  <tr key={mov.id} className="hover:bg-stone-50/70">
                    <td className="py-2.5 px-3 text-stone-400 font-mono text-[11px]">
                      {formatDateTime(mov.timestamp)}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-stone-900">
                      {mov.itemName}
                      <span className="ml-1.5 text-[9px] uppercase px-1 rounded bg-stone-100 text-stone-500">
                        {mov.itemType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-stone-600">{mov.locationName}</td>
                    <td className="py-2.5 px-3">
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
                      className={`py-2.5 px-3 font-bold ${
                        isDeduction ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {isDeduction ? '-' : '+'}
                      {mov.quantity}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-stone-800">
                      {mov.newStock}
                    </td>
                    <td className="py-2.5 px-3 text-stone-500 text-[11px] truncate max-w-xs">
                      {mov.reason}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
