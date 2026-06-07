# AI Integration — Technical Handoff

> For the next Claude instance tasked with **expanding the AI capabilities** of the
> "Fake or Famous? / Art Authentication Bureau" game. This documents the exact
> current state, how the AI is wired, what was tried, the hard constraints, and
> the best places to extend. Read this fully before changing anything.

_Last updated: 2026-06-08. Current branch HEAD: `ecf8a54` (a revert state — see §9)._

---

## 1. What the project is
A **static** browser game (an English summative, ages 8–11): you're a detective at
the "Art Authentication Bureau" deciding if the person at your window is the real
artist or a forger. Pure HTML/CSS/JS — **no build step, no framework**. The
"AI integration" is an *optional* layer that replaces/augments the scripted
interview with a live local LLM role-playing the claimant.

- **GitHub repo:** https://github.com/Mrpkm/Fake-or-Famous-Game.git (branch `main`)
- **Live site:** https://mrpkm.github.io/Fake-or-Famous-Game/
- **Local working clone (this machine):** `d:\AI experiment\tmp\_faf_inspect`
  (a temp/inspection dir — prefer `git clone` fresh to a stable path; everything is on `main`).

---

## 2. Repo layout
```
.github/workflows/deploy.yml      # GitHub Actions -> Pages deploy
.gitignore                        # ignores .game-ai-key, cloudflared.exe, __pycache__
AI_HANDOFF.md                     # this file
English-summative-AI_integrated/  # THE GAME (published as the Pages site root)
  Art Authentication Bureau.html  # self-contained bundle = the real entry (see §4)
  index.html                      # redirect -> the bundle
  css/style.css                   # Papers-Please vintage theme (CSS variables)
  js/config.js                    # tunable settings (timers, scoring, ranks)
  js/state.js                     # GameState observable store
  js/data.js                      # the 6 artists (dossier/questions/fraudTells/feedback)
  js/engine.js                    # game logic, scoring, AI question routing
  js/ui.js                        # ALL rendering (returns HTML strings)
  js/app.js                       # event delegation + action dispatch
  js/ai.js                        # ===> THE AI CLIENT (expand here)
  Fake-or-Famous_Game-Ruleset.md  # full game design doc (§17 = AI Mode spec)
  CHANGELOG.md, README.md, test.md
game-ai-proxy.py                  # desktop: keyed CORS gateway in front of Ollama
start.ps1                         # desktop: ONE-command launcher (run from GitHub)
play-ai.cmd                       # desktop: double-click -> runs start.ps1
game-ai.ps1                       # desktop: same-Wi-Fi variant (serves game over http)
game-ai-remote.ps1               # desktop: any-network variant (from a clone)
```

---

## 3. Deployment (already set up; auto-runs)
- **Pages source = GitHub Actions** (configured via API; not "deploy from branch").
- `.github/workflows/deploy.yml` copies `English-summative-AI_integrated/` to the
  site root and sets `index.html` = the bundle, so the clean URL serves the game.
- **Every push to `main` auto-deploys.** To watch/trigger manually:
  - `gh` CLI is installed at `C:\Program Files\GitHub CLI\gh.exe`.
  - Auth: NO `gh auth login` (token lacks `read:org`). Instead pull the token from
    Git's credential helper and use `GH_TOKEN`:
    ```bash
    export GH_TOKEN=$(printf 'protocol=https\nhost=github.com\n\n' | git credential fill 2>/dev/null | sed -n 's/^password=//p')
    "/c/Program Files/GitHub CLI/gh.exe" run watch <id> -R Mrpkm/Fake-or-Famous-Game --exit-status
    ```
  - `git push` works directly (credentials cached in Windows Credential Manager).

---

