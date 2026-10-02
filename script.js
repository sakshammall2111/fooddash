/* =====================================================
   MealLens — script.js
   Talks to the local server.py, which proxies to the AI API.
   ===================================================== */
"use strict";

/* ------------------------------------------------------------------
   1. Offline food table (per 100 g / 100 ml) — fallback & cross-check
   ------------------------------------------------------------------ */
const FOODS = [
  ["rice (white, cooked)","grain",130,2.7,28.2,0.3,0.4,0.1,1,"staple"],
  ["rice (brown, cooked)","grain",123,2.7,25.6,1.0,1.6,0.4,4,"wholegrain"],
  ["roti / chapati","grain",297,11.0,51.0,4.6,8.0,1.5,200,"wholegrain"],
  ["paratha (plain)","grain",320,6.5,45.0,12.5,3.5,1.2,280,""],
  ["naan","grain",310,8.7,50.0,6.0,2.2,3.2,420,"refined"],
  ["puri","grain",400,6.5,45.0,21.0,2.5,1.0,250,"fried"],
  ["bread (white)","grain",265,9.0,49.0,3.2,2.7,5.0,491,"refined"],
  ["oats (rolled, dry)","grain",389,16.9,66.3,6.9,10.6,0.0,2,"wholegrain"],
  ["oatmeal (cooked)","grain",71,2.5,12.0,1.4,1.7,0.3,4,"wholegrain"],
  ["cornflakes","grain",357,7.5,84.0,0.4,3.3,8.0,729,"ultra-processed"],
  ["pasta (cooked)","grain",131,5.0,25.0,1.1,1.8,0.6,6,""],
  ["instant noodles","grain",448,9.4,62.0,17.0,3.0,2.0,1200,"ultra-processed"],
  ["quinoa (cooked)","grain",120,4.4,21.3,1.9,2.8,0.9,7,"wholegrain"],
  ["poha (cooked)","grain",130,2.4,27.5,1.5,0.9,0.2,180,""],
  ["upma","grain",140,3.2,20.0,5.2,1.4,1.0,320,""],
  ["idli","grain",133,4.0,26.0,1.0,1.2,0.5,190,"steamed"],
  ["dosa (plain)","grain",168,3.9,25.0,5.7,1.1,0.6,230,"fermented"],
  ["masala dosa","grain",200,4.5,28.0,8.0,2.0,1.5,300,""],
  ["dal (lentil, cooked)","legume",116,9.0,20.1,0.4,7.9,1.8,240,"plant protein"],
  ["rajma (kidney beans)","legume",127,8.7,22.8,0.5,7.4,0.3,6,"plant protein"],
  ["chickpeas (boiled)","legume",164,8.9,27.4,2.6,7.6,4.8,7,"plant protein"],
  ["soy chunks (dry)","legume",345,52.0,33.0,0.5,13.0,2.5,2,"complete protein"],
  ["tofu","legume",76,8.1,1.9,4.8,0.3,0.6,7,"plant protein"],
  ["moong sprouts","legume",30,3.0,5.9,0.2,1.8,4.1,6,"low calorie"],
  ["peanut butter","legume",588,25.0,20.0,50.0,6.0,9.0,476,""],
  ["milk (whole)","dairy",61,3.2,4.8,3.3,0.0,5.1,43,"calcium"],
  ["milk (skimmed)","dairy",34,3.4,5.0,0.1,0.0,5.1,42,"low calorie"],
  ["curd / yogurt","dairy",61,3.5,4.7,3.3,0.0,4.7,36,"probiotic"],
  ["greek yogurt","dairy",59,10.0,3.6,0.4,0.0,3.2,36,"protein"],
  ["paneer","dairy",265,18.3,1.2,20.8,0.0,1.2,18,"protein"],
  ["cheese (cheddar)","dairy",403,25.0,1.3,33.0,0.0,0.5,621,"saturated fat"],
  ["butter","dairy",717,0.9,0.1,81.1,0.0,0.1,643,"saturated fat"],
  ["ghee","dairy",900,0.0,0.0,100.0,0.0,0.0,2,"saturated fat"],
  ["ice cream (vanilla)","dairy",207,3.5,23.6,11.0,0.7,21.0,80,"added sugar"],
  ["egg (boiled)","protein",155,12.6,1.1,10.6,0.0,1.1,124,"complete protein"],
  ["egg white","protein",52,10.9,0.7,0.2,0.0,0.7,166,"lean protein"],
  ["omelette","protein",154,10.6,0.6,11.9,0.0,0.5,250,""],
  ["chicken breast","protein",165,31.0,0.0,3.6,0.0,0.0,74,"lean protein"],
  ["chicken thigh","protein",209,26.0,0.0,10.9,0.0,0.0,84,"protein"],
  ["chicken curry","protein",180,15.0,6.0,10.0,1.2,2.0,480,""],
  ["tandoori chicken","protein",175,27.0,2.0,6.5,0.3,1.0,520,"grilled"],
  ["chicken nuggets","protein",296,15.0,16.0,19.0,1.0,0.5,557,"fried"],
  ["mutton (goat)","protein",143,27.0,0.0,3.0,0.0,0.0,82,"lean protein"],
  ["fish (rohu)","protein",97,16.6,0.0,3.2,0.0,0.0,60,"lean protein"],
  ["salmon","protein",208,20.0,0.0,13.0,0.0,0.0,59,"omega-3"],
  ["prawns / shrimp","protein",99,24.0,0.2,0.3,0.0,0.0,111,"lean protein"],
  ["fish fry","protein",220,18.0,8.0,13.0,0.5,0.0,420,"fried"],
  ["potato (boiled)","vegetable",87,1.9,20.1,0.1,1.8,0.9,4,"starchy"],
  ["sweet potato","vegetable",86,1.6,20.1,0.1,3.0,4.2,55,"starchy"],
  ["spinach (palak)","vegetable",23,2.9,3.6,0.4,2.2,0.4,79,"iron"],
  ["broccoli","vegetable",34,2.8,6.6,0.4,2.6,1.7,33,"vitamin c"],
  ["carrot","vegetable",41,0.9,9.6,0.2,2.8,4.7,69,"vitamin a"],
  ["cauliflower","vegetable",25,1.9,5.0,0.3,2.0,1.9,30,"low calorie"],
  ["cabbage","vegetable",25,1.3,5.8,0.1,2.5,3.2,18,"low calorie"],
  ["cucumber","vegetable",15,0.7,3.6,0.1,0.5,1.7,2,"low calorie"],
  ["tomato","vegetable",18,0.9,3.9,0.2,1.2,2.6,5,"low calorie"],
  ["onion","vegetable",40,1.1,9.3,0.1,1.7,4.2,4,""],
  ["okra (bhindi)","vegetable",33,1.9,7.5,0.2,3.2,1.5,7,"low calorie"],
  ["mushroom","vegetable",22,3.1,3.3,0.3,1.0,2.0,5,"low calorie"],
  ["capsicum","vegetable",31,1.0,6.0,0.3,2.1,4.2,4,"vitamin c"],
  ["banana","fruit",89,1.1,22.8,0.3,2.6,12.2,1,"potassium"],
  ["apple","fruit",52,0.3,13.8,0.2,2.4,10.4,1,""],
  ["mango","fruit",60,0.8,15.0,0.4,1.6,13.7,1,"vitamin a"],
  ["orange","fruit",47,0.9,11.8,0.1,2.4,9.4,0,"vitamin c"],
  ["papaya","fruit",43,0.5,10.8,0.3,1.7,7.8,8,"low calorie"],
  ["guava","fruit",68,2.6,14.3,1.0,5.4,8.9,2,"high fibre"],
  ["watermelon","fruit",30,0.6,7.6,0.2,0.4,6.2,1,"low calorie"],
  ["grapes","fruit",69,0.7,18.1,0.2,0.9,15.5,2,""],
  ["pomegranate","fruit",83,1.7,18.7,1.2,4.0,13.7,3,""],
  ["avocado","fruit",160,2.0,8.5,14.7,6.7,0.7,7,"healthy fat"],
  ["dates","fruit",277,1.8,75.0,0.2,6.7,66.0,1,"high fibre"],
  ["almonds","nut",579,21.2,21.6,49.9,12.5,4.4,1,"healthy fat"],
  ["cashews","nut",553,18.2,30.2,43.9,3.3,5.9,12,"healthy fat"],
  ["walnuts","nut",654,15.2,13.7,65.2,6.7,2.6,2,"omega-3"],
  ["peanuts","nut",567,25.8,16.1,49.2,8.5,4.7,18,"healthy fat"],
  ["chia seeds","nut",486,16.5,42.1,30.7,34.4,0.0,16,"high fibre"],
  ["olive oil","fat",884,0.0,0.0,100.0,0.0,0.0,2,"healthy fat"],
  ["coconut oil","fat",862,0.0,0.0,100.0,0.0,0.0,0,"saturated fat"],
  ["mayonnaise","fat",680,1.0,0.6,75.0,0.0,0.6,635,""],
  ["samosa","snack",308,5.0,32.0,17.9,2.3,2.0,420,"fried"],
  ["pakora","snack",315,7.0,28.0,19.0,3.0,1.5,480,"fried"],
  ["vada pav","snack",290,7.0,42.0,10.0,2.5,3.0,560,"fried"],
  ["pav bhaji","snack",230,5.0,28.0,11.0,3.5,4.0,620,""],
  ["potato chips","snack",536,7.0,53.0,34.6,4.8,0.3,525,"ultra-processed"],
  ["popcorn (plain)","snack",387,12.0,78.0,4.5,15.0,0.9,8,"wholegrain"],
  ["french fries","snack",312,3.4,41.0,15.0,3.8,0.3,210,"fried"],
  ["cheese pizza","snack",266,11.0,33.0,10.0,2.3,3.6,598,"fast food"],
  ["chicken biryani","dish",190,9.0,22.0,7.5,1.2,1.0,500,""],
  ["veg fried rice","dish",170,4.0,26.0,5.5,1.5,1.5,450,""],
  ["paneer butter masala","dish",280,10.0,10.0,23.0,2.0,5.0,600,""],
  ["dal makhani","dish",230,8.0,18.0,14.0,5.0,2.0,550,""],
  ["palak paneer","dish",190,9.0,7.0,14.0,2.5,2.0,500,"iron"],
  ["chole (chickpea curry)","dish",180,7.0,22.0,7.0,6.0,3.0,450,"high fibre"],
  ["khichdi","dish",120,4.5,20.0,2.5,2.0,0.8,300,""],
  ["curd rice","dish",120,3.0,18.0,4.0,0.6,2.0,280,"probiotic"],
  ["gulab jamun","sweet",350,5.0,45.0,17.0,0.5,40.0,90,"added sugar"],
  ["jalebi","sweet",380,3.0,60.0,15.0,0.3,50.0,60,"added sugar"],
  ["rasgulla","sweet",186,4.0,33.0,4.0,0.0,30.0,60,"added sugar"],
  ["kheer","sweet",145,3.5,22.0,4.5,0.3,18.0,60,"added sugar"],
  ["milk chocolate","sweet",535,7.6,59.0,30.0,3.4,52.0,79,"added sugar"],
  ["dark chocolate","sweet",546,4.9,61.0,31.0,7.0,48.0,24,"added sugar"],
  ["sugar (white)","sweet",387,0.0,100.0,0.0,0.0,100.0,1,"added sugar"],
  ["honey","sweet",304,0.3,82.0,0.0,0.2,82.0,4,""],
  ["tea (milk + sugar)","beverage",55,1.3,8.5,1.7,0.0,7.8,20,"added sugar"],
  ["black coffee","beverage",2,0.1,0.0,0.0,0.0,0.0,5,"low calorie"],
  ["cola / soft drink","beverage",37,0.0,9.6,0.0,0.0,9.6,4,"added sugar"],
  ["coconut water","beverage",19,0.7,3.7,0.2,1.1,2.6,105,"low calorie"],
  ["beer","beverage",43,0.5,3.6,0.0,0.0,0.0,4,"alcohol"],
  ["tomato ketchup","condiment",101,1.2,25.0,0.1,0.3,21.0,907,"added sugar"],
  ["soy sauce","condiment",53,8.0,4.9,0.1,0.8,0.4,5493,""],
  ["mango pickle","condiment",180,1.0,12.0,14.0,2.0,3.0,2500,""],
  ["coconut chutney","condiment",180,4.0,8.0,15.0,3.0,2.0,300,""],
  ["salt","condiment",0,0.0,0.0,0.0,0.0,0.0,38758,""]
].map(([name, category, calories, protein, carbs, fat, fiber, sugar, sodium, tags]) =>
  ({ name, category, calories, protein, carbs, fat, fiber, sugar, sodium, tags }));

