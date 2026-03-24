"""
CRM Migration: Create deals, deal_activities, and customers tables.
Run once to set up the CRM schema and seed data.
"""
import asyncio
import asyncpg
import os
import logging

logger = logging.getLogger(__name__)

POSTGRES_URL = os.getenv('POSTGRES_URL', 'postgresql://localhost:5432/spetap')

CREATE_TABLES = """
-- deals table
CREATE TABLE IF NOT EXISTS public.deals (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_name  text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text,
  company_name  text NOT NULL,
  address       text,
  plan_id       text NOT NULL DEFAULT 'core',
  stage         text NOT NULL DEFAULT 'lead',
  deal_value    numeric NOT NULL DEFAULT 0,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  closed_at     timestamptz
);

-- deal_activities table
CREATE TABLE IF NOT EXISTS public.deal_activities (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id     uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  type        text NOT NULL DEFAULT 'note',
  description text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- customers table (CRM customers, separate from auth users)
CREATE TABLE IF NOT EXISTS public.customers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name    text NOT NULL,
  contact_name    text NOT NULL,
  contact_email   text NOT NULL,
  contact_phone   text,
  address         text,
  plan_id         text NOT NULL DEFAULT 'core',
  status          text NOT NULL DEFAULT 'active',
  mrr             numeric NOT NULL DEFAULT 0,
  modules_enabled text[] NOT NULL DEFAULT ARRAY['pulse']::text[],
  payment_method  text,
  signup_date     date NOT NULL DEFAULT CURRENT_DATE,
  deal_id         uuid REFERENCES public.deals(id),
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_deals_stage ON public.deals(stage);
CREATE INDEX IF NOT EXISTS idx_deals_company ON public.deals(company_name);
CREATE INDEX IF NOT EXISTS idx_deal_activities_deal_id ON public.deal_activities(deal_id);
CREATE INDEX IF NOT EXISTS idx_customers_status ON public.customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_plan ON public.customers(plan_id);
CREATE INDEX IF NOT EXISTS idx_customers_deal_id ON public.customers(deal_id);
"""

SEED_DEALS = """
INSERT INTO public.deals (contact_name, contact_email, contact_phone, company_name, address, plan_id, stage, deal_value, notes)
SELECT * FROM (VALUES
  ('Ricardo Almeida', 'ricardo@barnoite.com',   '+55 11 99999-1001', 'Bar Noite SP',       'Rua Augusta, 1200 - São Paulo, SP',      'flow', 'lead',        299, 'Interessado no módulo Tap + Table'),
  ('Marina Costa',    'marina@clubvelvet.com',   '+55 21 98888-2002', 'Club Velvet RJ',     'Av. Atlântica, 500 - Rio de Janeiro, RJ', 'os',   'qualified',   899, 'Reunião agendada para sexta'),
  ('Felipe Rocha',    'felipe@gastrobar.com',    '+55 31 97777-3003', 'GastroBar BH',       'Rua da Bahia, 800 - Belo Horizonte, MG',  'sync', 'proposal',    599, 'Proposta enviada 18/03'),
  ('Ana Beatriz',     'ana@skylounge.com',       '+55 41 96666-4004', 'Sky Lounge Curitiba', 'Rua XV de Novembro, 300 - Curitiba, PR',  'flow', 'negotiation', 299, 'Negociando desconto anual'),
  ('Carlos Mendes',   'carlos@brewhouse.com',    '+55 51 95555-5005', 'BrewHouse POA',      'Av. Independência, 150 - Porto Alegre, RS','core', 'closed_won',  149, 'Fechado em 15/03 - início imediato'),
  ('Lucia Ferreira',  'lucia@terrabar.com',      '+55 48 94444-6006', 'Terra Bar Floripa',  'Rua das Palmeiras, 45 - Florianópolis, SC','flow', 'closed_lost', 299, 'Perdido para concorrente - preço')
) AS v(contact_name, contact_email, contact_phone, company_name, address, plan_id, stage, deal_value, notes)
WHERE NOT EXISTS (SELECT 1 FROM public.deals LIMIT 1);
"""

