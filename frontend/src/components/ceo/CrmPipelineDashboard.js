import React, { useState } from 'react';
import { Search, Plus, DollarSign, Building2, Tag, User, ChevronDown } from 'lucide-react';
import { PageHeader, ChartCard } from './shared';

const STAGES = ['New', 'Qualification', 'Presentation', 'Negotiation', 'Evaluation', 'Won'];
const STAGE_COLORS = {
  New: '#3b82f6', Qualification: '#f59e0b', Presentation: '#8b5cf6',
  Negotiation: '#ef4444', Evaluation: '#06b6d4', Won: '#10b981',
};

const MOCK_DEALS = [
  { id: '1', title: 'Spet OS Enterprise', company: 'NightVibe Inc.', value: 24000, stage: 'New', tags: ['Enterprise', 'Q1'] },
  { id: '2', title: 'Spet Sync Setup', company: 'ClubMatrix LLC', value: 12000, stage: 'New', tags: ['Mid-Market'] },
  { id: '3', title: 'Expansion — Spet Flow', company: 'Bar Central', value: 8400, stage: 'Qualification', tags: ['Expansion'] },
  { id: '4', title: 'Full Platform Deal', company: 'EventPro Corp', value: 36000, stage: 'Qualification', tags: ['Enterprise', 'Annual'] },
  { id: '5', title: 'Spet Core Migration', company: 'Lounge 360', value: 6000, stage: 'Presentation', tags: ['Migration'] },
  { id: '6', title: 'Multi-Venue Bundle', company: 'HospGroup SA', value: 48000, stage: 'Negotiation', tags: ['Enterprise', 'Multi-Venue'] },
  { id: '7', title: 'Spet Sync Annual', company: 'DineFlow Inc.', value: 14400, stage: 'Negotiation', tags: ['Annual'] },
  { id: '8', title: 'Spet OS — Pilot', company: 'MixLab Studios', value: 9600, stage: 'Evaluation', tags: ['Pilot'] },
  { id: '9', title: 'Spet Core — Won', company: 'TapHouse Co.', value: 4800, stage: 'Won', tags: ['SMB'] },
  { id: '10', title: 'Full Stack Deal', company: 'Premier Events', value: 28800, stage: 'Won', tags: ['Enterprise'] },
];

export default function CrmPipelineDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const filtered = MOCK_DEALS.filter(d =>
    d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div data-testid="ceo-crm-pipeline">
      <PageHeader title="CRM Pipeline" subtitle="Deal stages, pipeline value, and opportunity tracking">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search deals..."
            className="h-8 pl-8 pr-3 text-[12px] rounded-lg border border-border bg-transparent focus:outline-none focus:ring-1 focus:ring-primary/30 w-48"
          />
        </div>
      </PageHeader>

      {/* Kanban Board */}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {STAGES.map(stage => {
          const deals = filtered.filter(d => d.stage === stage);
          const total = deals.reduce((s, d) => s + d.value, 0);
          return (
            <div key={stage} className="min-w-[200px] flex-1">
              {/* Stage Header */}
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STAGE_COLORS[stage] }} />
                  <span className="text-[11px] font-bold text-foreground">{stage}</span>
                  <span className="text-[10px] font-bold bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{deals.length}</span>
                </div>
                <span className="text-[10px] font-semibold" style={{ color: 'hsl(var(--text-tertiary))' }}>
                  ${total.toLocaleString()}
                </span>
              </div>

              {/* Deal Cards */}
              <div className="space-y-2">
                {deals.map(deal => (
                  <div key={deal.id} className="bg-card border border-border rounded-lg p-3 transition-all hover:border-primary/20 hover:shadow-sm cursor-pointer">
                    <p className="text-[12px] font-semibold text-foreground mb-1 leading-tight">{deal.title}</p>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Building2 className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px]" style={{ color: 'hsl(var(--text-secondary))' }}>{deal.company}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold" style={{ color: STAGE_COLORS[stage] }}>
                        ${deal.value.toLocaleString()}
                      </span>
                      <div className="flex gap-1">
                        {deal.tags.map(tag => (
                          <span key={tag} className="text-[8px] font-medium bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                {deals.length === 0 && (
                  <div className="border border-dashed border-border rounded-lg p-4 text-center">
                    <p className="text-[10px] text-muted-foreground">No deals</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
