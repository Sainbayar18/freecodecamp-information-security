"""Small, bounded TCP connect scanner for authorized targets."""
import ipaddress
import re
import socket
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urlsplit
from common_ports import ports_and_services


def get_open_ports(target, port_range, verbose=False):
    """Return reachable TCP ports, or the curriculum's verbose/error text."""
    if not isinstance(target, str) or not target.strip():
        return 'Error: Invalid hostname'
    host = target.strip()
    if '://' in host:
        try:
            host = urlsplit(host).hostname or ''
        except ValueError:
            return 'Error: Invalid hostname'
    is_numeric = bool(re.fullmatch(r'[0-9.]+', host)) or ':' in host
    try:
        address = ipaddress.ip_address(host)
        ip = str(address)
        family = socket.AF_INET6 if address.version == 6 else socket.AF_INET
        is_ip = True
    except ValueError:
        if is_numeric:
            return 'Error: Invalid IP address'
        try:
            ip = socket.gethostbyname(host)
        except (socket.gaierror, OSError, UnicodeError):
            return 'Error: Invalid hostname'
        family = socket.AF_INET
        is_ip = False
    if (not isinstance(port_range, (list, tuple)) or len(port_range) != 2
            or any(isinstance(p, bool) or not isinstance(p, int) for p in port_range)
            or not 1 <= port_range[0] <= port_range[1] <= 65535):
        raise ValueError('port_range must contain two ordered ports from 1 to 65535')

    def is_open(port):
        try:
            with socket.socket(family, socket.SOCK_STREAM) as connection:
                connection.settimeout(1.0)
                return connection.connect_ex((ip, port)) == 0
        except OSError:
            return False

    candidates = range(port_range[0], port_range[1] + 1)
    with ThreadPoolExecutor(max_workers=min(16, len(candidates))) as executor:
        open_ports = [port for port, opened in zip(candidates, executor.map(is_open, candidates)) if opened]
    if not verbose:
        return open_ports
    name = host
    if is_ip:
        try:
            name = socket.gethostbyaddr(ip)[0]
        except (socket.herror, socket.gaierror, OSError):
            name = ip
    title = f'Open ports for {name} ({ip})' if name != ip else f'Open ports for {ip}'
    lines = [title, 'PORT     SERVICE']
    for port in open_ports:
        service = ports_and_services.get(port)
        if service is None:
            try:
                service = socket.getservbyport(port, 'tcp')
            except OSError:
                service = 'unknown'
        lines.append(f'{port:<9}{service}')
    return '\n'.join(lines)
