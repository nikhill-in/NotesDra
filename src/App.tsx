import React, { useState, useEffect } from 'react';
import { User } from './types';
import SearchView from './views/SearchView';
import IDEView from './views/IDEView';
import ConverterView from './views/ConverterView';
import BlogView from './views/BlogView';
import AIDirectoryView from './views/AIDirectoryView';
import AdminView from './views/AdminView';

import { 
  Search, Code, ArrowRightLeft, Sparkles, BookOpen, Shield, LogIn, LogOut, 
  Menu, X, Sun, Moon, AlertOctagon, CornerDownRight, Check, Heart, User as UserIcon, Activity
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'search' | 'ide' | 'converter' | 'blog' | 'ai-tools' | 'admin'>('search');
  const [user, setUser] = useState<User | null>(null);
  
  // UI States
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Auth Form State
  const [authEmail, setAuthEmail] = useState('');
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // Spot Search Dialog
  const [showShortcutSearch, setShowShortcutSearch] = useState(false);
  const [shortcutQuery, setShortcutQuery] = useState('');

  // Fetch logged in session on mount
  useEffect(() => {
    checkLoggedInSession();
    
    // Add hotkey listeners for Ctrl+K search shortcut setup
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowShortcutSearch(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const checkLoggedInSession = () => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(payload => {
        if (payload.success && payload.data) {
          setUser(payload.data);
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null));
  };

  const handleLogout = () => {
    fetch('/api/auth/logout', { method: 'POST' })
      .then(() => {
        setUser(null);
        if (activeTab === 'admin') {
          setActiveTab('search');
        }
      });
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (!authEmail || !authPassword || (authMode === 'register' && !authUsername)) {
      setAuthError('Please fill in code credentials parameters completely.');
      return;
    }

    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload = authMode === 'login' 
      ? { email: authEmail, password: authPassword }
      : { email: authEmail, password: authPassword, username: authUsername };

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(result => {
        if (result.success && result.data) {
          setAuthSuccess(authMode === 'login' ? 'Identified successfully!' : 'Registration complete! Logging you in...');
          setUser(result.data);
          
          setTimeout(() => {
            setShowAuthModal(false);
            setAuthEmail('');
            setAuthUsername('');
            setAuthPassword('');
            setAuthSuccess('');
            setAuthError('');
          }, 1500);
        } else {
          setAuthError(result.message || 'Authentication mapping rejected.');
        }
      })
      .catch(() => {
        setAuthError('Connection rejected or error on compilation.');
      });
  };

  const triggerAuthTrigger = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setAuthError('');
    setAuthSuccess('');
    setShowAuthModal(true);
  };

  const handleShortcutSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (shortcutQuery.trim()) {
      setActiveTab('search');
      setShowShortcutSearch(false);
      
      // Update Search view input query manually
      const containerElem = document.getElementById('search-view-container');
      if (containerElem) {
        const inputElem = containerElem.querySelector('input');
        const buttonElem = containerElem.querySelector('button[type="submit"]');
        if (inputElem && buttonElem) {
          (inputElem as HTMLInputElement).value = shortcutQuery;
          // Trigger form submission manually
          const formElem = inputElem.closest('form');
          if (formElem) {
            formElem.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
          }
        }
      }
      setShortcutQuery('');
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1117] text-[#e2e8f0] font-sans flex flex-col antialiased selection:bg-indigo-500/30">
      
      {/* ========================================================= */}
      {/*                      TOP NAVBAR HEADER                    */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-40 bg-[#0f1117]/80 backdrop-blur-md border-b border-[#2d3148] px-4 md:px-8 h-16 flex items-center justify-between select-none shadow-none">
        {/* Leading layout title brand */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 hover:bg-[#1a1d27] border border-transparent hover:border-[#2d3148] rounded-xl transition cursor-pointer md:hidden text-slate-400"
          >
            {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('search')}>
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20 font-display">
              N
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 font-display leading-none">
                NOTESDRA
              </span>
              <span className="text-[8px] text-[#6366f1] font-bold block leading-none font-mono tracking-widest uppercase mt-0.5">
                AGGREGATE HUB
              </span>
            </div>
          </div>
        </div>

        {/* Global Instant Search Bar shortcut trigger (Ctrl+K visual CTA) */}
        <div 
          onClick={() => setShowShortcutSearch(true)}
          className="hidden md:flex items-center gap-3 px-4 py-2 bg-[#1a1d27] border border-[#2d3148] hover:border-indigo-500/40 rounded-full max-w-sm w-72 text-left cursor-pointer transition-all duration-200"
        >
          <Search className="h-4 w-4 text-slate-500" />
          <span className="text-slate-500 text-sm flex-grow font-medium">Concept aggregates shortcut...</span>
          <kbd className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700 font-mono">
            ⌘ K
          </kbd>
        </div>

        {/* User login / register session drawer + Live Indicator */}
        <div className="flex items-center gap-4">
          {/* Live System Indicator */}
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
            <span className="text-[11px] text-emerald-500 font-bold uppercase tracking-tight font-mono">API Live</span>
          </div>

          <span className="h-4 w-[1px] bg-[#2d3148] hidden sm:inline"></span>

          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-200">{user.username}</span>
                <span className="text-[9px] text-[#818cf8] font-bold uppercase tracking-wider font-mono">
                  {user.role} profile
                </span>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center border-2 border-indigo-500/30 shadow-md">
                <span className="text-xs font-bold text-white leading-none">
                  {user.username.substring(0, 2).toUpperCase()}
                </span>
              </div>
              <button 
                onClick={handleLogout}
                title="Log out session"
                className="p-2 bg-[#1a1d27] border border-[#2d3148] hover:border-red-500/40 hover:text-red-400 rounded-xl cursor-pointer transition shadow"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => triggerAuthTrigger('login')}
                className="px-3.5 py-1.5 hover:bg-[#1a1d27] border border-transparent hover:border-[#2d3148] text-slate-300 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer"
              >
                Sign In
              </button>
              <button 
                onClick={() => triggerAuthTrigger('register')}
                className="px-4 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs sm:text-sm font-semibold cursor-pointer shadow-lg shadow-indigo-500/20 transition"
              >
                Join
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ========================================================= */}
      {/*                 CONTENT LAYER: SIDEBAR + VIEW             */}
      {/* ========================================================= */}
      <div className="flex-grow flex relative">
        
        {/* Navigation Sidebar Drawer */}
        <aside className={`
          fixed md:sticky top-16 md:top-0 h-[calc(100vh-64px)] z-30
          w-64 bg-[#1a1d27] border-r border-[#2d3148] p-4 shrink-0
          transition-transform duration-300 overflow-y-auto select-none
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-16'}
        `}>
          <div className="space-y-6">
            
            {/* Sections lists */}
            <div className="space-y-1.5">
              <div className={`text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-4 ml-2 ${!isSidebarOpen && 'md:hidden'}`}>
                Core Modules
              </div>
              
              <button 
                onClick={() => setActiveTab('search')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition cursor-pointer ${activeTab === 'search' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-[#8a99ad] hover:bg-slate-800 hover:text-white'}`}
              >
                <Search className="h-4 w-4 shrink-0" />
                <span className={`${!isSidebarOpen && 'md:hidden'}`}>Search Engine</span>
              </button>

              <button 
                onClick={() => setActiveTab('ide')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition cursor-pointer ${activeTab === 'ide' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-[#8a99ad] hover:bg-slate-800 hover:text-white'}`}
              >
                <Code className="h-4 w-4 shrink-0" />
                <span className={`${!isSidebarOpen && 'md:hidden'}`}>Code Workspace</span>
              </button>

              <button 
                onClick={() => setActiveTab('converter')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition cursor-pointer ${activeTab === 'converter' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-[#8a99ad] hover:bg-slate-800 hover:text-white'}`}
              >
                <ArrowRightLeft className="h-4 w-4 shrink-0" />
                <span className={`${!isSidebarOpen && 'md:hidden'}`}>File Converter</span>
              </button>
            </div>

            {/* Educational modules */}
            <div className="space-y-1.5">
              <div className={`text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-4 ml-2 ${!isSidebarOpen && 'md:hidden'}`}>
                Community
              </div>

              <button 
                onClick={() => setActiveTab('blog')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition cursor-pointer ${activeTab === 'blog' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-[#8a99ad] hover:bg-slate-800 hover:text-white'}`}
              >
                <BookOpen className="h-4 w-4 shrink-0" />
                <span className={`${!isSidebarOpen && 'md:hidden'}`}>Tech Blog</span>
              </button>

              <button 
                onClick={() => setActiveTab('ai-tools')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition cursor-pointer ${activeTab === 'ai-tools' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-[#8a99ad] hover:bg-slate-800 hover:text-white'}`}
              >
                <Sparkles className="h-4 w-4 shrink-0" />
                <span className={`${!isSidebarOpen && 'md:hidden'}`}>AI Directory</span>
              </button>
            </div>

            {/* Administrations Controls (visible to admins only) */}
            {user && user.role === 'admin' && (
              <div className="space-y-1.5 border-t border-[#2d3148] pt-4">
                <div className={`text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-4 ml-2 ${!isSidebarOpen && 'md:hidden'}`}>
                  Staff Admin
                </div>

                <button 
                  onClick={() => setActiveTab('admin')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition cursor-pointer ${activeTab === 'admin' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'text-rose-400/80 hover:bg-slate-800 hover:text-rose-300'}`}
                >
                  <Shield className="h-4 w-4 shrink-0 text-rose-400" />
                  <span className={`${!isSidebarOpen && 'md:hidden'}`}>Admin Console</span>
                </button>
              </div>
            )}
          </div>

          {/* Simple Decorative Mini Badge at Sidebar bottom */}
          <div className="absolute bottom-4 left-4 right-4 b-sticky">
            <div className={`bg-[#242938] rounded-xl p-3 flex items-center gap-3 ${!isSidebarOpen && 'md:hidden'}`}>
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center border-2 border-indigo-500/30">
                <span className="text-[10px] font-bold">JD</span>
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-semibold truncate text-[#e2e8f0]">Sandbox User</p>
                <p className="text-[9px] text-[#818cf8] uppercase tracking-wide font-mono">Pro Active</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Primary View content space wrapper with footer integrated */}
        <div className="flex-grow flex flex-col justify-between min-h-[calc(100vh-64px)] overflow-x-hidden">
          <main className="flex-grow p-4 md:p-6 lg:p-8">
            
            {activeTab === 'search' && (
              <SearchView user={user} onOpenAuth={() => triggerAuthTrigger('login')} />
            )}

            {activeTab === 'ide' && (
              <IDEView user={user} />
            )}

            {activeTab === 'converter' && (
              <ConverterView user={user} />
            )}

            {activeTab === 'blog' && (
              <BlogView user={user} onOpenAuth={() => triggerAuthTrigger('login')} />
            )}

            {activeTab === 'ai-tools' && (
              <AIDirectoryView />
            )}

            {activeTab === 'admin' && user?.role === 'admin' && (
              <AdminView />
            )}
          </main>

          {/* Bottom Activity Rail */}
          <footer className="h-10 border-t border-[#2d3148] bg-[#0f1117] px-6 flex items-center justify-between select-none shrink-0">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold font-mono">CPU:</span>
                <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="w-[42%] h-full bg-indigo-500"></div>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold font-mono">Cache:</span>
                <span className="text-[10px] text-emerald-400 font-mono">HITS (89%)</span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-[10px] text-slate-500 font-mono">
              <span>v2.0.4-stable</span>
              <span className="text-slate-700">|</span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
                System Optimal
              </span>
            </div>
          </footer>
        </div>
      </div>

      {/* ========================================================= */}
      {/*               MODAL PANEL 1: AUTH SIGNIN/REGISTER         */}
      {/* ========================================================= */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* backdrop */}
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowAuthModal(false)}></div>
          
          {/* Card wrapper */}
          <div className="relative bg-[#1a1d27] border border-[#2d3148] rounded-3xl p-6 w-full max-w-md shadow-2xl animate-fade-in">
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-800 text-slate-400"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="text-xl font-display font-medium text-slate-100 select-none">
              {authMode === 'login' ? 'Welcome back! Join aggregate' : 'Create Sandbox Access Profiles'}
            </h2>
            <p className="text-slate-400 text-xs mt-1">
              {authMode === 'login' ? 'Unlock persistent codes history, 8 documentation sources, and nested community commentaries.' : 'Create credentials parameters. Instant activation.'}
            </p>

            {/* Error alerts */}
            {authError && (
              <div className="mt-4 p-3 bg-red-950/20 border border-red-900/50 rounded-xl text-xs text-red-400 flex items-center gap-2">
                <AlertOctagon className="h-4.5 w-4.5 text-red-500 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {/* Success alert */}
            {authSuccess && (
              <div className="mt-4 p-3 bg-emerald-950/20 border border-emerald-950/50 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
                <Check className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                <span>{authSuccess}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleAuthSubmit} className="mt-5 space-y-4">
              {authMode === 'register' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Input Username</label>
                  <input 
                    type="text" 
                    placeholder="e.g. MasterCoder"
                    value={authUsername}
                    onChange={(e) => setAuthUsername(e.target.value)}
                    className="w-full bg-[#0b0c10] border border-[#2d3148] rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Address Email</label>
                <input 
                  type="email" 
                  placeholder="e.g. programmer@notesdra.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full bg-[#0b0c10] border border-[#2d3148] rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Secret Password</label>
                <input 
                  type="password" 
                  placeholder="Minimum 6 characters parameters"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full bg-[#0b0c10] border border-[#2d3148] rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition"
              >
                {authMode === 'login' ? 'Engage Sandbox Profile' : 'Authorize Account Registration'}
              </button>
            </form>

            {/* Hint login switcher */}
            <div className="mt-5 border-t border-slate-800 pt-4 text-center">
              {authMode === 'login' ? (
                <span className="text-xs text-slate-500">
                  New programmer? <strong onClick={() => setAuthMode('register')} className="text-indigo-400 hover:underline cursor-pointer">Register Code Account</strong>
                </span>
              ) : (
                <span className="text-xs text-slate-500">
                  Already registered? <strong onClick={() => setAuthMode('login')} className="text-indigo-400 hover:underline cursor-pointer">Sign In now</strong>
                </span>
              )}
            </div>

            {/* Inline Admin bypass hint display */}
            <div className="mt-4 p-2.5 bg-indigo-950/20 rounded-xl border border-indigo-900/30 text-[10px] text-slate-400 leading-normal">
              <strong>Admin Staff Account Bypass:</strong><br />
              Email: <span className="font-mono text-indigo-400">admin@notesdra.com</span><br />
              Password: <span className="font-mono text-indigo-400">admin123</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/*               MODAL PANEL 2: SPOT CTRL+K DIALOG           */}
      {/* ========================================================= */}
      {showShortcutSearch && (
        <div className="fixed inset-0 z-50 flex justify-center pt-24 px-4 select-none">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs" onClick={() => setShowShortcutSearch(false)}></div>
          
          {/* Dialog Container */}
          <form 
            onSubmit={handleShortcutSearchSubmit}
            className="relative bg-[#141722] border border-[#2d3148] rounded-2xl p-3 w-full max-w-xl shadow-2xl h-14 flex items-center gap-3 animate-fade-in"
          >
            <Search className="h-5 w-5 text-slate-500 shrink-0" />
            <input 
              type="text" 
              placeholder="Search concepts, grids, arrays, commands..."
              value={shortcutQuery}
              onChange={(e) => setShortcutQuery(e.target.value)}
              className="w-full bg-transparent border-0 outline-none text-xs md:text-sm text-slate-200 placeholder-slate-500"
              autoFocus
            />
            <button 
              type="submit" 
              className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-[10px] font-bold uppercase cursor-pointer"
            >
              Go
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
