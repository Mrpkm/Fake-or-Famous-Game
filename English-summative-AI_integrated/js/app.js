// Entry point: event delegation + action dispatcher + drag-and-drop wiring.

// ── Drag-and-drop ─────────────────────────────────────────────────────────
// Draggable elements carry  data-drag-id="<chipId>"
// Drop zones carry          data-dropzone="<zone>"   (evidence-tray | peel-slot)

let _draggingId = null;

function _onDragStart(e) {
  const el = e.target.closest('[data-drag-id]');
  if (!el) return;
  _draggingId = el.dataset.dragId;
  e.dataTransfer.setData('text/plain', _draggingId);
  e.dataTransfer.effectAllowed = 'copy';
  el.classList.add('dragging');
}

function _onDragEnd(e) {
  _draggingId = null;
  document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
}

function _onDragOver(e) {
  const zone = e.target.closest('[data-dropzone]');
  if (!zone) return;
  e.preventDefault();
  zone.classList.add('drag-over');
}

function _onDragLeave(e) {
  const zone = e.target.closest('[data-dropzone]');
  if (!zone) return;
  // Only remove highlight when leaving the zone entirely (not entering a child)
  if (!zone.contains(e.relatedTarget)) {
    zone.classList.remove('drag-over');
  }
}

function _onDrop(e) {
  const zone = e.target.closest('[data-dropzone]');
  if (!zone) return;
  e.preventDefault();
  zone.classList.remove('drag-over');

  const chipId = e.dataTransfer.getData('text/plain');
  if (!chipId) return;

  const dropzone = zone.dataset.dropzone;

  if (dropzone === 'evidence-tray') {
    const chip = ChipRegistry.get(chipId);
    if (chip) Engine.pinEvidence(chip);
  } else if (dropzone === 'peel-slot') {
    Engine.addEvidenceToPeel(chipId);
  }
}

// ── Click dispatcher ─────────────────────────────────────────────────────
function _onClick(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;

  const action = btn.dataset.action;
  const p = btn.dataset;   // all data-* become params

  switch (action) {
    case 'startGame':           Engine.startGame();                          break;
    case 'startInvestigation':  Engine.startInvestigation();                 break;
    case 'dossierTab':          Engine.setActiveDossierCard(p.card);        break;
    case 'askQuestion':         Engine.askQuestion(p.questionId);           break;
    case 'askFree': {
      const el = document.getElementById('ai-free-input');
      const t = el ? el.value : '';
      if (el) el.value = '';
      Engine.askFreeText(t);
      break;
    }
    case 'aiConnect': {
      const el = document.getElementById('ai-host');
      if (el) AIClaimant.setHost(el.value);
      GameState.set({});       // reflect the host immediately
      AIClaimant.connect();    // async ping + enable; re-renders when done
      break;
    }
    case 'aiDisconnect':        AIClaimant.setEnabled(false); GameState.set({}); break;
    case 'pinEvidence': {
      const chip = ChipRegistry.get(p.chipId);
      if (chip) Engine.pinEvidence(chip);
      break;
    }
    case 'removeEvidence':      Engine.removeEvidence(p.chipId);            break;
    case 'moveToBuild':         Engine.moveToBuild();                       break;
    case 'proceedToVerdict':    Engine.proceedToVerdict();                  break;
    case 'setPeelPoint':        Engine.setPeelPoint(p.point);              break;
    case 'removeFromPeel':      Engine.removeEvidenceFromPeel(p.chipId);   break;
    case 'submitVerdict':       Engine.submitVerdict(p.verdict);            break;
    case 'nextCase':            Engine.nextCase();                          break;
    case 'startRound2':         Engine.startRound2();                       break;
    case 'togglePractice':      Engine.togglePracticeMode();                break;
    case 'viewAnswer': {
      const idx = parseInt(p.idx, 10);
      GameState.set({ lastAnswerIdx: idx });
      break;
    }
  }
}

// ── Keyboard: Enter sends the free-text AI question ───────────────────────
function _onKeydown(e) {
  if (e.key === 'Enter' && e.target && e.target.id === 'ai-free-input') {
    e.preventDefault();
    const t = e.target.value;
    e.target.value = '';
    Engine.askFreeText(t);
  }
}

// ── Init ─────────────────────────────────────────────────────────────────
function _initApp() {
  const root = document.getElementById('game-root');
  if (!root) return;

  root.addEventListener('click',     _onClick);
  root.addEventListener('keydown',   _onKeydown);
  root.addEventListener('dragstart', _onDragStart);
  root.addEventListener('dragend',   _onDragEnd);
  root.addEventListener('dragover',  _onDragOver);
  root.addEventListener('dragleave', _onDragLeave);
  root.addEventListener('drop',      _onDrop);

  // Re-render whenever state changes.
  GameState.subscribe(state => UI.render(state));

  // Show the start screen.
  GameState.set({ phase: 'start' });
}

// Works whether DOMContentLoaded has already fired (dynamic script load) or not.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _initApp);
} else {
  _initApp();
}
