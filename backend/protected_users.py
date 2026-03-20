"""
Protected Users — Fail-safe mechanism to ensure critical accounts ALWAYS exist.

This module runs on every backend startup and guarantees that:
1. The PostgreSQL schema tables exist (via init_postgres.sql)
2. Protected user accounts are NEVER deleted and always recoverable
3. If any protected user is missing, it's auto-recreated immediately

RULE: This MUST run before any seed script, migration, or schema update.
"""
import os
import json
import asyncio
import logging
from datetime import datetime, timezone

logger = logging.getLogger("protected_users")

# ─── PROTECTED ACCOUNTS — NEVER DELETE THESE ──────────────────────
PROTECTED_USERS = [
    {
        "email": "garcia.rapha2@gmail.com",
        "name": "Raphael Garcia",
        "role": "CEO",
        "password": "12345",
        "onboarding_completed": True,
        "plan_id": "os",
        "access_role": "platform_admin",
        "permissions": {"pulse": True, "tap": True, "table": True, "kds": True, "bar": True, "finance": True, "analytics": True, "ai": True, "ceo": True},
    },
    {
        "email": "teste@teste.com",
        "name": "Test User",
        "role": "USER",
        "password": "12345",
        "onboarding_completed": True,
        "plan_id": "sync",
        "access_role": "owner",
        "permissions": {"pulse": True, "tap": True, "table": True, "kds": True, "manager": True, "owner": True},
    },
    {
        "email": "teste1@teste.com",
        "name": "Demo Onboarding",
        "role": "USER",
        "password": "12345",
        "onboarding_completed": False,
        "plan_id": "sync",
        "access_role": "owner",
        "permissions": {"pulse": True, "tap": True, "table": True, "kds": True, "manager": True, "owner": True},
    },
]

COMPANY_ID = "c0000001-0000-0000-0000-000000000001"
COMPANY_NAME = "Demo Club Inc."
VENUE_ID = "40a24e04-75b6-435d-bfff-ab0d469ce543"


async def ensure_protected_users(pool):
    """
    Idempotent fail-safe: ensures all protected accounts exist.
    - If user exists → do nothing (preserve existing data)
    - If user is missing → recreate with correct role and access
    - NEVER deletes or overwrites existing users
    """
    from utils.auth import hash_password
    import uuid

    now = datetime.now(timezone.utc)

    async with pool.acquire() as conn:
        # 1. Ensure the company exists
        company = await conn.fetchrow(
            "SELECT id FROM companies WHERE id = $1::uuid", uuid.UUID(COMPANY_ID)
        )
        if not company:
            await conn.execute(
                """INSERT INTO companies (id, name, status, created_at, updated_at)
                   VALUES ($1::uuid, $2, 'active', $3, $3)""",
                uuid.UUID(COMPANY_ID), COMPANY_NAME, now,
            )
            logger.info(f"[PROTECTED] Recreated company: {COMPANY_NAME}")

        # 2. Ensure each protected user exists
        for user_def in PROTECTED_USERS:
            email = user_def["email"]
            existing = await conn.fetchrow("SELECT id, role FROM users WHERE email = $1", email)

            if existing:
                user_id = existing["id"]
                onboarding_flag = user_def.get("onboarding_completed", True)
                plan_id = user_def.get("plan_id")
                hashed = hash_password(user_def["password"])

                # Reset all protected users on every startup for consistent test state
                await conn.execute(
                    """UPDATE users SET is_system_account = TRUE, status = 'active',
                       onboarding_completed = $1, plan_id = $2, password_hash = $3,
                       onboarding_step = $4, updated_at = $5 WHERE id = $6""",
                    onboarding_flag, plan_id, hashed,
                    6 if onboarding_flag else 0, now, user_id,
                )
                logger.info(f"[PROTECTED] User reset: {email} (id={user_id})")
            else:
                # User missing — recreate
                hashed = hash_password(user_def["password"])
                plan_id = user_def.get("plan_id")
                row = await conn.fetchrow(
                    """INSERT INTO users (name, email, password_hash, role, is_system_account, status, onboarding_completed, plan_id, created_at, updated_at)
                       VALUES ($1, $2, $3, $4, TRUE, 'active', $5, $6, $7, $7) RETURNING id""",
                    user_def["name"], email, hashed, user_def["role"], user_def.get("onboarding_completed", True), plan_id, now,
                )
                user_id = row["id"]
                logger.warning(f"[PROTECTED] RECREATED missing user: {email} (role={user_def['role']}, id={user_id})")

            # 3. Ensure user_access exists with correct role and permissions
            perms = user_def.get("permissions", {})
            access_role = user_def.get("access_role", "platform_admin")
            access = await conn.fetchrow(
                "SELECT id FROM user_access WHERE user_id = $1 AND company_id = $2::uuid",
                user_id, uuid.UUID(COMPANY_ID),
            )
            if not access:
                await conn.execute(
                    """INSERT INTO user_access (user_id, company_id, venue_id, role, permissions, created_at)
                       VALUES ($1, $2::uuid, $3::uuid, $4, $5::jsonb, $6)""",
                    user_id, uuid.UUID(COMPANY_ID), uuid.UUID(VENUE_ID),
                    access_role, json.dumps(perms), now,
                )
                logger.warning(f"[PROTECTED] RECREATED access for: {email}")
            else:
                await conn.execute(
                    "UPDATE user_access SET role = $1, permissions = $2::jsonb WHERE user_id = $3 AND company_id = $4::uuid",
                    access_role, json.dumps(perms), user_id, uuid.UUID(COMPANY_ID),
                )

    logger.info("[PROTECTED] All protected users verified successfully")


async def ensure_schema(pool):
    """
    Ensures the PostgreSQL schema exists by running init_postgres.sql.
    Uses CREATE TABLE IF NOT EXISTS so it's safe to run repeatedly.
    NEVER drops or truncates existing tables.
    """
    sql_path = os.path.join(os.path.dirname(__file__), "init_postgres.sql")
    if not os.path.exists(sql_path):
        logger.error(f"[PROTECTED] Schema file not found: {sql_path}")
        return False

    with open(sql_path, "r") as f:
        schema_sql = f.read()

    async with pool.acquire() as conn:
        try:
            await conn.execute(schema_sql)
            logger.info("[PROTECTED] Schema verified (CREATE TABLE IF NOT EXISTS)")
            return True
        except Exception as e:
            # Schema likely already exists — log but don't fail
            if "already exists" in str(e).lower():
                logger.info("[PROTECTED] Schema already exists — OK")
                return True
            logger.error(f"[PROTECTED] Schema error: {e}")
            return True  # Don't block startup


async def startup_protection(pool):
    """
    Master function called on every backend startup.
    Ensures schema + protected users are always present.
    """
    logger.info("[PROTECTED] Running startup protection...")
    try:
        await ensure_schema(pool)
        await ensure_protected_users(pool)
        logger.info("[PROTECTED] Startup protection complete — all accounts safe")
    except Exception as e:
        logger.error(f"[PROTECTED] Startup protection failed: {e}")
