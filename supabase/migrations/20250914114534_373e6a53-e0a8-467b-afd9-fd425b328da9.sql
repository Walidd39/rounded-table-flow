-- Mettre à jour le rôle de l'utilisateur existant pour en faire un administrateur
UPDATE public.profiles 
SET user_role = 'admin',
    display_name = 'habibii.walid@gmail.com'
WHERE user_id = '0dc04c69-8085-43de-a33a-aba70c565bb0';