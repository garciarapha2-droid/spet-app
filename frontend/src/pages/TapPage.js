import React from 'react';
import { ThemeToggle } from '../components/ThemeToggle';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const TapPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-6">
      <ThemeToggle />
      <Button variant="ghost" onClick={() => navigate('/modules')} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Modules
      </Button>
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>TAP Module</CardTitle>
          <CardDescription>Bar · Table · Checkout</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
};
