import React from 'react';
import { Button } from '../ui/button';
import { CheckCircle, XCircle, User } from 'lucide-react';

export const EntrySuccess = ({ result, guest, onDone }) => {
  const isAllowed = result?.decision === 'allowed';

  return (
    <div className="flex flex-col items-center text-center space-y-6 py-8" data-testid="entry-success">
      <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
        isAllowed ? 'bg-green-500/10' : 'bg-destructive/10'
      }`}>
        {isAllowed ? (
          <CheckCircle className="h-10 w-10 text-green-500" />
        ) : (
          <XCircle className="h-10 w-10 text-destructive" />
        )}
      </div>

      {guest?.photo ? (
        <img src={guest.photo} alt={guest?.name} className="w-20 h-20 rounded-full object-cover border-2 border-border" />
      ) : (
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
          <User className="h-8 w-8 text-muted-foreground" />
        </div>
      )}

      <div>
        <h3 className="text-2xl font-semibold" data-testid="success-guest-name">{guest?.name || 'Guest'}</h3>
        <p className={`text-lg mt-1 ${isAllowed ? 'text-green-500' : 'text-destructive'}`}>
          {isAllowed ? 'Entry Allowed' : 'Entry Denied'}
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          {result?.entry_type?.replace(/_/g, ' ')}
        </p>
      </div>

      <Button onClick={onDone} className="w-full max-w-xs h-12 text-base" data-testid="done-btn">
        Next Guest
      </Button>
    </div>
  );
};
