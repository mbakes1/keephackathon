export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      assets: {
        Row: {
          id: string
          name: string
          category: string
          description: string | null
          serial_number: string | null
          vin_identifier: string | null
          purchase_date: string | null
          asset_value_zar: number | null
          status: 'available' | 'assigned' | 'maintenance' | 'retired'
          asset_location: string | null
          asset_condition: 'excellent' | 'good' | 'fair' | 'poor' | null
          owner_id: string | null
          created_at: string
          updated_at: string
          custom_fields: Json | null
          qr_code: string | null
        }
        Insert: {
          id?: string
          name: string
          category: string
          description?: string | null
          serial_number?: string | null
          vin_identifier?: string | null
          purchase_date?: string | null
          asset_value_zar?: number | null
          status?: 'available' | 'assigned' | 'maintenance' | 'retired'
          asset_location?: string | null
          asset_condition?: 'excellent' | 'good' | 'fair' | 'poor' | null
          owner_id?: string | null
          created_at?: string
          updated_at?: string
          custom_fields?: Json | null
          qr_code?: string | null
        }
        Update: {
          id?: string
          name?: string
          category?: string
          description?: string | null
          serial_number?: string | null
          vin_identifier?: string | null
          purchase_date?: string | null
          asset_value_zar?: number | null
          status?: 'available' | 'assigned' | 'maintenance' | 'retired'
          asset_location?: string | null
          asset_condition?: 'excellent' | 'good' | 'fair' | 'poor' | null
          owner_id?: string | null
          created_at?: string
          updated_at?: string
          custom_fields?: Json | null
          qr_code?: string | null
        }
      }
      asset_assignments: {
        Row: {
          id: string
          asset_id: string
          assigned_to: string
          assigned_by: string
          assigned_date: string
          due_date: string | null
          return_date: string | null
          return_condition: string | null
          created_at: string
        }
        Insert: {
          id?: string
          asset_id: string
          assigned_to: string
          assigned_by: string
          assigned_date?: string
          due_date?: string | null
          return_date?: string | null
          return_condition?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          asset_id?: string
          assigned_to?: string
          assigned_by?: string
          assigned_date?: string
          due_date?: string | null
          return_date?: string | null
          return_condition?: string | null
          created_at?: string
        }
      }
      asset_notes: {
        Row: {
          id: string
          asset_id: string
          owner_id: string
          note_text: string
          note_category: 'general' | 'maintenance' | 'repairs' | 'modifications' | 'insurance' | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          asset_id: string
          owner_id: string
          note_text: string
          note_category?: 'general' | 'maintenance' | 'repairs' | 'modifications' | 'insurance' | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          asset_id?: string
          owner_id?: string
          note_text?: string
          note_category?: 'general' | 'maintenance' | 'repairs' | 'modifications' | 'insurance' | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      asset_insurance: {
        Row: {
          id: string
          asset_id: string
          owner_id: string
          is_insured: boolean | null
          insurance_provider: string | null
          policy_number: string | null
          coverage_amount: number | null
          premium_amount: number | null
          renewal_date: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          asset_id: string
          owner_id: string
          is_insured?: boolean | null
          insurance_provider?: string | null
          policy_number?: string | null
          coverage_amount?: number | null
          premium_amount?: number | null
          renewal_date?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          asset_id?: string
          owner_id?: string
          is_insured?: boolean | null
          insurance_provider?: string | null
          policy_number?: string | null
          coverage_amount?: number | null
          premium_amount?: number | null
          renewal_date?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      asset_photos: {
        Row: {
          id: string
          asset_id: string
          owner_id: string
          photo_url: string
          photo_description: string | null
          is_primary: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          asset_id: string
          owner_id: string
          photo_url: string
          photo_description?: string | null
          is_primary?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          asset_id?: string
          owner_id?: string
          photo_url?: string
          photo_description?: string | null
          is_primary?: boolean | null
          created_at?: string | null
        }
      }
      asset_documents: {
        Row: {
          id: string
          asset_id: string
          owner_id: string
          document_name: string
          document_type: 'proof_of_purchase' | 'insurance_document' | 'warranty' | 'manual' | 'fica_compliance' | 'other'
          file_url: string | null
          file_size: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          asset_id: string
          owner_id: string
          document_name: string
          document_type: 'proof_of_purchase' | 'insurance_document' | 'warranty' | 'manual' | 'fica_compliance' | 'other'
          file_url?: string | null
          file_size?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          asset_id?: string
          owner_id?: string
          document_name?: string
          document_type?: 'proof_of_purchase' | 'insurance_document' | 'warranty' | 'manual' | 'fica_compliance' | 'other'
          file_url?: string | null
          file_size?: number | null
          created_at?: string | null
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          owner_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          owner_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          owner_id?: string | null
          created_at?: string
        }
      }
      theft_reports: {
        Row: {
          id: string
          asset_id: string
          reporter_name: string | null
          reporter_email: string | null
          reporter_phone: string | null
          location: string | null
          description: string | null
          created_at: string
          status: 'pending' | 'resolved' | 'dismissed'
        }
        Insert: {
          id?: string
          asset_id: string
          reporter_name?: string | null
          reporter_email?: string | null
          reporter_phone?: string | null
          location?: string | null
          description?: string | null
          created_at?: string
          status?: 'pending' | 'resolved' | 'dismissed'
        }
        Update: {
          id?: string
          asset_id?: string
          reporter_name?: string | null
          reporter_email?: string | null
          reporter_phone?: string | null
          location?: string | null
          description?: string | null
          created_at?: string
          status?: 'pending' | 'resolved' | 'dismissed'
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: 'admin' | 'user' | 'viewer'
          created_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'user' | 'viewer'
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'user' | 'viewer'
          created_at?: string
        }
      }
    }
  }
}