/* ------------------------------------------------------------------
   2. Constants, state & element handles
   ------------------------------------------------------------------ */
const API_URL = "/api/analyse";
const DV = { calories: 2000, protein: 50, fiber: 30, sugar: 50, sodium: 2300, fat: 78 }; // FDA daily values
const HISTORY_KEY = "meallens_history_v1";
const FLAGS_KEY = "meallens_flags_v1";

const PALETTE = {
  protein: "#34d399", carbs: "#2dd4bf", fat: "#fbbf24",
  fiber: "#84cc16", sugar: "#f87171", sodium: "#a3c4b2",
  remaining: "#1d3d29", extra: ["#a3e635", "#34d399", "#fbbf24", "#2dd4bf",
                                "#fb923c", "#4ade80", "#e879f9", "#38bdf8"]
};

const EMOJI_MAP = [
  ["pizza","🍕"],["burger","🍔"],["sandwich","🥪"],["salad","🥗"],["thali","🍛"],["biryani","🍛"],
  ["fried rice","🍚"],["pulao","🍚"],["rice","🍚"],["khichdi","🍚"],["bowl","🥣"],
  ["chapati","🫓"],["roti","🫓"],["paratha","🫓"],["naan","🫓"],["puri","🫓"],["bread","🍞"],["toast","🍞"],
  ["dosa","🥞"],["idli","🥟"],["samosa","🥟"],["momo","🥟"],["pakora","🥟"],["vada","🥟"],
  ["omelette","🍳"],["egg","🍳"],["pancake","🥞"],
  ["paneer","🧀"],["cheese","🧀"],["butter","🧈"],["ghee","🧈"],
  ["chicken","🍗"],["mutton","🍖"],["meat","🍖"],["fish","🐟"],["prawn","🦐"],["shrimp","🦐"],
  ["dal","🍲"],["curry","🍲"],["rajma","🍲"],["chole","🍲"],["soup","🍲"],["stew","🍲"],
  ["noodles","🍜"],["pasta","🍝"],["maggi","🍜"],
  ["fries","🍟"],["chips","🍟"],
  ["cake","🍰"],["ice cream","🍦"],["chocolate","🍫"],["jalebi","🍩"],["gulab","🍮"],["kheer","🍮"],["sweet","🍬"],["dessert","🍰"],
  ["apple","🍎"],["banana","🍌"],["mango","🥭"],["orange","🍊"],["grapes","🍇"],["watermelon","🍉"],
  ["papaya","🍈"],["guava","🍐"],["pomegranate","🍎"],["berries","🫐"],["fruit","🍎"],
  ["avocado","🥑"],["broccoli","🥦"],["spinach","🥬"],["salad","🥬"],["vegetable","🥦"],["sprout","🌱"],
  ["almond","🥜"],["cashew","🥜"],["peanut","🥜"],["nuts","🥜"],
  ["milk","🥛"],["curd","🥛"],["yogurt","🥛"],["lassi","🥛"],["shake","🥛"],
  ["chai","☕"],["tea","☕"],["coffee","☕"],["cola","🥤"],["soft drink","🥤"],["juice","🧃"],["drink","🥤"],["water","💧"],["beer","🍺"],["wine","🍷"],
  ["corn","🌽"],["carrot","🥕"],["mushroom","🍄"],["burger","🍔"]
];

