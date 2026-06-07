// Game logic: setup, phase transitions, question asking, scoring.
const Engine = (() => {

  // ── Helpers ──────────────────────────────────────────────────────────────

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  let _timerHandle = null;

  function startTimer(seconds, onTick, onDone) {
    stopTimer();
    let remaining = seconds;
    GameState.set({ timerSeconds: remaining });
    _timerHandle = setInterval(() => {
      remaining -= 1;
      GameState.set({ timerSeconds: remaining });
      if (onTick) onTick(remaining);
      if (remaining <= 0) {
        stopTimer();
        if (onDone) onDone();
      }
    }, 1000);
  }

  function stopTimer() {
    if (_timerHandle !== null) {
      clearInterval(_timerHandle);
      _timerHandle = null;
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────

  function startGame() {
    const n = ARTISTS.length;
    const order = shuffle(Array.from({ length: n }, (_, i) => i));
    const assignments = new Array(n).fill('real');

    if (n <= 1) {
      // Single-artist game: always fraud so there's something to find.
      assignments[0] = 'fraud';
    } else if (n <= 3) {
      // Short game: 1 fraud total in the first half.
      assignments[order[Math.floor(Math.random() * n)]] = 'fraud';
    } else {
      // Full game: 1 fraud in first half, 1 fraud in second half.
      const half = Math.floor(n / 2);
      assignments[order[Math.floor(Math.random() * half)]] = 'fraud';
      assignments[order[half + Math.floor(Math.random() * (n - half))]] = 'fraud';
    }

    _loadCase(0, order, assignments, { caseOrder: order, assignments, caseScores: [], round: 0 });
  }

  function _loadCase(globalIndex, order, assignments, gameExtra = {}) {
    const artistIndex = order[globalIndex];
    const artist      = ARTISTS[artistIndex];
    const role        = assignments[artistIndex];

    // One atomic set — ensures currentArtist is never null when briefing renders.
    GameState.set({
      ...gameExtra,
      phase: 'briefing',
      globalCaseIndex: globalIndex,
      round: gameExtra.round !== undefined ? gameExtra.round : (globalIndex < Math.floor(ARTISTS.length / 2) ? 0 : 1),
      currentArtist: artist,
      currentRole: role,
      questionsLeft: CONFIG.questionsPerCase,
      askedQuestions: [],
      lastAnswerIdx: -1,
      evidenceTray: [],
      activeDossierCard: 'bio',
      peel: { point: null, evidence: [], explain: '', link: '' },
      verdict: null,
      currentCaseScore: null,
      timerSeconds: CONFIG.investigateTime,
    });

    ChipRegistry.clear();
  }

  function startInvestigation() {
    GameState.set({ phase: 'investigation' });
    if (!CONFIG.practiceMode) {
      startTimer(CONFIG.investigateTime, null, moveToBuild);
    }
  }

  function moveToBuild() {
    stopTimer();
    GameState.set({ phase: 'build_case', timerSeconds: CONFIG.buildTime });
    if (!CONFIG.practiceMode) {
      startTimer(CONFIG.buildTime, null, proceedToVerdict);
    }
  }

  function proceedToVerdict() {
    stopTimer();
    GameState.set({ phase: 'verdict' });
  }

  function setActiveDossierCard(cardKey) {
    GameState.set({ activeDossierCard: cardKey });
  }

  function askQuestion(questionId) {
    const s = GameState.get();
    if (s.questionsLeft <= 0) return;
    if (s.askedQuestions.find(q => q.questionId === questionId)) return;

    const q = s.currentArtist.questions.find(q => q.id === questionId);
    if (!q) return;

    const isTell = s.currentRole === 'fraud'
      && s.currentArtist.fraudTells.some(t => t.questionId === questionId);

    let answer = q.trueAnswer;
    if (s.currentRole === 'fraud') {
      const tell = s.currentArtist.fraudTells.find(t => t.questionId === questionId);
      if (tell) answer = tell.fraudAnswer;
    }

    const asked = [...s.askedQuestions, { questionId, text: q.text, answer, value: q.value, isTell }];
    GameState.set({
      questionsLeft: s.questionsLeft - 1,
      askedQuestions: asked,
      lastAnswerIdx: asked.length - 1,
    });
  }

  function pinEvidence(chip) {
    const s = GameState.get();
    if (s.evidenceTray.find(c => c.id === chip.id)) return;
    GameState.set({ evidenceTray: [...s.evidenceTray, chip] });
  }

  function removeEvidence(chipId) {
    const s = GameState.get();
    GameState.set({
      evidenceTray: s.evidenceTray.filter(c => c.id !== chipId),
      peel: { ...s.peel, evidence: s.peel.evidence.filter(id => id !== chipId) },
    });
  }

  function setPeelPoint(point) {
    const s = GameState.get();
    GameState.set({ peel: { ...s.peel, point } });
  }

  function addEvidenceToPeel(chipId) {
    const s = GameState.get();
    if (s.peel.evidence.length >= CONFIG.maxEvidenceInPeel) return;
    if (s.peel.evidence.includes(chipId)) return;
    GameState.set({ peel: { ...s.peel, evidence: [...s.peel.evidence, chipId] } });
  }

  function removeEvidenceFromPeel(chipId) {
    const s = GameState.get();
    GameState.set({ peel: { ...s.peel, evidence: s.peel.evidence.filter(id => id !== chipId) } });
  }

  // Called just before stamping — reads live textarea values from the DOM.
  function submitVerdict(verdict) {
    const explainEl = document.getElementById('peel-explain');
    const linkEl    = document.getElementById('peel-link');
    const s = GameState.get();
    const peel = {
      ...s.peel,
      explain: explainEl ? explainEl.value : s.peel.explain,
      link:    linkEl    ? linkEl.value    : s.peel.link,
    };
    GameState.set({ verdict, peel });
    _score();
    GameState.set({ phase: 'feedback' });
  }

  function _score() {
    const s = GameState.get();
    const { currentArtist, currentRole, verdict, peel, askedQuestions, evidenceTray } = s;

    let score = 0;
    const breakdown = {};

    // 1. Correct verdict
    const verdictCorrect = verdict === currentRole;
    breakdown.verdict = verdictCorrect ? CONFIG.scoring.correctVerdict : 0;
    if (verdictCorrect) score += CONFIG.scoring.correctVerdict;

    // 2. Decisive evidence in PEEL
    let tellsCaught = 0;
    let confirmingCited = 0;
    for (const chipId of peel.evidence) {
      const chip = evidenceTray.find(c => c.id === chipId);
      if (!chip) continue;
      if (currentRole === 'fraud' && chip.isTell) {
        tellsCaught++;
      } else if (currentRole === 'real' && chip.source === 'interview') {
        confirmingCited++;
      }
    }
    const decisiveCount = currentRole === 'fraud' ? Math.min(tellsCaught, 2) : Math.min(confirmingCited, 2);
    const evidencePoints = decisiveCount * CONFIG.scoring.decisiveEvidence;
    score += evidencePoints;
    breakdown.evidence = evidencePoints;
    breakdown.tellsCaught = tellsCaught;

    // 3. PEEL complete
    const peelComplete = peel.point !== null
      && peel.evidence.length > 0
      && peel.explain.trim().length > 5
      && peel.link.trim().length > 5;
    if (peelComplete) score += CONFIG.scoring.peelComplete;
    breakdown.peelComplete = peelComplete;

    // 4. Question efficiency
    const highCount = askedQuestions.filter(q => q.value === 'high').length;
    const efficient = askedQuestions.length > 0 && (highCount / askedQuestions.length) >= 0.6;
    if (efficient) score += CONFIG.scoring.questionEfficiency;
    breakdown.efficiency = efficient;
    breakdown.highCount  = highCount;
    breakdown.totalAsked = askedQuestions.length;

    // Stars
    let stars = 0;
    if (verdictCorrect) stars = 1;
    if (verdictCorrect && decisiveCount >= 1) stars = 2;
    if (verdictCorrect && decisiveCount >= 2 && peelComplete) stars = 3;

    const caseScore = {
      score: Math.min(score, 100),
      stars,
      breakdown,
      verdictCorrect,
      tellsCaught,
      artistName: currentArtist.displayName,
      role: currentRole,
      verdict,
    };

    GameState.set({
      currentCaseScore: caseScore,
      caseScores: [...s.caseScores, caseScore],
    });
  }

  function nextCase() {
    stopTimer();
    const s = GameState.get();
    const nextIndex = s.globalCaseIndex + 1;
    const total = s.caseOrder.length;
    const half  = Math.floor(total / 2);

    if (nextIndex === half && total > half) {
      GameState.set({ phase: 'round_summary' });
      return;
    }
    if (nextIndex >= total) {
      GameState.set({ phase: 'game_end' });
      return;
    }
    _loadCase(nextIndex, s.caseOrder, s.assignments);
  }

  function startRound2() {
    const s = GameState.get();
    const half = Math.floor(s.caseOrder.length / 2);
    _loadCase(half, s.caseOrder, s.assignments);
  }

  function togglePracticeMode() {
    CONFIG.practiceMode = !CONFIG.practiceMode;
    // Re-render to show updated toggle (engine doesn't call UI directly;
    // the state subscriber in app.js does it).
    GameState.set({});  // empty update triggers re-render
  }

  return {
    startGame, startInvestigation, moveToBuild, proceedToVerdict,
    setActiveDossierCard,
    askQuestion, pinEvidence, removeEvidence,
    setPeelPoint, addEvidenceToPeel, removeEvidenceFromPeel,
    submitVerdict, nextCase, startRound2,
    togglePracticeMode, stopTimer,
  };
})();

// ── Chip Registry ──────────────────────────────────────────────────────────
// Stable IDs for drag-and-drop. Populated by UI when building the dossier
// and interview panels; looked up by the drop handlers.
const ChipRegistry = (() => {
  const _map = new Map();
  return {
    set(id, chip) { _map.set(id, chip); },
    get(id)       { return _map.get(id); },
    clear()       { _map.clear(); },
  };
})();
