import React, { useState, useRef, useEffect } from 'react';
import { AggregationResult, User } from '../types';
import AdBanner from '../components/AdBanner';
import { Search, ExternalLink, Share2, PanelLeft, Minimize2, Maximize2, ShieldAlert, Check, HelpCircle } from 'lucide-react';

interface SearchViewProps {
  user: User | null;
  onOpenAuth: () => void;
}

const SOURCE_RESOURCES: any = {
  mdn: { name: 'MDN Web Docs', color: 'border-l-indigo-500', logo: '🌐' },
  w3schools: { name: 'W3Schools', color: 'border-l-emerald-500', logo: '🟢' },
  geeksforgeeks: { name: 'GeeksforGeeks', color: 'border-l-green-600', logo: '🌿' },
  wikipedia: { name: 'Wikipedia', color: 'border-l-slate-400', logo: '📖' },
  medium: { name: 'Medium', color: 'border-l-amber-500', logo: '📝' },
  stackoverflow: { name: 'Stack Overflow', color: 'border-l-orange-500', logo: '🥞' },
};

export default function SearchView({ user, onOpenAuth }: SearchViewProps) {
  const [query, setQuery] = useState('');
  const [lastSearchedQuery, setLastSearchedQuery] = useState('css flexbox');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AggregationResult[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [collapsedSources, setCollapsedSources] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Auto trigger search on mount to populate search view with gorgeous demo elements
  useEffect(() => {
    handleSearch(null, 'css flexbox');
  }, []);

  const handleSearch = async (e: React.FormEvent | null, forcedQuery?: string) => {
    if (e) e.preventDefault();
    const activeQuery = forcedQuery || query;

    if (!activeQuery.trim()) {
      setErrorMsg('Please input a search query (e.g., CSS float, Python arrays, Git commands)');
      return;
    }

    setErrorMsg('');
    setLoading(true);
    setLastSearchedQuery(activeQuery);

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(activeQuery)}`);
      const payload = await response.json();
      
      if (payload.success) {
        setResults(payload.data);
      } else {
        setErrorMsg(payload.message || 'Scraper failed to capture educational resources.');
      }
    } catch (err: any) {
      setErrorMsg('Network issue. Ensure your backend server is responsive.');
    } finally {
      setLoading(false);
    }
  };

  const toggleCollapse = (source: string) => {
    setCollapsedSources(prev => ({
      ...prev,
      [source]: !prev[source]
    }));
  };

  const copyShareLink = (item: AggregationResult) => {
    const shareText = `Check out this aggregated ${item.source.toUpperCase()} note for "${lastSearchedQuery}":\n\n${item.title}\nSource: ${item.url}`;
    navigator.clipboard.writeText(shareText);
    setCopiedId(item.source);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const scrollToSource = (sourceId: string) => {
    const targetElement = document.getElementById(`source-card-${sourceId}`);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-6" ref={containerRef} id="search-view-container">
      {/* Dynamic Header Ad Placements */}
      <AdBanner zone="header" />

      {/* Hero Header */}
      <div className="text-center py-6">
        <h1 className="text-3xl md:text-5xl font-display font-medium tracking-tight text-slate-100">
          Educational <span className="text-indigo-400 font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Aggregation Sandbox</span>
        </h1>
        <p className="text-slate-400 text-sm md:text-base mt-2 max-w-2xl mx-auto">
          Consolidating 8 high-fidelity guides, schemas, and live community responses in a single, immersive learning workspace.
        </p>
      </div>

      {/* Main Search Input Form */}
      <form onSubmit={(e) => handleSearch(e)} className="relative max-w-3xl mx-auto">
        <div className="relative flex items-center bg-[#1a1d27] border border-[#2d3148] rounded-full h-14 md:h-16 px-4 py-2 transition-all duration-300 focus-within:border-indigo-500 focus-within:shadow-lg focus-within:shadow-indigo-500/10">
          <Search className="h-5 w-5 text-slate-500 shrink-0" />
          <input 
            type="text" 
            placeholder="Search programming topics (e.g., promises, grid, recursion)..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent border-0 outline-0 px-3 py-1 font-sans text-sm md:text-base text-slate-200 placeholder-slate-500 focus:ring-0 focus:outline-none"
          />
          <button 
            type="submit" 
            className="px-6 py-2.5 h-full bg-indigo-500 hover:bg-indigo-600 text-white rounded-full text-xs md:text-sm font-bold tracking-wide transition-all duration-200 cursor-pointer text-center flex items-center justify-center min-w-24 shrink-0 shadow-md shadow-indigo-500/25"
          >
            Aggregate
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 p-3 text-xs text-red-500 bg-red-950/20 border border-red-900/50 rounded-xl flex items-center gap-2 animate-fade-in font-mono">
            <ShieldAlert className="h-4 w-4 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}
      </form>

      {/* Suggested helper items buttons */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
        <span className="text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider">Popular Queries:</span>
        {['CSS Flexbox', 'Promises', 'Python Dicts', 'Async Await', 'SQL Joins'].map(term => (
          <button 
            key={term} 
            onClick={() => { setQuery(term); handleSearch(null, term); }}
            className="px-3 py-1.5 rounded-full border border-[#2d3148] hover:border-indigo-500 bg-[#1a1d27] text-slate-450 hover:text-[#e2e8f0] text-[11px] transition duration-200 cursor-pointer"
          >
            {term}
          </button>
        ))}
      </div>

      {/* Search results contents split view */}
      {loading ? (
        // High quality Skeleton card loaders (NOT SPINNING ICONS)
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="hidden lg:block space-y-2 p-4 bg-slate-900/50 border border-slate-800 rounded-2xl h-[400px]">
            <div className="h-5 w-24 bg-slate-800 rounded animate-pulse"></div>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-9 w-full bg-slate-800 rounded-lg animate-pulse"></div>
            ))}
          </div>
          <div className="col-span-3 space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded bg-slate-800 animate-pulse"></div>
                    <div className="h-5 w-36 bg-slate-800 rounded animate-pulse"></div>
                  </div>
                  <div className="h-4 w-20 bg-slate-800 rounded animate-pulse"></div>
                </div>
                <div className="h-5 w-3/4 bg-slate-800 rounded animate-pulse"></div>
                <div className="space-y-2 pt-2">
                  <div className="h-4 w-full bg-slate-800 rounded animate-pulse"></div>
                  <div className="h-4 w-full bg-slate-800 rounded animate-pulse"></div>
                  <div className="h-4 w-2/3 bg-slate-800 animate-pulse rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* LEFT AREA: Navigable resource lists (Desktop Only) */}
          <div className="hidden lg:block sticky top-24 bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shrink-0 select-none">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 px-2 flex items-center gap-1.5">
              <PanelLeft className="h-3.5 w-3.5" />
              Source Navigator
            </h3>
            <div className="space-y-1">
              {results.map(item => {
                const config = SOURCE_RESOURCES[item.source] || { name: item.source.toUpperCase(), color: 'bg-slate-800/20 text-slate-400', logo: '💎' };
                return (
                  <button 
                    key={item.source}
                    onClick={() => scrollToSource(item.source)}
                    className="flex items-center justify-between w-full p-2.5 rounded-xl hover:bg-slate-800 text-left text-slate-400 hover:text-indigo-400 text-xs font-medium cursor-pointer transition-all"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-sm leading-none">{config.logo}</span>
                      <span>{config.name}</span>
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-slate-950 text-slate-500 group-hover:text-white">
                      Online
                    </span>
                  </button>
                );
              })}
            </div>
            
            {/* Inline Sponsor in Source Navigation */}
            <div className="pt-2 border-t border-slate-800">
              <AdBanner zone="sidebar" />
            </div>
          </div>

          {/* MAIN COLUMN AREA: Stream view scroll list */}
          <div className="lg:col-span-3 space-y-6">
            {!user && (
              <div className="p-4 bg-indigo-950/20 border border-indigo-900/50 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 text-lg leading-none mt-0.5">🔒</span>
                  <div>
                    <h4 className="text-slate-200 font-semibold text-sm">Guest Mode Restrictions</h4>
                    <p className="text-slate-400 text-xs mt-0.5">You are currently seeing 2 full sources. Connect your profile to unlock all 8 priority resource nodes.</p>
                  </div>
                </div>
                <button 
                  onClick={onOpenAuth}
                  className="px-4 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold cursor-pointer shrink-0 transition"
                >
                  Create Account
                </button>
              </div>
            )}

            <div className="space-y-6">
              {results.map((item, index) => {
                const config = SOURCE_RESOURCES[item.source] || { name: item.source.toUpperCase(), color: 'border-l-slate-400', logo: '🛠️' };
                const isCollapsed = collapsedSources[item.source] || false;
                
                return (
                  <div 
                    key={item.source} 
                    id={`source-card-${item.source}`}
                    className={`bg-[#1a1d27] rounded-xl border border-[#2d3148] flex flex-col shadow-xl overflow-hidden border-l-4 ${config.color} transition-all-300 hover:border-indigo-500/30`}
                  >
                    {/* Header Controls bar */}
                    <div className="px-4 py-3 bg-[#242938] border-b border-[#2d3148] flex items-center justify-between select-none">
                      <div className="flex items-center gap-2">
                        <span className="text-lg leading-none">{config.logo}</span>
                        <div>
                          <h3 className="text-slate-200 font-bold text-xs uppercase tracking-wider leading-none">
                            {config.name}
                          </h3>
                          <p className="text-[#818cf8] text-[9px] mt-1 tracking-wider uppercase font-mono">
                            {item.source}.org scraped
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-slate-400">
                        <button 
                          onClick={() => copyShareLink(item)}
                          title="Copy Share Link"
                          className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition duration-200 cursor-pointer"
                        >
                          {copiedId === item.source ? (
                            <Check className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <Share2 className="h-4 w-4" />
                          )}
                        </button>
                        <a 
                          href={item.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          title="Open Original Website"
                          className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition duration-200 cursor-pointer"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <button 
                          onClick={() => toggleCollapse(item.source)}
                          title={isCollapsed ? "Expand Notes" : "Collapse Notes"}
                          className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition duration-200 cursor-pointer"
                        >
                          {isCollapsed ? (
                            <Maximize2 className="h-4 w-4" />
                          ) : (
                            <Minimize2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="p-5 md:p-6 flex-grow">
                      <h4 className="text-slate-100 font-semibold text-sm md:text-md mb-3">
                        {item.title}
                      </h4>

                      {/* Content Section with expand collapse trigger */}
                      {!isCollapsed && (
                        <div className="text-slate-300 text-xs md:text-sm leading-relaxed space-y-4">
                          {/* Render sanitized markdown/html */}
                          <div 
                            className="mt-2 prose prose-invert prose-xs max-w-none text-slate-300"
                            dangerouslySetInnerHTML={{ __html: item.content }}
                          />
                        </div>
                      )}

                      {isCollapsed && (
                        <p className="text-slate-500 text-xs italic">
                          Content collapsed. Press expand toggle button to view full extracted documentation details.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="py-12 text-center rounded-2xl border border-dashed border-slate-850 bg-slate-900/10">
          <HelpCircle className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-slate-300 font-semibold">No aggregated data yet</h3>
          <p className="text-slate-500 text-xs max-w-md mx-auto mt-1">
            Input a concept like "asynchronous JS" or "flexbox alignment" into the query engine above to scrape guides automatically.
          </p>
        </div>
      )}

      {/* Footer Ad banner */}
      <AdBanner zone="footer" />
    </div>
  );
}