const BADGES = [
  { id: "first",    icon: "🌱", name: "First Bite",     desc: "Log your first meal" },
  { id: "m5",       icon: "🍽", name: "Getting Started", desc: "Log 5 meals" },
  { id: "m15",      icon: "🏅", name: "Meal Master",     desc: "Log 15 meals" },
  { id: "streak3",  icon: "🔥", name: "On Fire",         desc: "3-day logging streak" },
  { id: "green",    icon: "🥗", name: "Green Eater",     desc: "A meal scored 8+/10" },
  { id: "compare",  icon: "⚖", name: "Food Scientist",  desc: "Compare two foods" },
];

const $ = (id) => document.getElementById(id);
const els = {
  mealInput: $("mealInput"), analyseBtn: $("analyseBtn"), clearBtn: $("clearBtn"),
  useLocal: $("useLocal"), status: $("status"), result: $("result"),
  ringFg: $("ringFg"), scoreNum: $("scoreNum"), scoreLabel: $("scoreLabel"),
  macroChips: $("macroChips"), notes: $("notes"), itemsTableWrap: $("itemsTableWrap"),
  negativesBox: $("negativesBox"), negativesList: $("negativesList"),
  altBox: $("altBox"), altList: $("altList"),
  peopleCount: $("peopleCount"), portionBox: $("portionBox"), portionGrid: $("portionGrid"),
  dbSearch: $("dbSearch"), dbTableBody: document.querySelector("#dbTable tbody"),
  dbCount: $("dbCount"), groqStatus: $("groqStatus"),
  // new elements
  heroEmoji: $("heroEmoji"), heroCaption: $("heroCaption"), exampleRow: $("exampleRow"),
  photoInput: $("photoInput"), photoPreviewWrap: $("photoPreviewWrap"),
  photoPreview: $("photoPreview"), photoRemove: $("photoRemove"),
  macroCards: $("macroCards"), scoreFiveVal: $("scoreFiveVal"), scoreFiveWhy: $("scoreFiveWhy"),
  detailsGrid: $("detailsGrid"), smartBox: $("smartBox"), smartList: $("smartList"),
  compareA: $("compareA"), compareB: $("compareB"), compareBtn: $("compareBtn"),
  compareSwapBtn: $("compareSwapBtn"), compareStatus: $("compareStatus"),
  compareWrap: $("compareWrap"), compareCards: $("compareCards"), compareVerdict: $("compareVerdict"),
  weekChartEl: $("weekChart"), weekSummary: $("weekSummary"),
  streakDays: $("streakDays"), totalMeals: $("totalMeals"), avgScore: $("avgScore"), weekKcal: $("weekKcal"),
  badgesRow: $("badgesRow"), historyList: $("historyList"), clearHistoryBtn: $("clearHistoryBtn"),
  catChips: $("catChips"),
};

const state = {
  charts: { items: null, targets: null, week: null },
  dbSort: { key: "name", dir: 1 },
  catFilter: "all",
  photo: "",          // data URL of the selected food photo
  ready: false,
};

let analysis = null;
let history = [];
let flags = {};

/* ------------------------------------------------------------------
   3. Server call
   ------------------------------------------------------------------ */
async function analyseOnServer(mealText, imageDataUrl) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: mealText,
      image: imageDataUrl || undefined,
      people: parseInt(els.peopleCount.value, 10) || 1,
    }),
  });
  let payload;
  try { payload = await res.json(); } catch { payload = {}; }
  if (!res.ok) throw new Error(payload.error || `Server error ${res.status}`);
  return payload;
}

/* ------------------------------------------------------------------
   4. Normalisation, rating & helpers
   ------------------------------------------------------------------ */
const num = (v, d = 0) => (typeof v === "number" && isFinite(v) ? v : parseFloat(v) || d);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const esc = (s) => String(s ?? "").replace(/</g, "&lt;");

function sumItems(items) {
  const keys = ["calories", "protein", "carbs", "fat", "fiber", "sugar", "sodium"];
  const t = Object.fromEntries(keys.map((k) => [k, 0]));
  for (const it of items) keys.forEach((k) => (t[k] += num(it[k])));
  return t;
}

function heuristicRating(t) {
  const kcal = Math.max(t.calories, 1);
  let s = 5;
  s += Math.min(2,   (t.protein / kcal) * 100 / 4);   // protein density
  s += Math.min(1.5, (t.fiber   / kcal) * 100 / 2.5); // fibre density
  s -= Math.min(2,   (t.sugar   / kcal) * 100 / 6);   // sugar density
  s -= Math.min(2,   (t.sodium  / kcal) * 100 / 4);   // sodium density
  s -= Math.min(1.5, (t.fat * 9) / kcal / 0.45 - 1);  // very high fat share
  return clamp(Math.round(s * 10) / 10, 0, 10);
}

function normalizeAnalysis(raw) {
  const items = (Array.isArray(raw.items) ? raw.items : [])
    .map((it) => ({
      name: String(it.name || "Item").slice(0, 40),
      grams: num(it.grams, 100),
      calories: num(it.calories), protein: num(it.protein), carbs: num(it.carbs),
      fat: num(it.fat), fiber: num(it.fiber), sugar: num(it.sugar), sodium: num(it.sodium),
    }));
  if (!items.length) throw new Error("No food items were found. Try describing the meal differently.");

  const totals = sumItems(items);
  let rating = num(raw.rating, NaN);
  if (!isFinite(rating)) rating = heuristicRating(totals);
  rating = clamp(rating, 0, 10);

  const notes = (Array.isArray(raw.notes) ? raw.notes : []).map(String).slice(0, 6);
  const negatives = (Array.isArray(raw.negatives) ? raw.negatives : [])
    .map((n) => String(n).trim()).filter(Boolean).slice(0, 5);
  const alternatives = (Array.isArray(raw.alternatives) ? raw.alternatives : [])
    .map((alt) => ({ name: String(alt?.name || "").trim().slice(0, 60),
                     why: String(alt?.why || "").trim().slice(0, 120) }))
    .filter((alt) => alt.name)
    .slice(0, 4);
  const pa = raw.portion_advice || {};
  const portion = {
    howMuch: String(pa.how_much || "").trim().slice(0, 90),
    calories: num(pa.calories, 0),
    howOften: String(pa.how_often || "").trim().slice(0, 90),
    bestTime: String(pa.best_time || "").trim().slice(0, 60),
  };
  const conf = raw.confidence || {};
  return {
    items, totals, rating, ratingReason: String(raw.rating_reason || ""),
    notes, negatives, alternatives, portion,
    provides: (Array.isArray(raw.provides) ? raw.provides : []).map((s) => String(s).trim().slice(0, 90)).filter(Boolean).slice(0, 4),
    mainNutrients: (Array.isArray(raw.main_nutrients) ? raw.main_nutrients : []).map((s) => String(s).trim().slice(0, 70)).filter(Boolean).slice(0, 4),
    allergens: (Array.isArray(raw.allergens) ? raw.allergens : []).map((s) => String(s).toLowerCase().trim()).filter(Boolean).slice(0, 8),
    category: String(raw.category || "").trim().slice(0, 40),
    confidence: {
      level: ["high", "medium", "low"].includes(conf.level) ? conf.level : "medium",
      note: String(conf.note || "").trim().slice(0, 90),
    },
  };
}

