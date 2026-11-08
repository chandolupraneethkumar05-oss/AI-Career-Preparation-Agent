import React, { useState, useEffect } from 'react';
import { X, Plus, FolderOpen, Trash2, Edit3, Check, Loader2, AlertCircle } from 'lucide-react';
import { resumeBuilderApi } from '../../services/resumeBuilderApi';

export default function DraftManagerModal({
  isOpen,
  onClose,
  onSelectDraft,
  onNewDraft,
  currentDraftId,
}) {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [isDeleting, setIsDeleting] = useState(null);

  const fetchDrafts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await resumeBuilderApi.getDrafts();
      setDrafts(data);
    } catch (err) {
      setError(err.message || 'Failed to load drafts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDrafts();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartRename = draft => {
    setEditingId(draft.id);
    setEditTitle(draft.title);
  };

  const handleSaveRename = async draftId => {
    if (!editTitle.trim()) return;
    try {
      await resumeBuilderApi.updateDraft(draftId, { title: editTitle.trim() });
      setDrafts(prev =>
        prev.map(d => (d.id === draftId ? { ...d, title: editTitle.trim() } : d))
      );
      setEditingId(null);
    } catch (err) {
      alert(err.message || 'Failed to rename draft');
    }
  };

  const handleDelete = async draftId => {
    if (!window.confirm('Are you sure you want to delete this resume draft? This action cannot be undone.')) {
      return;
    }
    try {
      setIsDeleting(draftId);
      await resumeBuilderApi.deleteDraft(draftId);
      setDrafts(prev => prev.filter(d => d.id !== draftId));
      if (currentDraftId === draftId) {
        onNewDraft();
      }
    } catch (err) {
      alert(err.message || 'Failed to delete draft');
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <FolderOpen className="text-emerald-700" size={20} />
            <h2 className="text-base font-bold text-slate-800">Saved Resume Drafts</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Action Button */}
        <div className="py-3 flex justify-between items-center border-b border-slate-100">
          <p className="text-xs text-slate-500">
            {drafts.length} {drafts.length === 1 ? 'draft' : 'drafts'} saved
          </p>
          <button
            onClick={() => {
              onNewDraft();
              onClose();
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Plus size={14} />
            <span>New Blank Resume</span>
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2">
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <Loader2 className="animate-spin text-emerald-600" size={24} />
              <span className="text-xs">Loading drafts...</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs flex items-center space-x-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && drafts.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-xs">
              No saved drafts yet. Create your first resume or save current progress!
            </div>
          )}

          {!loading &&
            drafts.map(draft => {
              const isCurrent = draft.id === currentDraftId;
              const isEditing = editingId === draft.id;

              return (
                <div
                  key={draft.id}
                  className={`p-3.5 rounded-xl border transition flex items-center justify-between ${
                    isCurrent
                      ? 'border-emerald-600 bg-emerald-50/30'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex-1 min-w-0 mr-3">
                    {isEditing ? (
                      <div className="flex items-center space-x-1.5">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          className="px-2 py-1 text-xs border border-emerald-500 rounded focus:outline-none flex-1"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveRename(draft.id)}
                          className="p-1 text-emerald-700 hover:bg-emerald-100 rounded"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-xs font-bold text-slate-800 truncate">
                            {draft.title}
                          </h4>
                          {isCurrent && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-semibold">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-0.5">
                          <span>{draft.target_role || 'General Role'}</span>
                          <span>•</span>
                          <span className="capitalize">{draft.template_id.replace('_', ' ')}</span>
                          <span>•</span>
                          <span>
                            {new Date(draft.updated_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-1">
                    {!isEditing && (
                      <button
                        onClick={() => handleStartRename(draft)}
                        title="Rename Draft"
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                      >
                        <Edit3 size={14} />
                      </button>
                    )}

                    <button
                      onClick={() => {
                        onSelectDraft(draft.id);
                        onClose();
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-medium transition"
                    >
                      Open
                    </button>

                    <button
                      onClick={() => handleDelete(draft.id)}
                      disabled={isDeleting === draft.id}
                      title="Delete Draft"
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-40"
                    >
                      {isDeleting === draft.id ? (
                        <Loader2 size={14} className="animate-spin text-red-500" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
