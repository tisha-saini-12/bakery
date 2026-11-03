/**
 * Service Hook: useBilling
 * Encapsulates franchisee and B2B billing statements and payment recording.
 * Seamless migration path: Replace internal calls with `@supabase/supabase-js` client queries.
 */
import { useBakeryStore } from '../store/useBakeryStore'

export function useBilling() {
  const { invoices, recordPayment } = useBakeryStore()

  return {
    invoices,
    recordPayment: (invoiceId: string, amount: number) => {
      // In Production with Supabase:
      // await supabase.from('invoices').update({ paid_amount: amount }).eq('id', invoiceId)
      recordPayment(invoiceId, amount)
    },
  }
}
