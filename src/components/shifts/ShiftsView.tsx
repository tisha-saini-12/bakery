import React, { useState } from 'react'
import {
  Receipt,
  DollarSign,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  ArrowDownCircle,
  Clock,
  Sparkles,
  History,
  ShieldCheck,
  Plus,
} from 'lucide-react'
import { useBakeryStore } from '../../store/useBakeryStore'
import { useApp } from '../../context/AppContext'
import { formatCurrency, formatDateTime } from '../../lib/utils'

export const ShiftsView: React.FC = () => {
  const { currentLocation, currentUser } = useApp()
  const { shifts, openShift, recordSafeDrop, closeShift } = useBakeryStore()

  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Modals
  const [isOpenShiftModalOpen, setIsOpenShiftModalOpen] = useState(false)
  const [openingFloatInput, setOpeningFloatInput] = useState<number>(100.0)

  const [isSafeDropModalOpen, setIsSafeDropModalOpen] = useState(false)
  const [safeDropAmountInput, setSafeDropAmountInput] = useState<number>(150.0)

  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false)
  const [countedCashInput, setCountedCashInput] = useState<number>(0)
  const [closingNotesInput, setClosingNotesInput] = useState<string>('')

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Find active open shift for this location
  const activeShift = shifts.find(
    (s) => s.locationId === currentLocation.id && s.status === 'open'
  )

  const handleOpenShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    openShift(currentLocation.id, currentUser.id, currentUser.name, openingFloatInput)
    setIsOpenShiftModalOpen(false)
    showToast(`New shift opened with ${formatCurrency(openingFloatInput)} opening float!`)
  }

  const handleSafeDropSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeShift) return
    recordSafeDrop(activeShift.id, safeDropAmountInput)
    setIsSafeDropModalOpen(false)
    showToast(`Safe drop of ${formatCurrency(safeDropAmountInput)} recorded!`)
  }

  const handleCloseShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeShift) return
    closeShift(
      activeShift.id,
      countedCashInput,
      closingNotesInput || 'Shift verified and closed by cashier'
    )
    setIsCloseShiftModalOpen(false)
    const variance = countedCashInput - activeShift.expectedCash
    showToast(
      `Shift ${activeShift.shiftNumber} closed! Variance: ${formatCurrency(variance)}`
    )
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
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-stone-900">Shift Closing & Cash Drawer Reconciliation</h2>
            <p className="text-xs text-stone-500">
              Opening float declarations, mid-shift safe drops, and end-of-shift over/short variance balancing.
            </p>
          </div>
        </div>

        {/* Action button */}
        {activeShift ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSafeDropModalOpen(true)}
              className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl border border-stone-200 shadow-xs transition-colors flex items-center gap-1.5"
            >
              <ArrowDownCircle className="w-3.5 h-3.5 text-stone-600" />
              <span>Safe Drop</span>
            </button>
            <button
              onClick={() => {
                setCountedCashInput(activeShift.expectedCash)
                setIsCloseShiftModalOpen(true)
              }}
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Close Shift</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsOpenShiftModalOpen(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Unlock className="w-4 h-4" />
            <span>Open Register Shift</span>
          </button>
        )}
      </div>

      {/* Current Active Shift Status Card */}
      {activeShift ? (
        <div className="bg-white p-6 rounded-2xl border border-amber-300 ring-2 ring-amber-400/20 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-stone-900 text-base">Active Shift: {activeShift.shiftNumber}</h3>
                  <span className="text-[10px] uppercase font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    Register Open
                  </span>
                </div>
                <p className="text-xs text-stone-500">
                  Cashier: <strong className="text-stone-800">{activeShift.cashierName}</strong> &bull; Opened: {formatDateTime(activeShift.openedAt)}
                </p>
              </div>
            </div>

            <span className="text-xs font-mono font-bold text-stone-400 bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-200">
              Drawer: {currentLocation.name}
            </span>
          </div>

          {/* Shift Financial Breakdown Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
              <span className="text-[11px] font-semibold text-stone-500 block">Opening Float</span>
              <span className="text-lg font-extrabold text-stone-900 mt-1 block">
                {formatCurrency(activeShift.openingFloat)}
              </span>
              <span className="text-[10px] text-stone-400">Cash declared at open</span>
            </div>

            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
              <span className="text-[11px] font-semibold text-stone-500 block">Cash Sales</span>
              <span className="text-lg font-extrabold text-stone-900 mt-1 block">
                {formatCurrency(activeShift.cashSales)}
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold">In drawer</span>
            </div>

            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
              <span className="text-[11px] font-semibold text-stone-500 block">Credit/Debit Sales</span>
              <span className="text-lg font-extrabold text-stone-900 mt-1 block">
                {formatCurrency(activeShift.cardSales)}
              </span>
              <span className="text-[10px] text-stone-400">Bank terminal</span>
            </div>

            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
              <span className="text-[11px] font-semibold text-stone-500 block">QR / E-Wallet</span>
              <span className="text-lg font-extrabold text-stone-900 mt-1 block">
                {formatCurrency(activeShift.qrSales)}
              </span>
              <span className="text-[10px] text-stone-400">Digital wallet</span>
            </div>

            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
              <span className="text-[11px] font-semibold text-stone-500 block">Mid-Shift Safe Drops</span>
              <span className="text-lg font-extrabold text-amber-700 mt-1 block">
                -{formatCurrency(activeShift.safeDrops || 0)}
              </span>
              <span className="text-[10px] text-stone-400">Deposited to safe</span>
            </div>

            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-300">
              <span className="text-[11px] font-bold text-amber-900 block">Expected Drawer Cash</span>
              <span className="text-lg font-black text-amber-950 mt-1 block">
                {formatCurrency(activeShift.expectedCash)}
              </span>
              <span className="text-[10px] text-amber-800 font-semibold">Must match physical count</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-white rounded-2xl border border-stone-200 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-stone-900 text-base">No Register Shift Currently Open</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Open a shift by declaring the starting cash float in the cash drawer before accepting customer orders.
          </p>
          <button
            onClick={() => setIsOpenShiftModalOpen(true)}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl shadow-xs"
          >
            Declare Opening Float & Open Shift
          </button>
        </div>
      )}

      {/* Past Shifts History Table */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div>
            <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
              <History className="w-4 h-4 text-amber-600" />
              Register Shifts History & Reconciliation Audit
            </h3>
            <p className="text-xs text-stone-500">Historical shift closing logs and variance balancing</p>
          </div>
          <span className="text-xs text-stone-400 font-bold">{shifts.length} Total Shifts</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider font-bold text-[10px] border-y border-stone-200">
              <tr>
                <th className="py-3 px-3">Shift Number</th>
                <th className="py-3 px-3">Cashier</th>
                <th className="py-3 px-3">Opened At</th>
                <th className="py-3 px-3">Closed At</th>
                <th className="py-3 px-3">Opening Float</th>
                <th className="py-3 px-3">Total Sales</th>
                <th className="py-3 px-3">Expected Cash</th>
                <th className="py-3 px-3">Counted Cash</th>
                <th className="py-3 px-3">Variance</th>
                <th className="py-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {shifts.map((s) => (
                <tr key={s.id} className="hover:bg-stone-50/70">
                  <td className="py-3 px-3 font-mono font-bold text-stone-900">{s.shiftNumber}</td>
                  <td className="py-3 px-3 font-semibold text-stone-800">{s.cashierName}</td>
                  <td className="py-3 px-3 text-stone-500">{formatDateTime(s.openedAt)}</td>
                  <td className="py-3 px-3 text-stone-500">
                    {s.closedAt ? formatDateTime(s.closedAt) : <span className="text-emerald-600 font-bold">Currently Open</span>}
                  </td>
                  <td className="py-3 px-3 font-semibold text-stone-800">{formatCurrency(s.openingFloat)}</td>
                  <td className="py-3 px-3 font-extrabold text-stone-900">{formatCurrency(s.totalSales)}</td>
                  <td className="py-3 px-3 font-semibold text-stone-800">{formatCurrency(s.expectedCash)}</td>
                  <td className="py-3 px-3 font-semibold text-stone-800">
                    {s.status === 'closed' ? formatCurrency(s.countedCash) : '-'}
                  </td>
                  <td className="py-3 px-3">
                    {s.status === 'closed' ? (
                      <span
                        className={`font-black ${
                          s.variance === 0
                            ? 'text-emerald-700'
                            : s.variance < 0
                            ? 'text-rose-600'
                            : 'text-amber-700'
                        }`}
                      >
                        {formatCurrency(s.variance)}
                      </span>
                    ) : (
                      <span className="text-stone-300">-</span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                        s.status === 'open'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL: DECLARE OPENING FLOAT ================= */}
      {isOpenShiftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-bold text-stone-900 text-sm">Open Register Shift</h3>
              <button
                onClick={() => setIsOpenShiftModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleOpenShiftSubmit} className="space-y-4 text-xs">
              <p className="text-stone-500">
                Count the physical cash in the drawer and enter the initial opening float before starting sales.
              </p>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">
                  Starting Cash Float ($):
                </label>
                <input
                  type="number"
                  min={0}
                  step={10}
                  required
                  value={openingFloatInput}
                  onChange={(e) => setOpeningFloatInput(Number(e.target.value))}
                  className="w-full p-2.5 border border-stone-300 rounded-xl text-center text-lg font-extrabold text-stone-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsOpenShiftModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl shadow-xs"
                >
                  Confirm & Open Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: SAFE DROP ================= */}
      {isSafeDropModalOpen && activeShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-bold text-stone-900 text-sm">Record Mid-Shift Safe Drop</h3>
              <button
                onClick={() => setIsSafeDropModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSafeDropSubmit} className="space-y-4 text-xs">
              <p className="text-stone-500">
                Remove excess cash from drawer and transfer to store safe for security.
              </p>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Safe Drop Amount ($):</label>
                <input
                  type="number"
                  min={10}
                  max={activeShift.expectedCash}
                  step={10}
                  required
                  value={safeDropAmountInput}
                  onChange={(e) => setSafeDropAmountInput(Number(e.target.value))}
                  className="w-full p-2.5 border border-stone-300 rounded-xl text-center text-lg font-extrabold text-stone-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsSafeDropModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl shadow-xs"
                >
                  Confirm Safe Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: CLOSE SHIFT RECONCILIATION ================= */}
      {isCloseShiftModalOpen && activeShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="font-bold text-stone-900 text-sm">Close Register Shift {activeShift.shiftNumber}</h3>
                <p className="text-[11px] text-stone-500">Cash drawer count & reconciliation</p>
              </div>
              <button
                onClick={() => setIsCloseShiftModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCloseShiftSubmit} className="space-y-4 text-xs">
              <div className="p-3.5 bg-stone-50 rounded-xl space-y-2 border border-stone-200">
                <div className="flex justify-between">
                  <span className="text-stone-600">Opening Float:</span>
                  <span className="font-bold">{formatCurrency(activeShift.openingFloat)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">+ Cash Sales:</span>
                  <span className="font-bold">{formatCurrency(activeShift.cashSales)}</span>
                </div>
                {activeShift.safeDrops && (
                  <div className="flex justify-between text-amber-700">
                    <span>- Mid-Shift Safe Drops:</span>
                    <span className="font-bold">-{formatCurrency(activeShift.safeDrops)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-stone-200 flex justify-between font-black text-sm text-stone-900">
                  <span>System Expected Cash:</span>
                  <span>{formatCurrency(activeShift.expectedCash)}</span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">
                  Actual Counted Cash in Drawer ($):
                </label>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  required
                  value={countedCashInput}
                  onChange={(e) => setCountedCashInput(Number(e.target.value))}
                  className="w-full p-2.5 border border-stone-300 rounded-xl text-center text-lg font-black text-stone-900"
                />
              </div>

              {/* Over / Short Variance Display */}
              <div className="p-3 rounded-xl border flex justify-between items-center text-xs">
                <span>Calculated Over / Short Variance:</span>
                <span
                  className={`font-black text-base ${
                    countedCashInput - activeShift.expectedCash === 0
                      ? 'text-emerald-700'
                      : countedCashInput - activeShift.expectedCash < 0
                      ? 'text-rose-600'
                      : 'text-amber-700'
                  }`}
                >
                  {countedCashInput - activeShift.expectedCash === 0
                    ? '$0.00 (Balanced)'
                    : formatCurrency(countedCashInput - activeShift.expectedCash)}
                </span>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">
                  Shift Notes / Manager Sign-off:
                </label>
                <textarea
                  rows={2}
                  value={closingNotesInput}
                  onChange={(e) => setClosingNotesInput(e.target.value)}
                  placeholder="e.g. Verified by Store Manager Emily Chen. All register tapes intact."
                  className="w-full p-2 border border-stone-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsCloseShiftModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl shadow-xs"
                >
                  Confirm & Finalize Closing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
