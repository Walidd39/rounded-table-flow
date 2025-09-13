import React from 'react';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Clock, Zap } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface MinutesGaugeProps {
  remainingMinutes: number;
  totalMinutes?: number;
  className?: string;
}

export const MinutesGauge: React.FC<MinutesGaugeProps> = ({
  remainingMinutes,
  totalMinutes = 1000,
  className = ""
}) => {
  const percentage = Math.min((remainingMinutes / totalMinutes) * 100, 100);
  
  const getAlertLevel = () => {
    if (remainingMinutes <= 20) return 'critical';
    if (remainingMinutes <= 50) return 'warning';
    return 'normal';
  };

  const alertLevel = getAlertLevel();

  const getProgressColor = () => {
    if (alertLevel === 'critical') return 'bg-destructive';
    if (alertLevel === 'warning') return 'bg-orange-500';
    return 'bg-primary';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Circular Gauge Visual */}
      <div className="relative w-32 h-32 mx-auto">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke="hsl(var(--muted))"
            strokeWidth="8"
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke={alertLevel === 'critical' ? 'hsl(var(--destructive))' : 
                   alertLevel === 'warning' ? '#f97316' : 'hsl(var(--primary))'}
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${percentage * 2.51} 251`}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-2xl font-bold text-foreground">
            {remainingMinutes}
          </div>
          <div className="text-sm text-muted-foreground">minutes</div>
        </div>
      </div>

      {/* Status bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Restant</span>
          <span className="font-medium">{remainingMinutes} / {totalMinutes}</span>
        </div>
        <Progress value={percentage} className="h-2" />
      </div>

      {/* Alerts */}
      {alertLevel === 'critical' && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Attention ! Il ne vous reste que {remainingMinutes} minutes. Rechargez maintenant pour éviter toute interruption.
          </AlertDescription>
        </Alert>
      )}

      {alertLevel === 'warning' && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            Vous avez {remainingMinutes} minutes restantes. Pensez à recharger bientôt.
          </AlertDescription>
        </Alert>
      )}

      {alertLevel === 'normal' && remainingMinutes > 100 && (
        <Alert>
          <Zap className="h-4 w-4" />
          <AlertDescription>
            Votre compte est bien approvisionné avec {remainingMinutes} minutes.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};