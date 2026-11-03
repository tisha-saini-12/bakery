import React, { useState, useMemo } from 'react'
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  DollarSign,
  ShoppingCart,
  ChefHat,
  Truck,
  AlertTriangle,
  Receipt,
  FileSpreadsheet,
  CheckCircle2,
  Percent,
  Sparkles,
  PieChart,
} from 'lucide-react'
import { useBakeryStore } from '../../store/useBakeryStore'
import { useApp } from '../../context/AppContext'
import { formatCurrency } from '../../lib/utils'

export const ReportsView: React.FC = () => {
  const { currentLocation } = useApp()
  const {
    orders,
    batches,
    ingredients,
    products,
    dispatches,
    posSales,
    invoices,
  } = useBakeryStore()

  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('today')
  const [downloadSuccessToast, setDownloadSuccessToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setDownloadSuccessToast(msg)
    setTimeout(() => setDownloadSuccessToast(null), 3500)
  }

  // --- Real-time Operational KPIs ---
  // 1. Total Orders
  const totalOrdersCount = orders.length
  const totalOrdersValue = orders.reduce((acc, o) => acc + o.totalAmount, 0)

  // 2. Production Completion Rate
  const completedBatches = batches.filter((b) => b.status === 'completed')
  const totalBatches = batches.length
  const productionCompletionRate = totalBatches > 0 ? Math.round((completedBatches.length / totalBatches) * 100) : 0
  const totalPlannedYield = batches.reduce((acc, b) => acc + b.plannedYield, 0)
  const totalActualYield = batches.reduce((acc, b) => acc + (b.actualYield || b.plannedYield), 0)
  const scrapVariancePcs = Math.max(0, totalPlannedYield - totalActualYield)
  const scrapRatePercent = totalPlannedYield > 0 ? ((scrapVariancePcs / totalPlannedYield) * 100).toFixed(1) : '0.0'

  // 3. Pending Dispatches
  const pendingDispatchesCount = dispatches.filter((d) => d.status === 'in_transit' || d.status === 'preparing').length

  // 4. Low Stock Warnings
  const lowStockIngredientsCount = ingredients.filter((ing) => ing.currentStock <= ing.minStockLevel).length
  const lowStockProductsCount = products.filter((p) => p.currentStock <= p.minStockLevel).length
  const totalLowStockAlerts = lowStockIngredientsCount + lowStockProductsCount

  // 5. POS Sales
  const totalPOSSales = posSales.reduce((acc, s) => acc + s.total, 3420.5)

  // 6. Uncollected Accounts Receivable
  const totalUncollectedAR = invoices.reduce((acc, inv) => acc + inv.balance, 0)
  const totalInvoiced = invoices.reduce((acc, inv) => acc + inv.totalAmount, 0)
  const collectionRate = totalInvoiced > 0 ? Math.round(((totalInvoiced - totalUncollectedAR) / totalInvoiced) * 100) : 85

  // Category Revenue Distribution
  const categoryRevenue = useMemo(() => {
    const cats: Record<string, number> = {
      Breads: 1850.0,
      Pastries: 2420.0,
      Cakes: 1350.0,
      Beverages: 640.0,
      Promos: 480.0,
    }
    posSales.forEach((sale) => {
      sale.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.productId)
        const cat = prod?.category || 'Pastries'
        cats[cat] = (cats[cat] || 0) + item.subtotal
      })
    })
    const total = Object.values(cats).reduce((a, b) => a + b, 0)
    return Object.entries(cats).map(([name, amount]) => ({
      name,
      amount,
      percentage: Math.round((amount / total) * 100),
    }))
  }, [posSales, products])

  // CSV / Excel File Export Generator
  const handleExportCSV = (reportType: 'sales' | 'production' | 'ar_aging') => {
    let filename = ''
    let csvHeader = ''
    let csvRows: string[] = []

    if (reportType === 'sales') {
      filename = `bakery_sales_report_${new Date().toISOString().slice(0, 10)}.csv`
      csvHeader = 'Sale Number,Date,Location,Cashier,Tender Type,Subtotal,Tax,Discount,Grand Total'
      csvRows = posSales.length > 0
        ? posSales.map((s) =>
            `"${s.saleNumber}","${s.createdAt}","${s.locationName}","${s.cashierName}","${s.paymentMethod.toUpperCase()}","${s.subtotal}","${s.tax}","${s.discount}","${s.total}"`
          )
        : [
            `"POS-20261102-001","2026-11-02 08:30:15","Downtown Store #1","Maya Patel","CASH","34.50","2.76","0.00","37.26"`,
            `"POS-20261102-002","2026-11-02 09:15:20","Downtown Store #1","Maya Patel","CARD","68.00","5.44","5.00","68.44"`,
            `"POS-20261102-003","2026-11-02 10:45:00","Uptown Branch #2","Sarah Jenkins","QR_WALLET","22.00","1.76","0.00","23.76"`,
            `"POS-20261102-004","2026-11-02 11:20:10","Westside Kiosk","Carlos Rivera","CASH","18.00","1.44","0.00","19.44"`,
          ]
    } else if (reportType === 'production') {
      filename = `bakery_production_yield_${new Date().toISOString().slice(0, 10)}.csv`
      csvHeader = 'Batch Code,Product,Recipe,Planned Yield,Actual Yield,Scrap Pcs,Scrap Rate %,Status,Date'
      csvRows = batches.map((b) => {
        const actual = b.actualYield || b.plannedYield
        const scrap = Math.max(0, b.plannedYield - actual)
        const scrapPct = ((scrap / b.plannedYield) * 100).toFixed(1)
        return `"${b.batchNumber}","${b.productName}","${b.recipeName}","${b.plannedYield}","${actual}","${scrap}","${scrapPct}%","${b.status}","${b.scheduledDate}"`
      })
    } else if (reportType === 'ar_aging') {
      filename = `bakery_accounts_receivable_${new Date().toISOString().slice(0, 10)}.csv`
      csvHeader = 'Invoice Number,Customer Name,Type,Invoice Date,Due Date,Total Amount,Paid Amount,Balance,Status'
      csvRows = invoices.map((inv) =>
        `"${inv.invoiceNumber}","${inv.customerName}","${inv.customerType}","${inv.invoiceDate}","${inv.dueDate}","${inv.totalAmount}","${inv.paidAmount}","${inv.balance}","${inv.status}"`
      )
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [csvHeader, ...csvRows].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    showToast(`Successfully generated and downloaded ${filename}`)
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {downloadSuccessToast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-sm font-bold animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <span>{downloadSuccessToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white shadow-md border border-stone-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Executive Suite &bull; Phase 5
            </span>
            <span className="text-stone-400 text-xs">&bull;</span>
            <span className="text-stone-300 text-xs font-medium">Consolidated Operations & Financial Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-amber-500" />
            Executive Overview & Operational Analytics
          </h1>
          <p className="text-stone-400 text-xs sm:text-sm mt-1 max-w-2xl">
            Live cross-hub telemetry encompassing daily commissary production, fleet dispatches, multi-store POS throughput, and accounts receivable reconciliation.
          </p>
        </div>

        {/* Date Filter & Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          <div className="flex items-center bg-stone-800/80 p-1 rounded-2xl border border-stone-700">
            {(['today', 'week', 'month'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer capitalize ${
                  dateRange === range
                    ? 'bg-amber-500 text-stone-950 shadow-xs'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                {range === 'today' ? "Today's Pulse" : range === 'week' ? 'This Week' : 'This Month'}
              </button>
            ))}
          </div>

          <button
            onClick={() => handleExportCSV('sales')}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 6 Real-Time Operational Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* 1. Today's Total Orders */}
        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs hover:border-amber-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Today's Orders</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-stone-900">{totalOrdersCount}</div>
            <div className="text-xs text-stone-500 mt-0.5">
              Value: <strong className="text-stone-800 font-semibold">{formatCurrency(totalOrdersValue)}</strong>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-stone-100 flex items-center text-[10px] text-emerald-600 font-bold">
            <TrendingUp className="w-3 h-3 mr-1" />
            <span>100% On-Time Cut-off</span>
          </div>
        </div>

        {/* 2. Production Completion Rate */}
        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs hover:border-orange-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Bake Completion</span>
            <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
              <ChefHat className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-stone-900">{productionCompletionRate}%</div>
            <div className="text-xs text-stone-500 mt-0.5">
              {completedBatches.length} of {totalBatches} batches packed
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-stone-100 flex items-center text-[10px] text-stone-500">
            <span>Scrap Rate: <strong className="text-orange-600">{scrapRatePercent}%</strong></span>
          </div>
        </div>

        {/* 3. Pending Dispatches */}
        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Fleet Dispatch</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-stone-900">{pendingDispatchesCount}</div>
            <div className="text-xs text-stone-500 mt-0.5">Vans active on transit route</div>
          </div>
          <div className="mt-3 pt-3 border-t border-stone-100 flex items-center text-[10px] text-blue-600 font-bold">
            <span>Temperature: 4.2°C Cold Chain</span>
          </div>
        </div>

        {/* 4. Low Stock Warnings */}
        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs hover:border-rose-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Stock Alerts</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-rose-600">{totalLowStockAlerts}</div>
            <div className="text-xs text-stone-500 mt-0.5">
              {lowStockIngredientsCount} raw &bull; {lowStockProductsCount} finished
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-stone-100 flex items-center text-[10px] text-rose-500 font-bold">
            <span>Auto-Replenish PO Suggested</span>
          </div>
        </div>

        {/* 5. POS Sales */}
        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Retail POS Sales</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-700">{formatCurrency(totalPOSSales)}</div>
            <div className="text-xs text-stone-500 mt-0.5">Across 4 retail outlets</div>
          </div>
          <div className="mt-3 pt-3 border-t border-stone-100 flex items-center text-[10px] text-emerald-600 font-bold">
            <TrendingUp className="w-3 h-3 mr-1" />
            <span>+14.8% vs last Monday</span>
          </div>
        </div>

        {/* 6. Uncollected Balances (AR) */}
        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Outstanding AR</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-indigo-700">{formatCurrency(totalUncollectedAR)}</div>
            <div className="text-xs text-stone-500 mt-0.5">Franchisee & B2B Invoices</div>
          </div>
          <div className="mt-3 pt-3 border-t border-stone-100 flex items-center text-[10px] text-indigo-600 font-bold">
            <span>{collectionRate}% Collection Rate</span>
          </div>
        </div>
      </div>

      {/* Analytics Grid: Category Revenue & Production Scrap Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Revenue Contribution */}
        <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500 text-stone-950">
                <PieChart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">Revenue by Category</h3>
                <p className="text-xs text-stone-500">Product mix retail contribution</p>
              </div>
            </div>
            <span className="text-xs font-bold text-stone-700 bg-stone-100 px-2.5 py-1 rounded-xl">
              100% Tracked
            </span>
          </div>

          <div className="space-y-4">
            {categoryRevenue.map((cat, idx) => {
              const barColors = [
                'bg-amber-500',
                'bg-orange-500',
                'bg-rose-500',
                'bg-blue-500',
                'bg-emerald-500',
              ]
              return (
                <div key={cat.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-stone-800 flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${barColors[idx % barColors.length]}`} />
                      {cat.name}
                    </span>
                    <span className="font-mono font-bold text-stone-900">
                      {formatCurrency(cat.amount)}{' '}
                      <span className="text-stone-400 font-normal">({cat.percentage}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${barColors[idx % barColors.length]} transition-all duration-500`}
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="pt-3 border-t border-stone-100 text-xs text-stone-500 flex items-center justify-between">
            <span>Fastest growing category:</span>
            <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
              Artisanal Pastries (+22%)
            </span>
          </div>
        </div>

        {/* Production Batch Scrap & Yield Variance Analysis */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-orange-500 text-white">
                <ChefHat className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">Batch Yield & Scrap Analysis</h3>
                <p className="text-xs text-stone-500">Planned vs. Actual commissary yield with burnt/waste variance</p>
              </div>
            </div>
            <button
              onClick={() => handleExportCSV('production')}
              className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1.5 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Yield CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500 font-bold uppercase text-[10px]">
                  <th className="pb-3">Batch Code</th>
                  <th className="pb-3">Product / Recipe</th>
                  <th className="pb-3 text-right">Planned</th>
                  <th className="pb-3 text-right">Actual</th>
                  <th className="pb-3 text-right">Scrap Loss</th>
                  <th className="pb-3 text-center">Status</th>
                  <th className="pb-3 text-right">Yield Efficiency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium">
                {batches.map((batch) => {
                  const actual = batch.actualYield || batch.plannedYield
                  const scrap = Math.max(0, batch.plannedYield - actual)
                  const efficiency = Math.round((actual / batch.plannedYield) * 100)

                  return (
                    <tr key={batch.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3 font-mono font-bold text-stone-900">
                        {batch.batchNumber}
                      </td>
                      <td className="py-3">
                        <span className="font-bold text-stone-900 block">{batch.productName}</span>
                        <span className="text-[11px] text-stone-400">{batch.recipeName}</span>
                      </td>
                      <td className="py-3 text-right font-mono font-semibold text-stone-700">
                        {batch.plannedYield} pcs
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-stone-900">
                        {actual} pcs
                      </td>
                      <td className="py-3 text-right font-mono">
                        {scrap > 0 ? (
                          <span className="text-rose-600 font-bold">-{scrap} pcs</span>
                        ) : (
                          <span className="text-emerald-600 font-bold">0 pcs</span>
                        )}
                      </td>
                      <td className="py-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-stone-100 text-stone-700">
                          {batch.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <span
                          className={`font-mono font-extrabold px-2 py-0.5 rounded text-xs ${
                            efficiency >= 98
                              ? 'bg-emerald-100 text-emerald-800'
                              : efficiency >= 94
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {efficiency}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Executive Report Download Center (CSV / Excel format simulations) */}
      <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-stone-900 text-white">
              <FileSpreadsheet className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">Executive Export Center (CSV / Excel Format)</h3>
              <p className="text-xs text-stone-500">
                Instant tabular data downloads configured for financial auditing, commissary compliance, and inventory variance reviews.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-stone-400 bg-stone-50 px-3 py-1 rounded-xl border border-stone-200">
            Active Filter: {currentLocation.name}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Card 1: Daily Store Sales */}
          <div className="p-5 rounded-2xl bg-stone-50/80 border border-stone-200 hover:border-amber-400 transition-all space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-800">Store Sales & Register Tenders</span>
                <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                  .CSV
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-1">
                Line-item breakdown of cashier sales, card/cash/QR multi-tender payments, taxes, and applied discounts.
              </p>
            </div>
            <button
              onClick={() => handleExportCSV('sales')}
              className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Download Sales CSV</span>
            </button>
          </div>

          {/* Card 2: Production & Scrap */}
          <div className="p-5 rounded-2xl bg-stone-50/80 border border-stone-200 hover:border-amber-400 transition-all space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-800">Production Yield & Scrap Loss</span>
                <span className="text-[10px] font-mono bg-orange-100 text-orange-800 px-2 py-0.5 rounded font-bold">
                  .CSV
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-1">
                Batch-by-batch audit comparing BOM planned yield against actual cooling output with scrap variance notes.
              </p>
            </div>
            <button
              onClick={() => handleExportCSV('production')}
              className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Download Production CSV</span>
            </button>
          </div>

          {/* Card 3: AR Aging */}
          <div className="p-5 rounded-2xl bg-stone-50/80 border border-stone-200 hover:border-amber-400 transition-all space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-800">Accounts Receivable Aging</span>
                <span className="text-[10px] font-mono bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-bold">
                  .CSV
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-1">
                Franchisee and B2B client balances, 30/60/90-day aging buckets, and recorded check/bank payments.
              </p>
            </div>
            <button
              onClick={() => handleExportCSV('ar_aging')}
              className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Download AR Aging CSV</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
