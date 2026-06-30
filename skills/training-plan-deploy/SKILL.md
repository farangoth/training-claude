---
name: training-plan-deploy
description: Use whenever Clément asks to update, edit, extend, or fix his Snowdon SkyRace / post-race training plan (training-plan.jsx in farangoth/training-claude), or to push those changes live. Triggers include "update the training plan", "add a week", "change the shoe for...", "fix the overview page", "push the training plan", "redeploy the training plan", or any edit to weekly training content, phases, shoe assignments, or the plan's React UI that should end up live on GitHub Pages. Covers the full pipeline: edit training-plan.jsx -> compile to standalone HTML -> push both files to GitHub -> verify the live site.
---

# Training Plan Deploy

Clément's Snowdon SkyRace training plan lives as a single React component
(`training-plan.jsx`) in the GitHub repo `farangoth/training-claude`, served
live as a pre-compiled standalone HTML page via GitHub Pages at
`https://farangoth.github.io/training-claude/training-plan.html`.

This skill captures the exact, tested pipeline for making any change to that
plan and getting it live, so each update doesn't require re-deriving the
Babel configuration from scratch.

## When to use this skill

Use this skill for **any** request that touches the training plan's content
or UI and needs to end up live, for example:

- "Add Week 28 covering..."
- "Change the shoe for Tuesday's session to..."
- "Fix the overview page, it's missing..."
- "Update the HR cap for week 12"
- "The Saturday long run distances look wrong, fix them"
- "Push the latest changes to the training plan"

Do **not** use this for the athlete profile page (`index.html` /
`athlete-profile.jsx`) — that's a separate static page with no compile step.

## Required credential

All steps need a GitHub PAT with `repo` scope (Contents: Read & Write) for
`farangoth/training-claude`. If the most recent PAT shared in conversation is
more than ~15 minutes old or a push returns a 401, ask Clément for a fresh
one — GitHub PATs shared in chat should be treated as single-use and rotated
after use anyway.

## The pipeline (4 steps, run in order)

### 1. Fetch the current `training-plan.jsx` from GitHub

