export type CheckScopeResult = {
  isInScope: boolean;
  reason?: string;
  reply?: string;
  matched?: string; // what matched (for debugging)
  via?: "phrase" | "token" | "llm-check";
};

/** 1) Normalize user text so regex is easier to write. */
function normalize(s: string) {
  return s
    .normalize("NFKD")
    .toLowerCase()
    .replace(/['']/g, "") // remove apostrophes/smart quotes
    .replace(/[_–—-]+/g, " ") // hyphenish → space
    .replace(/\s+/g, " ") // collapse spaces
    .trim();
}

/** 2) Phrases w/ flexible separators + plurals. */
const PHRASES = [
  // chest-specific & common gym phrases
  "bench press",
  "incline press",
  "decline press",
  "chest press",
  "push up",
  "pull up",
  "dip",
  "dips",
  "chest fly",
  "cable fly",
  "cable crossover",
  "pec deck",
  "machine fly",
  "dumbbell press",
  "barbell press",

  // core gym domain
  "workout",
  "working out",
  "exercise",
  "training",
  "train",
  "fitness",
  "program",
  "routine",
  "plan",
  "sets",
  "reps",
  "rest",
  "hypertrophy",
  "strength",
  "endurance",

  // nutrition & goals
  "what to eat",
  "gain muscle",
  "build muscle",
  "muscle growth",
  "weight loss",
  "fat loss",
  "weight gain",
  "calorie surplus",
  "calorie deficit",
  "meal plan",
  "pre workout",
  "post workout",

  // equipment
  "dumbbell",
  "barbell",
  "kettlebell",
  "bodyweight",
  "smith machine",
  "cable",

  // body parts / muscles
  "chest",
  "pec",
  "pecs",
  "shoulder",
  "delts",
  "lats",
  "triceps",
  "biceps",
  "glutes",
  "quads",
  "hamstrings",
  "legs",
  "leg",
  "abs",
  "core",

  // training concepts
  "progressive overload",
  "time under tension",
  "drop set",
  "superset",
];

/** Build a permissive regex for each phrase:
 *  - allow optional plural/verb endings
 *  - allow space or hyphen between words (normalized already)
 */
function buildPhraseRegex(p: string): RegExp {
  // convert "cable fly" -> "cable\\s+fly(e|es|s)?"
  const words = p.split(" ").filter(Boolean).map(escapeRe);
  const base = words.join("\\s+");
  // add simple plural/verb endings at the end of the phrase
  return new RegExp(`(^|[^a-z0-9])(${base})(e?s|ing)?($|[^a-z0-9])`, "i");
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const PHRASE_REGEXES = PHRASES.map(buildPhraseRegex);

/** 3) Token-based fallback for single words / stems. */
const TOKENS = new Set([
  // single-word stems; keep them short & generic
  "workout",
  "exercise",
  "training",
  "train",
  "gym",
  "fitness",
  "routine",
  "program",
  "plan",
  "set",
  "sets",
  "rep",
  "reps",
  "rest",
  "hypertrophy",
  "strength",
  "endurance",
  "squat",
  "bench",
  "deadlift",
  "press",
  "row",
  "curl",
  "dip",
  "pushup",
  "pullup",
  "plank",
  "fly",
  "flye",
  "flyes",
  "flys",
  "crossover",
  "pec",
  "cardio",
  "run",
  "running",
  "jog",
  "cycling",
  "bike",
  "rower",
  "elliptical",
  "dumbbell",
  "barbell",
  "kettlebell",
  "machine",
  "cable",
  "bodyweight",
  "smith",
  "chest",
  "back",
  "shoulder",
  "delts",
  "lats",
  "triceps",
  "biceps",
  "abs",
  "core",
  "glutes",
  "quads",
  "hamstrings",
  "legs",
  "leg",
  "calves",
  "protein",
  "creatine",
  "bcaa",
  "preworkout",
  "postworkout",
  "diet",
  "nutrition",
  "calories",
  "macros",
  "carbs",
  "fats",
  "overload",
  "tut",
  "drop",
  "superset",
  "form",
  "technique",
  "mobility",
  "stretching",
  // additional nutrition & goal tokens
  "eat",
  "eating",
  "food",
  "meal",
  "meals",
  "bulk",
  "bulking",
  "cut",
  "cutting",
  "surplus",
  "deficit",
  "gain",
  "growth",
  "muscle",
  "weight",
  "fat",
]);

function tokenHit(q: string): string | null {
  const tokens = q.split(/[^a-z0-9]+/g).filter(Boolean);
  for (const t of tokens) {
    if (TOKENS.has(t)) return t;
    // simple stems to catch variants
    if (t.endsWith("ing") && TOKENS.has(t.slice(0, -3))) return t;
    if (t.endsWith("es") && TOKENS.has(t.slice(0, -2))) return t;
    if (t.endsWith("s") && TOKENS.has(t.slice(0, -1))) return t;
  }
  return null;
}

export function checkScope(raw: string): CheckScopeResult {
  const q = normalize(raw);

  // 1) phrase match first (handles multi-word like "cable flyes", "bench-press")
  for (const rx of PHRASE_REGEXES) {
    const m = q.match(rx);
    if (m) return { isInScope: true, via: "phrase", matched: m[2] };
  }

  // 2) token fallback (handles "dips", "flyes", "pushups")
  const t = tokenHit(q);
  if (t) return { isInScope: true, via: "token", matched: t };

  // 3) No keyword match - return false so LLM can do a smart scope check
  // This allows for misspellings, variations, and context understanding
  // while still catching off-topic questions
  return {
    isInScope: false,
    via: "llm-check" as const,
    reason: "No explicit keyword match, will use LLM to determine scope",
  };
}
