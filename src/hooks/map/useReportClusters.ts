import { useRubricsStore } from '@/src/store/rubricsStore';
import { Report } from '@/src/types';
import { useMemo } from 'react';

interface Cluster {
  reports: Report[];
  latitude: number;
  longitude: number;
  color: string;
  isCluster: boolean;
}

export function useReportClusters(reports: Report[]): Cluster[] {
  return useMemo(() => {
    const grouped: Record<string, Report[]> = {};
    reports.forEach((r) => {
      if (r.latitude === null || r.longitude === null || r.latitude === undefined || r.longitude === undefined) return;
      const key = `${r.latitude.toFixed(3)}-${r.longitude.toFixed(3)}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(r);
    });

    return Object.values(grouped).map((cluster) => {
      const main = cluster[0];
      const cat = useRubricsStore.getState().getRubric(main.rubric_name);
      return {
        reports: cluster,
        latitude: main.latitude,
        longitude: main.longitude,
        color: cat?.color || '#FF3B30',
        isCluster: cluster.length > 1,
      };
    });
  }, [reports]);
}
