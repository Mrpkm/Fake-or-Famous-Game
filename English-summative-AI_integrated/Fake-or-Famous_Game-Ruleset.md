# Fake or Famous?
### An art-history detective game — full design document & ruleset
*Working title — rename freely. Ages 8–11. Digital point-and-click. No internet/API required to run.*

---

## 1. One-line pitch
You're a detective at the **Art Authentication Bureau**. A person sits at your window claiming to be a famous artist — but is the claim real, or is this a forger in disguise? Read their secret file, interview them, find the lie (if there is one), and stamp your verdict with the evidence to prove it.

It plays like *Papers, Please* (the inspiration in your screenshot), but instead of checking passports you're checking whether someone's story matches what an artist's life and work *should* look like.

---

## 2. Purpose — what players learn
This is the heart of the game. Every mechanic exists to teach one of these four things:

1. **Art-history knowledge.** To catch a fraud (or confirm a real artist) kids must actually read and understand each artist's life, style, signature techniques, colours/palette, famous works, and the message/meaning behind the art.
2. **Critical thinking / cross-checking.** Players don't get told the answer — they compare what the person *says* against what the file *shows*, and decide who to believe.
3. **Evidence-based argument (the PEEL skill).** Players can't just guess "fraud!" — they must build a short **P**oint–**E**vidence–**E**xplain–**L**ink argument and back it with specific clues. This is the same structure they use in writing class.
4. **Asking good questions.** Some questions reveal a lot; some are easy to fake an answer to. Kids learn to ask *sharp, evidence-seeking* questions rather than vague ones.

> **Design principle:** The game should never be won by luck. A correct verdict with no real evidence scores poorly; a careful, well-argued case scores well even on a hard call.

---

## 3. At a glance

| | |
|---|---|
| **Genre** | Digital point-and-click investigation / deduction |
| **Inspiration** | *Papers, Please* desk-and-documents layout |
| **Players** | 1 at a time (great as a classroom station; whole-class on a projector also works) |
| **Ages** | 8–11 (reading supports built in) |
| **Roster** | 6 artists (you author them) |
| **A full game** | 2 rounds × 3 artists = 6 cases. ~10 min per case. |
| **Typical use** | One round (3 cases, ~30 min) per class period |
| **Tech needed** | A computer + a game engine (see §15). **No live AI / API.** |
| **Win condition** | Correct verdicts *backed by correct evidence* across the round → detective rank |

---

## 4. The core fiction
- **You** = a junior detective-judge at the Bureau. Your job: authenticate the person at the window.
- **The claimant** = a pixel-art character at a service window who says *"I am [Artist Name]."*
- That claimant is one of two things:
  - **REAL** — every answer they give matches the secret file.
  - **FRAUD** — most answers match, but **2–3 answers contain a lie** (a "tell") that contradicts the file. A forger studied the artist but got a few details wrong.
- Your dossier always describes the **true** artist. Your job is to decide whether the *person in front of you* is really them.

This is why the player must learn the real facts: the only way to spot the impostor is to know what the genuine answer should have been.

---

## 5. Game structure (how the 6 artists are arranged)

```
FULL GAME
├── ROUND 1  (2 real + 1 fraud)
│     ├── Case 1  →  judge REAL or FRAUD
│     ├── Case 2  →  judge REAL or FRAUD
│     └── Case 3  →  judge REAL or FRAUD
│            (one of these three is the fraud)
└── ROUND 2  (2 real + 1 fraud)
      ├── Case 4
      ├── Case 5
      └── Case 6
```

- The roster of **6 artists is fixed** (the ones you author). 
- **Each playthrough the engine randomly assigns roles** so that exactly **2 of the 6 are frauds**, split as **1 fraud per round**. The order of cases is also shuffled.
- **Result:** the same 6 artists feel different every time — an artist who was *real* last game might be the *fraud* this game. This gives you full replayability from only 6 authored files. *(This is why each artist needs both a "truthful" and a "fraud" answer set — see §13.)*
- **Each case is judged on its own.** The player gives a REAL/FRAUD verdict for each claimant individually.
- **Optional difficulty toggle — "Tip-off":** ON = the player is told *"a forger is hiding somewhere in this round"* (adds deduction). OFF (default for ages 8–11) = each case stands alone with no quota hint.

---

## 6. The game loop (step by step)

Each of the 6 cases runs through the same five phases:

### Phase A — Briefing (≈20 sec)
The claimant slides up to the window. A card flips: *"I am [Artist Name]. Verify me."* The dossier folder drops onto your desk.

