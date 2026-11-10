import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { X, UserCheck, KeyRound, Sparkles, AlertCircle } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, login, register, authPromptMessage } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (mode === 'login') {
        const identifier = email || username;
        if (!identifier.trim()) {
          setError('Please provide your username or email');
          setSubmitting(false);
          return;
        }
        const res = await login(identifier.trim());
        if (!res.success) {
          setError(res.message || 'Invalid credentials or user not found');
        }
      } else {
        if (!username.trim() || !email.trim()) {
          setError('Both username and email are required');
          setSubmitting(false);
          return;
        }
        const res = await register(username.trim(), email.trim());
        if (!res.success) {
          setError(res.message || 'Registration failed. Email may already be registered.');
        }
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setError('');
    setSubmitting(true);
    await login('egoist@bluelock.jp');
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-cyan-500/50 rounded-2xl p-6 shadow-2xl glow-cyan">
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-400/30 text-cyan-400 mb-3 glow-cyan-sm">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold font-heading text-slate-100 tracking-wider">
            {mode === 'login' ? 'EGOIST VERIFICATION' : 'ENROLL IN BLUE LOCK'}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            {authPromptMessage || 'Authenticate to persist tactical notes, custom lineups, and tier lists.'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 font-heading">
                Egoist Handle / Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. Kaiser_Striker_10"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 font-heading">
              {mode === 'login' ? 'Username or Email' : 'Email Address'}
            </label>
            <input
              type={mode === 'register' ? 'email' : 'text'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={mode === 'login' ? 'egoist@bluelock.jp or Isagi_Egoist' : 'striker@bluelock.jp'}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm tracking-wider uppercase font-heading transition-all glow-cyan-sm cursor-pointer disabled:opacity-50"
          >
            {submitting ? 'Authenticating...' : mode === 'login' ? 'Enter Command Center' : 'Register Striker'}
          </button>
        </form>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase font-mono">
            <span className="bg-slate-900 px-3 text-slate-500">Fast Demo Access</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleQuickDemoLogin}
          className="w-full py-2.5 rounded-xl border border-cyan-500/30 hover:border-cyan-400/70 bg-cyan-950/30 hover:bg-cyan-950/60 text-cyan-300 text-xs font-semibold tracking-wider flex items-center justify-center gap-2 transition-all font-heading"
        >
          <Sparkles className="w-4 h-4 text-cyan-400" />
          Instant Sign In as Demo Egoist (Isagi_Egoist)
        </button>

        <div className="mt-4 text-center">
          {mode === 'login' ? (
            <p className="text-xs text-slate-400">
              New recruit?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError('');
                }}
                className="text-cyan-400 hover:underline font-semibold font-mono"
              >
                Create an Egoist account
              </button>
            </p>
          ) : (
            <p className="text-xs text-slate-400">
              Already enrolled?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className="text-cyan-400 hover:underline font-semibold font-mono"
              >
                Log in here
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
