import React, { useState } from 'react'
import {
  RotateCcw,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Tag,
  Trash2,
  DollarSign,
  Layers,
  Building2,
} from 'lucide-react'
import { useBakeryStore } from '../../store/useBakeryStore'
import { useApp } from '../../context/AppContext'
import { formatCurrency, formatDateTime } from '../../lib/utils'
import type { PullOut } from '../../types'

export const PullOutsView: React.FC = () => {
  const { currentLocation, currentUser } = useApp()
  const { pullouts, products, recordPullOut } = useBakeryStore()

  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [reasonFilter, setReasonFilter] = useState<string>('all')

  // Log Pullout Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState('prd-1')
  const [quantityInput, setQuantityInput] = useState<number>(10)
  const [reasonInput, setReasonInput] = useState<PullOut['reason']>('day_old')
  const [dispositionInput, setDispositionInput] = useState<PullOut['disposition']>('discounted_sale')

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Filtered pullouts
  const filteredPullouts = pullouts.filter((p) => {
    const matchesSearch =
      p.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.locationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.reportedBy.toLowerCase().includes(searchQuery.toLowerCase())

    if (reasonFilter === 'all') return matchesSearch
    return matchesSearch && p.reason === reasonFilter
  })

  // Summary Metrics
  const totalPulledUnits = pullouts.reduce((acc, p) => acc + p.quantity, 0)
  const totalWriteOffCost = pullouts.reduce((acc, p) => {
    const prod = products.find((prod) => prod.id === p.productId)
    const cost = prod ? prod.wholesalePrice : 2.0
    return acc + p.quantity * cost
  }, 0)
  const promoRecoveredUnits = pullouts
    .filter((p) => p.disposition === 'discounted_sale')
    .reduce((acc, p) => acc + p.quantity, 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (quantityInput <= 0) {
      showToast('Please enter a quantity greater than 0!')
      return
    }

    recordPullOut(
      currentLocation.id,
      selectedProductId,
      quantityInput,
      reasonInput,
      dispositionInput,
      currentUser.name
    )

    setIsModalOpen(false)
    const prod = products.find((p) => p.id === selectedProductId)
    showToast(`Logged pull-out for ${quantityInput} pcs of ${prod?.name || 'product'}!`)
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
          <div className="p-3 rounded-2xl bg-stone-800 text-amber-400 shadow-xs">
            <RotateCcw className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900">
              Leftovers & Daily Pull-Outs
            </h1>
            <p className="text-xs text-stone-500">
              Day-old bread reconciliation, 50% promo conversion, staff meals, and scrap write-offs
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-2xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>Log Goods Pull-Out</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Total Units Pulled Out
            </span>
            <div className="text-2xl font-black text-stone-900 mt-1">{totalPulledUnits} pcs</div>
            <div className="text-xs text-stone-400 mt-0.5">Across all branch locations</div>
          </div>
          <div className="p-3 rounded-2xl bg-stone-100 text-stone-700">
            <RotateCcw className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Recovered in 50% Promos
            </span>
            <div className="text-2xl font-black text-amber-600 mt-1">
              {promoRecoveredUnits} pcs
            </div>
            <div className="text-xs text-stone-400 mt-0.5">Repurposed to retail POS promo shelf</div>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
            <Tag className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Estimated Value Loss
            </span>
            <div className="text-2xl font-black text-rose-600 mt-1">
              {formatCurrency(totalWriteOffCost)}
            </div>
            <div className="text-xs text-stone-400 mt-0.5">Wholesale production cost basis</div>
          </div>
          <div className="p-3 rounded-2xl bg-rose-50 text-rose-600">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-stone-200 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search pullout product, store or staff..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 text-stone-800"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {['all', 'day_old', 'damaged', 'expired', 'overproduction'].map((r) => (
            <button
              key={r}
              onClick={() => setReasonFilter(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors cursor-pointer ${
                reasonFilter === r
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
              }`}
            >
              {r.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Pullout Records Table */}
      <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200 text-stone-500 font-bold uppercase text-[10px]">
                <th className="pb-3">Timestamp</th>
                <th className="pb-3">Location</th>
                <th className="pb-3">Product Item</th>
                <th className="pb-3 text-right">Pulled Quantity</th>
                <th className="pb-3">Reason</th>
                <th className="pb-3">Disposition Action</th>
                <th className="pb-3">Staff Witness</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {filteredPullouts.map((po) => {
                const prod = products.find((p) => p.id === po.productId)
                return (
                  <tr key={po.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3 font-mono text-stone-500">
                      {formatDateTime(po.createdAt)}
                    </td>
                    <td className="py-3 font-bold text-stone-900">
                      {po.locationName}
                    </td>
                    <td className="py-3">
                      <span className="font-bold text-stone-900 block">{po.productName}</span>
                      <span className="text-[10px] text-stone-400 font-mono">
                        SKU: {prod?.code || 'SKU-00'}
                      </span>
                    </td>
                    <td className="py-3 text-right font-mono font-bold text-stone-900">
                      {po.quantity} pcs
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          po.reason === 'day_old'
                            ? 'bg-amber-100 text-amber-800'
                            : po.reason === 'damaged'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-stone-100 text-stone-800'
                        }`}
                      >
                        {po.reason.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          po.disposition === 'discounted_sale'
                            ? 'bg-emerald-100 text-emerald-800'
                            : po.disposition === 'staff_meal'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-stone-200 text-stone-700'
                        }`}
                      >
                        {po.disposition.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 text-stone-600 font-medium">
                      {po.reportedBy}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Pull-Out Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-stone-900 text-amber-400">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-stone-900">
                    Log Pull-Out / Leftover
                  </h3>
                  <p className="text-xs text-stone-500">Location: {currentLocation.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-stone-700 font-bold mb-1">Bakery Product Item</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-medium text-stone-800"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Quantity Pulled (Pcs)</label>
                <input
                  type="number"
                  min="1"
                  value={quantityInput}
                  onChange={(e) => setQuantityInput(parseInt(e.target.value) || 0)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-mono font-bold text-stone-900"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Pull-Out Reason</label>
                <select
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value as PullOut['reason'])}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-medium text-stone-800"
                >
                  <option value="day_old">Day-Old (End of Shelf Life)</option>
                  <option value="damaged">Transit / Display Damaged</option>
                  <option value="expired">Expired Beyond Safety Limit</option>
                  <option value="overproduction">Over-Replenishment Surplus</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Disposition Action</label>
                <select
                  value={dispositionInput}
                  onChange={(e) => setDispositionInput(e.target.value as PullOut['disposition'])}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-medium text-stone-800"
                >
                  <option value="discounted_sale">Discounted 50% Promo (POS Shelf)</option>
                  <option value="staff_meal">Staff Meal / Internal Consumption</option>
                  <option value="animal_feed">Animal Feed / Compost Recycling</option>
                  <option value="discard">Complete Discard / Disposal</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold cursor-pointer shadow-xs"
                >
                  Confirm & Write-off
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
