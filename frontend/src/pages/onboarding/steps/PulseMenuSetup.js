import React, { useState, useMemo } from 'react';
import { ArrowLeft, Plus, X, Trash2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';

const DEFAULT_CATEGORIES = [
  { name: 'Cocktails', emoji: String.fromCodePoint(0x1F378), gradient: 'from-violet-500/20 to-fuchsia-500/20', border: 'border-violet-500/30', accent: 'text-violet-400' },
  { name: 'Beers', emoji: String.fromCodePoint(0x1F37A), gradient: 'from-amber-500/20 to-yellow-500/20', border: 'border-amber-500/30', accent: 'text-amber-400' },
  { name: 'Spirits', emoji: String.fromCodePoint(0x1F943), gradient: 'from-rose-500/20 to-orange-500/20', border: 'border-rose-500/30', accent: 'text-rose-400' },
  { name: 'Non-alcoholic', emoji: String.fromCodePoint(0x1F9C3), gradient: 'from-emerald-500/20 to-teal-500/20', border: 'border-emerald-500/30', accent: 'text-emerald-400' },
  { name: 'Snacks', emoji: String.fromCodePoint(0x1F37F), gradient: 'from-orange-500/20 to-amber-500/20', border: 'border-orange-500/30', accent: 'text-orange-400' },
  { name: 'Starters', emoji: String.fromCodePoint(0x1F957), gradient: 'from-green-500/20 to-lime-500/20', border: 'border-green-500/30', accent: 'text-green-400' },
];

const EMOJI_LIST = [
  0x1F354, 0x1F355, 0x1F32E, 0x1F969, 0x1F363, 0x1F370,
  0x2615, 0x1F9C1, 0x1F942, 0x1F379, 0x1FAD6, 0x1F964,
  0x1F377, 0x1F9C0, 0x1F956, 0x1F336, 0x1F35C, 0x1F957,
  0x1F369, 0x1FAD2, 0x1F37E, 0x1F389, 0x1FAA3, 0x1F6CB,
  0x1F943, 0x1F9CA, 0x1F38A, 0x1FAA9, 0x1F3D6, 0x1F303,
].map(code => String.fromCodePoint(code));

function getCatStyle(name) {
  return DEFAULT_CATEGORIES.find(function(c) { return c.name === name; }) || DEFAULT_CATEGORIES[0];
}

export default function PulseMenuSetup(props) {
  var data = props.data;
  var updateData = props.updateData;
  var onNext = props.onNext;
  var onBack = props.onBack;

  var categories = data.pulseMenu.categories;
  var items = data.pulseMenu.items;
  var [activeCat, setActiveCat] = useState(categories[0] || 'Cocktails');
  var [showAddItem, setShowAddItem] = useState(false);
  var [showAddCat, setShowAddCat] = useState(false);
  var [newCatName, setNewCatName] = useState('');
  var [newCatEmoji, setNewCatEmoji] = useState('');

  var [itemName, setItemName] = useState('');
  var [itemPrice, setItemPrice] = useState('');
  var [ingredientInput, setIngredientInput] = useState('');
  var [ingredients, setIngredients] = useState([]);
  var [extras, setExtras] = useState([]);
  var [extraName, setExtraName] = useState('');
  var [extraPrice, setExtraPrice] = useState('');

  var catItems = useMemo(function() { return items.filter(function(i) { return i.category === activeCat; }); }, [items, activeCat]);

  var sharedModules = useMemo(function() {
    var mods = [];
    if (data.enabledModules.includes('pulse')) mods.push('Pulse / Bar');
    if (data.enabledModules.includes('tap')) mods.push('Tap');
    if (data.enabledModules.includes('table')) mods.push('Table');
    return mods;
  }, [data.enabledModules]);

  function addIngredient(e) {
    if (e.key === 'Enter' && ingredientInput.trim()) {
      e.preventDefault();
      setIngredients(function(prev) { return prev.concat([ingredientInput.trim()]); });
      setIngredientInput('');
    }
  }

  function addExtra() {
    if (extraName.trim() && extraPrice.trim()) {
      setExtras(function(prev) { return prev.concat([{ id: Date.now().toString(), name: extraName.trim(), price: extraPrice.trim() }]); });
      setExtraName('');
      setExtraPrice('');
    }
  }

  function submitItem() {
    if (!itemName.trim() || !itemPrice.trim()) return;
    var newItem = {
      id: Date.now().toString(),
      name: itemName.trim(),
      price: itemPrice.trim(),
      extras: extras.slice(),
      description: ingredients.join(', '),
      category: activeCat,
    };
    updateData({
      pulseMenu: { categories: data.pulseMenu.categories, items: items.concat([newItem]) },
    });
    setItemName('');
    setItemPrice('');
    setIngredients([]);
    setExtras([]);
    setShowAddItem(false);
  }

  function deleteItem(id) {
    updateData({
      pulseMenu: { categories: data.pulseMenu.categories, items: items.filter(function(i) { return i.id !== id; }) },
    });
  }

  function removeCategory(name) {
    updateData({
      pulseMenu: {
        categories: categories.filter(function(c) { return c !== name; }),
        items: items.filter(function(i) { return i.category !== name; }),
      },
    });
    if (activeCat === name) setActiveCat(categories[0] || '');
  }

  function addCategory() {
    if (!newCatName.trim()) return;
    updateData({
      pulseMenu: { categories: categories.concat([newCatName.trim()]), items: data.pulseMenu.items },
    });
    setActiveCat(newCatName.trim());
    setNewCatName('');
    setNewCatEmoji('');
    setShowAddCat(false);
  }

  var catStyle = getCatStyle(activeCat);

  return (
    <div data-testid="onboarding-menu-setup" className="w-full space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {sharedModules.map(function(mod, i) {
          return (
            <React.Fragment key={mod}>
              {i > 0 && <span className="text-muted-foreground text-xs">{'\u2014'}</span>}
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary">
                {mod}
              </span>
            </React.Fragment>
          );
        })}
      </div>

      <div>
        <h1
          className="text-2xl font-bold tracking-tight text-foreground"
          style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}
        >
          Set up your menu
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {sharedModules.length > 1
            ? 'This menu is shared between ' + sharedModules.join(', ') + '.'
            : 'Add items your venue will sell.'}
        </p>
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: '80px 1fr' }}>
        <div className="flex flex-col gap-1.5">
          {categories.map(function(cat) {
            var cs = getCatStyle(cat);
            var isActive = cat === activeCat;
            return (
              <div
                key={cat}
                data-testid={'menu-cat-' + cat}
                onClick={function() { setActiveCat(cat); }}
                className={'relative group flex flex-col items-center justify-center py-2.5 px-1 rounded-xl border transition-all cursor-pointer ' +
                  (isActive
                    ? 'bg-gradient-to-b ' + cs.gradient + ' ' + cs.border + ' shadow-md'
                    : 'border-transparent hover:bg-card/40')}
              >
                <span className="text-lg">{cs.emoji}</span>
                <span className={'text-[9px] font-bold uppercase mt-1 truncate w-full text-center ' + (isActive ? cs.accent : 'text-muted-foreground')}>
                  {cat}
                </span>
                <span
                  onClick={function(e) { e.stopPropagation(); removeCategory(cat); }}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <X size={10} />
                </span>
              </div>
            );
          })}
          <div
            data-testid="menu-add-category-btn"
            onClick={function() { setShowAddCat(true); }}
            className="flex flex-col items-center justify-center py-2.5 px-1 rounded-xl border-2 border-dashed border-border/60 text-muted-foreground hover:border-primary/30 hover:text-foreground transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span className="text-[9px] font-bold uppercase mt-1">Custom</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className={'flex items-center gap-3 p-3 rounded-xl border bg-gradient-to-r ' + catStyle.gradient + ' ' + catStyle.border}>
            <span className="text-2xl">{catStyle.emoji}</span>
            <span className="text-sm font-extrabold text-foreground">{activeCat}</span>
            <span className="text-xs text-muted-foreground ml-auto">{catItems.length} items</span>
          </div>

          {catItems.map(function(item) {
            return (
              <div
                key={item.id}
                data-testid={'menu-item-' + item.id}
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
                <span className={'text-sm font-extrabold tabular-nums ' + catStyle.accent}>
                  ${parseFloat(item.price).toFixed(2)}
                </span>
                <span
                  onClick={function() { deleteItem(item.id); }}
                  className="w-7 h-7 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 hover:text-destructive transition-all text-muted-foreground cursor-pointer"
                >
                  <Trash2 size={14} />
                </span>
              </div>
            );
          })}

          {showAddItem ? (
            <div className="p-4 rounded-xl border border-primary/20 bg-primary/[0.03] space-y-3">
              <input
                data-testid="menu-item-name"
                type="text"
                value={itemName}
                onChange={function(e) { setItemName(e.target.value); }}
                placeholder="Item name"
                className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40"
              />
              <input
                data-testid="menu-item-price"
                type="number"
                value={itemPrice}
                onChange={function(e) { setItemPrice(e.target.value); }}
                placeholder="Price (e.g. 12.00)"
                className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40"
              />

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  Ingredients / Base composition
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {ingredients.map(function(ing, i) {
                    return (
                      <span key={i} className="inline-flex items-center gap-1 text-xs bg-muted/60 px-2 py-1 rounded-full text-foreground">
                        {ing}
                        <span className="cursor-pointer" onClick={function() { setIngredients(function(prev) { return prev.filter(function(_, idx) { return idx !== i; }); }); }}>
                          <X size={10} />
                        </span>
                      </span>
                    );
                  })}
                </div>
                <input
                  type="text"
                  value={ingredientInput}
                  onChange={function(e) { setIngredientInput(e.target.value); }}
                  onKeyDown={addIngredient}
                  placeholder="Type ingredient and press Enter"
                  className="w-full h-9 px-3 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40"
                />
                <p className="text-[10px] text-muted-foreground">
                  Press Enter to add. Staff can remove these when ordering.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  Extras (optional paid add-ons)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {extras.map(function(ex) {
                    return (
                      <span key={ex.id} className="inline-flex items-center gap-1 text-xs bg-muted/60 px-2 py-1 rounded-full text-foreground">
                        {ex.name} <span className="text-primary">+${ex.price}</span>
                        <span className="cursor-pointer" onClick={function() { setExtras(function(prev) { return prev.filter(function(e) { return e.id !== ex.id; }); }); }}>
                          <X size={10} />
                        </span>
                      </span>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={extraName}
                    onChange={function(e) { setExtraName(e.target.value); }}
                    placeholder="Extra name"
                    className="flex-1 h-9 px-3 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <input
                    type="number"
                    value={extraPrice}
                    onChange={function(e) { setExtraPrice(e.target.value); }}
                    placeholder="Price"
                    className="w-20 h-9 px-3 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <span
                    onClick={addExtra}
                    className="h-9 w-9 flex items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                  >
                    <Plus size={14} />
                  </span>
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
              onClick={function() { setShowAddItem(true); }}
              className="w-full"
            >
              <Plus size={14} className="mr-1" />
              {'Add item to ' + activeCat}
            </Button>
          )}
        </div>
      </div>

      {showAddCat && (
        <div className="p-4 rounded-xl border border-primary/20 bg-primary/[0.03] space-y-3">
          <input
            data-testid="new-cat-name"
            type="text"
            value={newCatName}
            onChange={function(e) { setNewCatName(e.target.value); }}
            onKeyDown={function(e) { if (e.key === 'Enter') addCategory(); }}
            placeholder="Category name"
            className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40"
          />
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5 block">Choose emoji</label>
            <div className="grid grid-cols-10 gap-1">
              {EMOJI_LIST.map(function(em) {
                return (
                  <span
                    key={em}
                    onClick={function() { setNewCatEmoji(em); }}
                    className={'w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all cursor-pointer ' +
                      (newCatEmoji === em ? 'bg-primary/15 border-2 border-primary/40' : 'hover:bg-muted/50')}
                  >
                    {em}
                  </span>
                );
              })}
            </div>
          </div>
          {newCatName && (
            <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
              <span className="text-lg">{newCatEmoji || String.fromCodePoint(0x1F4E6)}</span>
              <span className="text-sm font-semibold">{newCatName}</span>
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={function() { setShowAddCat(false); }}>Cancel</Button>
            <Button size="sm" onClick={addCategory} disabled={!newCatName.trim()}>Create</Button>
          </div>
        </div>
      )}

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
