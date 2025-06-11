-- Performance optimization indexes

-- Assets table indexes
CREATE INDEX IF NOT EXISTS idx_assets_owner_id ON assets(owner_id);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_category ON assets(category);
CREATE INDEX IF NOT EXISTS idx_assets_created_at ON assets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assets_owner_status ON assets(owner_id, status);
CREATE INDEX IF NOT EXISTS idx_assets_owner_category ON assets(owner_id, category);

-- Asset notes indexes
CREATE INDEX IF NOT EXISTS idx_asset_notes_asset_id ON asset_notes(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_notes_owner_id ON asset_notes(owner_id);
CREATE INDEX IF NOT EXISTS idx_asset_notes_category ON asset_notes(note_category);
CREATE INDEX IF NOT EXISTS idx_asset_notes_created_at ON asset_notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_asset_notes_asset_owner ON asset_notes(asset_id, owner_id);

-- Asset assignments indexes
CREATE INDEX IF NOT EXISTS idx_asset_assignments_asset_id ON asset_assignments(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_assignments_assigned_to ON asset_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_asset_assignments_assigned_by ON asset_assignments(assigned_by);
CREATE INDEX IF NOT EXISTS idx_asset_assignments_assigned_date ON asset_assignments(assigned_date DESC);
CREATE INDEX IF NOT EXISTS idx_asset_assignments_return_date ON asset_assignments(return_date);

-- Asset insurance indexes
CREATE INDEX IF NOT EXISTS idx_asset_insurance_asset_id ON asset_insurance(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_insurance_owner_id ON asset_insurance(owner_id);
CREATE INDEX IF NOT EXISTS idx_asset_insurance_renewal_date ON asset_insurance(renewal_date);
CREATE INDEX IF NOT EXISTS idx_asset_insurance_asset_owner ON asset_insurance(asset_id, owner_id);

-- Asset photos indexes
CREATE INDEX IF NOT EXISTS idx_asset_photos_asset_id ON asset_photos(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_photos_owner_id ON asset_photos(owner_id);
CREATE INDEX IF NOT EXISTS idx_asset_photos_is_primary ON asset_photos(is_primary);
CREATE INDEX IF NOT EXISTS idx_asset_photos_asset_owner ON asset_photos(asset_id, owner_id);

-- Asset documents indexes
CREATE INDEX IF NOT EXISTS idx_asset_documents_asset_id ON asset_documents(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_documents_owner_id ON asset_documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_asset_documents_type ON asset_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_asset_documents_asset_owner ON asset_documents(asset_id, owner_id);

-- Theft reports indexes
CREATE INDEX IF NOT EXISTS idx_theft_reports_asset_id ON theft_reports(asset_id);
CREATE INDEX IF NOT EXISTS idx_theft_reports_status ON theft_reports(status);
CREATE INDEX IF NOT EXISTS idx_theft_reports_created_at ON theft_reports(created_at DESC);

-- Categories indexes
CREATE INDEX IF NOT EXISTS idx_categories_owner_id ON categories(owner_id);
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_assets_search ON assets USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || COALESCE(serial_number, '') || ' ' || COALESCE(vin_identifier, '')));
CREATE INDEX IF NOT EXISTS idx_asset_notes_search ON asset_notes USING gin(to_tsvector('english', note_text));

-- Partial indexes for better performance on filtered queries
CREATE INDEX IF NOT EXISTS idx_assets_available ON assets(owner_id, created_at) WHERE status = 'available';
CREATE INDEX IF NOT EXISTS idx_assets_assigned ON assets(owner_id, created_at) WHERE status = 'assigned';
CREATE INDEX IF NOT EXISTS idx_assignments_active ON asset_assignments(asset_id, assigned_date) WHERE return_date IS NULL;
CREATE INDEX IF NOT EXISTS idx_insurance_insured ON asset_insurance(owner_id, renewal_date) WHERE is_insured = true;