function mergeLocalItems(analysis, mealText) {
  if (!els.useLocal.checked) return analysis;
  const t = mealText.toLowerCase();
  const matches = FOODS.filter((f) => {
    const base = f.name.split(/[(,/]/)[0].trim();
    return base.length > 3 && t.includes(base) &&
      !analysis.items.some((it) => it.name.toLowerCase().includes(base) || base.includes(it.name.toLowerCase()));
  });
  matches.slice(0, 6).forEach((f) => analysis.items.push({
    name: f.name + " (local·100g)", grams: 100, calories: f.calories, protein: f.protein,
    carbs: f.carbs, fat: f.fat, fiber: f.fiber, sugar: f.sugar, sodium: f.sodium,
  }));
  analysis.totals = sumItems(analysis.items);
  return analysis;
}

function status(msg, kind = "") {
  els.status.className = "status " + kind;
  els.status.textContent = msg;
  els.status.classList.remove("hidden");
}
function compareStatus(msg, kind = "") {
  els.compareStatus.className = "status " + kind;
  els.compareStatus.textContent = msg;
  els.compareStatus.classList.remove("hidden");
}

function inferEmoji(text) {
  const t = String(text || "").toLowerCase();
  for (const [kw, em] of EMOJI_MAP) if (t.includes(kw)) return em;
  return "🍽";
}

function setHero(emoji, caption, pop = true) {
  els.heroEmoji.textContent = emoji;
  if (caption) els.heroCaption.textContent = caption;
  if (pop) {
    els.heroEmoji.classList.remove("pop");
    void els.heroEmoji.offsetWidth; // restart animation
    els.heroEmoji.classList.add("pop");
  }
}

/* ---------- photo helpers ---------- */
function fileToDataUrl(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}
function downscaleImage(dataUrl, max = 1024) {
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => {
      let { width: w, height: h } = img;
      const scale = Math.min(1, max / Math.max(w, h));
      w = Math.round(w * scale); h = Math.round(h * scale);
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      c.getContext("2d").drawImage(img, 0, 0, w, h);
      res(c.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => res(dataUrl);
    img.src = dataUrl;
  });
}
function setPhoto(dataUrl) {
  state.photo = dataUrl || "";
  els.photoPreviewWrap.classList.toggle("hidden", !dataUrl);
  if (dataUrl) {
    els.photoPreview.src = dataUrl;
    setHero("📷", "Photo ready — add an optional note, then hit Analyse");
  } else if (!els.mealInput.value.trim()) {
    setHero("🥗", "Snap it, describe it, or try an example below", false);
  }
}

/* ------------------------------------------------------------------
   5. Rendering
   ------------------------------------------------------------------ */
const RING_C = 2 * Math.PI * 52;

function renderScore(rating) {
  els.scoreNum.textContent = rating.toFixed(1);
  const color = rating >= 7 ? "var(--brand)" : rating >= 5 ? "var(--amber)" : "var(--rose)";
  els.ringFg.style.stroke = color;
  els.ringFg.style.strokeDasharray = RING_C;
  els.ringFg.style.strokeDashoffset = RING_C * (1 - rating / 10);
  const label = rating >= 8.5 ? "Excellent 🌟" : rating >= 7 ? "Healthy 👍" : rating >= 5.5
    ? "Decent 🙂" : rating >= 4 ? "Average 😐" : rating >= 2.5 ? "Unhealthy ⚠" : "Poor ❌";
  els.scoreLabel.textContent = label;
  els.scoreLabel.title = analysis ? analysis.ratingReason : "";
}

function renderChips(t) {
  const kcal = Math.max(t.calories, 1);
  const pct = (a, b) => Math.round((a / Math.max(b, 1)) * 100) + "%";
  const chips = [
    ["🔥", "Energy", Math.round(t.calories) + " kcal", "calories"],
    ["🥩", "Protein", t.protein.toFixed(1) + " g · " + pct(t.protein * 4, kcal), "protein"],
    ["🍞", "Carbs", t.carbs.toFixed(1) + " g · " + pct(t.carbs * 4, kcal), "carbs"],
    ["🧈", "Fat", t.fat.toFixed(1) + " g · " + pct(t.fat * 9, kcal), "fat"],
    ["🌾", "Fibre", t.fiber.toFixed(1) + " g · " + pct(t.fiber, DV.fiber) + " DV", "fiber"],
    ["🍬", "Sugar", t.sugar.toFixed(1) + " g · " + pct(t.sugar, DV.sugar) + " DV", "sugar"],
    ["🧂", "Sodium", Math.round(t.sodium) + " mg · " + pct(t.sodium, DV.sodium) + " DV", "sodium"],
  ];
  els.macroChips.innerHTML = chips.map(([icon, label, val, cls]) =>
    `<span class="chip ${cls}" title="${label}"><span>${icon}</span><b>${val}</b></span>`).join("");
}

function renderMacroCards(t) {
  const kcal = Math.max(t.calories, 1);
  const cards = [
    ["🔥", Math.round(t.calories), "Calories", Math.round(t.calories / DV.calories * 100) + "% of a 2000 kcal day", "calories"],
    ["🥩", t.protein.toFixed(1) + " g", "Protein", Math.round(t.protein / DV.protein * 100) + "% DV", "protein"],
    ["🍞", t.carbs.toFixed(1) + " g", "Carbs", Math.round(t.carbs * 4 / kcal * 100) + "% of calories", "carbs"],
    ["🧈", t.fat.toFixed(1) + " g", "Fat", Math.round(t.fat * 9 / kcal * 100) + "% of calories", "fat"],
    ["🌾", t.fiber.toFixed(1) + " g", "Fibre", Math.round(t.fiber / DV.fiber * 100) + "% DV", "fiber"],
  ];
  els.macroCards.innerHTML = cards.map(([icon, val, label, sub, cls]) =>
    `<div class="mcard ${cls}">
       <div class="mc-icon">${icon}</div>
       <div class="mc-num">${val}</div>
       <div class="mc-label">${label}</div>
       <div class="mc-sub">${sub}</div>
     </div>`).join("");
}

function buildScoreFive(a) {
  const t = a.totals;
  const checks = [
    `energy ${Math.round(t.calories)} kcal (${t.calories <= 700 ? "reasonable for a meal" : "heavy for one meal"})`,
    `protein ${t.protein.toFixed(0)} g (${t.protein >= 20 ? "strong" : t.protein >= 10 ? "ok" : "low"})`,
    `fibre ${t.fiber.toFixed(1)} g (${t.fiber >= 8 ? "great" : t.fiber >= 4 ? "decent" : "low"})`,
    `sugar ${t.sugar.toFixed(1)} g (${t.sugar <= 15 ? "low" : t.sugar <= 30 ? "moderate" : "high"})`,
    `sodium ${Math.round(t.sodium)} mg (${t.sodium <= 800 ? "fine" : t.sodium <= 1500 ? "watch it" : "high"})`,
  ];
  return `The AI health rating (${a.rating.toFixed(1)}/10 → ${clamp(Math.round(a.rating / 2 * 10) / 10, 0, 5)}/5) is sanity-checked against 5 measures: ${checks.join("; ")}. ${a.ratingReason}`;
}

function renderScoreFive(a) {
  els.scoreFiveVal.textContent = clamp(Math.round(a.rating / 2 * 10) / 10, 0, 5).toFixed(1);
  els.scoreFiveWhy.textContent = buildScoreFive(a);
}

function renderDetails(a) {
  const cells = [];
  cells.push(`<div class="detail-cell">
    <h4>Food category</h4>
    <div class="dc-line">${a.category ? esc(a.category) : "General"}</div>
  </div>`);
  cells.push(`<div class="detail-cell">
    <h4>Main nutrients</h4>
    <ul>${a.mainNutrients.length ? a.mainNutrients.map((n) => `<li>${esc(n)}</li>`).join("") : "<li>Balanced macros — see cards above</li>"}</ul>
  </div>`);
  cells.push(`<div class="detail-cell">
    <h4>What this meal provides</h4>
    <ul>${a.provides.length ? a.provides.map((n) => `<li>${esc(n)}</li>`).join("") : "<li>Energy and satiety</li>"}</ul>
  </div>`);
  cells.push(`<div class="detail-cell">
    <h4>Possible allergens</h4>
    <ul>${a.allergens.length ? a.allergens.map((n) => `<li class="alg">${esc(n)}</li>`).join("") : '<li class="dc-line">None detected 👍</li>'}</ul>
  </div>`);
  cells.push(`<div class="detail-cell">
    <h4>How confident is the estimate?</h4>
    <span class="conf-pill ${a.confidence.level}">${a.confidence.level}</span>
    <div class="dc-line">${a.confidence.note ? esc(a.confidence.note) : "Typical estimate"}</div>
  </div>`);
  els.detailsGrid.innerHTML = cells.join("");
}

function smartSuggestions(a) {
  const t = a.totals, out = [];
  const kcal = Math.max(t.calories, 1);
  const dvPct = (v, dv) => (v / dv) * 100;
  if (t.calories > 300 && t.protein < kcal / 25)
    out.push(["🥩", "<b>Boost protein</b> — add dal, paneer, eggs, curd or grilled chicken to stay full longer."]);
  if (t.fiber < DV.fiber * 0.25)
    out.push(["🌾", "<b>Add fibre</b> — a side of salad, sautéed veggies or a whole fruit helps digestion."]);
  if (dvPct(t.sugar, DV.sugar) > 30)
    out.push(["🍬", `<b>Sugar is high</b> — ${Math.round(t.sugar)} g here. Skip the sweet drink or dessert next time.`]);
  if (dvPct(t.sodium, DV.sodium) > 40)
    out.push(["🧂", `<b>Sodium alert</b> — this covers ${Math.round(dvPct(t.sodium, DV.sodium))}% of a day's salt cap. Go easy on pickles/papad today.`]);
  if (t.calories > 800)
    out.push(["🔥", "<b>Heavy meal</b> — consider a smaller portion or a 15-minute walk after eating."]);
  if (t.fat * 9 / kcal > 0.4)
    out.push(["🧈", "<b>Fat-heavy</b> — grilled, steamed or tandoori versions would cut the oil."]);
  if (t.calories > 0 && t.calories < 250 && a.rating >= 6)
    out.push(["🥜", "<b>Light meal</b> — pair it with nuts or a banana if you're still hungry."]);
  if (!out.length || a.rating >= 8)
    out.push(["💪", "<b>Great balance</b> — this meal hits the macros nicely. Keep it up!"]);
  return out.slice(0, 5);
}

function renderSmart(a) {
  const tips = smartSuggestions(a);
  els.smartBox.classList.remove("hidden");
  els.smartList.innerHTML = tips.map(([icon, html]) =>
    `<div class="smart-item"><div class="si-icon">${icon}</div><div class="si-body">${html}</div></div>`).join("");
}

function renderNotes(a) {
  const notes = [...a.notes];
  if (a.ratingReason) notes.unshift(a.ratingReason);
  els.notes.innerHTML = notes.map((n) => `<div>${esc(n)}</div>`).join("");
}

function renderNegatives(negatives) {
  const list = Array.isArray(negatives) ? negatives : [];
  if (!list.length) {
    els.negativesBox.classList.add("hidden");
    els.negativesList.innerHTML = "";
    return;
  }
  els.negativesBox.classList.remove("hidden");
  els.negativesList.innerHTML = list.map((n) => `<div>${esc(n)}</div>`).join("");
}

function renderAlternatives(alts) {
  const list = Array.isArray(alts) ? alts : [];
  if (!list.length) {
    els.altBox.classList.add("hidden");
    els.altList.innerHTML = "";
    return;
  }
  els.altBox.classList.remove("hidden");
  els.altList.innerHTML = list.map((alt) => `
      <div class="alt-card">
        <div class="alt-name">🥗 ${esc(alt.name)}</div>
        <div class="alt-why">${esc(alt.why || "")}</div>
      </div>`).join("");
}

function renderPortion() {
  const pa = analysis?.portion || {};
  const people = parseInt(els.peopleCount.value, 10) || 1;
  const t = analysis?.totals;
  const perPersonKcal = t ? Math.round(t.calories / Math.max(people, 1)) : 0;
  const recKcal = pa.calories ? Math.round(pa.calories) : perPersonKcal;
  const tiles = [
    ["🍽", "Recommended serving", pa.howMuch || (t ? `${Math.round(t.calories / Math.max(people, 1))} kcal per person` : "—")],
    ["🔥", "Calories in that serving", recKcal ? `${recKcal} kcal` : "—"],
    ["📅", "How often to eat this", pa.howOften || "—"],
    ["🕐", "Best time to eat", pa.bestTime || "—"],
  ];
  els.portionGrid.innerHTML = tiles
    .map(([icon, label, val]) => `
      <div class="portion-tile">
        <div class="pt-icon">${icon}</div>
        <div>
          <div class="pt-label">${label}</div>
          <div class="pt-val">${esc(val)}</div>
        </div>
      </div>`)
    .join("") +
    (people > 1 && t ? `
      <div class="portion-foot">👨‍👩‍👧‍👦 Divided among <b>${people} people</b> — that's about
        <b>${perPersonKcal} kcal</b>, <b>${(t.protein / people).toFixed(1)} g protein</b> and
        <b>${Math.round(t.sodium / people)} mg sodium</b> per person.</div>` : "");
  els.portionBox.classList.remove("hidden");
}

function renderItemsTable(items, totals) {
  const rows = items.map((it) => `
    <tr>
      <td>${esc(it.name)}</td>
      <td class="num">${Math.round(it.grams)} g</td>
      <td class="num">${it.calories.toFixed(0)}</td>
      <td class="num">${it.protein.toFixed(1)}</td>
      <td class="num">${it.carbs.toFixed(1)}</td>
      <td class="num">${it.fat.toFixed(1)}</td>
      <td class="num">${it.fiber.toFixed(1)}</td>
      <td class="num">${it.sugar.toFixed(1)}</td>
      <td class="num">${it.sodium.toFixed(0)}</td>
    </tr>`).join("");
  const foot = `
    <tr style="border-top:2px solid var(--card-edge); font-weight:700">
      <td>Total</td><td></td>
      <td class="num">${totals.calories.toFixed(0)}</td>
      <td class="num">${totals.protein.toFixed(1)}</td>
      <td class="num">${totals.carbs.toFixed(1)}</td>
      <td class="num">${totals.fat.toFixed(1)}</td>
      <td class="num">${totals.fiber.toFixed(1)}</td>
      <td class="num">${totals.sugar.toFixed(1)}</td>
      <td class="num">${totals.sodium.toFixed(0)}</td>
    </tr>`;
  els.itemsTableWrap.innerHTML = `
    <div class="card table-wrap">
      <table>
        <thead><tr><th>Item</th><th>Qty</th><th>kcal</th><th>Protein g</th><th>Carbs g</th>
        <th>Fat g</th><th>Fibre g</th><th>Sugar g</th><th>Sodium mg</th></tr></thead>
        <tbody>${rows}${foot}</tbody>
      </table>
    </div>`;
}

function renderAll(a, meta = {}) {
  analysis = a;
  els.result.classList.remove("hidden");
  renderScore(a.rating);
  renderChips(a.totals);
  renderMacroCards(a.totals);
  renderScoreFive(a);
  renderDetails(a);
  renderSmart(a);
  renderNotes(a);
  renderNegatives(a.negatives);
  renderAlternatives(a.alternatives);
  renderPortion();
  renderItemsTable(a.items, a.totals);
  updateCharts(a);
  setHero(meta.emoji || "🍽", `${a.category || "Meal"} · ${Math.round(a.totals.calories)} kcal · ${a.confidence.level} confidence`, false);
  addHistory({
    ts: Date.now(),
    text: meta.inputText || a.items.map((i) => i.name).join(", "),
    emoji: meta.emoji || inferEmoji(a.items.map((i) => i.name).join(" ")),
    rating: a.rating,
    kcal: Math.round(a.totals.calories),
    source: meta.source || "text",
  });
}

/* ------------------------------------------------------------------
   6. Charts — doughnut + targets + 7-day history
   ------------------------------------------------------------------ */
const targetLinePlugin = {
  id: "targetLine",
  afterDatasetsDraw(chart) {
    const { ctx, chartArea: area, scales: { y } } = chart;
    const yPos = y.getPixelForValue(100);
    if (yPos < area.top || yPos > area.bottom) return;
    ctx.save();
    ctx.strokeStyle = "rgba(234, 252, 241, .5)";
    ctx.setLineDash([6, 5]);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(area.left, yPos);
    ctx.lineTo(area.right, yPos);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(234, 252, 241, .65)";
    ctx.font = "600 10px Inter, sans-serif";
    ctx.fillText("100% of daily target", area.left + 6, yPos - 5);
    ctx.restore();
  },
};

const CHART_GRID = { color: "rgba(29, 61, 41, .75)" };

function baseOptions() {
  return {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom", labels: { color: "#9cc3ac", boxWidth: 12, padding: 14, font: { size: 11 } } },
      tooltip: {
        backgroundColor: "#08170f", borderColor: "#1d3d29", borderWidth: 1,
        titleColor: "#eafcf1", bodyColor: "#9cc3ac", padding: 10,
      },
    },
  };
}

