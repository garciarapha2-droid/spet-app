import React, { useState } from 'react';
import { ArrowLeft, Plus, Square, Circle, Minus, Users, Pencil, Trash2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';

const ZONE_COLORS = {
  Main: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  VIP: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  Patio: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  Bar: { bg: 'bg-violet-500/20', text: 'text-violet-400', border: 'border-violet-500/30' },
};

const SHAPES = [
  { id: 'square', label: 'Square', icon: Square },
  { id: 'round', label: 'Round', icon: Circle },
  { id: 'bar', label: 'Bar', icon: Minus },
];

const ZONES = ['Main', 'VIP', 'Patio', 'Bar'];

function ShapeIcon({ shape, size = 14 }) {
  if (shape === 'round') return <Circle size={size} />;
  if (shape === 'bar') return <Minus size={size} />;
  return <Square size={size} />;
}

export default function TableSetup({ data, updateData, onNext, onBack }) {
  const tables = data.tables;
  const [genCount, setGenCount] = useState('10');
  const [editTable, setEditTable] = useState(null);

  const generateTables = () => {
    const n = Math.min(Math.max(parseInt(genCount) || 1, 1), 100);
    const newTables = Array.from({ length: n }, (_, i) => ({
      id: Date.now().toString() + '_' + i,
      name: `Table #${i + 1}`,
      capacity: 4,
      shape: 'square',
      zone: 'Main',
      isMergeable: false,
      x: (i % 5) * 140,
      y: Math.floor(i / 5) * 140,
      width: 100,
      height: 80,
    }));
    updateData({ tables: newTables });
  };

  const addTable = () => {
    const nt = {
      id: Date.now().toString(),
      name: `Table #${tables.length + 1}`,
      capacity: 4,
      shape: 'square',
      zone: 'Main',
      isMergeable: false,
      x: (tables.length % 5) * 140,
      y: Math.floor(tables.length / 5) * 140,
      width: 100,
      height: 80,
    };
    updateData({ tables: [...tables, nt] });
  };

  const updateTable = (id, changes) => {
    updateData({ tables: tables.map(t => t.id === id ? { ...t, ...changes } : t) });
    if (editTable?.id === id) setEditTable({ ...editTable, ...changes });
  };

  const deleteTable = (id) => {
    updateData({ tables: tables.filter(t => t.id !== id) });
    setEditTable(null);
  };

  const saveEdit = () => {
    if (editTable) {
      updateData({ tables: tables.map(t => t.id === editTable.id ? editTable : t) });
    }
    setEditTable(null);
  };

  const zc = (zone) => ZONE_COLORS[zone] || ZONE_COLORS.Main;

  return (
    <div data-testid="onboarding-table-setup" className="w-full space-y-5">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-2">
          <Square size={12} />
          TABLE Module
        </div>
        <h1
          className="text-2xl font-bold tracking-tight text-foreground"
          style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}
        >
          Set up your tables
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Define how your seating works.</p>
      </div>

      {/* Generation Section */}
      {tables.length === 0 && (
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="text-sm font-medium text-foreground mb-1.5 block">How many tables?</label>
            <input
              data-testid="table-gen-count"
              type="number"
              min="1"
              max="100"
              value={genCount}
              onChange={(e) => setGenCount(e.target.value)}
              className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <Button data-testid="table-generate" onClick={generateTables}>
            <Plus size={14} className="mr-1" /> Generate tables
          </Button>
        </div>
      )}

      {/* Tables Grid */}
      {tables.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">{tables.length} table(s) configured</span>
            <Button variant="outline" size="sm" onClick={addTable}>
              <Plus size={12} className="mr-1" /> Add table
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
            {tables.map((table) => {
              const z = zc(table.zone);
              return (
                <div
                  key={table.id}
                  data-testid={`table-card-${table.id}`}
                  className="group relative p-4 rounded-xl border border-border/50 bg-card/50 hover:border-primary/30 transition-all cursor-pointer"
                  onClick={() => setEditTable({ ...table })}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <ShapeIcon shape={table.shape} size={14} />
                    <span className="text-sm font-semibold text-foreground truncate">{table.name}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                    <Users size={10} /> {table.capacity}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${z.bg} ${z.text} ${z.border}`}>
                      {table.zone}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      FREE
                    </span>
                  </div>
                  <button className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity">
                    <Pencil size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <Dialog open={!!editTable} onOpenChange={(open) => !open && setEditTable(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Table</DialogTitle>
          </DialogHeader>
          {editTable && (
            <div className="space-y-4 py-2">
              <div>
                <label className="text-sm font-medium mb-1 block">Table name</label>
                <input
                  type="text"
                  value={editTable.name}
                  onChange={(e) => setEditTable({ ...editTable, name: e.target.value })}
                  className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Capacity</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={editTable.capacity}
                  onChange={(e) => setEditTable({ ...editTable, capacity: parseInt(e.target.value) || 1 })}
                  className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Shape</label>
                <div className="flex gap-2">
                  {SHAPES.map((s) => {
                    const Icon = s.icon;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setEditTable({ ...editTable, shape: s.id })}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                          editTable.shape === s.id
                            ? 'border-primary bg-primary/[0.08] text-primary'
                            : 'border-border text-muted-foreground hover:border-primary/30'
                        }`}
                      >
                        <Icon size={14} /> {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Zone</label>
                <div className="flex gap-2 flex-wrap">
                  {ZONES.map((z) => (
                    <button
                      key={z}
                      onClick={() => setEditTable({ ...editTable, zone: z })}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        editTable.zone === z
                          ? `${zc(z).bg} ${zc(z).text} ${zc(z).border}`
                          : 'border-border text-muted-foreground hover:border-primary/30'
                      }`}
                    >
                      {z}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Can be combined</span>
                <button
                  onClick={() => setEditTable({ ...editTable, isMergeable: !editTable.isMergeable })}
                  className={`relative w-10 h-5 rounded-full transition-colors ${editTable.isMergeable ? 'bg-primary' : 'bg-muted'}`}
                >
                  <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
                    style={{ left: editTable.isMergeable ? '22px' : '2px' }}
                  />
                </button>
              </div>
            </div>
          )}
          <DialogFooter className="flex justify-between">
            <Button variant="ghost" size="sm" onClick={() => editTable && deleteTable(editTable.id)} className="text-destructive hover:text-destructive">
              <Trash2 size={14} className="mr-1" /> Delete
            </Button>
            <Button size="sm" onClick={saveEdit}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Navigation */}
      <div className="flex items-center gap-3 pt-2">
        <Button variant="ghost" onClick={onBack} className="text-muted-foreground">
          <ArrowLeft size={16} className="mr-1" /> Back
        </Button>
        <Button onClick={onNext} className="flex-1">Continue</Button>
      </div>
    </div>
  );
}
