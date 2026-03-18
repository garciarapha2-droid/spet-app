import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { X, Plus, Minus, Check, MessageSquare, DollarSign } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

/**
 * ItemCustomizeModal — Phase 3: Modifiers, Notes & Priced Extras
 *
 * extras format: [{name: "cheese", price: 2.00}, {name: "bacon", price: 3.00}]
 * Backward-compatible: if an extra is a string, it's treated as {name: string, price: 0}
 */
export function ItemCustomizeModal({ item, sessionId, token, onClose, onSaved }) {
  const [ingredients, setIngredients] = useState([]);
  const [removed, setRemoved] = useState([]);
  const [extras, setExtras] = useState([]);
  const [notes, setNotes] = useState('');
  const [newExtraName, setNewExtraName] = useState('');
  const [newExtraPrice, setNewExtraPrice] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
    const mods = item.modifiers || {};
    setRemoved(mods.removed || []);
    // Normalize extras: convert string[] to {name, price}[]
    const rawExtras = mods.extras || [];
    setExtras(rawExtras.map(e => typeof e === 'string' ? { name: e, price: 0 } : e));
    setNotes(item.notes || '');
  }, [item, loadItem]);

  const toggleIngredient = (name) => {
    setRemoved(prev =>
      prev.includes(name) ? prev.filter(r => r !== name) : [...prev, name]
    );
  };

  const addExtra = () => {
    const name = newExtraName.trim();
    if (!name || extras.some(e => e.name === name)) return;
    const price = parseFloat(newExtraPrice) || 0;
    setExtras(prev => [...prev, { name, price }]);
    setNewExtraName('');
    setNewExtraPrice('');
  };

  const removeExtra = (name) => {
    setExtras(prev => prev.filter(e => e.name !== name));
  };

  const updateExtraPrice = (name, newPrice) => {
    setExtras(prev => prev.map(e => e.name === name ? { ...e, price: parseFloat(newPrice) || 0 } : e));
  };

  const extrasTotal = extras.reduce((sum, e) => sum + (e.price || 0), 0);
  const basePrice = item.unit_price || 0;

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
    } catch {}
    setSaving(false);
  };

  const hasChanges = removed.length > 0 || extras.length > 0 || notes.trim();

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      style={{ zIndex: 9999 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      data-testid="customize-modal">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[85vh] flex flex-col animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold" data-testid="customize-item-name">{item.name}</h2>
            <p className="text-xs text-muted-foreground">
              Base: ${basePrice.toFixed(2)}
              {extrasTotal > 0 && <span className="text-emerald-500 font-medium ml-2">+ ${extrasTotal.toFixed(2)} extras</span>}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} data-testid="customize-close-btn">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>
          ) : (
            <>
              {/* Ingredients */}
              {ingredients.length > 0 && (
                <div data-testid="ingredients-section">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Ingredients</h3>
                  <div className="space-y-1">
                    {ingredients.map(name => {
                      const isRemoved = removed.includes(name);
                      return (
                        <button key={name} onClick={() => toggleIngredient(name)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                            isRemoved
                              ? 'border-red-500/30 bg-red-500/5 text-muted-foreground line-through'
                              : 'border-border bg-card hover:border-foreground/20'
                          }`}
                          data-testid={`ingredient-${name.toLowerCase().replace(/\s+/g, '-')}`}>
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            isRemoved ? 'border-red-500/50 bg-red-500/10' : 'border-emerald-500 bg-emerald-500/10'
                          }`}>
                            {!isRemoved && <Check className="h-3 w-3 text-emerald-500" />}
                          </div>
                          <span className="text-sm font-medium">{name}</span>
                          {isRemoved && <span className="ml-auto text-[10px] font-bold text-red-500 uppercase">Removed</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Extras with Pricing */}
              <div data-testid="extras-section">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  Extras {extrasTotal > 0 && <span className="text-emerald-500 ml-1">(+${extrasTotal.toFixed(2)})</span>}
                </h3>
                {extras.length > 0 && (
                  <div className="space-y-1 mb-3">
                    {extras.map(extra => (
                      <div key={extra.name}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5"
                        data-testid={`extra-${extra.name.toLowerCase().replace(/\s+/g, '-')}`}>
                        <Plus className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        <span className="text-sm font-medium flex-1">{extra.name}</span>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3 text-muted-foreground" />
                          <Input type="number" step="0.01" min="0" value={extra.price || ''} placeholder="0.00"
                            onChange={e => updateExtraPrice(extra.name, e.target.value)}
                            className="w-16 h-7 text-xs text-right px-1"
                            data-testid={`extra-price-${extra.name.toLowerCase().replace(/\s+/g, '-')}`} />
                        </div>
                        <button onClick={() => removeExtra(extra.name)}
                          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-red-500"
                          data-testid={`remove-extra-${extra.name.toLowerCase().replace(/\s+/g, '-')}`}>
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Input value={newExtraName} onChange={e => setNewExtraName(e.target.value)}
                    placeholder="Extra name (e.g. cheese)"
                    className="h-10 text-sm flex-1"
                    onKeyDown={e => e.key === 'Enter' && addExtra()}
                    data-testid="add-extra-input" />
                  <Input type="number" step="0.01" min="0" value={newExtraPrice}
                    onChange={e => setNewExtraPrice(e.target.value)}
                    placeholder="$0.00"
                    className="h-10 text-sm w-20"
                    onKeyDown={e => e.key === 'Enter' && addExtra()}
                    data-testid="add-extra-price-input" />
                  <Button size="sm" variant="outline" className="h-10 px-3" onClick={addExtra}
                    disabled={!newExtraName.trim()} data-testid="add-extra-btn">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Notes */}
              <div data-testid="notes-section">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" /> Special Instructions
                </h3>
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="E.g. well done, no onions on the side..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm resize-none focus:outline-none focus:border-foreground/30"
                  data-testid="notes-textarea" />
              </div>
            </>
          )}
        </div>

        {/* Footer with Total */}
        <div className="px-6 py-4 border-t border-border flex-shrink-0">
          {extrasTotal > 0 && (
            <div className="flex justify-between items-center mb-3 text-sm">
              <span className="text-muted-foreground">Item total</span>
              <span className="font-bold">${(basePrice + extrasTotal).toFixed(2)}</span>
            </div>
          )}
          <Button className="w-full h-12 font-semibold text-base" onClick={handleSave} disabled={saving}
            data-testid="save-customization-btn">
            {saving ? 'Saving...' : hasChanges ? 'Update Item' : 'Done'}
          </Button>
        </div>
      </div>
    </div>
  );
}
