#!/usr/bin/env python3
"""
figma_bot.py

Purpose:
  CLI helper to export a Figma file's JSON using a PAT stored in AWS Secrets Manager.

Usage:
  python tools/figma/figma_bot.py --file-id <FIGMA_FILE_ID> --output ./spec.json

Environment:
  AWS_REGION           – AWS region of the secret (e.g., us-west-2)
  FIGMA_SECRET_NAME    – Secrets Manager name (default: figma/pat)
  FIGMA_API_BASE       – Optional override (default: https://api.figma.com/v1)

Notes:
  - No secrets are printed or persisted.
  - Exits non‑zero on error for CI compatibility.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any, Dict

import boto3
from boto3.session import Session
from botocore.exceptions import ClientError, NoCredentialsError
import requests

DEFAULT_SECRET_NAME = "figma/pat"
DEFAULT_API_BASE = "https://api.figma.com/v1"
TIMEOUT = 30  # seconds


def log(msg: str) -> None:
    print(f"[figma_bot] {msg}")


def get_env(name: str, default: str | None = None) -> str | None:
    val = os.getenv(name, default)
    return val


def get_figma_token(secret_name: str, region: str) -> str:
    """Fetch Figma PAT from AWS Secrets Manager. Secret JSON must contain key `token`."""
    try:
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
            # Support plain-string secrets containing only the token
            payload = {"token": secret_str}
        token = payload.get("token")
        if not token:
            raise RuntimeError("Secret JSON must contain key 'token'")
        return token
    except NoCredentialsError as e:
        raise RuntimeError("AWS credentials not available for Secrets Manager access") from e
    except ClientError as e:
        code = e.response.get("Error", {}).get("Code")
        raise RuntimeError(f"Failed to read secret '{secret_name}': {code}") from e


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
    """Basic normalization to keep payload useful but compact.

    Keeps top-level document, components, styles, and file metadata if present.
    Falls back to returning original JSON when expected keys are missing.
    """
    keys = ["name", "lastModified", "thumbnailUrl", "version"]
    out: Dict[str, Any] = {k: figma_json.get(k) for k in keys if k in figma_json}
    doc = figma_json.get("document")
    if doc is not None:
        out["document"] = doc
    comps = figma_json.get("components")
    if comps is not None:
        out["components"] = comps
    styles = figma_json.get("styles")
    if styles is not None:
        out["styles"] = styles

    # If we captured nothing meaningful, return original
    if not out:
        return figma_json
    return out


def write_json(path: Path, data: Dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    log(f"Wrote {path}")


def parse_args(argv: list[str]) -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Export a Figma file JSON using PAT from AWS Secrets Manager")
    p.add_argument("--file-id", required=True, help="Figma file key from the URL")
    p.add_argument("--output", default="./figma_file.json", help="Output JSON path")
    p.add_argument("--raw", action="store_true", help="Write raw Figma response without normalization")
    return p.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])

    region = get_env("AWS_REGION")
    if not region:
        log("ERROR: AWS_REGION is required")
        return 2

    secret_name = get_env("FIGMA_SECRET_NAME", DEFAULT_SECRET_NAME) or DEFAULT_SECRET_NAME
    api_base = get_env("FIGMA_API_BASE", DEFAULT_API_BASE) or DEFAULT_API_BASE

    try:
        token = get_figma_token(secret_name=secret_name, region=region)
    except Exception as e:
        log(f"ERROR: {e}")
        return 3

    try:
        raw = fetch_figma_file(file_key=args["file_id"] if isinstance(args, dict) else args.file_id, token=token, api_base=api_base)
    except Exception as e:
        log(f"ERROR: {e}")
        return 4

    data = raw if args.raw else normalize(raw)

    try:
        write_json(Path(args.output), data)
    except Exception as e:
        log(f"ERROR: Failed to write output: {e}")
        return 5

    log("Done")
    return 0


if __name__ == "__main__":
    sys.exit(main())