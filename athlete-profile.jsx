import { useState } from "react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, LineChart, Line, ReferenceLine } from "recharts";

// ─── Design tokens ──────────────────────────────────────────────────────────
// Palette: slate rock + alpine snow + glacier teal + warning amber + danger red
const T = {
  bg: "#0f1318",
  surface: "#181d24",
  border: "#252c36",
  teal: "#4fd1c5",
  amber: "#f6ad55",
  red: "#fc5555",
  green: "#68d391",
  muted: "#5a6475",
  text: "#e2e8f0",
  dim: "#94a3b8",
};

// ─── Data ────────────────────────────────────────────────────────────────────
const eras = [
  {
    id: 1,
    label: "Peak Fitness",
    period: "Pre-2020",
    subtitle: "Tarawera Build",
    status: "green",
    fitness: 9,
    consistency: 7,
    volume: "~80 km/wk peak",
    highlights: ["HM PR 1:35", "50km finisher", "V̇O₂max ~60 mL/kg/min"],
    risk: "ITB at 20km — wrong intensity distribution",
    detail:
      "Career ceiling defined. Alpine background + structured block produced genuine elite-amateur fitness. Collapsed at Tarawera due to ~50% low-intensity distribution vs 80% recommended.",
  },
  {
    id: 2,
    label: "Boom-Bust",
    period: "2020–2024",
    subtitle: "No floor established",
    status: "red",
    fitness: 4,
    consistency: 2,
    volume: "6–8 km scattered",
    highlights: ["Multi-week gaps", "No long run", "AeT begins drifting"],
    risk: "Life load → complete training collapse",
    detail:
      "Life demands eliminated training entirely when disrupted. No minimum effective week. AeT drifted progressively — same pace requiring higher HR each year.",
  },
  {
    id: 3,
    label: "Best Rebuild",
    period: "Sep–Dec 2025",
    subtitle: "Unstructured peak",
    status: "amber",
    fitness: 7,
    consistency: 6,
    volume: "29 km long run peak",
    highlights: [
      "Frozen Edale 25.9km / 1165m+",
      "6×1km @ 4:00",
      "30/30 uphill intervals",
    ],
    risk: "No taper, no macro structure — collapsed Jan 2026",
    detail:
      "Best recent block. Real quality sessions returned. S&C briefly present. But no recovery weeks and no periodization meant unsustainable peak followed by full stop.",
  },
  {
    id: 4,
    label: "Collapse",
    period: "Jan–May 2026",
    subtitle: "~3 month running gap",
    status: "red",
    fitness: 3,
    consistency: 1,
    volume: "Hiking + Zwift only",
    highlights: [
      "15km / 1088m+ hike (Apr)",
      "FTP 200W maintained",
      "Alpine ski Feb 7–12",
    ],
    risk: "AeT drifted to functional ~155bpm ceiling",
    detail:
      "Last run 9 Feb. Resumed 17 May. Hiking preserved eccentric tolerance. Cycling maintained cardiac floor. Running-specific vertical load near zero.",
  },
  {
    id: 5,
    label: "Snowdon Block",
    period: "Jun 2026 →",
    subtitle: "Week 1, controlled reentry",
    status: "teal",
    fitness: 3,
    consistency: 5,
    volume: "9.5 km / 252m (28 Jun)",
    highlights: [
      "144 bpm avg — controlled",
      "Walk protocol correct",
      "HR breach on moderate terrain",
    ],
    risk: "AeT gap, ITB descent risk, no S&C for 7+ months",
    detail:
      "Week 1 opener confirmed controlled execution. Primary corrections: tighten HR discipline on non-steep terrain. S&C must restart this week. Target: Snowdon SkyRace 15 Aug.",
  },
];

const strengths = [
  { name: "Mountain Movement", score: 9, note: "Haute-Savoie upbringing, Tryfan, Kinder" },
  { name: "Aerobic Ceiling", score: 8, note: "1:35 HM, 50km finisher — engine dormant, not gone" },
  { name: "Polarised Instinct", score: 8, note: "Easy stays easy, no grey zone habit" },
  { name: "Cycling Base", score: 7, note: "FTP 200W / 2.86 W/kg — floor maintained" },
  { name: "Self-Awareness", score: 8, note: "Can name Tarawera failure modes precisely" },
];

const weaknesses = [
  { name: "AeT Drift", score: 9, note: "Easy HR ~144–155, only 8–19 bpm from Z2 ceiling" },
  { name: "Boom-Bust Pattern", score: 8, note: "No floor — life disruption = total collapse" },
  { name: "ITB / Descent Risk", score: 7, note: "Left knee, 5+ months no descent load" },
  { name: "S&C Absence", score: 8, note: "Last session: Nov 2025 — 7+ months gap" },
  { name: "Vertical Load", score: 9, note: "252m recent vs 3150m+ race demand" },
  { name: "No Race Intensity", score: 7, note: "Last quality session: Dec 2025" },
];

