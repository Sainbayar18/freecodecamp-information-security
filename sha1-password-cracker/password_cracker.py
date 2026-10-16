"""Demonstrate dictionary attacks against SHA-1 using the supplied public lists."""
import hashlib
import re
from functools import lru_cache
from pathlib import Path

_BASE = Path(__file__).resolve().parent


@lru_cache(maxsize=2)
def _lines(filename):
    return tuple((_BASE / filename).read_text(encoding='utf-8').splitlines())


@lru_cache(maxsize=1)
def _unsalted_hashes():
    return {hashlib.sha1(password.encode('utf-8')).hexdigest(): password
            for password in _lines('top-10000-passwords.txt')}


@lru_cache(maxsize=256)
def crack_sha1_hash(hash, use_salts=False):
    """Return a matching dictionary password, optionally testing both salt orders."""
    if not isinstance(hash, str) or not re.fullmatch(r'[0-9a-fA-F]{40}', hash):
        return 'PASSWORD NOT IN DATABASE'
    target = hash.lower()
    found = _unsalted_hashes().get(target)
    if found is not None:
        return found
    if use_salts:
        for salt in _lines('known-salts.txt'):
            for password in _lines('top-10000-passwords.txt'):
                for candidate in (salt + password, password + salt):
                    if hashlib.sha1(candidate.encode('utf-8')).hexdigest() == target:
                        return password
    return 'PASSWORD NOT IN DATABASE'
