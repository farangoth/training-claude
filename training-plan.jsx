import { useState, useEffect, useCallback } from "react";

// ─── GITHUB CONFIG ────────────────────────────────────────────────────────────
const GH_TOKEN  = "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";
const GH_REPO   = "farangoth/training-claude";
const GH_PLAN   = "training-week.jsx";   // plan source (WEEKS data)
const GH_STATE  = "sessions.json";       // completed sessions store

const GH_API    = `https://api.github.com/repos/${GH_REPO}/contents`;
const GH_HEADS  = { Authorization: `token ${GH_TOKEN}`, "Content-Type": "application/json" };

async function ghGet(path) {
  const r = await fetch(`${GH_API}/${path}`, { headers: GH_HEADS });
  if (!r.ok) return null;
  const d = await r.json();
  return { content: atob(d.content.replace(/\n/g,"")), sha: d.sha };
}

async function ghPut(path, content, sha, message) {
  const body = { message, content: btoa(unescape(encodeURIComponent(content))), ...(sha ? { sha } : {}) };
  const r = await fetch(`${GH_API}/${path}`, { method: "PUT", headers: GH_HEADS, body: JSON.stringify(body) });
  if (!r.ok) return null;
  const d = await r.json();
  return d.content?.sha;
}

// ─── LOCAL FALLBACK ───────────────────────────────────────────────────────────
const LS_KEY = "clement_sessions_v2";
function lsGet() { try { const r = localStorage.getItem(LS_KEY); return r ? JSON.parse(r) : {}; } catch { return {}; } }
function lsSet(s) { try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch {} }

// ─── EXTRACT WEEKS FROM JSX SOURCE ───────────────────────────────────────────
function extractWeeks(src) {
  try {
    const start = src.indexOf("const WEEKS = [");
    const end   = src.indexOf("\n];\n", start) + 3;
    const raw   = src.slice(start + "const WEEKS = ".length, end);
    // eslint-disable-next-line no-new-func
    return new Function(`return ${raw}`)();
  } catch(e) {
    console.error("extractWeeks failed:", e);
    return null;
  }
}

