# calander — battleplan

## 0. What this is

A tiny web diary for Mum, inspired directly by how she already uses her paper diary:

- one **week spread** at a time
- lots of handwritten notes
- several pen colours / highlights
- photos pasted onto the page
- little doodles, circles, arrows and margin notes
- Czech calendar context (days, namedays, holidays)
- absolutely no productivity-app nonsense

The app should feel like **her paper diary got a screen**, not like a database with forms.

---

## 1. Prime directive

> Open app → see this week → touch anywhere → write.

No dashboard. No onboarding maze. No mandatory categories. No save button needed.

The current week is home.

---

## 2. Core UX

### Weekly spread

Landscape-first view resembling an open diary:

- Monday–Sunday visible on one spread
- current day gently highlighted
- previous / next week by swipe or big arrows
- one obvious **DNES** button returns to current week
- week number, month, Czech day names
- optional Czech namedays / public holidays

Desktop/tablet: full two-page spread.

Phone: show one day at a time, but keep the same content model.

### Editing

The page should stay visually free-form.

MVP input:

- tap a day and type text
- basic rich-ish text only where useful: newline, size, colour
- pen colours: blue, green, red, black
- highlighter
- autosave immediately

Next step:

- freehand pen / marker
- circles, arrows, simple doodles
- movable / resizable text snippets
- movable / rotatable photos

Do **not** turn each day into a rigid form.

---

## 3. Photos

Photos are first-class diary content, not attachments hidden behind a paperclip.

MVP:

- add photo from phone/tablet/computer
- place it inside a day
- crop if needed
- resize
- remove

Later:

- drag / rotate freely on the spread
- captions
- family **photo inbox**: family can send photos to Mum; they wait in a small tray until she puts them into the diary

---

## 4. Writing / drawing

### MVP

Typed text with a few colours is enough to test whether Mum actually likes the digital diary.

### Phase 2

Add a canvas layer per week/day:

- pen
- marker
- eraser
- 3–4 widths
- blue / green / red / black
- touch and stylus support

The goal is deliberately simple: **ballpoint pen on paper**, not Krita.

---

## 5. Data safety

This is a diary. Losing it is unacceptable.

Rules:

- offline-first
- autosave locally after every edit
- no edit should depend on network availability
- keep timestamps / revision history where cheap
- offer explicit backup/export

### Initial storage

For the first prototype:

- IndexedDB for diary data
- browser storage for settings
- photos stored locally as blobs / compressed images

This allows a completely local PWA with no account or server.

### Later sync

Only add cloud sync after the local app is pleasant to use.

Possible later backend:

- Firebase (already familiar territory)
- or another very small sync backend

Sync must be additive, not a dependency.

---

## 6. PWA first

Make it a web app / PWA first.

Reasons:

- easy to deploy
- easy to update remotely
- works on Android tablet, phone and PC
- can install to home screen
- offline service worker fits the diary perfectly
- avoids Play Store machinery during the experiment

Target device experience: **10–11 inch Android tablet in landscape**.

GitHub Pages is enough for the first local-only version.

---

## 7. Visual direction

Preserve some of the warmth of the physical diary.

Use:

- warm/off-white paper background
- very subtle paper texture if it does not hurt readability
- coloured day numbers
- thin printed diary lines / separators
- generous writing space
- restrained shadows around the two-page spread
- large readable controls

Avoid:

- glassmorphism
- corporate dashboard cards
- tiny icon-only controls
- excessive animation
- fake leather / fake spiral-binding skeuomorphism

A little paper character is good. Cosplaying as a 2009 iPad app is not.

---

## 8. Accessibility / Mum mode

This project succeeds only if Mum can use it without instructions.

Design rules:

- large touch targets
- strong contrast
- text size adjustable globally
- no gestures that are the only way to perform an action
- destructive actions need undo
- no mysterious long-press-only features
- no hidden save state
- Czech UI first

Possible later option: a single **Jednoduchý režim** that hides advanced tools.

---

## 9. Search — the digital superpower

Once there is enough data, search becomes one of the strongest reasons to use the app.

Search should eventually find:

- words in typed diary text
- names
- places
- dates
- photo captions

Examples:

- `Samuel`
- `doktor`
- `Praha`
- `rajčata`

Later OCR/handwriting recognition can be experimented with, but the app must not depend on it.

---

## 10. Old paper diaries

Long-term killer feature: bring old diaries into the same timeline.

Import flow:

1. photograph / scan a weekly spread
2. assign year + week
3. show the scan as the background/archive for that week
4. optionally add searchable notes / OCR later

Important: preserve the original scan even when OCR is wrong.

This can turn years of paper diaries into one browseable family archive.

---

## 11. Voice input

Useful, but not MVP-critical.

Later:

- microphone button
- Czech speech-to-text
- dictated text lands in the selected day
- Mum edits it normally afterwards

Never make voice the only input method.

---

## 12. Printing / export

The diary should be able to become paper again.

### Early target

Export one week as printable PDF / print layout.

Later:

- month range
- whole year
- photo-inclusive archive
- backup ZIP / JSON + images

Printed output should resemble the on-screen spread closely.

---

## 13. Things we explicitly do NOT build

No:

- mood scores
- streaks
- badges
- productivity goals
- social feed
- public profiles
- motivational notifications
- AI-generated diary entries
- "How are you feeling today?" popups

AI may eventually help with search/OCR/transcription, but **Mum writes the diary**.

---

## 14. MVP — build this first

The smallest version worth putting in Mum's hands:

1. Czech weekly calendar spread
2. current week opens automatically
3. previous / next week
4. **DNES** button
5. editable text for every day
6. blue / green / red / black text colours
7. add a photo to a day
8. autosave to IndexedDB
9. offline PWA
10. printable weekly layout

Nothing else is allowed to delay this test.

Success test:

> Can Mum use it for a real week without asking how to save, where Tuesday went, or why the internet ate her diary?

---

## 15. Phase 2

If Mum actually uses the MVP:

- freehand drawing
- highlighter
- movable / resizable photos
- movable text snippets
- Undo / Redo
- search
- month/year navigator
- better print/PDF export
- local backup + restore
- optional voice input

---

## 16. Phase 3

Only after the diary itself is solid:

- account / cloud sync
- phone + tablet + desktop sync
- family photo inbox
- old diary scanning/import
- OCR experiments
- shared family archive permissions
- automatic weather / nameday / garden context

Keep every automatic feature visually subordinate to Mum's own writing.

---

## 17. Suggested simple architecture

Keep v1 boring.

```text
index.html
src/
  app.js
  calendar.js
  storage.js
  photos.js
  print.js
  ui.js
styles/
  app.css
assets/
manifest.webmanifest
sw.js
```

No framework is required for the first prototype unless the UI becomes painful without one.

Data model can remain simple:

```text
Week
  id: "2026-W41"
  days:
    2026-10-05:
      text
      textColor
      photos[]
    ...
  updatedAt
```

Drawing data and free-positioned objects can be added later without polluting the first prototype.

---

## 18. First implementation passes

### Pass A — skeleton

- GitHub Pages-ready static app
- PWA manifest + service worker
- current Czech week calculation
- landscape weekly layout
- previous / next / today controls

### Pass B — diary

- editable day text
- colour chooser
- IndexedDB persistence
- reload / offline tests

### Pass C — photos

- image picker
- downscale large images before storage
- display photo inside selected day
- remove / replace

### Pass D — print

- clean `@media print` layout
- A4 landscape first
- verify that text and photos remain readable

### Pass E — Mum test

Put it in her hands and **do not explain it immediately**.

Watch where she taps.

Any feature requiring repeated explanation is a design bug until proven otherwise.

---

## 19. Definition of done for v0.1

v0.1 is done when:

- installed PWA opens offline
- current week is correct in Czech locale
- Mum can type into all seven days
- colours work
- at least one photo can be added
- everything survives reload/restart
- navigating weeks does not lose data
- weekly printout works
- there is a backup path before serious daily use

Then stop coding and get real-world feedback.

---

## 20. North star

The paper diary in the reference photo already works.

We are not redesigning Mum's habit.

We are giving that habit:

- infinite pages
- photos without glue
- search
- backup
- printing
- eventually a family archive

Everything else is optional.
