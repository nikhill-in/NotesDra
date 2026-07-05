import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { Advertisement } from '../types';

type Zone = 'header' | 'sidebar' | 'inline' | 'footer';

interface AdsContextValue {
  getAdForZone: (zone: Zone) => Advertisement | null;
  loading: boolean;
}

const AdsContext = createContext<AdsContextValue>({
  getAdForZone: () => null,
  loading: true,
});

export function useAds() {
  return useContext(AdsContext);
}

export function AdsProvider({ children }: { children: ReactNode }) {
  const [adsByZone, setAdsByZone] = useState<Record<string, Advertisement>>({});
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);
  const loggedImpressions = useRef<Set<number>>(new Set());

  useEffect(() => {
    // Guard against double-fetch in StrictMode / re-renders
    if (hasFetched.current) return;
    hasFetched.current = true;

    const controller = new AbortController();

    fetch('/api/admin/ads', { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        if (!data.success || !Array.isArray(data.data)) return;

        const zones: Zone[] = ['header', 'sidebar', 'inline', 'footer'];
        const selected: Record<string, Advertisement> = {};

        zones.forEach(zone => {
          const activeAdsInZone = data.data.filter(
            (a: Advertisement) => a.is_active && a.placement_zone === zone
          );
          if (activeAdsInZone.length > 0) {
            // Random pick happens ONCE per zone, ONCE per session — not per mount
            const pick = activeAdsInZone[Math.floor(Math.random() * activeAdsInZone.length)];
            selected[zone] = pick;
          }
        });

        setAdsByZone(selected);

        // Fire impressions once per ad, guarded against duplicates
        Object.values(selected).forEach(ad => {
          if (!loggedImpressions.current.has(ad.id)) {
            loggedImpressions.current.add(ad.id);
            fetch(`/api/ads/${ad.id}/impression`, { method: 'POST' }).catch(err =>
              console.error('Error logging ad impression', err)
            );
          }
        });
      })
      .catch(err => {
        if (err.name !== 'AbortError') console.error('Error fetching ads', err);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  const getAdForZone = (zone: Zone) => adsByZone[zone] ?? null;

  return (
    <AdsContext.Provider value={{ getAdForZone, loading }}>
      {children}
    </AdsContext.Provider>
  );
}