"""
Food Analyser
=============
An offline nutrition tool. Look up a food, scale it to the amount you
actually eat, see where its energy comes from, compare two foods, or add
up a whole meal.

All values are approximate, per 100 g (or 100 ml for liquids), rounded
from common food-composition tables.

Run:  python food_analyser.py
"""

from dataclasses import dataclass


# ---------------------------------------------------------------------
# The database
# ---------------------------------------------------------------------
# Columns: name, category, kcal, protein, carbs, fat, fibre, sugar, sodium(mg), tags

RAW = [
    # ---------------- GRAINS & CEREALS ----------------
    ("rice (white, cooked)",      "grain", 130, 2.7, 28.2, 0.3, 0.4, 0.1, 1, "staple,refined"),
    ("rice (brown, cooked)",      "grain", 123, 2.7, 25.6, 1.0, 1.6, 0.4, 4, "staple,wholegrain"),
    ("rice (basmati, cooked)",    "grain", 121, 3.5, 25.2, 0.4, 0.7, 0.1, 1, "staple"),
    ("poha (cooked)",             "grain", 130, 2.4, 27.5, 1.5, 0.9, 0.2, 180, ""),
    ("upma",                      "grain", 140, 3.2, 20.0, 5.2, 1.4, 1.0, 320, ""),
    ("idli",                      "grain", 133, 4.0, 26.0, 1.0, 1.2, 0.5, 190, "fermented,steamed"),
    ("dosa (plain)",              "grain", 168, 3.9, 25.0, 5.7, 1.1, 0.6, 230, "fermented"),
    ("masala dosa",               "grain", 200, 4.5, 28.0, 8.0, 2.0, 1.5, 300, ""),
    ("roti / chapati (wheat)",    "grain", 297, 11.0, 51.0, 4.6, 8.0, 1.5, 200, "staple,wholegrain"),
    ("paratha (plain)",           "grain", 320, 6.5, 45.0, 12.5, 3.5, 1.2, 280, ""),
    ("aloo paratha",              "grain", 290, 5.5, 40.0, 11.5, 3.0, 1.5, 350, ""),
    ("naan",                      "grain", 310, 8.7, 50.0, 6.0, 2.2, 3.2, 420, "refined"),
    ("puri",                      "grain", 400, 6.5, 45.0, 21.0, 2.5, 1.0, 250, "fried"),
    ("bread (white)",             "grain", 265, 9.0, 49.0, 3.2, 2.7, 5.0, 491, "refined"),
    ("bread (whole wheat)",       "grain", 247, 13.0, 41.0, 3.4, 7.0, 6.0, 400, "wholegrain"),
    ("oats (rolled, dry)",        "grain", 389, 16.9, 66.3, 6.9, 10.6, 0.0, 2, "wholegrain"),
    ("oatmeal (cooked)",          "grain", 71, 2.5, 12.0, 1.4, 1.7, 0.3, 4, "wholegrain"),
    ("cornflakes",                "grain", 357, 7.5, 84.0, 0.4, 3.3, 8.0, 729, "ultra-processed"),
    ("muesli",                    "grain", 340, 9.7, 66.0, 6.0, 7.7, 16.0, 25, ""),
    ("quinoa (cooked)",           "grain", 120, 4.4, 21.3, 1.9, 2.8, 0.9, 7, "wholegrain"),
    ("wheat flour (atta)",        "grain", 340, 12.0, 72.0, 1.7, 10.7, 0.4, 2, "wholegrain"),
    ("maida (refined flour)",     "grain", 364, 10.0, 76.0, 1.0, 2.7, 0.3, 2, "refined"),
    ("semolina (suji, dry)",      "grain", 360, 12.7, 72.8, 1.1, 3.9, 0.7, 1, ""),
    ("barley (cooked)",           "grain", 123, 2.3, 28.2, 0.4, 3.8, 0.3, 3, "wholegrain"),
    ("bajra (pearl millet)",      "grain", 378, 11.0, 73.0, 4.2, 8.5, 0.0, 5, "wholegrain,millet"),
    ("ragi (finger millet)",      "grain", 328, 7.3, 72.0, 1.3, 11.5, 0.0, 11, "wholegrain,millet,calcium"),
    ("jowar (sorghum)",           "grain", 329, 10.6, 72.0, 3.5, 6.7, 0.0, 2, "wholegrain,millet"),
    ("sweet corn (boiled)",       "grain", 96, 3.4, 21.0, 1.5, 2.4, 4.5, 15, ""),
    ("pasta (cooked)",            "grain", 131, 5.0, 25.0, 1.1, 1.8, 0.6, 6, ""),
    ("instant noodles",           "grain", 448, 9.4, 62.0, 17.0, 3.0, 2.0, 1200, "ultra-processed,fried"),
    ("couscous (cooked)",         "grain", 112, 3.8, 23.0, 0.2, 1.4, 0.1, 5, ""),
    ("vermicelli (cooked)",       "grain", 124, 4.0, 25.0, 0.9, 1.2, 0.4, 5, ""),

    # ---------------- LEGUMES & PULSES ----------------
    ("dal (lentil, cooked)",      "legume", 116, 9.0, 20.1, 0.4, 7.9, 1.8, 240, "plant protein"),
    ("toor dal (cooked)",         "legume", 121, 7.5, 20.0, 0.5, 4.5, 1.0, 230, "plant protein"),
    ("moong dal (cooked)",        "legume", 105, 7.0, 19.0, 0.4, 7.6, 2.0, 220, "plant protein"),
    ("chana dal (cooked)",        "legume", 130, 8.0, 22.0, 1.5, 6.0, 1.5, 240, "plant protein"),
    ("urad dal (cooked)",         "legume", 130, 8.5, 21.0, 1.2, 6.5, 1.0, 230, "plant protein"),
    ("rajma (kidney beans)",      "legume", 127, 8.7, 22.8, 0.5, 7.4, 0.3, 6, "plant protein"),
    ("chickpeas (boiled)",        "legume", 164, 8.9, 27.4, 2.6, 7.6, 4.8, 7, "plant protein"),
    ("black beans (boiled)",      "legume", 132, 8.9, 23.7, 0.5, 8.7, 0.3, 2, "plant protein"),
    ("soybean (boiled)",          "legume", 173, 16.6, 9.9, 9.0, 6.0, 3.0, 1, "complete protein"),
    ("soy chunks (dry)",          "legume", 345, 52.0, 33.0, 0.5, 13.0, 2.5, 2, "complete protein"),
    ("tofu",                      "legume", 76, 8.1, 1.9, 4.8, 0.3, 0.6, 7, "plant protein"),
    ("green peas (boiled)",       "legume", 84, 5.4, 15.6, 0.2, 5.5, 5.9, 3, ""),
    ("moong sprouts",             "legume", 30, 3.0, 5.9, 0.2, 1.8, 4.1, 6, "low calorie"),
    ("peanut butter",             "legume", 588, 25.0, 20.0, 50.0, 6.0, 9.0, 476, ""),
    ("hummus",                    "legume", 166, 7.9, 14.3, 9.6, 6.0, 0.3, 379, ""),
    ("lentil soup",               "legume", 60, 4.0, 8.0, 1.5, 2.0, 1.0, 350, ""),

    # ---------------- DAIRY & EGGS ----------------
    ("milk (whole)",              "dairy", 61, 3.2, 4.8, 3.3, 0.0, 5.1, 43, "calcium"),
    ("milk (toned)",              "dairy", 58, 3.1, 4.7, 3.0, 0.0, 4.9, 42, "calcium"),
    ("milk (skimmed)",            "dairy", 34, 3.4, 5.0, 0.1, 0.0, 5.1, 42, "calcium,low calorie"),
    ("curd / yogurt",             "dairy", 61, 3.5, 4.7, 3.3, 0.0, 4.7, 36, "probiotic,calcium"),
    ("greek yogurt",              "dairy", 59, 10.0, 3.6, 0.4, 0.0, 3.2, 36, "probiotic,protein"),
    ("paneer",                    "dairy", 265, 18.3, 1.2, 20.8, 0.0, 1.2, 18, "protein,calcium"),
    ("cheese (cheddar)",          "dairy", 403, 25.0, 1.3, 33.0, 0.0, 0.5, 621, "saturated fat"),
    ("mozzarella",                "dairy", 280, 22.0, 2.2, 17.0, 0.0, 1.0, 627, ""),
    ("processed cheese slice",    "dairy", 300, 18.0, 5.0, 23.0, 0.0, 2.0, 1300, "ultra-processed"),
    ("butter",                    "dairy", 717, 0.9, 0.1, 81.1, 0.0, 0.1, 643, "saturated fat"),
    ("ghee",                      "dairy", 900, 0.0, 0.0, 100.0, 0.0, 0.0, 2, "saturated fat"),
    ("cream",                     "dairy", 292, 2.1, 2.8, 30.0, 0.0, 2.8, 38, "saturated fat"),
    ("condensed milk",            "dairy", 321, 7.9, 54.0, 8.7, 0.0, 54.0, 127, "added sugar"),
    ("ice cream (vanilla)",       "dairy", 207, 3.5, 23.6, 11.0, 0.7, 21.0, 80, "added sugar"),
    ("lassi (sweet)",             "dairy", 100, 2.6, 15.0, 3.0, 0.0, 14.0, 45, "added sugar"),
    ("buttermilk (chaas)",        "dairy", 40, 3.3, 4.8, 0.9, 0.0, 4.8, 105, "probiotic,low calorie"),
    ("khoya / mawa",              "dairy", 420, 14.0, 25.0, 30.0, 0.0, 25.0, 80, ""),
    ("egg (boiled)",              "protein", 155, 12.6, 1.1, 10.6, 0.0, 1.1, 124, "complete protein"),
    ("egg white",                 "protein", 52, 10.9, 0.7, 0.2, 0.0, 0.7, 166, "lean protein"),
    ("egg yolk",                  "protein", 322, 15.9, 3.6, 26.5, 0.0, 0.6, 48, ""),
    ("omelette",                  "protein", 154, 10.6, 0.6, 11.9, 0.0, 0.5, 250, ""),

    # ---------------- MEAT & SEAFOOD ----------------
    ("chicken breast",            "protein", 165, 31.0, 0.0, 3.6, 0.0, 0.0, 74, "lean protein"),
    ("chicken thigh",             "protein", 209, 26.0, 0.0, 10.9, 0.0, 0.0, 84, "protein"),
    ("chicken curry",             "protein", 180, 15.0, 6.0, 10.0, 1.2, 2.0, 480, ""),
    ("tandoori chicken",          "protein", 175, 27.0, 2.0, 6.5, 0.3, 1.0, 520, "protein,grilled"),
    ("chicken nuggets",           "protein", 296, 15.0, 16.0, 19.0, 1.0, 0.5, 557, "fried,ultra-processed"),
    ("mutton (goat)",             "protein", 143, 27.0, 0.0, 3.0, 0.0, 0.0, 82, "lean protein,iron"),
    ("lamb",                      "protein", 294, 25.0, 0.0, 21.0, 0.0, 0.0, 72, "saturated fat"),
    ("beef",                      "protein", 250, 26.0, 0.0, 15.0, 0.0, 0.0, 72, "iron"),
    ("pork",                      "protein", 242, 27.0, 0.0, 14.0, 0.0, 0.0, 62, ""),
    ("bacon",                     "protein", 541, 37.0, 1.4, 42.0, 0.0, 0.0, 1717, "processed meat"),
    ("sausage",                   "protein", 301, 12.0, 2.5, 27.0, 0.0, 1.0, 848, "processed meat"),
    ("chicken liver",             "protein", 119, 17.0, 0.7, 4.8, 0.0, 0.0, 71, "iron,vitamin a"),
    ("fish (rohu)",               "protein", 97, 16.6, 0.0, 3.2, 0.0, 0.0, 60, "lean protein"),
    ("salmon",                    "protein", 208, 20.0, 0.0, 13.0, 0.0, 0.0, 59, "omega-3"),
    ("tuna (canned)",             "protein", 116, 26.0, 0.0, 0.8, 0.0, 0.0, 247, "lean protein"),
    ("prawns / shrimp",           "protein", 99, 24.0, 0.2, 0.3, 0.0, 0.0, 111, "lean protein"),
    ("crab",                      "protein", 97, 19.0, 0.0, 1.5, 0.0, 0.0, 293, "lean protein"),
    ("fish fry",                  "protein", 220, 18.0, 8.0, 13.0, 0.5, 0.0, 420, "fried"),

    # ---------------- VEGETABLES ----------------
    ("potato (boiled)",           "vegetable", 87, 1.9, 20.1, 0.1, 1.8, 0.9, 4, "starchy"),
    ("sweet potato",              "vegetable", 86, 1.6, 20.1, 0.1, 3.0, 4.2, 55, "starchy,vitamin a"),
    ("onion",                     "vegetable", 40, 1.1, 9.3, 0.1, 1.7, 4.2, 4, ""),
    ("tomato",                    "vegetable", 18, 0.9, 3.9, 0.2, 1.2, 2.6, 5, "low calorie"),
    ("spinach (palak)",           "vegetable", 23, 2.9, 3.6, 0.4, 2.2, 0.4, 79, "iron,low calorie"),
    ("fenugreek leaves (methi)",  "vegetable", 49, 4.4, 6.0, 0.9, 1.1, 0.0, 76, "iron"),
    ("mustard greens (sarson)",   "vegetable", 27, 2.9, 4.7, 0.4, 3.2, 1.3, 20, "low calorie"),
    ("cabbage",                   "vegetable", 25, 1.3, 5.8, 0.1, 2.5, 3.2, 18, "low calorie"),
    ("cauliflower",               "vegetable", 25, 1.9, 5.0, 0.3, 2.0, 1.9, 30, "low calorie"),
    ("broccoli",                  "vegetable", 34, 2.8, 6.6, 0.4, 2.6, 1.7, 33, "vitamin c,low calorie"),
    ("carrot",                    "vegetable", 41, 0.9, 9.6, 0.2, 2.8, 4.7, 69, "vitamin a"),
    ("beetroot",                  "vegetable", 43, 1.6, 9.6, 0.2, 2.8, 6.8, 78, ""),
    ("brinjal / eggplant",        "vegetable", 25, 1.0, 5.9, 0.2, 3.0, 3.5, 2, "low calorie"),
    ("okra (bhindi)",             "vegetable", 33, 1.9, 7.5, 0.2, 3.2, 1.5, 7, "low calorie"),
    ("bottle gourd (lauki)",      "vegetable", 14, 0.6, 3.4, 0.0, 0.5, 0.0, 2, "low calorie"),
    ("bitter gourd (karela)",     "vegetable", 17, 1.0, 3.7, 0.2, 2.8, 0.0, 5, "low calorie"),
    ("ridge gourd (turai)",       "vegetable", 20, 1.2, 4.4, 0.2, 1.0, 0.0, 3, "low calorie"),
    ("ash gourd (petha)",         "vegetable", 13, 0.4, 3.0, 0.2, 2.9, 0.0, 1, "low calorie"),
    ("pumpkin",                   "vegetable", 26, 1.0, 6.5, 0.1, 0.5, 2.8, 1, "vitamin a,low calorie"),
    ("cucumber",                  "vegetable", 15, 0.7, 3.6, 0.1, 0.5, 1.7, 2, "low calorie"),
    ("capsicum",                  "vegetable", 31, 1.0, 6.0, 0.3, 2.1, 4.2, 4, "vitamin c,low calorie"),
    ("green chilli",              "vegetable", 40, 1.9, 9.5, 0.4, 1.5, 5.1, 9, "vitamin c"),
    ("radish (mooli)",            "vegetable", 16, 0.7, 3.4, 0.1, 1.6, 1.9, 39, "low calorie"),
    ("mushroom",                  "vegetable", 22, 3.1, 3.3, 0.3, 1.0, 2.0, 5, "low calorie"),
    ("zucchini",                  "vegetable", 17, 1.2, 3.1, 0.3, 1.0, 2.5, 8, "low calorie"),
    ("lettuce",                   "vegetable", 15, 1.4, 2.9, 0.2, 1.3, 0.8, 28, "low calorie"),
    ("french beans",              "vegetable", 31, 1.8, 7.0, 0.1, 2.7, 3.3, 6, "low calorie"),
    ("drumstick (moringa)",       "vegetable", 37, 2.1, 8.5, 0.2, 3.2, 0.0, 42, ""),
    ("colocasia (arbi)",          "vegetable", 112, 1.5, 26.0, 0.2, 4.1, 0.4, 11, "starchy"),
    ("yam (jimikand)",            "vegetable", 118, 1.5, 28.0, 0.2, 4.1, 0.5, 9, "starchy"),
    ("garlic",                    "vegetable", 149, 6.4, 33.0, 0.5, 2.1, 1.0, 17, ""),
    ("ginger",                    "vegetable", 80, 1.8, 18.0, 0.8, 2.0, 1.7, 13, ""),
    ("coriander leaves",          "vegetable", 23, 2.1, 3.7, 0.5, 2.8, 0.9, 46, "low calorie"),
    ("curry leaves",              "vegetable", 108, 6.0, 18.7, 1.0, 6.4, 0.0, 20, ""),

    # ---------------- FRUITS ----------------
    ("banana",                    "fruit", 89, 1.1, 22.8, 0.3, 2.6, 12.2, 1, "potassium"),
    ("apple",                     "fruit", 52, 0.3, 13.8, 0.2, 2.4, 10.4, 1, ""),
    ("mango",                     "fruit", 60, 0.8, 15.0, 0.4, 1.6, 13.7, 1, "vitamin a"),
    ("orange",                    "fruit", 47, 0.9, 11.8, 0.1, 2.4, 9.4, 0, "vitamin c"),
    ("grapes",                    "fruit", 69, 0.7, 18.1, 0.2, 0.9, 15.5, 2, ""),
    ("papaya",                    "fruit", 43, 0.5, 10.8, 0.3, 1.7, 7.8, 8, "vitamin a,low calorie"),
    ("guava",                     "fruit", 68, 2.6, 14.3, 1.0, 5.4, 8.9, 2, "vitamin c,high fibre"),
    ("watermelon",                "fruit", 30, 0.6, 7.6, 0.2, 0.4, 6.2, 1, "low calorie"),
    ("muskmelon",                 "fruit", 34, 0.8, 8.2, 0.2, 0.9, 7.9, 16, "low calorie"),
    ("pineapple",                 "fruit", 50, 0.5, 13.1, 0.1, 1.4, 9.9, 1, ""),
    ("pomegranate",               "fruit", 83, 1.7, 18.7, 1.2, 4.0, 13.7, 3, ""),
    ("strawberry",                "fruit", 32, 0.7, 7.7, 0.3, 2.0, 4.9, 1, "vitamin c,low calorie"),
    ("kiwi",                      "fruit", 61, 1.1, 14.7, 0.5, 3.0, 9.0, 3, "vitamin c"),
    ("pear",                      "fruit", 57, 0.4, 15.2, 0.1, 3.1, 9.8, 1, ""),
    ("litchi",                    "fruit", 66, 0.8, 16.5, 0.4, 1.3, 15.2, 1, ""),
    ("custard apple (sitaphal)",  "fruit", 94, 2.1, 24.0, 0.3, 4.4, 0.0, 4, ""),
    ("sapota (chikoo)",           "fruit", 83, 0.4, 20.0, 1.1, 5.3, 0.0, 12, "high fibre"),
    ("jackfruit",                 "fruit", 95, 1.7, 23.2, 0.6, 1.5, 19.1, 2, ""),
    ("coconut (fresh)",           "fruit", 354, 3.3, 15.2, 33.5, 9.0, 6.2, 20, "saturated fat"),
    ("dates",                     "fruit", 277, 1.8, 75.0, 0.2, 6.7, 66.0, 1, "high fibre"),
    ("raisins",                   "fruit", 299, 3.1, 79.0, 0.5, 3.7, 59.0, 11, ""),
    ("figs (dried)",              "fruit", 249, 3.3, 64.0, 0.9, 9.8, 48.0, 10, "high fibre"),
    ("avocado",                   "fruit", 160, 2.0, 8.5, 14.7, 6.7, 0.7, 7, "healthy fat,high fibre"),
    ("lemon",                     "fruit", 29, 1.1, 9.3, 0.3, 2.8, 2.5, 2, "vitamin c,low calorie"),
    ("plum",                      "fruit", 46, 0.7, 11.4, 0.3, 1.4, 9.9, 0, "low calorie"),
    ("amla (indian gooseberry)",  "fruit", 44, 0.9, 10.2, 0.6, 4.3, 0.0, 1, "vitamin c,low calorie"),

    # ---------------- NUTS & SEEDS ----------------
    ("almonds",                   "nut", 579, 21.2, 21.6, 49.9, 12.5, 4.4, 1, "healthy fat,high fibre"),
    ("cashews",                   "nut", 553, 18.2, 30.2, 43.9, 3.3, 5.9, 12, "healthy fat"),
    ("walnuts",                   "nut", 654, 15.2, 13.7, 65.2, 6.7, 2.6, 2, "omega-3,healthy fat"),
    ("pistachios",                "nut", 560, 20.2, 27.2, 45.3, 10.6, 7.7, 1, "healthy fat"),
    ("peanuts",                   "nut", 567, 25.8, 16.1, 49.2, 8.5, 4.7, 18, "healthy fat"),
    ("chia seeds",                "nut", 486, 16.5, 42.1, 30.7, 34.4, 0.0, 16, "omega-3,high fibre"),
    ("flax seeds",                "nut", 534, 18.3, 28.9, 42.2, 27.3, 1.6, 30, "omega-3,high fibre"),
    ("sunflower seeds",           "nut", 584, 20.8, 20.0, 51.5, 8.6, 2.6, 9, "healthy fat"),
    ("pumpkin seeds",             "nut", 559, 30.2, 10.7, 49.0, 6.0, 1.4, 7, "healthy fat,protein"),
    ("sesame seeds (til)",        "nut", 573, 17.7, 23.4, 49.7, 11.8, 0.3, 11, "calcium"),
    ("dry coconut (copra)",       "nut", 660, 6.9, 24.0, 65.0, 16.0, 7.4, 37, "saturated fat"),

    # ---------------- OILS & FATS ----------------
    ("olive oil",                 "fat", 884, 0.0, 0.0, 100.0, 0.0, 0.0, 2, "healthy fat"),
    ("mustard oil",               "fat", 884, 0.0, 0.0, 100.0, 0.0, 0.0, 0, ""),
    ("coconut oil",               "fat", 862, 0.0, 0.0, 100.0, 0.0, 0.0, 0, "saturated fat"),
    ("sunflower oil",             "fat", 884, 0.0, 0.0, 100.0, 0.0, 0.0, 0, ""),
    ("vanaspati",                 "fat", 900, 0.0, 0.0, 100.0, 0.0, 0.0, 10, "trans fat"),
    ("mayonnaise",                "fat", 680, 1.0, 0.6, 75.0, 0.0, 0.6, 635, ""),

    # ---------------- SNACKS & FAST FOOD ----------------
    ("samosa",                    "snack", 308, 5.0, 32.0, 17.9, 2.3, 2.0, 420, "fried"),
    ("pakora",                    "snack", 315, 7.0, 28.0, 19.0, 3.0, 1.5, 480, "fried"),
    ("kachori",                   "snack", 400, 8.0, 40.0, 23.0, 3.0, 1.0, 500, "fried"),
    ("vada pav",                  "snack", 290, 7.0, 42.0, 10.0, 2.5, 3.0, 560, "fried"),
    ("pav bhaji",                 "snack", 230, 5.0, 28.0, 11.0, 3.5, 4.0, 620, ""),
    ("dhokla",                    "snack", 160, 6.0, 24.0, 4.0, 2.0, 5.0, 450, "fermented,steamed"),
    ("momos (veg)",               "snack", 180, 5.0, 30.0, 4.5, 2.0, 2.0, 400, "steamed"),
    ("spring roll",               "snack", 230, 5.0, 30.0, 10.0, 2.0, 3.0, 480, "fried"),
    ("potato chips",              "snack", 536, 7.0, 53.0, 34.6, 4.8, 0.3, 525, "fried,ultra-processed"),
    ("namkeen mixture",           "snack", 520, 13.0, 48.0, 31.0, 5.0, 2.0, 900, "fried,ultra-processed"),
    ("bhujia",                    "snack", 570, 14.0, 45.0, 38.0, 5.0, 2.0, 1000, "fried,ultra-processed"),
    ("popcorn (plain)",           "snack", 387, 12.0, 78.0, 4.5, 15.0, 0.9, 8, "wholegrain,high fibre"),
    ("french fries",              "snack", 312, 3.4, 41.0, 15.0, 3.8, 0.3, 210, "fried"),
    ("veg burger",                "snack", 250, 8.0, 30.0, 11.0, 2.5, 5.0, 500, "fast food"),
    ("chicken burger",            "snack", 295, 15.0, 30.0, 13.0, 1.8, 5.0, 560, "fast food"),
    ("cheese pizza",              "snack", 266, 11.0, 33.0, 10.0, 2.3, 3.6, 598, "fast food"),
    ("veg sandwich",              "snack", 220, 7.0, 30.0, 8.0, 2.5, 4.0, 450, ""),
    ("maggi (cooked)",            "snack", 150, 3.5, 20.0, 6.0, 1.0, 1.0, 620, "ultra-processed"),
    ("chowmein",                  "snack", 180, 5.0, 27.0, 6.0, 2.0, 2.0, 600, ""),
    ("pasta (white sauce)",       "snack", 200, 6.0, 22.0, 10.0, 1.5, 3.0, 400, ""),

    # ---------------- COOKED DISHES ----------------
    ("chicken biryani",           "dish", 190, 9.0, 22.0, 7.5, 1.2, 1.0, 500, ""),
    ("veg fried rice",            "dish", 170, 4.0, 26.0, 5.5, 1.5, 1.5, 450, ""),
    ("idli sambar",               "dish", 120, 4.0, 20.0, 2.5, 2.0, 2.0, 350, ""),
    ("paneer butter masala",      "dish", 280, 10.0, 10.0, 23.0, 2.0, 5.0, 600, ""),
    ("dal makhani",               "dish", 230, 8.0, 18.0, 14.0, 5.0, 2.0, 550, ""),
    ("palak paneer",              "dish", 190, 9.0, 7.0, 14.0, 2.5, 2.0, 500, "iron"),
    ("chole (chickpea curry)",    "dish", 180, 7.0, 22.0, 7.0, 6.0, 3.0, 450, "high fibre"),
    ("chole bhature",             "dish", 330, 8.0, 40.0, 15.0, 4.0, 3.0, 600, "fried"),
    ("aloo sabzi",                "dish", 130, 2.0, 18.0, 6.0, 2.0, 1.5, 400, ""),
    ("mixed veg curry",           "dish", 110, 3.0, 12.0, 6.0, 3.5, 4.0, 420, ""),
    ("egg curry",                 "dish", 170, 9.0, 6.0, 12.0, 1.0, 2.0, 480, ""),
    ("khichdi",                   "dish", 120, 4.5, 20.0, 2.5, 2.0, 0.8, 300, ""),
    ("curd rice",                 "dish", 120, 3.0, 18.0, 4.0, 0.6, 2.0, 280, "probiotic"),
    ("sambar",                    "dish", 60, 3.0, 8.0, 2.0, 2.0, 1.0, 400, ""),
    ("rasam",                     "dish", 35, 1.5, 5.0, 1.0, 1.0, 1.0, 350, "low calorie"),
    ("raita",                     "dish", 60, 2.5, 5.0, 3.0, 0.5, 4.0, 250, "probiotic"),

    # ---------------- SWEETS & BAKERY ----------------
    ("gulab jamun",               "sweet", 350, 5.0, 45.0, 17.0, 0.5, 40.0, 90, "added sugar,fried"),
    ("jalebi",                    "sweet", 380, 3.0, 60.0, 15.0, 0.3, 50.0, 60, "added sugar,fried"),
    ("rasgulla",                  "sweet", 186, 4.0, 33.0, 4.0, 0.0, 30.0, 60, "added sugar"),
    ("besan ladoo",               "sweet", 420, 8.0, 50.0, 21.0, 3.0, 35.0, 80, "added sugar"),
    ("barfi",                     "sweet", 400, 8.0, 45.0, 20.0, 1.0, 38.0, 70, "added sugar"),
    ("suji halwa",                "sweet", 340, 4.0, 45.0, 16.0, 1.0, 30.0, 90, "added sugar"),
    ("kheer",                     "sweet", 145, 3.5, 22.0, 4.5, 0.3, 18.0, 60, "added sugar"),
    ("milk chocolate",            "sweet", 535, 7.6, 59.0, 30.0, 3.4, 52.0, 79, "added sugar"),
    ("dark chocolate",            "sweet", 546, 4.9, 61.0, 31.0, 7.0, 48.0, 24, "added sugar"),
    ("marie biscuit",             "sweet", 440, 7.0, 76.0, 12.0, 2.0, 20.0, 400, "refined,ultra-processed"),
    ("chocolate chip cookie",     "sweet", 480, 5.0, 65.0, 22.0, 2.0, 35.0, 350, "added sugar"),
    ("sponge cake",               "sweet", 340, 5.0, 55.0, 12.0, 1.0, 32.0, 300, "added sugar"),
    ("cream pastry",              "sweet", 380, 4.0, 45.0, 20.0, 1.0, 30.0, 250, "added sugar"),
    ("donut",                     "sweet", 452, 4.9, 51.0, 25.0, 1.5, 23.0, 373, "added sugar,fried"),
    ("sugar (white)",             "sweet", 387, 0.0, 100.0, 0.0, 0.0, 100.0, 1, "added sugar"),
    ("honey",                     "sweet", 304, 0.3, 82.0, 0.0, 0.2, 82.0, 4, ""),
    ("jaggery (gur)",             "sweet", 383, 0.4, 98.0, 0.1, 0.0, 97.0, 30, "iron"),
    ("jam",                       "sweet", 278, 0.4, 69.0, 0.1, 1.0, 65.0, 32, "added sugar"),

    # ---------------- BEVERAGES ----------------
    ("tea (milk + sugar)",        "beverage", 55, 1.3, 8.5, 1.7, 0.0, 7.8, 20, "added sugar"),
    ("green tea",                 "beverage", 1, 0.0, 0.2, 0.0, 0.0, 0.0, 1, "low calorie"),
    ("black coffee",              "beverage", 2, 0.1, 0.0, 0.0, 0.0, 0.0, 5, "low calorie"),
    ("coffee (milk + sugar)",     "beverage", 60, 1.5, 9.0, 1.8, 0.0, 8.0, 25, "added sugar"),
    ("cola / soft drink",         "beverage", 37, 0.0, 9.6, 0.0, 0.0, 9.6, 4, "added sugar"),
    ("packaged orange juice",     "beverage", 45, 0.7, 10.4, 0.2, 0.2, 8.4, 4, "added sugar"),
    ("mango shake",               "beverage", 90, 2.0, 16.0, 2.0, 0.4, 14.0, 30, "added sugar"),
    ("sugarcane juice",           "beverage", 74, 0.2, 19.0, 0.0, 0.0, 18.0, 8, ""),
    ("coconut water",             "beverage", 19, 0.7, 3.7, 0.2, 1.1, 2.6, 105, "low calorie,potassium"),
    ("nimbu pani (lemonade)",     "beverage", 40, 0.1, 10.0, 0.0, 0.1, 10.0, 30, ""),
    ("energy drink",              "beverage", 45, 0.0, 11.0, 0.0, 0.0, 11.0, 105, "added sugar"),
    ("beer",                      "beverage", 43, 0.5, 3.6, 0.0, 0.0, 0.0, 4, "alcohol"),
    ("red wine",                  "beverage", 85, 0.1, 2.6, 0.0, 0.0, 0.6, 4, "alcohol"),
    ("whiskey",                   "beverage", 250, 0.0, 0.0, 0.0, 0.0, 0.0, 1, "alcohol"),
    ("whey protein shake",        "beverage", 80, 15.0, 4.0, 1.0, 0.5, 2.0, 90, "protein"),

    # ---------------- CONDIMENTS ----------------
    ("tomato ketchup",            "condiment", 101, 1.2, 25.0, 0.1, 0.3, 21.0, 907, "added sugar"),
    ("soy sauce",                 "condiment", 53, 8.0, 4.9, 0.1, 0.8, 0.4, 5493, ""),
    ("mango pickle",              "condiment", 180, 1.0, 12.0, 14.0, 2.0, 3.0, 2500, ""),
    ("coconut chutney",           "condiment", 180, 4.0, 8.0, 15.0, 3.0, 2.0, 300, ""),
    ("green chutney",             "condiment", 90, 3.0, 10.0, 4.0, 3.0, 2.0, 400, ""),
    ("salt",                      "condiment", 0, 0.0, 0.0, 0.0, 0.0, 0.0, 38758, ""),
    ("vinegar",                   "condiment", 18, 0.0, 0.9, 0.0, 0.0, 0.4, 2, "low calorie"),
]


