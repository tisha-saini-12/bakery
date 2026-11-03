import React, { useState, useRef, useEffect } from 'react'
import {
  Building2,
  UserCheck,
  Wifi,
  WifiOff,
  RefreshCw,
  Bell,
  ChevronDown,
  Check,
  Menu,
  Clock,
  Store,
  Sparkles,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import type { UserRole, Location } from '../../types'
import { ROLE_LABELS } from '../../mock/initialData'

export const Navbar: React.FC = () => {
  const {
    currentRole,
    setRole,
    currentUser,
    currentLocation,
    setLocation,
    locations,
    networkStatus,
    offlineQueueCount,
    toggleNetworkOffline,
    triggerManualSync,
    setMobileMenuOpen,
  } = useApp()

  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false)
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  const locationRef = useRef<HTMLDivElement>(null)
  const roleRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  // Realtime clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) {
        setLocationDropdownOpen(false)
      }
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) {
        setRoleDropdownOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getLocationBadge = (type: Location['type']) => {
    switch (type) {
      case 'commissary':
        return 'bg-amber-100 text-amber-800 border-amber-300'
      case 'store':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'franchise':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300'
      case 'counter':
        return 'bg-purple-100 text-purple-800 border-purple-300'
    }
  }

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-stone-200 px-3 sm:px-6 flex items-center justify-between shadow-xs">
      {/* Left: Mobile Toggle & Brand / Location Switcher */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="lg:hidden p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Location Switcher Dropdown */}
        <div className="relative" ref={locationRef}>
          <button
            onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-left transition-colors"
          >
            <div className="p-1 rounded bg-amber-500/10 text-amber-600">
              {currentLocation.type === 'commissary' ? (
                <Building2 className="w-4 h-4" />
              ) : (
                <Store className="w-4 h-4" />
              )}
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-stone-900 tracking-tight">
                  {currentLocation.name}
                </span>
                <span
                  className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded border ${getLocationBadge(
                    currentLocation.type
                  )}`}
                >
                  {currentLocation.code}
                </span>
              </div>
              <p className="text-[10px] text-stone-500 truncate max-w-[150px]">
                {currentLocation.address}
              </p>
            </div>
            <div className="sm:hidden text-xs font-semibold text-stone-900">
              {currentLocation.code}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-stone-400 ml-1" />
          </button>

          {locationDropdownOpen && (
            <div className="absolute left-0 mt-2 w-72 rounded-xl bg-white border border-stone-200 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-1.5 border-b border-stone-100">
                <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                  Switch Active Location
                </span>
              </div>
              <div className="max-h-72 overflow-y-auto py-1">
                {locations.map((loc) => {
                  const isSelected = loc.id === currentLocation.id
                  return (
                    <button
                      key={loc.id}
                      onClick={() => {
                        setLocation(loc)
                        setLocationDropdownOpen(false)
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-stone-50 transition-colors ${
                        isSelected ? 'bg-amber-50/70' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`mt-0.5 p-1 rounded ${
                            loc.type === 'commissary'
                              ? 'bg-amber-500 text-white'
                              : 'bg-stone-200 text-stone-700'
                          }`}
                        >
                          {loc.type === 'commissary' ? (
                            <Building2 className="w-3.5 h-3.5" />
                          ) : (
                            <Store className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-stone-900">{loc.name}</span>
                            <span
                              className={`text-[9px] font-bold px-1 rounded uppercase ${getLocationBadge(
                                loc.type
                              )}`}
                            >
                              {loc.type}
                            </span>
                          </div>
                          <p className="text-[10px] text-stone-500">{loc.address}</p>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-amber-600" />}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Controls: Role Switcher + Network Status + Clock + User */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Network & Offline Simulator Toggle */}
        <div className="flex items-center">
          {networkStatus === 'online' ? (
            <button
              onClick={toggleNetworkOffline}
              title="Click to simulate Offline Mode (IndexedDB fallback)"
              className="group flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 hover:bg-amber-50 border border-emerald-200 hover:border-amber-300 transition-all text-xs font-medium text-emerald-700 hover:text-amber-700"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <Wifi className="w-3.5 h-3.5 text-emerald-600 group-hover:hidden" />
              <WifiOff className="w-3.5 h-3.5 text-amber-600 hidden group-hover:inline" />
              <span className="hidden md:inline group-hover:hidden">Online</span>
              <span className="hidden md:group-hover:inline text-amber-800 text-[11px]">
                Simulate Offline
              </span>
            </button>
          ) : networkStatus === 'offline' ? (
            <button
              onClick={toggleNetworkOffline}
              title="Click to reconnect and sync queue"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-xs font-medium animate-pulse"
            >
              <WifiOff className="w-3.5 h-3.5 text-amber-700" />
              <span className="hidden sm:inline">Offline Mode</span>
              {offlineQueueCount > 0 && (
                <span className="bg-amber-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {offlineQueueCount} queued
                </span>
              )}
              <span className="text-[10px] underline ml-1 hidden lg:inline">Go Online</span>
            </button>
          ) : (
            <button
              onClick={triggerManualSync}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-300 text-blue-700 text-xs font-medium"
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
              <span>Syncing ({offlineQueueCount})...</span>
            </button>
          )}
        </div>

        {/* Real-time Clock */}
        <div className="hidden xl:flex items-center gap-1.5 text-xs text-stone-500 bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-200">
          <Clock className="w-3.5 h-3.5 text-stone-400" />
          <span>
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>

        {/* Interactive Role Switcher Dropdown */}
        <div className="relative" ref={roleRef}>
          <button
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-lg border border-stone-200 hover:border-amber-400 bg-white hover:bg-amber-50/40 transition-all text-left"
          >
            <div className="relative">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-7 h-7 rounded-full object-cover ring-2 ring-stone-100"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-1 ring-white" />
            </div>

            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-stone-900 truncate max-w-[120px]">
                  {currentUser.name}
                </span>
                <Sparkles className="w-3 h-3 text-amber-500" />
              </div>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                  ROLE_LABELS[currentRole]?.color || 'bg-stone-100 text-stone-700'
                }`}
              >
                {ROLE_LABELS[currentRole]?.label}
              </span>
            </div>

            <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
          </button>

          {roleDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white border border-stone-200 shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2 border-b border-stone-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-stone-900">Switch User Role</h4>
                  <p className="text-[10px] text-stone-500">
                    Test the system through any staff persona in 1-click
                  </p>
                </div>
                <UserCheck className="w-4 h-4 text-amber-600" />
              </div>

              <div className="max-h-96 overflow-y-auto py-1">
                {(Object.keys(ROLE_LABELS) as UserRole[]).map((roleKey) => {
                  const roleMeta = ROLE_LABELS[roleKey]
                  const isSelected = currentRole === roleKey
                  return (
                    <button
                      key={roleKey}
                      onClick={() => {
                        setRole(roleKey)
                        setRoleDropdownOpen(false)
                      }}
                      className={`w-full text-left px-3 py-2.5 flex items-center justify-between hover:bg-stone-50 transition-colors ${
                        isSelected ? 'bg-amber-50/80 border-l-4 border-amber-500' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${roleMeta.color}`}
                        >
                          {roleMeta.label}
                        </span>
                        <div>
                          <p className="text-[10px] font-medium text-stone-500">
                            {roleMeta.department}
                          </p>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-amber-600 flex-shrink-0" />}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white border border-stone-200 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2 border-b border-stone-100 flex items-center justify-between">
                <span className="text-xs font-bold text-stone-900">Live Operational Alerts</span>
                <span className="text-[10px] font-semibold bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded">
                  3 New
                </span>
              </div>
              <div className="divide-y divide-stone-100 text-xs">
                <div className="p-3 hover:bg-stone-50 cursor-pointer">
                  <div className="flex items-center gap-1.5 font-semibold text-rose-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    Low Stock: French Butter (Block)
                  </div>
                  <p className="text-stone-500 text-[11px] mt-0.5">
                    Remaining: 4.2 kg (Threshold: 15 kg). Needed for tomorrow's croissant batches.
                  </p>
                </div>
                <div className="p-3 hover:bg-stone-50 cursor-pointer">
                  <div className="flex items-center gap-1.5 font-semibold text-amber-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Batch #B-104 Ready for Baking
                  </div>
                  <p className="text-stone-500 text-[11px] mt-0.5">
                    Sourdough loaves fermentation completed. Transfer to Deck Oven #2.
                  </p>
                </div>
                <div className="p-3 hover:bg-stone-50 cursor-pointer">
                  <div className="flex items-center gap-1.5 font-semibold text-emerald-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Dispatch Manifest #DSP-089 Delivered
                  </div>
                  <p className="text-stone-500 text-[11px] mt-0.5">
                    Downtown Store #1 verified receipt with zero discrepancies.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
