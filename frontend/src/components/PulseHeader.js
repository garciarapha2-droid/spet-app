import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { Moon, Sun, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

export const PulseHeader = ({ venue, onVenueChange }) => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const tabs = [
    { id: 'entry', label: 'Entry', path: '/pulse/entry' },
    { id: 'inside', label: 'Inside', path: '/pulse/inside' },
    { id: 'bar', label: 'Bar', path: '/pulse/bar' },
    { id: 'exit', label: 'Exit', path: '/pulse/exit' },
    { id: 'rewards', label: 'Rewards', path: '/pulse/rewards' },
  ];

  const currentPath = window.location.pathname;

  return (
    <header className="border-b border-border bg-background sticky top-0 z-40">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Brand + Venue Selector */}
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-semibold">SPETAP</h1>
            <div className="flex items-center gap-3">
              <Select value={venue} onValueChange={onVenueChange}>
                <SelectTrigger className="w-[180px] border-none shadow-none focus:ring-0">
                  <SelectValue placeholder="Select venue" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="demo-club">Demo Club</SelectItem>
                  <SelectItem value="midway">Midway</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Right: Nav Tabs + Theme Toggle */}
          <div className="flex items-center gap-6">
            <nav className="flex items-center gap-6">
              {tabs.map((tab) => {
                const isActive = currentPath === tab.path || (currentPath === '/pulse' && tab.id === 'entry');
                return (
                  <button
                    key={tab.id}
                    onClick={() => navigate(tab.path)}
                    className={`px-3 py-2 text-sm rounded-md transition-all ${
                      isActive 
                        ? 'bg-primary/10 text-primary font-medium border border-primary/20' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                    data-testid={`tab-${tab.id}`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </nav>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              data-testid="theme-toggle"
            >
              {theme === 'light' ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/venue/home')}
              data-testid="back-button"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
