import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, User, CreditCard, Calendar, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Account: React.FC = () => {
  const { user, subscription, signOut, checkSubscription } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'accéder au portail de gestion.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshSubscription = async () => {
    setRefreshing(true);
    try {
      await checkSubscription();
      toast({
        title: "Statut mis à jour",
        description: "Les informations de votre abonnement ont été actualisées.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut de l'abonnement.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
      toast({
        title: "Déconnexion réussie",
        description: "Vous avez été déconnecté avec succès.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la déconnexion.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getPlanName = (tier: string | null) => {
    switch (tier) {
      case 'basic': return 'Plan Basic';
      case 'pro': return 'Plan Pro'; 
      case 'premium': return 'Plan Premium';
      default: return 'Aucun plan actif';
    }
  };

  const getPlanPrice = (tier: string | null) => {
    switch (tier) {
      case 'basic': return '149€';
      case 'pro': return '299€';
      case 'premium': return '599€';
      default: return '0€';
    }
  };

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
          <h1 className="text-3xl font-bold text-foreground">Mon compte</h1>
          <p className="text-muted-foreground">
            Gérez votre compte et votre abonnement
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Informations du compte */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Informations du compte
              </CardTitle>
              <CardDescription>
                Vos informations personnelles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p className="text-foreground">{user?.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">ID utilisateur</label>
                <p className="text-foreground font-mono text-sm">{user?.id}</p>
              </div>
              <Button 
                onClick={handleSignOut}
                variant="outline"
                className="w-full"
              >
                Se déconnecter
              </Button>
            </CardContent>
          </Card>

          {/* Informations d'abonnement */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <CreditCard className="mr-2 h-5 w-5" />
                  Abonnement
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefreshSubscription}
                  disabled={refreshing}
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
              </CardTitle>
              <CardDescription>
                Détails de votre abonnement actuel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Statut</span>
                <Badge variant={subscription.subscribed ? "default" : "secondary"}>
                  {subscription.subscribed ? "Actif" : "Inactif"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Plan</span>
                <span className="text-foreground font-medium">
                  {getPlanName(subscription.subscription_tier)}
                </span>
              </div>

              {subscription.subscribed && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Prix</span>
                    <span className="text-foreground font-medium">
                      {getPlanPrice(subscription.subscription_tier)}/mois
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      <Calendar className="inline mr-1 h-4 w-4" />
                      Fin de période
                    </span>
                    <span className="text-foreground">
                      {formatDate(subscription.subscription_end)}
                    </span>
                  </div>
                </>
              )}

              <div className="flex flex-col gap-3 pt-4">
                {subscription.subscribed ? (
                  <Button 
                    onClick={handleManageSubscription}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? "Chargement..." : "Gérer l'abonnement"}
                  </Button>
                ) : (
                  <Button 
                    onClick={() => navigate('/pricing')}
                    className="w-full"
                  >
                    Choisir un plan
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};