@dataclass
class Food:
    """Nutrition facts for 100 g (or 100 ml) of a food."""
    name: str
    category: str
    calories: float
    protein: float
    carbs: float
    fat: float
    fiber: float
    sugar: float
    sodium: float
    tags: tuple = ()


DATABASE = [
    Food(n, cat, kc, p, c, f, fib, sug, sod,
         tuple(t for t in tags.split(",") if t))
    for (n, cat, kc, p, c, f, fib, sug, sod, tags) in RAW
]

CATEGORIES = sorted({f.category for f in DATABASE})


# ---------------------------------------------------------------------
# Lookup
# ---------------------------------------------------------------------

def search(query):
    """Foods whose name, category or tags contain the query.

    Exact name matches win; then names starting with the query; then any
    substring match, so 'rice' puts plain rice ahead of 'curd rice'.
    """
    q = query.strip().lower()
    if not q:
        return []

    exact = [f for f in DATABASE if f.name.lower() == q]
    if exact:
        return exact

    starts, contains, loose = [], [], []
    for f in DATABASE:
        name = f.name.lower()
        if name.startswith(q):
            starts.append(f)
        elif q in name:
            contains.append(f)
        elif q == f.category or any(q in t for t in f.tags):
            loose.append(f)
    return starts + contains + loose


