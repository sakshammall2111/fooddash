"""
🥗 AI Food Analyser
--------------------
A Streamlit app that uses Groq's `openai/gpt-oss-20b` model to analyse food
(by name, description, or a list of ingredients) and return structured
nutrition information, a health score, and suggestions.

Setup:
    pip install streamlit groq

Run:
    export GROQ_API_KEY="your_api_key_here"   # or paste it in the sidebar
    streamlit run food_analyser.py

Get a free Groq API key at: https://console.groq.com/keys
"""

import os
import json
import streamlit as st
from groq import Groq

MODEL_NAME = "openai/gpt-oss-20b"

# --------------------------------------------------------------------------
# API key
# --------------------------------------------------------------------------
# Reads GROQ_API_KEY from the environment, or from a .env file next to this
# script (GROQ_API_KEY=your_key_here). Never hardcode the key here.
# Get a free key at: https://console.groq.com/keys
def _load_env(path=".env"):
    if os.path.exists(path):
        with open(path, encoding="utf-8") as fh:
            for line in fh:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, _, v = line.partition("=")
                    os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))

_load_env()
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")

# --------------------------------------------------------------------------
# Page config
# --------------------------------------------------------------------------
st.set_page_config(
    page_title="AI Food Analyser",
    page_icon="🥗",
    layout="centered",
)

st.title("🥗 AI Food Analyser")
st.caption("Powered by Groq · `openai/gpt-oss-20b`")

# --------------------------------------------------------------------------
# Sidebar — API key + settings
# --------------------------------------------------------------------------
with st.sidebar:
    st.header("⚙️ Settings")

    st.subheader("Preferences (optional)")
    diet_pref = st.selectbox(
        "Dietary context",
        ["None", "Weight loss", "Muscle gain", "Diabetic-friendly",
         "Heart-healthy", "Vegetarian", "Vegan", "Keto", "Low-sodium"],
    )
    serving_note = st.text_input(
        "Serving size / quantity (optional)",
        placeholder="e.g. 1 bowl, 250g, 2 pieces",
    )

    st.divider()
    st.caption("Made with Streamlit + Groq")

# --------------------------------------------------------------------------
# Main input
# --------------------------------------------------------------------------
st.subheader("What did you eat?")

input_mode = st.radio(
    "Input type",
    ["Food name / dish", "Ingredients list", "Full meal description"],
    horizontal=True,
)

placeholder_map = {
    "Food name / dish": "e.g. Butter chicken with naan",
    "Ingredients list": "e.g. 2 eggs, 1 slice cheese, 1 tbsp butter, 1 slice bread",
    "Full meal description": "e.g. I had a bowl of rice, dal, one roti, and a side salad",
}

food_input = st.text_area(
    "Describe your food",
    placeholder=placeholder_map[input_mode],
    height=100,
)

analyse_btn = st.button("🔍 Analyse Food", type="primary", use_container_width=True)


# --------------------------------------------------------------------------
# Helper: build the prompt sent to the model
# --------------------------------------------------------------------------
def build_prompt(food_text: str, mode: str, diet: str, serving: str) -> str:
    context_lines = [f"Input type: {mode}", f"User input: {food_text}"]
    if serving.strip():
        context_lines.append(f"Serving size mentioned by user: {serving}")
    if diet != "None":
        context_lines.append(f"Dietary context to consider: {diet}")

    context = "\n".join(context_lines)

    return f"""You are a certified nutrition analysis assistant.

Analyse the following food and return your answer as STRICT JSON only —
no markdown, no code fences, no extra commentary. Use your best nutrition
knowledge to estimate values when exact data isn't available, and make
reasonable assumptions about standard serving sizes if none are given.

{context}

Return JSON with EXACTLY this schema:
{{
  "food_identified": "string - name of the dish/food you analysed",
  "estimated_serving": "string - the serving size assumed",
  "calories_kcal": number,
  "macros": {{
    "protein_g": number,
    "carbs_g": number,
    "fat_g": number,
    "fiber_g": number,
    "sugar_g": number
  }},
  "micronutrients_highlight": ["string - 2 to 5 notable vitamins/minerals present"],
  "health_score": number (0-100, where 100 is extremely healthy),
  "health_score_reason": "string - one or two sentence justification",
  "pros": ["string - up to 4 positive nutritional aspects"],
  "cons": ["string - up to 4 negative nutritional aspects or concerns"],
  "allergens": ["string - possible common allergens present, empty list if none obvious"],
  "diet_suitability": {{
    "suitable_for": ["string - diets/goals this food fits well"],
    "not_ideal_for": ["string - diets/goals this food does not fit well"]
  }},
  "suggestions": ["string - up to 3 practical tips to make this meal healthier"],
  "context_specific_advice": "string - advice tailored to the user's stated dietary context, or empty string if none given"
}}
"""


