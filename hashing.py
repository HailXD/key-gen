import hashlib
import string

# All printable keyboard characters: letters, digits, and punctuation.
ALPHABET = string.ascii_letters + string.digits + string.punctuation


def hash_key(key: str) -> str:
    """Return a deterministic 64-character hash for the given key."""
    digest = hashlib.sha512(key.encode("utf-8")).digest()
    return "".join(ALPHABET[b % len(ALPHABET)] for b in digest)


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python hashing.py <key>", file=sys.stderr)
        sys.exit(1)

    print(hash_key(sys.argv[1]))
