# Bakery Commissary & POS Operations Platform

An enterprise-grade internal operations web application and point-of-sale system designed for multi-location artisanal bakery groups operating a central commissary kitchen, retail counters, company stores, and franchise branches.

---

## 🌟 Executive Summary

The application centralizes and synchronizes the entire bakery business lifecycle: from multi-store daily order intake to automated BOM explosion, kitchen batch Kanban tracking, cold-chain fleet dispatch, tablet-optimized retail POS, cash drawer reconciliation, employee attendance kiosk, franchisee billing, and executive analytics.

---

## 🏗️ Core Architecture & 11 Operational Modules

The platform is organized into 3 foundational operational pillars covering 11 modules:

### Phase 1: Commissary Core (Back-of-House)
1. **Master Data & Recipes (BOM):** Products catalog (SKUs, wholesale & retail pricing), raw ingredients with unit conversions (kg, g, L, ml, pcs), and interactive Recipe Builder with dynamic batch scaling (1x–5x).
2. **Consolidated Daily Orders:** Multi-store order intake screen with 02:00 AM cut-off countdown and consolidated SKU demand matrix.
3. **Production Planning & Batch Tracking:** Automated BOM explosion shortage detection, 5-stage batch Kanban board (`Planned` ➔ `Mixing` ➔ `Baking` ➔ `Cooling/QC` ➔ `Packaged`), and scrap/burnt goods variance tracking.
4. **Two-Tier Inventory & Audit Ledger:** Real-time balances for both Raw Ingredients (Commissary) and Finished Goods (Multi-location) backed by an immutable append-only stock movement ledger (`stock_movements`).
5. **Dispatch & Delivery Receiving:** Refrigerated fleet manifests (`VAN-01`, `VAN-02`), in-transit route telemetry, and store receiving checklists with discrepancy tracking.
6. **Leftovers & Pull-Out Tracking:** Day-old bread reconciliation, 50% promo conversion shelf, staff meals, and value loss write-offs.

### Phase 2: Counter & People (Front-of-House)
7. **Tablet-Optimized Retail POS:** Touch-optimized UI ($\ge 44\text{px}$ targets) with category tabs (`Breads`, `Pastries`, `Cakes`, `Beverages`, `Promos`), responsive cart with modifiers, hardware barcode simulator, and multi-tender checkout (`Cash`, `Card`, `QR / E-Wallet`).
8. **Attendance Kiosk:** Fast employee selection with 4-digit PIN authentication on shared tablets, webcam photo snapshot simulation, and timestamped clock-in/out records.
9. **Shift Closing & Cash Drawer Reconciliation:** Opening float declaration, mid-shift safe drops, system expected cash formula ($Float + Cash Sales - Safe Drops$), counted drawer cash, and over/short variance calculation with manager sign-off.

### Phase 3: Money & Insight (Finance & Management)
10. **Billing Statements & Accounts Receivable:** Automated delivery-linked customer invoices for franchisee outlets and B2B clients, payment recording (bank transfer, check, cash), and aging balance tracking.
11. **Executive Overview Dashboard & Reports:** 6 real-time operational cards, product category revenue contribution, batch scrap analysis, and 1-click exportable `.csv` downloads.

---

## ⚡ Offline-First Resilience

* **Zero-Downtime Registers:** In the event of network disruption, the retail till and attendance kiosk transition automatically to local persistence mode with zero data loss.
* **Background Sync Queue:** Transactions are queued with monotonic sequence IDs and automatically reconcile with central inventory upon connectivity resumption.

---

## 🔐 Multi-Tenant Persona & Security Matrix

Built for shared tablet environments across 9 distinct operational roles:
* `admin` — Full platform privileges and configuration
* `commissary_manager` — Recipe formulations, batch approvals, kitchen oversight
* `production_staff` — Mixing, oven baking, batch packaging, and yield tracking
* `inventory_manager` — Raw ingredient stock, supplier PO receiving, and adjustments
* `dispatch_staff` — Vehicle packing manifests and driver route management
* `store_manager` — Replenishment orders, store receiving, and shift sign-offs
* `cashier` — Touch POS counter, cash drawer, and shift closing
* `finance_staff` — Franchisee billing, payment collections, and AR aging
* `attendance_manager` — Staff scheduling and biometric clock-in logs

---

## 💻 Tech Stack

* **Front End:** React 19, TypeScript, Vite 8, Progressive Web App (PWA) with `manifest.json`
* **Styling:** Tailwind CSS v4, Google Fonts (*Plus Jakarta Sans*, *JetBrains Mono*), Lucide React
* **State & Persistence:** Zustand with persistent local storage and IndexedDB queue abstraction
* **Database & Migrations:** Production PostgreSQL / Supabase migration scripts with Row Level Security (RLS) policies

---

## 🚀 Getting Started

### Prerequisites
* Node.js 18+
* npm 9+

### Installation & Local Development

```bash
# Clone the repository
git clone https://github.com/tisha-saini-12/bakery.git
cd bakery

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will launch on `http://localhost:5174/` (or `http://localhost:5173/`).

---

## 🗄️ Supabase Production Migration Path

The application encapsulates all data access in clean service hooks located in [`src/services/`](src/services):
* `useOrders()`
* `useInventory()`
* `usePOS()`
* `useBilling()`
* `useShifts()`
* `useAttendance()`

When transitioning to live Supabase infrastructure:
1. Apply the pre-prepared migration script: `supabase/migrations/20261102_init_bakery_schema.sql`
2. Initialize `@supabase/supabase-js` with project URL and public key.
3. Replace the internal service hook implementations with Supabase queries. **Zero UI redesign or business logic modification is required.**

---

## 📄 License

Proprietary and Confidential. Built for internal bakery commissary operations.
