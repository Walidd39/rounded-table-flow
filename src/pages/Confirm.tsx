import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export const Confirm: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const confirmUser = async () => {
      try {
        const token_hash = searchParams.get('token_hash');
        const type = searchParams.get('type');
        
        if (!token_hash || type !== 'email') {
          setError('Lien de confirmation invalide');
          setIsLoading(false);
          return;
        }

        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type: 'email'
        });

        if (error) {
          setError(error.message);
          toast({
            title: "Erreur de confirmation",
            description: error.message,
            variant: "destructive",
          });
        } else {
          setIsConfirmed(true);
          toast({
            title: "Email confirmé avec succès",
            description: "Votre compte est maintenant actif. Redirection en cours...",
          });
          
          // Rediriger vers le dashboard après 2 secondes
          setTimeout(() => {
            navigate('/');
          }, 2000);
        }
      } catch (err: any) {
        setError(err.message || 'Une erreur est survenue');
      } finally {
        setIsLoading(false);
      }
    };

    confirmUser();
  }, [searchParams, navigate, toast]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">
            {isLoading && "Confirmation en cours..."}
            {!isLoading && isConfirmed && "Email confirmé !"}
            {!isLoading && error && "Erreur de confirmation"}
          </CardTitle>
          <CardDescription>
            {isLoading && "Veuillez patienter pendant la vérification de votre email."}
            {!isLoading && isConfirmed && "Votre compte est maintenant actif. Redirection automatique vers le tableau de bord."}
            {!isLoading && error && "Une erreur est survenue lors de la confirmation de votre email."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          {isLoading && (
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          )}
          
          {!isLoading && isConfirmed && (
            <>
              <CheckCircle className="h-12 w-12 text-green-500" />
              <Button 
                onClick={() => navigate('/')} 
                className="w-full"
              >
                Aller au tableau de bord
              </Button>
            </>
          )}
          
          {!isLoading && error && (
            <>
              <XCircle className="h-12 w-12 text-red-500" />
              <p className="text-sm text-muted-foreground text-center">
                {error}
              </p>
              <div className="space-y-2 w-full">
                <Button 
                  onClick={() => navigate('/auth')} 
                  className="w-full"
                >
                  Retour à la connexion
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.location.reload()} 
                  className="w-full"
                >
                  Réessayer
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};