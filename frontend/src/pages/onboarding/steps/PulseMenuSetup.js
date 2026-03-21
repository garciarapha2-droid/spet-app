import React, { useState, useMemo } from 'react';
import { ArrowLeft, Plus, X, Trash2, ImagePlus } from 'lucide-react';
import { Button } from '../../../components/ui/button';

const DEFAULT_CATEGORIES = [
  { name: 'Cocktails', emoji: '\u{1F378}', gradient: 'from-violet-500/20 to-fuchsia-500/20', border: 'border-violet-500/30', accent: 'text-violet-400' },
  { name: 'Beers', emoji: '\u{1F37A}', gradient: 'from-amber-500/20 to-yellow-500/20', border: 'border-amber-500/30', accent: 'text-amber-400' },
  { name: 'Spirits', emoji: '\u{1F943}', gradient: 'from-rose-500/20 to-orange-500/20', border: 'border-rose-500/30', accent: 'text-rose-400' },
  { name: 'Non-alcoholic', emoji: '\u{1F9C3}', gradient: 'from-emerald-500/20 to-teal-500/20', border: 'border-emerald-500/30', accent: 'text-emerald-400' },
  { name: 'Snacks', emoji: '\u{1F37F}', gradient: 'from-orange-500/20 to-amber-500/20', border: 'border-orange-500/30', accent: 'text-orange-400' },
  { name: 'Starters', emoji: '\u{1F957}', gradient: 'from-green-500/20 to-lime-500/20', border: 'border-green-500/30', accent: 'text-green-400' },
];

const EMOJI_PICKER = [
  '\u{1F354}','\u{1F355}','\u{1F32E}','\u{1F969}','\u{1F363}','\u{1F370}',
  '\u2615','\u{1F9C1}','\u{1F942}','\u{1F379}','\u{1FAD6}','\u{1F964}',
  '\u{1F377}','\u{1F9C0}','\u{1F956}','\u{1F336}\uFE0F','\u{1F35C}','\u{1F957}',
  '\u{1F369}','\u{1FAD2}','\u{1F37E}','\u{1F389}','\u{1FAA3}','\u{1F6CB}\uFE0F',
  '\u{1F943}','\u{1F9CA}','\u{1F38A}','\u{1FAA9}','\u{1F3D6}\uFE0F','\u{1F303}',
];

function getCatStyle(name) {
  return DEFAULT_CATEGORIES.find(c => c.name === name) || DEFAULT_CATEGORIES[0];
}

