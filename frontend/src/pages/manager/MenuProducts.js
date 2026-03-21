import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Edit2, Trash2, List, LayoutGrid } from 'lucide-react';
import { menuItems } from '../../data/managerModuleData';

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
};

const categories = ['All', ...new Set(menuItems.map(m => m.category))];

export default function MenuProducts() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [view, setView] = useState('list');

  const filtered = useMemo(() => {
    return menuItems.filter(m => {
      const matchSearch = m.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = category === 'All' || m.category === category;
      return matchSearch && matchCat;
    });
  }, [search, category]);

  const grouped = useMemo(() => {
    const groups = {};
    filtered.forEach(m => {
      if (!groups[m.category]) groups[m.category] = [];
      groups[m.category].push(m);
    });
    return groups;
  }, [filtered]);

  return (
    <div className="flex flex-col gap-4" data-testid="menu-products-page">
      {/* Controls */}
      <motion.div {...fadeUp} className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
            data-testid="menu-search"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                category === c
                  ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                  : 'bg-[hsl(var(--muted)_/_0.5)] text-muted-foreground hover:text-foreground'
              }`}
              data-testid={`menu-filter-${c.toLowerCase()}`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <button onClick={() => setView('list')} className={`p-2 rounded-lg transition-colors ${view === 'list' ? 'bg-[hsl(var(--primary)_/_0.15)] text-[hsl(var(--primary))]' : 'text-muted-foreground hover:text-foreground'}`} data-testid="menu-view-list">
            <List className="h-4 w-4" />
          </button>
          <button onClick={() => setView('grid')} className={`p-2 rounded-lg transition-colors ${view === 'grid' ? 'bg-[hsl(var(--primary)_/_0.15)] text-[hsl(var(--primary))]' : 'text-muted-foreground hover:text-foreground'}`} data-testid="menu-view-grid">
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-sm font-medium hover:opacity-90 transition-colors ml-2" data-testid="add-item-btn">
            <Plus className="h-4 w-4" /> Add Item
          </button>
        </div>
      </motion.div>

      {/* List View */}
      {view === 'list' && (
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[hsl(var(--border))]">
                {['Item', 'Category', 'Price', 'Sold', 'Revenue', 'Cost', 'Margin'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                ))}
                <th className="w-20" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => {
                const margin = ((m.price - m.cost) / m.price * 100).toFixed(0);
                const marginColor = margin > 70 ? 'text-[hsl(var(--success))]' : margin > 50 ? 'text-[hsl(var(--warning))]' : 'text-[hsl(var(--danger))]';
                return (
                  <tr
                    key={m.id}
                    className="border-b border-[hsl(var(--border)_/_0.5)] hover:bg-[hsl(var(--muted)_/_0.3)] transition-colors group"
                    style={{ opacity: 1 }}
                  >
                    <td className="px-4 py-2.5 text-sm font-medium text-foreground">{m.name}</td>
                    <td className="px-4 py-2.5 text-sm text-muted-foreground">{m.category}</td>
                    <td className="px-4 py-2.5 text-sm text-foreground tabular-nums">${m.price}</td>
                    <td className="px-4 py-2.5 text-sm text-muted-foreground tabular-nums">{m.quantitySold}</td>
                    <td className="px-4 py-2.5 text-sm font-semibold text-foreground tabular-nums">${m.revenue}</td>
                    <td className="px-4 py-2.5 text-sm text-muted-foreground tabular-nums">${m.cost}</td>
                    <td className={`px-4 py-2.5 text-sm font-semibold tabular-nums ${marginColor}`}>{margin}%</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 rounded-md hover:bg-[hsl(var(--muted))]"><Edit2 className="h-3.5 w-3.5 text-muted-foreground" /></button>
                        <button className="p-1.5 rounded-md hover:bg-[hsl(var(--danger)_/_0.1)]"><Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-[hsl(var(--danger))]" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </motion.div>
      )}

      {/* Grid View */}
      {view === 'grid' && (
        <div className="flex flex-col gap-6">
          {Object.entries(grouped).map(([cat, items], ci) => (
            <motion.div key={cat} {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 + ci * 0.05 }}>
              <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-2">{cat}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {items.map((m, i) => (
                  <motion.div
                    key={m.id}
                    whileHover={{ y: -2 }}
                    className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3"
                  >
                    <p className="text-sm font-semibold text-foreground">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.quantitySold} sold &middot; ${m.revenue}</p>
                    <p className="text-sm font-bold text-foreground tabular-nums mt-1">${m.price}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