// ─── WEEK DATA (embedded fallback — kept in sync by Claude) ──────────────────
const WEEKS = [
  {
    number: 1, block: "Aerobic Rebuild", phase: 1,
    dates: "28 Jun – 4 Jul 2026", hrCap: 155,
    totalKm: "~40–45 km", totalElev: "~900–1000 m+", intensity: "Z1–Z2 only", strength: "×2",
    objective: "Re-establish aerobic base after the April–May gap. Every session this week serves one purpose: accumulate time below 155 bpm. No exceptions. The adaptation is in the duration, not the pace.",
    recommendations: [
      "Walk every pitch above ~12–15% grade. Running steep climbs this week = Z3. That is not the stimulus we want.",
      "Left knee ITB: note any lateral discomfort on descent. If >2/10 soreness, flag immediately and we substitute hip work.",
      "Cadence target 80–82 spm on flat running. Use a metronome app if needed.",
      "Sleep and food are training. 7+ hrs sleep and protein at every meal are non-negotiable.",
      "If you miss a session, absorb it — do not double up the next day.",
    ],
    days: [
      {
        day: "Sun", date: "28 Jun", label: "Trail Run", type: "done", emoji: "🏃",
        summary: "9.55 km · 252 m+ · 1h02 · 144 bpm avg",
        tag: "TRAIL", tagColor: "#4ade80",
        preDetail: {
          title: "Morning Trail Run",
          duration: "~60 min", distance: "9–10 km", elevation: "200–300 m+",
          hrTarget: "Z2: 140–155 bpm strict. Hike all pitches >15%.",
          shoes: "New Balance Summit SG or Merrell MTL Long Sky 2",
          terrain: "Moorland rolling trail — packed earth, loose grit on ascents, boggy peat sections. Moderate technical underfoot (no exposure). Grades up to 20% on named climbs.",
          routes: ["Kinder Low approach from Hayfield — 10 km, 260 m+", "Lantern Pike loop — 8 km, 200 m+"],
          keyFocus: "Disciplined warm-up: first 10 min easy, HR below 130. Then settle into Z2.",
        },
        result: {
          distance: "9.55 km", duration: "1h02 moving / 1h08 elapsed", elevation: "252 m+",
          avgHR: "144 bpm avg", peakHR: "174 bpm (final ascent km 9–9.5)",
          avgWatts: "193 W avg power", cadence: "79 spm avg · RPE 4/10",
          notes: "Lap breakdown: km 1–4 descent well-controlled (avg 122–140 bpm). Km 5 climb +82m, avg 142 bpm — correct. Km 6 harder pitch, avg 146 bpm, peak 164 bpm — first cap breach. Km 8 avg 156 bpm. Km 9–9.5 peak 174 bpm on steepest final pitch.",
          comment: "Avg HR of 144 bpm across 9.55 km with 252 m+ is a clean aerobic rebuild signal — the bulk of the run sat correctly in Z2. Lap data confirms excellent descent and flat-section discipline (km 1–5 avg 122–142 bpm), with HR drifting above ceiling only on the two steepest final pitches where walking would have been the correct tool. Power at 193 W avg with RPE 4/10 confirms the aerobic system is absorbing the load without undue stress. One precision fix for Monday: cadence was 79 spm — push for 81–83 spm on the flat recovery sections using a watch alert or metronome. That single change reduces ground contact time and begins building the leg turnover needed for the race.",
        },
      },
      {
        day: "Mon", date: "29 Jun", label: "Easy Recovery", type: "easy", emoji: "🫁",
        summary: "5–6 km · <60 m+ · HR <145",
        tag: "RECOVERY", tagColor: "#60a5fa",
        preDetail: {
          title: "Easy Aerobic Recovery Run",
          duration: "30–38 min", distance: "5–6 km", elevation: "<60 m+",
          hrTarget: "Strict <145 bpm. If HR climbs above, walk.",
          shoes: "Kiprun KS900 — road/towpath cushioning",
          terrain: "Flat compacted tarmac or gravel towpath. Sett Valley Trail or Goyt canal. Zero technical terrain, zero meaningful grade.",
          routes: ["Sett Valley Trail → flat railway path, 5 km out-and-back from New Mills Central", "Goyt towpath → Whaley Bridge direction, canal flat, good shade", "Treadmill 0% incline (if time-constrained)"],
          nutrition: "No fuelling needed. 500 ml + electrolytes post-run.",
          keyFocus: "This is adaptation, not stimulus. Resist the urge to push pace.",
        },
      },
      {
        day: "Tue", date: "30 Jun", label: "Strength + Run", type: "strength", emoji: "🏋️",
        summary: "Treadmill 4 km + 40 min S&C",
        tag: "STRENGTH", tagColor: "#f59e0b",
        preDetail: {
          title: "Treadmill Activation + Strength Session",
          duration: "Treadmill 25 min + S&C 40 min", distance: "4 km", elevation: "0 m",
          hrTarget: "<150 bpm on treadmill",
          shoes: "Kiprun KS900 or KD900 Light",
          terrain: "Indoor treadmill. 0% incline. Easy conversational pace.",
          strengthFocus: ["Single-leg glute bridges 3×12 each side (ITB/hip primary)", "Copenhagen adductor holds 3×20 sec (ITB support)", "Step-ups with knee drive 3×10 each leg (trail specificity)", "Calf raises eccentric slow 3×15 (Achilles resilience)", "Dead bugs 3×10 (core stability for downhill control)"],
          keyFocus: "Hip/glute work is ITB insurance. Do not skip it.",
        },
      },
      {
        day: "Wed", date: "1 Jul", label: "Rest / Mobility", type: "rest", emoji: "🧘",
        summary: "Active recovery · No running",
        tag: "REST", tagColor: "#a78bfa",
        preDetail: {
          title: "Full Rest or Mobility Only",
          duration: "20–30 min mobility (optional)", distance: "—", elevation: "—",
          mobilityWork: ["Hip flexor stretch 3×60 sec each side", "IT band foam roll (gentle) 2 min each leg", "Pigeon pose 90 sec each side", "Calf/soleus wall stretch 3×45 sec", "Thoracic rotation 2×10 reps"],
          keyFocus: "Sleep is a session. Prioritise 7+ hrs tonight.",
        },
      },
      {
        day: "Thu", date: "2 Jul", label: "Strength + Run", type: "strength", emoji: "🏋️",
        summary: "Treadmill 5 km + 35 min S&C",
        tag: "STRENGTH", tagColor: "#f59e0b",
        preDetail: {
          title: "Treadmill Aerobic + Strength Session",
          duration: "Treadmill 35 min + S&C 35 min", distance: "5 km", elevation: "0 m",
          hrTarget: "<152 bpm",
          shoes: "Kiprun KS900 or KD900 Light",
          terrain: "Indoor treadmill. Optionally 2×5 min at 5–8% incline — but HR must stay <152 bpm.",
          strengthFocus: ["Romanian deadlift 3×10 (posterior chain, glute load)", "Lateral band walks 3×15 each direction (ITB/hip abductor)", "Bulgarian split squat 3×8 each leg (quad + glute trail power)", "Plank variations 3×45 sec", "Reverse lunge with reach 3×10 each side"],
          keyFocus: "Progress from Tuesday — add one set if Tuesday felt manageable.",
        },
      },
      {
        day: "Fri", date: "3 Jul", label: "Easy Aerobic Run", type: "easy", emoji: "🫁",
        summary: "6–7 km · ~80 m+ · HR <155",
        tag: "AEROBIC", tagColor: "#60a5fa",
        preDetail: {
          title: "Weekday Aerobic Run",
          duration: "40–48 min", distance: "6–7 km", elevation: "~80 m+",
          hrTarget: "Z2: 140–155 bpm. Walk anything that pushes you above.",
          shoes: "Kiprun KS900 or New Balance Hierro",
          terrain: "Country lanes or light trail around New Mills. Rolling terrain acceptable, no sustained steep pitches. Mostly packed earth or tarmac.",
          routes: ["Cobden Edge loop — country lane + field path, ~7 km, ~90 m", "Hayfield road loop — quiet lane, easy rolling"],
          nutrition: "Optional gel or banana if run extends past 45 min.",
          keyFocus: "Last hard run before the weekend long. Leave something in the tank.",
        },
      },
      {
        day: "Sat", date: "4 Jul", label: "Long Mountain Day", type: "long", emoji: "⛰️",
        summary: "12–14 km · 400–500 m+ · 2h30–3h",
        tag: "LONG", tagColor: "#f97316",
        preDetail: {
          title: "Long Aerobic Mountain Day — Kinder Scout",
          duration: "2h30–3h moving", distance: "12–14 km", elevation: "400–500 m+",
          hrTarget: "Z2 dominant: 140–155 bpm. Hike all pitches >12%. HR is the governor.",
          shoes: "New Balance Summit SG or Merrell MTL Long Sky 2",
          pack: "Kiprun 5L trail vest minimum. Consider 20L if weather uncertain.",
          terrain: "Kinder Scout moorland — open plateau, peat bog, rocky edges. Non-technical (Grade 1, hands occasionally on approach). Rocky rim, boggy plateau, loose grit on descent. Full trail grip and ankle stability required.",
          routes: ["Edale → Jacob's Ladder → Kinder plateau → Grindsbrook descent — 13 km, ~480 m+", "Hayfield → Kinder Reservoir → Sandy Heys → Kinder Low — 12 km, ~430 m+", "Chinley → South Ridge → Kinder Low → William Clough — 14 km, ~460 m+"],
          nutrition: "2 gels or real food. 1L+ fluid. Eat at 45 min regardless of hunger.",
          safety: "Carry a layer — Kinder weather changes fast. Let someone know your route.",
          keyFocus: "Aerobic anchor of the week. Time on feet > pace. Hike 80% / run 20% is exactly right.",
        },
      },
    ],
  },
  {
    number: 2, block: "Aerobic Rebuild", phase: 1,
    dates: "5 – 11 Jul 2026", hrCap: 155,
    totalKm: "~45–50 km", totalElev: "~1000–1100 m+", intensity: "Z1–Z2 only", strength: "×2",
    objective: "Consolidate the aerobic base established in Week 1. Volume nudges up ~10%. Focus shifts to consistency and terrain variety — introduce the Kinder plateau again with a longer approach. HR ceiling stays at 155 bpm.",
    recommendations: [
      "If Week 1 long run felt strong at sub-155 bpm, you can extend Saturday to 15 km — otherwise hold at 12–13 km.",
      "Start tracking average HR drift: if avg HR on the same route drops vs Week 1, your AeT is rebuilding.",
      "Strength sessions: increase weight slightly on Romanian deadlifts if Week 1 felt too easy.",
      "Keep sleep at 7+ hrs — this is where the aerobic adaptations consolidate.",
      "No racing other runners on trails. Your pace is set by your HR monitor, not your ego.",
    ],
    days: [
      { day: "Sun", date: "5 Jul", label: "Trail Run", type: "easy", emoji: "🏃", summary: "8–10 km · 200 m+ · HR <155", tag: "TRAIL", tagColor: "#4ade80",
        preDetail: { title: "Sunday Trail Run", duration: "55–65 min", distance: "8–10 km", elevation: "200–250 m+", hrTarget: "140–155 bpm", shoes: "New Balance Summit SG or Merrell MTL Long Sky 2", terrain: "Rolling moorland trail — packed earth, moderate technical underfoot. Grades up to 15%. Hike above that.", routes: ["Lantern Pike loop — 8 km, 200 m+", "Chinley Churn — 9 km, 220 m+"], keyFocus: "Compare HR at same pace to Week 1 Sunday — looking for slight HR drop as a sign of AeT response." } },
      { day: "Mon", date: "6 Jul", label: "Rest", type: "rest", emoji: "🧘", summary: "Full rest", tag: "REST", tagColor: "#a78bfa",
        preDetail: { title: "Full Rest", duration: "—", distance: "—", elevation: "—", mobilityWork: ["10 min light stretching", "Focus on sleep quality"], keyFocus: "Two days running back-to-back earns a rest day." } },
      { day: "Tue", date: "7 Jul", label: "Strength + Run", type: "strength", emoji: "🏋️", summary: "Treadmill 4 km + 45 min S&C", tag: "STRENGTH", tagColor: "#f59e0b",
        preDetail: { title: "Treadmill + Strength", duration: "Treadmill 25 min + S&C 45 min", distance: "4 km", elevation: "0 m", hrTarget: "<150 bpm", shoes: "Kiprun KS900", terrain: "Indoor treadmill 0% incline.", strengthFocus: ["Single-leg glute bridges 4×12 each side", "Copenhagen adductor holds 4×20 sec", "Step-ups with knee drive 3×12 each leg", "Calf raises eccentric 3×15", "Dead bugs 3×12", "Pallof press 3×10 each side (add from W2)"], keyFocus: "Add Pallof press this week to begin rotational core stability for technical terrain." } },
      { day: "Wed", date: "8 Jul", label: "Easy Run", type: "easy", emoji: "🫁", summary: "5–6 km · flat · HR <150", tag: "RECOVERY", tagColor: "#60a5fa",
        preDetail: { title: "Easy Aerobic Run", duration: "32–40 min", distance: "5–6 km", elevation: "<60 m+", hrTarget: "<150 bpm", shoes: "Kiprun KS900", terrain: "Sett Valley Trail or Goyt towpath — flat, zero technical.", keyFocus: "Pure Z1/low-Z2. If you feel good, resist the urge to push." } },
      { day: "Thu", date: "9 Jul", label: "Strength + Run", type: "strength", emoji: "🏋️", summary: "Treadmill 5 km + 35 min S&C", tag: "STRENGTH", tagColor: "#f59e0b",
        preDetail: { title: "Treadmill + Strength", duration: "Treadmill 35 min + S&C 35 min", distance: "5 km", elevation: "0 m", hrTarget: "<152 bpm", shoes: "Kiprun KS900", terrain: "Indoor treadmill. Try 3×5 min at 6% incline if HR stays <152 bpm.", strengthFocus: ["Romanian deadlift 3×12 (increase weight vs W1)", "Lateral band walks 3×15", "Bulgarian split squat 3×10 each leg", "Plank 3×50 sec", "Reverse lunge with reach 3×12 each side"], keyFocus: "Incline on treadmill is your first vertical-specific prep without the ITB risk of real descent." } },
      { day: "Fri", date: "10 Jul", label: "Rest / Mobility", type: "rest", emoji: "🧘", summary: "Rest before long day", tag: "REST", tagColor: "#a78bfa",
        preDetail: { title: "Rest Day — Pre-Long", duration: "15 min mobility only", distance: "—", elevation: "—", mobilityWork: ["Hip flexor + quad stretch 3×60 sec", "Foam roll calves + ITB"], keyFocus: "Protect Saturday. No bonus runs." } },
      { day: "Sat", date: "11 Jul", label: "Long Mountain Day", type: "long", emoji: "⛰️", summary: "13–15 km · 450–550 m+ · 2h45–3h15", tag: "LONG", tagColor: "#f97316",
        preDetail: { title: "Long Aerobic Mountain Day — Peak District", duration: "2h45–3h15", distance: "13–15 km", elevation: "450–550 m+", hrTarget: "140–155 bpm. Hike all pitches >12%.", shoes: "New Balance Summit SG or Merrell MTL Long Sky 2", pack: "Kiprun 5L vest", terrain: "Open moorland — boggy sections, rocky edges, loose grit paths. Similar to Week 1 but longer approach.", routes: ["Edale → Kinder Scout → Hope Cross — 15 km, ~520 m+", "Hayfield → Kinder → Edale circular (with car shuttle) — 13 km, ~480 m+"], nutrition: "2–3 gels. 1.5L fluid. Eat every 40 min.", safety: "Full layer + map. Kinder can cloud over fast.", keyFocus: "Extend time on feet by 15–20 min vs Week 1. The extra distance is in the approach, not in pushing pace." } },
    ],
  },
  {
    number: 3, block: "Aerobic Rebuild", phase: 1,
    dates: "12 – 18 Jul 2026", hrCap: 158,
    totalKm: "~48–55 km", totalElev: "~1100–1300 m+", intensity: "Z2 dominant", strength: "×2",
    objective: "Final week of the aerobic rebuild phase. HR ceiling lifts slightly to 158 bpm — you may now run gradients up to ~18% if HR stays below. Long run extends to 15–17 km. Start feeling Snowdon-specific vertical in the legs.",
    recommendations: [
      "HR ceiling is 158 bpm this week — not a target, still a ceiling. Stay patient.",
      "The Saturday long run should feel moderately hard but not depleting. You should be eating and drinking throughout.",
      "Begin thinking about footwear for Snowdon — the TNF Vectiv Sky deserves a long test run this week.",
      "Strength volume holds steady — do not increase load this week, focus on quality of movement.",
      "Prioritise Snowdon race recon: look at elevation profile, plan your hike-run strategy for the event day.",
    ],
    days: [
      { day: "Sun", date: "12 Jul", label: "Trail Run", type: "easy", emoji: "🏃", summary: "10 km · 250 m+ · HR <158", tag: "TRAIL", tagColor: "#4ade80", preDetail: { title: "Sunday Trail Run", duration: "65–75 min", distance: "10 km", elevation: "250 m+", hrTarget: "140–158 bpm (new ceiling)", shoes: "The North Face Vectiv Sky — test run on this route", terrain: "Rolling moorland trail. Try the Vectiv Sky on this run to begin breaking it in for Snowdon.", routes: ["Lantern Pike + Cown Edge — 10 km, 260 m+"], keyFocus: "First run in the Vectiv Sky? Note feel, hotspots, toe box. This shoe will carry you on race day." } },
      { day: "Mon", date: "13 Jul", label: "Easy Run", type: "easy", emoji: "🫁", summary: "5 km · flat · HR <148", tag: "RECOVERY", tagColor: "#60a5fa", preDetail: { title: "Recovery Run", duration: "30–35 min", distance: "5 km", elevation: "<40 m+", hrTarget: "<148 bpm", shoes: "Kiprun KS900", terrain: "Sett Valley Trail — flat, zero technical.", keyFocus: "Flush the legs from Sunday. Keep it genuinely easy." } },
      { day: "Tue", date: "14 Jul", label: "Strength + Run", type: "strength", emoji: "🏋️", summary: "Treadmill 5 km + 40 min S&C", tag: "STRENGTH", tagColor: "#f59e0b", preDetail: { title: "Treadmill + Strength", duration: "Treadmill 35 min + S&C 40 min", distance: "5 km", elevation: "0 m", hrTarget: "<155 bpm. Try 8% incline for 2×8 min.", shoes: "Kiprun KS900 or KD900 Light", terrain: "Indoor treadmill. Progressive incline block.", strengthFocus: ["Single-leg glute bridges 4×15 each side", "Copenhagen holds 4×25 sec", "Step-ups with weight 3×12 each leg", "Eccentric calf raises 4×15", "Dead bugs 3×12", "Pallof press 3×12 each side"], keyFocus: "Incline on treadmill is preparing your hip flexors for Jacob's Ladder." } },
      { day: "Wed", date: "15 Jul", label: "Rest / Mobility", type: "rest", emoji: "🧘", summary: "Rest day", tag: "REST", tagColor: "#a78bfa", preDetail: { title: "Rest Day", duration: "20 min mobility", distance: "—", elevation: "—", mobilityWork: ["Full hip circuit — flexor, glute, pigeon", "Foam roll ITB + calves", "Foot rolling (plantar fascia prep for race)"], keyFocus: "3 weeks to race. Rest is earning fitness now." } },
      { day: "Thu", date: "16 Jul", label: "Strength + Run", type: "strength", emoji: "🏋️", summary: "Treadmill 6 km + 35 min S&C", tag: "STRENGTH", tagColor: "#f59e0b", preDetail: { title: "Final Strength Week — Peak Load", duration: "Treadmill 40 min + S&C 35 min", distance: "6 km", elevation: "0 m", hrTarget: "<155 bpm. 3×8 min at 8–10% incline.", shoes: "Kiprun KS900", terrain: "Indoor treadmill.", strengthFocus: ["Romanian deadlift 4×10 (peak load this block)", "Lateral band walks 3×15", "Bulgarian split squat 4×8 each leg", "Plank to push-up 3×8", "Single-leg calf raises eccentric 4×12"], keyFocus: "Last heavy strength week. Wks 4–7 shift to maintenance load only." } },
      { day: "Fri", date: "17 Jul", label: "Easy Run", type: "easy", emoji: "🫁", summary: "6 km · <100 m+ · HR <155", tag: "AEROBIC", tagColor: "#60a5fa", preDetail: { title: "Pre-Long Easy Run", duration: "38–44 min", distance: "6 km", elevation: "<100 m+", hrTarget: "<155 bpm", shoes: "Kiprun KS900", terrain: "Light rolling trail or road. Keep it comfortable.", keyFocus: "Keep something in reserve for Saturday — your biggest run of the block." } },
      { day: "Sat", date: "18 Jul", label: "Long Mountain Day", type: "long", emoji: "⛰️", summary: "15–17 km · 550–700 m+ · 3h–3h30", tag: "LONG", tagColor: "#f97316", preDetail: { title: "Peak Long Run — Block Capstone", duration: "3h–3h30", distance: "15–17 km", elevation: "550–700 m+", hrTarget: "140–158 bpm. Walk steep, run flats and descents controlled.", shoes: "The North Face Vectiv Sky — race shoe rehearsal", pack: "Kiprun 5L vest + mandatory kit simulation", terrain: "Technical mountain trail — rocky, sustained climbs, real descent load. This should feel like a Snowdon recon in spirit.", routes: ["Tryfan approach (North Wales — 1hr drive) — 14 km, ~650 m+, Grade 1 scramble sections", "Snowdon via Rhyd Ddu (recon) — 13 km, ~1000 m+ (only if feeling strong)", "Bleaklow from Glossop — 15 km, ~550 m+, technical moorland"], nutrition: "3 gels + real food. 2L fluid minimum. Caffeine gel in final third.", safety: "Full kit including waterproof. Inform someone of route.", keyFocus: "This is the dress rehearsal. Practice your race-day nutrition timing, your walk-run triggers, and your descent braking. Data from this run sets your Snowdon pacing plan." } },
    ],
  },
  {
    number: 4, block: "Vertical Loading", phase: 2,
    dates: "19 – 25 Jul 2026", hrCap: 160,
    totalKm: "~45–50 km", totalElev: "~1200–1400 m+", intensity: "Z2–Z3 on uphills", strength: "×1 (maintenance)",
    objective: "Phase shift. Aerobic base is established — now load the vertical. HR ceiling rises to 160 bpm on uphills. Introduce one quality uphill effort session mid-week. Strength drops to maintenance only. This is where race-specific fitness is built.",
    recommendations: [
      "HR cap rises to 160 bpm — but only on sustained uphill. Flat and descent sections: still sub-155 bpm.",
      "The quality uphill session (Wednesday) is your first controlled intensity since April. Start conservatively.",
      "Strength reduces to 1 session this week — focus on glute and ITB-protective exercises only.",
      "Begin practising race nutrition on all runs over 60 min: gel every 40 min from minute 30.",
      "Study the Snowdon SkyRace profile — identify the 3 key climb sections and their expected HR response.",
    ],
    days: [
      { day: "Sun", date: "19 Jul", label: "Trail Run", type: "easy", emoji: "🏃", summary: "10 km · 300 m+ · HR <160", tag: "TRAIL", tagColor: "#4ade80", preDetail: { title: "Sunday Trail Run", duration: "65–75 min", distance: "10 km", elevation: "300 m+", hrTarget: "140–160 bpm on uphills. Sub-155 on flat.", shoes: "The North Face Vectiv Sky", terrain: "Technical moorland — rocky climbs. First run at new HR ceiling. Feel the difference in effort.", routes: ["Kinder Scout plateau rim — 10 km, 300 m+"], keyFocus: "Notice how 160 bpm feels vs 155 bpm. Log the subjective effort difference." } },
      { day: "Mon", date: "20 Jul", label: "Recovery Run", type: "easy", emoji: "🫁", summary: "5 km flat · HR <145", tag: "RECOVERY", tagColor: "#60a5fa", preDetail: { title: "Recovery", duration: "30 min", distance: "5 km", elevation: "<40 m+", hrTarget: "<145 bpm", shoes: "Kiprun KS900", terrain: "Sett Valley flat.", keyFocus: "True recovery. No heroics." } },
      { day: "Tue", date: "21 Jul", label: "Strength (Maintenance)", type: "strength", emoji: "🏋️", summary: "40 min S&C · No treadmill", tag: "STRENGTH", tagColor: "#f59e0b", preDetail: { title: "Maintenance Strength", duration: "40 min S&C only", distance: "—", elevation: "—", strengthFocus: ["Single-leg glute bridges 3×12", "Copenhagen holds 3×20 sec", "Step-ups 3×10 each leg", "Eccentric calf raises 3×15", "Pallof press 3×10 each side"], keyFocus: "Maintain neuromuscular quality. This is not a training stimulus — it's injury prevention." } },
      { day: "Wed", date: "22 Jul", label: "Uphill Quality", type: "long", emoji: "📈", summary: "8 km · 350 m+ · quality uphills", tag: "QUALITY", tagColor: "#f97316", preDetail: { title: "Uphill Quality Session — First Intensity", duration: "60–70 min", distance: "8 km", elevation: "350 m+", hrTarget: "Uphills: push to 160–163 bpm. Recovery: drop to <145 bpm before next effort.", shoes: "New Balance Summit SG or Merrell MTL Long Sky 2", terrain: "Kinder Scout or Lantern Pike — steep, consistent gradient. 5–8 min climb efforts. Technical underfoot but no scrambling.", routes: ["Lantern Pike repeats — 4×8 min climb (2:30 min+, 18–22% grade)", "Jacob's Ladder effort — 3×12 min sustained climb"], keyFocus: "First real intensity since April. Do not bury yourself. Effort should feel hard but controlled — you should be able to speak in short sentences." } },
      { day: "Thu", date: "23 Jul", label: "Easy Run", type: "easy", emoji: "🫁", summary: "6 km · flat · HR <150", tag: "RECOVERY", tagColor: "#60a5fa", preDetail: { title: "Recovery Run Post-Quality", duration: "38–42 min", distance: "6 km", elevation: "<60 m+", hrTarget: "<150 bpm", shoes: "Kiprun KS900", terrain: "Sett Valley or Goyt towpath.", keyFocus: "Flush Wednesday. Legs may feel heavy — that is adaptation." } },
      { day: "Fri", date: "24 Jul", label: "Rest", type: "rest", emoji: "🧘", summary: "Rest before biggest long run", tag: "REST", tagColor: "#a78bfa", preDetail: { title: "Rest Day", duration: "—", distance: "—", elevation: "—", mobilityWork: ["Hip + glute circuit 20 min", "Foot care — check for hotspots from Vectiv Sky"], keyFocus: "Saturday is important. Protect it." } },
      { day: "Sat", date: "25 Jul", label: "Long Mountain Day", type: "long", emoji: "⛰️", summary: "16–18 km · 700–900 m+ · 3h30", tag: "LONG", tagColor: "#f97316", preDetail: { title: "Long Vertical Day — Race Simulation", duration: "3h–3h45", distance: "16–18 km", elevation: "700–900 m+", hrTarget: "Climbs: up to 163 bpm. Flat: 145–155 bpm. Descents: controlled, <155 bpm.", shoes: "The North Face Vectiv Sky", pack: "Kiprun 5L with full race kit", terrain: "North Wales preferred (1hr drive). Technical mountain trail — sustained ascent, rocky technical descent. Similar character to Snowdon SkyRace.", routes: ["Snowdon via Pyg Track + descent Rhyd Ddu — 13 km, ~1050 m+ (race recon priority)", "Tryfan + Glyder Fach — 14 km, ~900 m+, Grade 1 scramble, more technical"], nutrition: "Full race nutrition simulation: gel every 40 min from min 30. 2L fluid.", safety: "Full mandatory kit. Someone knows your route and expected return.", keyFocus: "If you choose the Snowdon Pyg Track route — this IS your race recon. Note the terrain, exposure, technical sections. Walk what you will walk on race day. This data is more valuable than any training number." } },
    ],
  },
  {
    number: 5, block: "Vertical Loading", phase: 2,
    dates: "26 Jul – 1 Aug 2026", hrCap: 163,
    totalKm: "~40–45 km", totalElev: "~1000–1200 m+", intensity: "Z2–Z3 quality", strength: "×1 (maintenance)",
    objective: "Final hard week before the taper. Volume dips slightly but quality sharpens. HR ceiling reaches 163 bpm on quality uphill efforts. One more big mountain day. After Saturday, the body needs to recover — the taper begins next week.",
    recommendations: [
      "This is the last week to accumulate fatigue — the taper will wash it away, revealing the fitness underneath.",
      "Quality uphill session: push harder than Week 4. You should reach 160–163 bpm on efforts.",
      "Final long day should end feeling strong, not depleted — that is the sign you've paced it right.",
      "Race kit check: confirm shoes, vest, mandatory kit. Nothing new on race day.",
      "Begin dialling in race-day routine: breakfast timing, caffeine strategy, warm-up protocol.",
    ],
    days: [
      { day: "Sun", date: "26 Jul", label: "Trail Run", type: "easy", emoji: "🏃", summary: "10 km · 300 m+ · HR <160", tag: "TRAIL", tagColor: "#4ade80", preDetail: { title: "Sunday Trail Run", duration: "65–70 min", distance: "10 km", elevation: "300 m+", hrTarget: "140–160 bpm on climbs", shoes: "The North Face Vectiv Sky", terrain: "Technical moorland — use the race shoe.", routes: ["Kinder plateau rim — 10 km, 300 m+"], keyFocus: "Note how your legs feel after last week's big day. That fatigue is fitness being built." } },
      { day: "Mon", date: "27 Jul", label: "Rest", type: "rest", emoji: "🧘", summary: "Full rest", tag: "REST", tagColor: "#a78bfa", preDetail: { title: "Full Rest", duration: "—", distance: "—", elevation: "—", mobilityWork: ["Light hip stretching", "Sleep priority"], keyFocus: "The taper starts next week. Absorb this week's load first." } },
      { day: "Tue", date: "28 Jul", label: "Uphill Quality", type: "long", emoji: "📈", summary: "7 km · 320 m+ · quality session", tag: "QUALITY", tagColor: "#f97316", preDetail: { title: "Uphill Quality — Peak Intensity Week", duration: "55–65 min", distance: "7 km", elevation: "320 m+", hrTarget: "Efforts: 160–163 bpm. Recovery: <145 bpm.", shoes: "New Balance Summit SG", terrain: "Steep consistent gradient. Kinder or Lantern Pike.", routes: ["5×8 min uphill efforts — Lantern Pike or Kinder Low approach", "3×14 min Jacob's Ladder sustained"], keyFocus: "Push harder than Week 4 Wednesday. This is the final quality stimulus before taper." } },
      { day: "Wed", date: "29 Jul", label: "Easy Recovery", type: "easy", emoji: "🫁", summary: "5 km · flat · HR <145", tag: "RECOVERY", tagColor: "#60a5fa", preDetail: { title: "Recovery Run", duration: "30 min", distance: "5 km", elevation: "<40 m+", hrTarget: "<145 bpm", shoes: "Kiprun KS900", terrain: "Sett Valley flat.", keyFocus: "Legs will be heavy. Walk if needed." } },
      { day: "Thu", date: "30 Jul", label: "Strength (Maintenance)", type: "strength", emoji: "🏋️", summary: "35 min S&C", tag: "STRENGTH", tagColor: "#f59e0b", preDetail: { title: "Maintenance Strength", duration: "35 min", distance: "—", elevation: "—", strengthFocus: ["Single-leg glute bridges 3×12", "Copenhagen holds 3×20 sec", "Eccentric calf raises 3×12", "Dead bugs 3×10"], keyFocus: "Last strength session of the block. Keep it light and quality-focused." } },
      { day: "Fri", date: "31 Jul", label: "Rest", type: "rest", emoji: "🧘", summary: "Rest before final long run", tag: "REST", tagColor: "#a78bfa", preDetail: { title: "Rest Day", duration: "—", distance: "—", elevation: "—", mobilityWork: ["Full hip and calf circuit", "Foot care check"], keyFocus: "Final big day tomorrow. Eat well and sleep well tonight." } },
      { day: "Sat", date: "1 Aug", label: "Final Long Day", type: "long", emoji: "⛰️", summary: "15–17 km · 700–800 m+ · 3h15", tag: "LONG", tagColor: "#f97316", preDetail: { title: "Final Long Mountain Day — Last Hard Effort", duration: "3h–3h30", distance: "15–17 km", elevation: "700–800 m+", hrTarget: "Race-like effort: climbs to 163 bpm, flats 145–155, descents controlled.", shoes: "The North Face Vectiv Sky", pack: "Full race simulation kit", terrain: "North Wales or Peak District — technical mountain trail. Snowdon Pyg Track again strongly recommended as final recon.", routes: ["Snowdon Pyg Track recon — cement race-day strategy", "Tryfan approach — 14 km, ~850 m+"], nutrition: "Full race nutrition. Practice your gel timing to the second.", keyFocus: "End this run feeling you could do another 2 hours slowly. If you finish depleted, you went too hard — adjust race pacing plan accordingly." } },
    ],
  },
  {
    number: 6, block: "Taper", phase: 3,
    dates: "2 – 8 Aug 2026", hrCap: 160,
    totalKm: "~25–30 km", totalElev: "~400–600 m+", intensity: "Z2 + strides", strength: "None",
    objective: "Volume drops 40%. Keep intensity alive with short sharp efforts — legs must not forget what fast feels like. No more fitness can be built. Every session this week is about feeling sharp, not building load. Protect the body.",
    recommendations: [
      "Volume halves — this is intentional. Trust the process. The fatigue is lifting.",
      "Include 4–6 short strides (20–30 sec) at the end of easy runs to keep leg turnover sharp.",
      "Zero strength work this week. The muscles are loaded enough.",
      "Begin race logistics: drive to Snowdon, kit check, number pickup date, accommodation.",
      "Manage anxiety by focusing on process — not result. You are ready for a long day in the mountains.",
    ],
    days: [
      { day: "Sun", date: "2 Aug", label: "Easy Trail Run", type: "easy", emoji: "🏃", summary: "8 km · 200 m+ · HR <155", tag: "TRAIL", tagColor: "#4ade80", preDetail: { title: "Taper Opener", duration: "50–55 min", distance: "8 km", elevation: "200 m+", hrTarget: "<155 bpm", shoes: "The North Face Vectiv Sky", terrain: "Familiar local trail. Nothing new.", keyFocus: "Last week's hard work is done. Begin letting go of the load." } },
      { day: "Mon", date: "3 Aug", label: "Rest", type: "rest", emoji: "🧘", summary: "Full rest", tag: "REST", tagColor: "#a78bfa", preDetail: { title: "Rest", duration: "—", distance: "—", elevation: "—", mobilityWork: ["Light stretching only"], keyFocus: "Sleep. Eat. Hydrate." } },
      { day: "Tue", date: "4 Aug", label: "Aerobic + Strides", type: "easy", emoji: "🫁", summary: "6 km + 6× strides", tag: "AEROBIC", tagColor: "#60a5fa", preDetail: { title: "Easy Run + Strides", duration: "40 min", distance: "6 km", elevation: "<60 m+", hrTarget: "<150 bpm easy. Strides: 20–30 sec at 5km pace, full recovery between.", shoes: "Kiprun KD900 Light or KS900", terrain: "Flat road or towpath.", keyFocus: "Strides remind your neuromuscular system that speed exists. 6× at the end of the run." } },
      { day: "Wed", date: "5 Aug", label: "Rest", type: "rest", emoji: "🧘", summary: "Rest", tag: "REST", tagColor: "#a78bfa", preDetail: { title: "Rest Day", duration: "—", distance: "—", elevation: "—", mobilityWork: ["Hip + calf light circuit"], keyFocus: "Mentally rehearse the race start. Walk the first km in your mind." } },
      { day: "Thu", date: "6 Aug", label: "Short Trail Run", type: "easy", emoji: "🏃", summary: "5 km · 150 m+ · HR <155", tag: "TRAIL", tagColor: "#4ade80", preDetail: { title: "Short Sharp Trail", duration: "35 min", distance: "5 km", elevation: "150 m+", hrTarget: "<155 bpm", shoes: "The North Face Vectiv Sky", terrain: "Brief hill trail — include one short steep climb at race effort.", keyFocus: "Wake the legs up. Include 2 min at race effort on the climb." } },
      { day: "Fri", date: "7 Aug", label: "Rest", type: "rest", emoji: "🧘", summary: "Travel day / Full rest", tag: "REST", tagColor: "#a78bfa", preDetail: { title: "Travel Day", duration: "—", distance: "—", elevation: "—", mobilityWork: ["Walk 20 min easy", "Hydrate aggressively all day"], keyFocus: "Travel to Snowdonia. Kit check. Early dinner and bed by 9pm." } },
      { day: "Sat", date: "8 Aug", label: "Race Prep Walk", type: "rest", emoji: "🎯", summary: "10 min shakeout + kit check", tag: "PRE-RACE", tagColor: "#f97316", preDetail: { title: "Pre-Race Shakeout", duration: "10–15 min walk/jog", distance: "<2 km", elevation: "minimal", hrTarget: "No HR target. Very easy.", shoes: "The North Face Vectiv Sky", keyFocus: "10 min easy jog or brisk walk. Just to move the legs. Check kit one final time. Sleep by 9pm." } },
    ],
  },
  {
    number: 7, block: "Race Week", phase: 3,
    dates: "9 – 15 Aug 2026", hrCap: 163,
    totalKm: "Race day", totalElev: "3,150 m+", intensity: "Race", strength: "None",
    objective: "The work is done. This week is about arriving at the start line with fresh legs, a clear head, and a solid plan. Race day on Saturday 15 August. Target: finish strong and enjoy a long day in the mountains.",
    recommendations: [
      "Mon–Thu: maximum 3 easy runs of 3–4 km. No elevation. No effort.",
      "Race morning: familiar breakfast 2.5 hrs before start. No new food.",
      "First 5 km of the race: ignore pace. Run by HR. Start conservative.",
      "Hike all steep pitches in the first half — you know this from training.",
      "Smile at the summit. You earned it.",
    ],
    days: [
      { day: "Sun", date: "9 Aug", label: "Rest", type: "rest", emoji: "🧘", summary: "Full rest", tag: "REST", tagColor: "#a78bfa", preDetail: { title: "Full Rest", duration: "—", distance: "—", elevation: "—", keyFocus: "Legs up. Eat well. Hydrate." } },
      { day: "Mon", date: "10 Aug", label: "Very Easy Jog", type: "easy", emoji: "🫁", summary: "3–4 km · flat · HR <140", tag: "EASY", tagColor: "#60a5fa", preDetail: { title: "Light Leg Flush", duration: "20 min", distance: "3–4 km", elevation: "<20 m+", hrTarget: "<140 bpm", shoes: "Any comfortable shoe", terrain: "Flat road only.", keyFocus: "Keep the legs ticking. Nothing more." } },
      { day: "Tue", date: "11 Aug", label: "Rest", type: "rest", emoji: "🧘", summary: "Rest", tag: "REST", tagColor: "#a78bfa", preDetail: { title: "Rest", duration: "—", distance: "—", elevation: "—", keyFocus: "Walk 20 min. Hydrate. Sleep." } },
      { day: "Wed", date: "12 Aug", label: "Very Easy Jog", type: "easy", emoji: "🫁", summary: "3 km · flat · + 4 strides", tag: "EASY", tagColor: "#60a5fa", preDetail: { title: "Final Leg Activation", duration: "20 min", distance: "3 km", elevation: "<10 m+", hrTarget: "<140 bpm + 4 strides at race pace", shoes: "The North Face Vectiv Sky", terrain: "Flat only.", keyFocus: "4 strides at race pace. This reminds the legs what the job is." } },
      { day: "Thu", date: "13 Aug", label: "Rest", type: "rest", emoji: "🧘", summary: "Rest / travel", tag: "REST", tagColor: "#a78bfa", preDetail: { title: "Rest Day", duration: "—", distance: "—", elevation: "—", keyFocus: "If not already in Snowdonia: travel today. Walk registration area. Eat carbs all day." } },
      { day: "Fri", date: "14 Aug", label: "Race Eve", type: "rest", emoji: "🎯", summary: "Kit check · Early bed", tag: "PRE-RACE", tagColor: "#f97316", preDetail: { title: "Race Eve Protocol", duration: "10 min shakeout walk only", distance: "<1 km", elevation: "—", keyFocus: "Lay out every piece of kit the night before. Confirm mandatory gear. Dinner at 6pm. In bed by 9pm. Trust the training." } },
      { day: "Sat", date: "15 Aug", label: "🏁 RACE DAY", type: "long", emoji: "🏔️", summary: "38 km · 3,150 m+ · Snowdon SkyRace", tag: "RACE", tagColor: "#f97316", preDetail: { title: "Snowdon SkyRace — Race Day", duration: "Target: finish strong", distance: "38 km", elevation: "3,150 m+", hrTarget: "Climbs: up to 163 bpm. Flats: 145–155. Descents: controlled, protect ITB.", shoes: "The North Face Vectiv Sky", pack: "Mandatory kit + race vest", terrain: "Technical mountain trail — Snowdonia. Rocky ridgelines, sustained ascents, technical descents. This is what every session in this block was preparing for.", keyFocus: "You have done the work. Run your plan. Hike the steep stuff. Eat every 40 min. Enjoy the mountains. This is a long day in the mountains — and you are ready for it." } },
    ],
  },
];

