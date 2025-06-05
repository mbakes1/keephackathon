/*
  # Create Keep Asset Management Schema

  1. Tables
    - `profiles` - User profiles
    - `assets` - Asset inventory items
    - `categories` - Asset categories
    - `asset_assignments` - History of asset assignments
    - `theft_reports` - Reports of found/stolen assets

  2. Security
    - Enable RLS on all tables
    - Set up policies for each table
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  role text NOT NULL CHECK (role IN ('admin', 'user', 'viewer')) DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create assets table
CREATE TABLE IF NOT EXISTS assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  description text,
  serial_number text,
  purchase_date date,
  value decimal(10, 2),
  status text NOT NULL CHECK (status IN ('available', 'assigned', 'maintenance', 'retired')) DEFAULT 'available',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  custom_fields jsonb,
  qr_code text
);

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create asset_assignments table
CREATE TABLE IF NOT EXISTS asset_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  assigned_to uuid NOT NULL REFERENCES profiles(id),
  assigned_by uuid NOT NULL REFERENCES profiles(id),
  assigned_date timestamptz NOT NULL DEFAULT now(),
  due_date timestamptz,
  return_date timestamptz,
  return_condition text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE asset_assignments ENABLE ROW LEVEL SECURITY;

-- Create theft_reports table
CREATE TABLE IF NOT EXISTS theft_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  reporter_name text,
  reporter_email text,
  reporter_phone text,
  location text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL CHECK (status IN ('pending', 'resolved', 'dismissed')) DEFAULT 'pending'
);

ALTER TABLE theft_reports ENABLE ROW LEVEL SECURITY;

-- Set up RLS policies

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Assets policies
CREATE POLICY "All authenticated users can view assets"
  ON assets
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "All authenticated users can insert assets"
  ON assets
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "All authenticated users can update assets"
  ON assets
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "All authenticated users can delete assets"
  ON assets
  FOR DELETE
  TO authenticated
  USING (true);

-- Categories policies
CREATE POLICY "All authenticated users can view categories"
  ON categories
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "All authenticated users can insert categories"
  ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Asset assignments policies
CREATE POLICY "All authenticated users can view asset assignments"
  ON asset_assignments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "All authenticated users can insert asset assignments"
  ON asset_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "All authenticated users can update asset assignments"
  ON asset_assignments
  FOR UPDATE
  TO authenticated
  USING (true);

-- Theft reports policies
CREATE POLICY "All users can create theft reports"
  ON theft_reports
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "All authenticated users can view theft reports"
  ON theft_reports
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "All authenticated users can update theft reports"
  ON theft_reports
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on assets table
CREATE TRIGGER update_assets_updated_at
BEFORE UPDATE ON assets
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();