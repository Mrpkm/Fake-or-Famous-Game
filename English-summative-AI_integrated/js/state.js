// Minimal observable state store — no framework needed.
const GameState = (() => {
  let _state = {
    phase: 'start',          // start | briefing | investigation | build_case | verdict | feedback | round_summary | game_end
    round: 0,                // 0 or 1
    globalCaseIndex: 0,      // 0–5 across the whole game
    caseOrder: [],           // shuffled artist indices [0..5]
    assignments: [],         // 'real' | 'fraud' per artist index
    currentArtist: null,
    currentRole: null,       // 'real' | 'fraud'
    questionsLeft: CONFIG.questionsPerCase,
    askedQuestions: [],      // [{questionId, text, answer, value, isTell}]
    lastAnswerIdx: -1,       // index into askedQuestions for the speech bubble
    evidenceTray: [],        // [{id, source, cardType, label, text, isTell, questionId}]
    activeDossierCard: 'bio',
    peel: {
      point:    null,        // 'real' | 'fraud'
      evidence: [],          // up to 3 chip ids
      explain:  '',
      link:     '',
    },
    verdict: null,
    currentCaseScore: null,
    caseScores: [],
    timerSeconds: CONFIG.investigateTime,
  };

  const _listeners = [];

  return {
    get()          { return _state; },
    set(updates)   {
      _state = Object.assign({}, _state, updates);
      _listeners.forEach(fn => fn(_state));
    },
    subscribe(fn)  { _listeners.push(fn); },
  };
})();
