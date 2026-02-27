import React from 'react';
import { Button } from '../ui/button';
import { User, AlertTriangle, Ban } from 'lucide-react';

export const DedupeMatches = ({ matches, onSelectExisting, onCreateNew, loading }) => {
  if (!matches || matches.length === 0) return null;

  return (
    <div className="space-y-6" data-testid="dedupe-matches">
      <div>
        <h3 className="text-lg font-semibold">Possible Matches Found</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {matches.length} possible match{matches.length > 1 ? 'es' : ''} detected
        </p>
      </div>

      <div className="space-y-3">
        {matches.map((m, i) => (
          <div key={i}
            className={`p-4 rounded-lg border transition-all ${
              m.match_type === 'cross_venue'
                ? 'border-border bg-muted/50'
                : 'border-border hover:border-primary/50 cursor-pointer'
            }`}
            onClick={() => m.match_type !== 'cross_venue' && m.guest_id && onSelectExisting(m.guest_id)}
            data-testid={`dedupe-match-${i}`}
          >
            <div className="flex items-center gap-4">
              {m.photo ? (
                <img src={m.photo} alt="" className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{m.name}</p>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  {m.email_masked && <span>{m.email_masked}</span>}
                  {m.phone_masked && <span>{m.phone_masked}</span>}
                </div>
                <div className="flex gap-2 mt-1 text-xs">
                  {m.visits > 0 && <span className="text-muted-foreground">{m.visits} visits</span>}
                  {m.spend_total > 0 && <span className="text-muted-foreground">R${m.spend_total.toFixed(0)}</span>}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                {m.flags?.includes('blocked') && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs font-medium">
                    <Ban className="h-3 w-3" /> Blocked
                  </span>
                )}
                {m.flags?.includes('flagged') && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-600 text-xs font-medium">
                    <AlertTriangle className="h-3 w-3" /> Flagged
                  </span>
                )}
                {m.match_type === 'cross_venue' && (
                  <span className="text-xs text-muted-foreground italic">Other venue</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" className="flex-1" onClick={onCreateNew} disabled={loading}
          data-testid="create-new-guest-btn">
          Create New Guest
        </Button>
      </div>
    </div>
  );
};
