import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Realtime subscription helpers
export function subscribeToTable<T>(
  table: string,
  callback: (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; new: T | null; old: T | null }) => void,
  filter?: string
) {
  const channel = supabase
    .channel(`public:${table}`)
    .on<T>(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
        filter: filter ? `id=eq.${filter}` : undefined,
      },
      (payload) => {
        callback({
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          new: payload.new as T | null,
          old: payload.old as T | null,
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// Subscribe to chat messages for a room
export function subscribeToChat(roomId: string, callback: (message: unknown) => void) {
  const channel = supabase
    .channel(`chat:${roomId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// Subscribe to order updates
export function subscribeToOrders(userId: string, callback: (order: unknown) => void) {
  const channel = supabase
    .channel(`orders:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        callback({ type: payload.eventType, data: payload.new });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
