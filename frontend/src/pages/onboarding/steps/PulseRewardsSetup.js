import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Star, Sparkles, Zap, Check, Wine, Ticket, Crown, Gift, Plus, X,
  Clock, TrendingUp } from 'lucide-react';
import { Button } from '../../../components/ui/button';

const TIER_COLORS = {
  Bronze: '#CD7F32', Silver: '#94A3B8', Gold: '#EAB308', Platinum: '#A78BFA',
};

const REWARD_CATEGORIES = [
  { id: 'drinks', label: 'Drinks', icon: Wine, color: 'text-blue-400' },
  { id: 'access', label: 'Access', icon: Ticket, color: 'text-purple-400' },
  { id: 'experience', label: 'Experience', icon: Crown, color: 'text-amber-400' },
  { id: 'custom', label: 'Custom', icon: Gift, color: 'text-pink-400' },
];

const CAMPAIGNS = [
  { emoji: '\u26A1', title: 'Double Points Friday', desc: '2x points on Fridays' },
  { emoji: '\u{1F37B}', title: 'Happy Hour Boost', desc: '3x points 2\u20135 PM' },
  { emoji: '\u{1F4B0}', title: 'Big Spender Bonus', desc: '+500 pts over $200' },
  { emoji: '\u{1F91D}', title: 'Refer a Friend', desc: 'Both earn 200 pts' },
];

const AI_SUGGESTIONS = [
  'Cocktails are your top seller \u2014 create a 2x points campaign?',
  'Low traffic 2\u20135 PM \u2014 boost with happy hour rewards?',
  'Top guests spend $300+ \u2014 reward them with VIP tier?',
];

const INSIGHTS = [
  { icon: Clock, color: 'text-red-400', text: 'Linda hasn\u2019t visited in 14 days \u2014 high-value guest at risk' },
  { icon: Crown, color: 'text-blue-400', text: '3 guests are close to VIP status \u2014 just 200 pts away' },
  { icon: TrendingUp, color: 'text-amber-400', text: 'Only 18% return rate \u2014 opportunity to grow with rewards' },
];

