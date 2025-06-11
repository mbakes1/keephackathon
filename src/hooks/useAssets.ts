import { useState, useEffect, useCallback } from 'react';
import { DatabaseService } from '../lib/supabase/database';
import { RealtimeService } from '../lib/supabase/realtime';
import { PerformanceService } from '../lib/performance';
import { ErrorHandler } from '../lib/error-handling';
import { useAuth } from '../context/AuthContext';

export function useAssets() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssets = useCallback(async () => {
    if (!user?.id) {
      setAssets([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Check cache first
      const cacheKey = `assets-${user.id}`;
      const cachedAssets = PerformanceService.getCache(cacheKey);
      
      if (cachedAssets) {
        setAssets(cachedAssets);
        setLoading(false);
        return;
      }

      const { data, error: dbError } = await PerformanceService.measurePerformance(
        'fetch-assets',
        () => DatabaseService.getAssetsByOwner(user.id, {
          orderBy: 'created_at',
          ascending: false
        })
      );

      if (dbError) {
        throw new Error(dbError);
      }

      setAssets(data);
      
      // Cache the results
      PerformanceService.setCache(cacheKey, data);
      
    } catch (err: any) {
      const errorMessage = ErrorHandler.handleDatabaseError(err, 'fetch assets');
      setError(errorMessage);
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const createAsset = useCallback(async (assetData: any) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      const { data, error: dbError } = await DatabaseService.createAsset({
        ...assetData,
        owner_id: user.id
      });

      if (dbError) {
        throw new Error(dbError);
      }

      // Clear cache and refresh
      PerformanceService.clearCache(`assets-${user.id}`);
      await fetchAssets();

      return data;
    } catch (err: any) {
      const errorMessage = ErrorHandler.handleDatabaseError(err, 'create asset');
      throw new Error(errorMessage);
    }
  }, [user?.id, fetchAssets]);

  const updateAsset = useCallback(async (id: string, updates: any) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      const { data, error: dbError } = await DatabaseService.updateAsset(id, updates, user.id);

      if (dbError) {
        throw new Error(dbError);
      }

      // Update local state
      setAssets(prev => prev.map(asset => 
        asset.id === id ? { ...asset, ...updates } : asset
      ));

      // Clear cache
      PerformanceService.clearCache(`assets-${user.id}`);

      return data;
    } catch (err: any) {
      const errorMessage = ErrorHandler.handleDatabaseError(err, 'update asset');
      throw new Error(errorMessage);
    }
  }, [user?.id]);

  const deleteAsset = useCallback(async (id: string) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      const { error: dbError } = await DatabaseService.deleteAsset(id, user.id);

      if (dbError) {
        throw new Error(dbError);
      }

      // Update local state
      setAssets(prev => prev.filter(asset => asset.id !== id));

      // Clear cache
      PerformanceService.clearCache(`assets-${user.id}`);

    } catch (err: any) {
      const errorMessage = ErrorHandler.handleDatabaseError(err, 'delete asset');
      throw new Error(errorMessage);
    }
  }, [user?.id]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user?.id) return;

    const channelName = RealtimeService.subscribeToAssetChanges(
      user.id,
      (payload) => {
        // Asset inserted
        setAssets(prev => [payload.new, ...prev]);
        PerformanceService.clearCache(`assets-${user.id}`);
      },
      (payload) => {
        // Asset updated
        setAssets(prev => prev.map(asset => 
          asset.id === payload.new.id ? payload.new : asset
        ));
        PerformanceService.clearCache(`assets-${user.id}`);
      },
      (payload) => {
        // Asset deleted
        setAssets(prev => prev.filter(asset => asset.id !== payload.old.id));
        PerformanceService.clearCache(`assets-${user.id}`);
      }
    );

    return () => {
      RealtimeService.unsubscribe(channelName);
    };
  }, [user?.id]);

  // Initial fetch
  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  return {
    assets,
    loading,
    error,
    fetchAssets,
    createAsset,
    updateAsset,
    deleteAsset,
    refetch: fetchAssets
  };
}