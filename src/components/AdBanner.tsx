import { useEffect, useState } from 'react';
import { Advertisement } from '../types';

interface AdBannerProps {
  zone: 'header' | 'sidebar' | 'inline' | 'footer';
}

export default function AdBanner({ zone }: AdBannerProps) {
  const [ad, setAd] = useState<Advertisement | null>(null);

  useEffect(() => {
    // Collect active ads from API
    fetch('/api/admin/ads')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          const activeAdsInZone = data.data.filter((a: Advertisement) => a.is_active && a.placement_zone === zone);
          if (activeAdsInZone.length > 0) {
            // Select random active ad in that zone
            const selected = activeAdsInZone[Math.floor(Math.random() * activeAdsInZone.length)];
            setAd(selected);
            
            // Record Impression in database
            fetch(`/api/ads/${selected.id}/impression`, { method: 'POST' });
          }
        }
      })
      .catch(err => console.error('Error fetching ads', err));
  }, [zone]);

  const handleAdClick = () => {
    if (!ad) return;
    fetch(`/api/ads/${ad.id}/click`, { method: 'POST' })
      .catch(err => console.error('Error logging ad click', err));
  };

  if (!ad) return null;

  return (
    <a 
      href={ad.target_url} 
      target="_blank" 
      rel="noopener noreferrer"
      onClick={handleAdClick}
      className="block relative overflow-hidden rounded-xl group border border-slate-800 bg-slate-900 transition-all duration-300 hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10"
    >
      <div className="absolute top-2 right-2 z-10 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-widest text-slate-400 bg-slate-950/80 uppercase border border-slate-800">
        Sponsored
      </div>
      
      {zone === 'header' && (
        <div className="flex flex-col sm:flex-row items-center h-auto sm:h-20 w-full">
          <img 
            src={ad.image_url} 
            alt={ad.title} 
            className="w-full sm:w-44 h-24 sm:h-full object-cover transition-transform duration-500 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
          <div className="p-4 text-center sm:text-left">
            <h4 className="text-slate-200 font-semibold text-sm group-hover:text-indigo-400 transition-colors">{ad.title}</h4>
            <p className="text-slate-400 text-xs mt-1">Boost logic workflows, explore next-gen developer solutions with premium educational templates.</p>
          </div>
        </div>
      )}

      {zone === 'sidebar' && (
        <div className="flex flex-col w-full p-3">
          <img 
            src={ad.image_url} 
            alt={ad.title} 
            className="w-full h-32 rounded-lg object-cover transition-transform duration-500 group-hover:scale-103"
            referrerPolicy="no-referrer"
          />
          <div className="mt-3">
            <h4 className="text-slate-200 font-semibold text-xs leading-snug group-hover:text-indigo-400 transition-colors">{ad.title}</h4>
            <p className="text-slate-500 text-[10px] mt-1 leading-normal">Interactive developers aggregated toolkit. Access sandbox compile execution nodes.</p>
          </div>
        </div>
      )}

      {zone === 'footer' && (
        <div className="flex flex-col md:flex-row items-center justify-between p-4 bg-slate-955 gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <img 
              src={ad.image_url} 
              alt={ad.title} 
              className="w-12 h-12 rounded object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="text-center sm:text-left">
              <h4 className="text-slate-200 font-medium text-xs sm:text-sm">{ad.title}</h4>
              <p className="text-slate-400 text-[11px] mt-0.5">Explore our official sandbox educational frameworks and developer guides.</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-[11px] font-semibold transition-all duration-200">
            Learn More
          </span>
        </div>
      )}

      {zone === 'inline' && (
        <div className="flex items-center gap-4 p-4 rounded-xl border border-dashed border-slate-700 bg-slate-900/30">
          <img 
            src={ad.image_url} 
            alt={ad.title} 
            className="w-16 h-16 rounded-xl object-cover"
            referrerPolicy="no-referrer"
          />
          <div>
            <h4 className="text-slate-200 text-xs font-semibold uppercase tracking-wider text-indigo-400">Featured Partner</h4>
            <h3 className="text-slate-300 font-bold text-sm mt-0.5 group-hover:text-white">{ad.title}</h3>
            <p className="text-slate-500 text-xs mt-1">Unlock seamless integration vectors using official browser API integrations.</p>
          </div>
        </div>
      )}
    </a>
  );
}
