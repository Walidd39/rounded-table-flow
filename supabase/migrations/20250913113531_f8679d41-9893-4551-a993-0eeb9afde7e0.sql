-- Create recharges table
CREATE TABLE public.recharges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pack_type TEXT NOT NULL CHECK (pack_type IN ('S', 'M', 'L', 'XL')),
  minutes INTEGER NOT NULL,
  prix DECIMAL(10,2) NOT NULL,
  stripe_payment_intent_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create consommation table
CREATE TABLE public.consommation (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  minutes_utilisees INTEGER NOT NULL,
  date_appel TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add minutes_restantes column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN minutes_restantes INTEGER NOT NULL DEFAULT 0;

-- Add auto_recharge settings to profiles
ALTER TABLE public.profiles 
ADD COLUMN auto_recharge_enabled BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN auto_recharge_threshold INTEGER NOT NULL DEFAULT 10,
ADD COLUMN preferred_pack_type TEXT CHECK (preferred_pack_type IN ('S', 'M', 'L', 'XL'));

-- Enable Row Level Security
ALTER TABLE public.recharges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consommation ENABLE ROW LEVEL SECURITY;

-- Create policies for recharges
CREATE POLICY "Users can view their own recharges" 
ON public.recharges 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recharges" 
ON public.recharges 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recharges" 
ON public.recharges 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create policies for consommation
CREATE POLICY "Users can view their own consumption" 
ON public.consommation 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own consumption" 
ON public.consommation 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_recharges_updated_at
BEFORE UPDATE ON public.recharges
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update minutes after recharge
CREATE OR REPLACE FUNCTION public.add_minutes_to_user(user_id_param UUID, minutes_to_add INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles 
  SET minutes_restantes = minutes_restantes + minutes_to_add,
      updated_at = now()
  WHERE user_id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to consume minutes
CREATE OR REPLACE FUNCTION public.consume_minutes(user_id_param UUID, minutes_consumed INTEGER, description_param TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  current_minutes INTEGER;
BEGIN
  -- Get current minutes
  SELECT minutes_restantes INTO current_minutes 
  FROM public.profiles 
  WHERE user_id = user_id_param;
  
  -- Check if user has enough minutes
  IF current_minutes < minutes_consumed THEN
    RETURN FALSE;
  END IF;
  
  -- Update minutes
  UPDATE public.profiles 
  SET minutes_restantes = minutes_restantes - minutes_consumed,
      updated_at = now()
  WHERE user_id = user_id_param;
  
  -- Log consumption
  INSERT INTO public.consommation (user_id, minutes_utilisees, description)
  VALUES (user_id_param, minutes_consumed, description_param);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;