'use client';

import { useState, useEffect } from 'react';
import { TimerSession } from '../types';

export function useActivityData(open: boolean) {
  const [sessions, setSessions] = useState<TimerSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchActivityData();
    }
  }, [open]);

  const fetchActivityData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Use API route instead of direct Supabase access
      const response = await fetch('/api/activity-sessions', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setSessions(data.sessions || []);
    } catch (error: any) {
      console.error('Error fetching activity data:', {
        message: error?.message || 'Unknown error',
        details: error
      });
      setError(error?.message || 'Failed to load activity data');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    sessions,
    loading,
    error,
    refetch: fetchActivityData,
  };
}