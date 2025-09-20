import csv
import os
import requests
from pathlib import Path

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
REPO_OWNER = "HalPilotte"
REPO_NAME = "poker-room-operator-mvp"

headers = {
    "Authorization": f"token {GITHUB_TOKEN}",
    "Accept": "application/vnd.github.v3+json",
}

CSV_PATH = Path(__file__).with_name("issues.csv")
with open(CSV_PATH, newline="", encoding="utf-8") as file:
    reader = csv.DictReader(file)
    for row in reader:
        issue_data = {
            "title": row["Title"],
            "body": row["Description"],
            "labels": [label.strip() for label in row["Labels"].split(",")] if row.get("Labels") else [],
        }
        response = requests.post(
            f"https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}/issues",
            json=issue_data,
            headers=headers,
        )
        if response.status_code == 201:
            print(f"Issue '{row['Title']}' created successfully.")
        else:
            print(f"Failed to create issue '{row['Title']}': {response.json()}")