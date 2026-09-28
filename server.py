"""
MealLens local server
=====================
Serves the static files (index.html, style.css, script.js) and provides a
single API endpoint, POST /api/analyse, which forwards the meal text to the
Groq API. The key lives in .env and never reaches the browser.

Run:  python server.py            (then open http://127.0.0.1:8613)
"""
import json
import os
import sys
import urllib.request
import urllib.error
from http.server import HTTPServer, SimpleHTTPRequestHandler

HOST = "127.0.0.1"
PORT = 8613
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
DEFAULT_MODEL = "openai/gpt-oss-20b"


def load_env(path=".env"):
    """Tiny .env reader: KEY=VALUE lines, # comments, optional quotes."""
    if not os.path.exists(path):
        return {}
    env = {}
    with open(path, encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            value = value.strip().strip('"').strip("'")
            if key and value:
                env[key.strip()] = value
    return env


ENV = load_env()
API_KEY = os.environ.get("GROQ_API_KEY") or ENV.get("GROQ_API_KEY", "")
MODEL = os.environ.get("MEALLENS_MODEL") or ENV.get("MEALLENS_MODEL", DEFAULT_MODEL)

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


def call_groq(meal_text):
    """Send the meal to Groq and return the parsed JSON answer."""
    payload = {
        "model": MODEL,
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
            "Authorization": f"Bearer {API_KEY}",
            # Cloudflare in front of the Groq API blocks the default
            # "Python-urllib/3.x" user agent with error 1010 (bot ban).
            "User-Agent": "Mozilla/5.0 (compatible; MealLens/1.0)",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = json.loads(resp.read().decode("utf-8"))

    content = data["choices"][0]["message"]["content"]
    start, end = content.find("{"), content.rfind("}")
    if start == -1 or end <= start:
        raise ValueError("Model did not return JSON")
    return json.loads(content[start:end + 1])


class Handler(SimpleHTTPRequestHandler):
    def _send(self, code, body, ctype="application/json"):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == "/api/health":
            body = json.dumps({"ok": True, "api_key_configured": bool(API_KEY)}).encode()
            return self._send(200, body)
        super().do_GET()

    def do_POST(self):
        if self.path != "/api/analyse":
            self._send(404, b'{"error":"not found"}')
            return
        try:
            length = int(self.headers.get("Content-Length", 0))
            meal_text = json.loads(self.rfile.read(length).decode("utf-8")).get("text", "").strip()
            if not meal_text:
                self._send(400, json.dumps({"error": "Meal text is required."}).encode())
                return

            if not API_KEY:
                self._send(500, json.dumps({
                    "error": "No API key configured. Put your Groq key in the .env file "
                             "(GROQ_API_KEY=...) and restart the server."
                }).encode())
                return

            result = call_groq(meal_text)
            self._send(200, json.dumps(result).encode("utf-8"))
        except urllib.error.HTTPError as e:
            detail = ""
            try:
                detail = json.loads(e.read().decode()).get("error", {}).get("message", "")
            except Exception:
                pass
            msg = f"Groq API error {e.code}" + (f" - {detail}" if detail else "")
            self._send(502, json.dumps({"error": msg}).encode())
        except Exception as e:  # noqa: BLE001
            self._send(500, json.dumps({"error": str(e)}).encode())

    def log_message(self, fmt, *args):  # quieter logs
        sys.stderr.write("[meallens] %s\n" % (fmt % args))


if __name__ == "__main__":
    if not API_KEY:
        print("!! No GROQ_API_KEY found. Add it to .env (or export it) and restart.")
    print(f"MealLens running at http://{HOST}:{PORT}  (model: {MODEL})")
    try:
        HTTPServer((HOST, PORT), Handler).serve_forever()
    except KeyboardInterrupt:
        print("\nBye.")
