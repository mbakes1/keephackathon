import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export class RealtimeService {
  private static channels: Map<string, RealtimeChannel> = new Map();

  static subscribeToAssetChanges(
    ownerId: string,
    onInsert?: (payload: any) => void,
    onUpdate?: (payload: any) => void,
    onDelete?: (payload: any) => void
  ) {
    const channelName = `assets-${ownerId}`;
    
    // Remove existing channel if it exists
    this.unsubscribe(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'assets',
          filter: `owner_id=eq.${ownerId}`,
        },
        (payload) => {
          console.log('Asset inserted:', payload);
          onInsert?.(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'assets',
          filter: `owner_id=eq.${ownerId}`,
        },
        (payload) => {
          console.log('Asset updated:', payload);
          onUpdate?.(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'assets',
          filter: `owner_id=eq.${ownerId}`,
        },
        (payload) => {
          console.log('Asset deleted:', payload);
          onDelete?.(payload);
        }
      )
      .subscribe((status) => {
        console.log(`Asset subscription status: ${status}`);
      });

    this.channels.set(channelName, channel);
    return channelName;
  }

  static subscribeToTheftReports(
    assetId: string,
    onInsert?: (payload: any) => void
  ) {
    const channelName = `theft-reports-${assetId}`;
    
    // Remove existing channel if it exists
    this.unsubscribe(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'theft_reports',
          filter: `asset_id=eq.${assetId}`,
        },
        (payload) => {
          console.log('Theft report created:', payload);
          onInsert?.(payload);
        }
      )
      .subscribe((status) => {
        console.log(`Theft report subscription status: ${status}`);
      });

    this.channels.set(channelName, channel);
    return channelName;
  }

  static subscribeToAssetNotes(
    assetId: string,
    ownerId: string,
    onInsert?: (payload: any) => void,
    onUpdate?: (payload: any) => void,
    onDelete?: (payload: any) => void
  ) {
    const channelName = `asset-notes-${assetId}`;
    
    // Remove existing channel if it exists
    this.unsubscribe(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'asset_notes',
          filter: `asset_id=eq.${assetId}`,
        },
        (payload) => {
          console.log('Asset note inserted:', payload);
          onInsert?.(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'asset_notes',
          filter: `asset_id=eq.${assetId}`,
        },
        (payload) => {
          console.log('Asset note updated:', payload);
          onUpdate?.(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'asset_notes',
          filter: `asset_id=eq.${assetId}`,
        },
        (payload) => {
          console.log('Asset note deleted:', payload);
          onDelete?.(payload);
        }
      )
      .subscribe((status) => {
        console.log(`Asset notes subscription status: ${status}`);
      });

    this.channels.set(channelName, channel);
    return channelName;
  }

  static unsubscribe(channelName: string) {
    const channel = this.channels.get(channelName);
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
      console.log(`Unsubscribed from channel: ${channelName}`);
    }
  }

  static unsubscribeAll() {
    this.channels.forEach((channel, channelName) => {
      supabase.removeChannel(channel);
      console.log(`Unsubscribed from channel: ${channelName}`);
    });
    this.channels.clear();
  }

  static getActiveChannels() {
    return Array.from(this.channels.keys());
  }
}