def scale(food, grams):
    """Scale the per-100 g numbers to the amount actually eaten."""
    k = grams / 100.0
    return {
        "calories": food.calories * k,
        "protein": food.protein * k,
        "carbs": food.carbs * k,
        "fat": food.fat * k,
        "fiber": food.fiber * k,
        "sugar": food.sugar * k,
        "sodium": food.sodium * k,
    }


# ---------------------------------------------------------------------
# Analysis
# ---------------------------------------------------------------------

def macro_split(n):
    """Percentage of energy coming from protein, carbs and fat."""
    p, c, f = n["protein"] * 4, n["carbs"] * 4, n["fat"] * 9
    total = p + c + f
    if total == 0:
        return {"protein": 0, "carbs": 0, "fat": 0}
    return {
        "protein": round(p / total * 100),
        "carbs": round(c / total * 100),
        "fat": round(f / total * 100),
    }


def describe(food, split):
    """Plain-language notes about the food, per 100 g."""
    notes = []
    dominant = max(split, key=split.get)
    notes.append(f"Mostly {dominant} — about {split[dominant]}% of its energy.")

    if food.protein >= 20:
        notes.append("Rich in protein.")
    elif food.protein >= 10:
        notes.append("A useful source of protein.")

    if food.fiber >= 8:
        notes.append("Very high in fibre.")
    elif food.fiber >= 4:
        notes.append("A good source of fibre.")

    if food.sugar >= 30:
        notes.append("Very high in sugar.")
    elif food.sugar >= 15:
        notes.append("High in sugar.")

    if food.sodium >= 1000:
        notes.append("Very high in sodium — a little goes a long way.")
    elif food.sodium >= 400:
        notes.append("High in sodium.")

    if food.fat >= 50:
        notes.append("Mostly fat, so very energy-dense.")
    elif food.fat >= 25:
        notes.append("Fat contributes most of its calories.")

    if food.calories <= 40:
        notes.append("Very low in calories for its volume.")

    label = {
        "fried": "Deep fried, so oil adds most of the calories.",
        "ultra-processed": "Ultra-processed.",
        "refined": "Made from refined grain, so less fibre than the wholegrain version.",
        "wholegrain": "Wholegrain.",
        "fermented": "Fermented, which makes it easier to digest.",
        "steamed": "Steamed rather than fried.",
        "probiotic": "Contains live cultures.",
        "omega-3": "A source of omega-3 fats.",
        "healthy fat": "Mainly unsaturated fat.",
        "saturated fat": "High in saturated fat.",
        "trans fat": "May contain trans fats.",
        "processed meat": "Processed meat — best kept occasional.",
        "complete protein": "Contains all the essential amino acids.",
        "iron": "A source of iron.",
        "calcium": "A source of calcium.",
        "vitamin c": "A source of vitamin C.",
        "vitamin a": "A source of vitamin A.",
        "potassium": "A source of potassium.",
        "alcohol": "Alcoholic — its calories come from alcohol, not nutrients.",
        "starchy": "A starchy vegetable, closer to a grain than a leafy veg.",
    }
    for tag in food.tags:
        if tag in label and label[tag] not in notes:
            notes.append(label[tag])
    return notes