// ─── STYLE CONSTANTS ──────────────────────────────────────────────────────────
const TYPE_STYLES = {
  done:     { bg: "rgba(74,222,128,0.09)",  border: "#4ade80", accent: "#4ade80" },
  easy:     { bg: "rgba(96,165,250,0.08)",  border: "#60a5fa", accent: "#60a5fa" },
  strength: { bg: "rgba(245,158,11,0.08)",  border: "#f59e0b", accent: "#f59e0b" },
  rest:     { bg: "rgba(167,139,250,0.07)", border: "#a78bfa", accent: "#a78bfa" },
  long:     { bg: "rgba(249,115,22,0.09)",  border: "#f97316", accent: "#f97316" },
};
const PHASE_COLORS = ["#60a5fa", "#f97316", "#a78bfa"];
const PHASE_LABELS = ["Aerobic Rebuild", "Vertical Loading", "Taper / Race"];

// ─── GITHUB SESSIONS SYNC ─────────────────────────────────────────────────────
async function fetchGhSessions() {
  const res = await ghGet(GH_STATE);
  if (!res) return null;
  try { return JSON.parse(res.content); } catch { return null; }
}

async function pushGhSessions(data, sha) {
  return ghPut(GH_STATE, JSON.stringify(data, null, 2), sha, "Update session completions");
}