### Phase B — Investigation ⏱ 7:00 *(adjustable)*
This is where the player **reads + interviews**, all on one screen:
- **Read the dossier** — flip through the artist's cards (bio, style, colours, famous work, message, quirk — see §7).
- **Interview the claimant** — spend a limited number of **questions** (default **5**) from a question menu. Each answer appears in a speech bubble *and* drops into your notes.
- **Clip evidence** — tap any file fact or any answer to "pin" it to the **Evidence Tray** for later. Pinning a contradiction is how you build your case.

When time runs out (or the player taps **Done Investigating**), the interview locks.

### Phase C — Build the Case ⏱ 3:00 *(adjustable)*
The **Case Report** clipboard opens. The player fills a **PEEL** argument by tapping evidence chips and choosing/typing short text (full details in §8).

### Phase D — Verdict
Two big rubber stamps, *Papers, Please*–style:
- 🟩 **REAL — Authenticated**
- 🟥 **FRAUD — Forger!**

The player stamps the Case Report. *Thunk.*

### Phase E — Reveal & Feedback
- The truth is revealed: *"This really was [Artist] / This was a FORGER."*
- The game scores the case (§9) and shows **specific feedback** — which clues they nailed, which they missed, whether their evidence actually proved their point.
- **Stars** (★ to ★★★) and an encouraging line appear.

→ Next case. After 3 cases: **Round Summary**. After 6: **End-of-Game Summary** + **Detective Rank** + a "Case Files" recap they can review.

---

## 7. The dossier — what's inside each Case File
The dossier is a folder of **pinnable cards**. Keep each card short and visual (ages 8–11). Suggested cards:

| Card | What it holds | Why it matters |
|---|---|---|
| 🪪 **ID / Bio** | Name, where & when they lived, one big life event | Catches date/place lies |
| 🎨 **Style** | The art movement / style in kid words ("dreamy + realistic") | Catches "wrong style" lies |
| 🖌️ **Technique** | 1–2 signature techniques (*how* they painted) | High-value: hard to fake |
| 🌈 **Palette** | The colours they're famous for (show swatches!) | Very catchable visually |
| 🖼️ **Famous Work** | Title + year + a tiny description of one key piece | Catches title/year lies |
| 💬 **Message** | The meaning/idea behind their art | Tests deeper understanding |
| 🐦 **Quirk** | A secret signature habit (e.g., always hides a small bird) | The juiciest "gotcha" clue |

The **fraud** will contradict the file on **2–3** of these. The genuine claimant matches all of them.

---

## 8. The interview system (no API — fully scripted)

Because we're not using a live AI, the claimant's answers are **pre-written** by you, the author. This is more reliable for a classroom and easy to build.

**How it works for the player:**
- A **Question Menu** offers a fixed set of questions, grouped by topic (Bio, Technique, Colour, Message, Famous Work, Quirk).
- The player has a **budget of 5 questions per case** → they must choose wisely.
- Each question pulls the matching answer from the claimant's bank.

**The two answer banks (this is the key trick):**
- Every artist file contains a **Truthful Answer Bank** and a **Fraud Answer Bank**.
- The fraud bank is **identical to the truthful one except for the 2–3 planted lies (the "tells")**. *(Authoring tip: write the true answers, copy them, then "break" 2–3.)*
- When the engine casts an artist as real → it serves truthful answers. As a fraud → it serves the fraud bank (with the tells).

**Teaching "good questions" (your learning goal):**
- Mark each question as **High-value** or **Low-value** in the file.
  - *High-value* questions probe specific, checkable facts (*"Is there something you secretly hide in every painting?"*) — these tend to expose tells.
  - *Low-value* questions are vague and easy to fake (*"Do you like being an artist?"*) — the answer sounds fine either way.
- Both cost one question from the budget. The game **doesn't warn** the player in advance — instead, the end-of-case feedback gently teaches it: *"Tip: 3 of your 5 questions were vague. Asking about specific techniques or habits makes liars slip up!"*

---

## 9. Evidence & the PEEL Case Report

### The Evidence Tray
Anything the player **pins** during investigation — a file fact or a claimant's answer — becomes an **evidence chip**. Each chip remembers where it came from and is **clickable**, so when it's dropped into the report it acts like the "hyperlink" you wanted: tap it and the original file card or answer pops up. This is the visual link-back from your sketch.

### The PEEL builder (kid-friendly)
A clipboard form with four slots:

