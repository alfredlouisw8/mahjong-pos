-- ─── EXTENSIONS ──────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── ENUMS ───────────────────────────────────────────────
CREATE TYPE table_status    AS ENUM ('available', 'occupied', 'reserved', 'maintenance');
CREATE TYPE session_status  AS ENUM ('active', 'closed', 'voided');
CREATE TYPE shift_status    AS ENUM ('active', 'closed');
CREATE TYPE billing_mode    AS ENUM ('block_hour', 'per_minute');
CREATE TYPE reservation_status AS ENUM ('booked', 'seated', 'cancelled', 'no_show');
CREATE TYPE expense_category AS ENUM (
  'rent', 'staff_wages', 'utilities', 'supplies',
  'equipment', 'marketing', 'maintenance', 'other'
);
CREATE TYPE stock_action    AS ENUM ('restock', 'adjustment', 'consumed', 'waste');

-- ─── CONFIG ──────────────────────────────────────────────
CREATE TABLE config (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- ─── PROFILES ────────────────────────────────────────────
CREATE TABLE profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── CASHIERS ────────────────────────────────────────────
CREATE TABLE cashiers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  pin_hash   TEXT,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SHIFTS ──────────────────────────────────────────────
CREATE TABLE shifts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  start_time      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time        TIMESTAMPTZ,
  opening_cash    NUMERIC(12,2) NOT NULL DEFAULT 0,
  closing_cash    NUMERIC(12,2),
  cash_variance   NUMERIC(12,2),
  status          shift_status NOT NULL DEFAULT 'active',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SHIFT EMPLOYEES ─────────────────────────────────────
CREATE TABLE shift_employees (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id    UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  cashier_id  UUID NOT NULL REFERENCES cashiers(id),
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  left_at     TIMESTAMPTZ,
  role_label  TEXT DEFAULT 'Cashier',
  UNIQUE(shift_id, cashier_id)
);

-- ─── TABLES ──────────────────────────────────────────────
CREATE TABLE tables (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label               TEXT NOT NULL,
  sort_order          INT NOT NULL DEFAULT 0,
  status              table_status NOT NULL DEFAULT 'available',
  current_session_id  UUID,
  qr_token            TEXT UNIQUE NOT NULL DEFAULT replace(gen_random_uuid()::text, '-', ''),
  qr_generated_at     TIMESTAMPTZ DEFAULT NOW(),
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SESSIONS ────────────────────────────────────────────
CREATE TABLE sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id        UUID NOT NULL REFERENCES tables(id),
  shift_id        UUID REFERENCES shifts(id),
  opened_by       UUID REFERENCES cashiers(id),
  closed_by       UUID REFERENCES cashiers(id),
  start_time      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time        TIMESTAMPTZ,
  billing_mode    billing_mode NOT NULL,
  hourly_rate     NUMERIC(12,2) NOT NULL,
  blocks_purchased  INT DEFAULT 1,
  block_ends_at     TIMESTAMPTZ,
  table_charge    NUMERIC(12,2),
  status          session_status NOT NULL DEFAULT 'active',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tables
  ADD CONSTRAINT fk_current_session
  FOREIGN KEY (current_session_id) REFERENCES sessions(id);

-- ─── MENU ITEMS ──────────────────────────────────────────
CREATE TABLE menu_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  category        TEXT NOT NULL,
  price           NUMERIC(12,2) NOT NULL,
  cogs            NUMERIC(12,2) NOT NULL DEFAULT 0,
  is_available    BOOLEAN NOT NULL DEFAULT TRUE,
  track_inventory BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order      INT NOT NULL DEFAULT 0,
  image_url       TEXT,
  description     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── INVENTORY ───────────────────────────────────────────
CREATE TABLE inventory_items (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  unit                TEXT NOT NULL,
  current_stock       NUMERIC(12,3) NOT NULL DEFAULT 0,
  low_stock_threshold NUMERIC(12,3) NOT NULL DEFAULT 5,
  cost_per_unit       NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─── MENU ↔ INVENTORY ─────────────────────────────────────
CREATE TABLE menu_item_ingredients (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id        UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  inventory_item_id   UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  quantity_used       NUMERIC(12,4) NOT NULL,
  UNIQUE(menu_item_id, inventory_item_id)
);

-- ─── INVENTORY MOVEMENTS ─────────────────────────────────
CREATE TABLE inventory_movements (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id   UUID NOT NULL REFERENCES inventory_items(id),
  action              stock_action NOT NULL,
  quantity            NUMERIC(12,4) NOT NULL,
  reference_id        UUID,
  notes               TEXT,
  recorded_by         UUID REFERENCES cashiers(id),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ORDERS ──────────────────────────────────────────────
CREATE TABLE orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL REFERENCES sessions(id),
  menu_item_id    UUID NOT NULL REFERENCES menu_items(id),
  quantity        INT NOT NULL DEFAULT 1,
  unit_price      NUMERIC(12,2) NOT NULL,
  unit_cogs       NUMERIC(12,2) NOT NULL,
  note            TEXT,
  source          TEXT NOT NULL DEFAULT 'cashier',
  status          TEXT NOT NULL DEFAULT 'pending',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── RESERVATIONS ────────────────────────────────────────
CREATE TABLE reservations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id    UUID REFERENCES tables(id),
  guest_name  TEXT NOT NULL,
  phone       TEXT,
  party_size  INT NOT NULL DEFAULT 1,
  datetime    TIMESTAMPTZ NOT NULL,
  status      reservation_status NOT NULL DEFAULT 'booked',
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── EXPENSES ────────────────────────────────────────────
CREATE TABLE expenses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date        DATE NOT NULL,
  category    expense_category NOT NULL,
  description TEXT NOT NULL,
  amount      NUMERIC(12,2) NOT NULL,
  receipt_url TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── RECEIPTS ────────────────────────────────────────────
CREATE TABLE receipts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES sessions(id),
  printed_at  TIMESTAMPTZ DEFAULT NOW(),
  printed_by  UUID REFERENCES cashiers(id),
  snapshot    JSONB NOT NULL
);

-- ─── INDEXES ─────────────────────────────────────────────
CREATE INDEX idx_sessions_table_id       ON sessions(table_id);
CREATE INDEX idx_sessions_shift_id       ON sessions(shift_id);
CREATE INDEX idx_orders_session_id       ON orders(session_id);
CREATE INDEX idx_orders_created_at       ON orders(created_at);
CREATE INDEX idx_expenses_date           ON expenses(date);
CREATE INDEX idx_reservations_datetime   ON reservations(datetime);
CREATE INDEX idx_inventory_movements_item ON inventory_movements(inventory_item_id);
CREATE INDEX idx_shift_employees_shift   ON shift_employees(shift_id);
CREATE INDEX idx_shift_employees_cashier ON shift_employees(cashier_id);
