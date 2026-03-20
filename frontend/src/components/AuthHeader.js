import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sun, Moon, LogOut } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

/**
 * Shared header for auth pages (login, signup, onboarding).
 * Props:
 *   backTo - path for back arrow (default: -1 = browser back)
 *   showLogout - show logout button (auto-detected if user is authenticated)
 */
export const AuthHeader = ({ backTo, showLogout }) => {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleBack = (e) => {
    e.preventDefault();
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  const handleLogout = async () => {
    const { handleFullLogout } = await import('../utils/logout');
    await handleFullLogout(logout);
  };

  const shouldShowLogout = showLogout !== undefined ? showLogout : isAuthenticated;

  return (
    <header className="flex items-center justify-between h-[76px] px-8 lg:px-12 max-w-[1200px] mx-auto w-full z-20">
      <div className="flex items-center gap-2">
        <a
          href={backTo || '/'}
          onClick={handleBack}
          className="p-2 -ml-2 rounded-full transition-all duration-200 hover:bg-muted"
          data-testid="back-button"
        >
          <ArrowLeft size={18} style={{ color: 'hsl(var(--text-tertiary))' }} />
        </a>
        <Link to="/" className="flex items-center">
          <span
            className="text-[22px] font-bold tracking-tight text-foreground"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            spet<span className="gradient-text">.</span>
          </span>
        </Link>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-full transition-all duration-200 hover:bg-muted"
          style={{ color: 'hsl(var(--text-tertiary))' }}
          data-testid="theme-toggle"
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        {shouldShowLogout && (
          <button
            onClick={handleLogout}
            className="p-2.5 rounded-full transition-all duration-200 hover:bg-muted"
            style={{ color: 'hsl(var(--text-tertiary))' }}
            data-testid="logout-btn"
            title="Logout"
          >
            <LogOut size={17} />
          </button>
        )}
      </div>
    </header>
  );
};
