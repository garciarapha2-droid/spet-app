import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ThemeToggle } from '../components/ThemeToggle';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { toast } from 'sonner';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const nextRoute = await login(email, password);
      toast.success('Login successful');
      navigate(nextRoute.route);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-primary/[0.02]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/[0.04] rounded-full blur-[120px]" />

      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md relative z-10 border-border/50 shadow-xl shadow-black/5">
        <CardHeader className="space-y-1 text-center pb-2">
          <div className="mb-5">
            <div className="inline-flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center glow-blue">
                <span className="text-primary-foreground font-extrabold text-sm tracking-tighter">S</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight" data-testid="brand-logo">SPET</h1>
            </div>
            <p className="text-xs text-muted-foreground mt-2 tracking-wider uppercase font-medium">Venue Operations Platform</p>
          </div>
          <CardTitle className="sr-only">Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="h-11"
                data-testid="email-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11"
                data-testid="password-input"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-11 font-semibold"
              disabled={loading}
              data-testid="login-button"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
            <div className="text-center">
              <button type="button" className="text-sm text-muted-foreground hover:text-primary transition-colors" data-testid="forgot-password-link"
                onClick={() => toast.info('Password reset coming soon')}>
                Forgot password?
              </button>
            </div>
          </form>
          <div className="mt-6 pt-4 border-t border-border/50 text-center text-xs text-muted-foreground">
            Secure platform access
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
