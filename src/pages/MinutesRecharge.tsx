import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, Crown, Star, Rocket, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Pack {
  id: 'S' | 'M' | 'L' | 'XL';
  name: string;
  minutes: number;
  price: number;
  icon: React.ElementType;
  popular?: boolean;
  features: string[];
  color: string;
}

const packs: Pack[] = [
  {
    id: 'S',
    name: 'Pack Starter',
    minutes: 100,
    price: 19,
    icon: Zap,
    features: ['100 minutes d\'appels IA', 'Support email', 'Durée: ~3-4 jours'],
    color: 'border-blue-200 bg-blue-50/50'
  },
  {
    id: 'M',
    name: 'Pack Medium',
    minutes: 250,
    price: 49,
    icon: Star,
    popular: true,
    features: ['250 minutes d\'appels IA', 'Support prioritaire', 'Durée: ~7-10 jours', 'Économies: 20%'],
    color: 'border-purple-200 bg-purple-50/50'
  },
  {
    id: 'L',
    name: 'Pack Large',
    minutes: 750,
    price: 149,
    icon: Crown,
    features: ['750 minutes d\'appels IA', 'Support téléphonique', 'Durée: ~25-30 jours', 'Économies: 38%'],
    color: 'border-orange-200 bg-orange-50/50'
  },
  {
    id: 'XL',
    name: 'Pack Enterprise',
    minutes: 1500,
    price: 299,
    icon: Rocket,
    features: ['1500 minutes d\'appels IA', 'Support dédié', 'Durée: ~50-60 jours', 'Économies: 47%'],
    color: 'border-green-200 bg-green-50/50'
  }
];

export default function MinutesRecharge() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedPack, setSelectedPack] = useState<Pack['id'] | null>('M');
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    if (!selectedPack || !user) return;

    console.log('Starting purchase process...', { packType: selectedPack, userId: user.id });
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-minutes-checkout', {
        body: {
          packType: selectedPack,
          userId: user.id
        }
      });

      console.log('Supabase function response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (data?.url) {
        console.log('Redirecting to Stripe checkout:', data.url);
        window.location.href = data.url; // Utiliser location.href au lieu de window.open
      } else {
        throw new Error('No checkout URL received from Stripe');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Erreur",
        description: `Impossible de créer la session de paiement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedPackData = packs.find(p => p.id === selectedPack);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Recharger mes Minutes</h1>
            <p className="text-muted-foreground">Choisissez votre pack de minutes d'appels IA</p>
          </div>
        </div>

        {/* Packs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {packs.map((pack) => {
            const IconComponent = pack.icon;
            const isSelected = selectedPack === pack.id;
            
            return (
              <Card 
                key={pack.id}
                className={cn(
                  "relative cursor-pointer transition-all duration-200 hover:shadow-lg",
                  pack.color,
                  isSelected && "ring-2 ring-primary shadow-lg scale-105"
                )}
                onClick={() => setSelectedPack(pack.id)}
              >
                {pack.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                      Plus populaire
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto mb-2 p-3 rounded-full bg-background w-fit">
                    <IconComponent className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{pack.name}</CardTitle>
                  <div className="space-y-1">
                    <div className="text-3xl font-bold text-primary">{pack.price}€</div>
                    <div className="text-sm text-muted-foreground">{pack.minutes} minutes</div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {pack.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                  
                  {isSelected && (
                    <div className="pt-2">
                      <Badge className="w-full justify-center">Sélectionné</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Purchase Section */}
        {selectedPackData && (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-center">Récapitulatif de commande</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Pack sélectionné:</span>
                <Badge variant="secondary">{selectedPackData.name}</Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span>Minutes:</span>
                <span className="font-semibold">{selectedPackData.minutes}</span>
              </div>
              
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total:</span>
                <span>{selectedPackData.price}€</span>
              </div>
              
              <Button 
                className="w-full" 
                size="lg"
                onClick={handlePurchase}
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Chargement...
                  </div>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Acheter maintenant
                  </>
                )}
              </Button>
              
              <p className="text-xs text-muted-foreground text-center">
                Paiement sécurisé par Stripe. Les minutes sont ajoutées immédiatement après le paiement.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}