import React from 'react'
import {
  LayoutDashboard,
  ShoppingCart,
  ChefHat,
  Boxes,
  Truck,
  RotateCcw,
  Calculator,
  Receipt,
  UserCheck2,
  FileSpreadsheet,
  BarChart3,
  Database,
  ChevronLeft,
  ChevronRight,
  Flame,
  X,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import type { UserRole } from '../../types'

interface NavItem {
  id: string
  label: string
  icon: React.ElementType
  badgeKey?: 'pendingOrders' | 'activeBatches' | 'lowStockAlerts' | 'inTransitDeliveries' | 'pendingPullouts' | 'unpaidInvoices'
  badgeColor?: string
  allowedRoles: UserRole[]
  group: 'Operations Core' | 'Front of House' | 'Finance & Admin'
}

const NAV_ITEMS: NavItem[] = [
  // Operations Core
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    allowedRoles: ['admin', 'commissary_manager', 'inventory_manager', 'store_manager', 'finance_staff'],
    group: 'Operations Core',
  },
  {
    id: 'orders',
    label: 'Order Management',
    icon: ShoppingCart,
    badgeKey: 'pendingOrders',
    badgeColor: 'bg-amber-500 text-white',
    allowedRoles: ['admin', 'commissary_manager', 'store_manager', 'dispatch_staff'],
    group: 'Operations Core',
  },
  {
    id: 'production',
    label: 'Production & Batches',
    icon: ChefHat,
    badgeKey: 'activeBatches',
    badgeColor: 'bg-orange-500 text-white',
    allowedRoles: ['admin', 'commissary_manager', 'production_staff'],
    group: 'Operations Core',
  },
  {
    id: 'inventory',
    label: 'Inventory & Stock',
    icon: Boxes,
    badgeKey: 'lowStockAlerts',
    badgeColor: 'bg-rose-500 text-white',
    allowedRoles: ['admin', 'commissary_manager', 'inventory_manager'],
    group: 'Operations Core',
  },
  {
    id: 'dispatch',
    label: 'Dispatch & Receiving',
    icon: Truck,
    badgeKey: 'inTransitDeliveries',
    badgeColor: 'bg-blue-500 text-white',
    allowedRoles: ['admin', 'commissary_manager', 'dispatch_staff', 'store_manager'],
    group: 'Operations Core',
  },
  {
    id: 'pullouts',
    label: 'Leftovers & Pull-Outs',
    icon: RotateCcw,
    badgeKey: 'pendingPullouts',
    badgeColor: 'bg-stone-500 text-white',
    allowedRoles: ['admin', 'commissary_manager', 'store_manager', 'cashier'],
    group: 'Operations Core',
  },

  // Front of House
  {
    id: 'pos',
    label: 'Retail Counter POS',
    icon: Calculator,
    allowedRoles: ['admin', 'store_manager', 'cashier'],
    group: 'Front of House',
  },
  {
    id: 'shifts',
    label: 'Shift Closing & Cash',
    icon: Receipt,
    allowedRoles: ['admin', 'store_manager', 'cashier'],
    group: 'Front of House',
  },
  {
    id: 'attendance',
    label: 'Attendance & Clock-In',
    icon: UserCheck2,
    allowedRoles: ['admin', 'attendance_manager', 'store_manager', 'commissary_manager', 'cashier', 'production_staff'],
    group: 'Front of House',
  },

  // Finance & Admin
  {
    id: 'billing',
    label: 'Billing & Collections',
    icon: FileSpreadsheet,
    badgeKey: 'unpaidInvoices',
    badgeColor: 'bg-indigo-500 text-white',
    allowedRoles: ['admin', 'finance_staff'],
    group: 'Finance & Admin',
  },
  {
    id: 'reports',
    label: 'Reports & Analytics',
    icon: BarChart3,
    allowedRoles: ['admin', 'commissary_manager', 'finance_staff'],
    group: 'Finance & Admin',
  },
  {
    id: 'masterdata',
    label: 'Master Data & Recipes',
    icon: Database,
    allowedRoles: ['admin', 'commissary_manager'],
    group: 'Finance & Admin',
  },
]

export const Sidebar: React.FC = () => {
  const {
    currentRole,
    activeModule,
    setActiveModule,
    sidebarCollapsed,
    toggleSidebar,
    mobileMenuOpen,
    setMobileMenuOpen,
    badgeCounts,
  } = useApp()

  // Filter nav items based on current role
  const visibleItems = NAV_ITEMS.filter((item) =>
    item.allowedRoles.includes(currentRole)
  )

  // Group visible items
  const groups = ['Operations Core', 'Front of House', 'Finance & Admin'] as const

  const renderNavContent = () => (
    <div className="flex flex-col h-full justify-between bg-stone-900 text-stone-100 select-none">
      {/* Brand Header */}
      <div>
        <div className="h-16 flex items-center justify-between px-4 border-b border-stone-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-white shadow-md shadow-amber-900/40 flex-shrink-0">
              <Flame className="w-5 h-5 fill-white/30 text-white" />
            </div>
            {!sidebarCollapsed && (
              <div className="truncate">
                <span className="font-extrabold text-sm tracking-tight text-white block">
                  Artisanal Bakery
                </span>
                <span className="text-[10px] text-amber-400 font-medium tracking-wide uppercase">
                  Commissary & POS ERP
                </span>
              </div>
            )}
          </div>
          {mobileMenuOpen && (
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden text-stone-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Groups */}
        <div className="py-4 px-2 space-y-6 overflow-y-auto max-h-[calc(100vh-8rem)]">
          {groups.map((group) => {
            const groupItems = visibleItems.filter((i) => i.group === group)
            if (groupItems.length === 0) return null

            return (
              <div key={group}>
                {!sidebarCollapsed && (
                  <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    {group}
                  </p>
                )}
                <div className="space-y-1">
                  {groupItems.map((item) => {
                    const Icon = item.icon
                    const isActive = activeModule === item.id
                    const badgeVal = item.badgeKey ? badgeCounts[item.badgeKey] : null

                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveModule(item.id)
                          setMobileMenuOpen(false)
                        }}
                        title={sidebarCollapsed ? item.label : undefined}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                          isActive
                            ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20 font-bold'
                            : 'text-stone-300 hover:text-white hover:bg-stone-800/80'
                        }`}
                      >
                        <div className="flex items-center gap-3 truncate">
                          <Icon
                            className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110 ${
                              isActive ? 'text-stone-950 stroke-[2.5]' : 'text-stone-400'
                            }`}
                          />
                          {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                        </div>

                        {!sidebarCollapsed && badgeVal && badgeVal > 0 && (
                          <span
                            className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                              isActive ? 'bg-stone-900 text-amber-400' : item.badgeColor
                            }`}
                          >
                            {badgeVal}
                          </span>
                        )}
                        {sidebarCollapsed && badgeVal && badgeVal > 0 && (
                          <span className="w-2 h-2 rounded-full bg-amber-400 ring-2 ring-stone-900 absolute top-2 right-2" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer Collapse Toggle (Desktop only) */}
      <div className="p-3 border-t border-stone-800 hidden lg:block">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse Sidebar</span>
            </>
          )}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside
        className={`hidden lg:block sticky top-0 h-screen flex-shrink-0 transition-all duration-300 z-40 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {renderNavContent()}
      </aside>

      {/* Mobile / Tablet Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10">
            {renderNavContent()}
          </div>
        </div>
      )}
    </>
  )
}