function emptyData() {
  return { labels: ["No data yet"], datasets: [{ label: "", data: [0], backgroundColor: ["#1d3d29"], borderWidth: 0 }] };
}

function ensureCharts() {
  if (state.charts.items) return;
  state.charts.items = new Chart($("itemsChart"), {
    type: "doughnut",
    data: { ...emptyData(), datasets: [{ data: [1], backgroundColor: ["#1d3d29"], borderWidth: 0, cutout: "58%" }] },
    options: baseOptions(),
  });
  state.charts.targets = new Chart($("targetsChart"), {
    type: "bar",
    data: emptyData(),
    options: {
      ...baseOptions(),
      scales: {
        x: { grid: { display: false }, ticks: { color: "#9cc3ac", font: { size: 11 } } },
        y: {
          grid: CHART_GRID, suggestedMax: 120,
          ticks: { color: "#9cc3ac", font: { size: 11 }, callback: (v) => v + "%" },
        },
      },
    },
    plugins: [targetLinePlugin],
  });
  state.charts.week = new Chart($("weekChart"), {
    type: "bar",
    data: {
      labels: [],
      datasets: [
        { label: "kcal eaten", data: [], backgroundColor: "rgba(52,211,153,.55)",
          hoverBackgroundColor: "#34d399", borderRadius: 8, maxBarThickness: 38, yAxisID: "y" },
        { type: "line", label: "avg health score", data: [], borderColor: "#a3e635",
          backgroundColor: "#a3e635", tension: .35, pointRadius: 3, borderWidth: 2, yAxisID: "y1" },
      ],
    },
    options: {
      ...baseOptions(),
      scales: {
        x: { grid: { display: false }, ticks: { color: "#9cc3ac", font: { size: 11 } } },
        y: {
          position: "left", beginAtZero: true, grid: CHART_GRID,
          ticks: { color: "#9cc3ac", font: { size: 11 } },
          title: { display: true, text: "kcal", color: "#9cc3ac", font: { size: 10 } },
        },
        y1: {
          position: "right", min: 0, max: 10, grid: { drawOnChartArea: false },
          ticks: { color: "#9cc3ac", font: { size: 11 }, stepSize: 2 },
          title: { display: true, text: "score", color: "#9cc3ac", font: { size: 10 } },
        },
      },
    },
  });
}

