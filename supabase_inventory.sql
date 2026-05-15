-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

CREATE TABLE IF NOT EXISTS inventory (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name          text NOT NULL,
  sku           text,
  category      text,
  brand         text,
  model         text,
  quantity      integer NOT NULL DEFAULT 0,
  min_quantity  integer NOT NULL DEFAULT 5,
  unit_cost     decimal(10,2),
  sale_price    decimal(10,2),
  store_id      uuid REFERENCES stores(id) ON DELETE SET NULL,
  notes         text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER inventory_updated_at
  BEFORE UPDATE ON inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON inventory USING (true) WITH CHECK (true);
