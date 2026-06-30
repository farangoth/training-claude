#!/usr/bin/env python3
"""
Push a local file to a GitHub repo via the Contents API (create or update).

Handles the get-current-sha -> PUT-with-sha dance required by GitHub's API,
including the case where the file doesn't exist yet (no sha needed) and the
case where a concurrent edit changed the sha since we last fetched it (one
automatic retry by re-fetching the sha).

USAGE:
    python3 github_push.py <owner/repo> <local_path> <repo_path> <commit_message> [token]

    If [token] is omitted, reads from the GITHUB_TOKEN environment variable.

EXAMPLE:
    python3 github_push.py farangoth/training-claude \\
        /tmp/training-plan.jsx training-plan.jsx \\
        "feat: add Week 28 quality session" "$GITHUB_TOKEN"
"""
import sys
import os
import json
import base64
import urllib.request
import urllib.error

ACCEPT = "application/vnd.github+json"


def get_sha(repo: str, path: str, token: str):
    """Return the current sha for a file, or None if it doesn't exist yet."""
    req = urllib.request.Request(
        f"https://api.github.com/repos/{repo}/contents/{path}",
        headers={"Authorization": f"token {token}", "Accept": ACCEPT},
    )
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())["sha"]
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None
        raise


def push_file(repo: str, local_path: str, repo_path: str, message: str, token: str):
    with open(local_path, "rb") as f:
        content_b64 = base64.b64encode(f.read()).decode()

    sha = get_sha(repo, repo_path, token)

    payload = {"message": message, "content": content_b64}
    if sha:
        payload["sha"] = sha

    req = urllib.request.Request(
        f"https://api.github.com/repos/{repo}/contents/{repo_path}",
        data=json.dumps(payload).encode(),
        method="PUT",
        headers={
            "Authorization": f"token {token}",
            "Content-Type": "application/json",
            "Accept": ACCEPT,
        },
    )
    try:
        with urllib.request.urlopen(req) as r:
            resp = json.loads(r.read())
            new_sha = resp["content"]["sha"]
            url = resp["content"]["html_url"]
            print(f"[OK] {repo_path} -> sha {new_sha[:8]}  {url}")
            return new_sha
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        if e.code == 409:
            # sha drifted between our GET and PUT (concurrent push). Retry once.
            print(f"[RETRY] {repo_path}: sha conflict, re-fetching and retrying once...")
            fresh_sha = get_sha(repo, repo_path, token)
            payload["sha"] = fresh_sha
            req2 = urllib.request.Request(
                f"https://api.github.com/repos/{repo}/contents/{repo_path}",
                data=json.dumps(payload).encode(),
                method="PUT",
                headers={
                    "Authorization": f"token {token}",
                    "Content-Type": "application/json",
                    "Accept": ACCEPT,
                },
            )
            with urllib.request.urlopen(req2) as r:
                resp = json.loads(r.read())
                new_sha = resp["content"]["sha"]
                print(f"[OK after retry] {repo_path} -> sha {new_sha[:8]}")
                return new_sha
        print(f"[ERROR] {repo_path}: HTTP {e.code} — {body[:300]}", file=sys.stderr)
        raise


def main():
    if len(sys.argv) < 5:
        print(__doc__, file=sys.stderr)
        sys.exit(1)

    repo, local_path, repo_path, message = sys.argv[1:5]
    token = sys.argv[5] if len(sys.argv) > 5 else os.environ.get("GITHUB_TOKEN")

    if not token:
        print("ERROR: no token provided and GITHUB_TOKEN not set", file=sys.stderr)
        sys.exit(1)

    push_file(repo, local_path, repo_path, message, token)


if __name__ == "__main__":
    main()
