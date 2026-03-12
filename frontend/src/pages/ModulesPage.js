import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ThemeToggle } from '../components/ThemeToggle';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { 
  Users, 
  CreditCard, 
  Wallet, 
  ChefHat, 
  BarChart3, 
  Building2,
  Crown,
  LogOut
} from 'lucide-react';

export const ModulesPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const modules = [
    {
      id: 'pulse',
      name: 'Pulse',
      description: 'Entry · Guests · Identity',
      icon: Users,
      route: '/pulse',
      color: 'bg-green-500'
    },
    {
      id: 'tap',
      name: 'TAP',
      description: 'Bar · Restaurant · Table · Kitchen',
      icon: CreditCard,
      route: '/tap',
      color: 'bg-blue-500'
    },
    {
      id: 'event_wallet',
      name: 'Event Wallet',
      description: 'Preload, balance & event payments',
      icon: Wallet,
      route: '/event-wallet',
      color: 'bg-yellow-500'
    },
    {
      id: 'restaurant',
      name: 'Kitchen',
      description: 'Prepare & manage orders',
      icon: ChefHat,
      route: '/kitchen',
      color: 'bg-orange-500'
    },
    {
      id: 'manager',
      name: 'Manager',
      description: 'Menu, tables, staff, settings',
      icon: BarChart3,
      route: '/manager',
      color: 'bg-purple-500'
    },
    {
      id: 'owner',
      name: 'Owner',
      description: 'Multi-venue insights & analytics',
      icon: Building2,
      route: '/owner',
      color: 'bg-indigo-500'
    },
    {
      id: 'ceo',
      name: 'CEO',
      description: 'Platform-wide metrics',
      icon: Crown,
      route: '/ceo',
      color: 'bg-pink-500'
    }
  ];

  const handleModuleClick = (module) => {
    // TODO: Check entitlements before navigating
    navigate(module.route);
  };

  return (
    <div className="min-h-screen bg-background">
      <ThemeToggle />
      
      {/* Header */}
      <div className="border-b border-border/60 bg-card/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-extrabold text-xs">S</span>
              </div>
              <h1 className="text-lg font-extrabold tracking-tight">SPET</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{user?.email}</p>
          </div>
          <Button variant="ghost" onClick={logout} data-testid="logout-button">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Select Module</h2>
          <p className="text-muted-foreground">Choose the module you want to access</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Card
                key={module.id}
                className="cursor-pointer hover:shadow-lg transition-all hover:scale-105"
                onClick={() => handleModuleClick(module)}
                data-testid={`module-${module.id}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-lg ${module.color} bg-opacity-10`}>
                      <Icon className={`h-6 w-6 text-${module.color.replace('bg-', '')}`} />
                    </div>
                    <Badge variant="secondary">Enabled</Badge>
                  </div>
                  <CardTitle className="mt-4">{module.name}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">
                    Open {module.name}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
