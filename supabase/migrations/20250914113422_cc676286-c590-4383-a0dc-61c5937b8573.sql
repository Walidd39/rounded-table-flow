-- Create admin roles table
CREATE TYPE public.user_role AS ENUM ('admin', 'user');

-- Add role column to profiles table  
ALTER TABLE public.profiles ADD COLUMN user_role public.user_role DEFAULT 'user';

-- Create vocal_agents table for managing AI agent creation tasks
CREATE TABLE public.vocal_agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.profiles(user_id),
  restaurant_name TEXT NOT NULL,
  cuisine_type TEXT,
  restaurant_phone TEXT,
  restaurant_address TEXT,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'testing', 'delivered')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('urgent', 'normal', 'completed')),
  promised_delivery_date TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- Enable RLS on vocal_agents table
ALTER TABLE public.vocal_agents ENABLE ROW LEVEL SECURITY;

-- Create policies for vocal_agents (only admins can access)
CREATE POLICY "Only admins can manage vocal agents" 
ON public.vocal_agents 
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.user_role = 'admin'
));

-- Add trigger for automatic timestamp updates on vocal_agents
CREATE TRIGGER update_vocal_agents_updated_at
BEFORE UPDATE ON public.vocal_agents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create admin_metrics table for storing daily metrics
CREATE TABLE public.admin_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  new_clients_count INTEGER DEFAULT 0,
  agents_in_progress_count INTEGER DEFAULT 0,
  agents_delivered_count INTEGER DEFAULT 0,
  monthly_revenue NUMERIC DEFAULT 0,
  total_minutes_consumed INTEGER DEFAULT 0,
  average_creation_time_hours NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(date)
);

-- Enable RLS on admin_metrics
ALTER TABLE public.admin_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies for admin_metrics (only admins can access)
CREATE POLICY "Only admins can view metrics" 
ON public.admin_metrics 
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.user_role = 'admin'
));

-- Add restaurant info to existing profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS restaurant_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS restaurant_phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS restaurant_address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cuisine_type TEXT;