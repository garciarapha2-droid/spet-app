import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { X, Plus, Minus, Check, MessageSquare } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

/**
 * ItemCustomizeModal — Phase 3: Modifiers & Notes
 *
 * Props:
 *   item        — the order item { id, name, notes, modifiers, catalog_item_id }
 *   sessionId   — tap session ID
 *   token       — auth token
 *   onClose     — close callback
 *   onSaved     — callback after save (triggers session reload)
 */
export function ItemCustomizeModal({ item, sessionId, token, onClose, onSaved }) {
  const [ingredients, setIngredients] = useState([]);
  const [removed, setRemoved] = useState([]);
  const [extras, setExtras] = useState([]);
  const [notes, setNotes] = useState('');
  const [newExtra, setNewExtra] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load catalog item to get default ingredients
  const loadItem = useCallback(async () => {
    if (!item.catalog_item_id) { setLoading(false); return; }
    try {
      const res = await fetch(`${API}/api/tap/catalog/${item.catalog_item_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setIngredients(data.default_ingredients || []);
      }
    } catch {}
    setLoading(false);
  }, [item.catalog_item_id, token]);

  useEffect(() => {
    loadItem();
    // Initialize from existing modifiers
    const mods = item.modifiers || {};
    setRemoved(mods.removed || []);
    setExtras(mods.extras || []);
    setNotes(item.notes || '');
  }, [item, loadItem]);

  const toggleIngredient = (name) => {
    setRemoved(prev =>
      prev.includes(name)
        ? prev.filter(r => r !== name)
        : [...prev, name]
    );
  };

  const addExtra = () => {
    const trimmed = newExtra.trim();
    if (!trimmed || extras.includes(trimmed)) return;
    setExtras(prev => [...prev, trimmed]);
    setNewExtra('');
  };

  const removeExtra = (name) => {
    setExtras(prev => prev.filter(e => e !== name));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const modifiers = {};
      if (removed.length > 0) modifiers.removed = removed;
      if (extras.length > 0) modifiers.extras = extras;

      const res = await fetch(`${API}/api/tap/session/${sessionId}/item/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          modifiers,
          notes: notes.trim() || null,
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
      onSaved?.();
      onClose();
    } catch {
      // toast handled by caller
    }
    setSaving(false);
  };

  const hasChanges = removed.length > 0 || extras.length > 0 || notes.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      data-testid="customize-modal">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[85vh] flex flex-col animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold" data-testid="customize-item-name">{item.name}</h2>
            <p className="text-xs text-muted-foreground">Customize your order</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} data-testid="customize-close-btn">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>
          ) : (
            <>
              {/* Ingredients Section */}
              {ingredients.length > 0 && (
                <div data-testid="ingredients-section">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Ingredients</h3>
                  <div className="space-y-1">
                    {ingredients.map(name => {
                      const isRemoved = removed.includes(name);
                      return (
                        <button
                          key={name}
                          onClick={() => toggleIngredient(name)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                            isRemoved
                              ? 'border-red-500/30 bg-red-500/5 text-muted-foreground line-through'
                              : 'border-border bg-card hover:border-primary/30'
                          }`}
                          data-testid={`ingredient-${name.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            isRemoved ? 'border-red-500/50 bg-red-500/10' : 'border-primary bg-primary/10'
                          }`}>
                            {!isRemoved && <Check className="h-3 w-3 text-primary" />}
                          </div>
                          <span className="text-sm font-medium">{name}</span>
                          {isRemoved && (
                            <span className="ml-auto text-[10px] font-bold text-red-500 uppercase">Removed</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Extras Section */}
              <div data-testid="extras-section">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Extras</h3>
                {extras.length > 0 && (
                  <div className="space-y-1 mb-3">
                    {extras.map(name => (
                      <div key={name}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-green-500/30 bg-green-500/5"
                        data-testid={`extra-${name.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <Plus className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm font-medium flex-1">{name}</span>
                        <button onClick={() => removeExtra(name)}
                          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-red-500"
                          data-testid={`remove-extra-${name.toLowerCase().replace(/\s+/g, '-')}`}>
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    value={newExtra}
                    onChange={e => setNewExtra(e.target.value)}
                    placeholder="Add extra (e.g. cheese, bacon)"
                    className="h-10 text-sm"
                    onKeyDown={e => e.key === 'Enter' && addExtra()}
                    data-testid="add-extra-input"
                  />
                  <Button size="sm" variant="outline" className="h-10 px-3" onClick={addExtra}
                    disabled={!newExtra.trim()}
                    data-testid="add-extra-btn">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Notes Section */}
              <div data-testid="notes-section">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" /> Special Instructions
                </h3>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="E.g. well done, no onions on the side..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm resize-none focus:outline-none focus:border-primary"
                  data-testid="notes-textarea"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex-shrink-0">
          <Button
            className="w-full h-12 font-semibold text-base"
            onClick={handleSave}
            disabled={saving}
            data-testid="save-customization-btn"
          >
            {saving ? 'Saving...' : hasChanges ? 'Update Item' : 'Done'}
          </Button>
        </div>
      </div>
    </div>
  );
}
