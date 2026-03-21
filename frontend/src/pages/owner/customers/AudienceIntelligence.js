import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts';
import {
  Users, DollarSign, Music, TrendingUp, ChevronRight, ShoppingBag, Sparkles
} from 'lucide-react';

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] }
};

const tooltipStyle = {
  contentStyle: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E6E8EC',
    borderRadius: '8px',
    fontSize: '12px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
    color: '#111827'
  }
};

/* ── Data ── */

const genreData = [
  { genre: 'Techno', slug: 'techno', revenue: 68000, guests: 4200, retention: 32, avgSpend: 16.3, trend: 14 },
  { genre: 'House', slug: 'house', revenue: 58000, guests: 2800, retention: 28, avgSpend: 20.8, trend: 8 },
  { genre: 'Hip Hop', slug: 'hiphop', revenue: 43000, guests: 3600, retention: 15, avgSpend: 11.9, trend: -4 },
  { genre: 'Latin', slug: 'latin', revenue: 32000, guests: 1800, retention: 34, avgSpend: 18, trend: 18 },
  { genre: 'R&B / Soul', slug: 'rnb-soul', revenue: 25000, guests: 1200, retention: 26, avgSpend: 20.5, trend: 6 },
  { genre: 'Pop / Commercial', slug: 'pop-commercial', revenue: 29000, guests: 2400, retention: 20, avgSpend: 12, trend: -2 },
];

const ageData = [
  { range: '18–24', pct: 28, avgSpend: 62, category: 'Beer' },
  { range: '25–34', pct: 38, avgSpend: 95, category: 'Cocktails' },
  { range: '35–44', pct: 22, avgSpend: 142, category: 'Wine & Spirits' },
  { range: '45+', pct: 12, avgSpend: 180, category: 'Wine & Spirits' },
];

const genderData = [
  { name: 'Male', value: 52, color: '#3B82F6', avgSpend: 78, topCategory: 'Beer & Spirits' },
  { name: 'Female', value: 36, color: '#F59E0B', avgSpend: 108, topCategory: 'Cocktails' },
  { name: 'Not specified', value: 12, color: '#F0F1F3', avgSpend: 65, topCategory: 'Mixed' },
];

const segmentConsumption = [
  { name: 'VIP', avgSpend: 310, topCategory: 'Champagne', frequency: '4.2x/mo', revPct: '28%', badge: 'bg-[hsl(var(--primary)_/_0.1)] text-[hsl(var(--primary))]' },
  { name: 'Active', avgSpend: 156, topCategory: 'Cocktails', frequency: '2.8x/mo', revPct: '34%', badge: 'bg-[hsl(var(--success)_/_0.1)] text-[hsl(var(--success))]' },
  { name: 'New', avgSpend: 85, topCategory: 'Beer', frequency: '1.2x/mo', revPct: '12%', badge: 'bg-blue-500/10 text-blue-500' },
  { name: 'At Risk', avgSpend: 124, topCategory: 'Mixed', frequency: '0.8x/mo', revPct: '18%', badge: 'bg-[hsl(var(--warning)_/_0.1)] text-[hsl(var(--warning))]' },
  { name: 'Lost', avgSpend: 92, topCategory: 'Beer', frequency: '0x/mo', revPct: '8%', badge: 'bg-[hsl(var(--danger)_/_0.1)] text-[hsl(var(--danger))]' },
];

const radarChartData = genreData.map(g => ({
  genre: g.genre,
  Guests: Math.round((g.guests / 4200) * 100),
  Retention: Math.round((g.retention / 34) * 100),
}));

const audienceInsightsList = [
  { text: 'Techno events drive highest revenue but Latin shows strongest retention at 34%', type: 'positive', action: 'Explore' },
  { text: '25-34 age group represents 38% of audience — focus premium offerings here', type: 'neutral', action: 'Details' },
  { text: 'Hip Hop retention dropping (-4%) — consider event format refresh', type: 'warning', action: 'Fix' },
  { text: 'Female audience spends 27% more on average — expand cocktail menu diversity', type: 'positive', action: 'Apply' },
];

const recommendedActionsList = [
  { title: 'Launch Latin retention campaign', detail: 'Capitalize on 34% retention with loyalty incentives for Latin event regulars', impact: '+$4.2K/mo' },
  { title: 'Expand cocktail menu for 25-34 segment', detail: 'Core audience prefers cocktails — introduce premium craft cocktails', impact: '+$3.8K/mo' },
  { title: 'Refresh Hip Hop event format', detail: 'Retention dropping 4% — test guest DJs and themed nights', impact: '+$2.1K/mo' },
  { title: 'Target female audience with VIP packages', detail: '27% higher spend — create female-focused VIP experiences', impact: '+$5.6K/mo' },
];

const metricOptions = ['Revenue', 'Guests', 'Avg Spend', 'Retention'];
const metricKeys = { Revenue: 'revenue', Guests: 'guests', 'Avg Spend': 'avgSpend', Retention: 'retention' };