// ─── AI COACHING ──────────────────────────────────────────────────────────────
async function fetchCoachComment(day, result) {
  const prompt = `You are an elite running coach. Analyse this completed training session for Clément Savalle-Anthonioz, an experienced trail runner (9yr history, HM PR 1h35, FTP 200W, 70kg) targeting the Snowdon SkyRace (38km/3150m+) on 15 Aug 2026.

Session: ${day.label} on ${day.date}
Planned: ${JSON.stringify(day.preDetail)}
Actual result: ${JSON.stringify(result)}

Write a 2-3 sentence coaching debrief. Be direct, analytical, and specific to the data. Reference the HR cap and what it means for adaptation. End with one precise tactical instruction for the next session. No generic praise. No emojis.`;
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, messages: [{ role: "user", content: prompt }] }),
  });
  const data = await resp.json();
  return data.content?.[0]?.text || "Analysis unavailable.";
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────
function Tag({ label, color }) {
  return <span style={{ fontSize:"0.58rem", fontWeight:700, letterSpacing:"0.1em", color, border:`1px solid ${color}`, borderRadius:3, padding:"1px 6px", fontFamily:"monospace" }}>{label}</span>;
}

function StatBox({ label, value }) {
  return (
    <div style={{ background:"#12151f", borderRadius:8, padding:"0.7rem 0.5rem", textAlign:"center", border:"1px solid #1e2535" }}>
      <div style={{ fontSize:"0.55rem", color:"#64748b", letterSpacing:"0.08em", fontFamily:"monospace", marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:"0.88rem", fontWeight:700, color:"#f1f5f9" }}>{value}</div>
    </div>
  );
}

