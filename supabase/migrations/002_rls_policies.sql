-- Enable RLS
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

-- Anon can read available menu items (for QR ordering)
CREATE POLICY "anon_read_menu" ON menu_items
  FOR SELECT TO anon USING (is_available = TRUE);

-- Anon can read table by token (for QR page)
CREATE POLICY "anon_read_table_by_token" ON tables
  FOR SELECT TO anon USING (TRUE);

-- Anon can insert customer QR orders
CREATE POLICY "anon_insert_customer_orders" ON orders
  FOR INSERT TO anon
  WITH CHECK (source = 'customer_qr');

-- Service role handles all other operations via API routes (bypasses RLS)

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'Admin'), 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();
