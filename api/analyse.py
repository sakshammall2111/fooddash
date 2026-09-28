"""
Vercel serverless function: POST /api/analyse
Forwards the meal text to the Groq API. The key lives in the GROQ_API_KEY
environment variable (set it in Vercel -> Project -> Settings -> Environment
Variables) and never reaches the browser.
"""
import json
import os
import urllib.request
import urllib.error

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
DEFAULT_MODEL = "openai/gpt-oss-20b"

SYSTEM_PROMPT = """You are a precise nutrition analyst. The user describes a meal or food.
Estimate realistic quantities (in grams/ml) and nutrition values for the WHOLE stated quantity, not per 100 g.
Consider typical Indian/global preparations; include cooking oil, ghee, sugar and salt where relevant.
Reply with ONLY a JSON object, no markdown, matching exactly:
{
  "items": [
    {"name": "chapati", "grams": 80, "calories": 200, "protein": 7.5, "carbs": 34,
     "fat": 3.2, "fiber": 5.5, "sugar": 1.0, "sodium": 140}
  ],
  "rating": 7.5,
  "rating_reason": "one short sentence on why this score",
  "notes": ["short insight 1", "short insight 2", "short insight 3"]
}
Rules:
- 4-10 items max; merge tiny condiments into the dish they belong to.
- rating: healthiness of the whole meal, 0 (worst) to 10 (best), one decimal.
- notes: 3-6 strings, max 90 chars each (energy density, macro balance, fibre, sugar, sodium, what to add).
- grams/ml must be plausible for a single serving of the described meal.
- If the description is not food, return {"items": [], "rating": 0, "rating_reason": "not food", "notes": []}."""


def _json_response(code, payload):
    body = json.dumps(payload).encode("utf-8")
    return {
        "statusCode": code,
        "headers": {"Content-Type": "application/json"},
        "body": body.decode("utf-8"),
    }


def call_groq(meal_text, api_key, model):
    payload = {
        "model": model,
        "temperature": 0.2,
        "max_completion_tokens": 2048,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": "Analyse this meal:\n" + meal_text},
        ],
    }
    req = urllib.request.Request(
        GROQ_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
            # Cloudflare in front of the Groq API blocks the default
            # "Python-urllib/3.x" user agent with error 1010 (bot ban).
            "User-Agent": "Mozilla/5.0 (compatible; MealLens/1.0)",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read().decode("utf-8"))

    content = data["choices"][0]["message"]["content"]
    start, end = content.find("{"), content.rfind("}")
    if start == -1 or end <= start:
        raise ValueError("Model did not return JSON")
    return json.loads(content[start:end + 1])


def handler(event, context):
    if event.get("httpMethod") != "POST":
        return _json_response(405, {"error": "Use POST"})

    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return _json_response(400, {"error": "Invalid JSON body."})

    meal_text = str(body.get("text", "")).strip()
    if not meal_text:
        return _json_response(400, {"error": "Meal text is required."})
    if len(meal_text) > 2000:
        return _json_response(400, {"error": "Meal description too long (max 2000 chars)."})

    api_key = os.environ.get("GROQ_API_KEY", "")
    if not api_key:
        return _json_response(500, {
            "error": "Server has no API key configured. Add GROQ_API_KEY in the "
                     "hosting dashboard's environment variables."
        })

    model = os.environ.get("MEALLENS_MODEL", DEFAULT_MODEL)
    try:
        result = call_groq(meal_text, api_key, model)
        return _json_response(200, result)
    except urllib.error.HTTPError as e:
        detail = ""
        try:
            detail = json.loads(e.read().decode()).get("error", {}).get("message", "")
        except Exception:
            pass
        msg = f"Groq API error {e.code}" + (f" - {detail}" if detail else "")
        return _json_response(502, {"error": msg})
    except Exception as e:  # noqa: BLE001
        return _json_response(500, {"error": str(e)})
