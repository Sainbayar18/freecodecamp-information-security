# SHA-1 Password Cracker

Requires Python 3 and only the standard library. Run `python -m unittest test_module test_additional -v`.

All nine original and three additional tests passed on October 16, 2026. The function derives hashes from the supplied public password dictionary, checks both salt orders when requested, handles uppercase hex digests, and resolves data files relative to the module rather than the shell's current directory.

This educational project demonstrates why fast SHA-1 hashes are unsuitable for password storage. It contains no private credentials or user password data.