def bar(percent, width=20):
    filled = int(round(percent / 100 * width))
    return "\u2588" * filled + "\u00b7" * (width - filled)


def report(food, grams):
    n = scale(food, grams)
    split = macro_split(n)

    print()
    print("=" * 56)
    print(f" {food.name.upper()}  -  {grams:g} g   ({food.category})")
    print("=" * 56)
    print(f" Energy      {n['calories']:8.1f} kcal")
    print(f" Protein     {n['protein']:8.1f} g")
    print(f" Carbs       {n['carbs']:8.1f} g   (sugar {n['sugar']:.1f} g)")
    print(f" Fat         {n['fat']:8.1f} g")
    print(f" Fibre       {n['fiber']:8.1f} g")
    print(f" Sodium      {n['sodium']:8.1f} mg")
    print("-" * 56)
    print(" Where the energy comes from:")
    for macro in ("protein", "carbs", "fat"):
        print(f"   {macro:<8} {bar(split[macro])} {split[macro]:3d}%")
    print("-" * 56)
    print(" Notes:")
    for note in describe(food, split):
        print(f"   - {note}")
    print("=" * 56)
    return n


def meal_report(items):
    """items: list of (Food, grams)"""
    total = {k: 0.0 for k in
             ("calories", "protein", "carbs", "fat", "fiber", "sugar", "sodium")}
    print()
    print("=" * 56)
    print(" MEAL SUMMARY")
    print("=" * 56)
    for food, grams in items:
        n = scale(food, grams)
        for k in total:
            total[k] += n[k]
        print(f" {food.name:<32} {grams:6.0f} g {n['calories']:7.1f} kcal")
    print("-" * 56)
    print(f" Total energy   {total['calories']:8.1f} kcal")
    print(f" Protein        {total['protein']:8.1f} g")
    print(f" Carbs          {total['carbs']:8.1f} g   (sugar {total['sugar']:.1f} g)")
    print(f" Fat            {total['fat']:8.1f} g")
    print(f" Fibre          {total['fiber']:8.1f} g")
    print(f" Sodium         {total['sodium']:8.1f} mg")
    split = macro_split(total)
    print("-" * 56)
    for macro in ("protein", "carbs", "fat"):
        print(f"   {macro:<8} {bar(split[macro])} {split[macro]:3d}%")
    print("=" * 56)