SEED_ACTIVITIES = """
INSERT INTO public.deal_activities (deal_id, type, description, created_at)
SELECT d.id, v.type, v.description, v.created_at::timestamptz
FROM (VALUES
  ('Bar Noite SP',       'email',     'Primeiro contato via site',                '2026-03-14 10:00:00-03'),
  ('Bar Noite SP',       'call',      'Ligação de qualificação — 15min',          '2026-03-16 14:30:00-03'),
  ('Club Velvet RJ',     'meeting',   'Demo presencial com gerente',              '2026-03-15 11:00:00-03'),
  ('Club Velvet RJ',     'follow_up', 'Enviado material de case studies',         '2026-03-18 09:00:00-03'),
  ('GastroBar BH',       'call',      'Ligação inicial — interesse em KDS + Bar', '2026-03-12 16:00:00-03'),
  ('GastroBar BH',       'email',     'Proposta comercial enviada — plano Sync',  '2026-03-18 10:00:00-03'),
  ('Sky Lounge Curitiba', 'meeting',  'Reunião com sócios — apresentação geral',  '2026-03-17 15:00:00-03'),
  ('Sky Lounge Curitiba', 'call',     'Negociação de preço — pediu 15%% desconto','2026-03-20 10:00:00-03'),
  ('BrewHouse POA',      'meeting',   'Demo online — 30min',                      '2026-03-10 14:00:00-03'),
  ('BrewHouse POA',      'email',     'Contrato assinado — onboarding agendado',  '2026-03-15 09:00:00-03'),
  ('Terra Bar Floripa',  'call',      'Primeiro contato — muito interessado',     '2026-03-11 11:00:00-03'),
  ('Terra Bar Floripa',  'follow_up', 'Perdido — escolheu concorrente por preço', '2026-03-19 16:00:00-03')
) AS v(company, type, description, created_at)
JOIN public.deals d ON d.company_name = v.company
WHERE NOT EXISTS (SELECT 1 FROM public.deal_activities LIMIT 1);
"""

SEED_CUSTOMER_FROM_WON = """
INSERT INTO public.customers (company_name, contact_name, contact_email, contact_phone, address, plan_id, status, mrr, deal_id, notes, modules_enabled, signup_date)
SELECT d.company_name, d.contact_name, d.contact_email, d.contact_phone, d.address, d.plan_id, 'active', d.deal_value, d.id, d.notes,
  CASE d.plan_id
    WHEN 'core' THEN ARRAY['pulse']
    WHEN 'flow' THEN ARRAY['pulse','tap','table']
    WHEN 'sync' THEN ARRAY['pulse','tap','table','kds','bar','finance']
    WHEN 'os'   THEN ARRAY['pulse','tap','table','kds','bar','finance','analytics','ai']
    ELSE ARRAY['pulse']
  END,
  CURRENT_DATE
FROM public.deals d
WHERE d.stage = 'closed_won'
AND NOT EXISTS (SELECT 1 FROM public.customers WHERE deal_id = d.id);
"""


async def run_migration():
    pool = await asyncpg.create_pool(POSTGRES_URL, min_size=1, max_size=3)
    async with pool.acquire() as conn:
        # Create tables
        await conn.execute(CREATE_TABLES)
        print("Tables created successfully")

        # Seed deals
        await conn.execute(SEED_DEALS)
        deal_count = await conn.fetchval("SELECT COUNT(*) FROM deals")
        print(f"Deals: {deal_count}")

        # Seed activities
        await conn.execute(SEED_ACTIVITIES)
        act_count = await conn.fetchval("SELECT COUNT(*) FROM deal_activities")
        print(f"Activities: {act_count}")

        # Create customer from closed_won deals
        await conn.execute(SEED_CUSTOMER_FROM_WON)
        cust_count = await conn.fetchval("SELECT COUNT(*) FROM customers")
        print(f"Customers: {cust_count}")

    await pool.close()
    print("Migration complete!")


if __name__ == "__main__":
    asyncio.run(run_migration())
