import React, { useState, useEffect } from 'react';
import { PulseHeader } from '../../components/PulseHeader';
import { rewardsAPI } from '../../services/api';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Gift, Star, Trophy, Settings, Plus, Trash2, Save } from 'lucide-react';

const VENUE_ID = () => localStorage.getItem('active_venue_id') || '40a24e04-75b6-435d-bfff-ab0d469ce543';

export const PulseRewardsPage = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [tiers, setTiers] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [pointsPerReal, setPointsPerReal] = useState(1);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await rewardsAPI.getConfig(VENUE_ID());
        setConfig(res.data);
        setTiers(res.data.tiers || []);
        setRewards(res.data.rewards || []);
        setPointsPerReal(res.data.points_per_real || 1);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSaveConfig = async () => {
    try {
      const fd = new FormData();
      fd.append('venue_id', VENUE_ID());
      fd.append('enabled', 'true');
      fd.append('points_per_real', pointsPerReal.toString());
      await rewardsAPI.saveConfig(fd);

      const tiersFd = new FormData();
      tiersFd.append('venue_id', VENUE_ID());
      tiersFd.append('tiers_json', JSON.stringify(tiers));
      await rewardsAPI.updateTiers(tiersFd);

      const rewardsFd = new FormData();
      rewardsFd.append('venue_id', VENUE_ID());
      rewardsFd.append('rewards_json', JSON.stringify(rewards));
      await rewardsAPI.updateRewards(rewardsFd);

      toast.success('Rewards configuration saved!');
      setEditing(false);
    } catch (err) {
      toast.error('Failed to save');
    }
  };

  const addTier = () => {
    setTiers([...tiers, { name: '', min_points: 0, color: '#888888', perks: '' }]);
  };

  const removeTier = (idx) => {
    setTiers(tiers.filter((_, i) => i !== idx));
  };

  const updateTier = (idx, field, value) => {
    setTiers(tiers.map((t, i) => i === idx ? { ...t, [field]: value } : t));
  };

  const addReward = () => {
    setRewards([...rewards, { id: '', name: '', points_cost: 0, active: true }]);
  };

  const removeReward = (idx) => {
    setRewards(rewards.filter((_, i) => i !== idx));
  };

  const updateReward = (idx, field, value) => {
    setRewards(rewards.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PulseHeader />
        <div className="flex items-center justify-center py-32 text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="rewards-page">
      <PulseHeader />
      <main className="w-full max-w-[1200px] mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-1">Loyalty & Rewards</h2>
            <p className="text-muted-foreground">Configure points, tiers, and rewards for your venue</p>
          </div>
          {!editing ? (
            <Button onClick={() => setEditing(true)} data-testid="edit-config-btn">
              <Settings className="h-4 w-4 mr-2" /> Edit Configuration
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={handleSaveConfig} data-testid="save-config-btn">
                <Save className="h-4 w-4 mr-2" /> Save
              </Button>
              <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          )}
        </div>

        {/* Points config */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" /> Points Configuration
          </h3>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Points earned per $1 spent:</span>
            {editing ? (
              <Input type="number" value={pointsPerReal}
                onChange={e => setPointsPerReal(parseInt(e.target.value) || 1)}
                className="w-24" min={1} data-testid="points-per-real" />
            ) : (
              <span className="text-xl font-bold">{pointsPerReal}</span>
            )}
          </div>
        </div>

        {/* Tiers */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" /> Tiers
            </h3>
            {editing && (
              <Button size="sm" variant="outline" onClick={addTier} data-testid="add-tier-btn">
                <Plus className="h-4 w-4 mr-1" /> Add Tier
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {tiers.map((tier, idx) => (
              <div key={idx} className="relative rounded-xl border-2 p-5 transition-all"
                style={{ borderColor: tier.color + '40', backgroundColor: tier.color + '08' }}>
                {editing && (
                  <button onClick={() => removeTier(idx)}
                    className="absolute top-2 right-2 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                <div className="w-8 h-8 rounded-full mb-3 flex items-center justify-center"
                  style={{ backgroundColor: tier.color + '30' }}>
                  <Trophy className="h-4 w-4" style={{ color: tier.color }} />
                </div>
                {editing ? (
                  <div className="space-y-2">
                    <Input value={tier.name} onChange={e => updateTier(idx, 'name', e.target.value)}
                      placeholder="Tier name" className="text-sm" />
                    <div className="flex gap-2">
                      <Input type="number" value={tier.min_points}
                        onChange={e => updateTier(idx, 'min_points', parseInt(e.target.value) || 0)}
                        placeholder="Min pts" className="text-sm" />
                      <input type="color" value={tier.color}
                        onChange={e => updateTier(idx, 'color', e.target.value)}
                        className="w-10 h-10 rounded border cursor-pointer" />
                    </div>
                    <Input value={tier.perks} onChange={e => updateTier(idx, 'perks', e.target.value)}
                      placeholder="Perks description" className="text-sm" />
                  </div>
                ) : (
                  <>
                    <h4 className="font-semibold text-lg" style={{ color: tier.color }}>{tier.name}</h4>
                    <p className="text-sm text-muted-foreground">{tier.min_points}+ points</p>
                    <p className="text-xs text-muted-foreground mt-2">{tier.perks}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Rewards list */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" /> Available Rewards
            </h3>
            {editing && (
              <Button size="sm" variant="outline" onClick={addReward} data-testid="add-reward-btn">
                <Plus className="h-4 w-4 mr-1" /> Add Reward
              </Button>
            )}
          </div>
          <div className="space-y-3">
            {rewards.map((reward, idx) => (
              <div key={idx} className="flex items-center gap-4 p-4 rounded-xl border border-border">
                <Gift className="h-5 w-5 text-primary" />
                {editing ? (
                  <>
                    <Input value={reward.name} onChange={e => updateReward(idx, 'name', e.target.value)}
                      placeholder="Reward name" className="flex-1 text-sm" />
                    <Input type="number" value={reward.points_cost}
                      onChange={e => updateReward(idx, 'points_cost', parseInt(e.target.value) || 0)}
                      placeholder="Points" className="w-28 text-sm" />
                    <button onClick={() => removeReward(idx)}
                      className="p-2 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 font-medium">{reward.name}</span>
                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                      {reward.points_cost} pts
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};
