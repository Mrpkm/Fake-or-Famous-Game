// All rendering lives here. Every function returns an HTML string.
// UI.render(state) wires everything together and writes to #game-root.

const UI = (() => {

  // ── Helpers ───────────────────────────────────────────────────────────────

  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function stars(n, max = 3) {
    let out = '';
    for (let i = 1; i <= max; i++) out += `<span class="star ${i <= n ? 'filled' : ''}">${i <= n ? '★' : '☆'}</span>`;
    return out;
  }

  function fmtTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function timerClass(sec) {
    if (sec <= 30) return 'timer-danger';
    if (sec <= 60) return 'timer-warn';
    return '';
  }

  // Registers a chip in ChipRegistry and returns its id + the draggable markup.
  function makeChip(id, chip, extraClass = '') {
    ChipRegistry.set(id, chip);
    return `<div class="chip ${extraClass}" draggable="true" data-drag-id="${esc(id)}" title="Drag to Evidence Tray or click Pin">
      <span class="chip-label">${esc(chip.label)}</span>
      <span class="chip-text">${esc(chip.text)}</span>
      <button class="chip-pin-btn" data-action="pinEvidence" data-chip-id="${esc(id)}" title="Pin to Evidence Tray">📌</button>
    </div>`;
  }

  function aiStatusText() {
    const r = AIClaimant.isReachable();
    if (r === true)  return '🟢 Connected — the claimant will answer live.';
    if (r === false) return "🔴 Can't reach the AI. Scripted answers will be used. Start Ollama and allow this site (set OLLAMA_ORIGINS).";
    return '⚪ Will check when you turn it on.';
  }

  // ── Phase: Start screen ───────────────────────────────────────────────────

  function renderStart() {
    return `
      <div class="screen start-screen">
        <div class="bureau-header">
          <div class="bureau-stamp">ART AUTHENTICATION BUREAU</div>
          <div class="bureau-sub">Department of Forgery Detection</div>
        </div>
        <div class="start-card paper">
          <h1 class="game-title">FAKE<span class="or">or</span>FAMOUS?</h1>
          <p class="start-blurb">
            A person is at your window claiming to be a famous artist.<br>
            Read their file. Ask sharp questions. Find the lie — if there is one.<br>
            Then stamp your verdict and back it with evidence.
          </p>
          <div class="start-rules">
            <div class="rule-item">📁 <strong>6 cases</strong> — 2 rounds of 3</div>
            <div class="rule-item">❓ <strong>5 questions</strong> per case — choose wisely</div>
            <div class="rule-item">📌 <strong>Pin evidence</strong> from the file or interview</div>
            <div class="rule-item">✍️ <strong>Build a PEEL argument</strong> then stamp REAL or FRAUD</div>
          </div>
          <div class="start-options">
            <label class="practice-toggle">
              <input type="checkbox" id="practice-check" ${CONFIG.practiceMode ? 'checked' : ''}
                onchange="CONFIG.practiceMode = this.checked"> No timers (Practice Mode)
            </label>
            <div class="ai-panel">
              <div class="ai-panel-title">🤖 AI Interview
                <span class="ai-sub">— local Qwen / Ollama, type your own questions</span></div>
              <div class="ai-row">
                <input type="text" id="ai-host" value="${esc(AIClaimant.getCfg().host)}"
                       placeholder="address (LAN: http://desktop-ip:11434 · remote: https://….trycloudflare.com)" autocomplete="off" />
              </div>
              <div class="ai-row">
                <input type="text" id="ai-key" value="${esc(AIClaimant.getCfg().key)}"
                       placeholder="access key (only for remote / proxy)" autocomplete="off" />
                <button class="btn-ai-connect" data-action="aiConnect">${AIClaimant.isOn() ? '🔄 Reconnect' : '🤖 Connect to AI'}</button>
                ${AIClaimant.isOn() ? '<button class="btn-ai-off" data-action="aiDisconnect">Turn off</button>' : ''}
              </div>
              <div class="ai-status">${aiStatusText()}</div>
              <div class="ai-help">Run the AI on your desktop with <code>game-ai.ps1</code>, then put the address it prints above and press Connect. Leave it off to use the built-in scripted answers.</div>
            </div>
          </div>
          <button class="btn-big btn-real" data-action="startGame">▶ Begin Authentication</button>
        </div>
      </div>`;
  }

  // ── Phase: Briefing ───────────────────────────────────────────────────────

  function renderBriefing(s) {
    const { currentArtist, round, globalCaseIndex } = s;
    if (!currentArtist) return '<div class="screen"><p style="color:#fff;padding:20px;">Loading…</p></div>';
    const caseNum = (globalCaseIndex % 3) + 1;
    return `
      <div class="screen briefing-screen">
        <div class="bureau-bar">
          <span class="bureau-tag">ART AUTHENTICATION BUREAU</span>
          <span>Round ${round + 1} · Case ${caseNum} of 3</span>
        </div>
        <div class="briefing-desk">
          <div class="briefing-window paper">
            <div class="window-portrait" style="background:${esc(currentArtist.portraitColor)}">
              <span class="portrait-letter">${esc(currentArtist.portrait)}</span>
            </div>
            <div class="window-claim">
              <p class="claim-text">"I am <strong>${esc(currentArtist.displayName)}</strong>.<br>Verify me."</p>
              <p class="claim-sub">Claimant awaiting authentication.</p>
            </div>
          </div>
          <div class="briefing-card paper">
            <div class="stamp-corner pending-stamp">CASE OPEN</div>
            <h2>Dossier File: <em>${esc(currentArtist.displayName)}</em></h2>
            <p>A person is claiming to be this artist. Your job is to decide whether their story
               matches what the real artist's life and work should look like.</p>
            <ul class="briefing-checklist">
              <li>📁 Read all 7 dossier cards carefully</li>
              <li>❓ Ask up to <strong>${CONFIG.questionsPerCase} questions</strong> — spend them wisely</li>
              <li>📌 Pin evidence chips from the file or interview answers</li>
              <li>✍️ Build your PEEL argument, then stamp your verdict</li>
            </ul>
            ${CONFIG.practiceMode ? '<div class="practice-badge">Practice Mode — No Timers</div>' : `<div class="time-notice">⏱ You will have ${fmtTime(CONFIG.investigateTime)} to investigate</div>`}
            <button class="btn-big btn-real" data-action="startInvestigation">📂 Open Dossier &amp; Begin</button>
          </div>
        </div>
      </div>`;
  }

  // ── Phase: Investigation ──────────────────────────────────────────────────

  // Register an interview answer as a draggable chip and return its id.
  function registerAnswerChip(artist, q) {
    const chipId = `interview_${artist.id}_${q.questionId}`;
    const chip = {
      id:       chipId,
      source:   'interview',
      cardType: 'interview',
      label:    `Answer: ${q.text.slice(0, 30)}…`,
      text:     q.answer,
      isTell:   q.isTell,
      questionId: q.questionId,
    };
    ChipRegistry.set(chipId, chip);
    return chipId;
  }

  function renderInvestigation(s) {
    const { currentArtist, questionsLeft, askedQuestions, lastAnswerIdx, evidenceTray, activeDossierCard, timerSeconds, globalCaseIndex, round } = s;
    const lastAnswer = lastAnswerIdx >= 0 ? askedQuestions[lastAnswerIdx] : null;
    const caseNum    = (globalCaseIndex % 3) + 1;

    // ── LEFT COLUMN ──────────────────────────────────────────────────────

    // Speech bubble for last answer
    let bubbleHtml = `<div class="pp-speech-bubble"><span class="pp-bubble-empty">Ask a question to begin the interview.</span></div>`;
    if (lastAnswer && lastAnswer.pending) {
      bubbleHtml = `
        <div class="pp-speech-bubble">
          <div class="pp-bubble-q">Q: ${esc(lastAnswer.text)}</div>
          <div class="pp-bubble-a pp-typing">…the claimant is thinking…</div>
        </div>`;
    } else if (lastAnswer) {
      const cid = registerAnswerChip(currentArtist, lastAnswer);
      const inTray = evidenceTray.find(c => c.id === cid);
      bubbleHtml = `
        <div class="pp-speech-bubble" draggable="true" data-drag-id="${esc(cid)}">
          <div class="pp-bubble-q">Q: ${esc(lastAnswer.text)}</div>
          <div class="pp-bubble-a">${esc(lastAnswer.answer)}</div>
          ${inTray
            ? `<span class="pp-bubble-pinned">▶ FILED</span>`
            : `<button class="pp-bubble-pin-btn" data-action="pinEvidence" data-chip-id="${esc(cid)}">▶ FILE AS EVIDENCE</button>`}
        </div>`;
    }

    // Asked-so-far list
    let askedListHtml = '';
    if (askedQuestions.length > 0) {
      askedListHtml = `
        <div class="pp-asked-scroll">
          <div class="pp-asked-title">Questioned (${askedQuestions.length}/${CONFIG.questionsPerCase})</div>
          ${askedQuestions.map((q, i) => {
            const cid = registerAnswerChip(currentArtist, q);
            const inTray = evidenceTray.find(c => c.id === cid);
            return `<div class="pp-asked-item ${i === lastAnswerIdx ? 'active-answer' : ''}"
                        data-action="viewAnswer" data-idx="${i}" title="${esc(q.answer)}">
              <span>${i + 1}. ${esc(q.text.length > 30 ? q.text.slice(0, 30) + '…' : q.text)}</span>
              ${inTray
                ? `<span class="pp-asked-pinned">▶</span>`
                : `<button class="pp-asked-pin-btn" data-action="pinEvidence" data-chip-id="${esc(cid)}" title="File this answer">▶</button>`}
            </div>`;
          }).join('')}
        </div>`;
    }

    // ── RIGHT COLUMN ─────────────────────────────────────────────────────

    // Dossier document content
    const dossierHtml = renderDossierCardPP(currentArtist, activeDossierCard);

    // Question buttons
    const questionsHtml = currentArtist.questions.map(q => {
      const asked = askedQuestions.find(a => a.questionId === q.id);
      return `<button class="pp-q-btn ${asked ? 'q-asked' : ''} ${q.value === 'high' ? 'pp-q-high' : 'pp-q-low'}"
                      data-action="askQuestion" data-question-id="${esc(q.id)}"
                      ${asked || questionsLeft <= 0 ? 'disabled' : ''}>
        ${asked ? '✓ ' : ''}${esc(q.text)}
      </button>`;
    }).join('');

    // Free-text AI question box (AI mode only)
    const aiOffline = AIClaimant.isReachable() === false;
    const aiAskHtml = AIClaimant.isOn() ? `
      <div class="pp-ai-ask">
        <input id="ai-free-input" class="pp-ai-input" type="text" autocomplete="off"
               placeholder="Type your own question for the claimant…" ${questionsLeft <= 0 ? 'disabled' : ''} />
        <button class="pp-ai-send" data-action="askFree" ${questionsLeft <= 0 ? 'disabled' : ''}>Ask ▶</button>
      </div>
      <div class="pp-ai-note">🤖 Live AI claimant — a typed question costs 1 ask.${
        aiOffline ? ' <span class="pp-ai-warn">AI offline — scripted answers in use.</span>' : ''}</div>
    ` : '';

    // Evidence tray chips
    const trayHtml = evidenceTray.length === 0
      ? `<div class="pp-tray-empty">No evidence filed yet</div>
         <div class="pp-tray-hint">Drag records or answers here — or click ▶ FILE</div>`
      : `<div class="pp-tray-chips">
          ${evidenceTray.map(chip => `
            <div class="pp-tray-chip" draggable="true" data-drag-id="${esc(chip.id)}">
              <span class="pp-tray-chip-label">${esc(chip.label)}</span>
              <span class="pp-tray-chip-text">${esc(chip.text.length > 65 ? chip.text.slice(0, 65) + '…' : chip.text)}</span>
              <button class="pp-tray-chip-remove" data-action="removeEvidence" data-chip-id="${esc(chip.id)}" title="Remove">✕</button>
            </div>`).join('')}
        </div>`;

    return `
      <div class="investigation-screen">

        <!-- Narrow top bar -->
        <div class="pp-topbar">
          <span class="bureau-tag">ART AUTHENTICATION BUREAU</span>
          <span style="letter-spacing:0.06em">ROUND ${round + 1} · CASE ${caseNum} · ${esc(currentArtist.displayName.toUpperCase())}</span>
          <span class="pp-timer-wrap">
            ${CONFIG.practiceMode
              ? '<span class="practice-badge">PRACTICE</span>'
              : `<span class="timer ${timerClass(timerSeconds)}">${fmtTime(timerSeconds)}</span>`}
            &nbsp;|&nbsp; Q: ${questionsLeft}/${CONFIG.questionsPerCase}
          </span>
          <button class="pp-done-btn" data-action="moveToBuild">DONE →</button>
        </div>

        <!-- Main desk surface -->
        <div class="pp-desk">

          <!-- ── LEFT: applicant window ── -->
          <div class="pp-window-col">

            <!-- The booth window -->
            <div class="pp-window-frame">
              <div class="pp-portrait-block" style="background:${esc(currentArtist.portraitColor)}">
                <span class="pp-portrait-letter">${esc(currentArtist.portrait)}</span>
              </div>
              <div class="pp-window-counter">
                <div class="pp-counter-grille">
                  ${Array(7).fill('<span></span>').join('')}
                </div>
              </div>
            </div>

            <!-- Claimant's claim + current answer -->
            <div class="pp-claimant-info">
              <p class="pp-claimant-says">"I am ${esc(currentArtist.displayName)}."</p>
              ${bubbleHtml}
            </div>

            <!-- Asked questions scroll list -->
            ${askedListHtml}

          </div><!-- /pp-window-col -->

          <!-- ── RIGHT: dossier document + bottom row ── -->
          <div class="pp-right-col">

            <!-- The dossier as a physical document -->
            <div class="pp-dossier-doc">
              <div class="pp-file-tabs">
                ${['bio','style','technique','palette','famousWork','message','quirk'].map(key =>
                  `<button class="pp-file-tab ${activeDossierCard === key ? 'active' : ''}"
                           data-action="dossierTab" data-card="${key}">${tabShort(key)}</button>`
                ).join('')}
              </div>
              ${dossierHtml}
            </div>

            <!-- Bottom strip: questions left | evidence right -->
            <div class="pp-bottom-row">

              <div class="pp-questions-panel">
                <div class="pp-panel-hdr">INTERVIEW — ${questionsLeft} question${questionsLeft !== 1 ? 's' : ''} remaining</div>
                <div class="pp-q-list">${questionsHtml}</div>
                ${aiAskHtml}
              </div>

              <div class="pp-evidence-tray-panel">
                <div class="pp-panel-hdr">EVIDENCE COLLECTED — drop or click ▶ FILE</div>
                <div class="pp-tray-dropzone" data-dropzone="evidence-tray">
                  ${trayHtml}
                </div>
              </div>

            </div><!-- /pp-bottom-row -->

          </div><!-- /pp-right-col -->

        </div><!-- /pp-desk -->

        <!-- Bottom action bar -->
        <div class="pp-action-bar">
          <button class="btn-big btn-real" data-action="moveToBuild">
            ✓ DONE INVESTIGATING — BUILD CASE →
          </button>
        </div>

      </div>`;
  }

  function tabShort(key) {
    return { bio:'BIO', style:'STYLE', technique:'TECH', palette:'PALETTE',
             famousWork:'WORK', message:'MESSAGE', quirk:'QUIRK' }[key] || key.toUpperCase();
  }

  function tabLabel(key) {
    return { bio:'ID / Bio', style:'Style', technique:'Technique',
             palette:'Palette', famousWork:'Famous Work', message:'Message', quirk:'Quirk' }[key] || key;
  }

  // Renders dossier card in Papers Please document style
  function renderDossierCardPP(artist, key) {
    const chipId = `dossier_${artist.id}_${key}`;
    let cardText = '';
    if (key === 'palette')     cardText = artist.palette.join(', ');
    else if (key === 'famousWork') cardText = `"${artist.famousWork.title}" (${artist.famousWork.year}) — ${artist.famousWork.note}`;
    else cardText = artist[key] || '';

    const chip = { id: chipId, source: 'dossier', cardType: key, label: tabLabel(key), text: cardText, isTell: false };
    ChipRegistry.set(chipId, chip);

    let extraHtml = '';
    if (key === 'palette') {
      extraHtml = `<div class="pp-palette-swatches">
        ${artist.palette.map(c => `<span class="pp-swatch" style="${swatchStyle(c)}">${esc(c)}</span>`).join('')}
      </div>`;
    }
    if (key === 'famousWork') {
      extraHtml = `<div class="pp-work-meta"><span class="pp-work-title">"${esc(artist.famousWork.title)}"</span><span class="pp-work-year">${artist.famousWork.year}</span></div>`;
    }

    return `
      <div class="pp-doc-hdr">
        <span>${esc(artist.displayName.toUpperCase())} — ${tabLabel(key).toUpperCase()}</span>
        <span class="pp-doc-hdr-stamp">OFFICIAL RECORD</span>
      </div>
      <div class="pp-doc-body" draggable="true" data-drag-id="${esc(chipId)}">
        <div class="pp-doc-portrait-box" style="background:${esc(artist.portraitColor)}">
          <span class="pp-doc-portrait-letter">${esc(artist.portrait)}</span>
        </div>
        <div class="pp-doc-content">
          <div class="pp-card-type-label">${tabLabel(key)}</div>
          ${extraHtml}
          <p class="pp-card-text">${esc(cardText)}</p>
        </div>
      </div>
      <div class="pp-doc-footer">
        <span class="pp-doc-drag-hint">DRAG RECORD OR CLICK ▶ TO FILE AS EVIDENCE</span>
        <button class="pp-pin-record-btn" data-action="pinEvidence" data-chip-id="${esc(chipId)}">▶ FILE</button>
      </div>`;
  }


  // Approximate CSS colour from a colour name
  function swatchStyle(name) {
    const map = {
      'vivid yellow':'#e8c547', 'deep blue':'#1a3a6b', 'bright orange':'#e8762e',
      'bright red':'#c0392b', 'deep teal':'#0d6b6b', 'warm gold':'#c9a227',
      'soft violet':'#9b59b6', 'pale green':'#a8d5a2', 'desert red':'#8b3a2a',
      'bone white':'#f0ead6', 'sage green':'#87a878', 'grey':'#808080',
      'brown':'#795548', 'black':'#1a1a1a', 'warm brown':'#795548',
      'soft gold':'#c9a227', 'deep shadow':'#2d2d2d',
    };
    const bg = map[name.toLowerCase()] || '#ccc';
    const isDark = ['deep blue','black','deep shadow','deep teal'].includes(name.toLowerCase());
    return `background:${bg};color:${isDark ? '#fff' : '#111'}`;
  }

  // ── Phase: Build Case ─────────────────────────────────────────────────────

  function renderBuildCase(s) {
    const { currentArtist, peel, evidenceTray, timerSeconds } = s;

    const peelChips = peel.evidence.map(id => evidenceTray.find(c => c.id === id)).filter(Boolean);

    // Build PEEL evidence slots (3 drop zones)
    function peelSlot(slotIdx) {
      const chip = peelChips[slotIdx];
      if (chip) {
        return `<div class="peel-slot filled">
          <span class="slot-chip-label">${esc(chip.label)}</span>
          <span class="slot-chip-text">${esc(chip.text.length > 60 ? chip.text.slice(0, 60) + '…' : chip.text)}</span>
          <button class="slot-remove" data-action="removeFromPeel" data-chip-id="${esc(chip.id)}" title="Remove">✕</button>
        </div>`;
      }
      return `<div class="peel-slot empty" data-dropzone="peel-slot">
        <span class="slot-hint">Drop evidence chip here</span>
      </div>`;
    }

    const trayForPEEL = evidenceTray.filter(c => !peel.evidence.includes(c.id));

    return `
      <div class="screen build-screen">

        <div class="bureau-bar">
          <span class="bureau-tag">CASE REPORT — Build Your Argument</span>
          ${CONFIG.practiceMode ? '<span class="practice-badge">Practice Mode</span>' :
            `<span class="timer ${timerClass(timerSeconds)}">⏱ ${fmtTime(timerSeconds)}</span>`}
        </div>

        <div class="build-desk">

          <!-- PEEL Clipboard -->
          <div class="peel-clipboard paper">
            <div class="clipboard-header">📋 PEEL Case Report — <em>${esc(currentArtist.displayName)}</em></div>

            <!-- P — Point -->
            <div class="peel-row">
              <div class="peel-letter">P</div>
              <div class="peel-body">
                <div class="peel-row-label">Point — State your verdict</div>
                <div class="peel-point-btns">
                  <button class="peel-verdict-btn ${peel.point === 'real' ? 'selected' : ''}"
                          data-action="setPeelPoint" data-point="real">✅ This is the REAL ${esc(currentArtist.displayName)}</button>
                  <button class="peel-verdict-btn fraud ${peel.point === 'fraud' ? 'selected' : ''}"
                          data-action="setPeelPoint" data-point="fraud">🚫 This is a FRAUD</button>
                </div>
              </div>
            </div>

            <!-- E — Evidence (3 slots) -->
            <div class="peel-row">
              <div class="peel-letter">E</div>
              <div class="peel-body">
                <div class="peel-row-label">Evidence — Drag chips from below (up to 3)</div>
                <div class="peel-evidence-slots">
                  ${peelSlot(0)}${peelSlot(1)}${peelSlot(2)}
                </div>
              </div>
            </div>

            <!-- E — Explain -->
            <div class="peel-row">
              <div class="peel-letter">E</div>
              <div class="peel-body">
                <div class="peel-row-label">Explain — Why does the evidence prove your point?</div>
                <div class="sentence-starters">
                  <span class="starter-label">Sentence starters:</span>
                  <button class="starter-btn" onclick="insertStarter('peel-explain','This matches because ')">This matches because…</button>
                  <button class="starter-btn" onclick="insertStarter('peel-explain','This does NOT match because ')">Does NOT match because…</button>
                  <button class="starter-btn" onclick="insertStarter('peel-explain','The file says ___ but this person said ')">File says… but person said…</button>
                </div>
                <textarea id="peel-explain" class="peel-textarea" placeholder="Write your explanation here…" rows="3">${esc(s.peel.explain)}</textarea>
              </div>
            </div>

            <!-- L — Link -->
            <div class="peel-row">
              <div class="peel-letter">L</div>
              <div class="peel-body">
                <div class="peel-row-label">Link — Restate your conclusion</div>
                <div class="sentence-starters">
                  <button class="starter-btn" onclick="insertStarter('peel-link','So I am sure this is ')">So I am sure this is…</button>
                  <button class="starter-btn" onclick="insertStarter('peel-link','Therefore, the evidence proves ')">Therefore, the evidence proves…</button>
                </div>
                <textarea id="peel-link" class="peel-textarea" placeholder="Write your linking sentence here…" rows="2">${esc(s.peel.link)}</textarea>
              </div>
            </div>

            <div class="peel-footer">
              <button class="btn-big btn-real" data-action="proceedToVerdict">Stamp Verdict →</button>
            </div>
          </div>

          <!-- Evidence reference panel -->
          <div class="evidence-reference paper">
            <div class="ref-title">Your Evidence Tray — drag chips to the slots above</div>
            ${evidenceTray.length === 0
              ? '<div class="ref-empty">No evidence was pinned during investigation.<br>You can still proceed to verdict.</div>'
              : `<div class="ref-chips">
                  ${evidenceTray.map(chip => {
                    const inPeel = peel.evidence.includes(chip.id);
                    return `<div class="ref-chip ${inPeel ? 'in-peel' : ''}"
                                 draggable="${!inPeel}"
                                 data-drag-id="${esc(chip.id)}"
                                 title="${esc(chip.text)}">
                      <span class="ref-chip-label">${esc(chip.label)}</span>
                      <span class="ref-chip-text">${esc(chip.text.length > 55 ? chip.text.slice(0, 55) + '…' : chip.text)}</span>
                      ${inPeel ? '<span class="in-peel-badge">in report</span>' : ''}
                    </div>`;
                  }).join('')}
                </div>`
            }
          </div>

        </div><!-- /build-desk -->
      </div>`;
  }

  // ── Phase: Verdict ────────────────────────────────────────────────────────

  function renderVerdict(s) {
    const { currentArtist, peel } = s;
    return `
      <div class="screen verdict-screen">
        <div class="bureau-bar"><span class="bureau-tag">STAMP YOUR VERDICT</span></div>
        <div class="verdict-desk">
          <div class="verdict-intro paper">
            <div class="claimant-portrait-sm" style="background:${esc(currentArtist.portraitColor)}">
              <span class="portrait-letter">${esc(currentArtist.portrait)}</span>
            </div>
            <div class="verdict-claim">
              <p>"I am <strong>${esc(currentArtist.displayName)}</strong>."</p>
              <p class="verdict-peel-summary">Your verdict: <strong>${peel.point ? (peel.point === 'real' ? 'REAL' : 'FRAUD') : 'not yet set in PEEL'}</strong></p>
              <p class="verdict-evidence-count">Evidence cited: ${peel.evidence.length} chip${peel.evidence.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div class="stamp-area">
            <p class="stamp-prompt">Make your final call. This cannot be undone.</p>
            <div class="stamps">
              <button class="stamp-btn stamp-real" data-action="submitVerdict" data-verdict="real">
                <div class="stamp-inner">
                  <div class="stamp-icon">✅</div>
                  <div class="stamp-word">REAL</div>
                  <div class="stamp-sub">Authenticated</div>
                </div>
              </button>
              <button class="stamp-btn stamp-fraud" data-action="submitVerdict" data-verdict="fraud">
                <div class="stamp-inner">
                  <div class="stamp-icon">🚫</div>
                  <div class="stamp-word">FRAUD</div>
                  <div class="stamp-sub">Forger!</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>`;
  }

  // ── Phase: Feedback ───────────────────────────────────────────────────────

  function renderFeedback(s) {
    const { currentArtist, currentRole, verdict, currentCaseScore, peel, askedQuestions, evidenceTray } = s;

    if (!currentCaseScore) return '<div class="screen"><p>Loading…</p></div>';

    const { score, stars: starCount, breakdown, verdictCorrect, tellsCaught } = currentCaseScore;
    const isCorrect = verdictCorrect;

    // Determine main feedback line
    let feedbackLine = '';
    if (!isCorrect && verdict === 'fraud') feedbackLine = currentArtist.feedback.falseAccuse;
    else if (!isCorrect && verdict === 'real') feedbackLine = `You let a forger through! ${currentArtist.feedback.missedTell}`;
    else if (isCorrect && currentRole === 'fraud' && tellsCaught > 0) feedbackLine = currentArtist.feedback.caughtTell;
    else if (isCorrect && currentRole === 'fraud' && tellsCaught === 0) feedbackLine = `Right call, but the tell was missed. ${currentArtist.feedback.missedTell}`;
    else feedbackLine = currentArtist.feedback.realCorrect;

    // Show what the tells actually were (for fraud cases)
    let tellsSection = '';
    if (currentRole === 'fraud') {
      tellsSection = `
        <div class="tells-reveal">
          <div class="tells-title">The planted lies (tells) were:</div>
          ${currentArtist.fraudTells.map(tell => {
            const q = currentArtist.questions.find(q => q.id === tell.questionId);
            return `<div class="tell-item">
              <span class="tell-q">Q: ${esc(q ? q.text : tell.questionId)}</span>
              <span class="tell-answer">They said: "${esc(tell.fraudAnswer)}"</span>
              <span class="tell-truth">True answer: "${esc(q ? q.trueAnswer : '?')}"</span>
            </div>`;
          }).join('')}
        </div>`;
    }

    // Efficiency feedback
    let effTip = '';
    if (!breakdown.efficiency && breakdown.totalAsked > 0) {
      effTip = `<div class="eff-tip">💡 Tip: ${breakdown.highCount} of your ${breakdown.totalAsked} questions were high-value. Asking about specific techniques or habits makes liars slip up.</div>`;
    }

    return `
      <div class="screen feedback-screen">
        <div class="bureau-bar">
          <span class="bureau-tag">CASE CLOSED — Verdict: ${verdict.toUpperCase()}</span>
          <span class="${isCorrect ? 'result-correct' : 'result-incorrect'}">${isCorrect ? '✅ CORRECT' : '❌ INCORRECT'}</span>
        </div>

        <div class="feedback-desk">

          <div class="feedback-main paper">
            <div class="feedback-header">
              <div class="claimant-portrait-sm" style="background:${esc(currentArtist.portraitColor)}">
                <span class="portrait-letter">${esc(currentArtist.portrait)}</span>
              </div>
              <div class="feedback-headline">
                <div class="reveal-line">
                  ${isCorrect
                    ? `<span class="correct-label">✅ Correct!</span> This ${currentRole === 'fraud' ? 'WAS a FORGER' : 'really WAS ' + esc(currentArtist.displayName)}.`
                    : `<span class="incorrect-label">❌ Incorrect.</span> This ${currentRole === 'fraud' ? 'WAS a FORGER but you let them through.' : 'really WAS ' + esc(currentArtist.displayName) + ' but you called fraud.'}`
                  }
                </div>
                <div class="stars-display">${stars(starCount)}</div>
              </div>
            </div>

            <div class="feedback-message">${esc(feedbackLine)}</div>

            ${tellsSection}
            ${effTip}

            <div class="score-breakdown">
              <div class="breakdown-title">Score Breakdown</div>
              <div class="breakdown-row">
                <span>Correct verdict</span>
                <span>${breakdown.verdict} / ${CONFIG.scoring.correctVerdict}</span>
              </div>
              <div class="breakdown-row">
                <span>Decisive evidence cited</span>
                <span>${breakdown.evidence} / ${CONFIG.scoring.decisiveEvidence * 2}</span>
              </div>
              <div class="breakdown-row">
                <span>PEEL argument complete</span>
                <span>${breakdown.peelComplete ? CONFIG.scoring.peelComplete : 0} / ${CONFIG.scoring.peelComplete}</span>
              </div>
              <div class="breakdown-row">
                <span>Question efficiency (≥60% high-value)</span>
                <span>${breakdown.efficiency ? CONFIG.scoring.questionEfficiency : 0} / ${CONFIG.scoring.questionEfficiency}</span>
              </div>
              <div class="breakdown-total">
                <span>Case Total</span>
                <span>${score} / 100</span>
              </div>
            </div>
          </div>

          <!-- PEEL recap -->
          <div class="peel-recap paper">
            <div class="recap-title">Your PEEL Argument</div>
            <div class="recap-row"><span class="recap-letter">P</span><span>${peel.point ? (peel.point === 'real' ? 'REAL — Authenticated' : 'FRAUD — Forger!') : '(not set)'}</span></div>
            <div class="recap-row">
              <span class="recap-letter">E</span>
              <div>
                ${peel.evidence.length === 0 ? '<em>(no evidence cited)</em>' :
                  peel.evidence.map(id => {
                    const c = evidenceTray.find(c => c.id === id);
                    return c ? `<div class="recap-chip ${c.isTell ? 'is-tell' : ''}">${esc(c.label)}: ${esc(c.text.slice(0, 60))}${c.isTell ? ' ✓ TELL' : ''}</div>` : '';
                  }).join('')}
              </div>
            </div>
            <div class="recap-row"><span class="recap-letter">E</span><span class="recap-text">${peel.explain ? esc(peel.explain) : '<em>(blank)</em>'}</span></div>
            <div class="recap-row"><span class="recap-letter">L</span><span class="recap-text">${peel.link ? esc(peel.link) : '<em>(blank)</em>'}</span></div>
          </div>

        </div><!-- /feedback-desk -->

        <div class="feedback-footer">
          <button class="btn-big btn-real" data-action="nextCase">
            ${s.globalCaseIndex >= 5 ? '📊 See Final Results' : s.globalCaseIndex === 2 ? '📊 End of Round 1 →' : '→ Next Case'}
          </button>
        </div>
      </div>`;
  }

  // ── Phase: Round Summary ──────────────────────────────────────────────────

  function renderRoundSummary(s) {
    const round1Scores = s.caseScores.slice(0, 3);
    const totalScore   = round1Scores.reduce((a, c) => a + c.score, 0);
    const totalStars   = round1Scores.reduce((a, c) => a + c.stars, 0);

    return `
      <div class="screen summary-screen">
        <div class="bureau-bar"><span class="bureau-tag">ROUND 1 COMPLETE</span></div>
        <div class="summary-card paper">
          <h2>Round 1 Summary</h2>
          <div class="summary-cases">
            ${round1Scores.map((cs, i) => `
              <div class="summary-case-row ${cs.verdictCorrect ? 'correct' : 'incorrect'}">
                <span class="sc-num">Case ${i + 1}</span>
                <span class="sc-name">${esc(cs.artistName)}</span>
                <span class="sc-role">${cs.role.toUpperCase()}</span>
                <span class="sc-verdict">${cs.verdictCorrect ? '✅' : '❌'} called ${cs.verdict.toUpperCase()}</span>
                <span class="sc-stars">${stars(cs.stars)}</span>
                <span class="sc-score">${cs.score} pts</span>
              </div>`
            ).join('')}
          </div>
          <div class="summary-total">Round 1 Total: <strong>${totalScore}</strong> pts · ${stars(totalStars, 9)}</div>
          <button class="btn-big btn-real" data-action="startRound2">→ Begin Round 2</button>
        </div>
      </div>`;
  }

  // ── Phase: Game End ───────────────────────────────────────────────────────

  function renderGameEnd(s) {
    const all        = s.caseScores;
    const totalScore = all.reduce((a, c) => a + c.score, 0);
    const totalStars = all.reduce((a, c) => a + c.stars, 0);
    const rank       = CONFIG.ranks.slice().reverse().find(r => totalStars >= r.minStars) || CONFIG.ranks[0];

    return `
      <div class="screen end-screen">
        <div class="bureau-bar"><span class="bureau-tag">AUTHENTICATION COMPLETE — ALL 6 CASES CLOSED</span></div>
        <div class="end-card paper">
          <div class="rank-badge">${esc(rank.name)}</div>
          <div class="final-stars">${stars(totalStars, 18)}</div>
          <div class="final-score">${totalScore} / 600 points</div>

          <div class="all-cases">
            <table class="cases-table">
              <thead><tr><th>#</th><th>Artist</th><th>True Role</th><th>Your Call</th><th>Stars</th><th>Score</th></tr></thead>
              <tbody>
                ${all.map((cs, i) => `
                  <tr class="${cs.verdictCorrect ? 'row-correct' : 'row-incorrect'}">
                    <td>${i + 1}</td>
                    <td>${esc(cs.artistName)}</td>
                    <td><span class="role-badge ${cs.role}">${cs.role.toUpperCase()}</span></td>
                    <td>${cs.verdictCorrect ? '✅' : '❌'} ${cs.verdict.toUpperCase()}</td>
                    <td>${stars(cs.stars)}</td>
                    <td>${cs.score}</td>
                  </tr>`
                ).join('')}
              </tbody>
            </table>
          </div>

          <button class="btn-big btn-real" data-action="startGame">↺ Play Again</button>
        </div>
      </div>`;
  }

  // ── Main render dispatcher ────────────────────────────────────────────────

  function render(state) {
    // Preserve textarea values across re-renders to avoid losing user typing.
    const explainVal = document.getElementById('peel-explain')?.value ?? '';
    const linkVal    = document.getElementById('peel-link')?.value ?? '';
    const aiInputVal = document.getElementById('ai-free-input')?.value ?? '';

    let html = '';
    switch (state.phase) {
      case 'start':          html = renderStart();              break;
      case 'briefing':       html = renderBriefing(state);      break;
      case 'investigation':  html = renderInvestigation(state); break;
      case 'build_case':     html = renderBuildCase(state);     break;
      case 'verdict':        html = renderVerdict(state);       break;
      case 'feedback':       html = renderFeedback(state);      break;
      case 'round_summary':  html = renderRoundSummary(state);  break;
      case 'game_end':       html = renderGameEnd(state);       break;
      default:               html = `<p>Unknown phase: ${state.phase}</p>`;
    }

    document.getElementById('game-root').innerHTML = html;

    // Restore textarea values (only relevant in build_case phase).
    const explainEl = document.getElementById('peel-explain');
    const linkEl    = document.getElementById('peel-link');
    if (explainEl && explainVal) explainEl.value = explainVal;
    if (linkEl    && linkVal)    linkEl.value    = linkVal;
    const aiEl = document.getElementById('ai-free-input');
    if (aiEl && aiInputVal) aiEl.value = aiInputVal;
  }

  return { render };
})();

// ── Global helper for sentence-starter buttons ────────────────────────────
// These fire inline from onclick= so they must be global.
function insertStarter(textareaId, text) {
  const el = document.getElementById(textareaId);
  if (!el) return;
  el.value = el.value ? el.value + ' ' + text : text;
  el.focus();
}
