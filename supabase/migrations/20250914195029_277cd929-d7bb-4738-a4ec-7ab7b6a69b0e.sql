-- Create table for reservations from vocal AI agents
CREATE TABLE public.ai_reservations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id uuid NOT NULL REFERENCES public.profiles(user_id),
  client_nom text NOT NULL,
  client_telephone text,
  date_reservation date NOT NULL,
  heure_reservation time NOT NULL,
  nombre_personnes integer NOT NULL,
  confirmation boolean DEFAULT true,
  statut text DEFAULT 'confirmee'::text CHECK (statut IN ('confirmee', 'annulee', 'arrivee')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create table for orders from vocal AI agents
CREATE TABLE public.ai_commandes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id uuid NOT NULL REFERENCES public.profiles(user_id),
  client_nom text NOT NULL,
  heure_commande time NOT NULL,
  items_commandes jsonb NOT NULL,
  montant_total numeric(10,2) NOT NULL DEFAULT 0,
  statut text DEFAULT 'recue'::text CHECK (statut IN ('recue', 'en_preparation', 'prete', 'livree')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create table for menu pricing
CREATE TABLE public.menus_prix (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id uuid NOT NULL REFERENCES public.profiles(user_id),
  nom_plat text NOT NULL,
  prix numeric(10,2) NOT NULL,
  categorie text DEFAULT 'plat'::text CHECK (categorie IN ('entree', 'plat', 'dessert', 'boisson')),
  disponible boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_commandes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menus_prix ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_reservations
CREATE POLICY "Users can view their restaurant reservations" 
ON public.ai_reservations 
FOR SELECT 
USING (auth.uid() = restaurant_id);

CREATE POLICY "Users can update their restaurant reservations" 
ON public.ai_commandes 
FOR UPDATE 
USING (auth.uid() = restaurant_id);

CREATE POLICY "Service role can insert reservations" 
ON public.ai_reservations 
FOR INSERT 
WITH CHECK (true);

-- RLS Policies for ai_commandes
CREATE POLICY "Users can view their restaurant orders" 
ON public.ai_commandes 
FOR SELECT 
USING (auth.uid() = restaurant_id);

CREATE POLICY "Users can update their restaurant orders" 
ON public.ai_commandes 
FOR UPDATE 
USING (auth.uid() = restaurant_id);

CREATE POLICY "Service role can insert orders" 
ON public.ai_commandes 
FOR INSERT 
WITH CHECK (true);

-- RLS Policies for menus_prix
CREATE POLICY "Users can manage their restaurant menu" 
ON public.menus_prix 
FOR ALL 
USING (auth.uid() = restaurant_id);

CREATE POLICY "Service role can read menu for pricing" 
ON public.menus_prix 
FOR SELECT 
USING (true);

-- Add triggers for updated_at
CREATE TRIGGER update_ai_reservations_updated_at
  BEFORE UPDATE ON public.ai_reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_commandes_updated_at
  BEFORE UPDATE ON public.ai_commandes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_menus_prix_updated_at
  BEFORE UPDATE ON public.menus_prix
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();