| Slot | What the player does | Age 8–11 support |
|---|---|---|
| **P — Point** | Pick the verdict: *"This is the REAL ___"* or *"This is a FRAUD."* | Two big buttons |
| **E — Evidence** | Drag in **up to 3 evidence chips** | Chips come straight from the Tray |
| **E — Explain** | Say *why* the evidence proves the point | **Sentence starters + word bank**, plus a free-text box |
| **L — Link** | One closing line restating the verdict | Sentence starter: *"So I'm sure this is ___ because ___."* |

Sentence-starter examples for the **Explain** box: *"This matches because…", "This does NOT match because…", "The file says ___ but the person said ___…"*

---

## 10. Scoring & feedback — the rules-based "judge" (no API)

Instead of an AI grading free text, the game scores against the case's **known answer key** plus a **feedback bank** you author. Simple, fair, and instant.

**Points per case (out of 100):**

| Component | Points | Rule |
|---|---|---|
| **Correct verdict** | **50** | REAL/FRAUD call is right |
| **Decisive evidence** | up to **30** | +15 for each genuinely decisive chip cited (a real *tell* for a fraud; a true confirming fact for a real artist), max 2 |
| **PEEL complete** | **10** | All four slots filled |
| **Question efficiency** | **10** | Bonus if most questions asked were High-value |

- **Wrong evidence is not punished, just unrewarded** (kindness for young players) — but the feedback flags it: *"The clue you used actually matched the file, so it doesn't prove a fraud."*
- **Stars:** ★ = correct verdict only · ★★ = correct + at least one decisive clue · ★★★ = correct + two decisive clues + complete PEEL.

**Feedback is assembled from your authored feedback bank**, keyed to *(correct/incorrect verdict) × (which tells were caught/missed)*. Examples:
- ✅ *"Sharp work! You noticed the file says the bird is green but the person said blue — that's the giveaway."*
- ✅ *"Authenticated correctly! Your evidence about the salt-scatter technique was exactly right."*
- ❌ *"You called FRAUD, but everything this person said matched the file — re-read the Palette card next time."*
- ⚠️ *"Right answer, but your evidence didn't point to the real clue. Lucky guess — let's prove it next time!"*

**End-of-game ranks** (motivation, ages 8–11): **Rookie → Junior Detective → Inspector → Master Authenticator.** Based on total stars across all 6 cases.

---

## 11. How players show understanding (mapped to your three signals)

| Your stated signal | Where it lives in the game | What it measures |
|---|---|---|
| **Careful evidence selection** | Evidence Tray → chips in PEEL → "decisive evidence" score | Did they identify the clue that actually matters? |
| **Constructing & refining arguments** | PEEL builder + per-case feedback loop | Can they turn a clue into a reasoned claim? Do they improve case to case? |
| **Quality of questions** | High/Low-value tagging + question-efficiency bonus + feedback tip | Do they ask sharp, checkable questions instead of vague ones? |

---

## 12. Look & feel (your sketch)
Pixelated, vintage, slightly grimy bureau desk — cluttered **but readable** (your note about not over-distracting). Think warm lamp light, paper textures, rubber stamps.

**Single-screen investigation layout (rough wireframe):**

```
┌───────────────────────────────────────────────────────────┐
│  ART AUTHENTICATION BUREAU            ⏱ 06:42   ❓ Asks: 3/5 │
├───────────────┬───────────────────────────────────────────┤
│   [WINDOW]    │   THE DOSSIER  (flip the cards)             │
│   pixel       │   ┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐       │
│   portrait    │   │ ID ││Styl││Tech││Pal ││Work││Quirk│      │
│   of claimant │   └────┘└────┘└────┘└────┘└────┘└────┘       │
│               │                                             │
│  "I am ___."  │   QUESTION MENU (clipboard)   EVIDENCE TRAY  │
│  💬 answer    │   • Ask about technique       📌 chip        │
│     bubble    │   • Ask about colours         📌 chip        │
│               │   • Ask about the quirk       📌 chip        │
├───────────────┴───────────────────────────────────────────┤
│        [ ✅ Done Investigating → Build the Case ]            │
└───────────────────────────────────────────────────────────┘
```

**Verdict screen:** two oversized rubber stamps — 🟩 **REAL** / 🟥 **FRAUD** — that slam down with a sound effect, very *Papers, Please*.

---