function SyncBadge({ status }) {
  const cfg = {
    syncing: { color:"#f59e0b", label:"⟳ syncing" },
    synced:  { color:"#4ade80", label:"✓ GitHub" },
    offline: { color:"#64748b", label:"○ local"  },
    error:   { color:"#f87171", label:"✗ sync error" },
  }[status] || { color:"#64748b", label:"—" };
  return (
    <span style={{ fontSize:"0.55rem", fontFamily:"monospace", color: cfg.color, border:`1px solid ${cfg.color}40`, borderRadius:3, padding:"2px 6px" }}>
      {cfg.label}
    </span>
  );
}

function LogForm({ day, onSubmit, onCancel }) {
  const [form, setForm] = useState({ distance:"", duration:"", elevation:"", avgHR:"", peakHR:"", notes:"" });
  const s = TYPE_STYLES[day.type] || TYPE_STYLES.easy;
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const inp = { background:"#12151f", border:"1px solid #1e2535", borderRadius:6, padding:"0.5rem 0.75rem", color:"#f1f5f9", fontSize:"0.83rem", width:"100%", boxSizing:"border-box", fontFamily:"inherit" };
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
      <div style={{ fontSize:"0.6rem", color:s.accent, letterSpacing:"0.1em", fontFamily:"monospace", fontWeight:700 }}>LOG THIS SESSION</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"0.5rem" }}>
        {[["Distance (km)","distance"],["Duration","duration"],["Elevation (m+)","elevation"]].map(([l,k])=>(
          <div key={k}><div style={{ fontSize:"0.55rem", color:"#64748b", fontFamily:"monospace", marginBottom:3 }}>{l}</div><input style={inp} value={form[k]} onChange={e=>set(k,e.target.value)} placeholder="—" /></div>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.5rem" }}>
        {[["Avg HR (bpm)","avgHR"],["Peak HR (bpm)","peakHR"]].map(([l,k])=>(
          <div key={k}><div style={{ fontSize:"0.55rem", color:"#64748b", fontFamily:"monospace", marginBottom:3 }}>{l}</div><input style={inp} value={form[k]} onChange={e=>set(k,e.target.value)} placeholder="—" /></div>
        ))}
      </div>
      <div><div style={{ fontSize:"0.55rem", color:"#64748b", fontFamily:"monospace", marginBottom:3 }}>NOTES</div>
        <textarea style={{...inp, resize:"vertical", minHeight:60}} value={form.notes} onChange={e=>set("notes",e.target.value)} placeholder="How did it feel? Any issues?" />
      </div>
      <div style={{ display:"flex", gap:"0.5rem" }}>
        <button onClick={()=>onSubmit(form)} style={{ flex:1, background:s.accent, border:"none", borderRadius:6, padding:"0.6rem", fontWeight:700, fontSize:"0.8rem", color:"#080b12", cursor:"pointer" }}>Mark Complete ✓</button>
        <button onClick={onCancel} style={{ background:"transparent", border:"1px solid #334155", borderRadius:6, padding:"0.6rem 1rem", color:"#64748b", fontSize:"0.8rem", cursor:"pointer" }}>Cancel</button>
      </div>
    </div>
  );
}

function DayModal({ day, sessionData, onClose, onLog, onUnlog }) {
  const s = TYPE_STYLES[day.type] || TYPE_STYLES.easy;
  const isCompleted = !!sessionData?.completed;
  const [showLog, setShowLog] = useState(false);
  const [aiComment, setAiComment] = useState(sessionData?.aiComment || null);
  const [loadingAI, setLoadingAI] = useState(false);
  const d = day.preDetail;
  const result = sessionData?.result || day.result;

  async function handleSubmit(form) {
    setLoadingAI(true); setShowLog(false);
    const comment = await fetchCoachComment(day, form);
    setAiComment(comment);
    onLog({ ...form, aiComment: comment });
    setLoadingAI(false);
  }

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", backdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:"1rem" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"#0d1018", border:`1px solid ${s.border}`, borderRadius:14, padding:"2rem", maxWidth:580, width:"100%", maxHeight:"88vh", overflowY:"auto", boxShadow:`0 0 60px ${s.border}25` }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"1.5rem" }}>
          <div>
            <div style={{ fontSize:"0.6rem", letterSpacing:"0.12em", color:s.accent, fontFamily:"monospace", marginBottom:5 }}>{day.day} · {day.date}</div>
            <div style={{ fontSize:"1.15rem", fontWeight:800, color:"#f1f5f9", lineHeight:1.2 }}>{d?.title || day.label}</div>
            {isCompleted && <div style={{ marginTop:4 }}><Tag label="✓ COMPLETED" color="#4ade80" /></div>}
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#475569", fontSize:"1.5rem", cursor:"pointer" }}>×</button>
        </div>

        {isCompleted && result ? (
          <>
            <div style={{ marginBottom:"1rem" }}>
              <div style={{ fontSize:"0.6rem", color:"#4ade80", letterSpacing:"0.1em", fontFamily:"monospace", fontWeight:700, marginBottom:8 }}>ACTUAL RESULTS</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:"0.6rem" }}>
                {[["Distance",result.distance],["Duration",result.duration],["Elevation",result.elevation],["Avg HR",result.avgHR],["Peak HR",result.peakHR],["Avg Power",result.avgWatts],["Cadence / RPE",result.cadence]].filter(([,v])=>v).map(([k,v])=>(<StatBox key={k} label={k} value={v} />))}
              </div>
            </div>
            {result.notes && (
              <div style={{ marginBottom:"1rem" }}>
                <div style={{ fontSize:"0.6rem", color:"#64748b", letterSpacing:"0.08em", fontFamily:"monospace", marginBottom:4 }}>YOUR NOTES</div>
                <div style={{ fontSize:"0.83rem", color:"#94a3b8", lineHeight:1.6, fontStyle:"italic" }}>"{result.notes}"</div>
              </div>
            )}
            <div style={{ background:"rgba(74,222,128,0.07)", border:"1px solid rgba(74,222,128,0.25)", borderRadius:10, padding:"1rem 1.1rem", marginBottom:"1rem" }}>
              <div style={{ fontSize:"0.6rem", color:"#4ade80", letterSpacing:"0.1em", fontFamily:"monospace", fontWeight:700, marginBottom:6 }}>🧠 COACH'S DEBRIEF</div>
              {loadingAI
                ? <div style={{ fontSize:"0.83rem", color:"#64748b", fontStyle:"italic" }}>Analysing your session...</div>
                : <div style={{ fontSize:"0.84rem", color:"#f1f5f9", lineHeight:1.7 }}>{aiComment || result.comment || "No coaching comment yet."}</div>}
            </div>
            <button onClick={onUnlog} style={{ background:"transparent", border:"1px solid #334155", borderRadius:6, padding:"0.5rem 1rem", color:"#64748b", fontSize:"0.75rem", cursor:"pointer" }}>↩ Undo — mark incomplete</button>
          </>
        ) : (
          <>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:"0.6rem", marginBottom:"1.25rem" }}>
              {[["Distance",d?.distance],["Duration",d?.duration],["Elevation",d?.elevation]].filter(([,v])=>v&&v!=="—").map(([k,v])=>(<StatBox key={k} label={k} value={v} />))}
            </div>
            {[["HR Target",d?.hrTarget],["Shoes",d?.shoes],["Terrain",d?.terrain],["Nutrition",d?.nutrition],["Safety",d?.safety]].filter(([,v])=>v&&v!=="—").map(([k,v])=>(
              <div key={k} style={{ marginBottom:"0.9rem" }}>
                <div style={{ fontSize:"0.58rem", color:s.accent, letterSpacing:"0.1em", fontFamily:"monospace", fontWeight:700, marginBottom:3 }}>{k}</div>
                <div style={{ fontSize:"0.83rem", color:"#cbd5e1", lineHeight:1.6 }}>{v}</div>
              </div>
            ))}
            {(d?.routes||[]).length>0 && (
              <div style={{ marginBottom:"0.9rem" }}>
                <div style={{ fontSize:"0.58rem", color:s.accent, letterSpacing:"0.1em", fontFamily:"monospace", fontWeight:700, marginBottom:6 }}>ROUTE OPTIONS</div>
                {d.routes.map((r,i)=>(<div key={i} style={{ display:"flex", gap:8, marginBottom:5 }}><span style={{ color:s.accent, fontFamily:"monospace", fontSize:"0.65rem", marginTop:2, flexShrink:0 }}>→</span><span style={{ fontSize:"0.82rem", color:"#cbd5e1", lineHeight:1.5 }}>{r}</span></div>))}
              </div>
            )}
            {(d?.strengthFocus||d?.mobilityWork||[]).length>0 && (
              <div style={{ marginBottom:"0.9rem" }}>
                <div style={{ fontSize:"0.58rem", color:s.accent, letterSpacing:"0.1em", fontFamily:"monospace", fontWeight:700, marginBottom:6 }}>{d?.strengthFocus?"STRENGTH CIRCUIT":"MOBILITY CIRCUIT"}</div>
                {(d?.strengthFocus||d?.mobilityWork).map((ex,i)=>(<div key={i} style={{ display:"flex", gap:8, marginBottom:5 }}><span style={{ color:s.accent, fontFamily:"monospace", fontSize:"0.65rem", minWidth:18 }}>{String(i+1).padStart(2,"0")}</span><span style={{ fontSize:"0.82rem", color:"#cbd5e1", lineHeight:1.4 }}>{ex}</span></div>))}
              </div>
            )}
            {d?.keyFocus && !showLog && (
              <div style={{ background:s.bg, border:`1px solid ${s.border}`, borderRadius:8, padding:"0.9rem 1rem", marginBottom:"1.25rem" }}>
                <div style={{ fontSize:"0.58rem", color:s.accent, letterSpacing:"0.1em", fontFamily:"monospace", fontWeight:700, marginBottom:4 }}>COACH'S NOTE</div>
                <div style={{ fontSize:"0.83rem", color:"#f1f5f9", lineHeight:1.6 }}>{d.keyFocus}</div>
              </div>
            )}
            {showLog
              ? <LogForm day={day} onSubmit={handleSubmit} onCancel={()=>setShowLog(false)} />
              : <button onClick={()=>setShowLog(true)} style={{ width:"100%", background:s.accent, border:"none", borderRadius:8, padding:"0.75rem", fontWeight:700, fontSize:"0.85rem", color:"#080b12", cursor:"pointer", marginTop:4 }}>✓ Mark as Complete</button>}
            {loadingAI && <div style={{ textAlign:"center", marginTop:"1rem", fontSize:"0.8rem", color:"#64748b", fontStyle:"italic" }}>Getting coach analysis...</div>}
          </>
        )}
      </div>
    </div>
  );
}

