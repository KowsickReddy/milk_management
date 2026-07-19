import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  StickyNote, Plus, Trash2, Edit2, Clock, User, Users,
  AtSign, Search, RefreshCw, Save, X, MessageSquare
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import { cn, formatDate, formatTime, getInitials } from '../lib/utils';
import { Card, Button, Input } from '../ui';

// ── Note Card ────────────────────────────────────────────────────────────
function NoteCard({ note, customers, onEdit, onDelete }) {
  const mentionedCustomers = useMemo(() => {
    if (!note.mentioned_customer_ids || note.mentioned_customer_ids.length === 0) return [];
    const ids = Array.isArray(note.mentioned_customer_ids)
      ? note.mentioned_customer_ids
      : (typeof note.mentioned_customer_ids === 'string'
        ? JSON.parse(note.mentioned_customer_ids)
        : []);
    return ids.map(id => customers.find(c => c.id === id)).filter(Boolean);
  }, [note, customers]);

  return (
    <Card className="p-5 hover:border-indigo-200 transition-all duration-200 group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400">
              {note.created_by_name || 'Staff'}
            </p>
            <p className="text-[10px] text-slate-300 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(note.created_at)} · {formatTime(note.created_at)}
            </p>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(note)}
            className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors"
            title="Edit note"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(note)}
            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
            title="Delete note"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Note content */}
      <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
        {note.note_text}
      </div>

      {/* Mentioned customers */}
      {mentionedCustomers.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {mentionedCustomers.map(c => (
            <span
              key={c.id}
              className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 border border-indigo-100 rounded-lg text-[10px] font-bold text-indigo-700"
            >
              <AtSign className="w-3 h-3" />
              #{c.id} {c.name}
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}

// ── Note Editor ──────────────────────────────────────────────────────────
function NoteEditor({ customers, editingNote, onSave, onCancel }) {
  const [text, setText] = useState(editingNote?.note_text || '');
  const [mentionIds, setMentionIds] = useState(() => {
    if (!editingNote?.mentioned_customer_ids) return [];
    const ids = Array.isArray(editingNote.mentioned_customer_ids)
      ? editingNote.mentioned_customer_ids
      : [];
    return ids;
  });
  const [mentionSearch, setMentionSearch] = useState('');
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const mentionRef = useRef(null);

  // @ trigger detection
  const handleTextChange = (e) => {
    const val = e.target.value;
    setText(val);
    // Detect @ character followed by typing
    const cursorPos = e.target.selectionStart;
    const textBefore = val.slice(0, cursorPos);
    const atMatch = textBefore.match(/@(\w*)$/);
    if (atMatch) {
      setMentionSearch(atMatch[1]);
      setShowMentionDropdown(true);
    } else {
      setShowMentionDropdown(false);
    }
  };

  const handleSelectCustomer = (customer) => {
    if (mentionIds.includes(customer.id)) return;
    setMentionIds(prev => [...prev, customer.id]);
    // Replace @text with @customerName in the text
    const newText = text.replace(/@\w*$/, `@${customer.name} `);
    setText(newText);
    setShowMentionDropdown(false);
    setMentionSearch('');
  };

  const handleRemoveMention = (customerId) => {
    setMentionIds(prev => prev.filter(id => id !== customerId));
  };

  const filteredCustomers = useMemo(() => {
    if (!mentionSearch) return customers.slice(0, 10);
    return customers.filter(c =>
      c.name.toLowerCase().includes(mentionSearch.toLowerCase()) ||
      String(c.id).includes(mentionSearch) ||
      (c.phone || '').includes(mentionSearch)
    ).slice(0, 10);
  }, [customers, mentionSearch]);

  const handleSave = () => {
    if (!text.trim()) {
      toast.error('Note text is required');
      return;
    }
    onSave({ note_text: text.trim(), mentioned_customer_ids: mentionIds });
  };

  const selectedCustomers = mentionIds.map(id => customers.find(c => c.id === id)).filter(Boolean);

  return (
    <Card className="p-5 border-2 border-indigo-100 bg-indigo-50/30 animate-slide-up">
      <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
        {editingNote ? <Edit2 className="w-4 h-4 text-indigo-500" /> : <Plus className="w-4 h-4 text-indigo-500" />}
        {editingNote ? 'Edit Note' : 'New Note'}
      </h3>

      {/* Text area with @mention */}
      <div className="relative">
        <textarea
          value={text}
          onChange={handleTextChange}
          rows={4}
          placeholder="Write your note... Use @ to mention customers"
          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none"
        />

        {/* Mention dropdown */}
        {showMentionDropdown && (
          <div
            ref={mentionRef}
            className="absolute left-0 right-0 bottom-full mb-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-40 overflow-y-auto z-20"
          >
            {filteredCustomers.length === 0 ? (
              <p className="p-3 text-xs text-slate-400 text-center">No customers found</p>
            ) : (
              filteredCustomers.map(c => (
                <button
                  key={c.id}
                  onClick={() => handleSelectCustomer(c)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-indigo-50 text-left transition-colors"
                >
                  <span className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-[10px] font-bold text-indigo-600 shrink-0">
                    {getInitials(c.name)}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-slate-700">#{c.id} {c.name}</p>
                    <p className="text-[10px] text-slate-400">{c.phone || 'No phone'}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Selected mentions */}
      {selectedCustomers.length > 0 && (
        <div className="mt-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Mentioned Customers ({selectedCustomers.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {selectedCustomers.map(c => (
              <span
                key={c.id}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-100 border border-indigo-200 rounded-xl text-[11px] font-bold text-indigo-800"
              >
                <AtSign className="w-3 h-3" />
                #{c.id} {c.name}
                <button
                  onClick={() => handleRemoveMention(c.id)}
                  className="ml-1 p-0.5 rounded-full hover:bg-indigo-200 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 mt-4">
        <Button onClick={handleSave} className="gap-1.5">
          <Save className="w-4 h-4" />
          {editingNote ? 'Update Note' : 'Save Note'}
        </Button>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </Card>
  );
}

// ── Main Notes Page ──────────────────────────────────────────────────────
export default function Notes() {
  const queryClient = useQueryClient();
  const [showEditor, setShowEditor] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: notes = [], isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['admin-notes'],
    queryFn: () => api.notes.getAll(),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.customers.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.notes.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notes'] });
      toast.success('Note saved!');
      setShowEditor(false);
      setEditingNote(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.notes.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notes'] });
      toast.success('Note updated!');
      setShowEditor(false);
      setEditingNote(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.notes.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notes'] });
      toast.success('Note deleted');
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSave = (data) => {
    if (editingNote) {
      updateMutation.mutate({ id: editingNote.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
      {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-32" />)}
    </div>
  );
  if (isError) return (
    <div className="p-6 text-center">
      <Card className="max-w-md mx-auto p-6 text-center">
        <p className="font-bold text-rose-600 mb-3">Failed to load notes.</p>
        <Button onClick={() => refetch()}>Retry</Button>
      </Card>
    </div>
  );

  return (
    <div className="pb-28">
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center">
              <StickyNote className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">Notes</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{notes.length} Notes</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-indigo-600 transition-colors border border-slate-100"
            >
              <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin')} />
            </button>
            <Button onClick={() => { setEditingNote(null); setShowEditor(true); }}>
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Note</span>
              <span className="sm:hidden text-xs">Add</span>
            </Button>
          </div>
        </div>

        {/* Note Editor */}
        {showEditor && (
          <NoteEditor
            customers={customers}
            editingNote={editingNote}
            onSave={handleSave}
            onCancel={() => { setShowEditor(false); setEditingNote(null); }}
          />
        )}

        {/* Notes Grid */}
        {notes.length === 0 && !showEditor ? (
          <div className="text-center py-16 bg-white/40 rounded-3xl border-2 border-dashed border-gray-200">
            <StickyNote className="w-14 h-14 mx-auto text-gray-200 mb-4" />
            <p className="font-bold text-gray-900">No notes yet</p>
            <p className="text-gray-400 text-sm mt-1 mb-4">Create your first note to keep track of customer conversations</p>
            <Button onClick={() => { setEditingNote(null); setShowEditor(true); }}>
              <Plus className="w-4 h-4" /> Create Note
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notes.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                customers={customers}
                onEdit={(n) => { setEditingNote(n); setShowEditor(true); }}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )}
      </main>

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center">Delete Note?</h3>
            <p className="text-sm text-gray-500 text-center mt-2">This cannot be undone.</p>
            <div className="grid grid-cols-2 gap-3 mt-6">
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant="danger" onClick={() => deleteMutation.mutate(deleteTarget.id)}>
                Yes, Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
