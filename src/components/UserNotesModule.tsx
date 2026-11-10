import React, { useState, useEffect, useCallback } from 'react';
import { UserNote } from '../types.ts';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Edit3, Trash2, Plus, Check, X, ShieldAlert, Sparkles, MessageSquare } from 'lucide-react';

interface UserNotesModuleProps {
  playerId: string;
  playerName: string;
}

export const UserNotesModule: React.FC<UserNotesModuleProps> = ({ playerId, playerName }) => {
  const { user, openAuthModal } = useAuth();
  const [notes, setNotes] = useState<UserNote[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [newNoteText, setNewNoteText] = useState<string>('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const loadNotes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getNotes(playerId);
      setNotes(data);
    } catch {
      setErrorMsg('Failed to load scout notes');
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal('Sign in to record personal tactical scout notes on this striker.');
      return;
    }
    if (!newNoteText.trim()) return;

    try {
      setErrorMsg('');
      const created = await api.createNote({
        player_id: playerId,
        note: newNoteText.trim(),
        user_id: user.id,
        username: user.username,
      });
      setNotes([created, ...notes]);
      setNewNoteText('');
      setSuccessMsg('Tactical note recorded to database!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save note';
      setErrorMsg(message);
    }
  };

  const handleStartEdit = (n: UserNote) => {
    setEditingNoteId(n.id);
    setEditingText(n.note);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editingText.trim()) return;
    try {
      setErrorMsg('');
      const updated = await api.updateNote(id, editingText.trim());
      setNotes(notes.map((n) => (n.id === id ? updated : n)));
      setEditingNoteId(null);
      setSuccessMsg('Note updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update note';
      setErrorMsg(message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tactical note?')) return;
    try {
      const ok = await api.deleteNote(id);
      if (ok) {
        setNotes(notes.filter((n) => n.id !== id));
        setSuccessMsg('Note deleted from database.');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch {
      setErrorMsg('Failed to delete note');
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 md:p-6 backdrop-blur-md">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold font-heading text-slate-100 flex items-center gap-2">
              SCOUT DOSSIER & PERSONAL NOTES
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
                {notes.length} {notes.length === 1 ? 'Entry' : 'Entries'}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              CRUD tactical observations, counter-strategies, and weakness logs for {playerName}.
            </p>
          </div>
        </div>

        {!user && (
          <button
            onClick={() => openAuthModal('Sign in to create, edit, and persist scout notes.')}
            className="text-xs px-3 py-1.5 rounded-lg border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10 transition-colors font-mono"
          >
            Sign In to Add Notes
          </button>
        )}
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Create Note Input */}
      <form onSubmit={handleCreateNote} className="mb-6">
        <div className="relative">
          <textarea
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            placeholder={
              user
                ? `Log tactical observation on ${playerName}... (e.g. Tendency to feint left, optimal pressing angle)`
                : `Sign in to record tactical notes on ${playerName}...`
            }
            rows={3}
            className="w-full bg-slate-950/90 border border-slate-700/80 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all resize-none"
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-[11px] text-slate-500 font-mono">
              Persisted across sessions & refreshes
            </span>
            <button
              type="submit"
              disabled={!newNoteText.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:hover:bg-cyan-500 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all font-heading glow-cyan-sm cursor-pointer disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Save Note
            </button>
          </div>
        </div>
      </form>

      {/* List of notes */}
      {loading ? (
        <div className="py-6 text-center text-xs text-slate-400 font-mono animate-pulse">
          Accessing Blue Lock Database...
        </div>
      ) : notes.length === 0 ? (
        <div className="py-8 text-center rounded-xl border border-dashed border-slate-800 bg-slate-950/40">
          <p className="text-sm text-slate-400 font-heading">No scout notes recorded yet for {playerName}.</p>
          <p className="text-xs text-slate-500 mt-1">Be the first egoist to analyze their weapon mechanics.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => {
            const isOwner = user?.id === note.user_id;
            const isEditing = editingNoteId === note.id;

            return (
              <div
                key={note.id}
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="text-xs font-bold text-cyan-300 font-mono">
                      {note.username}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(note.created_at).toLocaleDateString()} at{' '}
                      {new Date(note.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {isOwner && !isEditing && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEdit(note)}
                        title="Edit Note"
                        className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(note.id)}
                        title="Delete Note"
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div className="mt-2 space-y-2">
                    <textarea
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      rows={2}
                      className="w-full bg-slate-900 border border-cyan-500/50 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none resize-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingNoteId(null)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 font-mono"
                      >
                        <X className="w-3 h-3" /> Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEdit(note.id)}
                        className="px-2.5 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1 font-mono"
                      >
                        <Check className="w-3 h-3" /> Update
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {note.note}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
