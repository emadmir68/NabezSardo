#!/usr/bin/env python3
"""Complete GitHub OAuth device flow: exchange device_code for token,
configure gh CLI, then securely remove token files. Never prints the token."""
import json
import os
import subprocess
import sys

AUTH_DIR = "/home/z/my-project/.auth"
GH_CONFIG = "/home/z/my-project/.gh-config"
GH_BIN = "/home/z/my-project/bin/gh"
CLIENT_ID = "178c6fc778ccc68e1d6a"

# 1. Read saved device response
with open(os.path.join(AUTH_DIR, "device_response.json")) as f:
    device = json.load(f)

device_code = device.get("device_code")
if not device_code:
    print("ERROR: no device_code saved")
    sys.exit(1)

# 2. Exchange for access token
resp = subprocess.run(
    [
        "curl", "-s", "--max-time", "30",
        "-X", "POST", "https://github.com/login/oauth/access_token",
        "-H", "Accept: application/json",
        "-d", f"client_id={CLIENT_ID}",
        "-d", f"device_code={device_code}",
        "-d", "grant_type=urn:ietf:params:oauth:grant-type:device_code",
    ],
    capture_output=True, text=True,
)
token_resp = json.loads(resp.stdout)

if "access_token" not in token_resp:
    err = token_resp.get("error", "unknown")
    desc = token_resp.get("error_description", "")
    print(f"AUTH_NOT_COMPLETE: {err} - {desc}")
    sys.exit(1)

access_token = token_resp["access_token"]
granted_scopes = token_resp.get("scope", "")

# 3. Configure gh CLI via stdin (token never appears in output)
configure = subprocess.run(
    [GH_BIN, "auth", "login", "--hostname", "github.com", "--with-token"],
    input=access_token,
    capture_output=True, text=True,
    env={**os.environ, "GH_CONFIG_DIR": GH_CONFIG},
)
if configure.returncode != 0:
    print("GH_CONFIG_FAILED:", configure.stderr.strip())
    sys.exit(1)

# 4. Remove token files (hygiene)
for name in ("device_response.json", "token_response.json"):
    path = os.path.join(AUTH_DIR, name)
    if os.path.exists(path):
        os.remove(path)

print("GH_CONFIGURED")
print("SCOPES_GRANTED:", granted_scopes if granted_scopes else "(none reported)")

# 5. Show auth status (no token values, just account info)
status = subprocess.run(
    [GH_BIN, "auth", "status"],
    capture_output=True, text=True,
    env={**os.environ, "GH_CONFIG_DIR": GH_CONFIG},
)
out = (status.stdout + status.stderr)
# Filter out any token-like strings just in case
import re
out = re.sub(r"(gho_|ghp_|github_pat_)[A-Za-z0-9_]+", "[REDACTED]", out)
print("--- AUTH STATUS ---")
print(out.strip())
