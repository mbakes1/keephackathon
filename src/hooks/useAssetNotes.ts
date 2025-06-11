import { useState, useEffect, useCallback } from 'react';
import { DatabaseService } from '../lib/supabase/database';
import { RealtimeService } from '../lib/supabase/realtime';
import { PerformanceService } from '../lib/performance';
import { ErrorHandler } from '../lib/error-handling';
import { ValidationService } from '../lib/validation';
import { useAuth } from '../context/AuthContext';

export function useAssetNotes(assetId: string) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    if (!user?.id || !assetId) {
      setNotes([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const cacheKey = `notes-${assetId}`;
      const cachedNotes = PerformanceService.getCache(cacheKey);
      
      if (cachedNotes) {
        setNotes(cachedNotes);
        setLoading(false);
        return;
      }

      const { data, error: dbError } = await DatabaseService.getAssetNotes(assetId, user.id);

      if (dbError) {
        throw new Error(dbError);
      }

      setNotes(data);
      PerformanceService.setCache(cacheKey, data);
      
    } catch (err: any) {
      const errorMessage = ErrorHandler.handleDatabaseError(err, 'fetch notes');
      setError(errorMessage);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, assetId]);

  const createNote = useCallback(async (noteData: any) => {
    if (!user?.id || !assetId) {
      throw new Error('User not authenticated or asset ID missing');
    }

    // Validate note data
    const validation = ValidationService.validateNoteData(noteData);
    if (!validation.valid) {
      throw new Error(ErrorHandler.handleValidationError(validation.errors));
    }

    try {
      const { data, error: dbError } = await DatabaseService.createAssetNote({
        ...noteData,
        asset_id: assetId,
        owner_id: user.id
      });

      if (dbError) {
        throw new Error(dbError);
      }

      // Clear cache and refresh
      PerformanceService.clearCache(`notes-${assetId}`);
      await fetchNotes();

      return data;
    } catch (err: any) {
      const errorMessage = ErrorHandler.handleDatabaseError(err, 'create note');
      throw new Error(errorMessage);
    }
  }, [user?.id, assetId, fetchNotes]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user?.id || !assetId) return;

    const channelName = RealtimeService.subscribeToAssetNotes(
      assetId,
      user.id,
      (payload) => {
        // Note inserted
        setNotes(prev => [payload.new, ...prev]);
        PerformanceService.clearCache(`notes-${assetId}`);
      },
      (payload) => {
        // Note updated
        setNotes(prev => prev.map(note => 
          note.id === payload.new.id ? payload.new : note
        ));
        PerformanceService.clearCache(`notes-${assetId}`);
      },
      (payload) => {
        // Note deleted
        setNotes(prev => prev.filter(note => note.id !== payload.old.id));
        PerformanceService.clearCache(`notes-${assetId}`);
      }
    );

    return () => {
      RealtimeService.unsubscribe(channelName);
    };
  }, [user?.id, assetId]);

  // Initial fetch
  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  return {
    notes,
    loading,
    error,
    fetchNotes,
    createNote,
    refetch: fetchNotes
  };
}