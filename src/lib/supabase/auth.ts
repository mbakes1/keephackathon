import { supabase } from './supabase';
import { DatabaseService } from './database';

export class AuthService {
  static async signUp(email: string, password: string, fullName: string) {
    try {
      // Validate inputs
      if (!email || !password || !fullName) {
        throw new Error('Email, password, and full name are required');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (error) {
        console.error('Auth signup error:', error);
        throw error;
      }

      // Profile creation will be handled by the auth state change listener
      return { data, error: null };
    } catch (error: any) {
      console.error('Signup error:', error);
      return { data: null, error };
    }
  }

  static async signIn(email: string, password: string) {
    try {
      // Validate inputs
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        console.error('Auth signin error:', error);
        throw error;
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Signin error:', error);
      return { data: null, error };
    }
  }

  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Auth signout error:', error);
        throw error;
      }

      return { error: null };
    } catch (error: any) {
      console.error('Signout error:', error);
      return { error };
    }
  }

  static async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Get user error:', error);
        throw error;
      }

      return { user, error: null };
    } catch (error: any) {
      console.error('Get current user error:', error);
      return { user: null, error };
    }
  }

  static async getCurrentSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Get session error:', error);
        throw error;
      }

      return { session, error: null };
    } catch (error: any) {
      console.error('Get current session error:', error);
      return { session: null, error };
    }
  }

  static async refreshSession() {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Refresh session error:', error);
        throw error;
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Refresh session error:', error);
      return { data: null, error };
    }
  }

  static async resetPassword(email: string) {
    try {
      if (!email) {
        throw new Error('Email is required');
      }

      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (error) {
        console.error('Reset password error:', error);
        throw error;
      }

      return { error: null };
    } catch (error: any) {
      console.error('Reset password error:', error);
      return { error };
    }
  }

  static async updatePassword(newPassword: string) {
    try {
      if (!newPassword || newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error('Update password error:', error);
        throw error;
      }

      return { error: null };
    } catch (error: any) {
      console.error('Update password error:', error);
      return { error };
    }
  }

  static async ensureProfileExists(user: any) {
    try {
      if (!user?.id) {
        throw new Error('User ID is required');
      }

      // Check if profile exists
      const { data: existingProfile } = await DatabaseService.getProfile(user.id);

      if (!existingProfile) {
        // Create profile
        const profileData = {
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
          role: 'admin' as const,
        };

        const { error } = await DatabaseService.createProfile(profileData);
        
        if (error && !error.includes('already exists')) {
          console.error('Error creating profile:', error);
          // Don't throw here - profile creation failure shouldn't block auth
        }
      }

      return { error: null };
    } catch (error: any) {
      console.error('Error ensuring profile exists:', error);
      return { error: error.message };
    }
  }

  // Subscribe to auth state changes
  static onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
}