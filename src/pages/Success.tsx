import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useToast } from '@/hooks/use-toast';

export const Success: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkSubscription } = useAuth();
  const { addNotification } = useNotifications();
  const { toast } = useToast();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Refresh subscription status after successful payment
    const refreshSubscription = async () => {
      try {
        await checkSubscription();
        
        // Add notification for subscription success
        addNotification({
          title: "Souscription confirmée !",
          message: "🎉 Merci pour votre souscription ! Votre compte sera configuré et prêt à utiliser sous 3 à 4 jours. Nous vous tiendrons informé.",
          type: "success"
        });
        
        toast({
          title: "Abonnement activé",
          description: "Votre abonnement a été activé avec succès !",
        });
      } catch (error) {
        console.error('Error refreshing subscription:', error);
      }
    };

    if (sessionId) {
      // Wait a moment for Stripe to process, then refresh
      setTimeout(refreshSubscription, 2000);
    }
  }, [sessionId, checkSubscription, addNotification]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto text-center">
        <CardHeader className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-success rounded-full flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-success-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Paiement réussi !
          </CardTitle>
          <CardDescription>
            Votre abonnement MINDLINE a été activé avec succès. 
            Vous pouvez maintenant profiter de toutes les fonctionnalités de votre plan.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">
              ID de session
            </p>
            <p className="font-mono text-xs text-foreground break-all">
              {sessionId || 'N/A'}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button 
              onClick={() => navigate('/')}
              className="w-full"
            >
              Accéder au tableau de bord
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => navigate('/account')}
              className="w-full"
            >
              Voir mon compte
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            Un email de confirmation vous a été envoyé avec tous les détails de votre abonnement.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};