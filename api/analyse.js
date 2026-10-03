// Vercel serverless function: POST /api/analyse
// Forwards the meal text (or a food photo) to the Groq API. The key comes
// from the GROQ_API_KEY environment variable (set in the Vercel dashboard)
// and never reaches the browser.
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "openai/gpt-oss-20b";
const DEFAULT_VISION_MODEL = "qwen/qwen3.8-27b";

const SYSTEM_PROMPT = `You are a precise nutrition analyst. The user describes a meal or food.
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
- If the description is not food, return {"items": [], "rating": 0, "rating_reason": "not food", "notes": [], "negatives": [], "alternatives": [], "portion_advice": {}, "provides": [], "main_nutrients": [], "allergens": [], "category": "", "confidence": {}}.`;

const VISUAL_PROMPT = `Identify every visible food/drink item in this photo and estimate its portion in grams/ml.
Then analyse the WHOLE meal with the same nutrition JSON contract described in the system prompt.
If the image contains no food, return the not-food JSON.`;

function json(res, code, payload) {
  res.statusCode = code;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return json(res, 405, { error: "Use POST" });

  let body = {};
  try {
    // Vercel's Node runtime may deliver req.body as a pre-parsed object,
    // a raw string, or a Buffer depending on version.
    const raw = typeof req.body === "string" ? req.body
      : req.body && typeof req.body === "object" ? JSON.stringify(req.body)
      : (req.body ? req.body.toString() : "{}");
    body = JSON.parse(raw || "{}");
  } catch {
    return json(res, 400, { error: "Invalid JSON body." });
  }

  const text = String(body.text || "").trim().slice(0, 2000);
  const image = typeof body.image === "string" && body.image.startsWith("data:image/") ? body.image : "";
  if (!text && !image) return json(res, 400, { error: "Describe the meal or add a photo." });
  if (text.length >= 2000) return json(res, 400, { error: "Meal description too long (max 2000 chars)." });
  if (image.length > 3_500_000) return json(res, 400, { error: "Photo too large — try another image." });

  const apiKey = process.env.GROQ_API_KEY || "";
  if (!apiKey) {
    return json(res, 500, {
      error: "Server has no API key configured. Add GROQ_API_KEY in the hosting dashboard's environment variables.",
    });
  }

  const isVision = !!image;
  const model = isVision
    ? (process.env.MEALLENS_VISION_MODEL || DEFAULT_VISION_MODEL)
    : (process.env.MEALLENS_MODEL || DEFAULT_MODEL);

  const userContent = isVision
    ? [
        { type: "text", text: VISUAL_PROMPT + (text ? `\nUser note: ${text}` : "") },
        { type: "image_url", image_url: { url: image } },
      ]
    : "Analyse this meal:\n" + text;

  try {
    const groqRes = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_completion_tokens: 2048,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!groqRes.ok) {
      let detail = "";
      try { detail = (await groqRes.json())?.error?.message || ""; } catch { /* ignore */ }
      return json(res, 502, { error: `AI API error ${groqRes.status}${detail ? " - " + detail : ""}` });
    }

    const data = await groqRes.json();
    const content = data?.choices?.[0]?.message?.content ?? "";
    const start = content.indexOf("{"), end = content.lastIndexOf("}");
    if (start === -1 || end <= start) return json(res, 502, { error: "Model did not return JSON." });
    return json(res, 200, JSON.parse(content.slice(start, end + 1)));
  } catch (err) {
    return json(res, 500, { error: String(err?.message || err) });
  }
};