## 13. Difficulty & accessibility for ages 8–11
- **Timers are adjustable** by the teacher and there's a **Practice Mode (no timer)**. Defaults: 7:00 investigate / 3:00 build (your numbers). A gentler preset (10:00 / 4:00) is one click away.
- **Reading supports:** short cards, read-aloud button (text-to-speech) optional, simple vocabulary, colour swatches shown visually.
- **Tells:** exactly **3 per fraud**, and they should be *findable* — at least one tied to the visual Palette or the fun Quirk card.
- **Hint system (optional):** one "magnifying glass" hint per case that re-reads the most relevant file card aloud — never names the answer.
- **No scary fail state:** a wrong call ends in encouragement + a clear explanation, not a "game over."

---

## 14. Content authoring template — *drop your 6 artists in here*

Fill out **one of these per artist** (×6). Everything in `[brackets]` is yours to write. Keep answers to 1–2 short sentences for young readers.

```yaml
artist_id: art_01
display_name: "[Artist Name]"
portrait: "[pixel sprite filename]"

# ---------- DOSSIER CARDS (always TRUE) ----------
bio:        "[Where/when they lived + one big life event]"
style:      "[Their style in kid words]"
technique:  "[1–2 signature techniques — HOW they painted]"
palette:    ["[colour 1]", "[colour 2]", "[colour 3]"]   # show as swatches
famous_work: { title: "[Title]", year: [YYYY], note: "[one line]" }
message:    "[The idea/meaning behind their art]"
quirk:      "[A secret signature habit]"

# ---------- INTERVIEW (write TRUE answers; mark value) ----------
questions:
  - id: q_tech
    text: "[High-value question about technique]"
    value: high
    true_answer:  "[Answer that MATCHES the technique card]"
  - id: q_palette
    text: "[Question about colours]"
    value: high
    true_answer:  "[Answer that MATCHES the palette]"
  - id: q_quirk
    text: "[Question about the secret habit]"
    value: high
    true_answer:  "[Answer that MATCHES the quirk]"
  - id: q_work
    text: "[Question about the famous work]"
    value: high
    true_answer:  "[Answer with correct title/year]"
  - id: q_feel
    text: "[A vague, easy-to-fake question]"
    value: low
    true_answer:  "[Generic friendly answer]"
  # add a few more so 5 picks from ~7 options feels like a choice

# ---------- THE LIE (used only when cast as FRAUD) ----------
# Copy the true answers, then change EXACTLY 2–3 to create tells.
fraud_tells:
  - question_id: q_quirk
    fraud_answer: "[A wrong version that contradicts the quirk card]"
  - question_id: q_work
    fraud_answer: "[Wrong title or year]"
  - question_id: q_palette
    fraud_answer: "[A colour that's NOT on the palette card]"
# (Questions not listed here give the same TRUE answer in fraud mode.)

# ---------- FEEDBACK LINES (the rules-based judge reads these) ----------
feedback:
  caught_tell:  "[Praise that names the specific clue, e.g. 'You spotted the wrong colour!']"
  missed_tell:  "[Gentle nudge to the card that would've revealed it]"
  real_correct: "[Praise for authenticating a genuine artist with good evidence]"
  false_accuse: "[Kind correction: everything matched, here's why]"
```

**Authoring checklist for each fraud:** 3 tells · at least one tied to Palette or Quirk · the other answers stay truthful so it's not *too* obvious.

---

## 15. Worked example (fully fictional — shows the format)
*This artist is invented so you can see a complete, filled-in file. Replace with your own.*

```yaml
artist_id: art_demo
display_name: "Marlo Fenn"
portrait: "marlo_sprite.png"

bio:        "Lived in the seaside town of Coldharbour, 1928–1994. Started painting after working as a lighthouse keeper."
style:      "Dream-realism — real places that feel a little magical."
technique:  "Scattered sea-salt onto wet paint to make a sparkly, starry texture in the skies."
palette:    ["deep indigo", "mustard yellow", "bone white"]
famous_work: { title: "The Tin Roof Choir", year: 1971, note: "A row of houses singing under a storm." }
message:    "Ordinary places hold quiet magic if you look closely."
quirk:      "Hid a tiny GREEN bird somewhere in every single painting."

questions:
  - id: q_tech
    text: "How did you get that sparkly texture in your skies?"
    value: high
    true_answer:  "I scattered sea-salt onto the wet paint — it dries into little stars."
  - id: q_quirk
    text: "Do you hide anything secret in your paintings?"
    value: high
    true_answer:  "Always — a tiny green bird, somewhere in every one."
  - id: q_work
    text: "Tell me about your most famous painting."
    value: high
    true_answer:  "'The Tin Roof Choir,' from 1971 — houses singing in a storm."
  - id: q_palette
    text: "Which colours can't you live without?"
    value: high
    true_answer:  "Deep indigo, mustard yellow, and bone white."
  - id: q_feel
    text: "Do you enjoy being a painter?"
    value: low
    true_answer:  "Oh, very much — I can't imagine doing anything else."
  - id: q_bio
    text: "What did you do before you were an artist?"
    value: high
    true_answer:  "I was a lighthouse keeper in Coldharbour."

fraud_tells:
  - question_id: q_quirk
    fraud_answer: "Always — a tiny BLUE bird, hidden in every painting."   # file says GREEN
  - question_id: q_work
    fraud_answer: "'The Tin Roof Choir,' painted back in 1965."            # file says 1971
  - question_id: q_palette
    fraud_answer: "Deep indigo, mustard yellow, and bright crimson red."   # red isn't on the palette

feedback:
  caught_tell:  "Great eye! The file clearly says a GREEN bird — this person said blue. Forgers slip on the small stuff."
  missed_tell:  "Re-read the Quirk card — there was a sneaky colour mistake about the hidden bird."
  real_correct: "Authenticated! Your evidence about the sea-salt technique was spot on — that's hard to fake."
  false_accuse: "Careful — everything Marlo said matched the file. The bird, the date, and the colours were all correct."
```