export default function PulseMenuSetup({ data, updateData, onNext, onBack }) {
  const categories = data.pulseMenu.categories;
  const items = data.pulseMenu.items;
  const [activeCat, setActiveCat] = useState(categories[0] || 'Cocktails');
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('');

  // New item form
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [ingredientInput, setIngredientInput] = useState('');
  const [ingredients, setIngredients] = useState([]);
  const [extras, setExtras] = useState([]);
  const [extraName, setExtraName] = useState('');
  const [extraPrice, setExtraPrice] = useState('');

  const catItems = useMemo(() => items.filter(i => i.category === activeCat), [items, activeCat]);

  const sharedModules = useMemo(() => {
    const mods = [];
    if (data.enabledModules.includes('pulse')) mods.push('Pulse / Bar');
    if (data.enabledModules.includes('tap')) mods.push('Tap');
    if (data.enabledModules.includes('table')) mods.push('Table');
    return mods;
  }, [data.enabledModules]);

  const addIngredient = (e) => {
    if (e.key === 'Enter' && ingredientInput.trim()) {
      e.preventDefault();
      setIngredients(prev => [...prev, ingredientInput.trim()]);
      setIngredientInput('');
    }
  };

  const addExtra = () => {
    if (extraName.trim() && extraPrice.trim()) {
      setExtras(prev => [...prev, { id: Date.now().toString(), name: extraName.trim(), price: extraPrice.trim() }]);
      setExtraName('');
      setExtraPrice('');
    }
  };

  const submitItem = () => {
    if (!itemName.trim() || !itemPrice.trim()) return;
    const newItem = {
      id: Date.now().toString(),
      name: itemName.trim(),
      price: itemPrice.trim(),
      extras: [...extras],
      description: ingredients.join(', '),
      category: activeCat,
    };
    updateData({
      pulseMenu: { ...data.pulseMenu, items: [...items, newItem] },
    });
    setItemName('');
    setItemPrice('');
    setIngredients([]);
    setExtras([]);
    setShowAddItem(false);
  };

  const deleteItem = (id) => {
    updateData({
      pulseMenu: { ...data.pulseMenu, items: items.filter(i => i.id !== id) },
    });
  };

  const removeCategory = (name) => {
    updateData({
      pulseMenu: {
        categories: categories.filter(c => c !== name),
        items: items.filter(i => i.category !== name),
      },
    });
    if (activeCat === name) setActiveCat(categories[0] || '');
  };

  const addCategory = () => {
    if (!newCatName.trim()) return;
    updateData({
      pulseMenu: { ...data.pulseMenu, categories: [...categories, newCatName.trim()] },
    });
    setActiveCat(newCatName.trim());
    setNewCatName('');
    setNewCatEmoji('');
    setShowAddCat(false);
  };

  const catStyle = getCatStyle(activeCat);

  return (
    <div data-testid="onboarding-menu-setup" className="w-full space-y-4">
      {/* Module Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        {sharedModules.map((mod, i) => (
          <React.Fragment key={mod}>
            {i > 0 && <span className="text-muted-foreground text-xs">&mdash;</span>}
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary">
              {mod}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* Header */}
      <div>
        <h1
          className="text-2xl font-bold tracking-tight text-foreground"
          style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}
        >
          Set up your menu
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {sharedModules.length > 1
            ? `This menu is shared between ${sharedModules.join(', ')}.`
            : 'Add items your venue will sell.'}
        </p>
      </div>

      {/* Layout: sidebar + items */}
      <div className="grid gap-3" style={{ gridTemplateColumns: '80px 1fr' }}>
        {/* Category Sidebar */}
        <div className="flex flex-col gap-1.5">
          {categories.map((cat) => {
            const cs = getCatStyle(cat);
            const isActive = cat === activeCat;
            return (
              <button
                key={cat}
                data-testid={`menu-cat-${cat}`}
                onClick={() => setActiveCat(cat)}
                className={`relative group flex flex-col items-center justify-center py-2.5 px-1 rounded-xl border transition-all ${
                  isActive
                    ? `bg-gradient-to-b ${cs.gradient} ${cs.border} shadow-md`
                    : 'border-transparent hover:bg-card/40'
                }`}
              >
                <span className="text-lg">{cs.emoji}</span>
                <span className={`text-[9px] font-bold uppercase mt-1 truncate w-full text-center ${isActive ? cs.accent : 'text-muted-foreground'}`}>
                  {cat}
                </span>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); removeCategory(cat); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); removeCategory(cat); } }}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={10} />
                </div>
              </button>
            );
          })}
          {/* Custom button */}
          <button
            data-testid="menu-add-category-btn"
            onClick={() => setShowAddCat(true)}
            className="flex flex-col items-center justify-center py-2.5 px-1 rounded-xl border-2 border-dashed border-border/60 text-muted-foreground hover:border-primary/30 hover:text-foreground transition-all"
          >
            <Plus size={16} />
            <span className="text-[9px] font-bold uppercase mt-1">Custom</span>
          </button>
        </div>

        {/* Items Area */}
        <div className="space-y-3">
          {/* Category Header */}
          <div className={`flex items-center gap-3 p-3 rounded-xl border bg-gradient-to-r ${catStyle.gradient} ${catStyle.border}`}>
            <span className="text-2xl">{catStyle.emoji}</span>
            <span className="text-sm font-extrabold text-foreground">{activeCat}</span>
            <span className="text-xs text-muted-foreground ml-auto">{catItems.length} items</span>
          </div>

          {/* Items List */}
          {catItems.map((item) => (
            <div
              key={item.id}
              data-testid={`menu-item-${item.id}`}
              className="group flex items-center gap-3 p-3 rounded-xl border border-border/30 bg-card/50 transition-all hover:border-border/60"
            >
              {item.photo && (
                <img src={item.photo} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-foreground truncate">{item.name}</div>
                <div className="flex items-center gap-2">
                  {item.description && (
                    <span className="text-xs text-muted-foreground truncate">{item.description}</span>
                  )}
                  {item.extras.length > 0 && (
                    <span className="text-[10px] bg-muted/50 px-1.5 py-0.5 rounded-full text-muted-foreground">
                      +{item.extras.length} extras
                    </span>
                  )}
                </div>
              </div>
              <span className={`text-sm font-extrabold tabular-nums ${catStyle.accent}`}>
                ${parseFloat(item.price).toFixed(2)}
              </span>
              <button
                onClick={() => deleteItem(item.id)}
                className="w-7 h-7 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 hover:text-destructive transition-all text-muted-foreground"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          {/* Add Item Form */}
          {showAddItem ? (
            <div className="p-4 rounded-xl border border-primary/20 bg-primary/[0.03] space-y-3">
              <input
                data-testid="menu-item-name"
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Item name"
                className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40"
              />
              <input
                data-testid="menu-item-price"
                type="number"
                value={itemPrice}
                onChange={(e) => setItemPrice(e.target.value)}
                placeholder="Price (e.g. 12.00)"
                className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40"
              />

              {/* Ingredients */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  Ingredients / Base composition
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {ingredients.map((ing, i) => (
                    <span key={i} className="inline-flex items-center gap-1 text-xs bg-muted/60 px-2 py-1 rounded-full text-foreground">
                      {ing}
                      <button onClick={() => setIngredients(prev => prev.filter((_, idx) => idx !== i))}>
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  value={ingredientInput}
                  onChange={(e) => setIngredientInput(e.target.value)}
                  onKeyDown={addIngredient}
                  placeholder="Type ingredient and press Enter"
                  className="w-full h-9 px-3 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40"
                />
                <p className="text-[10px] text-muted-foreground">
                  Press Enter to add. Staff can remove these when ordering.
                </p>
              </div>

              {/* Extras */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  Extras (optional paid add-ons)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {extras.map((ex) => (
                    <span key={ex.id} className="inline-flex items-center gap-1 text-xs bg-muted/60 px-2 py-1 rounded-full text-foreground">
                      {ex.name} <span className="text-primary">+${ex.price}</span>
                      <button onClick={() => setExtras(prev => prev.filter(e => e.id !== ex.id))}>
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={extraName}
                    onChange={(e) => setExtraName(e.target.value)}
                    placeholder="Extra name"
                    className="flex-1 h-9 px-3 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <input
                    type="number"
                    value={extraPrice}
                    onChange={(e) => setExtraPrice(e.target.value)}
                    placeholder="Price"
                    className="w-20 h-9 px-3 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <button
                    onClick={addExtra}
                    className="h-9 w-9 flex items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <Button data-testid="menu-submit-item" onClick={submitItem} className="w-full" disabled={!itemName.trim() || !itemPrice.trim()}>
                Add item
              </Button>
            </div>
          ) : (
            <Button
              data-testid="menu-add-item-btn"
              variant="outline"
              onClick={() => setShowAddItem(true)}
              className="w-full"
            >
              <Plus size={14} className="mr-1" />
              Add item to {activeCat}
            </Button>
          )}
        </div>
      </div>

      {/* Add Category Modal */}
      {showAddCat && (
        <div className="p-4 rounded-xl border border-primary/20 bg-primary/[0.03] space-y-3">
          <input
            data-testid="new-cat-name"
            type="text"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCategory()}
            placeholder="Category name"
            className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40"
          />
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5 block">Choose emoji</label>
            <div className="grid grid-cols-10 gap-1">
              {EMOJI_PICKER.map((em) => (
                <button
                  key={em}
                  onClick={() => setNewCatEmoji(em)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all ${
                    newCatEmoji === em ? 'bg-primary/15 border-2 border-primary/40' : 'hover:bg-muted/50'
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>
          {newCatName && (
            <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
              <span className="text-lg">{newCatEmoji || '\u{1F4E6}'}</span>
              <span className="text-sm font-semibold">{newCatName}</span>
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowAddCat(false)}>Cancel</Button>
            <Button size="sm" onClick={addCategory} disabled={!newCatName.trim()}>Create</Button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center gap-3 pt-2">
        <Button variant="ghost" onClick={onBack} className="text-muted-foreground">
          <ArrowLeft size={16} className="mr-1" />
          Back
        </Button>
        <Button onClick={onNext} className="flex-1">Continue</Button>
      </div>
    </div>
  );
}
