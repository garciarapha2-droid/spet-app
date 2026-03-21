import { useState } from "react";
import { PulseLayout } from "../../components/pulse/PulseLayout";
import { motion } from "framer-motion";
import { Trophy, Star, Gift, Settings, Zap } from "lucide-react";
import {
  membershipTiers,
  availableRewards,
  pointsPerDollar,
} from "../../data/pulseData";

const tierIcons = {
  Bronze: "text-orange-400",
  Silver: "text-gray-400",
  Gold: "text-yellow-400",
  Platinum: "text-purple-400",
};

export default function PulseRewardsPage() {
  const [editing, setEditing] = useState(false);

  return (
    <PulseLayout>
      {/* Title */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-foreground tracking-normal" data-testid="rewards-title">
            Membership
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Loyalty tiers, points & rewards
          </p>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border/30 bg-card/60 text-sm font-medium text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all"
          data-testid="configure-btn"
        >
          <Settings className="h-3.5 w-3.5 text-muted-foreground" />
          Configure
        </button>
      </div>

      {/* Points Engine Card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.4 }}
        className="rounded-2xl border border-border/50 bg-gradient-to-br from-primary/10 to-primary/5 p-5 mb-6"
        data-testid="points-engine"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Points Engine</h3>
            <p className="text-xs text-muted-foreground">Conversion rate</p>
          </div>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-extrabold text-foreground">Every $1</span>
          <span className="text-sm text-muted-foreground mx-1">spent earns</span>
          <span className="text-2xl font-extrabold text-primary">{pointsPerDollar} points</span>
        </div>
      </motion.div>

      {/* Tiers Section */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="mb-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Tiers</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="tiers-grid">
          {membershipTiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 + i * 0.06, duration: 0.4 }}
              className="relative rounded-2xl border-2 p-5 transition-all hover:shadow-lg"
              style={{
                borderColor: tier.color + "40",
                backgroundColor: tier.color + "08",
              }}
              data-testid={`tier-${tier.name.toLowerCase()}`}
            >
              <div
                className="h-9 w-9 rounded-xl mb-3 flex items-center justify-center"
                style={{ backgroundColor: tier.color + "20" }}
              >
                <Trophy
                  className={`h-4.5 w-4.5 ${tierIcons[tier.name] || "text-muted-foreground"}`}
                  style={{ color: tier.color }}
                />
              </div>
              <h4
                className="text-base font-extrabold mb-0.5"
                style={{ color: tier.color }}
              >
                {tier.name}
              </h4>
              <p className="text-xs text-muted-foreground mb-2">
                {tier.minPoints === 0
                  ? "Starting tier"
                  : `${tier.minPoints.toLocaleString()}+ points`}
              </p>
              <p className="text-[10px] text-muted-foreground/80">{tier.perks}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Available Rewards */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Gift className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Available Rewards</h3>
        </div>
        <div className="flex flex-col gap-2" data-testid="rewards-list">
          {availableRewards.map((reward, i) => (
            <motion.div
              key={reward.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + i * 0.04 }}
              className="flex items-center gap-4 p-4 rounded-2xl border border-border/30 bg-card/60 backdrop-blur hover:border-primary/20 transition-all"
              data-testid={`reward-${reward.id}`}
            >
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Gift className="h-4 w-4 text-primary" />
              </div>
              <span className="flex-1 text-sm font-semibold text-foreground">
                {reward.name}
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-bold tabular-nums">
                {reward.pointsCost} pts
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </PulseLayout>
  );
}