## 4. The bundle gotcha (IMPORTANT)
`Art Authentication Bureau.html` is a **self-contained single-file export**: it
embeds fonts/images as gzip+base64 blobs, BUT it loads the game's own scripts at
runtime by relative path via `loadScriptsInOrder([...])` near the bottom of the
file. **If you add a new `js/*.js`, you MUST add it to that array** (and it must
load before whatever uses it). Current order:
`js/config.js, js/state.js, js/ai.js, js/engine.js, js/ui.js, js/app.js`
(`js/data.js` is inlined into the bundle, so editing `js/data.js` alone won't
change the bundle's artist data — the bundle has its own copy; keep them in sync).
`css/style.css` is also loaded from disk by the bundle, so CSS edits apply.

---

## 5. Game architecture (how rendering works)
- `GameState` (state.js) is a tiny observable: `.get()`, `.set(patch)`, `.subscribe(fn)`.
- `app.js` subscribes once and calls `UI.render(state)` on every change.
- `UI.render` switches on `state.phase` (`start | briefing | investigation |
  build_case | verdict | feedback | round_summary | game_end`) and **replaces
  `#game-root.innerHTML` wholesale**. So: no virtual DOM; any transient input
  value must be re-read/restored on re-render (see how `peel-explain` and
  `ai-free-input` values are preserved in `render()`).
- Interactions are **event-delegated**: elements carry `data-action="..."`;
  `app.js _onClick` dispatches to `Engine.*`. Drag-and-drop uses `data-drag-id` /
  `data-dropzone`; chips live in `ChipRegistry`.
- Artist shape (data.js): `{id, displayName, portrait, portraitColor, bio, style,
  technique, palette[], famousWork{title,year,note}, message, quirk,
  questions[{id,text,value:'high'|'low',trueAnswer}], fraudTells[{questionId,fraudAnswer}],
  feedback{caughtTell,missedTell,realCorrect,falseAccuse}}`.
- Each playthrough randomly casts 2 of 6 artists as `fraud`; a fraud serves
  `fraudAnswer` for its 2–3 tell questions, `trueAnswer` otherwise.

---

## 6. The AI client — `js/ai.js` (THE expansion point)
`AIClaimant` IIFE, returns: `isOn, isReachable, getCfg, setModel, setHost, setKey,
setEnabled, connect, ping, ask`.

- **Config** `cfg = {enabled:false, host:defaultHost(), model:'llama3.2:3b', key:''}`,
  persisted to `localStorage['faf_ai_cfg']`.
  - `defaultHost()`: if the page is served over **http from a LAN host** (not
    github.io, not localhost), defaults host to `http://<that-host>:11434` (so
    same-network laptop play needs no typing). Otherwise `http://127.0.0.1:11434`.
  - **URL auto-connect:** `?aihost=<url>&aikey=<key>` pre-fills host/key and sets
    `enabled=true`. This is how launcher links work.
- **Transport:** Ollama-native HTTP.
  - Ping: `GET {host}/api/tags`.
  - Chat: `POST {host}/api/chat` with
    `{model, stream:false, messages, options:{temperature:0.7, num_predict:200}}`.
  - If `cfg.key` set, adds header `X-Game-Key: <key>` (for the proxy).
- **Prompting:** `systemPrompt(artist, role)` builds the role-play:
  - REAL → "you ARE the artist, answer truthfully per these facts" + full dossier.
  - FRAUD → "you are a FORGER, stick to THESE false claims (the `fraudAnswer`s)
    when their topic comes up, truthful otherwise, never admit it" + dossier.
  - `ask({artist, role, question, canon})`: `canon` (optional) is the scripted
    answer for a menu question — the model is told to paraphrase it in character so
    it stays consistent with scoring. Returns a string; `stripThink()` removes any
    `<think>…</think>`.
- **STATELESS:** each `ask()` sends only `[system, user]` — **no conversation
  history**. Multi-turn coherence is an obvious upgrade (pass prior Q&A as messages).

### Engine wiring (`js/engine.js`)
- `askQuestion(id)` (scripted buttons): if `AIClaimant.isOn()` → append a `pending`
  turn, `await AIClaimant.ask({...canon})`, then `_resolveAnswer`; on error falls
  back to `canon` (the scripted answer). `isTell` is computed from `fraudTells`.
- `askFreeText(text)` (typed box): AI-only; `value:'free'`, `isTell:false`.
- `_appendAnswer` spends one question from the budget; `_resolveAnswer` fills it in.
- Scoring (`_score`): correct verdict 50, decisive evidence 15×(≤2), PEEL 10,
  question-efficiency 10. **Only `value:'high'|'low'` questions count toward
  efficiency** (free-text excluded). **Decisive "tells" are only credited for
  chips with `isTell:true`, which today only the scripted questions produce** —
  free-text AI answers can't be scored as decisive. (Upgrade target.)

### UI wiring (`js/ui.js`, `js/app.js`)
- Start screen (`renderStart`) has the AI panel: host input (`#ai-host`), key input
  (`#ai-key`), Connect/Reconnect (`data-action=aiConnect`), Turn off
  (`aiDisconnect`), and "Set up on desktop / copy command" (`aiSetup`). Status via
  `aiStatusText()`.
- Investigation (`renderInvestigation`): scripted question buttons + (when
  `AIClaimant.isOn()`) a free-text box `#ai-free-input` + Ask button
  (`data-action=askFree`); Enter key handled in `app.js _onKeydown`. A `pending`
  turn shows a "thinking" bubble.
- **AI answers are already first-class draggable evidence**: `registerAnswerChip`
  turns each answer into a `draggable` speech bubble + pinnable chip, identical to
  scripted answers, so they drop into the Evidence Tray / PEEL report.

---

## 7. The desktop AI server side
The game is static https; the AI is a **local** model. Chain:
`browser (https github.io) -> https Cloudflare tunnel -> game-ai-proxy.py -> Ollama`.

- **`game-ai-proxy.py`** (stdlib only, runs on the embeddable Python): listens on
  `:11500` (`PROXY_PORT`), forwards `GET /api/tags` and `POST /api/chat` to
  `OLLAMA_URL` (default `http://127.0.0.1:11434`). Adds permissive CORS + an access
  key (`GAME_AI_KEY` env; checked via `X-Game-Key` header or `?key=`). `/healthz`
  for probes. Keeps Ollama localhost-only; only the keyed proxy is exposed.
- **Launchers** (desktop, PowerShell — all pure ASCII, see §8):
  - `start.ps1` — the main one. Run-from-GitHub: `irm <raw>/start.ps1 | iex`.
    Anti-502: starts Ollama (with `OLLAMA_ORIGINS=*`), tries the keyed proxy, and
    **falls back to tunneling straight to Ollama if Python/proxy is unavailable**,
    then opens a Cloudflare tunnel and prints+copies the auto-connect link.
  - `play-ai.cmd` — double-click wrapper that runs `start.ps1`.
  - `game-ai.ps1` — same-Wi-Fi variant: Ollama on `0.0.0.0` + serves the game over
    http on `:8088` (open `http://<desktop-ip>:8088`, no tunnel/mixed-content).
  - `game-ai-remote.ps1` — any-network variant assuming a local clone.
- `cloudflared.exe` is auto-downloaded to the repo dir (gitignored). The access key
  is generated once into `.game-ai-key` (gitignored — never commit it).

---

## 8. Hard constraints & gotchas (read before "fixing")
1. **Mixed content:** an https page (github.io) may call `http://localhost` /
   `127.0.0.1` (browsers treat these as secure) but **NOT** `http://<LAN-IP>` or any
   other plain-http origin. → cross-network play **requires an https tunnel**.
2. **CORS:** direct-to-Ollama needs `OLLAMA_ORIGINS=*` (or the github.io origin).
   The proxy sets its own CORS, so proxy mode doesn't need it.
3. **Free Cloudflare tunnel URL changes every run** and dies when the process
   stops → any baked-in link eventually 502s/stops loading. This is the #1 source
   of "it loaded yesterday, not today." **Permanent fix = a named Cloudflare tunnel
   (one-time login) → fixed URL → bake into the plain game link.** NOT done yet.
4. **Model choice is critical (tested on this box):**
   - Ollama is **0.24.0**; this `qwen3:4b` build **always reasons** —
     `think:false` AND `/no_think` are both ignored, reasoning floods `content` or a
     `thinking` field. On CPU that's ~25s+ of hidden reasoning, often **1–2 min per
     reply → unplayable**.
   - **`llama3.2:3b` is the chosen model** (non-reasoning, ~9s/reply on CPU,
     good role-play). Both models are pulled locally. Default in `ai.js` and all
     launchers is `llama3.2:3b`.
   - The RX 580 GPU is **not** usable by Ollama (CPU only). A separate llama.cpp
     Vulkan GPU lane exists in the unrelated "powerhouse" project (`gpu.ps1`,
     `:8090`, OpenAI-compatible) — could be wired as a faster backend later.
5. **PowerShell files must be pure ASCII.** Em-dashes/curly quotes get mis-decoded
   by PS 5.1 as string delimiters and silently break the scripts. Keep `.ps1` ASCII.
6. **Bundle script list:** new `js` files must be added to `loadScriptsInOrder` in
   `Art Authentication Bureau.html` (see §4).
7. **localStorage** caches `cfg`; a stale `enabled:false`/old host can override
   first impressions — URL params override host/key/enabled on load. Hard-refresh
   (Ctrl+Shift+R) when testing UI/JS changes (Pages/browser caching).

---

## 9. Current git state
HEAD `ecf8a54` is a **revert** back to commit `f00e35e` ("Use fast non-reasoning
model llama3.2:3b"). The user reverted three later commits (a Bureau-theme restyle
of the AI UI, making AI the default interview, and a live AI status banner). So
right now: **AI is OFF by default** (manual connect), original AI styling, no
banner. Those reverted commits still exist in history if any of it is wanted back
(`git log` for "Restyle…", "Make the AI interview the default…", "Add clear
live/offline AI banner…"). Don't assume those features are present.

---

## 10. How to run / test (quick)
- **Desktop server:** `irm https://raw.githubusercontent.com/Mrpkm/Fake-or-Famous-Game/main/start.ps1 | iex`
  → copies an auto-connect link.
- **Play:** open that link (it has `?aihost=&aikey=`), hard-refresh.
- **Verify the chain from a shell** (Ollama at `:11434`, embeddable Python at
  `D:\AI experiment\python\python.exe`):
  ```bash
  curl -s <tunnel>/healthz
  curl -s <tunnel>/api/chat -H "Content-Type: application/json" -H "X-Game-Key: <key>" \
    -d '{"model":"llama3.2:3b","stream":false,"messages":[{"role":"user","content":"hi"}],"options":{"num_predict":40}}'
  ```
- JS sanity: `node --check English-summative-AI_integrated/js/<file>.js`.
- PS sanity: `[System.Management.Automation.Language.Parser]::ParseFile(...)`.

---

## 11. Best places to expand AI capabilities
1. **Conversational memory** — `ask()` is stateless; pass prior Q&A as `messages`
   so the claimant stays consistent across a case.
2. **AI Judge** (ruleset §17) — score/feedback the player's free-written PEEL
   "Explain" box against the dossier + answer key, instead of the rules-based judge.
3. **Score free-text tells** — detect when a free-text AI answer contradicts the
   dossier on a tell topic, so typed questions can earn "decisive evidence"
   (today only scripted questions set `isTell`).
4. **Streaming** — switch `/api/chat` to `stream:true` and render tokens live (the
   UI re-renders wholesale today; would need a lighter update path for the bubble).
5. **Permanent tunnel + baked-in link** — kill the changing-URL problem (§8.3).
6. **Faster backend** — optionally target the llama.cpp Vulkan GPU lane (`:8090`,
   OpenAI `/v1/chat/completions`) for GPU-speed replies.
7. **Difficulty via AI** — let the model improvise extra in-character detail while
   still honoring the planted `fraudTells`.

Keep the **scripted fallback intact** (it's what makes the hosted game work for
everyone with no server), and keep AI an enhancement, not a hard dependency.