function updateCharts(a) {
  ensureCharts();
  const t = a.totals;

  // 1) Doughnut — energy share by food item
  const items = [...a.items].sort((x, y) => y.calories - x.calories);
  const kcalData = items.map((i) => Math.max(i.calories, 0));
  const kcalTotal = Math.max(kcalData.reduce((s, v) => s + v, 0), 1);
  const pie = state.charts.items;
  pie.data.labels = items.map((i) => i.name);
  pie.data.datasets = [{
    data: kcalData,
    backgroundColor: items.map((_, i) => PALETTE.extra[i % PALETTE.extra.length]),
    borderColor: "#10271a", borderWidth: 2, hoverOffset: 10, cutout: "58%",
    _total: kcalTotal,
  }];
  pie.options.plugins.tooltip.callbacks = {
    label: (c) => {
      const pct = Math.round((c.parsed / c.dataset._total) * 100);
      return ` ${Math.round(c.parsed)} kcal · ${pct}% of the meal`;
    },
  };
  pie.options.cutout = "58%";
  pie.update();

  // 2) Bars — this meal vs a full day's budget (2000 kcal reference)
  const caps = [
    ["Energy", t.calories, DV.calories, "kcal"],
    ["Protein", t.protein, DV.protein, "g"],
    ["Fibre", t.fiber, DV.fiber, "g"],
    ["Fat", t.fat, DV.fat, "g"],
    ["Sugar", t.sugar, DV.sugar, "g"],
    ["Sodium", t.sodium, DV.sodium, "mg"],
  ];
  const bar = state.charts.targets;
  bar.data.labels = caps.map(([label]) => label);
  bar.data.datasets = [{
    label: "% of daily target used",
    data: caps.map(([, used, cap]) => clamp((used / Math.max(cap, 1)) * 100, 0, 130)),
    backgroundColor: caps.map(([, used, cap]) => {
      const p = (used / Math.max(cap, 1)) * 100;
      return p > 100 ? PALETTE.sugar : p > 60 ? PALETTE.fat : PALETTE.protein; // red / amber / green
    }),
    borderRadius: 8, maxBarThickness: 46,
  }];
  bar.options.plugins.tooltip.callbacks = {
    label: (c) => {
      const [, used, cap, unit] = caps[c.dataIndex];
      return ` ${Math.round(used)} ${unit} of ${Math.round(cap)} ${unit} (${Math.round(c.parsed.y)}%)`;
    },
  };
  bar.update();
}

function updateWeekChart() {
  ensureCharts();
  const chart = state.charts.week;
  const days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const labels = days.map((d) => d.toLocaleDateString([], { weekday: "short" }));
  const kcal = days.map((d) =>
    history.filter((h) => new Date(h.ts) >= d && new Date(h.ts) < new Date(d.getTime() + 86400000))
           .reduce((s, h) => s + (h.kcal || 0), 0));
  const scores = days.map((d) => {
    const dayMeals = history.filter((h) => new Date(h.ts) >= d && new Date(h.ts) < new Date(d.getTime() + 86400000));
    return dayMeals.length ? dayMeals.reduce((s, h) => s + (h.rating || 0), 0) / dayMeals.length : null;
  });
  chart.data.labels = labels;
  chart.data.datasets[0].data = kcal;
  chart.data.datasets[1].data = scores;
  chart.update();

  const logged = history.filter((h) => new Date(h.ts) >= days[0]);
  const totalK = logged.reduce((s, h) => s + (h.kcal || 0), 0);
  els.weekSummary.textContent = logged.length
    ? `${logged.length} meal${logged.length > 1 ? "s" : ""} logged in the last 7 days — averaging ${Math.round(totalK / 7)} kcal/day.`
    : "Log meals from the Analyser to see your week here";
}