const radarData = [
  { subject: "Mountain\nSkill", A: 9 },
  { subject: "Aerobic\nCeiling", A: 8 },
  { subject: "Consistency", A: 3 },
  { subject: "Vertical\nLoad", A: 1 },
  { subject: "S&C", A: 1 },
  { subject: "AeT\nControl", A: 2 },
  { subject: "Race\nIntensity", A: 1 },
  { subject: "Polarised\nInstinct", A: 8 },
];

const recentRuns = [
  { date: "14 Jun", km: 13.8, elev: 440, hr: null },
  { date: "16 Jun", km: 6.8, elev: 49, hr: null },
  { date: "20 Jun", km: 7.0, elev: 134, hr: null },
  { date: "21 Jun", km: 9.1, elev: 405, hr: null, hike: true },
  { date: "26 Jun", km: 4.8, elev: 60, hr: null },
  { date: "27 Jun", km: 5.4, elev: 130, hr: null },
  { date: "28 Jun", km: 9.5, elev: 252, hr: 144 },
];

const hrZones = [
  { zone: "Z1 Recovery", min: 0, max: 131, color: "#4fd1c5" },
  { zone: "Z2 Aerobic", min: 132, max: 163, color: "#68d391" },
  { zone: "Z3 Tempo", min: 164, max: 179, color: "#f6ad55" },
  { zone: "Z4 Threshold", min: 180, max: 195, color: "#fc5555" },
  { zone: "Z5 Max", min: 196, max: 210, color: "#9f7aea" },
];

// ─── Sub-components ──────────────────────────────────────────────────────────
const statusColor = (s) =>
  s === "green" ? T.green : s === "red" ? T.red : s === "amber" ? T.amber : T.teal;

function EraCard({ era, active, onClick }) {
  const col = statusColor(era.status);
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? T.surface : "transparent",
        border: "1px solid " + (active ? col : T.border),
        borderRadius: 8,
        padding: "12px 16px",
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.2s",
        width: "100%",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 11, color: T.dim, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 2 }}>
            {era.period}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: active ? col : T.text }}>
            {era.label}
          </div>
          <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{era.subtitle}</div>
        </div>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: col,
            marginTop: 4,
            flexShrink: 0,
            boxShadow: active ? "0 0 8px " + col : "none",
          }}
        />
      </div>
      <div style={{ marginTop: 8, fontSize: 11, color: T.muted }}>
        {era.volume}
      </div>
      <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            style={{
              height: 3,
              flex: 1,
              borderRadius: 2,
              background: i < era.fitness ? col : T.border,
              opacity: i < era.fitness ? 1 : 0.4,
            }}
          />
        ))}
      </div>
    </button>
  );
}

function MetricRow({ label, value, note, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "6px 0", borderBottom: "1px solid " + T.border }}>
      <div>
        <span style={{ fontSize: 12, color: T.dim }}>{label}</span>
        {note && <span style={{ fontSize: 10, color: T.muted, marginLeft: 8 }}>{note}</span>}
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color: color || T.teal }}>{value}</span>
    </div>
  );
}

