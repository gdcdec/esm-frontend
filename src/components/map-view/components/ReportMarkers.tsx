import { useReportClusters } from '@/src/hooks/map/useReportClusters';
import { Report } from '@/src/types';
import React from 'react';
import { Marker } from 'react-map-gl/maplibre';

interface ReportMarkersProps {
  reports: Report[];
  onMarkerPress: (reports: Report[]) => void;
}

export function ReportMarkers({ reports, onMarkerPress }: ReportMarkersProps) {
  const clusters = useReportClusters(reports);

  return (
    <>
      {clusters.map((cluster, i) => (
        <Marker
          key={`marker-${i}`}
          longitude={cluster.longitude}
          latitude={cluster.latitude}
          anchor="bottom"
          onClick={(e: { originalEvent: { stopPropagation: () => void } }) => {
            e.originalEvent.stopPropagation();
            onMarkerPress(cluster.reports);
          }}
        >
          {cluster.isCluster ? (
            <div
              style={{
                width: 36,
                height: 36,
                background: '#2563EB',
                border: '3px solid white',
                borderRadius: '50%',
                color: 'white',
                fontWeight: 'bold',
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(37,99,235,0.4)',
                cursor: 'pointer',
              }}
            >
              {cluster.reports.length}
            </div>
          ) : (
            <div
              style={{
                width: 30,
                height: 30,
                background: cluster.color,
                border: '3px solid white',
                borderRadius: '50% 50% 50% 0',
                transform: 'rotate(-45deg)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                cursor: 'pointer',
                marginBottom: 10,
              }}
            />
          )}
        </Marker>
      ))}
    </>
  );
}
