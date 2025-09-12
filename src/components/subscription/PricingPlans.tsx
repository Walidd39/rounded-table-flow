import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Phone, Calendar, BarChart3, Users, Database, FileSpreadsheet } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from '@/hooks/use-toast';

const plans = [
  {
    id: 'basic',
    name: 'Plan Basic',
    price: '149',
    description: 'Idéal pour débuter',
    color: 'from-green-500 to-green-600',
    borderColor: 'border-green-200',
    features: [
      { icon: Phone, text: '450 minutes d\'appels' },
      { icon: Calendar, text: 'Tableau Réservations & Commandes' },
      { icon: CheckCircle, text: 'Notifications email & SMS' },
      { icon: CheckCircle, text: 'SMS de confirmation aux clients' },
    ],
  },
  {
    id: 'pro',
    name: 'Plan Pro',
    price: '299',
    description: 'Pour les restaurants en croissance',
    color: 'from-blue-500 to-blue-600',
    borderColor: 'border-blue-200',
    popular: true,
    features: [
      { icon: Phone, text: '1000 minutes d\'appels' },
      { icon: Calendar, text: 'Tableau avancé + calendrier' },
      { icon: CheckCircle, text: 'Notifications en temps réel' },
      { icon: FileSpreadsheet, text: 'Export CSV/Excel' },
    ],
  },
  {
    id: 'premium',
    name: 'Plan Premium',
    price: '599',
    description: 'Solution complète pour entreprises',
    color: 'from-purple-500 to-purple-600',
    borderColor: 'border-purple-200',
    features: [
      { icon: Phone, text: '2500 minutes d\'appels' },
      { icon: BarChart3, text: 'Dashboard complet + statistiques' },
      { icon: Database, text: 'Intégration Airtable' },
      { icon: Users, text: 'Accès multi-utilisateurs' },
    ],
  },
];

export const PricingPlans: React.FC = () => {
  const { user, subscription } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour souscrire à un plan.",
        variant: "destructive",
      });
      return;
    }

    setLoading(planId);

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { plan: planId },
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la création de la session de paiement.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const isCurrentPlan = (planId: string) => {
    return subscription.subscribed && subscription.subscription_tier === planId;
  };

  return (
    <div className="py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-foreground mb-4">
          Choisissez votre plan
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Sélectionnez l'offre qui correspond le mieux aux besoins de votre restaurant
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative ${plan.borderColor} ${
              plan.popular ? 'ring-2 ring-primary shadow-large' : ''
            } transition-all hover:shadow-medium`}
          >
            {plan.popular && (
              <Badge 
                className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground"
              >
                Populaire
              </Badge>
            )}
            
            <CardHeader className="text-center pb-8">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${plan.color} flex items-center justify-center`}>
                <div className="text-white text-2xl font-bold">
                  {plan.name.charAt(5)}
                </div>
              </div>
              <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
              <CardDescription className="text-muted-foreground">
                {plan.description}
              </CardDescription>
              <div className="flex items-center justify-center mt-4">
                <span className="text-4xl font-bold text-foreground">{plan.price}€</span>
                <span className="text-muted-foreground ml-2">/mois</span>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center space-x-3">
                    <feature.icon className="h-5 w-5 text-success flex-shrink-0" />
                    <span className="text-foreground">{feature.text}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleSubscribe(plan.id)}
                disabled={loading === plan.id || isCurrentPlan(plan.id)}
                className={`w-full ${
                  isCurrentPlan(plan.id)
                    ? 'bg-success text-success-foreground hover:bg-success/90'
                    : ''
                }`}
                variant={isCurrentPlan(plan.id) ? 'default' : 'outline'}
              >
                {loading === plan.id ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                    Chargement...
                  </>
                ) : isCurrentPlan(plan.id) ? (
                  'Plan actuel'
                ) : (
                  'Choisir ce plan'
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};