Always edit the version that's actually live, not a locally cached copy —
the file diverges from any local/project copy over time (it accumulates a
`@version` comment, sync logic, etc. that aren't in the original draft).

```python
import json, urllib.request, base64

PAT = "<token>"
req = urllib.request.Request(
    "https://api.github.com/repos/farangoth/training-claude/contents/training-plan.jsx",
    headers={"Authorization": f"token {PAT}", "Accept": "application/vnd.github+json"}
)
with urllib.request.urlopen(req) as r:
    data = json.loads(r.read())
    sha = data['sha']
    jsx = base64.b64decode(data['content']).decode('utf-8')
```

### 2. Apply the edit to the JSX

Make the requested change directly in the `jsx` string (string replace for
small edits, or insert/restructure for new weeks/components). Useful anchors
in the file:

- `var PHASE_COLORS = [...]` / `var PHASE_LABELS = [...]` — phase definitions
- `var WEEKS = [` ... `];` — the full array of week objects (each has
  `number`, `block`, `phase`, `dates`, `hrCap`, `totalKm`, `totalElev`,
  `intensity`, `strength`, `objective`, `recommendations[]`, `days[]`)
- `function App()` — the root component; `view` state toggles between
  `"overview"` (all-weeks roadmap, `OverviewPage` component) and `"week"`
  (single week detail, the original view)
- `function OverviewPage(props)` — renders all weeks grouped by phase with
  progress bars; lives just above `function App(`

After editing, sanity-check before moving on:
- For new weeks: every day object needs `day`, `date`, `label`, `type`,
  `emoji`, `summary`, `tag`, `tagColor`, `preDetail` (with at minimum
  `title`, `duration`, `distance`, `elevation`, `keyFocus`)
- Shoe assignments use the names exactly as in `Gear.md`: `"Merrell MTL Long
  Sky"`, `"The North Face Vectiv Sky"`, `"New Balance Hierro"`, `"Kiprun
  KS900"`, `"Kiprun KD900 Light"`, `"Kiprun KD900X"`
- Don't leave duplicate `import` lines or re-declare `useState`/`useEffect`
  — the compile script (step 3) already injects these as globals

### 3. Compile JSX to standalone HTML

Use `scripts/compile_training_html.py` (bundled with this skill) — it
implements the exact transformations needed for this codebase and has been
tested against the live file. Don't re-derive this from scratch; the
gotchas it handles (see the script's docstring) cost real debugging time to
find:

- Strips all `import` lines (React/ReactDOM load as CDN globals)
- Swaps `localStorage` for an in-memory `window` store
- Uses Babel's **classic** JSX runtime (`React.createElement`), not the
  automatic `jsx-dev-runtime` — the automatic runtime emits an `import`
  statement the browser can't resolve and silently breaks the page
- Targets modern evergreen browsers so async/await passes through natively
  instead of being polyfilled into a much larger bundle

```bash
# One-time setup if @babel/* isn't already installed in the working dir:
npm install @babel/core @babel/preset-react @babel/preset-env @babel/cli --save-dev

# Write the edited jsx string to a file, then compile:
python3 scripts/compile_training_html.py /tmp/training-plan.jsx /tmp/training-plan.html
```

Watch the script's stdout for `Built ... KB`. If Babel errors, the most
common cause is a leftover `import { useState } from "react"` line inside
the WEEKS array data (rare) or unbalanced JSX tags from a manual edit — fix
in the `jsx` string and recompile, don't try to patch the compiled JS
directly.

### 4. Push both files to GitHub

Push `training-plan.jsx` (source of truth) and `training-plan.html`
(compiled, what GitHub Pages actually serves) in that order, using
`scripts/github_push.py`:

```bash
python3 scripts/github_push.py farangoth/training-claude \
    /tmp/training-plan.jsx training-plan.jsx \
    "<describe the change>" "$GITHUB_TOKEN"

python3 scripts/github_push.py farangoth/training-claude \
    /tmp/training-plan.html training-plan.html \
    "<describe the change> [compiled]" "$GITHUB_TOKEN"
```

This helper handles fetching the current sha automatically and retries once
on a 409 conflict (concurrent edit). Pushing the compiled HTML directly —
rather than relying on the repo's GitHub Action to rebuild it — is the
**primary path**, because the Action's CI environment has an unresolved
Babel/heredoc quirk that doesn't reproduce locally (see "Known issue"
below). Don't wait on the Action; build and push the HTML yourself every
time.

### 5. Verify

State the live URL back to Clément:
`https://farangoth.github.io/training-claude/training-plan.html`

GitHub Pages typically updates within ~30-60 seconds of the push. If asked
to confirm, can optionally re-fetch and grep the live HTML for an expected
string (e.g. a new week number or label) to confirm the deploy landed.

## Known issue: the GitHub Action is disabled

`.github/workflows/sync-training-plan.yml` was originally set up to
auto-rebuild `training-plan.html` on every push to `training-plan.jsx`. The
exact same Python compile logic that works perfectly locally fails inside
GitHub's Actions runner with an unhelpful `exit code 1` and no retrievable
log detail (Azure blob log storage isn't in this environment's network
allowlist, so logs can't be fetched for debugging). After several rounds of
fixes that all worked locally but kept failing in CI, the workflow trigger
was switched to `workflow_dispatch` (manual only) to stop it silently
leaving the live site stale. This skill's step 4 (push the compiled HTML
directly) is now the reliable, primary deploy path. If revisiting the
Action in future, the likely culprits worth checking first: a Node version
mismatch between local (used to validate) and the `ubuntu-latest` runner,
or an `actions/checkout` not fetching the exact commit expected.

## Repo reference

- Repo: `farangoth/training-claude` (public)
- `training-plan.jsx` — source of truth, edited by this skill
- `training-plan.html` — compiled output, served by GitHub Pages
- `index.html` — separate athlete profile page, not touched by this skill
- `sessions.json` — written at runtime by the deployed app itself (logs
  completed sessions back to GitHub via the in-page `ghGet`/`ghPut` helpers
  using a token embedded in the JSX) — don't edit this manually
- `Gear.md` — shoe inventory, the canonical list of valid shoe name strings
- `scripts/build_training_html.py` — older build script, superseded by this
  skill's `compile_training_html.py`; kept for the manual-fallback Action