# ---------------------------------------------------------------------
# Interactive menu
# ---------------------------------------------------------------------

def pick_food(query):
    """Search, and if several match, let the user choose one."""
    results = search(query)
    if not results:
        print(f"  '{query.strip()}' is not in the database. "
              f"Try option 3 to browse {len(DATABASE)} foods.")
        return None
    if len(results) == 1:
        return results[0]

    shown = results[:15]
    print(f"  {len(results)} matches" +
          (" (showing the first 15)" if len(results) > 15 else "") + ":")
    for i, f in enumerate(shown, 1):
        print(f"   {i:3d}. {f.name:<32} {f.category:<10} {f.calories:5.0f} kcal/100g")
    choice = input("  Pick a number (or Enter to cancel): ").strip()
    if choice.isdigit() and 1 <= int(choice) <= len(shown):
        return shown[int(choice) - 1]
    print("  Cancelled.")
    return None


def ask_grams():
    raw = input("  Quantity in grams [100]: ").strip()
    if not raw:
        return 100.0
    try:
        g = float(raw)
        return g if g > 0 else 100.0
    except ValueError:
        print("  Not a number - using 100 g.")
        return 100.0


def analyse_single():
    food = pick_food(input("  Food name: "))
    if food:
        report(food, ask_grams())


def analyse_meal():
    print("  Add foods one by one. Press Enter on an empty line to finish.")
    items = []
    while True:
        name = input("  Food name (blank to finish): ").strip()
        if not name:
            break
        food = pick_food(name)
        if food:
            items.append((food, ask_grams()))
    if items:
        meal_report(items)
    else:
        print("  Nothing added.")