def call_groq(client: Groq, prompt: str) -> dict:
    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=[
            {
                "role": "system",
                "content": "You are a precise nutrition analysis engine. "
                           "You always respond with valid JSON only, matching "
                           "the exact schema requested. Never include markdown "
                           "formatting or explanations outside the JSON.",
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.3,
        max_tokens=1500,
    )
    raw = response.choices[0].message.content.strip()

    # Defensive cleanup in case the model wraps output in code fences
    if raw.startswith("```"):
        raw = raw.strip("`")
        if raw.lower().startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    return json.loads(raw)


# --------------------------------------------------------------------------
# Rendering helpers
# --------------------------------------------------------------------------
def render_result(data: dict):
    st.success(f"**{data.get('food_identified', 'Food')}** analysed successfully!")
    st.caption(f"Assumed serving: {data.get('estimated_serving', 'N/A')}")

    # Top metrics
    macros = data.get("macros", {})
    col1, col2, col3, col4 = st.columns(4)
    col1.metric("Calories", f"{data.get('calories_kcal', '?')} kcal")
    col2.metric("Protein", f"{macros.get('protein_g', '?')} g")
    col3.metric("Carbs", f"{macros.get('carbs_g', '?')} g")
    col4.metric("Fat", f"{macros.get('fat_g', '?')} g")

    col5, col6 = st.columns(2)
    col5.metric("Fiber", f"{macros.get('fiber_g', '?')} g")
    col6.metric("Sugar", f"{macros.get('sugar_g', '?')} g")

    # Health score
    st.divider()
    score = data.get("health_score", 0)
    st.subheader("🩺 Health Score")
    st.progress(min(max(int(score), 0), 100) / 100)
    st.write(f"**{score}/100** — {data.get('health_score_reason', '')}")

    # Micronutrients
    micro = data.get("micronutrients_highlight", [])
    if micro:
        st.write("**Notable nutrients:** " + ", ".join(micro))

    # Pros / cons
    st.divider()
    pcol, ccol = st.columns(2)
    with pcol:
        st.markdown("### ✅ Pros")
        for p in data.get("pros", []):
            st.markdown(f"- {p}")
    with ccol:
        st.markdown("### ⚠️ Cons")
        for c in data.get("cons", []):
            st.markdown(f"- {c}")

    # Allergens
    allergens = data.get("allergens", [])
    st.divider()
    st.markdown("### 🚨 Possible Allergens")
    st.write(", ".join(allergens) if allergens else "None obvious")

    # Diet suitability
    st.divider()
    st.markdown("### 🍽️ Diet Suitability")
    suit = data.get("diet_suitability", {})
    scol, ncol = st.columns(2)
    with scol:
        st.markdown("**Good fit for:**")
        for s in suit.get("suitable_for", []):
            st.markdown(f"- {s}")
    with ncol:
        st.markdown("**Not ideal for:**")
        for n in suit.get("not_ideal_for", []):
            st.markdown(f"- {n}")

    # Suggestions
    st.divider()
    st.markdown("### 💡 Suggestions to Improve This Meal")
    for s in data.get("suggestions", []):
        st.markdown(f"- {s}")

    advice = data.get("context_specific_advice", "")
    if advice:
        st.info(f"**Personalised note:** {advice}")

    with st.expander("Raw JSON response"):
        st.json(data)


# --------------------------------------------------------------------------
# Main logic
# --------------------------------------------------------------------------
if analyse_btn:
    if not GROQ_API_KEY or GROQ_API_KEY == "your_groq_api_key_here":
        st.error(
            "No API key configured. Open the script and set the "
            "GROQ_API_KEY variable near the top of the file."
        )
    elif not food_input.strip():
        st.warning("Please describe the food you want analysed.")
    else:
        try:
            with st.spinner("Analysing your food with gpt-oss-20b..."):
                client = Groq(api_key=GROQ_API_KEY)
                prompt = build_prompt(food_input, input_mode, diet_pref, serving_note)
                result = call_groq(client, prompt)
            render_result(result)
        except json.JSONDecodeError:
            st.error(
                "The model returned a response that wasn't valid JSON. "
                "Please try again — occasionally the model adds extra text."
            )
        except Exception as e:
            st.error(f"Something went wrong: {e}")

st.divider()
st.caption(
    "⚠️ Nutritional values are AI-estimated and may not be exact. "
    "For medical or clinical dietary decisions, consult a registered dietitian."
)