/* ------------------------------------------------------------------
   7. History, streaks & badges (localStorage)
   ------------------------------------------------------------------ */
function loadHistory() {
  try { history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; }
  catch { history = []; }
  if (!Array.isArray(history)) history = [];
  try { flags = JSON.parse(localStorage.getItem(FLAGS_KEY)) || {}; }
  catch { flags = {}; }
}
function saveHistory() {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 60)));
    localStorage.setItem(FLAGS_KEY, JSON.stringify(flags));
  } catch { /* private mode etc. */ }
}
function addHistory(entry) {
  history.unshift(entry);
  if (history.length > 60) history.length = 60;
  saveHistory();
  renderStats();
  renderHistory();
  updateWeekChart();
}
function dayKey(ts) {
  const d = new Date(ts);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function calcStreak() {
  const days = new Set(history.map((h) => dayKey(h.ts)));
  let streak = 0;
  const d = new Date();
  if (!days.has(dayKey(d.getTime()))) d.setDate(d.getDate() - 1);
  while (days.has(dayKey(d.getTime()))) { streak++; d.setDate(d.getDate() - 1); }
  return streak;
}
function renderStats() {
  const streak = calcStreak();
  els.streakDays.textContent = streak;
  els.totalMeals.textContent = history.length;
  els.avgScore.textContent = history.length
    ? (history.reduce((s, h) => s + (h.rating || 0), 0) / history.length).toFixed(1)
    : "–";
  const weekAgo = Date.now() - 7 * 86400000;
  els.weekKcal.textContent = history.filter((h) => h.ts >= weekAgo)
    .reduce((s, h) => s + (h.kcal || 0), 0);
}
function fmtWhen(ts) {
  const d = new Date(ts), now = new Date();
  const sameDay = (a, b) => a.toDateString() === b.toDateString();
  const yest = new Date(now); yest.setDate(now.getDate() - 1);
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (sameDay(d, now)) return `Today ${time}`;
  if (sameDay(d, yest)) return `Yesterday ${time}`;
  return d.toLocaleDateString([], { day: "numeric", month: "short" }) + ` ${time}`;
}
function renderHistory() {
  if (!history.length) {
    els.historyList.innerHTML = `<div class="muted small">No meals yet — analyse something tasty above!</div>`;
    return;
  }
  els.historyList.innerHTML = history.map((h) => {
    const cls = h.rating >= 7 ? "good" : h.rating >= 5 ? "mid" : "bad";
    const src = h.source === "photo" ? " 📷" : "";
    return `<div class="h-item">
      <span class="h-emoji">${h.emoji || "🍽"}</span>
      <span class="h-text">${esc(String(h.text || "").slice(0, 90))}${src}
        <span class="h-when">${fmtWhen(h.ts)}</span></span>
      <span class="h-kcal">${h.kcal || 0} kcal</span>
      <span class="h-score ${cls}">${(h.rating ?? 0).toFixed(1)}/10</span>
    </div>`;
  }).join("");
}
function renderBadges() {
  const earned = {
    first: history.length >= 1,
    m5: history.length >= 5,
    m15: history.length >= 15,
    streak3: calcStreak() >= 3,
    green: history.some((h) => (h.rating || 0) >= 8),
    compare: !!flags.compare,
  };
  els.badgesRow.innerHTML = BADGES.map((b) =>
    `<div class="badge ${earned[b.id] ? "earned" : ""}" title="${b.desc}">
       <span class="b-icon">${b.icon}</span>${b.name}
     </div>`).join("");
}

/* ------------------------------------------------------------------
   8. Analyse flow
   ------------------------------------------------------------------ */
async function analyse() {
  const text = els.mealInput.value.trim();
  const img = state.photo;
  if (!text && !img) {
    status("Type a food or meal first, e.g. \"2 chapati + dal + curd\" — or pick a photo.", "error");
    return;
  }

  els.analyseBtn.disabled = true;
  status(img ? "Looking at your photo…" : "Crunching nutrients…", "loading");
  try {
    const raw = await analyseOnServer(text, img);
    let a = normalizeAnalysis(raw);
    if (!img) a = mergeLocalItems(a, text);
    renderAll(a, {
      emoji: img ? "📷" : inferEmoji(text),
      inputText: text,
      source: img ? "photo" : "text",
    });
    status(`Analysed ${analysis.items.length} item(s) · ${Math.round(analysis.totals.calories)} kcal · rated ${analysis.rating.toFixed(1)}/10`, "ok");
    if (img) setPhoto(""); // photo consumed — allow text analysis next
  } catch (err) {
    status("⚠ " + (err?.message || "Something went wrong."), "error");
  } finally {
    els.analyseBtn.disabled = false;
  }
}

els.analyseBtn.addEventListener("click", analyse);
els.mealInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) analyse();
});
els.clearBtn.addEventListener("click", () => {
  els.mealInput.value = "";
  els.status.classList.add("hidden");
  els.result.classList.add("hidden");
  setPhoto("");
  setHero("🥗", "Snap it, describe it, or try an example below", false);
});
els.peopleCount.addEventListener("change", () => {
  if (analysis) renderPortion();  // re-split guidance for the new head-count
});

/* ---------- example chips ---------- */
els.exampleRow.addEventListener("click", (e) => {
  const btn = e.target.closest(".example-chip");
  if (!btn) return;
  els.mealInput.value = btn.dataset.text;
  setHero(btn.dataset.emoji, `Example loaded: ${btn.textContent.trim()} — analysing…`);
  analyse();
});

/* ---------- photo input ---------- */
els.photoInput.addEventListener("change", async () => {
  const file = els.photoInput.files?.[0];
  if (!file) return;
  try {
    const dataUrl = await downscaleImage(await fileToDataUrl(file));
    setPhoto(dataUrl);
  } catch {
    status("⚠ Could not read that image — try another one.", "error");
  }
  els.photoInput.value = "";
});
els.photoRemove.addEventListener("click", () => setPhoto(""));

/* ------------------------------------------------------------------
   9. Compare two foods
   ------------------------------------------------------------------ */
async function runCompare() {
  const a = els.compareA.value.trim(), b = els.compareB.value.trim();
  if (!a || !b) { compareStatus("Enter both foods to compare.", "error"); return; }

  els.compareBtn.disabled = true;
  compareStatus("Comparing…", "loading");
  try {
    const [ra, rb] = await Promise.all([analyseOnServer(a), analyseOnServer(b)]);
    const na = normalizeAnalysis(ra), nb = normalizeAnalysis(rb);
    renderCompare(na, nb, a, b);
    flags.compare = true;
    saveHistory();
    renderBadges();
    compareStatus("Comparison ready.", "ok");
  } catch (err) {
    compareStatus("⚠ " + (err?.message || "Something went wrong."), "error");
  } finally {
    els.compareBtn.disabled = false;
  }
}

