// Regex patterns for comprehensive gym/fitness term matching
const GYM_REGEX_PATTERNS = [
  // Core fitness terms
  /\b(workout|exercise|training|gym|fitness|routine|program|plan)s?\b/i,
  /\b(sets?|reps?|repetitions?|rest|hypertrophy|strength|endurance)\b/i,
  /\b(warmup|warm.?up|cooldown|cool.?down)\b/i,

  // Exercise names (with variations)
  /\b(squat|bench|deadlift|press|row|curl|pull.?up|push.?up|plank)s?\b/i,
  /\b(squat|bench|deadlift|press|row|curl)ing\b/i, // squatting, benching, etc.

  // Cardio terms
  /\b(cardio|cardiovascular|aerobic|run|running|jog|jogging)\b/i,
  /\b(treadmill|cycle|cycling|bike|biking|rowing|elliptical)\b/i,

  // Equipment
  /\b(dumbbell|barbell|kettlebell|machine|cable|bodyweight)\b/i,
  /\b(weight|weights|lifting|lift)\b/i,

  // Body parts/muscles
  /\b(glutes?|quads?|quadriceps|hamstrings?|lats?|delts?|deltoids?)\b/i,
  /\b(pecs?|pectorals?|biceps?|triceps?|abs|abdominals?|core|calves?)\b/i,
  /\b(chest|back|shoulders?|arms?|legs?|thighs?)\b/i,

  // Nutrition & supplements
  /\b(protein|creatine|bcaa|pre.?workout|post.?workout|supplement)s?\b/i,
  /\b(diet|nutrition|calories?|macros?|carbs?|carbohydrates?|fats?)\b/i,
  /\b(bulk|bulking|cut|cutting|lean|muscle.?building)\b/i,

  // Training concepts
  /\b(progressive.?overload|time.?under.?tension|drop.?sets?|super.?sets?)\b/i,
  /\b(compound|isolation|functional|olympic.?lift)\b/i,
  /\b(form|technique|posture|mobility|flexibility|stretching)\b/i,

  // Goals & results
  /\b(gain|lose|build|tone|shred|mass|size|definition)\b/i,
  /\b(muscle|fat.?loss|weight.?loss|weight.?gain)\b/i,

  // Health & recovery
  /\b(recovery|rest.?day|sleep|hydration|injury|pain|sore)\b/i,
  /\b(physical.?therapy|rehab|mobility|flexibility)\b/i,
];

export type CheckScopeResult = {
  isInScope: boolean;
  reason?: string;
  reply?: string;
  matchedPattern?: string;
};

export function checkScope(query: string): CheckScopeResult {
  const q = query.toLowerCase();

  // Test against all regex patterns
  for (const pattern of GYM_REGEX_PATTERNS) {
    const match = pattern.exec(q);
    if (match) {
      return {
        isInScope: true,
        matchedPattern: match[0], // Show what matched for debugging
      };
    }
  }

  return {
    isInScope: false,
    reason: "The query is not related to fitness, gym, or health topics",
    reply:
      "I'm FitBot, specialized in fitness and gym topics. I can help with workouts, nutrition, exercise form, supplements, and health-related questions. What fitness topic would you like to know about?",
  };
}
