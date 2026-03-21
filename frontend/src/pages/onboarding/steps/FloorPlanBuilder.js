import React, { useState, useRef, useCallback } from 'react';
import { ArrowLeft, Plus, ZoomIn, ZoomOut, Maximize2, Users, Square, Circle, Minus } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';

const SHAPES = [
  { id: 'square', label: 'Square', icon: Square },
  { id: 'round', label: 'Round', icon: Circle },
  { id: 'bar', label: 'Bar', icon: Minus },
];

const ZONES = ['Main', 'VIP', 'Patio', 'Bar'];

export default function FloorPlanBuilder({ data, updateData, onNext, onBack }) {
  const tables = data.tables;
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState(null);
  const [resizing, setResizing] = useState(null);
  const [newShape, setNewShape] = useState('square');
  const [editTable, setEditTable] = useState(null);

  const updateTable = useCallback((id, changes) => {
    updateData({ tables: tables.map(t => t.id === id ? { ...t, ...changes } : t) });
  }, [tables, updateData]);

  const addTable = () => {
    const nt = {
      id: Date.now().toString(),
      name: `Table #${tables.length + 1}`,
      capacity: 4,
      shape: newShape,
      zone: 'Main',
      isMergeable: false,
      x: 20,
      y: 20,
      width: 100,
      height: 80,
    };
    updateData({ tables: [...tables, nt] });
  };

  const deleteTable = (id) => {
    updateData({ tables: tables.filter(t => t.id !== id) });
    setEditTable(null);
  };

  const handleMouseDown = (e, tableId) => {
    if (e.target.dataset.resize) return;
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    setDragging({
      id: tableId,
      offsetX: (e.clientX - rect.left) / zoom - table.x,
      offsetY: (e.clientY - rect.top) / zoom - table.y,
    });
  };

  const handleResizeDown = (e, tableId) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = canvasRef.current.getBoundingClientRect();
    setResizing({
      id: tableId,
      startX: e.clientX,
      startY: e.clientY,
      startW: tables.find(t => t.id === tableId)?.width || 100,
      startH: tables.find(t => t.id === tableId)?.height || 80,
    });
  };

  const handleMouseMove = useCallback((e) => {
    if (dragging) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = Math.max(0, (e.clientX - rect.left) / zoom - dragging.offsetX);
      const y = Math.max(0, (e.clientY - rect.top) / zoom - dragging.offsetY);
      updateTable(dragging.id, { x, y });
    }
    if (resizing) {
      const dx = (e.clientX - resizing.startX) / zoom;
      const dy = (e.clientY - resizing.startY) / zoom;
      const w = Math.max(50, resizing.startW + dx);
      const h = Math.max(40, resizing.startH + dy);
      updateTable(resizing.id, { width: w, height: h });
    }
  }, [dragging, resizing, zoom, updateTable]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
    setResizing(null);
  }, []);

  const handleDoubleClick = (table) => {
    setEditTable({ ...table });
  };

  const saveEdit = () => {
    if (editTable) {
      updateData({ tables: tables.map(t => t.id === editTable.id ? editTable : t) });
    }
    setEditTable(null);
  };

  const getBorderRadius = (shape) => {
    if (shape === 'round') return '50%';
    if (shape === 'bar') return '12px';
    return '10px';
  };

  return (
    <div data-testid="onboarding-floor-plan" className="w-full space-y-4">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-2">
          <Maximize2 size={12} />
          Floor Plan
        </div>
        <h1
          className="text-2xl font-bold tracking-tight text-foreground"
          style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}
        >
          Arrange your floor plan
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Position your tables to match your venue layout.</p>
      </div>

      {/* Layout: tools + canvas */}
      <div className="flex gap-3" style={{ height: 480 }}>
        {/* Tools Panel */}
        <div className="w-48 flex flex-col gap-3 flex-shrink-0">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Shape</label>
            <div className="flex gap-1">
              {SHAPES.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    onClick={() => setNewShape(s.id)}
                    className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg border text-xs transition-all ${
                      newShape === s.id
                        ? 'border-primary bg-primary/[0.08] text-primary'
                        : 'border-border text-muted-foreground'
                    }`}
                  >
                    <Icon size={14} />
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>
          <Button data-testid="floor-add-table" onClick={addTable} className="w-full">
            <Plus size={14} className="mr-1" /> Add table
          </Button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
              className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground"
            >
              <ZoomOut size={14} />
            </button>
            <span className="text-xs text-muted-foreground flex-1 text-center">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(z => Math.min(2, z + 0.1))}
              className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground"
            >
              <ZoomIn size={14} />
            </button>
          </div>
          <div className="text-xs text-muted-foreground text-center">{tables.length} tables</div>
        </div>

        {/* Canvas */}
        <div
          ref={canvasRef}
          className="flex-1 relative bg-background/30 rounded-xl border border-border overflow-hidden"
          style={{ cursor: dragging ? 'grabbing' : 'default' }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Grid pattern */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.04 }}>
            <defs>
              <pattern id="grid" width={20 * zoom} height={20 * zoom} patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="1" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Tables */}
          {tables.map((table) => {
            const isDragging = dragging?.id === table.id;
            return (
              <div
                key={table.id}
                data-testid={`floor-table-${table.id}`}
                className={`absolute flex flex-col items-center justify-center border-2 transition-shadow ${
                  isDragging ? 'border-primary shadow-lg z-10' : 'border-border/60 hover:border-primary/50 hover:shadow-lg'
                }`}
                style={{
                  left: table.x * zoom,
                  top: table.y * zoom,
                  width: table.width * zoom,
                  height: table.height * zoom,
                  borderRadius: getBorderRadius(table.shape),
                  cursor: dragging ? 'grabbing' : 'grab',
                  backgroundColor: 'hsl(var(--card) / 0.8)',
                }}
                onMouseDown={(e) => handleMouseDown(e, table.id)}
                onDoubleClick={() => handleDoubleClick(table)}
              >
                <span className="text-[10px] font-bold text-foreground truncate px-1" style={{ fontSize: Math.max(8, 10 * zoom) }}>
                  {table.name}
                </span>
                <div className="flex items-center gap-0.5 mt-0.5">
                  <Users size={Math.max(6, 8 * zoom)} className="text-muted-foreground" />
                  <span className="text-muted-foreground" style={{ fontSize: Math.max(7, 9 * zoom) }}>{table.capacity}</span>
                </div>
                <span className="text-emerald-400 font-bold mt-0.5" style={{ fontSize: Math.max(6, 8 * zoom) }}>FREE</span>

                {/* Resize handle */}
                <div
                  data-resize="true"
                  className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
                  onMouseDown={(e) => handleResizeDown(e, table.id)}
                  style={{ borderRight: '2px solid hsl(var(--border))', borderBottom: '2px solid hsl(var(--border))' }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={!!editTable} onOpenChange={(open) => !open && setEditTable(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Edit Table</DialogTitle></DialogHeader>
          {editTable && (
            <div className="space-y-4 py-2">
              <div>
                <label className="text-sm font-medium mb-1 block">Table name</label>
                <input type="text" value={editTable.name}
                  onChange={(e) => setEditTable({ ...editTable, name: e.target.value })}
                  className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Capacity</label>
                <input type="number" min="1" max="50" value={editTable.capacity}
                  onChange={(e) => setEditTable({ ...editTable, capacity: parseInt(e.target.value) || 1 })}
                  className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Shape</label>
                <div className="flex gap-2">
                  {SHAPES.map((s) => {
                    const Icon = s.icon;
                    return (
                      <button key={s.id} onClick={() => setEditTable({ ...editTable, shape: s.id })}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border text-sm font-medium ${
                          editTable.shape === s.id ? 'border-primary bg-primary/[0.08] text-primary' : 'border-border text-muted-foreground'
                        }`}>
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
                    <button key={z} onClick={() => setEditTable({ ...editTable, zone: z })}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                        editTable.zone === z ? 'border-primary bg-primary/[0.08] text-primary' : 'border-border text-muted-foreground'
                      }`}>
                      {z}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Can be combined</span>
                <button onClick={() => setEditTable({ ...editTable, isMergeable: !editTable.isMergeable })}
                  className={`relative w-10 h-5 rounded-full transition-colors ${editTable.isMergeable ? 'bg-primary' : 'bg-muted'}`}>
                  <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
                    style={{ left: editTable.isMergeable ? '22px' : '2px' }} />
                </button>
              </div>
            </div>
          )}
          <DialogFooter className="flex justify-between">
            <Button variant="ghost" size="sm" onClick={() => editTable && deleteTable(editTable.id)} className="text-destructive">
              Delete
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
