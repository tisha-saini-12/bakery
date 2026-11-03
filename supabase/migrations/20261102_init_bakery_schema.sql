-- ==============================================================================
-- Bakery Commissary & POS Production Schema Migration
-- Compatible with PostgreSQL 15+ and Supabase
-- Generated: 2026-11-02
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUM TYPES
DO $$ BEGIN
    CREATE TYPE location_type AS ENUM ('commissary', 'store', 'franchise', 'kiosk');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('draft', 'submitted', 'approved', 'in_production', 'ready_for_dispatch', 'dispatched', 'delivered', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE batch_status AS ENUM ('planned', 'mixing', 'baking', 'cooling', 'packaged', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE movement_type AS ENUM ('po_in', 'production_out', 'production_in', 'dispatch_out', 'receive_in', 'sale_out', 'pullout_loss', 'adjustment');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE dispatch_status AS ENUM ('preparing', 'in_transit', 'delivered', 'discrepancy');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE tender_method AS ENUM ('cash', 'card', 'qr_wallet');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE shift_status AS ENUM ('open', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE invoice_status AS ENUM ('draft', 'issued', 'partially_paid', 'paid', 'overdue');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE pullout_reason AS ENUM ('day_old', 'damaged', 'expired', 'overproduction');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE pullout_disposition AS ENUM ('discounted_sale', 'staff_meal', 'animal_feed', 'discard');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. TABLES

-- Locations (Central Commissary, Outlets, Franchises)
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    type location_type NOT NULL,
    address TEXT,
    phone VARCHAR(30),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Raw Ingredients Catalog (Tier 1 Commissary Stock)
CREATE TABLE IF NOT EXISTS ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    unit_of_measure VARCHAR(10) NOT NULL,
    current_stock NUMERIC(12, 3) NOT NULL DEFAULT 0,
    min_stock_level NUMERIC(12, 3) NOT NULL DEFAULT 0,
    cost_per_unit NUMERIC(10, 4) NOT NULL DEFAULT 0,
    supplier VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Finished Goods Products Catalog
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    wholesale_price NUMERIC(10, 2) NOT NULL,
    retail_price NUMERIC(10, 2) NOT NULL,
    current_stock INTEGER NOT NULL DEFAULT 0,
    min_stock_level INTEGER NOT NULL DEFAULT 0,
    unit VARCHAR(10) DEFAULT 'pcs',
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Location Finished Goods Inventory (Tier 2 Multi-Location Stock)
CREATE TABLE IF NOT EXISTS location_inventories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    current_stock INTEGER NOT NULL DEFAULT 0,
    min_stock_level INTEGER NOT NULL DEFAULT 10,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(location_id, product_id)
);

-- Master Recipes & BOM (Bill of Materials)
CREATE TABLE IF NOT EXISTS recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    base_yield_units INTEGER NOT NULL DEFAULT 100,
    prep_time_minutes INTEGER DEFAULT 30,
    bake_time_minutes INTEGER DEFAULT 20,
    bake_temperature_celsius INTEGER DEFAULT 200,
    instructions TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recipe Ingredients BOM Breakdown
CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES ingredients(id) ON DELETE RESTRICT,
    quantity_per_batch NUMERIC(12, 3) NOT NULL,
    unit VARCHAR(10) NOT NULL,
    UNIQUE(recipe_id, ingredient_id)
);

-- Daily Consolidated Store Orders
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(40) UNIQUE NOT NULL,
    location_id UUID REFERENCES locations(id) ON DELETE RESTRICT,
    order_date TIMESTAMPTZ DEFAULT NOW(),
    delivery_date VARCHAR(50) NOT NULL,
    status order_status DEFAULT 'submitted',
    type VARCHAR(30) DEFAULT 'store_replenishment',
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Line Items
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL
);

-- Production Batches (Commissary Kitchen)
CREATE TABLE IF NOT EXISTS production_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_number VARCHAR(40) UNIQUE NOT NULL,
    recipe_id UUID REFERENCES recipes(id) ON DELETE RESTRICT,
    product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
    planned_yield INTEGER NOT NULL,
    actual_yield INTEGER,
    status batch_status DEFAULT 'planned',
    scheduled_date DATE DEFAULT CURRENT_DATE,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    assigned_to VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Immutable Stock Movements Audit Ledger
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    item_type VARCHAR(20) NOT NULL, -- 'ingredient' or 'product'
    item_id UUID NOT NULL,
    item_name VARCHAR(100) NOT NULL,
    movement_type movement_type NOT NULL,
    quantity NUMERIC(12, 3) NOT NULL,
    unit VARCHAR(10) NOT NULL,
    source_location_id UUID REFERENCES locations(id),
    destination_location_id UUID REFERENCES locations(id),
    reference_id VARCHAR(50), -- e.g. PO-1001, BATCH-20261102-001, POS-xxx
    notes TEXT
);

