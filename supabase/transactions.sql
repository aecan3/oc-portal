-- Run in Supabase → SQL Editor (postgres privileges).
-- Financial transparency: OC-wide transaction ledger (read by all signed-in owners).

CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_date date NOT NULL DEFAULT ((timezone('utc', now()))::date),
  description text NOT NULL DEFAULT '',
  amount numeric(14, 2) NOT NULL CHECK (amount >= 0),
  category text NOT NULL CHECK (category IN ('Levy', 'Maintenance', 'Utility')),
  type text NOT NULL CHECK (type IN ('Credit', 'Debit')),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS transactions_created_at_desc_idx
  ON public.transactions (created_at DESC);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON TABLE public.transactions TO authenticated;

DROP POLICY IF EXISTS "transactions_select_authenticated" ON public.transactions;

CREATE POLICY "transactions_select_authenticated"
  ON public.transactions
  FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON TABLE public.transactions IS 'OC ledger lines for owner transparency (credits in, debits out).';

-- Optional seed for local/demo (skips if the table already has any rows)
INSERT INTO public.transactions (transaction_date, description, amount, category, type)
SELECT transaction_date, description, amount, category, type
FROM (
  VALUES
    (CURRENT_DATE - 1, 'Q1 levy — Unit 4', 485.00::numeric, 'Levy'::text, 'Credit'::text),
    (CURRENT_DATE - 2, 'Electricity — common property', 312.40::numeric, 'Utility'::text, 'Debit'::text),
    (CURRENT_DATE - 3, 'Lift service invoice', 890.00::numeric, 'Maintenance'::text, 'Debit'::text),
    (CURRENT_DATE - 5, 'Q1 levy — Unit 1', 485.00::numeric, 'Levy'::text, 'Credit'::text),
    (CURRENT_DATE - 7, 'Water usage — quarter', 228.15::numeric, 'Utility'::text, 'Debit'::text),
    (CURRENT_DATE - 8, 'Lobby repaint — progress payment', 2400.00::numeric, 'Maintenance'::text, 'Debit'::text),
    (CURRENT_DATE - 10, 'Special levy — fire compliance', 1200.00::numeric, 'Levy'::text, 'Credit'::text),
    (CURRENT_DATE - 12, 'Gardening contract', 440.00::numeric, 'Maintenance'::text, 'Debit'::text),
    (CURRENT_DATE - 14, 'Gas — common areas', 156.80::numeric, 'Utility'::text, 'Debit'::text),
    (CURRENT_DATE - 16, 'Q1 levy — Unit 7', 485.00::numeric, 'Levy'::text, 'Credit'::text)
) AS seed(transaction_date, description, amount, category, type)
WHERE NOT EXISTS (SELECT 1 FROM public.transactions LIMIT 1);
