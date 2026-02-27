import React, { useState } from 'react';
import { Button } from '../ui/button';
import { User, ShieldAlert, ShieldCheck, Ban, AlertTriangle, DollarSign, Crown, Star, Clock } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

export const DecisionCard = ({ guest, onDecision, loading }) => {
  const [entryType, setEntryType] = useState('consumption_only');
  const [coverAmount, setCoverAmount] = useState(0);

  if (!guest) return null;

  const hasBlocker = guest.risk_chips?.some(c => c.severity === 'critical');

  return (
    <div className="space-y-6" data-testid="decision-card">
      {/* Guest profile header */}
      <div className="flex items-start gap-6">
        {guest.photo ? (
          <img src={guest.photo} alt={guest.name} className="w-24 h-24 rounded-full object-cover border-2 border-border" />
        ) : (
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
            <User className="h-10 w-10 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-2xl font-semibold" data-testid="guest-name">{guest.name}</h3>
          {guest.email && <p className="text-sm text-muted-foreground">{guest.email}</p>}
          {guest.phone && <p className="text-sm text-muted-foreground">{guest.phone}</p>}
          <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
            <span>{guest.visits || 0} visits</span>
            <span>R${(guest.spend_total || 0).toFixed(0)} spent</span>
          </div>
        </div>
      </div>

      {/* Risk chips */}
      {guest.risk_chips?.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <ShieldAlert className="h-4 w-4" /> Risk Signals
          </div>
          <div className="flex flex-wrap gap-2">
            {guest.risk_chips.map((chip, i) => (
              <span key={i} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                chip.severity === 'critical'
                  ? 'bg-destructive/10 text-destructive border border-destructive/20'
                  : 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20'
              }`} data-testid={`risk-chip-${chip.type}`}>
                {chip.type === 'blocked' && <Ban className="h-3.5 w-3.5" />}
                {chip.type === 'flagged' && <AlertTriangle className="h-3.5 w-3.5" />}
                {chip.type === 'unpaid' && <DollarSign className="h-3.5 w-3.5" />}
                {chip.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Value chips */}
      {guest.value_chips?.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <ShieldCheck className="h-4 w-4" /> Value Signals
          </div>
          <div className="flex flex-wrap gap-2">
            {guest.value_chips.map((chip, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20"
                data-testid={`value-chip-${chip.type}`}>
                {chip.type === 'vip' && <Crown className="h-3.5 w-3.5" />}
                {chip.type === 'big_spender' && <DollarSign className="h-3.5 w-3.5" />}
                {chip.type === 'regular' && <Star className="h-3.5 w-3.5" />}
                {chip.type === 'loyal' && <Clock className="h-3.5 w-3.5" />}
                {chip.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Entry type selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">Entry Type</label>
        <Select value={entryType} onValueChange={setEntryType}>
          <SelectTrigger data-testid="entry-type-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="vip">VIP</SelectItem>
            <SelectItem value="cover">Cover</SelectItem>
            <SelectItem value="cover_consumption">Cover + Consumption</SelectItem>
            <SelectItem value="consumption_only">Consumption Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Decision buttons */}
      <div className="flex gap-3 pt-4">
        <Button className="flex-1 h-14 text-lg" disabled={loading || hasBlocker}
          onClick={() => onDecision('allowed', entryType, coverAmount, entryType.includes('cover'))}
          data-testid="allow-entry-btn">
          {hasBlocker ? 'Blocked' : 'Allow Entry'}
        </Button>
        <Button variant="outline" className="flex-1 h-14 text-lg border-destructive/30 text-destructive hover:bg-destructive/10"
          disabled={loading}
          onClick={() => onDecision('denied', entryType, 0, false)}
          data-testid="deny-entry-btn">
          Deny
        </Button>
      </div>
    </div>
  );
};
