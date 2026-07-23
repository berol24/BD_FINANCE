-- À exécuter dans le SQL Editor de Supabase
-- Ajoute le pays et la devise de l'utilisateur (choisis à l'inscription)

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS pays text,
  ADD COLUMN IF NOT EXISTS devise text DEFAULT 'EUR';

-- Compte existants : France / euro par défaut
UPDATE users
SET pays = COALESCE(pays, 'FR'),
    devise = COALESCE(devise, 'EUR')
WHERE pays IS NULL OR devise IS NULL;
