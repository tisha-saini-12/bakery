import React, { useState } from 'react'
import {
  Truck,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Phone,
  PackageCheck,
  Building2,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Layers,
} from 'lucide-react'
import { useBakeryStore } from '../../store/useBakeryStore'
import { useApp } from '../../context/AppContext'
import { formatDateTime } from '../../lib/utils'
import type { Dispatch } from '../../types'

export const DispatchView: React.FC = () => {
  const { currentLocation, currentUser } = useApp()
  const { dispatches, products, createDispatch, receiveDispatch } = useBakeryStore()

  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Create Dispatch Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [targetLocationId, setTargetLocationId] = useState('loc-2')
  const [vehicleNumber, setVehicleNumber] = useState('VAN-01 (Refrigerated 4°C)')
  const [driverName, setDriverName] = useState('Carlos Rivera')
  const [driverPhone, setDriverPhone] = useState('+1 (555) 019-2834')
  const [dispatchItemQuantities, setDispatchItemQuantities] = useState<Record<string, number>>({
    'prd-1': 100,
    'prd-2': 60,
  })

  // Receive Dispatch Modal State
  const [receivingDispatch, setReceivingDispatch] = useState<Dispatch | null>(null)
  const [receivedQuantities, setReceivedQuantities] = useState<Record<string, number>>({})
  const [discrepancyReasons, setDiscrepancyReasons] = useState<Record<string, string>>({})

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Filtered dispatches
  const filteredDispatches = dispatches.filter((d) => {
    const matchesSearch =
      d.dispatchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.destinationLocationName.toLowerCase().includes(searchQuery.toLowerCase())

    if (statusFilter === 'all') return matchesSearch
    return matchesSearch && d.status === statusFilter
  })

  // Handle open create modal
  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true)
  }

  // Submit new dispatch
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const items = Object.entries(dispatchItemQuantities)
      .filter(([_, qty]) => qty > 0)
      .map(([productId, dispatchedQty]) => ({ productId, dispatchedQty }))

    if (items.length === 0) {
      showToast('Please add at least one item quantity to dispatch!')
      return
    }

    const newDispatch = createDispatch(
      targetLocationId,
      items,
      vehicleNumber,
      driverName,
      driverPhone,
      undefined,
      'Morning peak replenishment run'
    )

    setIsCreateModalOpen(false)
    showToast(`Dispatch ${newDispatch.dispatchNumber} assigned to ${driverName} successfully!`)
  }

  // Handle open receive modal
  const handleOpenReceive = (dispatch: Dispatch) => {
    setReceivingDispatch(dispatch)
    const initialQty: Record<string, number> = {}
    dispatch.items.forEach((item) => {
      initialQty[item.productId] = item.dispatchedQty
    })
    setReceivedQuantities(initialQty)
    setDiscrepancyReasons({})
  }

  // Submit receive check
  const handleReceiveSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!receivingDispatch) return

    const receivedItems = receivingDispatch.items.map((item) => ({
      productId: item.productId,
      receivedQty: receivedQuantities[item.productId] ?? item.dispatchedQty,
      discrepancyReason: discrepancyReasons[item.productId],
    }))

    receiveDispatch(receivingDispatch.id, receivedItems)
    setReceivingDispatch(null)
    showToast(`Goods received and verified at store! Local inventory updated automatically.`)
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-stone-900 text-amber-400 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-sm font-bold border border-amber-500/30">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-stone-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-blue-500 text-white shadow-xs">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900">
              Dispatch & Logistics Receiving
            </h1>
            <p className="text-xs text-stone-500">
              Refrigerated van manifests, in-transit route telemetry, and store arrival verification
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Dispatch Manifest</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-stone-200 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search manifest, driver, or destination..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-stone-800"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {['all', 'preparing', 'in_transit', 'delivered'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Dispatches List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDispatches.map((dispatch) => {
          const totalUnits = dispatch.items.reduce((acc, i) => acc + i.dispatchedQty, 0)
          const isDelivered = dispatch.status === 'delivered'

          return (
            <div
              key={dispatch.id}
              className="p-5 rounded-3xl bg-white border border-stone-200 shadow-xs hover:border-blue-300 transition-all space-y-4 flex flex-col justify-between"
            >
              {/* Card Top */}
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-blue-600">
                      {dispatch.dispatchNumber}
                    </span>
                    <h3 className="text-sm font-extrabold text-stone-900 mt-0.5">
                      {dispatch.destinationLocationName}
                    </h3>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                      dispatch.status === 'delivered'
                        ? 'bg-emerald-100 text-emerald-800'
                        : dispatch.status === 'in_transit'
                        ? 'bg-amber-100 text-amber-800 animate-pulse'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {dispatch.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-stone-500 bg-stone-50/70 p-3 rounded-2xl border border-stone-100">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400">Driver & Van:</span>
                    <span className="font-semibold text-stone-800">
                      {dispatch.driverName} ({dispatch.vehicleNumber})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400">Driver Phone:</span>
                    <span className="font-mono text-stone-700 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-stone-400" />
                      {dispatch.driverPhone}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400">Departure:</span>
                    <span className="text-stone-700">{formatDateTime(dispatch.dispatchedAt)}</span>
                  </div>
                </div>

                {/* Items Manifest */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    Cargo Manifest ({totalUnits} total units):
                  </span>
                  <div className="space-y-1">
                    {dispatch.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs py-1 border-b border-stone-100 last:border-0"
                      >
                        <span className="text-stone-700 font-medium">{item.productName}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-stone-900">
                            {item.dispatchedQty} pcs
                          </span>
                          {item.receivedQty !== undefined && item.receivedQty !== item.dispatchedQty && (
                            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                              Rcvd: {item.receivedQty}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-stone-100">
                {isDelivered ? (
                  <div className="flex items-center justify-between text-xs text-emerald-700 font-bold bg-emerald-50 p-2.5 rounded-xl">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Delivered & Stocked
                    </span>
                    <span className="text-[11px] font-mono text-emerald-600">
                      {formatDateTime(dispatch.receivedAt || dispatch.dispatchedAt)}
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleOpenReceive(dispatch)}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <PackageCheck className="w-4 h-4" />
                    <span>Store Receiving Inspection</span>
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Create Dispatch Manifest Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-blue-500 text-white">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-stone-900">
                    Create Vehicle Dispatch Manifest
                  </h3>
                  <p className="text-xs text-stone-500">Central Commissary outbound delivery</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-stone-700 font-bold mb-1">Destination Location</label>
                <select
                  value={targetLocationId}
                  onChange={(e) => setTargetLocationId(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-medium text-stone-800 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="loc-2">Downtown Store #1</option>
                  <option value="loc-3">Uptown Branch #2</option>
                  <option value="loc-4">Westside Kiosk</option>
                  <option value="loc-5">Northside Franchise A</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Vehicle / Van Plate</label>
                  <input
                    type="text"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-medium text-stone-800"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Driver Name</label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-medium text-stone-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1.5">
                  Products to Dispatch (Units)
                </label>
                <div className="max-h-48 overflow-y-auto space-y-2 border border-stone-100 p-2 rounded-2xl bg-stone-50/50">
                  {products.slice(0, 5).map((prod) => (
                    <div
                      key={prod.id}
                      className="flex items-center justify-between p-2 bg-white rounded-xl border border-stone-200"
                    >
                      <span className="font-semibold text-stone-800">{prod.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-stone-400 text-[10px]">Qty:</span>
                        <input
                          type="number"
                          min="0"
                          value={dispatchItemQuantities[prod.id] || 0}
                          onChange={(e) =>
                            setDispatchItemQuantities({
                              ...dispatchItemQuantities,
                              [prod.id]: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-20 p-1.5 text-center font-mono font-bold bg-stone-50 border border-stone-300 rounded-lg"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer shadow-xs"
                >
                  Generate Manifest & Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Store Receiving Verification Modal */}
      {receivingDispatch && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-emerald-500 text-white">
                  <PackageCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-stone-900">
                    Store Arrival & Cargo Verification
                  </h3>
                  <p className="text-xs text-stone-500">
                    Manifest {receivingDispatch.dispatchNumber} &bull; Check for transit discrepancies
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReceivingDispatch(null)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReceiveSubmit} className="space-y-4 text-xs">
              <div className="space-y-3">
                {receivingDispatch.items.map((item) => {
                  const currentRcvd = receivedQuantities[item.productId] ?? item.dispatchedQty
                  const isDiscrepant = currentRcvd !== item.dispatchedQty

                  return (
                    <div
                      key={item.productId}
                      className="p-3 rounded-2xl border border-stone-200 bg-stone-50/50 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-stone-900">{item.productName}</span>
                        <span className="text-stone-400">
                          Dispatched: <strong className="text-stone-700">{item.dispatchedQty} pcs</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <label className="text-stone-600 font-medium">Actual Received:</label>
                        <input
                          type="number"
                          min="0"
                          value={currentRcvd}
                          onChange={(e) =>
                            setReceivedQuantities({
                              ...receivedQuantities,
                              [item.productId]: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-24 p-1.5 text-center font-mono font-bold bg-white border border-stone-300 rounded-lg"
                        />
                      </div>

                      {isDiscrepant && (
                        <div>
                          <input
                            type="text"
                            placeholder="Reason for discrepancy (e.g. crushed in transit, missing tray)..."
                            value={discrepancyReasons[item.productId] || ''}
                            onChange={(e) =>
                              setDiscrepancyReasons({
                                ...discrepancyReasons,
                                [item.productId]: e.target.value,
                              })
                            }
                            className="w-full p-2 bg-rose-50/50 border border-rose-200 text-rose-900 rounded-lg text-xs"
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setReceivingDispatch(null)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer shadow-xs"
                >
                  Confirm Receipt & Auto-Update Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
