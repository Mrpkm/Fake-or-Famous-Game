// Game configuration — teacher-adjustable settings live here.
const CONFIG = {
  questionsPerCase:   5,
  maxEvidenceInPeel:  3,

  // Timer durations in seconds (set to 0 to disable that phase timer)
  investigateTime: 420,  // 7 minutes
  buildTime:       180,  // 3 minutes

  // When true, no timers run at all — good for classroom demos
  practiceMode: false,

  scoring: {
    correctVerdict:    50,
    decisiveEvidence:  15,   // per decisive chip cited, max 2 chips = 30 pts
    peelComplete:      10,
    questionEfficiency: 10,
  },

  // Stars thresholds (out of 3 stars per case, 18 total)
  ranks: [
    { name: 'Rookie',              minStars:  0 },
    { name: 'Junior Detective',    minStars:  6 },
    { name: 'Inspector',           minStars: 10 },
    { name: 'Master Authenticator', minStars: 15 },
  ],
};
