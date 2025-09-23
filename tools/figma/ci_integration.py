#!/usr/bin/env python3
"""CI helper that exports a Figma file spec for downstream tooling.

The helper is intended for CI environments such as GitHub Actions. It pulls the
Figma personal access token (PAT) from AWS Secrets Manager, invokes the existing
``figma_bot.py`` script, and writes the artifact JSON to the requested path.
"""
from __future__ import annotations

import argparse
import base64
import json
import logging
import os
import subprocess
import sys
from pathlib import Path
from typing import Dict, Sequence

import boto3
from botocore.exceptions import BotoCoreError, ClientError


LOGGER = logging.getLogger("figma.ci")

# Exit codes reserved for CI visibility.
EXIT_SUCCESS = 0
EXIT_CONFIG_ERROR = 2
EXIT_SECRET_ERROR = 3
EXIT_FIGMA_BOT_ERROR = 4
EXIT_UNEXPECTED_ERROR = 5

DEFAULT_SECRET_NAME = "figma/pat"
FIGMA_BOT_FILENAME = "figma_bot.py"


class CIIntegrationError(Exception):
    """Base class for predictable integration failures."""

    exit_code: int = EXIT_UNEXPECTED_ERROR


class ConfigurationError(CIIntegrationError):
    exit_code = EXIT_CONFIG_ERROR


class SecretRetrievalError(CIIntegrationError):
    exit_code = EXIT_SECRET_ERROR


class FigmaBotExecutionError(CIIntegrationError):
    exit_code = EXIT_FIGMA_BOT_ERROR


def configure_logging(level: int = logging.INFO) -> None:
    """Configure stdout logging for CI readability."""

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter("[%(levelname)s] %(message)s"))
    LOGGER.addHandler(handler)
    LOGGER.setLevel(level)


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Export a Figma file spec via figma_bot.py in CI environments",
    )
    parser.add_argument(
        "--file-id",
        help="Figma file ID. Overrides FILE_ID env var when provided.",
    )
    parser.add_argument(
        "--output",
        default="./artifacts/figma_spec.json",
        help="Path to write the exported Figma JSON artifact.",
    )
    parser.add_argument(
        "--figma-bot-path",
        default=None,
        help="Optional explicit path to figma_bot.py (defaults to sibling file).",
    )
    return parser.parse_args(argv)


def resolve_file_id(cli_file_id: str | None) -> str:
    file_id = cli_file_id or os.getenv("FILE_ID")
    if not file_id:
        raise ConfigurationError(
            "Figma file ID must be provided via --file-id or FILE_ID env var",
        )
    return file_id


def resolve_region() -> str:
    region = os.getenv("AWS_REGION")
    if not region:
        raise ConfigurationError("AWS_REGION env var is required for Secrets Manager access")
    return region


def resolve_secret_name() -> str:
    return os.getenv("FIGMA_SECRET_NAME", DEFAULT_SECRET_NAME)


def load_figma_bot_path(explicit_path: str | None) -> Path:
    if explicit_path:
        path = Path(explicit_path)
    else:
        path = Path(__file__).resolve().with_name(FIGMA_BOT_FILENAME)
    if not path.exists():
        raise ConfigurationError(f"Unable to locate figma_bot.py at {path}")
    return path


def fetch_figma_token(secret_name: str, region: str) -> str:
    LOGGER.info(
        "Retrieving Figma token from Secrets Manager secret '%s' in region '%s'",
        secret_name,
        region,
    )
    client = boto3.client("secretsmanager", region_name=region)
    try:
        response = client.get_secret_value(SecretId=secret_name)
    except (BotoCoreError, ClientError) as exc:  # pragma: no cover - defensive logging
        raise SecretRetrievalError(f"Failed to read secret '{secret_name}': {exc}") from exc

    secret_string = response.get("SecretString")
    if not secret_string:
        secret_binary = response.get("SecretBinary")
        if not secret_binary:
            raise SecretRetrievalError(
                f"Secret '{secret_name}' did not contain SecretString or SecretBinary payload",
            )
        try:
            secret_string = base64.b64decode(secret_binary).decode("utf-8")
        except (ValueError, UnicodeDecodeError) as exc:
            raise SecretRetrievalError(
                f"Secret '{secret_name}' binary payload is not valid base64 encoded UTF-8 JSON: {exc}",
            ) from exc

    try:
        payload = json.loads(secret_string)
    except json.JSONDecodeError as exc:
        raise SecretRetrievalError(
            f"Secret '{secret_name}' payload is not valid JSON: {exc.msg}",
        ) from exc

    token = payload.get("token")
    if not token:
        raise SecretRetrievalError(
            f"Secret '{secret_name}' JSON payload must include a 'token' field",
        )

    LOGGER.info("Successfully retrieved Figma token metadata from Secrets Manager")
    return token


def run_figma_bot(figma_bot_path: Path, file_id: str, output_path: Path, token: str) -> None:
    LOGGER.info("Ensuring artifact directory exists at %s", output_path.parent)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    cmd = [
        sys.executable,
        str(figma_bot_path),
        "--file-id",
        file_id,
        "--output",
        str(output_path),
    ]

    LOGGER.info(
        "Invoking figma_bot.py for file '%s'; output will be written to %s",
        file_id,
        output_path,
    )
    env: Dict[str, str] = os.environ.copy()
    # Provide both FIGMA_PAT and FIGMA_ACCESS_TOKEN to maximise compatibility.
    env.update(
        {
            "FIGMA_PAT": token,
            "FIGMA_ACCESS_TOKEN": token,
        }
    )

    try:
        subprocess.run(cmd, check=True, env=env)
    except subprocess.CalledProcessError as exc:
        raise FigmaBotExecutionError(
            f"figma_bot.py exited with status {exc.returncode}",
        ) from exc

    LOGGER.info("figma_bot.py completed successfully; artifact available at %s", output_path)


def main(argv: Sequence[str] | None = None) -> int:
    configure_logging()
    args = parse_args(argv)
    try:
        file_id = resolve_file_id(args.file_id)
        region = resolve_region()
        secret_name = resolve_secret_name()
        figma_bot_path = load_figma_bot_path(args.figma_bot_path)
        output_path = Path(args.output).resolve()
        token = fetch_figma_token(secret_name, region)
        run_figma_bot(figma_bot_path, file_id, output_path, token)
    except CIIntegrationError as exc:
        LOGGER.error(str(exc))
        return exc.exit_code
    except Exception as exc:  # pragma: no cover - catch-all for CI signal
        LOGGER.exception("Unexpected error during Figma export: %s", exc)
        return EXIT_UNEXPECTED_ERROR

    return EXIT_SUCCESS


if __name__ == "__main__":
    sys.exit(main())
