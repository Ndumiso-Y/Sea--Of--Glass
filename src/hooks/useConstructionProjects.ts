import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface ConstructionProject {
  id: string;
  name: string;
  status: string;
  start_date: string;
  budget: number;
  actual_spend: number;
}

export function useConstructionProjects() {
  const [data, setData] = useState<ConstructionProject[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: rows, error: err } = await supabase
        .from('construction_projects')
        .select('*')
        .order('start_date', { ascending: false });

      if (err) throw err;
      setData(rows ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch construction projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