In this example a player who asks about the **quirk**, **famous work**, and **palette** (all high-value) can catch all three tells; a player who only asks vague questions like *"Do you enjoy painting?"* learns nothing and is told why in the feedback.

---

## 16. Materials & build path (your "computer + programming")
You don't need a live AI, so a small engine plus **editable data files** (your 6 artists in §14 format) is enough. Ranked by ease of authoring for a single builder:

1. **Ren'Py** *(recommended for fastest result).* A free visual-novel engine built almost exactly for "a character at a window asks/answers, the player picks options, then makes a choice." Handles dialogue branching, portraits, menus, and scoring with little code. Pixel art and custom UI are supported.
2. **Twine** *(easiest, lowest-code).* Great for the scripted interview + branching feedback; lighter on the fancy desk visuals but excellent for a prototype you can test with kids this week.
3. **Construct 3 / GDevelop** *(best for the full pixel point-and-click "desk" feel).* Visual, drag-and-drop game makers; more work but you get the draggable cards, pinnable evidence, and stamp animations closest to your sketch.
4. **Plain HTML / CSS / JavaScript** *(most control).* Store each artist as a JSON file (the §14 schema is basically ready). Best if you or a helper are comfortable coding and want it to run in any browser as a classroom station.

**Asset list to prepare:** 6 character portraits (pixel sprites), 7 card icons, 2 rubber-stamp graphics (REAL / FRAUD), a desk background, simple sounds (stamp *thunk*, paper shuffle, timer tick), and your 6 filled-in data files.

**Where the content lives:** keep all artist data in separate files/objects so *"I'll give them the artists"* simply means filling in templates — no re-coding to add or swap an artist.

---

## 17. Optional upgrade — "AI Mode" (your original idea, for later)
You asked to set the API aside for now, so the ruleset above runs fully scripted. If you ever add an LLM later, here's exactly where the two AIs slot in — nothing else in the design changes:

- **AI #1 — the claimant.** Replaces the fixed Question Menu with a **free-text interview**: the player types any question and the AI answers *in character*, staying consistent with the dossier (real) or with planted contradictions (fraud). This deepens the "ask good questions" goal.
- **AI #2 — the judge.** Replaces the rules-based scorer for the **Explain** box: it reads the player's free-written reasoning and gives richer, sentence-level feedback against a rubric you provide.
- **Guardrails (important for ages 8–11):** keep the AI tightly scripted with a system prompt, restrict it to the artist's facts, filter output, and keep the scripted version as a fallback so the game still works offline or if the API is down.

---

## 18. Things I decided for you (small calls — flip any of these)
So nothing is hidden, here are the minor defaults I guessed; say the word and I'll change them:

1. **5 questions per case** (forces prioritising). 
2. **3 tells per fraud**, at least one visual/quirk-based. 
3. **PEEL = pick up to 3 evidence chips**, with sentence starters in Explain. 
4. **Scoring out of 100 → 1–3 stars**; wrong evidence isn't penalised, just unrewarded. 
5. **Each case judged independently**, with the cross-round "Tip-off" hint **off** by default. 
6. **Timers 7:00 / 3:00** kept as defaults but teacher-adjustable + a no-timer Practice Mode. 
7. **Detective ranks** (Rookie → Master Authenticator) for end-of-game motivation. 
8. **Same 6 artists reused with rotating roles** for replayability (so each artist needs a true + fraud answer set).
