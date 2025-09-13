import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { MinutesGauge } from '@/components/minutes/MinutesGauge';
import { ConsumptionChart } from '@/components/minutes/ConsumptionChart';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, Settings, History, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  minutes_restantes: number;
  auto_recharge_enabled: boolean;
  auto_recharge_threshold: number;
  preferred_pack_type: string | null;
}

export default function Minutes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('minutes_restantes, auto_recharge_enabled, auto_recharge_threshold, preferred_pack_type')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos informations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateAutoRecharge = async (enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          auto_recharge_enabled: enabled,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user?.id);

      if (error) throw error;
      
      setProfile(prev => prev ? { ...prev, auto_recharge_enabled: enabled } : null);
      
      toast({
        title: enabled ? "Auto-recharge activée" : "Auto-recharge désactivée",
        description: enabled 
          ? "Votre compte sera rechargé automatiquement quand il reste moins de 10 minutes"
          : "L'auto-recharge a été désactivée"
      });
    } catch (error) {
      console.error('Error updating auto-recharge:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier les paramètres",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Mes Minutes</h1>
            <p className="text-muted-foreground">Gérez votre crédit d'appels IA</p>
          </div>
          <div className="ml-auto">
            <Button onClick={() => navigate('/minutes/recharge')} className="gap-2">
              <Zap className="h-4 w-4" />
              Recharger
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gauge + Quick Actions */}
          <div className="lg:col-span-1 space-y-6">
            {/* Minutes Gauge */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Crédit Actuel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MinutesGauge remainingMinutes={profile?.minutes_restantes || 0} />
              </CardContent>
            </Card>

            {/* Auto-recharge Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Auto-recharge
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto-recharge"
                    checked={profile?.auto_recharge_enabled || false}
                    onCheckedChange={updateAutoRecharge}
                  />
                  <Label htmlFor="auto-recharge">Activer l'auto-recharge</Label>
                </div>
                
                {profile?.auto_recharge_enabled && (
                  <div className="pl-6 space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Recharge automatique quand il reste moins de {profile.auto_recharge_threshold} minutes
                    </p>
                    {profile.preferred_pack_type && (
                      <Badge variant="secondary">
                        Pack {profile.preferred_pack_type} sélectionné
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Chart + History */}
          <div className="lg:col-span-2 space-y-6">
            {/* Consumption Chart */}
            <ConsumptionChart />

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Activité Récente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Mock recent activities */}
                  <div className="flex justify-between items-center py-2">
                    <div>
                      <p className="font-medium">Appel client - Réservation</p>
                      <p className="text-sm text-muted-foreground">Il y a 2 heures</p>
                    </div>
                    <Badge variant="outline">-5 min</Badge>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center py-2">
                    <div>
                      <p className="font-medium">Recharge Pack M</p>
                      <p className="text-sm text-muted-foreground">Hier</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">+250 min</Badge>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center py-2">
                    <div>
                      <p className="font-medium">Appel client - Menu du jour</p>
                      <p className="text-sm text-muted-foreground">Il y a 2 jours</p>
                    </div>
                    <Badge variant="outline">-3 min</Badge>
                  </div>
                </div>
                
                <Button variant="outline" className="w-full mt-4 gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Voir l'historique complet
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}