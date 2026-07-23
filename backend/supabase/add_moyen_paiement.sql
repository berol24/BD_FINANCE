-- À exécuter dans le SQL Editor de Supabase
-- Ajoute le moyen de paiement des transactions (espèce / carte / chèque)

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS moyen_paiement text DEFAULT 'espece';

-- Valeurs autorisées (optionnel mais recommandé)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'transactions_moyen_paiement_check'
  ) THEN
    ALTER TABLE transactions
      ADD CONSTRAINT transactions_moyen_paiement_check
      CHECK (moyen_paiement IS NULL OR moyen_paiement IN ('espece', 'carte', 'cheque'));
  END IF;
END $$;

UPDATE transactions
SET moyen_paiement = 'espece'
WHERE moyen_paiement IS NULL;
