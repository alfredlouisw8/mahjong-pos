# Mahjong Parlor — Product Requirements Document (PRD)

**Version:** 2.0  
**Prepared for:** Claude Code  
**Last Updated:** 2026-05-14  
**Changes from v1:** Dynamic table CRUD · Billing mode options (block-hour / per-minute) · Multi-employee shifts with edit · Supabase replaces Prisma + NextAuth · Per-table QR codes for customer mobile ordering · Receipt printing · F&B inventory management

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [User Roles & Permissions](#2-user-roles--permissions)
3. [Technical Stack](#3-technical-stack)
4. [System Architecture](#4-system-architecture)
5. [Database Schema (Supabase)](#5-database-schema-supabase)
6. [Feature Specifications](#6-feature-specifications)
   - 6.1 Authentication (Supabase Auth)
   - 6.2 Shift Management (Multi-Employee)
   - 6.3 Table Management (Dynamic CRUD)
   - 6.4 Billing Modes
   - 6.5 F&B POS
   - 6.6 Menu Manager & Inventory
   - 6.7 Table Reservations
   - 6.8 Expense Tracking
   - 6.9 Reports & Books
   - 6.10 CSV Export
   - 6.11 QR Code Customer Ordering
   - 6.12 Receipt Printing
   - 6.13 Admin Panel
7. [UI/UX Specifications](#7-uiux-specifications)
8. [Business Logic & Formulas](#8-business-logic--formulas)
9. [API Endpoints](#9-api-endpoints)
10. [Non-Functional Requirements](#10-non-functional-requirements)
11. [File & Folder Structure](#11-file--folder-structure)
12. [Environment Variables](#12-environment-variables)
13. [Seed / Default Data](#13-seed--default-data)
14. [Out of Scope (v1)](#14-out-of-scope-v1)
15. [Quick Start](#15-quick-start)

---

## 1. Product Overview

A **full-stack Point-of-Sale and operations management system** for a physical Mahjong parlor with a **configurable number of tables** (default 13, fully manageable via CRUD). Built on **Supabase** for both auth and database.

### Core capabilities

- Dynamic table management — add, rename, reorder, deactivate, delete tables at any time
- Two billing modes selectable globally by admin:
  - **Block-Hour mode** — customer pays per whole hour block; session starts at exact clock time and locks in 1-hour blocks. Extension = add another block.
  - **Per-Minute mode** — charge accrues every minute (not second). Displayed as HH:MM.
- Multi-employee shifts — multiple cashiers can be on a single shift, with assignable roles and editable start/end times
- F&B orders with full ingredient-level inventory tracking and low-stock alerts
- Per-table QR codes that open a customer-facing mobile ordering page
- Receipt printing via browser print API (thermal-printer-friendly layout)
- Operating expense logging → full P&L with net profit
- CSV export for bookkeeping

### Revenue model

```
Revenue        = Table time charge + F&B sales
Gross Profit   = Revenue − F&B COGS
Net Profit     = Gross Profit − Operating Expenses
```

---

## 2. User Roles & Permissions

Three roles managed via **Supabase Auth** + a `profiles` table:

| Feature                                   | Customer (QR) | Cashier | Admin |
| ----------------------------------------- | ------------- | ------- | ----- |
| View QR ordering menu                     | ✅            | —       | —     |
| Place F&B order via QR (sent to table)    | ✅            | —       | —     |
| View tables floor                         | —             | ✅      | ✅    |
| Start / end / extend table sessions       | —             | ✅      | ✅    |
| Add F&B orders to tables                  | —             | ✅      | ✅    |
| View running bill                         | —             | ✅      | ✅    |
| Settle & close session                    | —             | ✅      | ✅    |
| Print receipt                             | —             | ✅      | ✅    |
| Create / edit reservations                | —             | ✅      | ✅    |
| Start / join / end own shift              | —             | ✅      | ✅    |
| View own shift summary                    | —             | ✅      | ✅    |
| View Today's report                       | —             | ✅      | ✅    |
| Add / edit / delete tables                | —             | ❌      | ✅    |
| Regenerate table QR codes                 | —             | ❌      | ✅    |
| Add / edit / delete menu items            | —             | ❌      | ✅    |
| Manage inventory (stock levels, reorder)  | —             | ❌      | ✅    |
| Set billing mode & hourly rate            | —             | ❌      | ✅    |
| Add / edit cashiers                       | —             | ❌      | ✅    |
| Edit any shift (time, employees)          | —             | ❌      | ✅    |
| Log operating expenses                    | —             | ❌      | ✅    |
| View full historical reports (all ranges) | —             | ❌      | ✅    |
| Export CSV                                | —             | ❌      | ✅    |
| Access Admin Panel                        | —             | ❌      | ✅    |

---

## 3. Technical Stack

### Frontend

| Layer            | Choice                                                             | Rationale                                     |
| ---------------- | ------------------------------------------------------------------ | --------------------------------------------- |
| Framework        | **Next.js 14** (App Router)                                        | SSR + API routes + edge functions in one repo |
| Language         | **TypeScript** (strict)                                            | Type safety end-to-end                        |
| Styling          | **Tailwind CSS v3**                                                | Utility-first, no CSS modules                 |
| UI Components    | **shadcn/ui**                                                      | Radix UI primitives, customizable             |
| Icons            | **Lucide React**                                                   | Consistent icon set                           |
| State Management | **Zustand**                                                        | Lightweight global store                      |
| Data Fetching    | **TanStack Query v5**                                              | Caching, refetch on focus, polling            |
| Forms            | **React Hook Form + Zod**                                          | Validation with type inference                |
| Tables           | **TanStack Table v8**                                              | Headless, sortable, paginated                 |
| Charts           | **Recharts**                                                       | Revenue + expense charts                      |
| QR Codes         | **qrcode** npm package                                             | Generate QR SVG/PNG server-side               |
| Date Handling    | **date-fns** + **date-fns-tz**                                     | Timezone-aware                                |
| Receipt / Print  | **react-to-print**                                                 | Thermal-friendly print layout                 |
| Fonts            | `Cormorant Garamond` (display) + `Manrope` (body) via Google Fonts |                                               |

### Backend / Database

| Layer            | Choice                                                                          | Rationale                                          |
| ---------------- | ------------------------------------------------------------------------------- | -------------------------------------------------- |
| Auth             | **Supabase Auth**                                                               | Email/password for admin; magic link optional; JWT |
| Database         | **Supabase PostgreSQL**                                                         | Managed Postgres with Row Level Security           |
| ORM / Query      | **Supabase JS Client (`@supabase/supabase-js`)**                                | Type-safe auto-generated types from schema         |
| Type Generation  | `supabase gen types typescript`                                                 | Syncs DB types to TypeScript                       |
| Realtime         | **Supabase Realtime**                                                           | Live table status updates across devices           |
| Storage          | **Supabase Storage**                                                            | QR code image assets (optional)                    |
| API Layer        | **Next.js API Routes** (App Router `route.ts`)                                  | Business logic + auth guards                       |
| Cashier PIN Auth | Custom: PIN hash stored in `cashiers` table, verified server-side via API route | Cashiers are not Supabase Auth users               |
| Password Hashing | **bcryptjs** (for cashier PINs)                                                 | Admin passwords handled by Supabase Auth           |

> **Key distinction:**
>
> - **Admin accounts** → Supabase Auth users (email + password, managed in Supabase dashboard).
> - **Cashier accounts** → rows in the `cashiers` table, PIN-authenticated via custom API route. No Supabase Auth account needed.
> - **Customers (QR)** → anonymous, no auth. Table token in QR URL validates they're at the right table.

### Infrastructure

| Layer                      | Choice                                         |
| -------------------------- | ---------------------------------------------- |
| Hosting                    | **Vercel**                                     |
| Database + Auth + Realtime | **Supabase** (free tier for dev, Pro for prod) |
| Environment                | `.env.local` for dev, Vercel env vars for prod |

### Dev Tools

- ESLint + Prettier
- Husky + lint-staged
- `supabase` CLI — local dev, migrations, type generation
- Docker (Supabase local stack via `supabase start`)

---

## 4. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Next.js App (Vercel)                        │
│                                                                  │
│  ┌──────────────────────┐   ┌──────────────────────────────┐    │
│  │    App Router Pages   │   │      API Routes (route.ts)   │    │
│  │                       │   │                              │    │
│  │  /                    │   │  /api/auth/cashier           │    │
│  │  /login (admin)       │   │  /api/tables (CRUD)          │    │
│  │  /pos/tables          │◄──│  /api/sessions               │    │
│  │  /pos/orders          │   │  /api/orders                 │    │
│  │  /pos/reservations    │   │  /api/shifts                 │    │
│  │  /pos/shift           │   │  /api/menu                   │    │
│  │  /admin/*             │   │  /api/inventory              │    │
│  │  /order/:tableToken   │   │  /api/reservations           │    │
│  │  (customer QR page)   │   │  /api/expenses               │    │
│  └──────────────────────┘   │  /api/reports                │    │
│            │                │  /api/export                 │    │
│            │                │  /api/qr                     │    │
│            │                │  /api/receipt                │    │
│            │                └──────────────┬───────────────┘    │
│            │                               │                     │
│            └───────────────────────────────▼─────────────────┐  │
│                         Supabase JS Client                    │  │
│  ┌────────────────────────────────────────────────────────┐  │  │
│  │                  Supabase Platform                      │  │  │
│  │                                                         │  │  │
│  │   Auth (admin users)  │  PostgreSQL DB  │  Realtime     │  │  │
│  │                       │                 │  (tables,     │  │  │
│  │                       │  RLS policies   │   orders)     │  │  │
│  └────────────────────────────────────────────────────────┘  │  │
└─────────────────────────────────────────────────────────────────┘

Customer QR flow:
  Customer phone → /order/:tableToken (public page)
  → places order → POST /api/orders/customer
  → Supabase Realtime pushes to cashier POS in real-time
```

### Real-time Strategy

- **Supabase Realtime** subscribed on:
  - `tables` table → status changes reflected instantly on all cashier screens
  - `orders` table → customer QR orders appear instantly on cashier POS
  - `sessions` table → session open/close synced across devices
- **Billing timers** → computed client-side from `session.start_time`; authoritative value computed server-side on close.
- **Polling fallback** → TanStack Query refetches tables every 30s as safety net.

---

## 5. Database Schema (Supabase)

Create via Supabase SQL editor or migration files (`supabase/migrations/`).

```sql
-- ─── EXTENSIONS ──────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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
  -- Keys:
  --   place_name          TEXT    "Mahjong Royale"
  --   currency            TEXT    "IDR"
  --   currency_symbol     TEXT    "Rp"
  --   timezone            TEXT    "Asia/Jakarta"
  --   hourly_rate         NUMERIC "50000"
  --   billing_mode        TEXT    "block_hour" | "per_minute"
  --   qr_base_url         TEXT    "https://yourdomain.com/order"
  --   receipt_header      TEXT    Custom header text for receipts
  --   receipt_footer      TEXT    Custom footer text for receipts
  --   low_stock_threshold INT     "5"  (units)
);

-- ─── PROFILES (Admin users linked to Supabase Auth) ──────
CREATE TABLE profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'admin',  -- always 'admin' for now
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── CASHIERS (Staff — NOT Supabase Auth users) ──────────
CREATE TABLE cashiers (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  pin_hash   TEXT,           -- bcrypt hash; NULL = no PIN required
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SHIFTS ──────────────────────────────────────────────
CREATE TABLE shifts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  start_time      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time        TIMESTAMPTZ,
  opening_cash    NUMERIC(12,2) NOT NULL DEFAULT 0,
  closing_cash    NUMERIC(12,2),
  cash_variance   NUMERIC(12,2),  -- closing_cash - expected_cash
  status          shift_status NOT NULL DEFAULT 'active',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SHIFT EMPLOYEES (many cashiers per shift) ───────────
CREATE TABLE shift_employees (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shift_id    UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  cashier_id  UUID NOT NULL REFERENCES cashiers(id),
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),  -- when they clocked in
  left_at     TIMESTAMPTZ,                          -- when they clocked out (null = still on shift)
  role_label  TEXT DEFAULT 'Cashier',               -- "Cashier", "Floor", "Supervisor" etc.
  UNIQUE(shift_id, cashier_id)
);

-- ─── TABLES ──────────────────────────────────────────────
CREATE TABLE tables (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label               TEXT NOT NULL,           -- "Table 1", "VIP Room A" etc.
  sort_order          INT NOT NULL DEFAULT 0,
  status              table_status NOT NULL DEFAULT 'available',
  current_session_id  UUID,                    -- FK set after sessions table created
  qr_token            TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  qr_generated_at     TIMESTAMPTZ DEFAULT NOW(),
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SESSIONS ────────────────────────────────────────────
CREATE TABLE sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_id        UUID NOT NULL REFERENCES tables(id),
  shift_id        UUID REFERENCES shifts(id),
  opened_by       UUID REFERENCES cashiers(id),  -- cashier who started session
  closed_by       UUID REFERENCES cashiers(id),  -- cashier who settled bill
  start_time      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time        TIMESTAMPTZ,
  billing_mode    billing_mode NOT NULL,          -- locked at session start
  hourly_rate     NUMERIC(12,2) NOT NULL,         -- locked at session start
  -- Block-hour fields
  blocks_purchased  INT DEFAULT 1,               -- number of 1-hour blocks bought
  block_ends_at     TIMESTAMPTZ,                 -- start_time + (blocks_purchased × 1 hour)
  -- Per-minute fields (billing_mode = 'per_minute')
  -- no extra fields; charge = minutes_elapsed × (hourly_rate / 60)
  table_charge    NUMERIC(12,2),                 -- computed on close
  status          session_status NOT NULL DEFAULT 'active',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK from tables back to sessions
ALTER TABLE tables
  ADD CONSTRAINT fk_current_session
  FOREIGN KEY (current_session_id) REFERENCES sessions(id);

-- ─── MENU ITEMS ──────────────────────────────────────────
CREATE TABLE menu_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  category        TEXT NOT NULL,
  price           NUMERIC(12,2) NOT NULL,
  cogs            NUMERIC(12,2) NOT NULL DEFAULT 0,
  is_available    BOOLEAN NOT NULL DEFAULT TRUE,
  track_inventory BOOLEAN NOT NULL DEFAULT FALSE,  -- if TRUE, deduct from inventory on order
  sort_order      INT NOT NULL DEFAULT 0,
  image_url       TEXT,
  description     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── INVENTORY ───────────────────────────────────────────
CREATE TABLE inventory_items (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                TEXT NOT NULL,          -- ingredient or SKU name
  unit                TEXT NOT NULL,          -- "pcs", "litre", "kg", "bottle"
  current_stock       NUMERIC(12,3) NOT NULL DEFAULT 0,
  low_stock_threshold NUMERIC(12,3) NOT NULL DEFAULT 5,
  cost_per_unit       NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─── MENU ↔ INVENTORY (recipe / BOM) ─────────────────────
CREATE TABLE menu_item_ingredients (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_item_id        UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  inventory_item_id   UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  quantity_used       NUMERIC(12,4) NOT NULL,   -- per 1x serving
  UNIQUE(menu_item_id, inventory_item_id)
);

-- ─── INVENTORY MOVEMENTS ─────────────────────────────────
CREATE TABLE inventory_movements (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inventory_item_id   UUID NOT NULL REFERENCES inventory_items(id),
  action              stock_action NOT NULL,
  quantity            NUMERIC(12,4) NOT NULL,    -- positive = added, negative = consumed
  reference_id        UUID,                      -- order_id or manual entry id
  notes               TEXT,
  recorded_by         UUID REFERENCES cashiers(id),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ORDERS ──────────────────────────────────────────────
CREATE TABLE orders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id      UUID NOT NULL REFERENCES sessions(id),
  menu_item_id    UUID NOT NULL REFERENCES menu_items(id),
  quantity        INT NOT NULL DEFAULT 1,
  unit_price      NUMERIC(12,2) NOT NULL,    -- locked at order time
  unit_cogs       NUMERIC(12,2) NOT NULL,    -- locked at order time
  note            TEXT,
  source          TEXT NOT NULL DEFAULT 'cashier',  -- 'cashier' | 'customer_qr'
  status          TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'confirmed' | 'cancelled'
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── RESERVATIONS ────────────────────────────────────────
CREATE TABLE reservations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id  UUID NOT NULL REFERENCES sessions(id),
  printed_at  TIMESTAMPTZ DEFAULT NOW(),
  printed_by  UUID REFERENCES cashiers(id),
  snapshot    JSONB NOT NULL  -- full receipt data at print time (immutable record)
);

-- ─── INDEXES ─────────────────────────────────────────────
CREATE INDEX idx_sessions_table_id    ON sessions(table_id);
CREATE INDEX idx_sessions_shift_id    ON sessions(shift_id);
CREATE INDEX idx_orders_session_id    ON orders(session_id);
CREATE INDEX idx_orders_created_at    ON orders(created_at);
CREATE INDEX idx_expenses_date        ON expenses(date);
CREATE INDEX idx_reservations_datetime ON reservations(datetime);
CREATE INDEX idx_inventory_movements_item ON inventory_movements(inventory_item_id);
CREATE INDEX idx_shift_employees_shift ON shift_employees(shift_id);
CREATE INDEX idx_shift_employees_cashier ON shift_employees(cashier_id);

-- ─── ROW LEVEL SECURITY ──────────────────────────────────
-- Enable RLS on all tables
ALTER TABLE config              ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashiers            ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_employees     ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables              ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders              ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items          ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_item_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses            ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts            ENABLE ROW LEVEL SECURITY;

-- Policy: Service role (used by API routes) can do everything
-- Policy: Anon can read menu_items (for QR ordering page)
CREATE POLICY "anon_read_menu" ON menu_items
  FOR SELECT TO anon USING (is_available = TRUE);

-- Policy: Anon can read table by token (for QR page)
CREATE POLICY "anon_read_table_by_token" ON tables
  FOR SELECT TO anon USING (TRUE);

-- Policy: Anon can insert orders with source='customer_qr'
CREATE POLICY "anon_insert_customer_orders" ON orders
  FOR INSERT TO anon
  WITH CHECK (source = 'customer_qr');

-- All other access goes through authenticated service_role via API routes.
-- API routes use SUPABASE_SERVICE_ROLE_KEY and bypass RLS.
```

### Supabase Auth Setup (Admin)

1. In Supabase Dashboard → Authentication → Enable Email/Password provider.
2. Disable "Confirm email" for internal admin (or enable for security).
3. After admin signs up, insert a row into `profiles` with their UUID.
4. A Supabase trigger auto-inserts the profile row:

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, role)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name', 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();
```

---

## 6. Feature Specifications

### 6.1 Authentication (Supabase Auth)

#### Admin Login (`/login`)

- Email + password form → calls `supabase.auth.signInWithPassword()`.
- On success, Supabase sets a cookie with a JWT (use `@supabase/ssr` package).
- Server-side middleware (`middleware.ts`) checks `supabase.auth.getUser()` on every `/admin` request; redirects to `/login` if no session.
- Session duration: 1 week (configurable in Supabase dashboard).

#### Cashier Shift Gate (root `/` page)

- Not a Supabase Auth user — cashiers authenticate via custom PIN flow.
- Page shows all active cashiers (fetched from `cashiers` table).
- Cashier picks name → PIN pad → API route `POST /api/auth/cashier` verifies PIN with `bcrypt.compare()`.
- On success, API returns a **signed JWT** (`jsonwebtoken` package, signed with `CASHIER_JWT_SECRET`).
- Client stores token in a short-lived cookie (`cashier_token`, httpOnly, 12h).
- All POS API routes validate this `cashier_token` via `verifyToken()` middleware.

#### Customer QR (public, no auth)

- Page `/order/:tableToken` — `tableToken` is the `tables.qr_token` value.
- Server fetches table by token; if not found → 404. If found → render ordering page.
- Customer can only post orders; cannot see any other data.

### 6.2 Shift Management (Multi-Employee)

#### Shift model

A **shift** represents a working period of the parlor (e.g., "Evening Shift 6pm–12am"). Multiple cashiers can be part of a single shift simultaneously, each with their own clock-in/clock-out time via `shift_employees`.

#### Starting a shift

1. First cashier to start creates the shift record (`shifts` table).
2. A `shift_employees` row is created for them with `joined_at = NOW()`.
3. The `shift_id` is stored in their cashier cookie.

#### Joining an existing shift

- If a shift is already `ACTIVE`, subsequent cashiers joining see an option: **"Join current shift"** or **"Start new shift"**.
- Joining: creates a new `shift_employees` row with their `cashier_id`, `joined_at = NOW()`.
- Each cashier gets their own `cashier_token` cookie containing both `cashierId` and `shiftId`.

#### Clocking out (individual)

- Cashier goes to More → Shift → **Clock Out**.
- Sets `shift_employees.left_at = NOW()` for that cashier only.
- Other cashiers remain on the shift.
- Last cashier to clock out triggers the **End Shift** flow.

#### Ending the shift (final cashier)

- Modal shows shift summary: all employees, total duration, session count, revenue.
- Admin or last cashier enters closing cash count.
- System sets `shifts.end_time`, `shifts.closing_cash`, `shifts.cash_variance`, `shifts.status = 'closed'`.

#### Admin: Edit shift

- `/admin/shifts/:id/edit` — Admin can:
  - Change `start_time` and `end_time` (useful for corrections).
  - Add or remove employees (add/delete `shift_employees` rows).
  - Edit `joined_at` / `left_at` for any employee.
  - Edit `opening_cash`, `closing_cash`.
  - Change `notes`.
- All edits are logged (optional audit trail via Postgres trigger, recommended).

#### Shift summary shown to cashier

- Their own clock-in time, hours worked.
- Sessions they opened/closed.
- Revenue for those sessions.
- **Not shown:** full P&L, expenses, other cashiers' data.

### 6.3 Table Management (Dynamic CRUD)

Tables are no longer fixed. Admin can create any number of tables.

**Admin table management — `/admin/tables`**

**List view:**

- Drag-and-drop reorder (updates `sort_order`).
- Toggle active/inactive (inactive tables hidden from POS floor).
- Status badge: Available / Occupied / Reserved / Maintenance.

**Create table form:**
| Field | Type | Validation |
|---|---|---|
| Label | text | required, max 50 chars (e.g. "Table 1", "VIP Room A") |
| Notes | textarea | optional |

On create:

- Auto-generates a `qr_token` (random 16-byte hex string).
- Sets `sort_order` to `MAX(sort_order) + 1`.
- Status defaults to `available`.

**Edit table:**

- Change label, notes, sort_order, status (maintenance only from admin).

**Delete table:**

- Only allowed if table has no active session and no open reservations.
- If table has historical sessions: **soft delete** (`is_active = false`).
- If no history: hard delete.

**QR Code management (per table):**

- Admin can view and download the QR code for any table.
- **Regenerate QR** button: generates a new `qr_token` (invalidates old QR stickers — admin must reprint).
- Old `qr_token` immediately 404s on the customer page.

**POS floor view:**

- Shows only `is_active = true` tables, ordered by `sort_order`.
- Grid adapts automatically: 2 cols mobile → 3 tablet → 4+ desktop (no hardcoded count).

### 6.4 Billing Modes

Admin selects the billing mode globally in Settings. Stored in `config` as `billing_mode`. Takes effect for **new sessions** only; existing sessions keep their mode.

---

#### Mode A: Block-Hour

**Concept:** Customer pays per full 1-hour block. The block is pre-purchased at session start (or when extending). Time is wall-clock-aligned: if a customer starts at 15:15, their first block expires at 16:15.

**Session start:**

1. Cashier taps **Start** on a table.
2. Dialog: "Blocks to purchase" (default: 1). Customer pays upfront for N blocks.
3. `sessions.blocks_purchased = N`
4. `sessions.start_time = NOW()`
5. `sessions.block_ends_at = start_time + N hours` (exact, to the second)
6. `sessions.table_charge = hourly_rate × N` (charged at start)

**Display on table card:**

```
Time remaining:  00:44:12   (countdown to block_ends_at)
Block ends at:   16:15
Blocks:          1 × Rp50,000 = Rp50,000
```

**Extension:**

- When `block_ends_at` is within 15 minutes, a **⚠ Expiring Soon** badge appears on the card.
- Cashier clicks **Extend**.
- Dialog: "Add N more blocks" (default: 1). Additional charge = N × hourly_rate.
- `sessions.blocks_purchased += N`
- `sessions.block_ends_at += N hours`
- `sessions.table_charge += N × hourly_rate`
- Extension must be purchased before the timer hits zero (or admin allows grace period setting).

**Session close:**

- Cashier can close session at any time (customer leaves early). No refund for unused time (prepaid model).
- `table_charge` is already computed and stored; does not change on close.
- `end_time = NOW()`.

**Overstay:**

- If block expires and customer has not extended, table card shows **🔴 OVERTIME** badge.
- Timer switches to counting _up_ (how long they've overstayed).
- Cashier can still extend retroactively.

---

#### Mode B: Per-Minute

**Concept:** Charge accrues every minute. Display is HH:MM (no seconds — updates every 60 seconds).

**Session start:**

1. Cashier taps **Start**.
2. `sessions.start_time = NOW()`
3. No upfront charge. Charge runs continuously.

**Display on table card:**

```
Elapsed:   01:23   (HH:MM, updates every minute)
Accrued:   Rp69,167   (running total)
```

**Charge formula:**

```
minutes_elapsed  = FLOOR((now - start_time) / 60000)
table_charge     = minutes_elapsed × (hourly_rate / 60)
```

**Session close:**

- Charge computed at close time (to the minute).
- No pre-payment. Bill presented at end.

---

#### Billing mode indicator

- A **pill badge** at the top of the POS floor shows the current mode:
  - `⏱ Block-Hour @ Rp50,000/hr`
  - `⏱ Per-Minute @ Rp50,000/hr`

### 6.5 F&B POS

**POS tab (`/pos/orders`):**

- Tab strip: all occupied tables.
- Selected table: current order list + full menu grid below.
- Tap menu item → adds 1 qty (or increments).
- Order list: name, qty stepper (−/+), line total, note icon, remove.
- F&B subtotal shown live.
- **Customer QR orders** appear in the order list with a 📱 icon and status badge (`pending`). Cashier must **Confirm** or **Cancel** each QR order.

**Bill Modal:**

- Triggered by End Session or View Bill.
- Shows: session start, duration.
- **Block-Hour mode:** shows blocks purchased, block_ends_at, total time charge.
- **Per-Minute mode:** shows minutes elapsed, rate, total time charge.
- Lists all F&B items (grouped: cashier orders | customer QR orders).
- Grand Total = time charge + F&B total.
- Admin view only: COGS + session profit.
- Print Receipt button (opens print modal).
- Settle & Close button.

**Running Bill (View Bill on active):**

- Same layout with live charge (updates every 1 min for per-minute; shows static blocks for block-hour).

### 6.6 Menu Manager & Inventory

#### Menu Manager (`/admin/menu`)

**Item fields:**
| Field | Type | Validation |
|---|---|---|
| Name | text | required, max 80 chars |
| Category | text (free or select) | required |
| Price | decimal | required, ≥ 0 |
| COGS | decimal | required, ≥ 0 |
| Available | toggle | default true |
| Track Inventory | toggle | if ON, stock is deducted when ordered |
| Image | file upload (Supabase Storage) | optional, max 2MB |
| Description | textarea | optional |
| Sort Order | number | auto-set, draggable |

**Delete:** Soft-delete if item has order history; hard-delete if no orders.

**Per-item inventory link:**

- When "Track Inventory" is ON, admin can add **ingredients** (from `inventory_items`) with a quantity-per-serving.
- Example: "Jasmine Tea Pot" uses 2 teabags + 0.5L water.
- When this item is ordered and confirmed, those quantities are deducted automatically from `inventory_items.current_stock` via `inventory_movements`.

---

#### Inventory Management (`/admin/inventory`)

**Inventory item fields:**
| Field | Type | Validation |
|---|---|---|
| Name | text | required (e.g. "Jasmine Teabags", "Bottled Beer 330ml") |
| Unit | text | required (e.g. "pcs", "litre", "kg", "bottle") |
| Current Stock | decimal | required |
| Low Stock Threshold | decimal | required (triggers alert) |
| Cost Per Unit | decimal | required |

**Inventory list view:**

- Table with: Name, Unit, Current Stock, Threshold, Status badge.
- **Status badges:** 🟢 OK | 🟡 Low | 🔴 Out of Stock.
- Filter: All / Low Stock / Out of Stock.
- Sort by: Name / Stock Level / Category.

**Restock flow:**

1. Click **Restock** on any item.
2. Dialog: enter quantity added + optional cost note.
3. Creates `inventory_movements` row (`action = 'restock'`, positive quantity).
4. Updates `inventory_items.current_stock += quantity`.

**Manual adjustment:**

- Admin can correct stock count (e.g. after physical count).
- Creates `inventory_movements` row (`action = 'adjustment'`).
- Notes field required for adjustments.

**Consumption (automatic):**

- When a cashier/customer order is **confirmed** (status goes `pending` → `confirmed`):
  - For each ingredient in `menu_item_ingredients` for that item:
    - `inventory_movements` row created (`action = 'consumed'`, quantity = ingredient.quantity_used × order.quantity, negative).
    - `inventory_items.current_stock -= quantity`.
  - If resulting stock ≤ `low_stock_threshold`, trigger low-stock alert (toast on cashier POS + badge on admin sidebar).

**Waste logging:**

- Admin can manually log waste (`action = 'waste'`): reduces stock + creates movement record.

**Inventory movement log:**

- `/admin/inventory/:id/movements` — chronological log of all movements for an item.
- Columns: Date, Action, Quantity, Reference (order ID or "Manual"), Notes, Recorded By.

**Low stock dashboard widget:**

- Admin dashboard shows a panel: "⚠ Low Stock Items" listing all items at or below threshold.
- Cashier POS shows a small banner: "⚠ 3 items low stock" (click → admin panel).

**Reports:**

- Inventory valuation: `Σ (current_stock × cost_per_unit)` for all items.
- COGS reconciliation: COGS from orders vs actual inventory consumption (variance report).

### 6.7 Table Reservations

**Reservation list (`/pos/tables` → Reservations tab):**

- Sorted by `datetime` ascending.
- Filter tabs: Upcoming | All | Cancelled.
- Status badges: `BOOKED` (amber) | `SEATED` (green) | `CANCELLED` (red) | `NO_SHOW` (grey).

**Create/Edit Reservation:**
| Field | Type | Validation |
|---|---|---|
| Guest Name | text | required |
| Phone | text | optional |
| Party Size | number | required, 1–20 |
| Date | date picker | required |
| Time | time picker | required |
| Table | select from active tables | optional |
| Notes | textarea | optional, max 300 chars |

**Seat button:**

- If reservation has a `table_id` and that table is AVAILABLE → auto-starts session, marks reservation `SEATED`.
- Otherwise shows: "Please seat from the Floor tab manually."

**Upcoming banner:**

- Top of floor view shows count of reservations in next 2 hours.

**No-show:** Admin marks as `NO_SHOW` after the booking time passes.

### 6.8 Expense Tracking

**Admin only — `/admin/expenses`**

**Add Expense:**
| Field | Type | Validation |
|---|---|---|
| Date | date | required |
| Category | select (`expense_category` enum) | required |
| Description | text | required, max 200 chars |
| Amount | decimal | required, > 0 |
| Receipt Photo | file upload (optional) | Supabase Storage |

**Expense list:**

- Grouped by month with monthly subtotals.
- Category breakdown doughnut chart.
- Duplicate button (copy entry, change date).

**Expense categories displayed as labels:**

- Rent | Staff Wages | Utilities | Supplies | Equipment | Marketing | Maintenance | Other

### 6.9 Reports & Books

**Cashier access:** Today's stats for their current shift only.  
**Admin access:** All ranges + full P&L + inventory reports.

**Time ranges:** Today | Yesterday | This Week | This Month | Last Month | Custom Range (date picker).

#### Summary stat cards

| Metric                | Formula                                    |
| --------------------- | ------------------------------------------ |
| Total Revenue         | table_charges + F&B income                 |
| Table Income          | Σ sessions.table_charge (closed, in range) |
| F&B Income            | Σ (unit_price × qty) for confirmed orders  |
| F&B COGS              | Σ (unit_cogs × qty) for confirmed orders   |
| Gross Profit          | Revenue − COGS                             |
| Operating Expenses    | Σ expenses.amount in range                 |
| Net Profit            | Gross Profit − Operating Expenses          |
| Net Margin %          | Net Profit / Revenue × 100                 |
| Sessions              | Count closed sessions                      |
| Table Hours           | Σ durations (hours)                        |
| Avg Revenue / Session | Revenue / Sessions                         |

#### P&L Statement

```
Revenue
  Table income              Rp XXX,XXX
  F&B income                Rp XXX,XXX
Total Revenue               Rp XXX,XXX
──────────────────────────────────────
− F&B COGS                 (Rp XXX,XXX)
Gross Profit                Rp XXX,XXX
──────────────────────────────────────
Operating Expenses
  Rent                     (Rp XXX,XXX)
  Staff Wages              (Rp XXX,XXX)
  Utilities                (Rp XXX,XXX)
  Other                    (Rp XXX,XXX)
Total Expenses             (Rp XXX,XXX)
──────────────────────────────────────
NET PROFIT                  Rp XXX,XXX
Net Margin                       XX.X%
```

#### Tables

- Top F&B items: Name | Qty | Revenue | COGS | Margin | Margin %
- Session log (paginated 20/page): Date | Table | Cashier | Mode | Duration | Table Charge | F&B | Total | Profit
- Expense log

#### Charts (admin only)

- Revenue by day — bar chart (last 30 days)
- Revenue split: Table vs F&B — doughnut
- Expense by category — doughnut
- Inventory value over time (optional v1 stretch)

### 6.10 CSV Export

**Admin only. Two exports:**

**Sessions CSV** — `GET /api/export/sessions?from=&to=`

```
Session ID, Date, Table, Cashier, Billing Mode, Start Time, End Time,
Duration, Blocks Purchased, Hourly Rate, Table Charge, F&B Revenue,
F&B COGS, Grand Total, Profit
```

**P&L CSV** — `GET /api/export/pnl?from=&to=`

- Section 1: Summary stats
- Section 2: Expense line items
- Section 3: Top items breakdown
- Section 4: Inventory valuation snapshot

Implementation: streams response with `Content-Disposition: attachment; filename="..."`. All fields escaped per RFC 4180.

### 6.11 QR Code Customer Ordering

**Overview:**
Each table has a unique `qr_token`. The QR code encodes the URL `{QR_BASE_URL}/order/{qr_token}`. Customers scan with their phone → open mobile ordering page → browse menu → place F&B order → order appears on cashier POS instantly via Supabase Realtime.

**QR Generation (`/api/qr/:tableId`):**

- Admin-only endpoint.
- Generates QR code as SVG or PNG using the `qrcode` npm package.
- URL encoded: `https://{domain}/order/{table.qr_token}`.
- Returns image for download/print.
- Also available in Supabase Storage for consistent CDN access.

**QR management UI (`/admin/tables`):**

- Each table row has a **QR** button → opens a dialog with:
  - Preview of QR code image.
  - Download PNG button.
  - Print QR (opens browser print with QR + table label).
  - **Regenerate** button (with confirmation: "This will invalidate existing printed QR codes for this table").

**Batch QR print:**

- `/admin/tables/qr-print` — shows all active tables' QR codes in a printable grid layout (A4 / thermal label friendly). Admin prints one page, cuts, and places QR cards on tables.

---

**Customer ordering page (`/order/:tableToken`):**

_Public page — no auth required._

**Layout (mobile-first, full-screen):**

```
┌─────────────────────────────┐
│  🀄 Mahjong Royale         │
│  Table 7                    │
├─────────────────────────────┤
│  [Tea] [Food] [Snacks] ...  │  ← category filter tabs
├─────────────────────────────┤
│  ┌──────────┐ ┌──────────┐  │
│  │ Item     │ │ Item     │  │
│  │ Rp25,000 │ │ Rp30,000 │  │
│  │ [+ Add]  │ │ [+ Add]  │  │
│  └──────────┘ └──────────┘  │
├─────────────────────────────┤
│  My Order (2 items)  ▼      │  ← collapsible cart
│  [Place Order]              │
└─────────────────────────────┘
```

**Behaviour:**

1. Customer taps **+ Add** on items → builds a cart (local state only).
2. Customer taps **Place Order** → `POST /api/orders/customer` with `{ tableToken, items: [{menuItemId, qty, note}] }`.
3. API verifies `tableToken` → finds active session for that table (if no active session, returns 400 "Table not in session — please ask staff to start your table").
4. Creates `orders` rows with `source = 'customer_qr'`, `status = 'pending'`.
5. Supabase Realtime fires → cashier POS order panel shows new order with 📱 badge.
6. Customer sees a confirmation screen: "Order placed! A staff member will confirm shortly."
7. Cashier clicks **Confirm** or **Cancel** on each QR order.
8. Once confirmed, inventory is deducted.

**Menu filtering on QR page:**

- Only shows `is_available = true` items.
- No prices hidden (customers see prices to self-manage).
- Items with `track_inventory = true` and `current_stock = 0` show as "Sold Out" (greyed out).

**Security:**

- `qr_token` is a 16-byte random hex → 2^128 space, practically unguessable.
- RLS allows anon inserts to `orders` only with `source = 'customer_qr'`.
- Customer cannot read, modify, or cancel orders.
- Rate limit: max 5 order submissions per table per 10 minutes (Next.js middleware + in-memory or Redis).

### 6.12 Receipt Printing

**Trigger:** Bill Modal → "Print Receipt" button, OR after Settle & Close.

**Implementation:** `react-to-print` library. A `<ReceiptTemplate>` component renders a thermal-printer-friendly layout (58mm or 80mm width), injected into a hidden `<div>` and printed via `window.print()` with a dedicated `@media print` stylesheet.

**Receipt layout:**

```
================================
       Mahjong Royale
   Jl. Mahjong No. 1, Surabaya
   Tel: +62-XXX-XXXX-XXXX
================================
Date:    14/05/2026  20:45
Table:   Table 7
Cashier: Mei
Shift:   EVE-20260514
Session: #A3F2...
--------------------------------
TABLE TIME
  Block-Hour × 2 blocks
  15:15 → 17:15         Rp100,000
                    ──────────────
F&B ORDERS
  Jasmine Tea Pot × 2   Rp 50,000
  Fried Rice × 1        Rp 40,000
  Roasted Peanuts × 1   Rp 20,000
                    ──────────────
F&B Subtotal            Rp110,000
                    ──────────────
GRAND TOTAL            Rp210,000
================================
     Thank you for playing!
    See you again next time!
================================
```

**Settings (Admin → Settings → Receipt):**
| Setting | Key | Default |
|---|---|---|
| Header line 1 | `receipt_header_1` | Place name |
| Header line 2 | `receipt_header_2` | Address |
| Header line 3 | `receipt_header_3` | Phone |
| Footer message | `receipt_footer` | "Thank you for playing!" |
| Show COGS on receipt | `receipt_show_cogs` | false |
| Paper width | `receipt_paper_width` | "80mm" |

**Receipt record:**

- Every print creates a `receipts` row with `snapshot JSONB` (full bill data at print time, immutable).
- Admin can view and reprint any receipt from `sessions` detail view.

**Print stylesheet (`globals.css`):**

```css
@media print {
	body * {
		visibility: hidden;
	}
	#receipt-root,
	#receipt-root * {
		visibility: visible;
	}
	#receipt-root {
		position: fixed;
		top: 0;
		left: 0;
		width: 80mm;
		font-family: monospace;
		font-size: 12px;
		line-height: 1.4;
	}
}
```

### 6.13 Admin Panel

**Route:** `/admin` — protected by Supabase Auth session + `profiles.role = 'admin'`.

**Sidebar navigation:**

1. 📊 Dashboard — live table grid + today's P&L snapshot
2. 🀄 Tables — CRUD tables + QR management
3. 🍜 Menu — menu items CRUD
4. 📦 Inventory — stock levels + movements
5. 💰 Expenses — expense log
6. 📈 Reports — full P&L + CSV export
7. 📅 Reservations — all reservations
8. 👥 Cashiers — CRUD cashier accounts
9. 🔄 Shifts — audit log + edit
10. ⚙️ Settings — global config + receipt settings

**Settings page sections:**
| Section | Settings |
|---|---|
| General | Place name, timezone |
| Billing | Hourly rate, billing mode (Block-Hour / Per-Minute) |
| Currency | Currency code, symbol |
| QR Ordering | QR base URL, enable/disable QR ordering globally |
| Receipt | Header lines, footer, paper width, show COGS |
| Inventory | Default low stock threshold |
| Cashiers | PIN requirement toggle (require PIN for all cashiers) |

---

## 7. UI/UX Specifications

### Design Language

- **Theme:** Dark luxury — deep forest green backgrounds, warm amber/gold accents, cream text.

| Token            | Value                    |
| ---------------- | ------------------------ |
| `bg-base`        | `#0a120e`                |
| `bg-card`        | `rgba(20, 36, 28, 0.85)` |
| `bg-card-accent` | `rgba(40, 56, 44, 0.6)`  |
| `border-subtle`  | `rgba(255,255,255,0.08)` |
| `border-accent`  | `rgba(251,191,36,0.25)`  |
| `text-primary`   | `#fef9ec`                |
| `text-muted`     | `rgba(251,191,36,0.55)`  |
| `accent-amber`   | `#f59e0b`                |
| `accent-emerald` | `#10b981`                |
| `accent-rose`    | `#f43f5e`                |
| `accent-blue`    | `#3b82f6` (reservations) |

### Typography

- **Display:** `Cormorant Garamond` — italic for page titles, session timer numbers
- **Body:** `Manrope` — all UI text
- **Monospace:** `font-mono` — receipt template
- **Tabular nums:** `font-variant-numeric: tabular-nums` on all money and timer values

### Layout

- Mobile-first. Fixed bottom nav on mobile, sidebar at `md` breakpoint.
- Max content width: `1280px`.
- Table grid: 2 cols (mobile) → 3 (sm) → 4 (md) → 5+ (lg) — auto-calculated, no hardcoded count.

### Key Components

**TableCard states:**

```
AVAILABLE  → emerald dot, Start button
OCCUPIED (block-hour) → amber dot + COUNTDOWN timer (HH:MM:SS) + time charge
OCCUPIED (per-minute) → amber dot + elapsed HH:MM + accrued charge
OCCUPIED (expiring) → orange dot + ⚠ badge + EXTEND button prominent
OCCUPIED (overtime) → red dot + 🔴 OVERTIME + countdown up
RESERVED   → blue dot + guest name + arrival time + Seat button
MAINTENANCE → grey dot + lock icon, no actions
```

**Realtime order notification:**
When a QR order arrives on the POS, show a toast: "📱 New order from Table 7 — 2 items" with a sound option (Web Audio API beep, toggleable).

**Billing mode badge:**
Persistent pill at top of POS floor:

- Block-Hour: `⏱ Block-Hour · Rp50,000/hr`
- Per-Minute: `⏱ Per-Minute · Rp50,000/hr`

### shadcn/ui Components to install

```
button input textarea select checkbox switch dialog sheet
table tabs badge card separator skeleton scroll-area
toast (sonner) dropdown-menu calendar popover
progress slider command (for menu search)
```

---

## 8. Business Logic & Formulas

### Block-Hour Billing

```
block_ends_at     = start_time + (blocks_purchased × 3,600,000 ms)
table_charge      = blocks_purchased × hourly_rate
minutes_remaining = (block_ends_at - now) / 60,000
is_expiring       = minutes_remaining <= 15 && minutes_remaining > 0
is_overtime       = now > block_ends_at

Extension:
  blocks_purchased   += N
  block_ends_at      += N × 3,600,000 ms
  table_charge       += N × hourly_rate
```

### Per-Minute Billing

```
minutes_elapsed = FLOOR((now - start_time) / 60,000)
rate_per_minute = hourly_rate / 60
table_charge    = minutes_elapsed × rate_per_minute
                = FLOOR(minutes_elapsed × hourly_rate / 60)
```

Display: `HH:MM` — update every 60 seconds.

### Session Profit

```
fb_revenue      = Σ (unit_price × quantity) for confirmed orders
fb_cogs         = Σ (unit_cogs × quantity) for confirmed orders
session_total   = table_charge + fb_revenue
session_profit  = session_total - fb_cogs
```

### Shift Cash Reconciliation

```
shift_revenue     = Σ session_total for sessions where shift_id = this shift
expected_cash     = opening_cash + shift_revenue
cash_variance     = closing_cash - expected_cash
(positive = over, negative = short)
```

### P&L

```
total_revenue          = Σ session_total (closed, in date range)
total_fb_cogs          = Σ fb_cogs (in range)
gross_profit           = total_revenue - total_fb_cogs
total_operating_expenses = Σ expenses.amount (in date range)
net_profit             = gross_profit - total_operating_expenses
net_margin             = net_profit / total_revenue × 100
```

### Inventory Deduction (on order confirm)

```
For each ingredient in menu_item_ingredients where menu_item_id = order.menu_item_id:
  deduct = ingredient.quantity_used × order.quantity
  inventory_items.current_stock -= deduct
  INSERT inventory_movements (action='consumed', quantity=-deduct, reference_id=order.id)
  IF inventory_items.current_stock <= low_stock_threshold:
    TRIGGER low_stock_alert()
```

### Hourly Rate Change

- Changes in `config.hourly_rate` take effect for **new sessions only**.
- `sessions.hourly_rate` is locked at session start.

---

## 9. API Endpoints

All endpoints use `service_role` Supabase client server-side (bypasses RLS). Authenticated routes validate either Supabase Auth session (admin) or cashier JWT (`cashier_token` cookie).

**Auth guard types:**

- `[admin]` → validate Supabase Auth JWT, check `profiles.role = 'admin'`
- `[cashier]` → validate `cashier_token` JWT
- `[any_staff]` → either admin or cashier token
- `[public]` → no auth

### Auth

| Method | Path                | Auth    | Description                     |
| ------ | ------------------- | ------- | ------------------------------- |
| POST   | `/api/auth/cashier` | public  | PIN verify → return cashier JWT |
| DELETE | `/api/auth/cashier` | cashier | Clock out / clear cookie        |

### Tables

| Method | Path                            | Auth      | Description                             |
| ------ | ------------------------------- | --------- | --------------------------------------- |
| GET    | `/api/tables`                   | any_staff | List active tables with current session |
| POST   | `/api/tables`                   | admin     | Create table                            |
| GET    | `/api/tables/:id`               | any_staff | Get single table                        |
| PATCH  | `/api/tables/:id`               | admin     | Update label, status, sort_order        |
| DELETE | `/api/tables/:id`               | admin     | Soft or hard delete                     |
| GET    | `/api/tables/:id/qr`            | admin     | Get/generate QR code PNG                |
| POST   | `/api/tables/:id/qr/regenerate` | admin     | Regenerate qr_token                     |

### Sessions

| Method | Path                       | Auth      | Description                               |
| ------ | -------------------------- | --------- | ----------------------------------------- |
| POST   | `/api/sessions`            | cashier   | Start session `{ tableId, blocksCount? }` |
| GET    | `/api/sessions/:id`        | any_staff | Session + orders                          |
| PATCH  | `/api/sessions/:id/extend` | cashier   | Add blocks (block-hour mode)              |
| POST   | `/api/sessions/:id/close`  | cashier   | Settle & close                            |
| PATCH  | `/api/sessions/:id/void`   | admin     | Void session                              |

### Orders

| Method | Path                       | Auth      | Description                               |
| ------ | -------------------------- | --------- | ----------------------------------------- |
| GET    | `/api/sessions/:id/orders` | any_staff | List orders for session                   |
| POST   | `/api/sessions/:id/orders` | cashier   | Add cashier order                         |
| POST   | `/api/orders/customer`     | public    | Customer QR order (validates tableToken)  |
| PATCH  | `/api/orders/:id`          | cashier   | Update qty, note, status (confirm/cancel) |
| DELETE | `/api/orders/:id`          | cashier   | Remove order                              |

### Menu

| Method | Path                      | Auth   | Description                        |
| ------ | ------------------------- | ------ | ---------------------------------- |
| GET    | `/api/menu`               | public | Available menu items (for QR page) |
| GET    | `/api/admin/menu`         | admin  | All menu items                     |
| POST   | `/api/admin/menu`         | admin  | Create item                        |
| PATCH  | `/api/admin/menu/:id`     | admin  | Update item                        |
| DELETE | `/api/admin/menu/:id`     | admin  | Delete item                        |
| PATCH  | `/api/admin/menu/reorder` | admin  | Update sort_order bulk             |

### Inventory

| Method | Path                                 | Auth  | Description              |
| ------ | ------------------------------------ | ----- | ------------------------ |
| GET    | `/api/admin/inventory`               | admin | List inventory items     |
| POST   | `/api/admin/inventory`               | admin | Create inventory item    |
| PATCH  | `/api/admin/inventory/:id`           | admin | Update item details      |
| DELETE | `/api/admin/inventory/:id`           | admin | Delete item              |
| POST   | `/api/admin/inventory/:id/restock`   | admin | Add stock                |
| POST   | `/api/admin/inventory/:id/adjust`    | admin | Manual adjustment        |
| POST   | `/api/admin/inventory/:id/waste`     | admin | Log waste                |
| GET    | `/api/admin/inventory/:id/movements` | admin | Movement log             |
| GET    | `/api/admin/menu/:id/ingredients`    | admin | Get recipe               |
| PUT    | `/api/admin/menu/:id/ingredients`    | admin | Set recipe (replace all) |

### Shifts

| Method | Path                                          | Auth    | Description                    |
| ------ | --------------------------------------------- | ------- | ------------------------------ |
| POST   | `/api/shifts`                                 | cashier | Start shift                    |
| POST   | `/api/shifts/:id/join`                        | cashier | Join existing shift            |
| POST   | `/api/shifts/:id/clockout`                    | cashier | Clock self out                 |
| POST   | `/api/shifts/:id/close`                       | cashier | End shift (last employee)      |
| GET    | `/api/shifts/current`                         | cashier | Own active shift               |
| GET    | `/api/admin/shifts`                           | admin   | All shifts paginated           |
| PATCH  | `/api/admin/shifts/:id`                       | admin   | Edit shift (time, cash, notes) |
| POST   | `/api/admin/shifts/:id/employees`             | admin   | Add employee to shift          |
| DELETE | `/api/admin/shifts/:id/employees/:employeeId` | admin   | Remove employee from shift     |
| PATCH  | `/api/admin/shifts/:id/employees/:employeeId` | admin   | Edit employee clock times      |

### Cashiers

| Method | Path                      | Auth  | Description    |
| ------ | ------------------------- | ----- | -------------- |
| GET    | `/api/admin/cashiers`     | admin | List cashiers  |
| POST   | `/api/admin/cashiers`     | admin | Create cashier |
| PATCH  | `/api/admin/cashiers/:id` | admin | Update cashier |
| DELETE | `/api/admin/cashiers/:id` | admin | Deactivate     |

### Reservations

| Method | Path                    | Auth      | Description                     |
| ------ | ----------------------- | --------- | ------------------------------- |
| GET    | `/api/reservations`     | any_staff | List (filter: status, from, to) |
| POST   | `/api/reservations`     | any_staff | Create                          |
| PATCH  | `/api/reservations/:id` | any_staff | Update                          |
| DELETE | `/api/reservations/:id` | admin     | Delete                          |

### Expenses

| Method | Path                      | Auth  | Description                       |
| ------ | ------------------------- | ----- | --------------------------------- |
| GET    | `/api/admin/expenses`     | admin | List (filter: from, to, category) |
| POST   | `/api/admin/expenses`     | admin | Create                            |
| PATCH  | `/api/admin/expenses/:id` | admin | Update                            |
| DELETE | `/api/admin/expenses/:id` | admin | Delete                            |

### Reports & Export

| Method | Path                     | Auth      | Description           |
| ------ | ------------------------ | --------- | --------------------- |
| GET    | `/api/reports/summary`   | any_staff | Stats `?from=&to=`    |
| GET    | `/api/reports/sessions`  | any_staff | Session log paginated |
| GET    | `/api/reports/items`     | admin     | Top items             |
| GET    | `/api/reports/inventory` | admin     | Inventory valuation   |
| GET    | `/api/export/sessions`   | admin     | CSV download          |
| GET    | `/api/export/pnl`        | admin     | P&L CSV download      |

### Receipts

| Method | Path                             | Auth    | Description                 |
| ------ | -------------------------------- | ------- | --------------------------- |
| POST   | `/api/receipts`                  | cashier | Log a print (save snapshot) |
| GET    | `/api/admin/receipts/:sessionId` | admin   | Get receipt for session     |

### Config

| Method | Path                | Auth  | Description |
| ------ | ------------------- | ----- | ----------- |
| GET    | `/api/admin/config` | admin | All config  |
| PATCH  | `/api/admin/config` | admin | Upsert keys |

---

## 10. Non-Functional Requirements

| Requirement                 | Target                                                                 |
| --------------------------- | ---------------------------------------------------------------------- |
| Page load LCP               | < 2s on 4G                                                             |
| Timer display accuracy      | ±1s (block-hour countdown), ±1min (per-minute)                         |
| QR order latency (Realtime) | < 3s end-to-end on same WiFi network                                   |
| Concurrent tables           | All active tables simultaneously without degradation                   |
| Uptime                      | 99.5% (Vercel + Supabase SLAs)                                         |
| Mobile support              | iOS 16+, Android Chrome 110+, responsive from 375px                    |
| Admin security              | Supabase Auth JWT, 1-week session, HTTPS only                          |
| Cashier security            | Cashier JWT signed HS256, httpOnly cookie, 12h expiry                  |
| Customer QR security        | qr_token 128-bit random, rate-limited orders, RLS                      |
| PIN storage                 | bcrypt hash, 12 rounds, never transmitted in plaintext                 |
| Inventory consistency       | DB transaction on order confirm + inventory deduction                  |
| Timezone                    | All timestamps stored UTC; displayed in configured tz                  |
| Receipt immutability        | Receipt `snapshot` JSONB is write-once                                 |
| Offline                     | Not required v1; show "Connection lost" banner if Supabase unreachable |

---

## 11. File & Folder Structure

```
mahjong-parlor/
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql    # Full schema above
│   │   ├── 002_rls_policies.sql      # All RLS policies
│   │   └── 003_seed_data.sql         # Config, tables, menu, cashiers
│   ├── functions/                    # Edge functions (optional)
│   └── config.toml
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                # Fonts, Toaster, QueryClient, Zustand
│   │   ├── page.tsx                  # Shift Gate (cashier login)
│   │   ├── login/
│   │   │   └── page.tsx              # Admin login (Supabase Auth)
│   │   ├── order/
│   │   │   └── [tableToken]/
│   │   │       └── page.tsx          # Customer QR ordering page (public)
│   │   ├── pos/
│   │   │   ├── layout.tsx            # POS shell: bottom nav + cashier auth guard
│   │   │   ├── tables/page.tsx       # Floor view + Reservations tabs
│   │   │   ├── orders/page.tsx       # F&B POS
│   │   │   ├── reservations/page.tsx
│   │   │   └── shift/page.tsx        # Shift summary + clock out
│   │   ├── admin/
│   │   │   ├── layout.tsx            # Admin shell: sidebar + admin auth guard
│   │   │   ├── page.tsx              # Dashboard
│   │   │   ├── tables/
│   │   │   │   ├── page.tsx          # Table CRUD
│   │   │   │   └── qr-print/page.tsx # Batch QR print page
│   │   │   ├── menu/page.tsx
│   │   │   ├── inventory/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── movements/page.tsx
│   │   │   ├── expenses/page.tsx
│   │   │   ├── reports/page.tsx
│   │   │   ├── reservations/page.tsx
│   │   │   ├── cashiers/page.tsx
│   │   │   ├── shifts/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/edit/page.tsx
│   │   │   └── settings/page.tsx
│   │   └── api/
│   │       ├── auth/cashier/route.ts
│   │       ├── tables/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       ├── route.ts
│   │       │       └── qr/
│   │       │           ├── route.ts
│   │       │           └── regenerate/route.ts
│   │       ├── sessions/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       ├── route.ts
│   │       │       ├── close/route.ts
│   │       │       ├── extend/route.ts
│   │       │       ├── void/route.ts
│   │       │       └── orders/route.ts
│   │       ├── orders/
│   │       │   ├── customer/route.ts
│   │       │   └── [id]/route.ts
│   │       ├── menu/route.ts
│   │       ├── shifts/
│   │       │   ├── route.ts
│   │       │   ├── current/route.ts
│   │       │   └── [id]/
│   │       │       ├── join/route.ts
│   │       │       ├── clockout/route.ts
│   │       │       ├── close/route.ts
│   │       │       └── employees/
│   │       │           ├── route.ts
│   │       │           └── [empId]/route.ts
│   │       ├── reservations/
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       ├── receipts/
│   │       │   ├── route.ts
│   │       │   └── [sessionId]/route.ts
│   │       ├── reports/
│   │       │   ├── summary/route.ts
│   │       │   ├── sessions/route.ts
│   │       │   ├── items/route.ts
│   │       │   └── inventory/route.ts
│   │       ├── export/
│   │       │   ├── sessions/route.ts
│   │       │   └── pnl/route.ts
│   │       └── admin/
│   │           ├── menu/[id]/route.ts
│   │           ├── menu/[id]/ingredients/route.ts
│   │           ├── inventory/
│   │           │   ├── route.ts
│   │           │   └── [id]/
│   │           │       ├── route.ts
│   │           │       ├── restock/route.ts
│   │           │       ├── adjust/route.ts
│   │           │       ├── waste/route.ts
│   │           │       └── movements/route.ts
│   │           ├── cashiers/[id]/route.ts
│   │           ├── shifts/
│   │           │   ├── route.ts
│   │           │   └── [id]/route.ts
│   │           ├── expenses/[id]/route.ts
│   │           └── config/route.ts
│   │
│   ├── components/
│   │   ├── ui/                       # shadcn/ui (auto-generated)
│   │   ├── pos/
│   │   │   ├── TableCard.tsx
│   │   │   ├── TableGrid.tsx
│   │   │   ├── BlockHourTimer.tsx    # Countdown for block-hour mode
│   │   │   ├── PerMinuteTimer.tsx    # HH:MM elapsed for per-minute
│   │   │   ├── ExtendBlockDialog.tsx
│   │   │   ├── BillModal.tsx
│   │   │   ├── RunningBillModal.tsx
│   │   │   ├── OrderPanel.tsx
│   │   │   ├── MenuGrid.tsx
│   │   │   ├── QrOrderBadge.tsx      # 📱 badge on QR-sourced orders
│   │   │   ├── RealtimeOrderToast.tsx
│   │   │   ├── ReservationList.tsx
│   │   │   ├── ReservationForm.tsx
│   │   │   └── ShiftSummary.tsx
│   │   ├── customer/
│   │   │   ├── CustomerMenuGrid.tsx
│   │   │   ├── CustomerCart.tsx
│   │   │   └── OrderConfirmScreen.tsx
│   │   ├── admin/
│   │   │   ├── TableForm.tsx
│   │   │   ├── QrCodeDialog.tsx
│   │   │   ├── QrBatchPrint.tsx
│   │   │   ├── MenuItemForm.tsx
│   │   │   ├── IngredientLinker.tsx  # Recipe / BOM editor
│   │   │   ├── InventoryTable.tsx
│   │   │   ├── RestockDialog.tsx
│   │   │   ├── MovementLog.tsx
│   │   │   ├── LowStockAlert.tsx
│   │   │   ├── ExpenseForm.tsx
│   │   │   ├── CashierForm.tsx
│   │   │   ├── ShiftEditor.tsx       # Admin edit shift
│   │   │   ├── ReportSummaryCards.tsx
│   │   │   ├── PLStatement.tsx
│   │   │   ├── SessionLogTable.tsx
│   │   │   ├── TopItemsTable.tsx
│   │   │   ├── RevenueChart.tsx
│   │   │   └── ExportButtons.tsx
│   │   ├── receipt/
│   │   │   ├── ReceiptTemplate.tsx   # Thermal-printer layout
│   │   │   └── PrintButton.tsx       # react-to-print trigger
│   │   ├── auth/
│   │   │   ├── ShiftGate.tsx
│   │   │   ├── PinPad.tsx
│   │   │   ├── OpeningCashForm.tsx
│   │   │   └── JoinShiftPrompt.tsx
│   │   └── layout/
│   │       ├── PosBottomNav.tsx
│   │       ├── PosSidebar.tsx
│   │       ├── AdminSidebar.tsx
│   │       ├── BillingModeBadge.tsx
│   │       └── PageHeader.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts             # Browser Supabase client
│   │   │   ├── server.ts             # Server Supabase client (service role)
│   │   │   └── middleware.ts         # createServerClient for middleware
│   │   ├── auth/
│   │   │   ├── cashier.ts            # PIN verify, JWT sign/verify
│   │   │   └── guards.ts             # withAdmin(), withCashier() wrappers
│   │   ├── billing/
│   │   │   ├── blockHour.ts          # Block-hour calculations
│   │   │   └── perMinute.ts          # Per-minute calculations
│   │   ├── inventory.ts              # Deduction transaction logic
│   │   ├── qr.ts                     # QR generation helpers
│   │   ├── csv.ts                    # CSV serialiser
│   │   ├── receipt.ts                # Receipt snapshot builder
│   │   ├── formatters.ts             # fmtMoney, fmtDuration, fmtDate
│   │   └── config.ts                 # Config cache (SWR / in-memory)
│   │
│   ├── hooks/
│   │   ├── useTables.ts              # Supabase Realtime + query
│   │   ├── useSession.ts
│   │   ├── useOrders.ts              # Includes Realtime for QR orders
│   │   ├── useMenu.ts
│   │   ├── useInventory.ts
│   │   ├── useShift.ts
│   │   ├── useReservations.ts
│   │   └── useConfig.ts
│   │
│   ├── store/
│   │   ├── shift.ts                  # Current shift + cashier context
│   │   └── cart.ts                   # Customer QR cart (local only)
│   │
│   └── types/
│       ├── database.ts               # Auto-generated from `supabase gen types`
│       ├── api.ts                    # Request/response shapes
│       └── billing.ts                # BillingMode, SessionChargeResult
│
├── middleware.ts                     # Admin auth guard on /admin routes
├── public/
│   ├── favicon.ico
│   └── receipt-print.css            # @media print stylesheet
├── .env.local
├── .env.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 12. Environment Variables

```bash
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"   # NEVER expose to client

# Cashier JWT (sign cashier tokens server-side)
CASHIER_JWT_SECRET="generate-with: openssl rand -base64 48"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"          # used for QR URLs
NEXT_PUBLIC_TABLE_COUNT_DEFAULT=13                   # just a UI hint; tables are DB-driven
```

---

## 13. Seed / Default Data

Create in `supabase/migrations/003_seed_data.sql`:

```sql
-- Config
INSERT INTO config (key, value) VALUES
  ('place_name',          'Mahjong Royale'),
  ('currency',            'IDR'),
  ('currency_symbol',     'Rp'),
  ('timezone',            'Asia/Jakarta'),
  ('hourly_rate',         '50000'),
  ('billing_mode',        'block_hour'),
  ('qr_base_url',         'https://yourdomain.com/order'),
  ('receipt_header_1',    'Mahjong Royale'),
  ('receipt_header_2',    'Jl. Mahjong No. 1, Surabaya'),
  ('receipt_header_3',    'Tel: +62-XXX-XXXX-XXXX'),
  ('receipt_footer',      'Thank you for playing!'),
  ('receipt_paper_width', '80mm'),
  ('receipt_show_cogs',   'false'),
  ('low_stock_threshold', '5')
ON CONFLICT (key) DO NOTHING;

-- Tables (13 default, all manageable via admin)
INSERT INTO tables (label, sort_order) VALUES
  ('Table 1', 1), ('Table 2', 2), ('Table 3', 3), ('Table 4', 4),
  ('Table 5', 5), ('Table 6', 6), ('Table 7', 7), ('Table 8', 8),
  ('Table 9', 9), ('Table 10', 10), ('Table 11', 11), ('Table 12', 12),
  ('Table 13', 13);

-- Cashiers (PIN is bcrypt hash of the numbers shown)
-- PIN 1111 → hash at seed time via: SELECT crypt('1111', gen_salt('bf', 12))
INSERT INTO cashiers (name, pin_hash) VALUES
  ('Mei',  crypt('1111', gen_salt('bf', 12))),
  ('Wei',  crypt('2222', gen_salt('bf', 12))),
  ('Sari', crypt('3333', gen_salt('bf', 12)));

-- Default menu items (IDR pricing)
INSERT INTO menu_items (name, category, price, cogs, sort_order, track_inventory) VALUES
  ('Jasmine Tea Pot',  'Tea',     25000,  5000, 1,  true),
  ('Oolong Tea Pot',   'Tea',     30000,  7000, 2,  true),
  ('Pu-erh Tea Pot',   'Tea',     35000,  8000, 3,  true),
  ('Coffee',           'Drinks',  18000,  4000, 4,  true),
  ('Bottled Water',    'Drinks',   8000,  2000, 5,  true),
  ('Soft Drink',       'Drinks',  12000,  3000, 6,  true),
  ('Beer (Bottle)',    'Alcohol', 35000, 12000, 7,  true),
  ('Roasted Peanuts',  'Snacks',  20000,  5000, 8,  false),
  ('Fruit Plate',      'Snacks',  50000, 18000, 9,  false),
  ('Wonton Noodles',   'Food',    45000, 15000, 10, false),
  ('Fried Rice',       'Food',    40000, 12000, 11, false),
  ('Dumplings (8pc)',  'Food',    38000, 10000, 12, false);

-- Inventory items (for tea & drinks)
INSERT INTO inventory_items (name, unit, current_stock, low_stock_threshold, cost_per_unit) VALUES
  ('Jasmine Teabags',      'pcs',    200, 20, 500),
  ('Oolong Teabags',       'pcs',    200, 20, 700),
  ('Pu-erh Teabags',       'pcs',    200, 20, 800),
  ('Ground Coffee',        'g',     1000, 200, 150),
  ('Bottled Water 600ml',  'bottle', 100, 12, 2000),
  ('Soft Drink Can',       'can',     60, 12, 3000),
  ('Beer 330ml',           'bottle',  48, 12, 12000);
```

**Admin user:** Create via Supabase Dashboard → Authentication → Add User (email: `admin@parlor.com`, password: `Admin1234!`). The trigger will auto-insert a `profiles` row.

---

## 14. Out of Scope (v1)

- Payment processing / cashless (cash-only assumed)
- Customer loyalty / membership / points
- Multi-branch / multi-location
- SMS/WhatsApp notifications
- Staff scheduling / time clock beyond shift tracking
- Tax calculation (GST / VAT / PPN)
- Online public reservation page
- Native iOS / Android app
- Dark/light mode toggle (dark-only)
- Multi-language (single language)
- Audit trail beyond shift edits
- Automatic receipt email

---

## 15. Quick Start

```bash
# ─── 1. Create Next.js project ──────────────────────────────
npx create-next-app@latest mahjong-parlor \
  --typescript --tailwind --app --src-dir --import-alias "@/*"
cd mahjong-parlor

# ─── 2. Install all dependencies ────────────────────────────
npm install \
  @supabase/supabase-js @supabase/ssr \
  @tanstack/react-query @tanstack/react-table \
  zustand \
  react-hook-form @hookform/resolvers zod \
  recharts \
  date-fns date-fns-tz \
  bcryptjs jsonwebtoken \
  qrcode \
  papaparse \
  react-to-print \
  lucide-react \
  sonner

npm install -D \
  @types/bcryptjs @types/jsonwebtoken \
  @types/qrcode @types/papaparse \
  supabase

# ─── 3. Install shadcn/ui ────────────────────────────────────
npx shadcn@latest init
npx shadcn@latest add \
  button input textarea select checkbox switch \
  dialog sheet table tabs badge card separator \
  skeleton scroll-area toast dropdown-menu \
  calendar popover progress command slider

# ─── 4. Setup Supabase local dev ────────────────────────────
npx supabase init
npx supabase start          # starts local Postgres + Auth + Realtime
# copy local keys to .env.local

# ─── 5. Run migrations + seed ───────────────────────────────
npx supabase db push        # applies all migration files
# OR manually in Supabase SQL editor for cloud project

# ─── 6. Generate TypeScript types ───────────────────────────
npx supabase gen types typescript \
  --project-id YOUR_PROJECT_ID \
  > src/types/database.ts

# ─── 7. Run dev server ──────────────────────────────────────
npm run dev
# → http://localhost:3000      (Shift Gate / POS)
# → http://localhost:3000/login (Admin login)
# → http://localhost:3000/admin (Admin panel, after login)
# → http://localhost:3000/order/:tableToken (Customer QR page)
```

---

_End of PRD — Mahjong Parlor POS v2.0_
