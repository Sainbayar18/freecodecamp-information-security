import socket
import unittest
from unittest.mock import patch
from port_scanner import get_open_ports


class LocalScannerTests(unittest.TestCase):
    def test_live_local_listener(self):
        with socket.socket() as listener:
            listener.bind(('127.0.0.1', 0))
            listener.listen(10)
            port = listener.getsockname()[1]
            self.assertEqual(get_open_ports('127.0.0.1', [port, port]), [port])
            self.assertEqual(get_open_ports('http://localhost', [port, port]), [port])
            with patch('port_scanner.socket.gethostbyaddr', side_effect=socket.herror()):
                output = get_open_ports('127.0.0.1', [port, port], True)
            self.assertTrue(output.startswith('Open ports for 127.0.0.1\nPORT     SERVICE\n'))
            self.assertTrue(output.splitlines()[2].startswith(f'{port:<9}'))
        self.assertEqual(get_open_ports('127.0.0.1', [port, port]), [])

    def test_invalid_targets(self):
        self.assertEqual(get_open_ports('266.255.9.10', [22, 42]), 'Error: Invalid IP address')
        with patch('port_scanner.socket.gethostbyname', side_effect=socket.gaierror()):
            self.assertEqual(get_open_ports('invalid.example', [22, 42]), 'Error: Invalid hostname')

    def test_invalid_ranges(self):
        for ports in ([0, 2], [80, 22], [1, 65536], [True, 80], [80]):
            with self.assertRaises(ValueError):
                get_open_ports('127.0.0.1', ports)


if __name__ == '__main__':
    unittest.main()
