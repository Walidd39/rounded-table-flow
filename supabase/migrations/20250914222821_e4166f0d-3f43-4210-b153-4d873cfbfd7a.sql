-- Add missing UPDATE policy for ai_reservations
CREATE POLICY "Users can update their restaurant reservations status" 
ON public.ai_reservations 
FOR UPDATE 
USING (auth.uid() = restaurant_id);