def browse():
    print(f"\n  {len(DATABASE)} foods in {len(CATEGORIES)} categories:")
    for i, cat in enumerate(CATEGORIES, 1):
        count = sum(1 for f in DATABASE if f.category == cat)
        print(f"   {i:2d}. {cat:<12} ({count})")
    choice = input("  Category number (or Enter for all): ").strip()
    if choice.isdigit() and 1 <= int(choice) <= len(CATEGORIES):
        cats = [CATEGORIES[int(choice) - 1]]
    else:
        cats = CATEGORIES
    for cat in cats:
        print(f"\n  {cat.upper()}")
        print(f"  {'food':<34}{'kcal':>6}{'prot':>7}{'carb':>7}{'fat':>7}{'fibre':>7}")
        for f in DATABASE:
            if f.category == cat:
                print(f"  {f.name:<34}{f.calories:6.0f}{f.protein:7.1f}"
                      f"{f.carbs:7.1f}{f.fat:7.1f}{f.fiber:7.1f}")
    print()


def compare():
    a = pick_food(input("  First food: "))
    if not a:
        return
    b = pick_food(input("  Second food: "))
    if not b:
        return
    print()
    print(f"  Per 100 g{'':<6}{a.name[:18]:>20}{b.name[:18]:>20}")
    print("  " + "-" * 52)
    rows = [("Calories", "calories", "kcal"), ("Protein", "protein", "g"),
            ("Carbs", "carbs", "g"), ("Sugar", "sugar", "g"),
            ("Fat", "fat", "g"), ("Fibre", "fiber", "g"),
            ("Sodium", "sodium", "mg")]
    for label, attr, unit in rows:
        va, vb = getattr(a, attr), getattr(b, attr)
        mark = "<" if va < vb else (">" if va > vb else "=")
        print(f"  {label:<14}{va:>14.1f} {unit:<4}{mark:^2}{vb:>13.1f} {unit}")
    print()


