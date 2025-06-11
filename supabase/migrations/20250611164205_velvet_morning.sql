-- Improved Row Level Security policies with better performance

-- Drop existing policies to recreate them with optimizations
DROP POLICY IF EXISTS "Users can view their own assets" ON assets;
DROP POLICY IF EXISTS "Users can insert their own assets" ON assets;
DROP POLICY IF EXISTS "Users can update their own assets" ON assets;
DROP POLICY IF EXISTS "Users can delete their own assets" ON assets;

-- Optimized asset policies
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

-- Improve categories policies
DROP POLICY IF EXISTS "Users can view their own categories" ON categories;
DROP POLICY IF EXISTS "Users can insert their own categories" ON categories;

CREATE POLICY "Users can view categories"
  ON categories
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid() OR owner_id IS NULL);

CREATE POLICY "Users can insert their own categories"
  ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own categories"
  ON categories
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can delete their own categories"
  ON categories
  FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- Add missing policies for asset_assignments
DROP POLICY IF EXISTS "All authenticated users can view asset assignments" ON asset_assignments;
DROP POLICY IF EXISTS "All authenticated users can insert asset assignments" ON asset_assignments;
DROP POLICY IF EXISTS "All authenticated users can update asset assignments" ON asset_assignments;

-- More restrictive assignment policies
CREATE POLICY "Users can view assignments for their assets"
  ON asset_assignments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assets 
      WHERE assets.id = asset_assignments.asset_id 
      AND assets.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create assignments for their assets"
  ON asset_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM assets 
      WHERE assets.id = asset_assignments.asset_id 
      AND assets.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update assignments for their assets"
  ON asset_assignments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assets 
      WHERE assets.id = asset_assignments.asset_id 
      AND assets.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM assets 
      WHERE assets.id = asset_assignments.asset_id 
      AND assets.owner_id = auth.uid()
    )
  );

-- Improve theft reports policies
DROP POLICY IF EXISTS "All users can create theft reports" ON theft_reports;
DROP POLICY IF EXISTS "All authenticated users can view theft reports" ON theft_reports;
DROP POLICY IF EXISTS "All authenticated users can update theft reports" ON theft_reports;

CREATE POLICY "Anyone can create theft reports"
  ON theft_reports
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Asset owners can view theft reports for their assets"
  ON theft_reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assets 
      WHERE assets.id = theft_reports.asset_id 
      AND assets.owner_id = auth.uid()
    )
  );

CREATE POLICY "Asset owners can update theft reports for their assets"
  ON theft_reports
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assets 
      WHERE assets.id = theft_reports.asset_id 
      AND assets.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM assets 
      WHERE assets.id = theft_reports.asset_id 
      AND assets.owner_id = auth.uid()
    )
  );

-- Add function to check asset ownership (for better performance)
CREATE OR REPLACE FUNCTION check_asset_ownership(asset_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM assets 
    WHERE id = asset_uuid AND owner_id = user_uuid
  );
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION check_asset_ownership TO authenticated;