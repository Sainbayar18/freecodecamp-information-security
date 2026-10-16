import hashlib
import unittest
from pathlib import Path
from password_cracker import crack_sha1_hash


class AdditionalTests(unittest.TestCase):
    def test_case_insensitive_hash(self):
        self.assertEqual(crack_sha1_hash(hashlib.sha1(b'password').hexdigest().upper()), 'password')

    def test_invalid_and_unknown(self):
        self.assertEqual(crack_sha1_hash('invalid'), 'PASSWORD NOT IN DATABASE')
        self.assertEqual(crack_sha1_hash(hashlib.sha1(b'not-a-dictionary-password-2026').hexdigest()), 'PASSWORD NOT IN DATABASE')

    def test_both_salt_orders(self):
        salt = Path(__file__).with_name('known-salts.txt').read_text().splitlines()[0]
        for candidate in (salt + 'password', 'password' + salt):
            self.assertEqual(crack_sha1_hash(hashlib.sha1(candidate.encode()).hexdigest(), True), 'password')


if __name__ == '__main__':
    unittest.main()
