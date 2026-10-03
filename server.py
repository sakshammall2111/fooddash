"""
MealLens local server
=====================
Serves the static files (index.html, style.css, script.js) and provides a
single API endpoint, POST /api/analyse, which forwards the meal text or a
food photo to the Groq API. The key lives in .env and never reaches the browser.

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
DEFAULT_VISION_MODEL = "qwen/qwen3.8-27b"


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
VISION_MODEL = os.environ.get("MEALLENS_VISION_MODEL") or ENV.get("MEALLENS_VISION_MODEL", DEFAULT_VISION_MODEL)

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
  "notes": ["short insight 1", "short insight 2", "short insight 3"],
  "negatives": ["short unhealthy aspect 1", "short unhealthy aspect 2"],
  "alternatives": [
    {"name": "healthier similar food", "why": "one short sentence why it is better"}
  ],
  "portion_advice": {
    "how_much": "e.g. 1 katori (150 g) per person as part of a meal",
    "calories": 240,
    "how_often": "e.g. 2-3 times a week",
    "best_time": "e.g. lunch"
  },
  "provides": ["what the meal offers the body, e.g. steady energy from complex carbs", "supports muscle recovery"],
  "main_nutrients": ["protein 18 g (36% of a day)", "iron 4 mg"],
  "allergens": ["milk", "gluten"],
  "category": "Indian main course",
  "confidence": {"level": "high", "note": "common dish with well-known values"}
}
Rules:
- 4-10 items max; merge tiny condiments into the dish they belong to.
- rating: healthiness of the whole meal, 0 (worst) to 10 (best), one decimal.
- notes: 3-6 strings, max 90 chars each (energy density, macro balance, fibre, sugar, sodium, what to add).
- negatives: 2-5 short strings (max 80 chars each) calling out the UNHEALTHY aspects of the meal: deep-fried, high saturated fat, added sugar, refined carbs, excess sodium, ultra-processed, low fibre, oversized portion, etc. Be specific with numbers when useful (e.g. "1 180 mg sodium is 68% of a day's cap"). If the meal is genuinely very healthy, return an empty array [].
- alternatives: 2-4 objects; each a SIMILAR but healthier food or swap for the same craving/dish (e.g. fried samosa -> baked vegetable samosa or sprout chaat; white rice -> brown rice or quinoa; sugary cola -> sparkling water with lime). Make the options genuinely varied (different dishes or preparations, not the same dish with one word changed). "why" is one short sentence (max 90 chars) on what makes it better. Keep names short.
- portion_advice: portion guidance for ONE person. how_much = realistic household measure to eat in one sitting (e.g. "2 chapati + 1 katori dal"); calories = kcal of that recommended portion; how_often = how frequently it is OK to eat this ("daily", "4-5 times a week", "once a week", "occasionally as a treat"); best_time = best time of day (breakfast/lunch/evening snack/avoid late night). Keep strings short (max 80 chars).
- provides: 2-4 short strings (max 80 chars each) on what the meal offers the body: energy type, satiety, muscle, digestion, vitamins/minerals.
- main_nutrients: 2-4 strings (max 60 chars each), the stand-out nutrients WITH amounts, e.g. "protein 18 g (36% of a day)" or "vitamin C 45 mg".
- allergens: ONLY from this list when present: milk, eggs, wheat/gluten, peanuts, tree nuts, soy, fish, shellfish, sesame, mustard. Empty array if none.
- category: ONE short category, India-aware, e.g. "Indian breakfast", "Indian main course", "Indian street food", "Indian dessert", "fast food", "beverage", "salad", "global dish".
- confidence: level "high", "medium" or "low" + "note" (max 70 chars) explaining it (standard dish = high; vague description or mixed photo = lower).
- grams/ml must be plausible for a single serving of the described meal.
- If the description is not food, return {"items": [], "rating": 0, "rating_reason": "not food", "notes": [], "negatives": [], "alternatives": [], "portion_advice": {}, "provides": [], "main_nutrients": [], "allergens": [], "category": "", "confidence": {}}."""

VISUAL_PROMPT = """Identify every visible food/drink item in this photo and estimate its portion in grams/ml.
Then analyse the WHOLE meal with the same nutrition JSON contract described in the system prompt.
If the image contains no food, return the not-food JSON."""


def call_groq(meal_text=None, image_data_url=None):
    """Send the meal (text and/or photo) to Groq and return the parsed JSON answer."""
    is_vision = bool(image_data_url)
    if is_vision:
        user_content = [
            {"type": "text", "text": VISUAL_PROMPT + (f"\nUser note: {meal_text}" if meal_text else "")},
            {"type": "image_url", "image_url": {"url": image_data_url}},
        ]
    else:
        user_content = "Analyse this meal:\n" + meal_text

    payload = {
        "model": VISION_MODEL if is_vision else MODEL,
        "temperature": 0.2,
        "max_completion_tokens": 2048,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
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
    with urllib.request.urlopen(req, timeout=90) as resp:
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
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
            meal_text = str(payload.get("text", "")).strip()[:2000]
            image = payload.get("image", "")
            image_ok = isinstance(image, str) and image.startswith("data:image/")
            if image_ok and len(image) > 3_500_000:
                self._send(400, json.dumps({"error": "Photo too large — try another image."}).encode())
                return
            if not meal_text and not image_ok:
                self._send(400, json.dumps({"error": "Describe the meal or add a photo."}).encode())
                return

            if not API_KEY:
                self._send(500, json.dumps({
                    "error": "No API key configured. Put your Groq key in the .env file "
                             "(GROQ_API_KEY=...) and restart the server."
                }).encode())
                return

            result = call_groq(meal_text or None, image if image_ok else None)
            self._send(200, json.dumps(result).encode("utf-8"))
        except urllib.error.HTTPError as e:
            detail = ""
            try:
                detail = json.loads(e.read().decode()).get("error", {}).get("message", "")
            except Exception:
                pass
            msg = f"AI API error {e.code}" + (f" - {detail}" if detail else "")
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
