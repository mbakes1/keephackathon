import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase/supabase';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any, user: any }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const ensureProfileExists = async (user: User) => {
    try {
      // Check if profile already exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (!existingProfile && !fetchError) {
        // Profile doesn't exist, create it
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
            role: 'admin', // Default role for users
          });

        if (insertError) {
          console.error('Error creating profile:', insertError);
        }
      } else if (fetchError) {
        console.error('Error checking profile:', fetchError);
      }
    } catch (error) {
      console.error('Error ensuring profile exists:', error);
    }
  };

  useEffect(() => {
    const getSession = async () => {
      setLoading(true);
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (session?.user) {
          await ensureProfileExists(session.user);
          setSession(session);
          setUser(session.user);
        } else {
          // Clear any stale tokens when no valid session is found
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
        }
      } catch (error) {
        console.error('Error getting session:', error);
        // Clear stale tokens on error
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
      }
      
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          if (session?.user && event !== 'SIGNED_OUT' && event !== 'USER_DELETED') {
            await ensureProfileExists(session.user);
            setSession(session);
            setUser(session.user);
          } else {
            // Clear stale tokens when session becomes invalid or user signs out
            if (event !== 'SIGNED_OUT' && event !== 'USER_DELETED') {
              await supabase.auth.signOut();
            }
            setSession(null);
            setUser(null);
          }
        } catch (error) {
          console.error('Error in auth state change:', error);
          // Clear stale tokens on error
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (!error && data?.user) {
      // Create a profile for the new user
      await supabase.from('profiles').insert({
        id: data.user.id,
        email: email,
        full_name: fullName,
        role: 'admin', // Default role for new users
      });
    }

    return { error, user: data?.user };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    session,
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}