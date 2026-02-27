import hashlib

def hash_email(email: str) -> str:
    """Hash email for global person dedupe without PII leak"""
    if not email:
        return ''
    return hashlib.sha256(email.lower().strip().encode()).hexdigest()

def hash_phone(phone: str) -> str:
    """Hash phone for global person dedupe without PII leak"""
    if not phone:
        return ''
    # Remove common formatting characters
    cleaned = ''.join(c for c in phone if c.isdigit())
    return hashlib.sha256(cleaned.encode()).hexdigest()