def rank():
    """Top foods by one nutrient, optionally within a category."""
    fields = ["calories", "protein", "carbs", "fat", "fiber", "sugar", "sodium"]
    print("  Rank by: " + ", ".join(f"{i}. {n}" for i, n in enumerate(fields, 1)))
    choice = input("  Number [2]: ").strip() or "2"
    if not (choice.isdigit() and 1 <= int(choice) <= len(fields)):
        print("  Invalid choice.")
        return
    field = fields[int(choice) - 1]
    cat = input(f"  Limit to a category ({', '.join(CATEGORIES)}) or Enter for all: ").strip().lower()
    pool = [f for f in DATABASE if not cat or f.category == cat]
    if not pool:
        print("  No foods in that category.")
        return
    pool.sort(key=lambda f: getattr(f, field), reverse=True)
    unit = "mg" if field == "sodium" else ("kcal" if field == "calories" else "g")
    print(f"\n  Highest {field} per 100 g:")
    for i, f in enumerate(pool[:15], 1):
        print(f"   {i:2d}. {f.name:<34}{getattr(f, field):8.1f} {unit}")
    print()


MENU = """
+--------------------------------------------+
|              FOOD ANALYSER                 |
+--------------------------------------------+
  1. Analyse one food
  2. Analyse a whole meal
  3. Browse the database
  4. Compare two foods
  5. Rank foods by a nutrient
  6. Quit
"""


def main():
    print(MENU)
    actions = {"1": analyse_single, "2": analyse_meal,
               "3": browse, "4": compare, "5": rank}
    while True:
        choice = input("  Choose 1-6: ").strip()
        if choice == "6" or choice.lower() in ("q", "quit", "exit"):
            print("  Bye.")
            break
        action = actions.get(choice)
        if action:
            action()
            print(MENU)
        else:
            print("  Please enter a number from 1 to 6.")


if __name__ == "__main__":
    main()
