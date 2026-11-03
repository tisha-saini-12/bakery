import React from 'react'
import { Layers } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { MasterDataView } from '../masterdata/MasterDataView'
import { OrdersView } from '../orders/OrdersView'
import { ProductionView } from '../production/ProductionView'
import { InventoryView } from '../inventory/InventoryView'
import { POSView } from '../pos/POSView'
import { ShiftsView } from '../shifts/ShiftsView'
import { AttendanceView } from '../attendance/AttendanceView'
import { BillingView } from '../billing/BillingView'
import { ReportsView } from '../reports/ReportsView'
import { DispatchView } from '../dispatch/DispatchView'
import { PullOutsView } from '../pullouts/PullOutsView'

export const ModuleRenderer: React.FC = () => {
  const { activeModule, currentLocation, currentRole } = useApp()

  switch (activeModule) {
    case 'masterdata':
      return <MasterDataView />

    case 'orders':
      return <OrdersView />

    case 'production':
      return <ProductionView />

    case 'inventory':
      return <InventoryView />

    case 'dispatch':
      return <DispatchView />

    case 'pullouts':
      return <PullOutsView />

    case 'pos':
      return <POSView />

    case 'shifts':
      return <ShiftsView />

    case 'attendance':
      return <AttendanceView />

    case 'billing':
      return <BillingView />

    case 'reports':
      return <ReportsView />

    default:
      return (
        <div className="space-y-5 bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center gap-3 pb-4 border-b border-stone-200">
            <div className="p-2.5 rounded-xl bg-amber-500 text-stone-950 shadow-xs">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-stone-900 uppercase">
                {activeModule.replace('_', ' ')}
              </h2>
              <p className="text-xs text-stone-500">Connected to {currentLocation.name}</p>
            </div>
          </div>
          <div className="p-10 text-center rounded-xl bg-stone-50 border border-dashed border-stone-300">
            <Layers className="w-10 h-10 text-amber-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-stone-900">
              {activeModule.toUpperCase()} Module
            </h3>
            <p className="text-xs text-stone-500 max-w-md mx-auto mt-1">
              Currently connected to{' '}
              <span className="font-bold text-stone-800">{currentLocation.name}</span> with
              permissions for <span className="font-bold text-amber-700">{currentRole}</span>.
            </p>
          </div>
        </div>
      )
  }
}
