// Vercel serverless function: POST /api/analyse
// Forwards the meal text to the Groq API. The key comes from the
// GROQ_API_KEY environment variable (set in the Vercel dashboard) and
// never reaches the browser.
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "openai/gpt-oss-20b";

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
  ]
}
Rules:
- 4-10 items max; merge tiny condiments into the dish they belong to.
- rating: healthiness of the whole meal, 0 (worst) to 10 (best), one decimal.
- notes: 3-6 strings, max 90 chars each (energy density, macro balance, fibre, sugar, sodium, what to add).
- negatives: 2-5 short strings (max 80 chars each) calling out the UNHEALTHY aspects of the meal: deep-fried, high saturated fat, added sugar, refined carbs, excess sodium, ultra-processed, low fibre, oversized portion, etc. Be specific with numbers when useful (e.g. "1 180 mg sodium is 68% of a day's cap"). If the meal is genuinely very healthy, return an empty array [].
- alternatives: 2-4 objects; each a SIMILAR but healthier food or swap for the same craving/dish (e.g. fried samosa -> baked vegetable samosa or sprout chaat; white rice -> brown rice or quinoa; sugary cola -> sparkling water with lime). Make the options genuinely varied (different dishes or preparations, not the same dish with one word changed). "why" is one short sentence (max 90 chars) on what makes it better. Keep names short.
- grams/ml must be plausible for a single serving of the described meal.
- If the description is not food, return {"items": [], "rating": 0, "rating_reason": "not food", "notes": [], "negatives": [], "alternatives": []}.`;

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

  const text = String(body.text || "").trim();
  if (!text) return json(res, 400, { error: "Meal text is required." });
  if (text.length > 2000) return json(res, 400, { error: "Meal description too long (max 2000 chars)." });

  const apiKey = process.env.GROQ_API_KEY || "";
  if (!apiKey) {
    return json(res, 500, {
      error: "Server has no API key configured. Add GROQ_API_KEY in the hosting dashboard's environment variables.",
    });
  }

  const model = process.env.MEALLENS_MODEL || DEFAULT_MODEL;
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
          { role: "user", content: "Analyse this meal:\n" + text },
        ],
      }),
    });

    if (!groqRes.ok) {
      let detail = "";
      try { detail = (await groqRes.json())?.error?.message || ""; } catch { /* ignore */ }
      return json(res, 502, { error: `Groq API error ${groqRes.status}${detail ? " - " + detail : ""}` });
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
