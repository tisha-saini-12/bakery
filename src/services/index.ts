/**
 * Bakery Operations Service Abstraction Layer
 * 
 * Provides clean domain hooks decoupling UI components from the underlying state provider.
 * Currently backed by reactive local Zustand + IndexedDB mock store.
 * 
 * Transition to Supabase (Phase 6):
 * 1. Execute SQL script in `supabase/migrations/20261102_init_bakery_schema.sql`
 * 2. Initialize `@supabase/supabase-js` client
 * 3. Swap internal hook implementations with Supabase queries
 * 4. Zero modifications required in UI components!
 */

export * from './useOrders'
export * from './useInventory'
export * from './usePOS'
export * from './useBilling'
export * from './useShifts'
export * from './useAttendance'
