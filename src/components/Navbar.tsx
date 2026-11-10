import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useSpoilers } from '../context/SpoilerContext.tsx';
import {
  Flame,
  Shield,
  Swords,
  Users,
  Eye,
  EyeOff,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  Compass,
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, params?: Record<string, string>) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate }) => {
  const { user, logout, openAuthModal } = useAuth();
  const { spoilersEnabled, toggleSpoilers } = useSpoilers();
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState<boolean>(false);

  const navItems = [
    { id: 'home', label: 'Command Center', icon: Flame },
    { id: 'strikers', label: 'Scout Hub', icon: Compass },
    { id: 'compare', label: 'Ego Duel', icon: Swords },
    { id: 'builder', label: 'Squad & Tiers', icon: Users },
  ];

  const handleNav = (viewId: string) => {
    onNavigate(viewId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-xl border-b border-cyan-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div
            onClick={() => handleNav('home')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-slate-950 font-black font-heading shadow-md glow-cyan-sm group-hover:scale-105 transition-transform">
              BL
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-heading font-black text-lg tracking-wider text-slate-100 group-hover:text-cyan-400 transition-colors">
                  BLUE LOCK
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
                  NEL
                </span>
              </div>
              <span className="text-[10px] font-mono uppercase text-slate-400 tracking-widest block leading-tight">
                Egoist Scout Hub
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 glow-cyan-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Toolbar: Global Spoiler Shield & User Profile */}
          <div className="hidden md:flex items-center gap-3">
            {/* Global Spoiler Shield Toggle */}
            <button
              onClick={toggleSpoilers}
              className={`px-3 py-1.5 rounded-xl border text-xs font-mono flex items-center gap-2 transition-all cursor-pointer ${
                spoilersEnabled
                  ? 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
                  : 'bg-rose-950/40 border-rose-500/50 text-rose-300 glow-crimson'
              }`}
              title={spoilersEnabled ? 'Spoilers are visible. Click to hide.' : 'Spoiler Shield active! Manga twists protected.'}
            >
              {spoilersEnabled ? (
                <>
                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Spoilers: <strong className="text-cyan-300">ON</strong></span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-rose-400" />
                  <span>Shield: <strong className="text-rose-400">ACTIVE</strong></span>
                </>
              )}
            </button>

            {/* User Session */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 pr-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 transition-colors"
                >
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="w-7 h-7 rounded-lg object-cover border border-cyan-400/50"
                  />
                  <div className="text-left">
                    <span className="text-xs font-bold text-slate-200 block leading-tight">
                      {user.username}
                    </span>
                    <span className="text-[9px] font-mono text-cyan-400 uppercase leading-none block">
                      {user.role}
                    </span>
                  </div>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-2 animate-fade-in z-50">
                    <div className="px-3 py-2 border-b border-slate-800 text-xs">
                      <div className="font-bold text-slate-200">{user.username}</div>
                      <div className="text-slate-400 truncate text-[11px] font-mono">{user.email}</div>
                    </div>
                    <button
                      onClick={() => {
                        handleNav('builder');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2 mt-1"
                    >
                      <Users className="w-3.5 h-3.5 text-cyan-400" /> My Saved Formations
                    </button>
                    <button
                      onClick={() => {
                        logout();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 mt-1"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Log Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => openAuthModal()}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-heading text-xs uppercase tracking-wider glow-cyan-sm transition-all"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleSpoilers}
              className="p-2 rounded-lg bg-slate-900 text-slate-300 border border-slate-800"
              title="Toggle Spoilers"
            >
              {spoilersEnabled ? <Eye className="w-4 h-4 text-cyan-400" /> : <EyeOff className="w-4 h-4 text-rose-400" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-900 text-slate-300 border border-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950 px-4 pt-3 pb-5 space-y-2 animate-fade-in">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full px-4 py-2.5 rounded-xl text-left text-xs font-heading font-bold uppercase tracking-wider flex items-center gap-3 ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-4 h-4 text-cyan-400" />
                {item.label}
              </button>
            );
          })}

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            {user ? (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <img src={user.avatar} alt={user.username} className="w-7 h-7 rounded-lg" />
                  <span className="text-xs font-bold text-slate-200">{user.username}</span>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs text-rose-400 font-mono"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  openAuthModal();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold font-heading text-xs uppercase"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
