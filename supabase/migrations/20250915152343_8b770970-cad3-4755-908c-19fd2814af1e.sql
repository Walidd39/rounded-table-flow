-- Insérer des données de test pour les réservations
INSERT INTO public.ai_reservations (
  restaurant_id, 
  client_nom, 
  client_telephone, 
  date_reservation, 
  heure_reservation, 
  nombre_personnes, 
  statut
) VALUES
('0dc04c69-8085-43de-a33a-aba70c565bb0', 'Jean Dupont', '0123456789', CURRENT_DATE, '19:30:00', 4, 'confirmee'),
('0dc04c69-8085-43de-a33a-aba70c565bb0', 'Marie Martin', '0987654321', CURRENT_DATE, '20:00:00', 2, 'confirmee'),
('0dc04c69-8085-43de-a33a-aba70c565bb0', 'Pierre Durand', '0555666777', CURRENT_DATE, '18:45:00', 6, 'arrivee');

-- Insérer des données de test pour les commandes
INSERT INTO public.ai_commandes (
  restaurant_id,
  client_nom,
  heure_commande,
  items_commandes,
  montant_total,
  statut,
  created_at
) VALUES
('0dc04c69-8085-43de-a33a-aba70c565bb0', 'Sophie Bernard', '19:15:00', '["Pizza Margherita", "Salade César", "Tiramisu"]', 28.50, 'recue', NOW()),
('0dc04c69-8085-43de-a33a-aba70c565bb0', 'Thomas Petit', '19:30:00', '["Burger Classic", "Frites", "Coca Cola"]', 15.90, 'preparation', NOW()),
('0dc04c69-8085-43de-a33a-aba70c565bb0', 'Claire Moreau', '19:45:00', '["Pasta Carbonara", "Bruschetta", "Vin Rouge"]', 22.40, 'prete', NOW());