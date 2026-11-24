#!/usr/bin/env python3
"""Add the supported login API proxy to the existing VPS nginx site."""

import datetime
from pathlib import Path
import re
import shutil
import subprocess
import sys

API_LOCATION = """
    # Official account authentication API (same origin for browser cookies).
    location ^~ /api/ {
        proxy_pass https://play.pokemonshowdown.com;
        proxy_ssl_server_name on;
        proxy_ssl_name play.pokemonshowdown.com;
        proxy_set_header Host play.pokemonshowdown.com;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cookie_domain play.pokemonshowdown.com $host;
        proxy_cookie_domain .pokemonshowdown.com $host;
        proxy_cookie_path / /;
        proxy_cache off;
        proxy_connect_timeout 5s;
        proxy_send_timeout 15s;
        proxy_read_timeout 15s;
    }
"""

STATIC_COMPRESSION = """
    # Compress large generated client data files.
    gzip on;
    gzip_vary on;
    gzip_comp_level 5;
    gzip_min_length 1024;
    gzip_types application/javascript application/json text/css text/plain image/svg+xml;
"""


def add_api_proxy(config):
    marker = "root /opt/super-pokemon-champions-client/play.pokemonshowdown.com;"
    if config.count(marker) != 1 or "server_name pokemonshowdownclient.duckdns.org;" not in config:
        raise ValueError("This is not the expected Champions client nginx site; no changes made.")
    owned_location = r"(?m)^[ \t]*# Official account authentication API \(same origin for browser cookies\)\.\n[ \t]*location \^~ /api/ \{[^{}]*\n[ \t]*\}"
    if re.search(owned_location, config):
        config = re.sub(owned_location, lambda _: API_LOCATION.strip("\n"), config, count=1)
    elif "location ^~ /api/" in config or "location /api/" in config:
        raise ValueError("An independently configured /api/ location exists; no changes made.")
    else:
        config = config.replace(marker, marker + "\n" + API_LOCATION, 1)
    if not re.search(r"(?m)^\s*gzip\s+", config):
        config = config.replace(marker, marker + "\n" + STATIC_COMPRESSION, 1)
    return config


def main():
    if len(sys.argv) != 2:
        raise SystemExit("Usage: sudo python3 build-tools/configure-login-proxy.py /etc/nginx/sites-enabled/pokemonshowdown-client")
    site = Path(sys.argv[1]).resolve(strict=True)
    original = site.read_text()
    updated = add_api_proxy(original)
    # Keep the backup outside sites-enabled so nginx does not load it as another site.
    backup = Path("/root") / ("pokemonshowdown-client-nginx-" + datetime.datetime.now().strftime("%Y%m%d-%H%M%S-%f") + ".bak")
    shutil.copy2(site, backup)
    print("Backup:", backup, flush=True)
    try:
        site.write_text(updated)
        subprocess.run(["nginx", "-t"], check=True)
        subprocess.run(["systemctl", "reload", "nginx"], check=True)
    except Exception:
        site.write_text(original)
        print("Restored original nginx configuration.", flush=True)
        raise
    print("Login timeouts and static compression configured; game and WebSocket routes preserved.")


if __name__ == "__main__":
    main()
