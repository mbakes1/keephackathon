/*
  # Enhanced Asset Management Schema

  1. New Tables
    - `asset_insurance` - Insurance tracking for assets
    - `asset_notes` - Notes system for assets
    - `asset_documents` - Document storage references
    - `asset_photos` - Photo storage references

  2. Enhanced Tables
    - `assets` - Added new fields for enhanced asset management
    - `categories` - Enhanced category system

  3. Security
    - Enable RLS on all new tables
    - Add policies for user-specific data access
*/

-- Enhanced assets table with new fields
DO $$
BEGIN
  -- Add new columns to assets table if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assets' AND column_name = 'asset_value_zar') THEN
    ALTER TABLE assets ADD COLUMN asset_value_zar numeric(12,2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assets' AND column_name = 'vin_identifier') THEN
    ALTER TABLE assets ADD COLUMN vin_identifier text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assets' AND column_name = 'asset_location') THEN
    ALTER TABLE assets ADD COLUMN asset_location text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assets' AND column_name = 'asset_condition') THEN
    ALTER TABLE assets ADD COLUMN asset_condition text DEFAULT 'excellent';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assets' AND column_name = 'owner_id') THEN
    ALTER TABLE assets ADD COLUMN owner_id uuid REFERENCES profiles(id);
  END IF;
END $$;

-- Add constraint for asset condition
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'assets_condition_check') THEN
    ALTER TABLE assets ADD CONSTRAINT assets_condition_check 
    CHECK (asset_condition = ANY (ARRAY['excellent'::text, 'good'::text, 'fair'::text, 'poor'::text]));
  END IF;
END $$;

-- Asset Insurance table
CREATE TABLE IF NOT EXISTS asset_insurance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES profiles(id),
  is_insured boolean DEFAULT false,
  insurance_provider text,
  policy_number text,
  coverage_amount numeric(12,2),
  premium_amount numeric(10,2),
  renewal_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE asset_insurance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own asset insurance"
  ON asset_insurance
  FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Asset Notes table
CREATE TABLE IF NOT EXISTS asset_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES profiles(id),
  note_text text NOT NULL,
  note_category text DEFAULT 'general',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE asset_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own asset notes"
  ON asset_notes
  FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Add constraint for note categories
ALTER TABLE asset_notes ADD CONSTRAINT asset_notes_category_check 
CHECK (note_category = ANY (ARRAY['general'::text, 'maintenance'::text, 'repairs'::text, 'modifications'::text, 'insurance'::text]));

-- Asset Documents table
CREATE TABLE IF NOT EXISTS asset_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES profiles(id),
  document_name text NOT NULL,
  document_type text NOT NULL,
  file_url text,
  file_size integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE asset_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own asset documents"
  ON asset_documents
  FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Add constraint for document types
ALTER TABLE asset_documents ADD CONSTRAINT asset_documents_type_check 
CHECK (document_type = ANY (ARRAY['proof_of_purchase'::text, 'insurance_document'::text, 'warranty'::text, 'manual'::text, 'fica_compliance'::text, 'other'::text]));

-- Asset Photos table
CREATE TABLE IF NOT EXISTS asset_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES profiles(id),
  photo_url text NOT NULL,
  photo_description text,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE asset_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own asset photos"
  ON asset_photos
  FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Update existing assets policies to include owner_id
DROP POLICY IF EXISTS "All authenticated users can view assets" ON assets;
DROP POLICY IF EXISTS "All authenticated users can insert assets" ON assets;
DROP POLICY IF EXISTS "All authenticated users can update assets" ON assets;
DROP POLICY IF EXISTS "All authenticated users can delete assets" ON assets;

CREATE POLICY "Users can view their own assets"
  ON assets
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Users can insert their own assets"
  ON assets
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own assets"
  ON assets
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can delete their own assets"
  ON assets
  FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- Update categories to be user-specific
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'owner_id') THEN
    ALTER TABLE categories ADD COLUMN owner_id uuid REFERENCES profiles(id);
  END IF;
END $$;

-- Update categories policies
DROP POLICY IF EXISTS "All authenticated users can view categories" ON categories;
DROP POLICY IF EXISTS "All authenticated users can insert categories" ON categories;

CREATE POLICY "Users can view their own categories"
  ON categories
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid() OR owner_id IS NULL);

CREATE POLICY "Users can insert their own categories"
  ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_asset_insurance_updated_at') THEN
    CREATE TRIGGER update_asset_insurance_updated_at
      BEFORE UPDATE ON asset_insurance
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_asset_notes_updated_at') THEN
    CREATE TRIGGER update_asset_notes_updated_at
      BEFORE UPDATE ON asset_notes
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Insert default categories for new users (will be handled in application)
-- These are common South African asset categories
INSERT INTO categories (name, description, owner_id) 
SELECT 'Vehicles', 'Cars, motorcycles, trucks, and other vehicles', NULL
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Vehicles' AND owner_id IS NULL);

INSERT INTO categories (name, description, owner_id) 
SELECT 'Electronics', 'Computers, phones, tablets, and electronic devices', NULL
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Electronics' AND owner_id IS NULL);

INSERT INTO categories (name, description, owner_id) 
SELECT 'Property', 'Real estate and property assets', NULL
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Property' AND owner_id IS NULL);

INSERT INTO categories (name, description, owner_id) 
SELECT 'Furniture', 'Office and home furniture', NULL
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Furniture' AND owner_id IS NULL);

INSERT INTO categories (name, description, owner_id) 
SELECT 'Equipment', 'Tools, machinery, and specialized equipment', NULL
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Equipment' AND owner_id IS NULL);