import React, { createContext, useContext, useState } from 'react'
import type { UserRole, User, Location } from '../types'
import { INITIAL_LOCATIONS, USERS_BY_ROLE } from '../mock/initialData'
import { useBakeryStore } from '../store/useBakeryStore'

export type NetworkStatus = 'online' | 'offline' | 'syncing'

export interface BadgeCounts {
  pendingOrders: number
  activeBatches: number
  lowStockAlerts: number
  inTransitDeliveries: number
  pendingPullouts: number
  unpaidInvoices: number
}

interface AppContextType {
  currentRole: UserRole
  setRole: (role: UserRole) => void
  currentUser: User
  currentLocation: Location
  setLocation: (location: Location) => void
  locations: Location[]
  networkStatus: NetworkStatus
  offlineQueueCount: number
  toggleNetworkOffline: () => void
  triggerManualSync: () => void
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
  activeModule: string
  setActiveModule: (module: string) => void
  badgeCounts: BadgeCounts
  incrementOfflineQueue: () => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<UserRole>('admin')
  const [currentUser, setCurrentUser] = useState<User>(USERS_BY_ROLE.admin)
  const [currentLocation, setCurrentLocation] = useState<Location>(INITIAL_LOCATIONS[0])
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>('online')
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(0)
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false)
  const [activeModule, setActiveModule] = useState<string>('dashboard')

  // Live state from centralized bakery store
  const orders = useBakeryStore((state) => state.orders)
  const batches = useBakeryStore((state) => state.batches)
  const ingredients = useBakeryStore((state) => state.ingredients)
  const dispatches = useBakeryStore((state) => state.dispatches)
  const pullouts = useBakeryStore((state) => state.pullouts)
  const invoices = useBakeryStore((state) => state.invoices)
  const syncOfflineSales = useBakeryStore((state) => state.syncOfflineSales)

  const badgeCounts: BadgeCounts = {
    pendingOrders: orders.filter((o) => o.status === 'submitted' || o.status === 'approved').length,
    activeBatches: batches.filter((b) => b.status === 'mixing' || b.status === 'baking' || b.status === 'cooling').length,
    lowStockAlerts: ingredients.filter((ing) => ing.currentStock <= ing.minStockLevel).length,
    inTransitDeliveries: dispatches.filter((d) => d.status === 'in_transit').length,
    pendingPullouts: pullouts.length,
    unpaidInvoices: invoices.filter((inv) => inv.status === 'unpaid' || inv.status === 'partially_paid').length,
  }

  // Whenever role changes, update currentUser persona
  const handleSetRole = (newRole: UserRole) => {
    setCurrentRole(newRole)
    const persona = USERS_BY_ROLE[newRole]
    if (persona) {
      setCurrentUser(persona)
      // If user has a default assigned location, switch to that location if it's store or cashier
      const assignedLoc = INITIAL_LOCATIONS.find((l) => l.id === persona.assignedLocationId)
      if (assignedLoc) {
        setCurrentLocation(assignedLoc)
      }
    }

    // Default module recommendations for specific roles
    if (newRole === 'cashier') {
      setActiveModule('pos')
    } else if (newRole === 'production_staff') {
      setActiveModule('production')
    } else if (newRole === 'dispatch_staff') {
      setActiveModule('dispatch')
    } else if (newRole === 'attendance_manager') {
      setActiveModule('attendance')
    } else if (newRole === 'finance_staff') {
      setActiveModule('billing')
    }
  }

  const toggleNetworkOffline = () => {
    if (networkStatus === 'online') {
      setNetworkStatus('offline')
    } else if (networkStatus === 'offline') {
      if (offlineQueueCount > 0) {
        setNetworkStatus('syncing')
        setTimeout(() => {
          setOfflineQueueCount(0)
          setNetworkStatus('online')
        }, 1800)
      } else {
        setNetworkStatus('online')
      }
    }
  }

  const triggerManualSync = () => {
    if (networkStatus === 'syncing') return
    setNetworkStatus('syncing')
    setTimeout(() => {
      syncOfflineSales()
      setOfflineQueueCount(0)
      setNetworkStatus('online')
    }, 1500)
  }

  const incrementOfflineQueue = () => {
    setOfflineQueueCount((prev) => prev + 1)
  }

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev)
  }

  return (
    <AppContext.Provider
      value={{
        currentRole,
        setRole: handleSetRole,
        currentUser,
        currentLocation,
        setLocation: setCurrentLocation,
        locations: INITIAL_LOCATIONS,
        networkStatus,
        offlineQueueCount,
        toggleNetworkOffline,
        triggerManualSync,
        sidebarCollapsed,
        toggleSidebar,
        mobileMenuOpen,
        setMobileMenuOpen,
        activeModule,
        setActiveModule,
        badgeCounts,
        incrementOfflineQueue,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
