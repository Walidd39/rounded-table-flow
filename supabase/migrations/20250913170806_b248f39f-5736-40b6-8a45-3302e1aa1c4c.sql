-- Fix search path for security functions
CREATE OR REPLACE FUNCTION public.add_minutes_to_user(user_id_param UUID, minutes_to_add INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles 
  SET minutes_restantes = minutes_restantes + minutes_to_add,
      updated_at = now()
  WHERE user_id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;