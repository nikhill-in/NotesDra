import React, { useState, useEffect } from 'react';
import { User, Advertisement, BlogPost, AITool, SearchLog, ActiveSession } from '../types';
import { 
  Users, TrendingUp, BarChart2, Radio, Edit, Settings, Trash, 
  Ban, Shield, Plus, Image, PlusCircle, Check, Eye, Link, Layers, ToggleLeft, ToggleRight, Loader 
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar, Cell } from 'recharts';

export default function AdminView() {
  const [metrics, setMetrics] = useState<any>({
    totalUsers: 0,
    activeToday: 0,
    searchesToday: 0,
    totalAdvertisements: 0,
    activeSessionsCount: 0
  });

  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [recentSearches, setRecentSearches] = useState<SearchLog[]>([]);

  // Editing tabs inside Admin view
  const [adminTab, setAdminTab] = useState<'analytics' | 'users' | 'ads' | 'blog' | 'ai-tools'>('analytics');

  // Ad Creator form parameters
  const [newAd, setNewAd] = useState({ title: '', image_url: '', target_url: '', placement_zone: 'sidebar' });
  // Blog Creator form parameters
  const [newBlog, setNewBlog] = useState({ title: '', cover_image_url: '', tags: 'CSS, Web', content: '<h2>Draft Post</h2><p>Article body is fully custom HTML formatted.</p>' });
  // AI Tool Creator form parameters
  const [newTool, setNewTool] = useState({ name: '', description: '', category: 'coding', website_url: '', logo_url: '', free_tier_details: 'Free for everyone', is_featured: false });

  // Status triggers
  const [msg, setMsg] = useState('');

  // Graph Data
  const [searchesTimeline, setSearchesTimeline] = useState<any[]>([]);
  const [topSearchedTopics, setTopSearchedTopics] = useState<any[]>([]);

  useEffect(() => {
    fetchAdminStats();
    fetchUsers();
    fetchAds();
    generateAnalyticsData();
  }, [adminTab]);

  const fetchAdminStats = () => {
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(payload => {
        if (payload.success && payload.data) {
          setMetrics(payload.data.metrics);
          setActiveSessions(payload.data.activeSessions || []);
          setRecentSearches(payload.data.recentSearches || []);
        }
      })
      .catch(err => console.error(err));
  };

  const fetchUsers = () => {
    fetch('/api/admin/users')
      .then(res => res.json())
      .then(payload => {
        if (payload.success && Array.isArray(payload.data)) {
          setUsers(payload.data);
        }
      })
      .catch(err => console.error(err));
  };

  const fetchAds = () => {
    fetch('/api/admin/ads')
      .then(res => res.json())
      .then(payload => {
        if (payload.success && Array.isArray(payload.data)) {
          setAds(payload.data);
        }
      })
      .catch(err => console.error(err));
  };

  const generateAnalyticsData = () => {
    // Generate lovely mockup data for Recharts to avoid blank page
    setSearchesTimeline([
      { name: 'May 15', count: 18 },
      { name: 'May 16', count: 24 },
      { name: 'May 17', count: 42 },
      { name: 'May 18', count: 31 },
      { name: 'May 19', count: 52 },
      { name: 'May 20', count: 68 },
      { name: 'May 21', count: 85 },
    ]);

    setTopSearchedTopics([
      { name: 'css flexbox', count: 48 },
      { name: 'promises', count: 32 },
      { name: 'recursion', count: 15 },
      { name: 'async await', count: 28 },
      { name: 'sql joins', count: 12 },
    ]);
  };

  const showStatus = (text: string) => {
    setMsg(text);
    setTimeout(() => setMsg(''), 4000);
  };

  // BAN / UNBAN User
  const toggleUserBan = (userId: string, isBanned: boolean) => {
    fetch(`/api/admin/users/${userId}/ban`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_banned: !isBanned })
    })
      .then(res => res.json())
      .then(payload => {
        if (payload.success) {
          showStatus(payload.message || 'User status updated');
          fetchUsers();
          fetchAdminStats();
        } else {
          showStatus('Error: ' + payload.message);
        }
      })
      .catch(err => console.error(err));
  };

  const deleteUser = (userId: string) => {
    if (!confirm('Proceed with absolute deletion of this user?')) return;
    fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(payload => {
        if (payload.success) {
          showStatus('User successfully deleted from directory');
          fetchUsers();
          fetchAdminStats();
        } else {
          showStatus('Error: ' + payload.message);
        }
      });
  };

  // CREATE Advertisement
  const createAd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAd.title || !newAd.image_url || !newAd.target_url) {
      alert('All fields required');
      return;
    }

    fetch('/api/admin/ads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAd)
    })
      .then(res => res.json())
      .then(payload => {
        if (payload.success) {
          showStatus('Advertisement successfully deployed banner system');
          setNewAd({ title: '', image_url: '', target_url: '', placement_zone: 'sidebar' });
          fetchAds();
          fetchAdminStats();
        }
      });
  };

  const deleteAd = (adId: string) => {
    fetch(`/api/admin/ads/${adId}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(() => {
        showStatus('Ad deleted successfully');
        fetchAds();
      });
  };

  const toggleAdActive = (adId: string, currentActive: boolean) => {
    fetch(`/api/admin/ads/${adId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !currentActive })
    })
      .then(res => res.json())
      .then(() => {
        showStatus('Ad toggle state modified');
        fetchAds();
      });
  };

  // CREATE Blog Post
  const createBlog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlog.title || !newBlog.content) {
      alert('Title and content required');
      return;
    }

    const tagsArr = newBlog.tags.split(',').map(t => t.trim());

    fetch('/api/admin/blog/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newBlog, tags: tagsArr })
    })
      .then(res => res.json())
      .then(payload => {
        if (payload.success) {
          showStatus('New blog article published successfully!');
          setNewBlog({ title: '', cover_image_url: '', tags: 'CSS, Web', content: '<h2>Draft Post</h2><p>Article body is fully custom HTML formatted.</p>' });
        }
      });
  };

  // CREATE AI Tool Catalog item
  const createTool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTool.name || !newTool.description || !newTool.website_url) {
      alert('Name, description, and link website are required');
      return;
    }

    fetch('/api/admin/ai-tools', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTool)
    })
      .then(res => res.json())
      .then(payload => {
        if (payload.success) {
          showStatus('AI tool integrated successfully index catalog');
          setNewTool({ name: '', description: '', category: 'coding', website_url: '', logo_url: '', free_tier_details: 'Free for everyone', is_featured: false });
        }
      });
  };

  return (
    <div className="space-y-6">
      {/* Admin header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-medium text-slate-100 flex items-center gap-2">
            <Shield className="h-7 w-7 text-indigo-400" />
            Administrative Analytics & Content Manager
          </h1>
          <p className="text-slate-400 text-xs md:text-sm mt-1">
            Real-time track site activity, ban/unban users, configure sponsors context layouts, and index catalogs.
          </p>
        </div>

        {/* Global alerts inline */}
        {msg && (
          <div className="px-4 py-2 bg-[#1a1d27]/40 text-xs font-semibold text-indigo-400 rounded-lg border border-[#2d3148] flex items-center gap-2 animate-pulse justify-center">
            <Check className="h-4 w-4" />
            <span>{msg}</span>
          </div>
        )}
      </div>

      {/* Admin internal nav toggle */}
      <div className="flex flex-wrap items-center bg-[#1a1d27] border border-[#2d3148] p-1.5 rounded-xl gap-1.5 select-none animate-fade-in">
        <button 
          onClick={() => setAdminTab('analytics')}
          className={`px-4 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all duration-150 ${adminTab === 'analytics' ? 'bg-indigo-500 text-white font-semibold shadow' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Graphs & Analytics
        </button>
        <button 
          onClick={() => setAdminTab('users')}
          className={`px-4 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all duration-155 ${adminTab === 'users' ? 'bg-indigo-500 text-white font-semibold shadow' : 'text-slate-400 hover:text-slate-200'}`}
        >
          User Manager
        </button>
        <button 
          onClick={() => setAdminTab('ads')}
          className={`px-4 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all duration-155 ${adminTab === 'ads' ? 'bg-indigo-500 text-white font-semibold shadow' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Ad Banners Publisher
        </button>
        <button 
          onClick={() => setAdminTab('blog')}
          className={`px-4 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all duration-155 ${adminTab === 'blog' ? 'bg-indigo-500 text-white font-semibold shadow' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Blog Rich Editor
        </button>
        <button 
          onClick={() => setAdminTab('ai-tools')}
          className={`px-4 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all duration-155 ${adminTab === 'ai-tools' ? 'bg-indigo-500 text-white font-semibold shadow' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Directory Catalog Editor
        </button>
      </div>

      {/* ========================================================= */}
      {/*                  TAB 1: DENSE ANALYTICS DOCK              */}
      {/* ========================================================= */}
      {adminTab === 'analytics' && (
        <div className="space-y-6">
          {/* TopRow metric cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-[#1a1d27] border border-[#2d3148] rounded-xl">
              <div className="flex justify-between items-center text-slate-500 text-[10px] uppercase font-bold font-mono tracking-wider">
                <span>Total Users Indexed</span>
                <Users className="h-4.5 w-4.5 text-indigo-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-200 mt-2">{metrics.totalUsers}</div>
              <p className="text-[10px] text-slate-500 mt-1">Synced to database nodes</p>
            </div>

            <div className="p-4 bg-[#1a1d27] border border-[#2d3148] rounded-xl">
              <div className="flex justify-between items-center text-slate-500 text-[10px] uppercase font-bold font-mono tracking-wider">
                <span>Active Live Sessions</span>
                <Radio className="h-4.5 w-4.5 text-emerald-400 animate-pulse" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-200 mt-2">{metrics.activeSessionsCount}</div>
              <p className="text-[10px] text-emerald-500 mt-1">Online last 5 minutes</p>
            </div>

            <div className="p-4 bg-[#1a1d27] border border-[#2d3148] rounded-xl">
              <div className="flex justify-between items-center text-slate-500 text-[10px] uppercase font-bold font-mono tracking-wider">
                <span>Searches Performed</span>
                <TrendingUp className="h-4.5 w-4.5 text-blue-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-200 mt-2">{metrics.searchesToday}</div>
              <p className="text-[10px] text-slate-500 mt-1">Aggregations requested today</p>
            </div>

            <div className="p-4 bg-[#1a1d27] border border-[#2d3148] rounded-xl">
              <div className="flex justify-between items-center text-slate-500 text-[10px] uppercase font-bold font-mono tracking-wider">
                <span>Sponsor Campaign Ads</span>
                <Layers className="h-4.5 w-4.5 text-purple-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-200 mt-2">{metrics.totalAdvertisements}</div>
              <p className="text-[10px] text-slate-500 mt-1">Impressions live delivery</p>
            </div>
          </div>

          {/* Graphical visualization with Recharts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 select-none">
            {/* Timeline searches */}
            <div className="p-5 bg-[#1a1d27] border border-[#2d3148] rounded-xl space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Searches Last 7 Days</h3>
              <div className="h-56 md:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={searchesTimeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2D3148" opacity={0.3} />
                    <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#1A1D27', borderColor: '#2D3148', borderRadius: '12px', fontSize: '12px', color: '#E2E8F0' }} />
                    <Line type="monotone" dataKey="count" stroke="#6366F1" strokeWidth={3} dot={{ fill: '#6366F1' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Terminology searches */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Frequently Queried Concepts</h3>
              <div className="h-56 md:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topSearchedTopics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2D3148" opacity={0.3} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#1A1D27', borderColor: '#2D3148', borderRadius: '12px' }} />
                    <Bar dataKey="count" fill="#10B981" radius={[8, 8, 0, 0]}>
                      {topSearchedTopics.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#6366F1' : '#10B981'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Sessions Logs Table lists */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Realtime sessions */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 select-none">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Handshakes (Live Status)</h3>
              <div className="space-y-2 overflow-y-auto max-h-[220px]">
                {activeSessions.map(sess => (
                  <div key={sess.id} className="flex justify-between items-center text-xs p-2.5 bg-slate-950 border border-slate-850 rounded-xl">
                    <div className="space-y-1">
                      <div className="font-semibold text-slate-200 truncate max-w-[200px]">{sess.username || 'Guest session'}</div>
                      <div className="font-mono text-[9px] text-slate-500">{sess.ip_address} | {sess.page}</div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 capitalize bg-emerald-950 px-2 py-0.5 rounded border border-emerald-900/40 animate-pulse">Live</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent queries log */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 select-none">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Searches Audit logs</h3>
              <div className="space-y-2 overflow-y-auto max-h-[220px]">
                {recentSearches.map(log => (
                  <div key={log.id} className="flex justify-between items-center text-xs p-2.5 bg-slate-950 border border-slate-850 rounded-xl">
                    <div className="space-y-1">
                      <div className="font-bold text-slate-200">"{log.query}"</div>
                      <div className="text-[10px] text-slate-500">By {log.username} • {new Date(log.created_at).toLocaleTimeString()}</div>
                    </div>
                    <span className="text-[9px] font-mono text-slate-500">{log.ip_address}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/*                  TAB 2: USER CONTROLS MANAGER             */}
      {/* ========================================================= */}
      {adminTab === 'users' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 overflow-hidden">
          <h3 className="text-sm font-bold text-slate-200 mb-4 select-none">Indexed User directory ({users.length})</h3>
          
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 font-bold select-none uppercase tracking-wider font-mono">
                  <th className="py-3 px-2">Username</th>
                  <th className="py-3 px-2">Email</th>
                  <th className="py-3 px-2">Access Role</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2">Joined Date</th>
                  <th className="py-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-950/20">
                    <td className="py-3 px-2 font-semibold text-slate-300">{u.username}</td>
                    <td className="py-3 px-2 text-slate-400 font-mono">{u.email}</td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${u.role === 'admin' ? 'bg-indigo-950 text-indigo-400 border border-indigo-900' : 'bg-slate-800 text-slate-400'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                       <span className={`flex items-center gap-1.5 text-[11px] ${u.is_banned ? 'text-red-400 font-semibold' : 'text-emerald-400 font-semibold'}`}>
                         <span className={`h-2 w-2 rounded-full ${u.is_banned ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                         {u.is_banned ? 'Suspended' : 'Active status'}
                       </span>
                    </td>
                    <td className="py-3 px-2 text-slate-500">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-2 text-right">
                      <div className="flex items-center justify-end gap-1.5 text-slate-400">
                        {/* Ban toggler */}
                        <button 
                          onClick={() => toggleUserBan(u.id, !!u.is_banned)}
                          title={u.is_banned ? "Unban user account" : "Suspend user account"}
                          className="p-1.5 rounded hover:bg-slate-800 hover:text-white cursor-pointer"
                        >
                          <Ban className={`h-4 w-4 ${u.is_banned ? 'text-emerald-400' : 'text-red-400'}`} />
                        </button>
                        {/* Eraser */}
                        <button 
                          onClick={() => deleteUser(u.id)}
                          title="Erase user database logs"
                          className="p-1.5 rounded hover:bg-slate-800 hover:text-red-400 cursor-pointer"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/*                  TAB 3: SPONSORS ADS MANAGEMENTS          */}
      {/* ========================================================= */}
      {adminTab === 'ads' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          
          {/* Deploy Ad Form */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 select-none">Deploy Ad Campaign</h3>
            <form onSubmit={createAd} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Campaign Banner Title</label>
                <input 
                  type="text"
                  placeholder="e.g. Upgrade to Notesdra Gold"
                  value={newAd.title}
                  onChange={(e) => setNewAd(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Asset Image URL</label>
                <input 
                  type="text"
                  placeholder="e.g. https://images.unsplash.com/..."
                  value={newAd.image_url}
                  onChange={(e) => setNewAd(prev => ({ ...prev, image_url: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Destination Redirect URL</label>
                <input 
                  type="text"
                  placeholder="e.g. https://google.com"
                  value={newAd.target_url}
                  onChange={(e) => setNewAd(prev => ({ ...prev, target_url: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-500 ::outline-none uppercase font-bold">Placement Zone</label>
                <select 
                  value={newAd.placement_zone}
                  onChange={(e: any) => setNewAd(prev => ({ ...prev, placement_zone: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-850 text-slate-300 text-xs rounded-xl px-3 py-2 outline-none font-bold cursor-pointer"
                >
                  <option value="header">Header Banner Space</option>
                  <option value="sidebar">Sidebar Widget Area</option>
                  <option value="inline">Inline Post Card</option>
                  <option value="footer">Footer Banner Area</option>
                </select>
              </div>

              <button 
                type="submit" 
                className="w-full py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold cursor-pointer shadow transition"
              >
                Assemble Sponsor Banner
              </button>
            </form>
          </div>

          {/* Active Campaigns list details */}
          <div className="xl:col-span-2 p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 select-none">Active sponsor tracks</h3>
            
            <div className="space-y-4 max-h-[480px] overflow-y-auto">
              {ads.map(adItem => (
                <div key={adItem.id} className="p-4 bg-slate-950 border border-slate-850 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 select-none">
                  <div className="flex items-center gap-3">
                    <img 
                      src={adItem.image_url} 
                      alt={adItem.title} 
                      className="w-14 h-14 rounded-lg object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h4 className="text-slate-200 font-bold text-xs truncate max-w-[200px]">{adItem.title}</h4>
                      <p className="text-[9px] text-slate-500 tracking-wider font-mono mt-1 uppercase">Zone: {adItem.placement_zone}</p>
                    </div>
                  </div>

                  {/* Impression trackers */}
                  <div className="grid grid-cols-2 gap-4 text-center font-mono">
                    <div className="px-3 py-1 bg-slate-900 rounded border border-slate-800">
                      <div className="text-[8px] text-slate-500 font-bold">Impressions</div>
                      <div className="text-xs font-bold text-slate-300 mt-0.5">{adItem.impression_count}</div>
                    </div>
                    <div className="px-3 py-1 bg-slate-900 rounded border border-slate-800">
                      <div className="text-[8px] text-slate-500 font-bold">Clicks</div>
                      <div className="text-xs font-bold text-slate-300 mt-0.5">{adItem.click_count}</div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => toggleAdActive(adItem.id, adItem.is_active)}
                      className={`p-1 text-xs font-bold ${adItem.is_active ? 'text-indigo-400' : 'text-slate-600'} cursor-pointer`}
                      title="Toggle active inactive status"
                    >
                      {adItem.is_active ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
                    </button>
                    <button 
                      onClick={() => deleteAd(adItem.id)}
                      className="p-1 text-slate-500 hover:text-red-400 cursor-pointer"
                    >
                      <Trash className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/*                  TAB 4: BLOG PUBLISHER CREATOR            */}
      {/* ========================================================= */}
      {adminTab === 'blog' && (
        <form onSubmit={createBlog} className="max-w-3xl mx-auto p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 select-none">Publish rich article analysis</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Article heading title</label>
              <input 
                type="text"
                placeholder="e.g. Advanced Git Command parameters"
                value={newBlog.title}
                onChange={(e) => setNewBlog(prev => ({ ...prev, title: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Cover image (URL)</label>
              <input 
                type="text"
                placeholder="e.g. https://images.unsplash.com/..."
                value={newBlog.cover_image_url}
                onChange={(e) => setNewBlog(prev => ({ ...prev, cover_image_url: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Tag classifications (comma separated)</label>
            <input 
              type="text"
              placeholder="e.g. Frontend, CSS, WebDev"
              value={newBlog.tags}
              onChange={(e) => setNewBlog(prev => ({ ...prev, tags: e.target.value }))}
              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Semantic HTML content body</label>
            <textarea 
              rows={8}
              value={newBlog.content}
              onChange={(e) => setNewBlog(prev => ({ ...prev, content: e.target.value }))}
              placeholder="<h2>My semantic heading</h2><p>Provide content paragraphs, pre block layout tags, lists...</p>"
              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none font-mono resize-y"
            />
          </div>

          <button 
            type="submit" 
            className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold cursor-pointer shadow transition"
          >
            Deploy Draft to Live Feed
          </button>
        </form>
      )}

      {/* ========================================================= */}
      {/*                  TAB 5: CURATED AI DIRECTORY EDITOR        */}
      {/* ========================================================= */}
      {adminTab === 'ai-tools' && (
        <form onSubmit={createTool} className="max-w-2xl mx-auto p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 select-none">Integrate Curated AI Tool</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Tool Brand Name</label>
              <input 
                type="text"
                placeholder="e.g. Claude 3"
                value={newTool.name}
                onChange={(e) => setNewTool(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Website Landing URL</label>
              <input 
                type="text"
                placeholder="e.g. https://claude.ai"
                value={newTool.website_url}
                onChange={(e) => setNewTool(prev => ({ ...prev, website_url: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Category Badge</label>
              <select 
                value={newTool.category}
                onChange={(e: any) => setNewTool(prev => ({ ...prev, category: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-850 text-slate-300 text-xs rounded-xl px-3 py-2 outline-none font-bold cursor-pointer"
              >
                <option value="writing">Writing Assisters</option>
                <option value="coding">Coding & Compilers</option>
                <option value="image">Image Creators</option>
                <option value="video">Motion Video Creators</option>
                <option value="audio">Voice Sound design</option>
                <option value="research">Academic studies</option>
                <option value="productivity">General productivity</option>
                <option value="other">Other Spaces</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Logo/Icon URL</label>
              <input 
                type="text"
                placeholder="Leave blank for automatic placeholder icon"
                value={newTool.logo_url}
                onChange={(e) => setNewTool(prev => ({ ...prev, logo_url: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Summary Description phrase (2-3 lines)</label>
            <textarea 
              rows={2}
              value={newTool.description}
              onChange={(e) => setNewTool(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the target capabilities of this model..."
              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Free Tier Details (parameters limits)</label>
            <input 
              type="text"
              placeholder="e.g. 10 free credits daily refreshed"
              value={newTool.free_tier_details}
              onChange={(e) => setNewTool(prev => ({ ...prev, free_tier_details: e.target.value }))}
              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-2 select-none">
            <input 
              type="checkbox"
              id="is_featured"
              checked={newTool.is_featured}
              onChange={(e) => setNewTool(prev => ({ ...prev, is_featured: e.target.checked }))}
              className="rounded text-indigo-500 outline-none mr-1.5 focus:ring-0 cursor-pointer h-4 w-4 bg-slate-950 border border-slate-800"
            />
            <label htmlFor="is_featured" className="text-xs text-slate-450 font-semibold cursor-pointer">Mark as prominently featured on main cards list</label>
          </div>

          <button 
            type="submit" 
            className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold cursor-pointer shadow transition"
          >
            Deploy Curated AI Tool
          </button>
        </form>
      )}
    </div>
  );
}