function tickFormatter(metric, value) {
  if (metric === 'Revenue') return `$${(value / 1000).toFixed(0)}K`;
  if (metric === 'Guests') return value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value;
  if (metric === 'Avg Spend') return `$${value}`;
  if (metric === 'Retention') return `${value}%`;
  return value;
}

/* ── Reusable Card ── */
function Card({ children, delay = 0, className = '', testId }) {
  return (
    <motion.div
      {...fadeUp}
      transition={{ ...fadeUp.transition, delay }}
      className={`rounded-xl border border-border bg-[hsl(var(--card))] p-5 ${className}`}
      data-testid={testId}
    >
      {children}
    </motion.div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle, right }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-[hsl(var(--primary)_/_0.1)] flex items-center justify-center">
          <Icon className="h-[18px] w-[18px] text-[hsl(var(--primary))]" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      {right}
    </div>
  );
}

/* ── Component ── */
export default function AudienceIntelligence() {
  const navigate = useNavigate();
  const [metric, setMetric] = useState('Revenue');

  const kpis = [
    { label: 'Total Audience', value: '16,000', sub: 'across all genres', icon: Users },
    { label: 'Genre Revenue', value: '$255K', sub: '6 genres tracked', icon: DollarSign },
    { label: 'Top Genre', value: 'Techno', sub: '$68K revenue', icon: Music },
    { label: 'Best Retention', value: 'Latin', sub: '34% return rate', icon: TrendingUp },
  ];

  return (
    <div className="flex flex-col gap-6" data-testid="audience-intelligence">

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: i * 0.04 }}
            className="rounded-xl border border-border bg-[hsl(var(--card))] p-4 flex flex-col gap-1"
            data-testid={`audience-kpi-${i}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{kpi.label}</span>
              <kpi.icon className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground tabular-nums">{kpi.value}</span>
            <span className="text-xs text-muted-foreground">{kpi.sub}</span>
          </motion.div>
        ))}
      </div>

      {/* ── Event & Genre Performance + Genre Breakdown ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart (span 2) */}
        <Card delay={0.1} className="lg:col-span-2" testId="genre-performance-chart">
          <SectionHeader
            icon={Music}
            title="Event & Genre Performance"
            subtitle="Click any genre for full drill-down"
            right={
              <div className="flex gap-1">
                {metricOptions.map(m => (
                  <button
                    key={m}
                    onClick={() => setMetric(m)}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-colors ${
                      metric === m
                        ? 'bg-[hsl(var(--primary)_/_0.15)] text-[hsl(var(--primary))]'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    data-testid={`metric-toggle-${m.toLowerCase().replace(/\s/g, '-')}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            }
          />
          <div className="h-[220px]" data-testid="genre-bar-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={genreData}>
                <CartesianGrid stroke="#EAECEF" strokeDasharray="3 3" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: '#6B7280' }}
                  tickLine={false}
                  axisLine={{ stroke: '#EAECEF' }}
                  tickFormatter={(v) => tickFormatter(metric, v)}
                />
                <YAxis
                  type="category"
                  dataKey="genre"
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                  tickLine={false}
                  axisLine={{ stroke: '#EAECEF' }}
                  width={100}
                />
                <Tooltip
                  {...tooltipStyle}
                  formatter={(v) => [tickFormatter(metric, v), metric]}
                />
                <Bar
                  dataKey={metricKeys[metric]}
                  fill="#60A5FA"
                  radius={[0, 4, 4, 0]}
                  cursor="pointer"
                  onClick={(data) => navigate(`/owner/customers/audience/${data.slug}`)}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Genre Breakdown */}
        <Card delay={0.15} testId="genre-breakdown">
          <SectionHeader icon={Music} title="Genre Breakdown" subtitle="Click for details" />
          <div className="flex flex-col gap-2">
            {genreData.map((g) => (
              <div
                key={g.slug}
                onClick={() => navigate(`/owner/customers/audience/${g.slug}`)}
                className="group p-3 rounded-lg bg-[hsl(var(--muted)_/_0.3)] hover:bg-[hsl(var(--muted)_/_0.5)] transition-colors cursor-pointer"
                data-testid={`genre-item-${g.slug}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-foreground">{g.genre}</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-semibold tabular-nums ${g.trend >= 0 ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--danger))]'}`}>
                      {g.trend >= 0 ? '+' : ''}{g.trend}%
                    </span>
                    <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span>${(g.revenue / 1000).toFixed(0)}K</span>
                  <span>{g.guests.toLocaleString()} guests</span>
                  <span>{g.retention}% ret</span>
                  <span>${g.avgSpend} avg</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Age Distribution + Gender Distribution ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Age Distribution */}
        <Card delay={0.2} testId="age-distribution">
          <SectionHeader icon={Users} title="Age Distribution" subtitle="From collected guest data" />
          <div className="flex flex-col gap-3">
            {ageData.map((a) => (
              <div key={a.range} className="flex items-center gap-3">
                <span className="text-xs font-medium text-muted-foreground w-12">{a.range}</span>
                <div className="flex-1 h-7 rounded-md bg-[hsl(var(--muted)_/_0.4)] relative overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${a.pct}%` }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="h-full rounded-md bg-blue-500/40"
                  />
                  <span className="absolute inset-0 flex items-center px-3 text-xs font-medium text-foreground">
                    {a.pct}%
                  </span>
                </div>
                <div className="text-right w-28">
                  <p className="text-xs font-semibold text-foreground">${a.avgSpend} avg</p>
                  <p className="text-[10px] text-muted-foreground">{a.category}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3 italic">
            25–34 age group is your core audience (38%) with strong cocktail preference
          </p>
        </Card>

        {/* Gender Distribution */}
        <Card delay={0.25} testId="gender-distribution">
          <SectionHeader icon={Users} title="Gender Distribution" subtitle="Explicitly collected data only" />
          <div className="flex items-center gap-6">
            <div className="w-[40%]">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={genderData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    innerRadius={30}
                    paddingAngle={4}
                    strokeWidth={0}
                  >
                    {genderData.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipStyle} formatter={(v) => [`${v}%`, '']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 flex flex-col gap-3">
              {genderData.map((d) => (
                <div key={d.name} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="text-sm font-semibold text-foreground">{d.name}</span>
                  <span className="text-xs font-bold text-foreground tabular-nums">{d.value}%</span>
                  <span className="text-[10px] text-muted-foreground">${d.avgSpend} avg &middot; {d.topCategory}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3 italic">
            Female audience shows 27% higher avg spend — driven by cocktail preference
          </p>
        </Card>
      </div>

      {/* ── Consumption by Segment ── */}
      <Card delay={0.3} testId="consumption-by-segment">
        <SectionHeader icon={ShoppingBag} title="Consumption by Segment" subtitle="Spend behavior per audience type" />
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {segmentConsumption.map((s) => (
            <div
              key={s.name}
              className="p-4 rounded-lg border border-border bg-[hsl(var(--muted)_/_0.2)]"
              data-testid={`segment-${s.name.toLowerCase().replace(/\s/g, '-')}`}
            >
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${s.badge}`}>{s.name}</span>
              <p className="text-lg font-bold text-foreground tabular-nums mt-2">${s.avgSpend}</p>
              <p className="text-[10px] text-muted-foreground">avg spend</p>
              <div className="mt-2 flex flex-col gap-1">
                {[
                  { label: 'Top category', value: s.topCategory },
                  { label: 'Frequency', value: s.frequency },
                  { label: '% Revenue', value: s.revPct, bold: true },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className={`text-foreground ${row.bold ? 'font-bold' : 'font-medium'}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Genre Audience Profile + Audience Insights ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <Card delay={0.35} testId="genre-audience-profile">
          <SectionHeader icon={Music} title="Genre Audience Profile" subtitle="Multi-dimensional comparison" />
          <div className="h-[260px]" data-testid="radar-chart">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarChartData}>
                <PolarGrid stroke="#EAECEF" />
                <PolarAngleAxis dataKey="genre" tick={{ fontSize: 10, fill: '#6B7280' }} />
                <Radar name="Guests" dataKey="Guests" stroke="#60A5FA" fill="#60A5FA" fillOpacity={0.15} />
                <Radar name="Retention" dataKey="Retention" stroke="#22C55E" fill="#22C55E" fillOpacity={0.1} />
                <Tooltip {...tooltipStyle} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Audience Insights */}
        <Card delay={0.4} testId="audience-insights">
          <SectionHeader icon={Sparkles} title="Audience Insights" subtitle="AI-powered observations" />
          <div className="flex flex-col gap-2">
            {audienceInsightsList.map((ins, i) => (
              <div
                key={i}
                className="group flex items-center gap-3 p-3 rounded-lg bg-[hsl(var(--muted)_/_0.3)] hover:bg-[hsl(var(--muted)_/_0.5)] cursor-pointer transition-colors"
                data-testid={`insight-${i}`}
              >
                <span className={`h-2 w-2 rounded-full shrink-0 ${
                  ins.type === 'positive' ? 'bg-[hsl(var(--success))]' :
                  ins.type === 'warning' ? 'bg-[hsl(var(--warning))]' :
                  'bg-[hsl(var(--primary))]'
                }`} />
                <span className="text-sm text-foreground flex-1">{ins.text}</span>
                <button className="text-xs font-semibold text-[hsl(var(--primary))] hover:underline opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  {ins.action}
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Recommended Actions ── */}
      <Card delay={0.45} testId="recommended-actions">
        <SectionHeader icon={TrendingUp} title="Recommended Actions" subtitle="Based on audience data" />
        <div className="flex flex-col gap-2">
          {recommendedActionsList.map((a, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-lg bg-[hsl(var(--muted)_/_0.3)] hover:bg-[hsl(var(--muted)_/_0.5)] cursor-pointer transition-colors"
              data-testid={`action-${i}`}
            >
              <span className="h-2 w-2 rounded-full shrink-0 bg-[hsl(var(--primary))]" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{a.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{a.detail}</p>
              </div>
              <span className="text-[10px] font-semibold text-[hsl(var(--success))] tabular-nums shrink-0">{a.impact}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