-- Logistics Dispatches & Fleet Transit
CREATE TABLE IF NOT EXISTS dispatches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispatch_number VARCHAR(40) UNIQUE NOT NULL,
    destination_location_id UUID REFERENCES locations(id) ON DELETE RESTRICT,
    vehicle_number VARCHAR(50) NOT NULL,
    driver_name VARCHAR(100) NOT NULL,
    driver_phone VARCHAR(30) NOT NULL,
    status dispatch_status DEFAULT 'preparing',
    dispatched_at TIMESTAMPTZ DEFAULT NOW(),
    received_at TIMESTAMPTZ,
    notes TEXT
);

-- Dispatch Cargo Line Items
CREATE TABLE IF NOT EXISTS dispatch_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispatch_id UUID REFERENCES dispatches(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
    dispatched_qty INTEGER NOT NULL,
    received_qty INTEGER,
    discrepancy_reason TEXT
);

-- Leftovers & Goods Pull-Outs
CREATE TABLE IF NOT EXISTS pullouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID REFERENCES locations(id) ON DELETE RESTRICT,
    product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL,
    reason pullout_reason NOT NULL,
    disposition pullout_disposition NOT NULL,
    reported_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shift Closing & Cash Drawer Reconciliation
CREATE TABLE IF NOT EXISTS shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID REFERENCES locations(id) ON DELETE RESTRICT,
    cashier_id VARCHAR(50) NOT NULL,
    cashier_name VARCHAR(100) NOT NULL,
    opening_float NUMERIC(10, 2) NOT NULL,
    system_expected_cash NUMERIC(10, 2) NOT NULL DEFAULT 0,
    counted_cash NUMERIC(10, 2),
    cash_variance NUMERIC(10, 2), -- Over/Short calculation
    status shift_status DEFAULT 'open',
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    notes TEXT
);

-- Mid-shift Safe Drops
CREATE TABLE IF NOT EXISTS safe_drops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shift_id UUID REFERENCES shifts(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    dropped_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employee Attendance Kiosk
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id VARCHAR(50) NOT NULL,
    employee_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    location_id UUID REFERENCES locations(id) ON DELETE RESTRICT,
    clock_in TIMESTAMPTZ DEFAULT NOW(),
    clock_out TIMESTAMPTZ,
    photo_url TEXT,
    verified BOOLEAN DEFAULT TRUE
);

-- Retail POS Sales Transactions
CREATE TABLE IF NOT EXISTS pos_sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_number VARCHAR(40) UNIQUE NOT NULL,
    location_id UUID REFERENCES locations(id) ON DELETE RESTRICT,
    cashier_id VARCHAR(50) NOT NULL,
    cashier_name VARCHAR(100) NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL,
    tax NUMERIC(10, 2) NOT NULL,
    discount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    total NUMERIC(10, 2) NOT NULL,
    payment_method tender_method NOT NULL,
    amount_tendered NUMERIC(10, 2) NOT NULL,
    change_due NUMERIC(10, 2) NOT NULL DEFAULT 0,
    is_offline BOOLEAN DEFAULT FALSE,
    synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Retail POS Sale Line Items
CREATE TABLE IF NOT EXISTS pos_sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID REFERENCES pos_sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL,
    retail_price NUMERIC(10, 2) NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL
);

-- Franchisee & B2B Invoices (Accounts Receivable)
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(40) UNIQUE NOT NULL,
    order_id UUID REFERENCES orders(id),
    customer_id UUID REFERENCES locations(id),
    customer_name VARCHAR(100) NOT NULL,
    customer_type VARCHAR(30) NOT NULL,
    invoice_date DATE DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    balance NUMERIC(10, 2) NOT NULL,
    status invoice_status DEFAULT 'issued',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice Payments Ledger
CREATE TABLE IF NOT EXISTS invoice_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    payment_date TIMESTAMPTZ DEFAULT NOW(),
    amount NUMERIC(10, 2) NOT NULL,
    payment_method VARCHAR(30) NOT NULL,
    reference_number VARCHAR(50)
);

-- 4. INDEXES FOR HIGH-THROUGHPUT QUERIES
CREATE INDEX IF NOT EXISTS idx_stock_movements_timestamp ON stock_movements(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_stock_movements_item ON stock_movements(item_id, item_type);
CREATE INDEX IF NOT EXISTS idx_pos_sales_created ON pos_sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pos_sales_location ON pos_sales(location_id);
CREATE INDEX IF NOT EXISTS idx_production_batches_status ON production_batches(status);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_inventories ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Allow authenticated read/write access
CREATE POLICY "Allow authenticated read on products" ON products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read on ingredients" ON ingredients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read on locations" ON locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read on orders" ON orders FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated read on pos_sales" ON pos_sales FOR ALL TO authenticated USING (true);