function ScoreBar({ label, score, maxScore = 10, color, note }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: T.text }}>{label}</span>
        <span style={{ fontSize: 11, color: color, fontWeight: 700 }}>{score}/10</span>
      </div>
      <div style={{ background: T.border, borderRadius: 4, height: 5, overflow: "hidden" }}>
        <div
          style={{
            width: (score / maxScore) * 100 + "%",
            height: "100%",
            background: color,
            borderRadius: 4,
            transition: "width 0.6s ease",
          }}
        />
      </div>
      {note && <div style={{ fontSize: 10, color: T.muted, marginTop: 3 }}>{note}</div>}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AthleteProfile() {
  const [activeEra, setActiveEra] = useState(4);
  const [tab, setTab] = useState("overview");

  const era = eras[activeEra];

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "eras", label: "Era Timeline" },
    { id: "strengths", label: "S & W" },
    { id: "current", label: "Current Block" },
    { id: "race", label: "Race Day" },
  ];

  return (
    <div
      style={{
        background: T.bg,
        minHeight: "100vh",
        color: T.text,
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        padding: "24px 16px",
        maxWidth: 900,
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 10, letterSpacing: "0.15em", color: T.teal, textTransform: "uppercase", marginBottom: 6 }}>
          Athlete Intelligence Report
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em" }}>
              Clément Savalle-Anthonioz
            </h1>
            <div style={{ fontSize: 13, color: T.dim, marginTop: 4 }}>
              Trail · Mountain · High Peak, England · Snowdon SkyRace 15 Aug 2026
            </div>
          </div>
          <div
            style={{
              background: T.surface,
              border: "1px solid " + T.border,
              borderRadius: 8,
              padding: "8px 14px",
              textAlign: "right",
            }}
          >
            <div style={{ fontSize: 10, color: T.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Race Readiness</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.amber }}>3 / 10</div>
            <div style={{ fontSize: 10, color: T.muted }}>Week 1 of 7</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, flexWrap: "wrap" }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              background: tab === t.id ? T.teal : "transparent",
              color: tab === t.id ? T.bg : T.dim,
              border: "1px solid " + (tab === t.id ? T.teal : T.border),
              borderRadius: 6,
              padding: "6px 14px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: Overview ─────────────────────────────────────────────────── */}
      {tab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Baseline metrics */}
          <div style={{ background: T.surface, border: "1px solid " + T.border, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 11, color: T.teal, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
              Baseline Metrics
            </div>
            <MetricRow label="Weight" value="70 kg" />
            <MetricRow label="Max HR" value="196 bpm" />
            <MetricRow label="AeT (functional)" value="~155 bpm" note="drifted" color={T.amber} />
            <MetricRow label="Z2 ceiling (LT2)" value="163 bpm" />
            <MetricRow label="HM PR" value="1:35:00" />
            <MetricRow label="Cycling FTP" value="200 W" note="2.86 W/kg" />
            <MetricRow label="Race shoe" value="MTL Long Sky" color={T.dim} />
          </div>

          {/* Radar */}
          <div style={{ background: T.surface, border: "1px solid " + T.border, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 11, color: T.teal, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
              Attribute Radar — Current State
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke={T.border} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: T.muted, fontSize: 9 }} />
                <Radar dataKey="A" stroke={T.teal} fill={T.teal} fillOpacity={0.18} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* HR Zones */}
          <div style={{ background: T.surface, border: "1px solid " + T.border, borderRadius: 10, padding: 16, gridColumn: "1 / -1" }}>
            <div style={{ fontSize: 11, color: T.teal, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
              Heart Rate Zones & Current Easy Run Position
            </div>
            <div style={{ display: "flex", gap: 4, height: 48, alignItems: "stretch", borderRadius: 6, overflow: "hidden" }}>
              {hrZones.map((z) => {
                const width = z.max - z.min;
                return (
                  <div
                    key={z.zone}
                    style={{
                      flex: width,
                      background: z.color + "22",
                      border: "1px solid " + z.color + "66",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      fontSize: 9,
                      color: z.color,
                      position: "relative",
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 10 }}>{z.min}–{z.max}</div>
                    <div style={{ fontSize: 8, textAlign: "center" }}>{z.zone.split(" ")[0]}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: T.amber, flexShrink: 0 }} />
              <div style={{ fontSize: 11, color: T.dim }}>
                Current easy trail HR sits at <strong style={{ color: T.amber }}>~144–155 bpm</strong> — only <strong style={{ color: T.amber }}>8–19 bpm</strong> below Z2 ceiling (163). Any gradient above ~10% risks Z3 breach.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: Era Timeline ─────────────────────────────────────────────── */}
      {tab === "eras" && (
        <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 16 }}>
          {/* Era list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {eras.map((e, i) => (
              <EraCard key={e.id} era={e} active={activeEra === i} onClick={() => setActiveEra(i)} />
            ))}
          </div>

          {/* Era detail */}
          <div style={{ background: T.surface, border: "1px solid " + statusColor(era.status) + "44", borderRadius: 10, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: T.dim, textTransform: "uppercase", letterSpacing: "0.1em" }}>{era.period}</div>
                <h2 style={{ margin: "4px 0 2px", fontSize: 20, fontWeight: 800, color: statusColor(era.status) }}>
                  {era.label}
                </h2>
                <div style={{ fontSize: 12, color: T.muted }}>{era.subtitle}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, color: T.muted, marginBottom: 2 }}>Fitness</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: statusColor(era.status) }}>{era.fitness}/10</div>
              </div>
            </div>

            <div style={{ fontSize: 13, color: T.dim, lineHeight: 1.6, marginBottom: 16 }}>
              {era.detail}
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: T.teal, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
                Key Data Points
              </div>
              {era.highlights.map((h, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: T.teal, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: T.text }}>{h}</span>
                </div>
              ))}
            </div>

            <div style={{ background: T.red + "11", border: "1px solid " + T.red + "44", borderRadius: 6, padding: "8px 12px" }}>
              <div style={{ fontSize: 10, color: T.red, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>
                Failure Mode / Risk
              </div>
              <div style={{ fontSize: 12, color: T.dim }}>{era.risk}</div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: Strengths & Weaknesses ───────────────────────────────────── */}
      {tab === "strengths" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ background: T.surface, border: "1px solid " + T.border, borderRadius: 10, padding: 18 }}>
            <div style={{ fontSize: 11, color: T.green, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>
              ✓ Strengths
            </div>
            {strengths.map((s) => (
              <ScoreBar key={s.name} label={s.name} score={s.score} color={T.green} note={s.note} />
            ))}
          </div>
          <div style={{ background: T.surface, border: "1px solid " + T.border, borderRadius: 10, padding: 18 }}>
            <div style={{ fontSize: 11, color: T.red, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>
              ✗ Weaknesses (severity)
            </div>
            {weaknesses.map((w) => (
              <ScoreBar key={w.name} label={w.name} score={w.score} color={T.red} note={w.note} />
            ))}
          </div>

          <div style={{ gridColumn: "1 / -1", background: T.surface, border: "1px solid " + T.border, borderRadius: 10, padding: 18 }}>
            <div style={{ fontSize: 11, color: T.teal, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>
              Priority Action Stack
            </div>
            {[
              { priority: "1", action: "Restart Strength A (hip/glute) this week — protected session, not filler", urgency: "critical" },
              { priority: "2", action: "HR discipline on non-steep terrain — 155 bpm hard cap every session", urgency: "critical" },
              { priority: "3", action: "Protect Saturday long run — minimum effective week floor", urgency: "high" },
              { priority: "4", action: "Progressive vertical load — Jacob's Ladder sessions from Week 3", urgency: "high" },
              { priority: "5", action: "Monitor left knee on all descents — walk at first sign of lateral tightness", urgency: "ongoing" },
            ].map((item) => (
              <div
                key={item.priority}
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  padding: "8px 0",
                  borderBottom: "1px solid " + T.border,
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: item.urgency === "critical" ? T.red : item.urgency === "high" ? T.amber : T.muted,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 800,
                    color: T.bg,
                    flexShrink: 0,
                  }}
                >
                  {item.priority}
                </div>
                <div style={{ fontSize: 12, color: T.text, lineHeight: 1.5 }}>{item.action}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB: Current Block ────────────────────────────────────────────── */}
      {tab === "current" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Recent runs chart */}
          <div style={{ background: T.surface, border: "1px solid " + T.border, borderRadius: 10, padding: 18 }}>
            <div style={{ fontSize: 11, color: T.teal, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>
              Recent Sessions — Distance
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={recentRuns} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fill: T.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: T.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: T.bg, border: "1px solid " + T.border, borderRadius: 6, fontSize: 11 }}
                  formatter={(v, n) => [v + (n === "km" ? " km" : " m"), n]}
                />
                <Bar dataKey="km" radius={[3, 3, 0, 0]}>
                  {recentRuns.map((r, i) => (
                    <Cell key={i} fill={r.hr ? T.teal : r.hike ? T.amber : T.muted + "88"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: T.teal }} />
                <span style={{ fontSize: 10, color: T.muted }}>Run (with HR data)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: T.amber }} />
                <span style={{ fontSize: 10, color: T.muted }}>Hike</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: T.muted + "88" }} />
                <span style={{ fontSize: 10, color: T.muted }}>Run (no HR stream)</span>
              </div>
            </div>
          </div>

          {/* 7-week block */}
          <div style={{ background: T.surface, border: "1px solid " + T.border, borderRadius: 10, padding: 18 }}>
            <div style={{ fontSize: 11, color: T.teal, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>
              7-Week Block Structure
            </div>
            {[
              { wk: "WK 1", label: "Aerobic Rebuild", focus: "HR ≤155 bpm, Strength A restart", status: "active" },
              { wk: "WK 2", label: "Aerobic Rebuild", focus: "HR ≤155 strict, first Jacob's Ladder attempt", status: "upcoming" },
              { wk: "WK 3", label: "Aerobic Rebuild", focus: "Volume +10%, descent load intro", status: "upcoming" },
              { wk: "WK 4", label: "Vertical Loading", focus: "HR ceiling →163, uphill intervals begin", status: "upcoming" },
              { wk: "WK 5", label: "Australia Travel", focus: "Hotel treadmill / stairs, bodyweight S&C", status: "travel" },
              { wk: "WK 6", label: "Taper Start", focus: "Volume –50%, quality maintained", status: "taper" },
              { wk: "WK 7", label: "Race Taper", focus: "≤30% volume, taper COMPLETE by 13 Aug", status: "taper" },
            ].map((w) => (
              <div
                key={w.wk}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "8px 10px",
                  marginBottom: 4,
                  borderRadius: 6,
                  background:
                    w.status === "active"
                      ? T.teal + "15"
                      : w.status === "travel"
                      ? T.amber + "10"
                      : w.status === "taper"
                      ? T.muted + "10"
                      : "transparent",
                  border:
                    w.status === "active"
                      ? "1px solid " + T.teal + "44"
                      : "1px solid transparent",
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 800, color: w.status === "active" ? T.teal : w.status === "travel" ? T.amber : T.muted, width: 32, flexShrink: 0 }}>
                  {w.wk}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{w.label}</div>
                  <div style={{ fontSize: 11, color: T.muted }}>{w.focus}</div>
                </div>
                {w.status === "active" && (
                  <div style={{ fontSize: 9, color: T.teal, border: "1px solid " + T.teal, borderRadius: 4, padding: "2px 6px" }}>NOW</div>
                )}
                {w.status === "travel" && (
                  <div style={{ fontSize: 9, color: T.amber, border: "1px solid " + T.amber, borderRadius: 4, padding: "2px 6px" }}>TRAVEL</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB: Race Day ─────────────────────────────────────────────────── */}
      {tab === "race" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: T.surface, border: "1px solid " + T.teal + "44", borderRadius: 10, padding: 18 }}>
            <div style={{ fontSize: 11, color: T.teal, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
              Snowdon SkyRace — 15 August 2026
            </div>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 16 }}>
              {[["Distance", "38 km"], ["Elevation", "3,150 m+"], ["Type", "SkyRun Eryri"], ["Format", "Technical mountain race"]].map(([l, v]) => (
                <div key={l}>
                  <div style={{ fontSize: 10, color: T.muted }}>{l}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: T.surface, border: "1px solid " + T.border, borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 11, color: T.green, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Race Strategy</div>
              {[
                "Walk ALL climbs above 15% gradient in first half",
                "HR under 155–158 bpm for first 20 km",
                "Treat as a big mountain day, not a race",
                "Target finish: 5:30–6:30",
                "Eat early, eat often — first food at 20 min",
                "Walk descents on quad burn or ITB twinge",
              ].map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                  <div style={{ color: T.green, fontSize: 12, flexShrink: 0 }}>→</div>
                  <div style={{ fontSize: 12, color: T.dim }}>{s}</div>
                </div>
              ))}
            </div>

            <div style={{ background: T.surface, border: "1px solid " + T.border, borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 11, color: T.red, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>DNF Risk Factors</div>
              {[
                { risk: "ITB flare (left knee)", level: "HIGH" },
                { risk: "Starting too fast on early climbs", level: "HIGH" },
                { risk: "HR blow-up on Snowdon ridge", level: "MED" },
                { risk: "Fuelling failure (6hr effort)", level: "MED" },
                { risk: "Technical descent slip on wet rock", level: "LOW" },
              ].map((r) => (
                <div key={r.risk} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid " + T.border }}>
                  <span style={{ fontSize: 12, color: T.dim }}>{r.risk}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: r.level === "HIGH" ? T.red : r.level === "MED" ? T.amber : T.green }}>
                    {r.level}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: T.surface, border: "1px solid " + T.border, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 11, color: T.teal, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
              What 7 Weeks Can & Cannot Deliver
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: T.green, marginBottom: 8 }}>✓ Achievable</div>
                {["Running economy restore", "Descent confidence", "Hip stabiliser activation", "1–2 meaningful vertical sessions", "S&C foundation rebuilt"].map((i) => (
                  <div key={i} style={{ fontSize: 12, color: T.dim, marginBottom: 4 }}>· {i}</div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.red, marginBottom: 8 }}>✗ Cannot fix in time</div>
                {["Full AeT recalibration", "Deep muscular endurance base", "Altitude adaptation", "Structural ITB resolution", "Fitness ceiling recovery"].map((i) => (
                  <div key={i} style={{ fontSize: 12, color: T.dim, marginBottom: 4 }}>· {i}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: 28, paddingTop: 16, borderTop: "1px solid " + T.border, fontSize: 10, color: T.muted, display: "flex", justifyContent: "space-between" }}>
        <span>Training for the Uphill Athlete · Polarised 80/20 · AeT-anchored</span>
        <span>Generated 29 Jun 2026</span>
      </div>
    </div>
  );
}
