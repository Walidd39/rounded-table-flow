import React from 'react';
import { PricingPlans } from '@/components/subscription/PricingPlans';
import { MinutesRecharge } from '@/components/minutes/MinutesRecharge';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Pricing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour au tableau de bord
          </Button>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Tarification MINDLINE
            </h1>
            <p className="text-muted-foreground text-lg">
              Choisissez le plan parfait pour votre restaurant
            </p>
          </div>
        </div>
        
        <PricingPlans />
        
        {/* Section recharge des minutes */}
        <div className="mt-16 border-t pt-12">
          <MinutesRecharge />
        </div>
      </div>
    </div>
  );
};