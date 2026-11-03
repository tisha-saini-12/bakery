import React, { useState, useMemo } from 'react'
import {
  Calculator,
  Search,
  Barcode,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Tag,
  CreditCard,
  Banknote,
  QrCode,
  CheckCircle2,
  Receipt as ReceiptIcon,
  Printer,
  Sparkles,
  Wifi,
  WifiOff,
  Flame,
  Clock,
  Layers,
} from 'lucide-react'
import confetti from 'canvas-confetti'
import { useBakeryStore } from '../../store/useBakeryStore'
import { useApp } from '../../context/AppContext'
import { formatCurrency, formatDateTime } from '../../lib/utils'
import type { Product, POSCartItem, POSSale } from '../../types'

export const POSView: React.FC = () => {
  const { currentLocation, currentUser, networkStatus, incrementOfflineQueue } = useApp()
  const { products, locationInventories, recordSale } = useBakeryStore()

  const [activeCategory, setActiveCategory] = useState<string>('All')
  const [posSearch, setPosSearch] = useState<string>('')
  const [cart, setCart] = useState<POSCartItem[]>([])
  const [discountPercent, setDiscountPercent] = useState<number>(0)
  const [itemModifiers, setItemModifiers] = useState<Record<string, string[]>>({})

  // Tender Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [tenderType, setTenderType] = useState<'cash' | 'card' | 'qr_wallet'>('cash')
  const [cashTenderedInput, setCashTenderedInput] = useState<number>(0)
  const [completedSale, setCompletedSale] = useState<POSSale | null>(null)

  // Get current stock at this specific active location
  const getStock = (productId: string) => {
    if (currentLocation.type === 'commissary') {
      const p = products.find((prod) => prod.id === productId)
      return p ? p.currentStock : 0
    }
    const li = locationInventories.find(
      (item) => item.productId === productId && item.locationId === currentLocation.id
    )
    return li ? li.currentStock : 0
  }

  // Filter products by category & search
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory =
        activeCategory === 'All'
          ? true
          : activeCategory === 'Promos'
          ? p.category === 'Pastries' || p.category === 'Breads'
          : p.category === activeCategory

      const matchesSearch =
        p.name.toLowerCase().includes(posSearch.toLowerCase()) ||
        p.code.toLowerCase().includes(posSearch.toLowerCase())

      return matchesCategory && matchesSearch
    })
  }, [products, activeCategory, posSearch])

  // Cart calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0)
  }, [cart])

  const discountAmount = useMemo(() => {
    return Number(((subtotal * discountPercent) / 100).toFixed(2))
  }, [subtotal, discountPercent])

  const tax = useMemo(() => {
    return Number(((subtotal - discountAmount) * 0.08).toFixed(2))
  }, [subtotal, discountAmount])

  const grandTotal = useMemo(() => {
    return Math.max(0, Number((subtotal - discountAmount + tax).toFixed(2)))
  }, [subtotal, discountAmount, tax])

  // Cart actions
  const addToCart = (product: Product) => {
    const stock = getStock(product.id)
    if (stock <= 0 && currentLocation.type !== 'commissary') {
      return // Prevent adding out-of-stock items
    }

    const price = activeCategory === 'Promos' ? product.retailPrice * 0.5 : product.retailPrice

    const existingIndex = cart.findIndex((item) => item.productId === product.id)
    if (existingIndex !== -1) {
      const updated = [...cart]
      const newQty = updated[existingIndex].quantity + 1
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: newQty,
        subtotal: Number((newQty * price).toFixed(2)),
      }
      setCart(updated)
    } else {
      setCart([
        ...cart,
        {
          productId: product.id,
          productName: product.name,
          retailPrice: price,
          quantity: 1,
          subtotal: price,
        },
      ])
    }
  }

  const updateQuantity = (productId: string, delta: number) => {
    const updated = cart
      .map((item) => {
        if (item.productId === productId) {
          const newQty = item.quantity + delta
          return newQty > 0
            ? { ...item, quantity: newQty, subtotal: Number((newQty * item.retailPrice).toFixed(2)) }
            : null
        }
        return item
      })
      .filter(Boolean) as POSCartItem[]

    setCart(updated)
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.productId !== productId))
  }

  const clearCart = () => {
    setCart([])
    setDiscountPercent(0)
    setItemModifiers({})
  }

  // Barcode Simulator
  const handleBarcodeScan = () => {
    if (products.length > 0) {
      const randomProduct = products[Math.floor(Math.random() * products.length)]
      addToCart(randomProduct)
    }
  }

  // Open Checkout
  const handleOpenCheckout = () => {
    if (cart.length === 0) return
    setTenderType('cash')
    setCashTenderedInput(Math.ceil(grandTotal))
    setIsCheckoutOpen(true)
  }

  // Complete Payment
  const handleCompletePayment = (e: React.FormEvent) => {
    e.preventDefault()
    const isOffline = networkStatus === 'offline'

    const sale = recordSale(
      currentLocation.id,
      currentUser.id,
      currentUser.name,
      cart,
      subtotal,
      tax,
      discountAmount,
      grandTotal,
      tenderType,
      tenderType === 'cash' ? cashTenderedInput : grandTotal,
      isOffline
    )

    if (isOffline) {
      incrementOfflineQueue()
    }

    // Trigger celebratory confetti effect
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#fbbf24', '#d97706', '#10b981'],
      })
    } catch {
      // Ignore if confetti not supported
    }

    setCompletedSale(sale)
    setIsCheckoutOpen(false)
    clearCart()
  }

  return (
    <div className="space-y-4">
      {/* Location & Offline Alert Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-stone-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500 text-white shadow-xs">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-stone-900">Retail Counter POS Terminal</h2>
              <span className="text-[10px] font-bold uppercase bg-stone-100 text-stone-700 px-2 py-0.5 rounded border border-stone-200">
                {currentLocation.name} ({currentLocation.code})
              </span>
            </div>
            <p className="text-xs text-stone-500">
              Cashier: <strong className="text-stone-800">{currentUser.name}</strong> &bull; Fast Touch Catalog & Multi-Tender Checkout
            </p>
          </div>
        </div>

        {/* Offline & Barcode Simulator Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {networkStatus === 'offline' ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-xs font-bold animate-pulse">
              <WifiOff className="w-4 h-4" />
              <span>Offline POS (Queue Active)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold">
              <Wifi className="w-4 h-4 text-emerald-500" />
              <span>Register Online</span>
            </div>
          )}

          <button
            onClick={handleBarcodeScan}
            title="Simulate Hardware Barcode Scanner"
            className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-stone-200 cursor-pointer"
          >
            <Barcode className="w-4 h-4 text-stone-600" />
            <span className="hidden md:inline">Scan Barcode</span>
          </button>
        </div>
      </div>

      {/* Main POS Grid: Product Catalog (7 Cols) + Interactive Cart (5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Touch Product Catalog */}
        <div className="lg:col-span-7 space-y-4">
          {/* Categories + Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Category Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1.5">
                {['All', 'Breads', 'Pastries', 'Cakes', 'Beverages', 'Promos'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-2 rounded-xl text-xs font-extrabold transition-all touch-target ${
                      activeCategory === cat
                        ? 'bg-amber-500 text-stone-950 shadow-xs scale-102'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {cat === 'Promos' ? '🔥 50% Day-Old Promos' : cat}
                  </button>
                ))}
              </div>

              {/* Instant Search */}
              <div className="relative w-full sm:w-56">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={posSearch}
                  onChange={(e) => setPosSearch(e.target.value)}
                  placeholder="Quick search item..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Product Cards Touch Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[620px] overflow-y-auto pr-1">
            {filteredProducts.map((prod) => {
              const currentBranchStock = getStock(prod.id)
              const isOutOfStock = currentBranchStock <= 0 && currentLocation.type !== 'commissary'
              const price = activeCategory === 'Promos' ? prod.retailPrice * 0.5 : prod.retailPrice

              return (
                <div
                  key={prod.id}
                  onClick={() => !isOutOfStock && addToCart(prod)}
                  className={`group relative p-3 rounded-2xl border bg-white shadow-2xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer select-none active:scale-97 ${
                    isOutOfStock
                      ? 'opacity-50 cursor-not-allowed border-stone-200'
                      : 'border-stone-200 hover:border-amber-400'
                  }`}
                >
                  <div>
                    <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-stone-100 mb-2">
                      <img
                        src={prod.imageUrl}
                        alt={prod.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {activeCategory === 'Promos' && (
                        <span className="absolute top-1.5 left-1.5 text-[9px] font-black uppercase bg-rose-600 text-white px-1.5 py-0.5 rounded shadow">
                          50% Off
                        </span>
                      )}
                      <span
                        className={`absolute bottom-1.5 right-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-xs ${
                          isOutOfStock
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-white/90 text-stone-800'
                        }`}
                      >
                        {isOutOfStock ? 'Sold Out' : `${currentBranchStock} left`}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-stone-900 text-xs leading-tight line-clamp-1">
                      {prod.name}
                    </h4>
                    <span className="text-[10px] text-stone-400 font-mono">{prod.code}</span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between">
                    <span className="font-extrabold text-stone-900 text-sm">
                      {formatCurrency(price)}
                    </span>
                    <button
                      disabled={isOutOfStock}
                      className="p-1.5 rounded-lg bg-amber-500 group-hover:bg-amber-400 text-stone-950 shadow-2xs transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: Touch Cart & Checkout Summary */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between overflow-hidden">
          {/* Cart Header */}
          <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/70">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-amber-600" />
              <h3 className="font-extrabold text-stone-900 text-sm">Current Order</h3>
              <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                {cart.reduce((sum, i) => sum + i.quantity, 0)} items
              </span>
            </div>

            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="p-4 flex-1 overflow-y-auto max-h-[380px] space-y-2.5 divide-y divide-stone-100">
            {cart.length === 0 ? (
              <div className="text-center py-16 text-stone-400 space-y-2">
                <ShoppingBag className="w-10 h-10 mx-auto text-stone-300" />
                <p className="text-xs font-semibold">Your shopping cart is empty</p>
                <p className="text-[11px] text-stone-400">Tap items on the left to add them to the sale</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.productId} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                  <div className="flex-1 pr-2">
                    <span className="font-extrabold text-stone-900 block truncate">{item.productName}</span>
                    <span className="text-[11px] text-stone-500">
                      {formatCurrency(item.retailPrice)} each
                    </span>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateQuantity(item.productId, -1)}
                      className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center justify-center font-bold text-stone-700 active:scale-95 transition-transform"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-extrabold text-stone-900 text-sm">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.productId, 1)}
                      className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center justify-center font-bold text-stone-700 active:scale-95 transition-transform"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="w-20 text-right font-black text-stone-900 text-sm">
                    {formatCurrency(item.subtotal)}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Discount Presets */}
          <div className="p-3 bg-stone-50 border-t border-stone-200 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-stone-600">
              <span className="flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-amber-600" />
                Quick Customer Discount:
              </span>
              <span>{discountPercent}% Applied</span>
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {[0, 5, 10, 15, 20].map((pct) => (
                <button
                  key={pct}
                  onClick={() => setDiscountPercent(pct)}
                  className={`py-1 text-xs font-bold rounded-lg border transition-all ${
                    discountPercent === pct
                      ? 'bg-amber-500 text-stone-950 border-amber-400 font-black shadow-xs'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {pct === 0 ? 'None' : `${pct}%`}
                </button>
              ))}
            </div>
          </div>

          {/* Pricing Totals & Tender Button */}
          <div className="p-4 bg-white border-t border-stone-200 space-y-3">
            <div className="space-y-1.5 text-xs text-stone-600">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-bold text-stone-900">{formatCurrency(subtotal)}</span>
              </div>
              {discountPercent > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Discount ({discountPercent}%):</span>
                  <span className="font-bold">-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Sales Tax (8%):</span>
                <span className="font-bold text-stone-900">{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between text-base font-black text-stone-950 pt-2 border-t border-stone-100">
                <span>Total Amount Due:</span>
                <span className="text-xl text-stone-950">{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            <button
              onClick={handleOpenCheckout}
              disabled={cart.length === 0}
              className={`w-full py-4 rounded-xl font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 touch-target ${
                cart.length > 0
                  ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 cursor-pointer active:scale-98'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              <span>Charge {formatCurrency(grandTotal)}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= MODAL: MULTI-TENDER CHECKOUT ================= */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="font-bold text-stone-900 text-base">Select Payment Method</h3>
                <p className="text-xs text-stone-500">Total Tender: {formatCurrency(grandTotal)}</p>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="text-stone-400 hover:text-stone-700 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {/* Tender Options */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTenderType('cash')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-xs font-bold transition-all ${
                  tenderType === 'cash'
                    ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-xs'
                    : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <Banknote className="w-6 h-6" />
                <span>Cash Tender</span>
              </button>
              <button
                type="button"
                onClick={() => setTenderType('card')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-xs font-bold transition-all ${
                  tenderType === 'card'
                    ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-xs'
                    : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <CreditCard className="w-6 h-6" />
                <span>Credit / Debit</span>
              </button>
              <button
                type="button"
                onClick={() => setTenderType('qr_wallet')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-xs font-bold transition-all ${
                  tenderType === 'qr_wallet'
                    ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-xs'
                    : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <QrCode className="w-6 h-6" />
                <span>QR / E-Wallet</span>
              </button>
            </div>

            <form onSubmit={handleCompletePayment} className="space-y-4">
              {/* Cash specific calculator */}
              {tenderType === 'cash' && (
                <div className="space-y-3 p-4 bg-stone-50 rounded-xl border border-stone-200">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-stone-600">Amount Given by Customer ($):</span>
                    <input
                      type="number"
                      step={0.5}
                      min={grandTotal}
                      required
                      value={cashTenderedInput}
                      onChange={(e) => setCashTenderedInput(Number(e.target.value))}
                      className="w-28 p-2 border border-stone-300 rounded-lg text-right font-black text-sm bg-white"
                    />
                  </div>

                  {/* Quick Cash Bill Presets */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {[Math.ceil(grandTotal), 20, 50, 100].map((preset) => (
                      <button
                        type="button"
                        key={preset}
                        onClick={() => setCashTenderedInput(preset)}
                        className="py-1.5 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg font-bold text-xs text-stone-800"
                      >
                        ${preset}
                      </button>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-stone-200 flex justify-between items-center text-sm">
                    <span className="font-semibold text-stone-700">Change Due to Customer:</span>
                    <strong className="text-base text-emerald-700">
                      {formatCurrency(Math.max(0, cashTenderedInput - grandTotal))}
                    </strong>
                  </div>
                </div>
              )}

              {/* Card Terminal Simulator */}
              {tenderType === 'card' && (
                <div className="p-6 bg-stone-50 rounded-xl border border-stone-200 text-center space-y-2">
                  <CreditCard className="w-8 h-8 text-amber-600 mx-auto animate-pulse" />
                  <p className="text-xs font-bold text-stone-900">Insert, Swipe, or Tap Card on Terminal</p>
                  <p className="text-[11px] text-stone-500">EMV chip & contactless ready. Verified encryption.</p>
                </div>
              )}

              {/* QR Code Wallet Simulator */}
              {tenderType === 'qr_wallet' && (
                <div className="p-6 bg-stone-50 rounded-xl border border-stone-200 text-center space-y-2">
                  <div className="w-28 h-28 mx-auto bg-white p-2 rounded-xl border border-stone-300 flex items-center justify-center">
                    <QrCode className="w-full h-full text-stone-900" />
                  </div>
                  <p className="text-xs font-bold text-stone-900">Scan QR Code with Apple Pay / Google Wallet</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  Complete Sale ({formatCurrency(grandTotal)})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: RECEIPT PREVIEW & PRINT ================= */}
      {completedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="text-center space-y-1 pb-3 border-b border-stone-200 border-dashed">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-black text-stone-900 text-base">Payment Completed!</h3>
              <p className="text-[11px] text-stone-500 font-mono">
                Receipt #{completedSale.receiptNumber}
              </p>
            </div>

            {/* Receipt Body */}
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between text-stone-500 text-[11px]">
                <span>{currentLocation.name}</span>
                <span>{formatDateTime(completedSale.timestamp)}</span>
              </div>
              <div className="text-[11px] text-stone-500">
                Cashier: {completedSale.cashierName}
              </div>

              <div className="py-2 border-y border-stone-200 border-dashed space-y-1.5">
                {completedSale.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>
                      {item.quantity}x {item.productName}
                    </span>
                    <span>{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(completedSale.subtotal)}</span>
                </div>
                {completedSale.discount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Discount:</span>
                    <span>-{formatCurrency(completedSale.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-stone-600">
                  <span>Tax:</span>
                  <span>{formatCurrency(completedSale.tax)}</span>
                </div>
                <div className="flex justify-between font-black text-sm text-stone-950 pt-1 border-t border-stone-200">
                  <span>Total Paid:</span>
                  <span>{formatCurrency(completedSale.total)}</span>
                </div>
                <div className="flex justify-between text-stone-500 text-[11px]">
                  <span className="capitalize">Tender ({completedSale.paymentMethod}):</span>
                  <span>{formatCurrency(completedSale.amountTendered)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Change Given:</span>
                  <span>{formatCurrency(completedSale.change)}</span>
                </div>
              </div>
            </div>

            {/* Receipt Modal Footer Actions */}
            <div className="flex items-center gap-2 pt-3 border-t border-stone-100">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print</span>
              </button>
              <button
                onClick={() => setCompletedSale(null)}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl"
              >
                Next Sale &rarr;
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
