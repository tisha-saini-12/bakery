import React, { useState } from 'react'
import {
  FileSpreadsheet,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  Filter,
  Download,
  Printer,
  Calendar,
  Building2,
  Clock,
  Sparkles,
} from 'lucide-react'
import { useBakeryStore } from '../../store/useBakeryStore'
import { formatCurrency } from '../../lib/utils'
import type { BillingInvoice } from '../../types'

export const BillingView: React.FC = () => {
  const { invoices, recordPayment } = useBakeryStore()

  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Payment Modal
  const [payingInvoice, setPayingInvoice] = useState<BillingInvoice | null>(null)
  const [paymentAmountInput, setPaymentAmountInput] = useState<number>(0)
  const [paymentMethodInput, setPaymentMethodInput] = useState<'bank_transfer' | 'check' | 'cash'>('bank_transfer')

  // Statement Preview Modal
  const [viewingStatement, setViewingStatement] = useState<BillingInvoice | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Aging balances summary
  const totalInvoiced = invoices.reduce((acc, inv) => acc + inv.totalAmount, 0)
  const totalCollected = invoices.reduce((acc, inv) => acc + inv.paidAmount, 0)
  const totalOutstanding = invoices.reduce((acc, inv) => acc + inv.balance, 0)

  // Filtered invoices
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchQuery.toLowerCase())

    if (statusFilter === 'all') return matchesSearch
    return matchesSearch && inv.status === statusFilter
  })

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!payingInvoice) return

    recordPayment(payingInvoice.id, paymentAmountInput)
    showToast(`Payment of ${formatCurrency(paymentAmountInput)} recorded for ${payingInvoice.invoiceNumber}!`)
    setPayingInvoice(null)
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
          <div className="p-3 rounded-xl bg-indigo-600 text-white shadow-xs">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-stone-900">Billing Statements & Accounts Receivable</h2>
            <p className="text-xs text-stone-500">
              Delivery-linked invoicing for franchisees and wholesale corporate catering accounts.
            </p>
          </div>
        </div>

        <button
          onClick={() => showToast('Statement batch generated for all franchise deliveries!')}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Generate Weekly Statements</span>
        </button>
      </div>

      {/* Accounts Receivable Aging Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <span className="text-xs font-semibold text-stone-500 block">Total Invoiced Billing</span>
          <span className="text-2xl font-black text-stone-900 mt-1 block">
            {formatCurrency(totalInvoiced)}
          </span>
          <span className="text-[11px] text-stone-400">Delivered stock value</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <span className="text-xs font-semibold text-stone-500 block">Collections Received</span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">
            {formatCurrency(totalCollected)}
          </span>
          <span className="text-[11px] text-emerald-700 font-semibold">
            {totalInvoiced > 0 ? ((totalCollected / totalInvoiced) * 100).toFixed(0) : 0}% Collection Rate
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-300 shadow-xs">
          <span className="text-xs font-bold text-amber-900 block">Outstanding AR Balance</span>
          <span className="text-2xl font-black text-amber-950 mt-1 block">
            {formatCurrency(totalOutstanding)}
          </span>
          <span className="text-[11px] text-rose-700 font-bold">Pending customer payment</span>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { label: 'All Invoices', val: 'all' },
              { label: 'Unpaid', val: 'unpaid' },
              { label: 'Partially Paid', val: 'partially_paid' },
              { label: 'Fully Paid', val: 'paid' },
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

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search invoice # or client..."
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-stone-200 bg-stone-50 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider font-bold text-[10px] border-y border-stone-200">
              <tr>
                <th className="py-3 px-3">Invoice #</th>
                <th className="py-3 px-3">Client / Branch</th>
                <th className="py-3 px-3">Issue Date</th>
                <th className="py-3 px-3">Due Date</th>
                <th className="py-3 px-3">Linked Deliveries</th>
                <th className="py-3 px-3">Total Amount</th>
                <th className="py-3 px-3">Paid Amount</th>
                <th className="py-3 px-3">Balance Due</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-stone-50/70">
                  <td className="py-3 px-3 font-mono font-bold text-stone-900">{inv.invoiceNumber}</td>
                  <td className="py-3 px-3 font-bold text-stone-800">{inv.customerName}</td>
                  <td className="py-3 px-3 text-stone-500 font-mono text-[11px]">{inv.issueDate}</td>
                  <td className="py-3 px-3 text-stone-500 font-mono text-[11px]">{inv.dueDate}</td>
                  <td className="py-3 px-3">
                    <div className="flex flex-wrap gap-1">
                      {inv.deliveries.map((d, i) => (
                        <span key={i} className="text-[10px] bg-stone-100 px-1.5 py-0.2 rounded font-mono text-stone-600">
                          {d}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-3 font-bold text-stone-900">{formatCurrency(inv.totalAmount)}</td>
                  <td className="py-3 px-3 text-emerald-700 font-semibold">{formatCurrency(inv.paidAmount)}</td>
                  <td className="py-3 px-3 font-black text-stone-950">{formatCurrency(inv.balance)}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                        inv.status === 'paid'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : inv.status === 'partially_paid'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {inv.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setViewingStatement(inv)}
                        className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded text-[11px] font-semibold"
                      >
                        Statement
                      </button>
                      {inv.balance > 0 && (
                        <button
                          onClick={() => {
                            setPayingInvoice(inv)
                            setPaymentAmountInput(inv.balance)
                          }}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[11px] font-bold"
                        >
                          Record Payment
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

      {/* Record Payment Modal */}
      {payingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="font-bold text-stone-900 text-sm">
                  Record Payment for {payingInvoice.invoiceNumber}
                </h3>
                <p className="text-[11px] text-stone-500">{payingInvoice.customerName}</p>
              </div>
              <button
                onClick={() => setPayingInvoice(null)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-stone-50 rounded-xl flex justify-between">
                <span className="text-stone-600">Current Outstanding Balance:</span>
                <span className="font-extrabold text-stone-900">{formatCurrency(payingInvoice.balance)}</span>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Payment Amount ($)</label>
                <input
                  type="number"
                  min={1}
                  max={payingInvoice.balance}
                  step={0.01}
                  required
                  value={paymentAmountInput}
                  onChange={(e) => setPaymentAmountInput(Number(e.target.value))}
                  className="w-full p-2.5 border border-stone-300 rounded-xl text-center text-lg font-black text-stone-900"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Payment Method</label>
                <select
                  value={paymentMethodInput}
                  onChange={(e) => setPaymentMethodInput(e.target.value as any)}
                  className="w-full p-2 border border-stone-200 rounded-lg bg-white"
                >
                  <option value="bank_transfer">Electronic Bank Wire / ACH</option>
                  <option value="check">Company Check</option>
                  <option value="cash">Cash Tender</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setPayingInvoice(null)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-xs"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Statement Preview Modal */}
      {viewingStatement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-bold text-stone-900 text-sm">Customer Billing Statement</h3>
              <button
                onClick={() => setViewingStatement(null)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold"
              >
                &times;
              </button>
            </div>

            <div className="p-4 bg-stone-50 rounded-xl space-y-3 text-xs">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-extrabold text-stone-900 text-sm">{viewingStatement.customerName}</h4>
                  <p className="text-stone-500 text-[11px]">Statement Ref: {viewingStatement.invoiceNumber}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-stone-400 block font-mono">Issue: {viewingStatement.issueDate}</span>
                  <span className="text-[10px] text-stone-400 block font-mono">Due: {viewingStatement.dueDate}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-stone-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-stone-600">Total Billed Deliveries:</span>
                  <strong className="text-stone-900">{formatCurrency(viewingStatement.totalAmount)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">Payments Credited:</span>
                  <strong className="text-emerald-700">-{formatCurrency(viewingStatement.paidAmount)}</strong>
                </div>
                <div className="flex justify-between text-sm font-black pt-2 border-t border-stone-200">
                  <span>Balance Due:</span>
                  <span className="text-indigo-600">{formatCurrency(viewingStatement.balance)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-xl flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Statement</span>
              </button>
              <button
                onClick={() => setViewingStatement(null)}
                className="px-4 py-2 bg-stone-900 text-white font-bold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
