-- Activer les notifications temps réel pour les tables AI
-- Pour la table ai_reservations
ALTER TABLE public.ai_reservations REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.ai_reservations;

-- Pour la table ai_commandes
ALTER TABLE public.ai_commandes REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.ai_commandes;