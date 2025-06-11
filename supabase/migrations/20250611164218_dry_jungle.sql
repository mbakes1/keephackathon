-- Useful database functions for the application

-- Function to get asset statistics for a user
CREATE OR REPLACE FUNCTION get_asset_statistics(user_uuid uuid)
RETURNS json
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT json_build_object(
    'total_assets', COUNT(*),
    'available_assets', COUNT(*) FILTER (WHERE status = 'available'),
    'assigned_assets', COUNT(*) FILTER (WHERE status = 'assigned'),
    'maintenance_assets', COUNT(*) FILTER (WHERE status = 'maintenance'),
    'retired_assets', COUNT(*) FILTER (WHERE status = 'retired'),
    'total_value', COALESCE(SUM(asset_value_zar), 0),
    'insured_assets', (
      SELECT COUNT(*) 
      FROM asset_insurance ai 
      WHERE ai.owner_id = user_uuid AND ai.is_insured = true
    ),
    'assets_with_notes', (
      SELECT COUNT(DISTINCT asset_id) 
      FROM asset_notes an 
      WHERE an.owner_id = user_uuid
    )
  )
  FROM assets
  WHERE owner_id = user_uuid;
$$;

-- Function to search assets with full-text search
CREATE OR REPLACE FUNCTION search_assets(
  user_uuid uuid,
  search_query text,
  limit_count integer DEFAULT 50,
  offset_count integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  name text,
  category text,
  description text,
  status text,
  asset_value_zar numeric,
  created_at timestamptz,
  rank real
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    a.id,
    a.name,
    a.category,
    a.description,
    a.status,
    a.asset_value_zar,
    a.created_at,
    ts_rank(
      to_tsvector('english', a.name || ' ' || COALESCE(a.description, '') || ' ' || COALESCE(a.serial_number, '') || ' ' || COALESCE(a.vin_identifier, '')),
      plainto_tsquery('english', search_query)
    ) as rank
  FROM assets a
  WHERE a.owner_id = user_uuid
    AND to_tsvector('english', a.name || ' ' || COALESCE(a.description, '') || ' ' || COALESCE(a.serial_number, '') || ' ' || COALESCE(a.vin_identifier, ''))
        @@ plainto_tsquery('english', search_query)
  ORDER BY rank DESC, a.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
$$;

-- Function to get assets due for insurance renewal
CREATE OR REPLACE FUNCTION get_assets_due_for_renewal(
  user_uuid uuid,
  days_ahead integer DEFAULT 30
)
RETURNS TABLE (
  asset_id uuid,
  asset_name text,
  insurance_provider text,
  renewal_date date,
  days_until_renewal integer
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    a.id as asset_id,
    a.name as asset_name,
    ai.insurance_provider,
    ai.renewal_date,
    (ai.renewal_date - CURRENT_DATE) as days_until_renewal
  FROM assets a
  JOIN asset_insurance ai ON a.id = ai.asset_id
  WHERE a.owner_id = user_uuid
    AND ai.owner_id = user_uuid
    AND ai.is_insured = true
    AND ai.renewal_date IS NOT NULL
    AND ai.renewal_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '%s days')
  ORDER BY ai.renewal_date ASC;
$$;

-- Function to get overdue asset assignments
CREATE OR REPLACE FUNCTION get_overdue_assignments(user_uuid uuid)
RETURNS TABLE (
  assignment_id uuid,
  asset_id uuid,
  asset_name text,
  assigned_to_name text,
  assigned_to_email text,
  due_date timestamptz,
  days_overdue integer
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    aa.id as assignment_id,
    a.id as asset_id,
    a.name as asset_name,
    p.full_name as assigned_to_name,
    p.email as assigned_to_email,
    aa.due_date,
    EXTRACT(days FROM (CURRENT_TIMESTAMP - aa.due_date))::integer as days_overdue
  FROM asset_assignments aa
  JOIN assets a ON aa.asset_id = a.id
  JOIN profiles p ON aa.assigned_to = p.id
  WHERE a.owner_id = user_uuid
    AND aa.return_date IS NULL
    AND aa.due_date IS NOT NULL
    AND aa.due_date < CURRENT_TIMESTAMP
  ORDER BY aa.due_date ASC;
$$;

-- Function to update asset updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

-- Function to automatically create QR code URL when asset is created
CREATE OR REPLACE FUNCTION generate_asset_qr_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Generate QR code URL based on the asset ID
  NEW.qr_code = 'https://' || current_setting('app.base_url', true) || '/asset/' || NEW.id;
  RETURN NEW;
END;
$$;

-- Create trigger for QR code generation
DROP TRIGGER IF EXISTS trigger_generate_qr_code ON assets;
CREATE TRIGGER trigger_generate_qr_code
  BEFORE INSERT ON assets
  FOR EACH ROW
  EXECUTE FUNCTION generate_asset_qr_code();

-- Function to clean up old data (for maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_data(days_old integer DEFAULT 365)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer := 0;
BEGIN
  -- Clean up old theft reports that are resolved
  DELETE FROM theft_reports
  WHERE status = 'resolved'
    AND created_at < (CURRENT_DATE - INTERVAL '%s days');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_asset_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION search_assets TO authenticated;
GRANT EXECUTE ON FUNCTION get_assets_due_for_renewal TO authenticated;
GRANT EXECUTE ON FUNCTION get_overdue_assignments TO authenticated;

-- Grant execute permission for cleanup function to service role only
-- GRANT EXECUTE ON FUNCTION cleanup_old_data TO service_role;