export default function PulseRewardsSetup({ data, updateData, onNext, onBack }) {
  const r = data.pulseRewards;
  const [mode, setMode] = useState(r.mode || 'overview');
  const [activeCat, setActiveCat] = useState('drinks');
  const [showAddReward, setShowAddReward] = useState(false);
  const [newRewardName, setNewRewardName] = useState('');
  const [newRewardCost, setNewRewardCost] = useState('');
  const [editTierId, setEditTierId] = useState(null);

  const update = (partial) => {
    updateData({ pulseRewards: { ...r, ...partial } });
  };

  const ppd = parseInt(r.pointsPerDollar) || 2;
  const previewPts = 80 * ppd;

  const useQuickSetup = () => {
    update({ mode: 'overview' });
    onNext();
  };

  const catRewards = r.rewards.filter(rw => rw.category === activeCat);

  const addReward = () => {
    if (!newRewardName.trim() || !newRewardCost.trim()) return;
    const nr = { id: Date.now().toString(), name: newRewardName.trim(), pointsCost: newRewardCost.trim(), category: activeCat };
    update({ rewards: [...r.rewards, nr] });
    setNewRewardName('');
    setNewRewardCost('');
    setShowAddReward(false);
  };

  const removeReward = (id) => {
    update({ rewards: r.rewards.filter(rw => rw.id !== id) });
  };

  const toggleAutomation = (key) => {
    update({ automationRules: { ...r.automationRules, [key]: !r.automationRules[key] } });
  };

  const updateTier = (id, field, value) => {
    update({ tiers: r.tiers.map(t => t.id === id ? { ...t, [field]: value } : t) });
  };

  return (
    <div data-testid="onboarding-rewards-setup" className="w-full max-w-2xl mx-auto pb-8 space-y-6">
      {/* Hero Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/[0.08] text-primary text-xs font-medium">
          <Sparkles size={12} />
          Revenue Engine
        </div>
        <h1
          className="text-2xl font-bold tracking-tight text-foreground"
          style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}
        >
          Turn Every Visit into a Reason to Come Back
        </h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Create a loyalty experience that increases repeat visits, guest spend, and VIP engagement automatically.
        </p>
      </div>

      {/* Live Preview Card */}
      <div className="rounded-2xl bg-gradient-to-br from-card to-card/80 border border-border/60 p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
        <div className="flex items-center gap-3 relative">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">J</div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-foreground">John just spent $80 &rarr; +{previewPts} pts</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-emerald-400 font-medium">Unlocked: Free Drink</span>
              <span className="text-xs text-muted-foreground">&bull; {5000 - previewPts} pts to VIP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Setup */}
      {mode === 'overview' && (
        <div className="border-2 border-primary/20 bg-primary/[0.03] rounded-2xl p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Zap size={20} className="text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">Recommended Setup</span>
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Most venues use this</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              ['Points per $1', `${ppd}x`],
              ['Tiers', 'Bronze \u2192 Platinum'],
              ['VIP Unlock', '5,000 pts'],
              ['Rewards', '6 included'],
            ].map(([label, value]) => (
              <div key={label} className="p-3 rounded-xl bg-card/60 border border-border/40">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
                <div className="text-sm font-bold text-foreground mt-0.5">{value}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button data-testid="rewards-use-setup" onClick={useQuickSetup} className="flex-1">
              Use this setup
            </Button>
            <Button data-testid="rewards-customize" variant="outline" onClick={() => setMode('custom')}>
              Customize manually
            </Button>
          </div>
        </div>
      )}

      {/* Impact Panel */}
      <div className="grid grid-cols-3 gap-3">
        {[
          ['+27%', 'repeat visits'],
          ['+18%', 'average spend'],
          ['+32%', 'tips increase'],
        ].map(([num, label]) => (
          <div key={label} className="p-3 rounded-xl bg-[hsl(var(--success)/0.05)] text-center">
            <div className="text-lg font-bold text-[hsl(var(--success))]">{num}</div>
            <div className="text-[10px] text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground text-center">Based on similar venues</p>

      {/* Custom Mode Sections */}
      {mode === 'custom' && (
        <>
          {/* Point Rules */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Star size={16} className="text-amber-400" />
              </div>
              <span className="text-sm font-bold text-foreground">How guests earn points</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                ['Points per $1', 'pointsPerDollar', r.pointsPerDollar],
                ['Daily Limit', 'dailyLimit', r.dailyLimit],
                ['Max / Visit', 'maxPerVisit', r.maxPerVisit],
              ].map(([label, key, val]) => (
                <div key={key}>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">{label}</label>
                  <input
                    type="number"
                    value={val}
                    onChange={(e) => update({ [key]: e.target.value })}
                    className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground">Most venues use 1\u20133 pts per $1</p>
          </div>

          {/* Progression Tiers */}
          <div className="space-y-3">
            <span className="text-sm font-bold text-foreground">Progression Tiers</span>
            <div className="flex items-center gap-0.5 h-2 rounded-full overflow-hidden">
              {r.tiers.map((t, i) => (
                <React.Fragment key={t.id}>
                  <div className="flex-1 h-full" style={{ backgroundColor: t.color + '40' }} />
                  {i < r.tiers.length - 1 && <div className="w-1" />}
                </React.Fragment>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {r.tiers.map((tier) => (
                <div
                  key={tier.id}
                  className="relative p-4 rounded-xl border border-border/60 bg-card/50 overflow-hidden cursor-pointer"
                  onClick={() => setEditTierId(editTierId === tier.id ? null : tier.id)}
                >
                  <div className="absolute top-0 right-0 w-16 h-16 rounded-bl-full opacity-20" style={{ backgroundColor: tier.color }} />
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: tier.color + '30' }}>
                      <Star size={12} style={{ color: tier.color }} />
                    </div>
                    <span className="text-sm font-bold" style={{ color: tier.color }}>{tier.name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{tier.minPoints} pts</div>
                  <div className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{tier.description}</div>
                  {editTierId === tier.id && (
                    <div className="mt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={tier.name}
                        onChange={(e) => updateTier(tier.id, 'name', e.target.value)}
                        className="w-full h-8 px-2 bg-background border border-border rounded-md text-xs"
                      />
                      <input
                        type="number"
                        value={tier.minPoints}
                        onChange={(e) => updateTier(tier.id, 'minPoints', e.target.value)}
                        placeholder="Min points"
                        className="w-full h-8 px-2 bg-background border border-border rounded-md text-xs"
                      />
                      <input
                        type="text"
                        value={tier.description}
                        onChange={(e) => updateTier(tier.id, 'description', e.target.value)}
                        className="w-full h-8 px-2 bg-background border border-border rounded-md text-xs"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Elite Tiers */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-foreground/[0.02] to-foreground/[0.04] space-y-3">
            <span className="text-sm font-bold text-foreground">Elite Tiers</span>
            {/* Diamond */}
            <div className="p-4 rounded-xl border border-sky-400/30 bg-sky-400/5">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-lg bg-sky-400/20 flex items-center justify-center">
                  <Star size={12} className="text-sky-400" />
                </div>
                <span className="text-sm font-bold text-sky-400">Diamond</span>
                <span className="text-[10px] text-muted-foreground ml-auto">{r.diamondMinPoints}+ pts</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Reserved for highest-spending guests</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {['20% discount', 'Private lounge', 'Dedicated concierge'].map(b => (
                  <span key={b} className="text-[10px] bg-sky-400/10 text-sky-400 px-2 py-0.5 rounded-full">{b}</span>
                ))}
              </div>
            </div>
            {/* VIP */}
            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <Crown size={12} className="text-amber-500" />
                  </div>
                  <span className="text-sm font-bold text-amber-500">VIP</span>
                  <span className="text-[10px] text-muted-foreground">Invite-only</span>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">Not everyone gets here. Grant access manually.</p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-foreground font-medium">Manual invite only</span>
                <button
                  data-testid="vip-manual-toggle"
                  onClick={() => update({ vipManualOnly: !r.vipManualOnly })}
                  className={`relative w-10 h-5 rounded-full transition-colors ${r.vipManualOnly ? 'bg-primary' : 'bg-muted'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${r.vipManualOnly ? 'left-5.5 translate-x-0' : 'left-0.5'}`}
                    style={{ left: r.vipManualOnly ? '22px' : '2px' }}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Rewards by Category */}
          <div className="space-y-3">
            <span className="text-sm font-bold text-foreground">Rewards</span>
            <div className="flex gap-1 p-1 rounded-lg bg-muted/50">
              {REWARD_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCat(cat.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all ${
                      activeCat === cat.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                    }`}
                  >
                    <Icon size={12} />
                    {cat.label}
                  </button>
                );
              })}
            </div>
            <div className="space-y-2">
              {catRewards.map((rw) => (
                <div key={rw.id} className="group flex items-center gap-3 p-3 rounded-xl border border-border/30 bg-card/50">
                  <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center">
                    {React.createElement(REWARD_CATEGORIES.find(c => c.id === rw.category)?.icon || Gift, { size: 14, className: 'text-muted-foreground' })}
                  </div>
                  <span className="text-sm font-medium text-foreground flex-1">{rw.name}</span>
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{rw.pointsCost} pts</span>
                  <button onClick={() => removeReward(rw.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive">
                    <X size={14} />
                  </button>
                </div>
              ))}
              {showAddReward ? (
                <div className="flex gap-2">
                  <input type="text" value={newRewardName} onChange={(e) => setNewRewardName(e.target.value)}
                    placeholder="Reward name" className="flex-1 h-9 px-3 bg-background border border-border rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary/40" />
                  <input type="text" value={newRewardCost} onChange={(e) => setNewRewardCost(e.target.value)}
                    placeholder="Points" className="w-20 h-9 px-3 bg-background border border-border rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary/40" />
                  <Button size="sm" onClick={addReward}><Plus size={12} /></Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setShowAddReward(true)} className="w-full">
                  <Plus size={12} className="mr-1" /> Add reward
                </Button>
              )}
            </div>
          </div>

          {/* Automation Rules */}
          <div className="space-y-3">
            <span className="text-sm font-bold text-foreground">Automation</span>
            {[
              ['autoUpgrade', 'Auto-upgrade tier'],
              ['instantRewardUnlock', 'Instant reward unlock'],
              ['notifyGuest', 'Notify guest via app'],
              ['downgradeAfterInactivity', 'Downgrade after 90 days inactivity'],
            ].map(([key, label]) => (
              <div key={key} className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-card/50">
                <span className="text-sm text-foreground">{label}</span>
                <button
                  data-testid={`automation-${key}`}
                  onClick={() => toggleAutomation(key)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${r.automationRules[key] ? 'bg-primary' : 'bg-muted'}`}
                >
                  <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
                    style={{ left: r.automationRules[key] ? '22px' : '2px' }}
                  />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Campaigns */}
      <div className="space-y-3">
        <span className="text-sm font-bold text-foreground">Campaign Previews</span>
        <div className="grid grid-cols-2 gap-2">
          {CAMPAIGNS.map((c) => (
            <div key={c.title} className="p-3 rounded-xl border border-border/40 bg-card/50">
              <div className="text-lg mb-1">{c.emoji}</div>
              <div className="text-xs font-bold text-foreground">{c.title}</div>
              <div className="text-[10px] text-muted-foreground">{c.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Suggestions */}
      <div className="space-y-2">
        <span className="text-sm font-bold text-foreground">AI Suggestions</span>
        {AI_SUGGESTIONS.map((s, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-amber-500/20 bg-amber-500/5">
            <Sparkles size={14} className="text-amber-400 flex-shrink-0" />
            <span className="text-xs text-foreground flex-1">{s}</span>
            <button className="text-xs font-medium text-amber-400 hover:underline whitespace-nowrap">Apply</button>
          </div>
        ))}
      </div>

      {/* Insights */}
      <div className="space-y-2">
        <span className="text-sm font-bold text-foreground">Insights Preview</span>
        {INSIGHTS.map((ins, i) => {
          const Icon = ins.icon;
          return (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-card/50">
              <Icon size={14} className={ins.color} />
              <span className="text-xs text-foreground">{ins.text}</span>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-3 pt-4">
        <Button variant="ghost" onClick={onBack} className="text-muted-foreground">
          <ArrowLeft size={16} className="mr-1" /> Back
        </Button>
        <Button
          data-testid="rewards-activate"
          onClick={onNext}
          className="flex-1 shadow-lg"
        >
          <Sparkles size={14} className="mr-1" />
          Activate Loyalty System
          <ArrowRight size={14} className="ml-1" />
        </Button>
      </div>
      <button
        data-testid="rewards-skip"
        onClick={onNext}
        className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        Skip for now
      </button>
    </div>
  );
}
