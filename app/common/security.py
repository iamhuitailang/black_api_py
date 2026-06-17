import hashlib
import secrets


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    hashed = hashlib.sha256((salt + password).encode('utf-8')).hexdigest()
    return f"{salt}${hashed}"


def verify_password(password: str, stored_hash: str) -> bool:
    if not stored_hash or '$' not in stored_hash:
        return stored_hash == password
    try:
        salt, hashed = stored_hash.split('$', 1)
        check = hashlib.sha256((salt + password).encode('utf-8')).hexdigest()
        return secrets.compare_digest(check, hashed)
    except Exception:
        return False
