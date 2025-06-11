import { supabase } from './supabase';
import { Database } from '../../types/supabase';

type Tables = Database['public']['Tables'];
type Asset = Tables['assets']['Row'];
type Profile = Tables['profiles']['Row'];

export class DatabaseService {
  // Asset operations with proper error handling and validation
  static async createAsset(assetData: Tables['assets']['Insert']) {
    try {
      const { data, error } = await supabase
        .from('assets')
        .insert(assetData)
        .select()
        .single();

      if (error) {
        console.error('Database error creating asset:', error);
        throw new Error(`Failed to create asset: ${error.message}`);
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Unexpected error creating asset:', error);
      return { data: null, error: error.message };
    }
  }

  static async updateAsset(id: string, updates: Tables['assets']['Update'], ownerId: string) {
    try {
      const { data, error } = await supabase
        .from('assets')
        .update(updates)
        .eq('id', id)
        .eq('owner_id', ownerId)
        .select()
        .single();

      if (error) {
        console.error('Database error updating asset:', error);
        throw new Error(`Failed to update asset: ${error.message}`);
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Unexpected error updating asset:', error);
      return { data: null, error: error.message };
    }
  }

  static async deleteAsset(id: string, ownerId: string) {
    try {
      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', id)
        .eq('owner_id', ownerId);

      if (error) {
        console.error('Database error deleting asset:', error);
        throw new Error(`Failed to delete asset: ${error.message}`);
      }

      return { error: null };
    } catch (error: any) {
      console.error('Unexpected error deleting asset:', error);
      return { error: error.message };
    }
  }

  static async getAssetsByOwner(ownerId: string, options?: {
    limit?: number;
    offset?: number;
    orderBy?: keyof Asset;
    ascending?: boolean;
  }) {
    try {
      let query = supabase
        .from('assets')
        .select('*')
        .eq('owner_id', ownerId);

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      if (options?.orderBy) {
        query = query.order(options.orderBy, { ascending: options.ascending ?? true });
      }

      const { data, error } = await query;

      if (error) {
        console.error('Database error fetching assets:', error);
        throw new Error(`Failed to fetch assets: ${error.message}`);
      }

      return { data: data || [], error: null };
    } catch (error: any) {
      console.error('Unexpected error fetching assets:', error);
      return { data: [], error: error.message };
    }
  }

  // Profile operations
  static async createProfile(profileData: Tables['profiles']['Insert']) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (error) {
        // Handle duplicate key error gracefully
        if (error.code === '23505') {
          console.log('Profile already exists, fetching existing profile');
          return this.getProfile(profileData.id);
        }
        console.error('Database error creating profile:', error);
        throw new Error(`Failed to create profile: ${error.message}`);
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Unexpected error creating profile:', error);
      return { data: null, error: error.message };
    }
  }

  static async getProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile not found
          return { data: null, error: null };
        }
        console.error('Database error fetching profile:', error);
        throw new Error(`Failed to fetch profile: ${error.message}`);
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Unexpected error fetching profile:', error);
      return { data: null, error: error.message };
    }
  }

  static async updateProfile(userId: string, updates: Tables['profiles']['Update']) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Database error updating profile:', error);
        throw new Error(`Failed to update profile: ${error.message}`);
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Unexpected error updating profile:', error);
      return { data: null, error: error.message };
    }
  }

  // Asset notes operations
  static async createAssetNote(noteData: Tables['asset_notes']['Insert']) {
    try {
      const { data, error } = await supabase
        .from('asset_notes')
        .insert(noteData)
        .select()
        .single();

      if (error) {
        console.error('Database error creating note:', error);
        throw new Error(`Failed to create note: ${error.message}`);
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Unexpected error creating note:', error);
      return { data: null, error: error.message };
    }
  }

  static async getAssetNotes(assetId: string, ownerId: string) {
    try {
      const { data, error } = await supabase
        .from('asset_notes')
        .select('*')
        .eq('asset_id', assetId)
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error fetching notes:', error);
        throw new Error(`Failed to fetch notes: ${error.message}`);
      }

      return { data: data || [], error: null };
    } catch (error: any) {
      console.error('Unexpected error fetching notes:', error);
      return { data: [], error: error.message };
    }
  }

  // Insurance operations
  static async upsertAssetInsurance(insuranceData: Tables['asset_insurance']['Insert']) {
    try {
      const { data, error } = await supabase
        .from('asset_insurance')
        .upsert(insuranceData, {
          onConflict: 'asset_id,owner_id'
        })
        .select()
        .single();

      if (error) {
        console.error('Database error upserting insurance:', error);
        throw new Error(`Failed to save insurance: ${error.message}`);
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Unexpected error upserting insurance:', error);
      return { data: null, error: error.message };
    }
  }

  // Assignment operations
  static async createAssetAssignment(assignmentData: Tables['asset_assignments']['Insert']) {
    try {
      const { data, error } = await supabase
        .from('asset_assignments')
        .insert(assignmentData)
        .select()
        .single();

      if (error) {
        console.error('Database error creating assignment:', error);
        throw new Error(`Failed to create assignment: ${error.message}`);
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Unexpected error creating assignment:', error);
      return { data: null, error: error.message };
    }
  }

  static async getAssetAssignments(assetId: string) {
    try {
      const { data, error } = await supabase
        .from('asset_assignments')
        .select(`
          *,
          assigned_to_profile:assigned_to(full_name, email),
          assigned_by_profile:assigned_by(full_name, email)
        `)
        .eq('asset_id', assetId)
        .order('assigned_date', { ascending: false });

      if (error) {
        console.error('Database error fetching assignments:', error);
        throw new Error(`Failed to fetch assignments: ${error.message}`);
      }

      return { data: data || [], error: null };
    } catch (error: any) {
      console.error('Unexpected error fetching assignments:', error);
      return { data: [], error: error.message };
    }
  }

  // Theft report operations
  static async createTheftReport(reportData: Tables['theft_reports']['Insert']) {
    try {
      const { data, error } = await supabase
        .from('theft_reports')
        .insert(reportData)
        .select()
        .single();

      if (error) {
        console.error('Database error creating theft report:', error);
        throw new Error(`Failed to create theft report: ${error.message}`);
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Unexpected error creating theft report:', error);
      return { data: null, error: error.message };
    }
  }

  // Category operations
  static async getCategories(ownerId?: string) {
    try {
      let query = supabase
        .from('categories')
        .select('*')
        .order('name');

      if (ownerId) {
        query = query.or(`owner_id.eq.${ownerId},owner_id.is.null`);
      } else {
        query = query.is('owner_id', null);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Database error fetching categories:', error);
        throw new Error(`Failed to fetch categories: ${error.message}`);
      }

      return { data: data || [], error: null };
    } catch (error: any) {
      console.error('Unexpected error fetching categories:', error);
      return { data: [], error: error.message };
    }
  }

  static async createCategory(categoryData: Tables['categories']['Insert']) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert(categoryData)
        .select()
        .single();

      if (error) {
        console.error('Database error creating category:', error);
        throw new Error(`Failed to create category: ${error.message}`);
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Unexpected error creating category:', error);
      return { data: null, error: error.message };
    }
  }

  // Health check and connection testing
  static async healthCheck() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (error) {
        console.error('Database health check failed:', error);
        return { healthy: false, error: error.message };
      }

      return { healthy: true, error: null };
    } catch (error: any) {
      console.error('Database health check error:', error);
      return { healthy: false, error: error.message };
    }
  }
}