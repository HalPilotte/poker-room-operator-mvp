#!/usr/bin/env python3
"""
figma_bot.py

Purpose:
  CLI helper to export a Figma file's JSON using a PAT from environment (FIGMA_TOKEN/FIGMA_PAT),
  or optionally from AWS Secrets Manager if no env token is provided.

Usage:
  python tools/figma/figma_bot.py --file-id <FIGMA_FILE_ID> --output ./spec.json

Environment:
  FIGMA_PAT / FIGMA_TOKEN – Direct Figma token (preferred; bypasses AWS)
  FIGMA_API_BASE         – Optional override (default: https://api.figma.com/v1)
  AWS_REGION             – Optional when using Secrets Manager
  FIGMA_SECRET_NAME      – Optional secret name (default: figma/pat)

Notes:
  - Prefers FIGMA_TOKEN/FIGMA_PAT if set; falls back to AWS only when not provided.
  - No secrets are printed or persisted.
  - Exits non-zero on error for CI compatibility.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any, Dict

import requests

try:
    from boto3.session import Session  # type: ignore
    from botocore.exceptions import ClientError, NoCredentialsError  # type: ignore
    _AWS_AVAILABLE = True
except Exception:  # pragma: no cover
    Session = None  # type: ignore
    ClientError = NoCredentialsError = Exception  # type: ignore
    _AWS_AVAILABLE = False

DEFAULT_SECRET_NAME = "figma/pat"
DEFAULT_API_BASE = "https://api.figma.com/v1"
TIMEOUT = 30  # seconds


def log(msg: str) -> None:
    print(f"[figma_bot] {msg}")


def get_env(name: str, default: str | None = None) -> str | None:
    return os.getenv(name, default)


def get_figma_token_from_aws(secret_name: str, region: str) -> str:
    if not _AWS_AVAILABLE:
        raise RuntimeError("boto3/botocore not installed; provide FIGMA_TOKEN or install AWS libs")
    try:
        assert Session is not None
        session = Session(region_name=region)
        client = session.client("secretsmanager")
        log(f"Retrieving secret '{secret_name}' from region '{region}'…")
        resp = client.get_secret_value(SecretId=secret_name)
        secret_str = resp.get("SecretString")
        if not secret_str:
            raise RuntimeError("SecretString missing from Secrets Manager response")
        try:
            payload = json.loads(secret_str)
        except json.JSONDecodeError:
            payload = {"token": secret_str}
        token = payload.get("token")
        if not token:
            raise RuntimeError("Secret JSON must contain key 'token'")
        return token
    except NoCredentialsError as e:  # type: ignore
        raise RuntimeError("AWS credentials not available for Secrets Manager access") from e
    except ClientError as e:  # type: ignore
        code = getattr(e, "response", {}).get("Error", {}).get("Code")
        raise RuntimeError(f"Failed to read secret '{secret_name}': {code}") from e


def resolve_token(region: str | None, secret_name: str | None) -> str:
    pat = get_env("FIGMA_PAT") or get_env("FIGMA_TOKEN")
    if pat:
        log("Using token from environment (FIGMA_PAT/FIGMA_TOKEN).")
        return pat
    if not region:
        raise RuntimeError("FIGMA_TOKEN not set and AWS_REGION missing")
    name = secret_name or DEFAULT_SECRET_NAME
    return get_figma_token_from_aws(secret_name=name, region=region)


def fetch_figma_file(file_key: str, token: str, api_base: str = DEFAULT_API_BASE) -> Dict[str, Any]:
    url = f"{api_base.rstrip('/')}/files/{file_key}"
    headers = {
        "X-Figma-Token": token,
        "Accept": "application/json",
        "User-Agent": "poker-room-operator-figma-bot/1.0",
    }
    log(f"Requesting Figma file: {url}")
    try:
        r = requests.get(url, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        raise RuntimeError(f"Network error calling Figma API: {e}") from e

    if r.status_code == 403:
        raise RuntimeError("Figma API returned 403 Forbidden. Check PAT scopes or file access.")
    if r.status_code == 404:
        raise RuntimeError("Figma file not found. Verify FILE_ID and permissions.")
    if r.status_code >= 400:
        try:
            err = r.json()
        except Exception:
            err = {"error": r.text}
        raise RuntimeError(f"Figma API error {r.status_code}: {err}")

    try:
        data = r.json()
    except ValueError as e:
        raise RuntimeError("Invalid JSON response from Figma API") from e

    return data


def normalize(figma_json: Dict[str, Any]) -> Dict[str, Any]:
    keys = ["name", "lastModified", "thumbnailUrl", "version"]
    out: Dict[str, Any] = {k: figma_json.get(k) for k in keys if k in figma_json}
    if "document" in figma_json:
        out["document"] = figma_json["document"]
    if "components" in figma_json:
        out["components"] = figma_json["components"]
    if "styles" in figma_json:
        out["styles"] = figma_json["styles"]
    return out or figma_json


def write_json(path: Path, data: Dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    log(f"Wrote {path}")


def parse_args(argv: list[str]) -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Export a Figma file JSON using PAT or AWS Secret")
    p.add_argument("--file-id", required=True, help="Figma file key from the URL")
    p.add_argument("--output", default="./figma_file.json", help="Output JSON path")
    p.add_argument("--raw", action="store_true", help="Write raw Figma response without normalization")
    return p.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])

    region = get_env("AWS_REGION")
    secret_name = get_env("FIGMA_SECRET_NAME", DEFAULT_SECRET_NAME) or DEFAULT_SECRET_NAME
    api_base = get_env("FIGMA_API_BASE", DEFAULT_API_BASE) or DEFAULT_API_BASE

    try:
        token = resolve_token(region=region, secret_name=secret_name)
    except Exception as e:
        log(f"ERROR: {e}")
        return 2

    try:
        raw = fetch_figma_file(file_key=args.file_id, token=token, api_base=api_base)
    except Exception as e:
        log(f"ERROR: {e}")
        return 3

    data = raw if args.raw else normalize(raw)

    try:
        write_json(Path(args.output), data)
    except Exception as e:
        log(f"ERROR: Failed to write output: {e}")
        return 4

    log("Done")
    return 0


if __name__ == "__main__":
    sys.exit(main())