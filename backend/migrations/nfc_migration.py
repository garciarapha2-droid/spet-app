"""
NFC Migration: Create nfc_tags table in PostgreSQL.
Run once to set up the NFC infrastructure for mobile app.
"""
import asyncio
import asyncpg
import os
import logging

logger = logging.getLogger(__name__)

POSTGRES_URL = os.getenv('POSTGRES_URL')

CREATE_TABLE = """
CREATE TABLE IF NOT EXISTS public.nfc_tags (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_uid       text NOT NULL,
  guest_id      text NOT NULL,
  venue_id      text NOT NULL,
  status        text NOT NULL DEFAULT 'active',
  label         text,
  assigned_by   text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  last_scanned  timestamptz,

  CONSTRAINT uq_tag_uid_venue UNIQUE (tag_uid, venue_id)
);

CREATE INDEX IF NOT EXISTS idx_nfc_tags_tag_uid ON public.nfc_tags (tag_uid);
CREATE INDEX IF NOT EXISTS idx_nfc_tags_guest_id ON public.nfc_tags (guest_id);
CREATE INDEX IF NOT EXISTS idx_nfc_tags_venue_id ON public.nfc_tags (venue_id);
CREATE INDEX IF NOT EXISTS idx_nfc_tags_status ON public.nfc_tags (status);
"""


async def run_migration():
    conn = await asyncpg.connect(POSTGRES_URL)
    try:
        await conn.execute(CREATE_TABLE)
        logger.info("NFC migration completed: nfc_tags table created")
        print("NFC migration completed successfully")

        # Verify table
        count = await conn.fetchval("SELECT COUNT(*) FROM nfc_tags")
        print(f"nfc_tags table exists with {count} rows")
    finally:
        await conn.close()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(run_migration())
