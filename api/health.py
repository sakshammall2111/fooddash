"""
Vercel serverless function: GET /api/health
Reports whether the server-side API key is configured.
"""
import json
import os


def handler(event, context):
    body = json.dumps({"ok": True, "api_key_configured": bool(os.environ.get("GROQ_API_KEY"))})
    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": body,
    }
