-- Create table for webhook logs tracking
CREATE TABLE public.webhook_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_type TEXT NOT NULL, -- 'make', 'stripe', etc.
  data_type TEXT, -- 'reservation', 'commande', 'subscription', etc.
  user_id UUID, -- optional reference to user
  status TEXT NOT NULL DEFAULT 'pending', -- 'success', 'error', 'pending'
  response_status INTEGER, -- HTTP response status
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Create index for better performance
CREATE INDEX idx_webhook_logs_type ON public.webhook_logs(webhook_type);
CREATE INDEX idx_webhook_logs_user_id ON public.webhook_logs(user_id);
CREATE INDEX idx_webhook_logs_created_at ON public.webhook_logs(created_at);

-- Create policies (admin access only for now, can be adjusted based on needs)
CREATE POLICY "Webhook logs are viewable by authenticated users" 
ON public.webhook_logs 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_webhook_logs_updated_at
BEFORE UPDATE ON public.webhook_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();