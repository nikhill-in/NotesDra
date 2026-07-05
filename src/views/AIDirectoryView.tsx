import { useState, useEffect } from 'react';
import { AITool } from '../types';
import { Search, Sparkles, Filter, ExternalLink, BookmarkCheck } from 'lucide-react';

export default function AIDirectoryView() {
  const [tools, setTools] = useState<AITool[]>([]);
  const [search, setSearch] = useState('');
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'featured' | 'newest' | 'alpha'>('featured');

  useEffect(() => {
    fetch('/api/ai-tools')
      .then(res => res.json())
      .then(payload => {
        if (payload.success && Array.isArray(payload.data)) {
          setTools(payload.data);
        }
      })
      .catch(err => console.error('Failed to load AI directory', err));
  }, []);

  const CATEGORIES = [
    { id: 'writing', name: 'Writing' },
    { id: 'coding', name: 'Coding/Dev' },
    { id: 'image', name: 'Image Creator' },
    { id: 'video', name: 'Video Production' },
    { id: 'audio', name: 'Voice & Sound' },
    { id: 'research', name: 'Academic Research' },
    { id: 'productivity', name: 'Productivity' },
    { id: 'other', name: 'Other Spaces' }
  ];

  // Filtering + Sorting rules logic
  const filteredTools = tools
    .filter(t => {
      const matchQuery = t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase());
      const matchCat = selectedCategory ? t.category === selectedCategory : true;
      return matchQuery && matchCat;
    })
    .sort((a, b) => {
      if (sortBy === 'featured') {
        return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
      }
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === 'alpha') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="border-b border-slate-850 pb-5">
        <h1 className="text-2xl md:text-3xl font-display font-medium text-slate-100 flex items-center gap-2">
          <Sparkles className="h-7 w-7 text-indigo-400" />
          AI Tool Directory Catalog
        </h1>
        <p className="text-slate-400 text-xs md:text-sm mt-1">
          Explore curated AI solutions, developer automated systems, voice speech cloners, and real-time grounding frameworks.
        </p>
      </div>

      {/* Controllers bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        {/* Search */}
        <div className="relative flex items-center bg-[#1a1d27] border border-[#2d3148] rounded-full px-3 py-1.5 focus-within:border-indigo-500 transition-all duration-200">
          <Search className="h-4 w-4 text-slate-500 mr-2 shrink-0" />
          <input 
            type="text" 
            placeholder="Search tools by name, utility..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent border-0 outline-none text-xs text-slate-300 placeholder-slate-600"
          />
        </div>

        {/* Sorting selector */}
        <div className="flex items-center justify-between col-span-2 gap-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 select-none">
            <Filter className="h-3.5 w-3.5" />
            <span>Sort by:</span>
            <select 
              value={sortBy} 
              onChange={(e: any) => setSortBy(e.target.value)}
              className="px-2.5 py-1 bg-[#1a1d27] border border-[#2d3148] text-slate-300 text-xs rounded-lg outline-none cursor-pointer font-bold font-sans"
            >
              <option value="featured">Featured Highlight</option>
              <option value="newest">Recent Additions</option>
              <option value="alpha">Alphabetical (A-Z)</option>
            </select>
          </div>
          
          <span className="text-[10px] text-slate-500 font-mono tracking-wider font-bold">
            {filteredTools.length} tools indexed
          </span>
        </div>
      </div>

      {/* Categories chips filtering */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs select-none">
        <button 
          onClick={() => setSelectedCategory(null)}
          className={`px-3 py-1 rounded-full cursor-pointer font-semibold border-0 transition duration-155 ${!selectedCategory ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20' : 'bg-[#1a1d27] border border-[#2d3148] text-slate-400 hover:text-slate-200'}`}
        >
          All Categories
        </button>
        {CATEGORIES.map(cat => (
          <button 
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1 rounded-full cursor-pointer font-semibold border-0 transition duration-155 ${selectedCategory === cat.id ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20' : 'bg-[#1a1d27] border border-[#2d3148] text-slate-400 hover:text-[#e2e8f0]'}`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Grid of tools card components */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTools.map(tool => (
          <div 
            key={tool.id} 
            className="p-5 bg-[#1a1d27] border border-[#2d3148] rounded-xl flex flex-col justify-between group hover:border-indigo-500/30 hover:shadow-lg transition-all duration-300 text-slate-350"
          >
            <div className="space-y-3">
              {/* Heading line */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="p-2.5 bg-[#0f1117] rounded-xl leading-none font-bold text-md cursor-default text-indigo-400 select-none border border-[#2d3148]">
                    ⚡
                  </span>
                  <div>
                    <h3 className="text-slate-200 font-bold text-sm sm:text-md group-hover:text-indigo-400 transition-colors">
                      {tool.name}
                    </h3>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[8px] font-bold bg-[#0f1117] uppercase text-slate-500 tracking-widest font-mono border border-[#2d3148]">
                      {tool.category}
                    </span>
                  </div>
                </div>

                {tool.is_featured && (
                  <span className="px-2 py-0.5 rounded text-[8px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 uppercase tracking-widest font-mono">
                    Featured
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-slate-400 text-xs leading-normal">
                {tool.description}
              </p>
            </div>

            {/* Free tier description and link buttons */}
            <div className="mt-5 pt-3 border-t border-[#2d3148] flex flex-col gap-3">
              <div className="flex items-start gap-2 bg-[#0f1117] p-2.5 rounded-lg border border-[#2d3148]">
                <BookmarkCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-[10px] text-slate-400 leading-normal">
                  <span className="font-bold text-indigo-450 uppercase text-[8px] tracking-wider font-mono">Free Tier:</span><br />
                  {tool.free_tier_details}
                </div>
              </div>

              <a 
                href={tool.website_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full py-2 bg-[#0f1117] hover:bg-slate-800 border border-[#2d3148] text-slate-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <span>Visit Application</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
