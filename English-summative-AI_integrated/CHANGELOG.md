# Fake or Famous? — Changelog & Progress Tracker

---

## v0.1.0 — Prototype (current)
*Date: 2026-06-03*

### ✅ Implemented

#### Core game loop
- [x] All 7 game phases: Start → Briefing → Investigation → Build Case → Verdict → Feedback → Round Summary → Game End
- [x] State machine with full phase transitions
- [x] Randomised role assignment (1 fraud per round, 2 total per full game)
- [x] Shuffled case order for replayability

#### Artist data
- [x] All 6 artists fully authored (Van Gogh, Frida Kahlo, Monet, Picasso, Georgia O'Keeffe, Leonardo da Vinci)
- [x] 7 interview questions per artist (4–5 high-value, 2–3 low-value)
- [x] True answer banks and fraud answer banks (3 tells per artist)
- [x] Feedback lines for all 4 outcomes (caught tell, missed tell, real correct, false accuse)

#### Dossier panel
- [x] All 7 card types: Bio, Style, Technique, Palette, Famous Work, Message, Quirk
- [x] Tab navigation between cards
- [x] Colour swatches for Palette card
- [x] Each card is draggable to the Evidence Tray
- [x] 📌 Pin button as alternative to drag

#### Interview system
- [x] Question menu with 5-question budget
- [x] Questions marked high-value (◆) vs low-value (◇)
- [x] Answers served from true or fraud bank based on assigned role
- [x] Speech bubble shows last answer; click past answers to review
- [x] Asked questions cannot be asked again

#### Drag-and-drop (the Papers Please mechanic)
- [x] Drag dossier cards → Evidence Tray
- [x] Drag interview answer chips → Evidence Tray
- [x] Drag Evidence Tray chips → PEEL Evidence slots (build case phase)
- [x] Visual drag-over highlight on all drop zones
- [x] dragging opacity feedback on the dragged element
- [x] Click 📌 as non-drag fallback for all draggable items

#### Evidence Tray
- [x] Chips pinned from dossier or interview
- [x] Remove chips (✕ button)
- [x] Chips persist through build case phase
- [x] Chips referenced by stable IDs via ChipRegistry

#### PEEL Builder
- [x] P slot: REAL / FRAUD point buttons
- [x] E slots: 3 drop zones accepting tray chips; filled chips show label + truncated text
- [x] E textarea: free-text explain with sentence-starter buttons
- [x] L textarea: linking sentence with starter buttons
- [x] Evidence reference panel shows all tray chips for dragging
- [x] Textarea values preserved across re-renders (no lost typing)

#### Verdict stamps
- [x] Two large REAL / FRAUD stamp buttons (Papers Please style)
- [x] Reads live textarea values at stamp time (no stale state)

#### Scoring (rules-based, no AI)
- [x] +50 correct verdict
- [x] +15 per decisive evidence chip (max 2 = 30 pts)
  - Fraud case: chip must reference a tell question
  - Real case: chip must be from an interview answer
- [x] +10 PEEL complete (all 4 slots filled)
- [x] +10 question efficiency (≥60% questions were high-value)
- [x] 1–3 star rating per case; total stars determine end rank

#### Feedback screen
- [x] Reveals true role (REAL / FRAUD)
- [x] Shows all planted tells with true vs fraud answer comparison
- [x] Personalised feedback line (4 outcomes × per artist)
- [x] Question efficiency tip if most questions were low-value
- [x] Full score breakdown table
- [x] PEEL argument recap with tell-chip highlighting

#### Summaries
- [x] Round 1 Summary after case 3
- [x] Game End screen with full 6-case table + Detective Rank
- [x] Rank system: Rookie → Junior Detective → Inspector → Master Authenticator

#### UX / Accessibility
- [x] Practice Mode (no timers) — toggle on start screen
- [x] Countdown timers with colour warnings (yellow at 1 min, red + blink at 30 sec)
- [x] Responsive layout guard for narrow screens (stacks columns)
- [x] Desk aesthetic: dark wood background, paper-coloured cards, stamp/bureau typography

---

## 🔲 Still Needed (next steps)

### Priority 1 — Finish the prototype experience
- [ ] **Pixel art portrait sprites** — replace letter-block placeholders with actual sprites
- [ ] **Stamp animation** — CSS keyframe "slam down" effect on verdict stamps
- [ ] **Sound effects** — stamp *thunk*, paper shuffle, timer tick (Web Audio API, no external lib needed)
- [ ] **Transition animations** — fade/slide between phases for desk feel

### Priority 2 — Polish & content
- [ ] **Dossier card illustrations** — small images for Famous Work cards (even pixel thumbnails)
- [ ] **Palette swatch improvements** — better colour mapping for more artist palettes
- [ ] **More questions per artist** — currently 7 per artist; aim for 9–10 so the 5-pick budget feels more like a real choice
- [ ] **Question value feedback during play** — currently hidden until end; consider showing subtle hints
- [ ] **Hint system** — one "magnifying glass" hint per case (re-reads most relevant card, never names the answer)

### Priority 3 — Teacher features
- [ ] **Timer preset selector** — easy toggle between Default (7/3 min), Gentle (10/4 min), No Timer
- [ ] **Read-aloud button** — Web Speech API text-to-speech for card content (accessibility for younger players)
- [ ] **Classroom mode** — projector-friendly layout (larger text, simplified UI)
- [ ] **Session summary export** — print/save the 6-case record as a PDF or text

### Priority 4 — Future upgrades (from the ruleset's §17)
- [ ] **AI Claimant mode** — free-text interview powered by Claude API, replacing the question menu
- [ ] **AI Judge mode** — LLM grades the Explain box against a rubric instead of rules-based scoring
- [ ] **Additional artist roster** — beyond the 6 in the prototype (Hokusai, Basquiat, Warhol, Vermeer…)
- [ ] **Difficulty levels** — Easy (4 questions, 2 tells), Medium (5/3), Hard (5/3 + timer pressure)

---

## File Map

```
index.html          ← entry point, loads scripts in order
css/
  style.css         ← all styles (desk aesthetic, DnD visuals, responsive)
js/
  data.js           ← 6 artist profiles (true + fraud banks + feedback)
  config.js         ← timer durations, scoring constants, rank thresholds
  state.js          ← observable state store (subscribe/set/get)
  engine.js         ← game logic: setup, phase transitions, scoring
  ui.js             ← all rendering (returns HTML strings, writes to #game-root)
  app.js            ← event delegation, drag-and-drop wiring, init
```

---

## How to run
1. Open this folder in **VS Code**
2. Install the **Live Server** extension (if not already installed)
3. Right-click `index.html` → **Open with Live Server**
4. Game runs at `http://127.0.0.1:5500`

*(Plain `file://` protocol blocks script loading in some browsers — always use a local server.)*