function DayTile({ day, sessionData, onClick }) {
  const isCompleted = !!sessionData?.completed;
  const s = TYPE_STYLES[isCompleted?"done":day.type] || TYPE_STYLES.easy;
  const result = sessionData?.result || day.result;
  return (
    <button onClick={onClick} style={{ all:"unset", cursor:"pointer", display:"flex", flexDirection:"column", background:s.bg, border:`1px solid ${isCompleted?s.border:"#1a2030"}`, borderRadius:10, padding:"1rem", gap:"0.45rem", transition:"all 0.18s ease", textAlign:"left", position:"relative", overflow:"hidden", minHeight:130 }}
      onMouseEnter={e=>{e.currentTarget.style.border=`1px solid ${s.border}`;e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 8px 28px ${s.border}22`;}}
      onMouseLeave={e=>{e.currentTarget.style.border=isCompleted?`1px solid ${s.border}`:"1px solid #1a2030";e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";}}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:s.border, borderRadius:"10px 10px 0 0" }} />
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div><span style={{ fontSize:"0.72rem", fontWeight:700, color:"#94a3b8", fontFamily:"monospace" }}>{day.day}</span><span style={{ fontSize:"0.62rem", color:"#475569", fontFamily:"monospace", marginLeft:6 }}>{day.date}</span></div>
        <span style={{ fontSize:"1rem" }}>{isCompleted?"✅":day.emoji}</span>
      </div>
      <div style={{ fontSize:"0.85rem", fontWeight:700, color:isCompleted?"#4ade80":"#f1f5f9", lineHeight:1.2 }}>{day.label}</div>
      {isCompleted&&result
        ? <div style={{ fontSize:"0.68rem", color:"#4ade80", fontFamily:"monospace", lineHeight:1.4 }}>{[result.distance,result.duration,result.elevation].filter(Boolean).join(" · ")}</div>
        : <div style={{ fontSize:"0.68rem", color:"#64748b", lineHeight:1.4, fontFamily:"monospace" }}>{day.summary}</div>}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:"auto", paddingTop:4 }}>
        <Tag label={isCompleted?"DONE":day.tag} color={s.accent} />
        <span style={{ fontSize:"0.58rem", color:"#2a3548", fontFamily:"monospace" }}>tap →</span>
      </div>
    </button>
  );
}

function ProgressBar({ days, weekSessions }) {
  const completable = days.filter(d=>d.type!=="rest").length;
  const done = days.filter(d=>weekSessions[d.day+d.date]?.completed).length;
  const pct = completable>0?Math.round((done/completable)*100):0;
  const barColor = pct===100?"#4ade80":pct>=60?"#f97316":"#60a5fa";
  return (
    <div style={{ marginBottom:"1.5rem" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
        <span style={{ fontSize:"0.6rem", color:"#64748b", fontFamily:"monospace", letterSpacing:"0.08em" }}>WEEK PROGRESS</span>
        <span style={{ fontSize:"0.7rem", fontWeight:700, color:barColor, fontFamily:"monospace" }}>{done}/{completable} sessions · {pct}%</span>
      </div>
      <div style={{ height:6, background:"#1a2030", borderRadius:99, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${pct}%`, background:barColor, borderRadius:99, transition:"width 0.5s ease", boxShadow:pct>0?`0 0 10px ${barColor}60`:"none" }} />
      </div>
    </div>
  );
}

