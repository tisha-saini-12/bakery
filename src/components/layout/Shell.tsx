import React from 'react'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'
import { DashboardView } from '../dashboard/DashboardView'
import { ModuleRenderer } from '../modules/ModuleRenderer'
import { useApp } from '../../context/AppContext'
import { Building2, ShieldCheck, WifiOff } from 'lucide-react'

export const Shell: React.FC = () => {
  const { activeModule, currentLocation, currentRole, currentUser, networkStatus, offlineQueueCount } = useApp()

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 flex flex-row font-sans">
      {/* Collapsible Role-Aware Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar with Location Switcher & Role Switcher */}
        <Navbar />

        {/* Offline Alert Strip if Offline */}
        {networkStatus === 'offline' && (
          <div className="bg-amber-500 text-stone-950 px-4 py-2 text-xs font-bold flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4" />
              <span>
                Operating in Simulated Offline Mode. All local sales, clock-ins, and adjustments will be queued locally in IndexedDB.
              </span>
            </div>
            <span className="bg-stone-950 text-amber-400 px-2 py-0.5 rounded text-[10px] font-mono">
              Queue: {offlineQueueCount} events
            </span>
          </div>
        )}

        {/* Main Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Breadcrumb & Context Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-stone-500 pb-2">
            <div className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-stone-400" />
              <span>{currentLocation.name}</span>
              <span>/</span>
              <span className="font-bold text-stone-800 capitalize">
                {activeModule.replace('_', ' ')}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-stone-400">Authenticated Persona:</span>
              <span className="font-semibold text-stone-800 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                {currentUser.name} ({currentRole})
              </span>
            </div>
          </div>

          {/* Dynamic Content */}
          {activeModule === 'dashboard' ? <DashboardView /> : <ModuleRenderer />}
        </main>

        {/* System Footer */}
        <footer className="py-4 px-6 border-t border-stone-200 bg-white/50 text-[11px] text-stone-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Bakery Commissary & POS Operations Platform &bull; v1.0.0
          </div>
          <div className="flex items-center gap-3">
            <span>Status: <strong className={networkStatus === 'online' ? 'text-emerald-600' : 'text-amber-600'}>{networkStatus.toUpperCase()}</strong></span>
            <span>&bull;</span>
            <span>Location: <strong>{currentLocation.code}</strong></span>
          </div>
        </footer>
      </div>
    </div>
  )
}
