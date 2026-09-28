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
const DV = { calories: 2000, protein: 50, fiber: 30, sugar: 50, sodium: 2300 }; // FDA daily values

const PALETTE = {
  protein: "#22c55e", carbs: "#0ea5e9", fat: "#f59e0b",
  fiber: "#8b5cf6", sugar: "#f43f5e", sodium: "#94a3b8",
  remaining: "#2a3956", extra: ["#f97316", "#14b8a6", "#a78bfa", "#eab308",
                                "#fb7185", "#38bdf8", "#4ade80", "#c084fc"]
};

const $ = (id) => document.getElementById(id);
const els = {
  mealInput: $("mealInput"), analyseBtn: $("analyseBtn"), clearBtn: $("clearBtn"),
  useLocal: $("useLocal"), status: $("status"), result: $("result"),
  ringFg: $("ringFg"), scoreNum: $("scoreNum"), scoreLabel: $("scoreLabel"),
  macroChips: $("macroChips"), notes: $("notes"), itemsTableWrap: $("itemsTableWrap"),
  dbSearch: $("dbSearch"), dbTableBody: document.querySelector("#dbTable tbody"),
  dbCount: $("dbCount"), groqStatus: $("groqStatus"),
};

const state = {
  charts: { macro: null, items: null, dv: null, fuel: null },
  dbSort: { key: "name", dir: 1 },
  ready: false,
};

/* ------------------------------------------------------------------
   3. Server call
   ------------------------------------------------------------------ */
async function analyseOnServer(mealText) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: mealText }),
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
  return { items, totals, rating, ratingReason: String(raw.rating_reason || ""), notes };
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

function renderNotes(a) {
  const notes = [...a.notes];
  if (a.ratingReason) notes.unshift(a.ratingReason);
  els.notes.innerHTML = notes.map((n) => `<div>${n.replace(/</g, "&lt;")}</div>`).join("");
}

function renderItemsTable(items, totals) {
  const rows = items.map((it) => `
    <tr>
      <td>${it.name.replace(/</g, "&lt;")}</td>
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

let analysis = null;

function renderAll(analysisData) {
  analysis = analysisData;
  els.result.classList.remove("hidden");
  renderScore(analysis.rating);
  renderChips(analysis.totals);
  renderNotes(analysis);
  renderItemsTable(analysis.items, analysis.totals);
  updateCharts(analysis);
}

/* ------------------------------------------------------------------
   6. Charts (Chart.js pies)
   ------------------------------------------------------------------ */
function basePieOptions() {
  return {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom", labels: { color: "#9fb0cf", boxWidth: 12, font: { size: 11 } } },
      tooltip: { callbacks: { label: (c) => ` ${c.label}: ${c.parsed}%` } },
      title: { display: false },
    },
  };
}

function emptyPie() {
  return { labels: ["No data yet"], datasets: [{ data: [1], backgroundColor: ["#2a3956"], borderWidth: 0 }] };
}

function ensureCharts() {
  if (state.charts.macro) return;
  const opts = basePieOptions();
  state.charts.macro = new Chart($("macroChart"), { type: "pie", data: emptyPie(), options: opts });
  state.charts.items = new Chart($("itemsChart"), { type: "pie", data: emptyPie(), options: opts });
  state.charts.dv    = new Chart($("dvChart"),    { type: "pie", data: emptyPie(), options: opts });
  state.charts.fuel  = new Chart($("fuelChart"),  { type: "pie", data: emptyPie(), options: opts });
}

function setPie(chart, labels, values, colors, unit = "%") {
  chart.data.labels = labels;
  chart.data.datasets = [{ data: values, backgroundColor: colors, borderColor: "#131f36", borderWidth: 2 }];
  chart.options.plugins.tooltip.callbacks.label = (c) => ` ${c.label}: ${c.parsed}${unit}`;
  chart.update();
}

function updateCharts(a) {
  ensureCharts();
  const t = a.totals;

  // 1) Macro split (% of energy)
  const pk = t.protein * 4, ck = t.carbs * 4, fk = t.fat * 9;
  const tot = Math.max(pk + ck + fk, 1);
  setPie(state.charts.macro,
    ["Protein", "Carbs", "Fat"],
    [pk, ck, fk].map((v) => Math.round((v / tot) * 100)),
    [PALETTE.protein, PALETTE.carbs, PALETTE.fat]);

  // 2) Calories by item
  const items = [...a.items].sort((x, y) => y.calories - x.calories);
  setPie(state.charts.items,
    items.map((i) => i.name),
    items.map((i) => Math.max(i.calories, 0)),
    items.map((_, i) => PALETTE.extra[i % PALETTE.extra.length]),
    " kcal");

  // 3) % Daily Value progress (vs 2000 kcal diet)
  const dvPairs = [
    ["Energy", t.calories, DV.calories, "#22c55e"],
    ["Protein", t.protein, DV.protein, "#0ea5e9"],
    ["Fibre", t.fiber, DV.fiber, "#8b5cf6"],
    ["Sugar cap", t.sugar, DV.sugar, "#f43f5e"],
    ["Sodium cap", t.sodium, DV.sodium, "#94a3b8"],
  ];
  const labels = [], values = [], colors = [];
  dvPairs.forEach(([label, used, limit, color]) => {
    const pct = clamp((used / Math.max(limit, 1)) * 100, 0, 100);
    labels.push(`${label} (${Math.round(pct)}%)`);
    values.push(pct);
    colors.push(color);
    if (pct < 100) { labels.push("left"); values.push(100 - pct); colors.push(PALETTE.remaining); }
  });
  setPie(state.charts.dv, labels, values, colors);

  // 4) Fuel source — kcal from each macro
  setPie(state.charts.fuel,
    ["Protein kcal", "Carb kcal", "Fat kcal"],
    [Math.round(pk), Math.round(ck), Math.round(fk)],
    [PALETTE.protein, PALETTE.carbs, PALETTE.fat], " kcal");
}

/* ------------------------------------------------------------------
   7. Analyse flow
   ------------------------------------------------------------------ */
async function analyse() {
  const text = els.mealInput.value.trim();
  if (!text) { status("Type a food or meal first, e.g. \"2 chapati + dal + curd\".", "error"); return; }

  els.analyseBtn.disabled = true;
  status("Crunching nutrients…", "loading");
  try {
    const raw = await analyseOnServer(text);
    renderAll(mergeLocalItems(normalizeAnalysis(raw), text));
    status(`Analysed ${analysis.items.length} item(s) · ${Math.round(analysis.totals.calories)} kcal · rated ${analysis.rating.toFixed(1)}/10`, "ok");
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
});

/* ------------------------------------------------------------------
   8. Offline food table (search + sort)
   ------------------------------------------------------------------ */
function renderDB() {
  const q = els.dbSearch.value.trim().toLowerCase();
  let rows = FOODS;
  if (q) {
    rows = FOODS.filter((f) =>
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

/* ------------------------------------------------------------------
   9. Init
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

checkServer();
renderDB();
ensureCharts();
