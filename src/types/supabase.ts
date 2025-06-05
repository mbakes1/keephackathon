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
          purchase_date: string | null
          value: number | null
          status: 'available' | 'assigned' | 'maintenance' | 'retired'
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
          purchase_date?: string | null
          value?: number | null
          status?: 'available' | 'assigned' | 'maintenance' | 'retired'
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
          purchase_date?: string | null
          value?: number | null
          status?: 'available' | 'assigned' | 'maintenance' | 'retired'
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
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
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