function WeekSelector({ weeks, currentIdx, onSelect }) {
  return (
    <div style={{ display:"flex", gap:"0.35rem", flexWrap:"wrap", marginBottom:"1.5rem" }}>
      {weeks.map((w,i)=>{
        const pc=PHASE_COLORS[w.phase-1];
        const isActive=i===currentIdx;
        return (
          <button key={i} onClick={()=>onSelect(i)} style={{ all:"unset", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", padding:"0.45rem 0.65rem", borderRadius:7, border:`1px solid ${isActive?pc:"#1e2535"}`, background:isActive?`${pc}18`:"transparent", transition:"all 0.15s ease", minWidth:44 }}
            onMouseEnter={e=>{if(!isActive){e.currentTarget.style.border=`1px solid ${pc}80`;e.currentTarget.style.background=`${pc}08`;}}}
            onMouseLeave={e=>{if(!isActive){e.currentTarget.style.border="1px solid #1e2535";e.currentTarget.style.background="transparent";}}}>
            <span style={{ fontSize:"0.6rem", fontWeight:700, color:isActive?pc:"#475569", fontFamily:"monospace" }}>W{w.number}</span>
            <span style={{ fontSize:"0.5rem", color:isActive?pc:"#334155", fontFamily:"monospace", textAlign:"center", lineHeight:1.2, marginTop:2, maxWidth:50 }}>{w.block.split(" ")[0]}</span>
          </button>
        );
      })}
    </div>
  );
}

function CountdownBadge() {
  const diff = Math.ceil((new Date("2026-08-15")-new Date())/(1000*60*60*24));
  const color = diff<=7?"#f97316":diff<=21?"#f59e0b":"#60a5fa";
  return (
    <div style={{ textAlign:"right" }}>
      <div style={{ fontSize:"0.55rem", color:"#475569", fontFamily:"monospace", letterSpacing:"0.08em", marginBottom:3 }}>RACE DAY</div>
      <div style={{ fontSize:"2rem", fontWeight:900, color, letterSpacing:"-0.03em", lineHeight:1 }}>{diff}</div>
      <div style={{ fontSize:"0.6rem", color:"#475569", fontFamily:"monospace" }}>days</div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [weekIdx, setWeekIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [sessions, setSessions] = useState({});
  const [sessionsSha, setSessionsSha] = useState(null);
  const [syncStatus, setSyncStatus] = useState("syncing");

  // Seed pre-completed days from WEEKS
  function seedCompleted(base) {
    const out = { ...base };
    WEEKS.forEach(w => w.days.forEach(d => {
      if (d.type==="done" && d.result) {
        const k = `w${w.number}_${d.day}${d.date}`;
        if (!out[k]) out[k] = { completed:true, result:d.result, aiComment:d.result.comment };
      }
    }));
    return out;
  }

  // Load from GitHub on mount
  useEffect(() => {
    (async () => {
      setSyncStatus("syncing");
      try {
        const res = await ghGet(GH_STATE);
        if (res) {
          const parsed = JSON.parse(res.content);
          setSessions(seedCompleted(parsed));
          setSessionsSha(res.sha);
          setSyncStatus("synced");
        } else {
          // sessions.json doesn't exist yet — start fresh
          const seeded = seedCompleted({});
          setSessions(seeded);
          setSyncStatus("synced");
        }
      } catch {
        const local = lsGet();
        setSessions(seedCompleted(local));
        setSyncStatus("offline");
      }
    })();
  }, []);

  const week = WEEKS[weekIdx];
  const phaseColor = PHASE_COLORS[week.phase-1];
  function sessionKey(day) { return `w${week.number}_${day.day}${day.date}`; }

  async function persistSessions(updated) {
    lsSet(updated);
    setSyncStatus("syncing");
    try {
      const newSha = await pushGhSessions(updated, sessionsSha);
      if (newSha) { setSessionsSha(newSha); setSyncStatus("synced"); }
      else setSyncStatus("error");
    } catch { setSyncStatus("error"); }
  }

  function handleLog(day, formData) {
    const key = sessionKey(day);
    const updated = { ...sessions, [key]:{ completed:true, result:formData, aiComment:formData.aiComment } };
    setSessions(updated);
    persistSessions(updated);
  }

  function handleUnlog(day) {
    const key = sessionKey(day);
    const updated = { ...sessions };
    delete updated[key];
    setSessions(updated);
    persistSessions(updated);
  }

  const weekSessions = {};
  week.days.forEach(d => { weekSessions[d.day+d.date] = sessions[sessionKey(d)]; });

  return (
    <div style={{ minHeight:"100vh", background:"#080b12", color:"#f1f5f9", fontFamily:"Inter, system-ui, sans-serif", padding:"1.75rem 1.5rem", maxWidth:940, margin:"0 auto" }}>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"1.5rem", flexWrap:"wrap", gap:"0.75rem" }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:"0.6rem", marginBottom:6 }}>
            <div style={{ fontSize:"0.58rem", letterSpacing:"0.15em", color:"#f97316", fontFamily:"monospace", fontWeight:700 }}>SNOWDON SKYRACE · 15 AUG 2026</div>
            <SyncBadge status={syncStatus} />
          </div>
          <h1 style={{ margin:0, fontSize:"1.55rem", fontWeight:800, letterSpacing:"-0.02em", lineHeight:1.1 }}>
            Week {week.number} — <span style={{ color:phaseColor }}>{week.block}</span>
          </h1>
          <div style={{ fontSize:"0.75rem", color:"#475569", marginTop:5, fontFamily:"monospace" }}>{week.dates}</div>
        </div>
        <CountdownBadge />
      </div>

      {/* Phase track */}
      <div style={{ display:"flex", gap:"0.4rem", marginBottom:"1.25rem" }}>
        {PHASE_LABELS.map((l,i)=>(<div key={i} style={{ flex:1, height:3, borderRadius:99, background:week.phase-1===i?PHASE_COLORS[i]:week.phase-1>i?`${PHASE_COLORS[i]}60`:"#1e2535", transition:"background 0.3s" }} />))}
      </div>
      <div style={{ display:"flex", gap:"1rem", marginBottom:"1.5rem" }}>
        {PHASE_LABELS.map((l,i)=>(<span key={i} style={{ fontSize:"0.55rem", color:week.phase-1===i?PHASE_COLORS[i]:"#334155", fontFamily:"monospace", letterSpacing:"0.06em", fontWeight:week.phase-1===i?700:400 }}>{l}</span>))}
      </div>

      <WeekSelector weeks={WEEKS} currentIdx={weekIdx} onSelect={setWeekIdx} />
      <ProgressBar days={week.days} weekSessions={weekSessions} />

      {/* Week objective */}
      <div style={{ background:`${phaseColor}09`, border:`1px solid ${phaseColor}30`, borderRadius:10, padding:"1.1rem 1.4rem", marginBottom:"1.5rem" }}>
        <div style={{ fontSize:"0.58rem", color:phaseColor, letterSpacing:"0.12em", fontFamily:"monospace", fontWeight:700, marginBottom:7 }}>WEEK OBJECTIVE</div>
        <p style={{ margin:0, fontSize:"0.85rem", color:"#cbd5e1", lineHeight:1.7 }}>{week.objective}</p>
        <div style={{ display:"flex", gap:"0.6rem", marginTop:"0.9rem", flexWrap:"wrap" }}>
          {[["Volume",week.totalKm],["Elevation",week.totalElev],["Intensity",week.intensity],["Strength",week.strength],["HR Cap",`${week.hrCap} bpm`]].map(([k,v])=>(
            <div key={k} style={{ background:"#0a0d14", border:"1px solid #1a2030", borderRadius:6, padding:"0.35rem 0.7rem" }}>
              <div style={{ fontSize:"0.52rem", color:"#475569", fontFamily:"monospace", letterSpacing:"0.07em" }}>{k}</div>
              <div style={{ fontSize:"0.78rem", fontWeight:700, color:"#f1f5f9" }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Day grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(185px, 1fr))", gap:"0.8rem", marginBottom:"1.75rem" }}>
        {week.days.map((day,i)=>(<DayTile key={i} day={day} sessionData={sessions[sessionKey(day)]} onClick={()=>setSelected(day)} />))}
      </div>

      {/* Recommendations */}
      <div style={{ background:"rgba(249,115,22,0.05)", border:"1px solid rgba(249,115,22,0.18)", borderRadius:10, padding:"1.1rem 1.4rem" }}>
        <div style={{ fontSize:"0.58rem", color:"#f97316", letterSpacing:"0.12em", fontFamily:"monospace", fontWeight:700, marginBottom:"0.9rem" }}>GLOBAL RECOMMENDATIONS — WEEK {week.number}</div