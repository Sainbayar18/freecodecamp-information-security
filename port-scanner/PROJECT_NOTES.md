# Port Scanner

Requires Python 3. Run `python -m unittest test_local -v` for deterministic local socket, invalid-address, and range checks. Run `python -m unittest test_module -v` for the unchanged original integration tests.

Validation on October 16, 2026: all three local tests passed; seven of eight original tests passed. The original test targeting 209.216.230.240 expected TCP 443 open, but that host did not accept the connection from this environment. No expected results or remote host responses are hardcoded.

The scanner supports IPs, hostnames and URL host extraction, limits concurrency to 16 sockets, closes connections promptly, and formats verbose output using the starter service dictionary. Only scan hosts you are authorized to test.
