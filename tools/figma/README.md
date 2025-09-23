
# Figma Bot Tool (`/tools/figma/figma_bot.py`)

Owner: Doc (Technical Writer)
Reviewers: Lyra (Frontend), Kira (DevOps), Sable (Security)
Approval gate: Ava (PM)
Ticket: T-FIGMA-BOT-README
DoD: README includes setup, usage, auth flow, IAM example, CI hint, and security guidance; validated on staging.

---

## Purpose

Automate read access to Figma files to export design metadata for UX handoff and downstream tooling. The Python script calls the Figma REST API with a Personal Access Token (PAT) retrieved securely from AWS Secrets Manager. No secrets in plaintext.

References:

- Figma API: <https://www.figma.com/developers/api>
- Manage PATs: <https://help.figma.com/hc/en-us/articles/8085703771159-Manage-personal-access-tokens>
- Team-Wide Conventions (secrets): see repo root docs.

---

## Requirements

- Python 3.10+
- AWS IAM role or user with permission to read the secret
- Network egress to `api.figma.com`

### Python dependencies

```bash
pip install -r requirements.txt
# or explicitly
pip install requests boto3
```

> Note: `requirements.txt` should live next to this README and include `requests` and `boto3`.

---

## Configuration

### 1) Create and store the Figma PAT

1. Generate a PAT in Figma (Account Settings → Personal access tokens). Copy once and store safely.
   Docs: <https://help.figma.com/hc/en-us/articles/8085703771159-Manage-personal-access-tokens>
2. In AWS Secrets Manager, create a secret (e.g., `figma/pat`) with JSON payload:

```json
{ "token": "<YOUR_FIGMA_PAT>" }
```

### 2) Grant read access via IAM (least privilege)

Attach a policy like this to the role that runs the script (GitHub Actions OIDC role, EC2, or developer profile):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ReadSpecificFigmaPAT",
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": "arn:aws:secretsmanager:<REGION>:<ACCOUNT_ID>:secret:figma/pat-*"
    }
  ]
}
```

AWS docs on Secrets Manager IAM examples:

- Identity-based policies: <https://docs.aws.amazon.com/secretsmanager/latest/userguide/auth-and-access_iam-policies.html>
- GetSecretValue API: <https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html>

### 3) Runtime environment

Set these environment variables in your shell or pipeline step:

- `AWS_REGION` — region of the secret
- `FIGMA_SECRET_NAME` — name of the secret (default suggested: `figma/pat`)

Optional:

- `FIGMA_API_BASE` — override API base (default `https://api.figma.com/v1`)

---

## Usage

### CLI

```bash
python figma_bot.py --file-id <FIGMA_FILE_ID> --output ./spec.json
```

- `--file-id` is the Figma file key from the URL: `https://www.figma.com/file/<FILE_ID>/...`
- `--output` path to write JSON export. Defaults to `./figma_file.json` if omitted.

### What it does

- Retrieves PAT from Secrets Manager
- Calls Figma `GET /v1/files/{file_key}` to fetch document nodes
  API reference: <https://www.figma.com/developers/api#files>
- Writes normalized JSON for consumption by frontend tooling

### Example

```bash
export AWS_REGION=us-west-2
export FIGMA_SECRET_NAME=figma/pat
python tools/figma/figma_bot.py --file-id Qwerty123ABC --output ./out/spec.json
```

---

## Authentication Flow (text diagram)

```text
[Caller (CLI or CI)]
      |
      | assume role / use IAM creds
      v
[AWS Secrets Manager] --(GetSecretValue)--> { token }
      |
      v
[figma_bot.py] --(HTTPS with "X-Figma-Token: <token>")--> [Figma API]
      |
      v
 Writes JSON to --output
```

---

## CI/CD integration (example)

GitHub Actions step (uses OIDC to assume AWS role):

Use the CI helper to resolve the Figma PAT from Secrets Manager and invoke the
bot without exposing credentials:

```yaml
- name: Export Figma spec
  run: |
    python tools/figma/ci_integration.py --output ./artifacts/figma_spec.json
  env:
    AWS_REGION: us-west-2
    FIGMA_SECRET_NAME: figma/pat
    FILE_ID: ${{ secrets.FIGMA_FILE_ID }}
```

Ensure the workflow role can read the secret as per IAM policy above.

---

## Security Guardrails

- Do **not** commit PATs or derived JSON containing secrets.
- Restrict secret scope to a single PAT dedicated to this integration.
- Rotate the PAT on a schedule and on personnel changes.
- Use least-privilege IAM targeting only the specific secret ARN.
- Enable secret access audit logs and alerts.

---

## Troubleshooting

- `403 Forbidden` from Figma → PAT invalid, expired, or missing scopes. Regenerate PAT and update the secret.
- `AccessDeniedException` from Secrets Manager → IAM role lacks `secretsmanager:GetSecretValue` or wrong secret ARN/region.
- Empty or partial JSON → Confirm correct `FILE_ID` and that your account has access to the file.

---

## Maintenance

- Owners review quarterly for API changes and rotate PAT.
- Update README when adding new flags or outputs.
