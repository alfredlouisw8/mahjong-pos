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

-- Tables
INSERT INTO tables (label, sort_order) VALUES
  ('Table 1', 1),  ('Table 2', 2),  ('Table 3', 3),  ('Table 4', 4),
  ('Table 5', 5),  ('Table 6', 6),  ('Table 7', 7),  ('Table 8', 8),
  ('Table 9', 9),  ('Table 10', 10), ('Table 11', 11), ('Table 12', 12),
  ('Table 13', 13);

-- Cashiers (PIN: Mei=1111, Wei=2222, Sari=3333)
INSERT INTO cashiers (name, pin_hash) VALUES
  ('Mei',  '$2b$12$PJAPVDN61ez5HoUsycaxheQm48FoDq.o1IqUXN1jowNPl.Ij.Nl.a'),
  ('Wei',  '$2b$12$YNUPL64/UlOMlEszC51KkeJOwuGsVDi37SoZDUzI5J/a5qLM5qyMq'),
  ('Sari', '$2b$12$pT8h5g/hbj5/Y2HbgXTEd.p4ArnbcKLYTWQ24P9cwnIVxfDYcW3RG');

-- Menu items
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

-- Inventory items
INSERT INTO inventory_items (name, unit, current_stock, low_stock_threshold, cost_per_unit) VALUES
  ('Jasmine Teabags',      'pcs',    200, 20, 500),
  ('Oolong Teabags',       'pcs',    200, 20, 700),
  ('Pu-erh Teabags',       'pcs',    200, 20, 800),
  ('Ground Coffee',        'g',     1000, 200, 150),
  ('Bottled Water 600ml',  'bottle', 100, 12, 2000),
  ('Soft Drink Can',       'can',     60, 12, 3000),
  ('Beer 330ml',           'bottle',  48, 12, 12000);