function cmpTitle(a, fallback) {
  return a.items.map((i) => i.name).slice(0, 2).join(" + ") || fallback.slice(0, 30);
}
function renderCompare(na, nb, labelA, labelB) {
  const tA = na.totals, tB = nb.totals;
  const titleA = cmpTitle(na, labelA), titleB = cmpTitle(nb, labelB);
  const winner = na.rating === nb.rating ? null : na.rating > nb.rating ? "a" : "b";

  const rows = [
    ["🔥 Calories", Math.round(tA.calories), Math.round(tB.calories), "kcal", true],
    ["🥩 Protein", tA.protein.toFixed(1), tB.protein.toFixed(1), "g", false],
    ["🍞 Carbs", tA.carbs.toFixed(1), tB.carbs.toFixed(1), "g", true],
    ["🧈 Fat", tA.fat.toFixed(1), tB.fat.toFixed(1), "g", true],
    ["🌾 Fibre", tA.fiber.toFixed(1), tB.fiber.toFixed(1), "g", false],
    ["🍬 Sugar", tA.sugar.toFixed(1), tB.sugar.toFixed(1), "g", true],
    ["🧂 Sodium", Math.round(tA.sodium), Math.round(tB.sodium), "mg", true],
  ];
  const mark = (va, vb, lowerBetter) => {
    const fa = parseFloat(va), fb = parseFloat(vb);
    if (fa === fb) return ["", ""];
    const aWins = lowerBetter ? fa < fb : fa > fb;
    return aWins ? ["good", "bad"] : ["bad", "good"];
  };

  const built = rows.map(([label, va, vb, unit, lb]) => {
    const [ca, cb] = mark(va, vb, lb);
    return { label, a: va, b: vb, unit, ca, cb };
  });
  const cardHtml = (title, sub, side, rating, isWinner) => `
    <div class="cmp-card ${isWinner ? "winner" : ""}">
      <div class="cmp-title">${isWinner ? "🏆 " : ""}${esc(title)}</div>
      <div class="cmp-sub">${esc(sub)}</div>
      <div class="cmp-rows">
        ${built.map((r) => `<div class="cmp-row"><span>${r.label}</span><b class="${side === "a" ? r.ca : r.cb}">${r[side]} ${r.unit}</b></div>`).join("")}
      </div>
      <div class="cmp-rating">Health score: <b>${rating.toFixed(1)} / 10</b></div>
    </div>`;

  els.compareCards.innerHTML =
    cardHtml(titleA, labelA.slice(0, 60), "a", na.rating, winner === "a") +
    cardHtml(titleB, labelB.slice(0, 60), "b", nb.rating, winner === "b");

  // Verdict
  const dKcal = Math.round(tA.calories - tB.calories);
  const dProtein = tA.protein - tB.protein;
  const dFiber = tA.fiber - tB.fiber;
  const dSugar = tA.sugar - tB.sugar;
  els.compareVerdict.classList.remove("hidden", "tie");
  if (!winner) {
    els.compareVerdict.classList.add("tie");
    els.compareVerdict.innerHTML =
      `🤝 <b>It's a tie!</b> Both score ${(na.rating).toFixed(1)}/10 — pick whichever you're craving, or add a side of salad to either.`;
  } else {
    const w = winner === "a" ? { title: titleA, r: na.rating, other: titleB, ro: nb.rating }
                             : { title: titleB, r: nb.rating, other: titleA, ro: na.rating };
    const sgn = (v, u, better) => {
      const n = Math.abs(v);
      if (n < 0.5 && u !== "%") return "";
      const dir = (better ? v > 0 : v < 0) ? "more" : "less";
      return `${n.toFixed(u === "mg" ? 0 : 1)}${u === "mg" ? "" : " g"} ${dir} ${u}`;
    };
    const bits = [
      dKcal !== 0 ? `${Math.abs(dKcal)} kcal ${((winner === "a" ? dKcal < 0 : dKcal > 0) ? "fewer" : "more")} calories` : "",
      Math.abs(dProtein) >= 0.5 ? `${Math.abs(dProtein).toFixed(1)} g ${((winner === "a" ? dProtein > 0 : dProtein < 0) ? "more" : "less")} protein` : "",
      Math.abs(dFiber) >= 0.5 ? `${Math.abs(dFiber).toFixed(1)} g ${((winner === "a" ? dFiber > 0 : dFiber < 0) ? "more" : "less")} fibre` : "",
      Math.abs(dSugar) >= 0.5 ? `${Math.abs(dSugar).toFixed(1)} g ${((winner === "a" ? dSugar < 0 : dSugar > 0) ? "less" : "more")} sugar` : "",
    ].filter(Boolean).slice(0, 3);
    els.compareVerdict.innerHTML =
      `🏆 <b>${esc(w.title)}</b> looks like the healthier pick — it scores <b>${w.r.toFixed(1)}/10</b> vs ${w.ro.toFixed(1)}/10` +
      (bits.length ? `, with ${bits.join(", ")}.` : ".");
  }
  els.compareWrap.classList.remove("hidden");
}

els.compareBtn.addEventListener("click", runCompare);
els.compareSwapBtn.addEventListener("click", () => {
  const t = els.compareA.value;
  els.compareA.value = els.compareB.value;
  els.compareB.value = t;
});

/* ------------------------------------------------------------------
   10. Offline food table (search + sort + category chips)
   ------------------------------------------------------------------ */
function renderCatChips() {
  const cats = ["all", ...new Set(FOODS.map((f) => f.category))];
  els.catChips.innerHTML = cats.map((c) =>
    `<button class="cat-chip ${c === state.catFilter ? "active" : ""}" data-cat="${c}">${c}</button>`).join("");
}
els.catChips.addEventListener("click", (e) => {
  const btn = e.target.closest(".cat-chip");
  if (!btn) return;
  state.catFilter = btn.dataset.cat;
  renderCatChips();
  renderDB();
});

function renderDB() {
  const q = els.dbSearch.value.trim().toLowerCase();
  let rows = FOODS;
  if (state.catFilter !== "all") rows = rows.filter((f) => f.category === state.catFilter);
  if (q) {
    rows = rows.filter((f) =>
      f.name.toLowerCase().includes(q) || f.category.includes(q) || f.tags.includes(q));
  }
  const { key, dir } = state.dbSort;
  rows = [...rows].sort((a, b) => {
    const va = a[key], vb = b[key];
    return (typeof va === "string" ? va.localeCompare(vb) : va - vb) * dir;
  });

  els.dbTableBody.innerHTML = rows.map((f) => `
    <tr>
      <td>${f.name}</td><td>${f.category}</td>
      <td class="num">${f.calories}</td><td class="num">${f.protein.toFixed(1)}</td>
      <td class="num">${f.carbs.toFixed(1)}</td><td class="num">${f.fat.toFixed(1)}</td>
      <td class="num">${f.fiber.toFixed(1)}</td><td class="num">${f.sugar.toFixed(1)}</td>
      <td class="num">${f.sodium}</td>
    </tr>`).join("") || `<tr><td colspan="9" class="muted">No matches.</td></tr>`;
  els.dbCount.textContent = `— ${rows.length} of ${FOODS.length} foods`;
}

document.querySelectorAll("#dbTable th[data-sort]").forEach((th) => {
  th.addEventListener("click", () => {
    const key = th.dataset.sort;
    state.dbSort = { key, dir: state.dbSort.key === key ? -state.dbSort.dir : 1 };
    renderDB();
  });
});
els.dbSearch.addEventListener("input", renderDB);
els.clearHistoryBtn.addEventListener("click", () => {
  if (!history.length) return;
  if (!confirm("Delete all logged meals? This cannot be undone.")) return;
  history = [];
  flags = {};
  saveHistory();
  renderStats(); renderHistory(); renderBadges(); updateWeekChart();
});

/* ------------------------------------------------------------------
   11. Init
   ------------------------------------------------------------------ */
async function checkServer() {
  try {
    const res = await fetch("/api/health");
    if (!res.ok) throw new Error();
    const data = await res.json();
    els.groqStatus.textContent = data.api_key_configured
      ? "• connected ✓" : "• server running, but no API key in .env";
  } catch {
    els.groqStatus.textContent = "• server not reachable — start it with: python server.py";
  }
}

loadHistory();
checkServer();
renderDB();
renderCatChips();
ensureCharts();
renderStats();
renderHistory();
renderBadges();
updateWeekChart();
