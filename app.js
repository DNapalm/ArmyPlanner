const { useState, useMemo, useEffect, useCallback, useRef } = React;


/* =================================================================
   DATOS: Age of Sigmar (BSData/age-of-sigmar-4th) y Warhammer 40.000
   (BSData/wh40k-10e). Comunidad, no oficiales — verifica puntos en
   la app oficial correspondiente antes de un torneo.
================================================================= */
// AOS_DB_B64 viene de data-aos.js
// EXTRAS_B64 viene de data-extras.js
// W40K_DB_B64 viene de data-w40k.js

function decodeB64Json(b64) {
  try {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return JSON.parse(new TextDecoder("utf-8").decode(bytes));
  } catch (e) {
    return {};
  }
}
const AOS_DB = decodeB64Json(AOS_DB_B64);
const EXTRAS = decodeB64Json(EXTRAS_B64);
const W40K_DB = decodeB64Json(W40K_DB_B64);

const AOS_FACTIONS = Object.keys(AOS_DB).sort();
const W40K_FACTIONS = Object.keys(W40K_DB).sort();

/* -----------------------------------------------------------------
   Colorillos
----------------------------------------------------------------- */
const BG = "#131316";
const SECTION = "#1b1b1f";
const SECTION2 = "#242428";
const CARD = "#2a2a30";
const CARD_TEXT = "#e9e9ec";
const CARD_SUB = "#9d9da4";
const PILL = "#3a3a41";
const PILL_TEXT = "#d6d6da";
const TEXT = "#eeeef0";
const MUTED = "#8b8b92";
const BORDER = "#303036";
const DANGER = "#d1594e";
const GOLD = "#c9924a";
const W40K_ACCENT = "#c15b47";
// alias históricos para no reescribir cada referencia
const INK = BG;
const PANEL = SECTION;
const PANEL2 = SECTION2;
const PARCH = TEXT;
const REND = DANGER;
const LIGHTNING = "#8a8a90";
const GENERAL_BG = "#26221a";
function systemAccent(system) { return system === "w40k" ? W40K_ACCENT : GOLD; }
function cardShadow() { return "0 2px 6px rgba(0,0,0,0.35)"; }




function normalizeAos(faction, raw) {
  const meleeCols = [
    { k: "name", l: "Arma" }, { k: "Atk", l: "Atq" }, { k: "Hit", l: "Impacto" },
    { k: "Wnd", l: "Herida" }, { k: "Rnd", l: "Perf.", accent: true }, { k: "Dmg", l: "Daño" },
    { k: "Ability", l: "Habilidad", muted: true },
  ];
  const rangedCols = [
    { k: "name", l: "Arma" }, { k: "Rng", l: "Alcance" }, { k: "Atk", l: "Atq" }, { k: "Hit", l: "Impacto" },
    { k: "Wnd", l: "Herida" }, { k: "Rnd", l: "Perf.", accent: true }, { k: "Dmg", l: "Daño" },
    { k: "Ability", l: "Habilidad", muted: true },
  ];
  return {
    system: "aos", name: raw.n, faction,
    isHero: !!raw.hero, keywords: raw.kw || [],
    statPills: [
      { l: "Mov", v: raw.st.Move }, { l: "Vida", v: raw.st.Health },
      { l: "Salv.", v: raw.st.Save }, { l: "Control", v: raw.st.Control },
    ],
    meleeCols, meleeRows: (raw.me || []).map((w) => ({ name: w.n, Atk: w.Atk, Hit: w.Hit, Wnd: w.Wnd, Rnd: w.Rnd, Dmg: w.Dmg, Ability: w.Ab })),
    rangedCols, rangedRows: (raw.ra || []).map((w) => ({ name: w.n, Rng: w.Rg, Atk: w.Atk, Hit: w.Hit, Wnd: w.Wnd, Rnd: w.Rnd, Dmg: w.Dmg, Ability: w.Ab })),
    abilities: (raw.ab || []).map((a) => ({ name: a.n, type: a.t, timing: a.ti, declare: a.d, effect: a.e })),
    points: raw.pts,
  };
}

function normalizeW40k(faction, raw) {
  const meleeCols = [
    { k: "name", l: "Arma" }, { k: "Atk", l: "A" }, { k: "Hit", l: "HA" },
    { k: "S", l: "F" }, { k: "AP", l: "PA", accent: true }, { k: "D", l: "D" },
    { k: "Kw", l: "Palabras clave", muted: true },
  ];
  const rangedCols = [
    { k: "name", l: "Arma" }, { k: "Rg", l: "Alcance" }, { k: "Atk", l: "A" }, { k: "Hit", l: "HP" },
    { k: "S", l: "F" }, { k: "AP", l: "PA", accent: true }, { k: "D", l: "D" },
    { k: "Kw", l: "Palabras clave", muted: true },
  ];
  return {
    system: "w40k", name: raw.n, faction,
    isHero: !!raw.hero, keywords: raw.kw || [],
    statPills: [
      { l: "Mov", v: raw.st.M }, { l: "Res.", v: raw.st.T }, { l: "Salv.", v: raw.st.SV },
      { l: "Heridas", v: raw.st.W }, { l: "Liderazgo", v: raw.st.LD }, { l: "OC", v: raw.st.OC },
    ],
    meleeCols, meleeRows: (raw.me || []).map((w) => ({ name: w.n, Atk: w.Atk, Hit: w.Hit, S: w.S, AP: w.AP, D: w.D, Kw: w.Kw })),
    rangedCols, rangedRows: (raw.ra || []).map((w) => ({ name: w.n, Rg: w.Rg, Atk: w.Atk, Hit: w.Hit, S: w.S, AP: w.AP, D: w.D, Kw: w.Kw })),
    abilities: (raw.ab || []).map((a) => ({ name: a.n, effect: a.e })),
    points: raw.pts,
  };
}

const SYSTEMS = {
  aos: {
    label: "Age of Sigmar", tagline: "4ª Edición", db: AOS_DB, factions: AOS_FACTIONS,
    normalize: normalizeAos, extras: EXTRAS, defaultFaction: "Stormcast Eternals",
  },
  w40k: {
    label: "Warhammer 40.000", tagline: "11ª Edición", db: W40K_DB, factions: W40K_FACTIONS,
    normalize: normalizeW40k, extras: null, defaultFaction: "Space Marines",
  },
};

function getUnit(system, faction, name) {
  const cfg = SYSTEMS[system];
  const raw = cfg.db[faction] && cfg.db[faction][name];
  return raw ? cfg.normalize(faction, raw) : null;
}

const POINTS_LIMIT_AOS = 2000;
const POINTS_LIMIT_W40K = 2000;

/* -----------------------------------------------------------------
   Almacenamiento persistente — claves separadas por juego para no
   mezclar listas de AoS y 40k.
   Tres niveles, de mejor a peor, para que la app SIEMPRE funcione
   sea cual sea el sitio donde se esté viendo este archivo:
----------------------------------------------------------------- */
const memoryStore = new Map();

function hasClaudeStorage() {
  return typeof window !== "undefined" && window.storage && typeof window.storage.get === "function";
}
function hasLocalStorage() {
  try {
    if (typeof window === "undefined" || !window.localStorage) return false;
    const t = "__ab_probe__";
    window.localStorage.setItem(t, "1");
    window.localStorage.removeItem(t);
    return true;
  } catch (e) { return false; }
}
async function storageGet(key) {
  try {
    if (hasClaudeStorage()) {
      const r = await window.storage.get(key, false);
      return r ? JSON.parse(r.value) : null;
    }
  } catch (e) { /* seguimos probando el siguiente nivel */ }
  try {
    if (hasLocalStorage()) {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    }
  } catch (e) { /* seguimos probando el siguiente nivel */ }
  return memoryStore.has(key) ? JSON.parse(memoryStore.get(key)) : null;
}
async function storageSet(key, value) {
  const json = JSON.stringify(value);
  try {
    if (hasClaudeStorage()) {
      await window.storage.set(key, json, false);
      return true;
    }
  } catch (e) { /* seguimos probando el siguiente nivel */ }
  try {
    if (hasLocalStorage()) {
      window.localStorage.setItem(key, json);
      return true;
    }
  } catch (e) { /* seguimos probando el siguiente nivel */ }
  memoryStore.set(key, json);
  return true;
}
async function storageDelete(key) {
  try {
    if (hasClaudeStorage()) {
      await window.storage.delete(key, false);
      return true;
    }
  } catch (e) { /* seguimos probando el siguiente nivel */ }
  try {
    if (hasLocalStorage()) {
      window.localStorage.removeItem(key);
      return true;
    }
  } catch (e) { /* seguimos probando el siguiente nivel */ }
  memoryStore.delete(key);
  return true;
}
async function storageListIndex(system) {
  const idx = await storageGet("army-index-" + system);
  return idx || [];
}
function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

/* -----------------------------------------------------------------
   Componentes compartidos
----------------------------------------------------------------- */
function Select({ value, onChange, options, style }) {
  return (
    <select value={value} onChange={onChange}
      style={{ background: SECTION2, color: TEXT, border: `1px solid ${BORDER}`, borderRadius: 10,
        padding: "10px 12px", fontSize: 14, cursor: "pointer", outline: "none", ...style }}>
      {options}
    </select>
  );
}
function SearchInput({ value, onChange, placeholder, style }) {
  return (
    <div style={{ position: "relative", ...style }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }}>
        <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
      </svg>
      <input value={value} onChange={onChange} placeholder={placeholder}
        style={{ width: "100%", background: SECTION2, color: TEXT, border: `1px solid ${BORDER}`, borderRadius: 22,
          padding: "11px 14px 11px 36px", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
    </div>
  );
}
function Pill({ children, tone }) {
  return (
    <span style={{ background: tone === "danger" ? DANGER : PILL, color: tone === "danger" ? "#fff" : PILL_TEXT,
      fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 7, whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}
function FAB({ onClick, label }) {
  return (
    <button onClick={onClick} aria-label={label} title={label} style={{
      position: "fixed", right: 18, bottom: 82, zIndex: 45,
      width: 54, height: 54, borderRadius: 16, background: CARD, color: CARD_TEXT,
      border: "none", fontSize: 26, fontWeight: 600, cursor: "pointer",
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 4px 14px rgba(0,0,0,0.55)",
    }}>+</button>
  );
}

/* Iconos pequeños para diferenciar el tipo de sección de un vistazo */
function SectionKindIcon({ kind, color, size = 15 }) {
  const c = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (kind) {
    case "config": return <svg {...c}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1-1.6 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.9V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" /></svg>;
    case "add": return <svg {...c}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3M11 8v6M8 11h6" /></svg>;
    case "regiment": return <svg {...c}><path d="M12 2l7 3v6c0 5-3 8-7 9-4-1-7-4-7-9V5l7-3z" /></svg>;
    case "aux": return <svg {...c}><rect x="4" y="8" width="16" height="12" rx="2" /><path d="M9 8V6a3 3 0 016 0v2" /></svg>;
    default: return null;
  }
}

function SectionHeader({ label, right, kind, color, expanded, onToggle }) {
  const c = color || MUTED;
  return (
    <div
      onClick={onToggle}
      style={{
        background: SECTION, borderRadius: 12, padding: "13px 14px", display: "flex",
        justifyContent: "space-between", alignItems: "center", marginBottom: 8,
        borderLeft: kind ? `3px solid ${c}` : "none",
        cursor: onToggle ? "pointer" : "default",
      }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
        {kind && <SectionKindIcon kind={kind} color={c} />}
        <span style={{ fontSize: 13.5, fontWeight: 600, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
        {right}
        {onToggle && (
          <button onClick={onToggle} style={{ background: "none", border: "none", color: MUTED, cursor: "pointer", padding: 0, display: "flex" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

/* Iconos genéricos por tipo de unidad — vectores propios, no artwork oficial */
function unitIconType(u) {
  const kw = (u.keywords || []).map((k) => k.toUpperCase());
  if (kw.includes("MONSTER")) return "monster";
  if (kw.some((k) => k.includes("VEHICLE") || k === "WAR MACHINE")) return "machine";
  if (kw.includes("CAVALRY") || kw.includes("BIKER") || kw.includes("BIKERS")) return "cavalry";
  if (kw.some((k) => k.startsWith("WIZARD") || k.startsWith("PRIEST") || k === "PSYKER")) return "caster";
  if (u.isHero) return "hero";
  if (kw.includes("FLY")) return "flyer";
  if (kw.includes("BEAST")) return "beast";
  return "infantry";
}
function UnitIcon({ unit, size = 22, color }) {
  const type = unit ? unitIconType(unit) : "infantry";
  const c = color || GOLD;
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: c, strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (type) {
    case "hero": return <svg {...common}><path d="M12 2l2.2 4.8L19 8l-3.6 3.4.9 5.1L12 14l-4.3 2.5.9-5.1L5 8l4.8-1.2L12 2z" /></svg>;
    case "monster": return <svg {...common}><circle cx="12" cy="10" r="5" /><path d="M7 14l-2 6M17 14l2 6M9 8l-2-4M15 8l2-4" /></svg>;
    case "machine": return <svg {...common}><rect x="4" y="10" width="16" height="7" rx="1" /><circle cx="8" cy="19" r="1.6" /><circle cx="16" cy="19" r="1.6" /><path d="M6 10V6h9l3 4" /></svg>;
    case "cavalry": return <svg {...common}><path d="M4 18c2-5 3-9 7-9 3 0 3 3 6 3 2 0 3-1 3-1" /><path d="M11 9V5l3 2" /><path d="M6 18l2-4M16 18l-1-4" /></svg>;
    case "caster": return <svg {...common}><path d="M12 2v6M9 5h6" /><circle cx="12" cy="14" r="6" /></svg>;
    case "flyer": return <svg {...common}><path d="M12 4c2 3 6 4 9 3-1 3-4 5-9 6-5-1-8-3-9-6 3 1 7 0 9-3z" /></svg>;
    case "beast": return <svg {...common}><circle cx="12" cy="13" r="5" /><path d="M8 9l-1.5-3M16 9l1.5-3" /></svg>;
    default: return <svg {...common}><path d="M12 3l1.8 4h4.2l-3.4 2.6L15.8 14 12 11.4 8.2 14l1.2-4.4L6 7h4.2z" /><path d="M6 21c1-3 3-4 6-4s5 1 6 4" /></svg>;
  }
}

/* Estrella para marcar héroes/generales/personajes, en cualquier lista */
function HeroStar({ color, size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color || GOLD} style={{ flexShrink: 0 }}>
      <path d="M12 2.5l2.9 6 6.6.8-4.8 4.6 1.2 6.5L12 17.2l-5.9 3.2 1.2-6.5-4.8-4.6 6.6-.8z" />
    </svg>
  );
}

function StatPill({ label, value }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 44 }}>
      <div style={{ fontSize: 9.5, letterSpacing: 0.4, color: CARD_SUB }}>{label}</div>
      <div style={{ fontSize: 14.5, fontWeight: 700, color: CARD_TEXT }}>{value || "—"}</div>
    </div>
  );
}

function WeaponTable({ title, columns, rows }) {
  if (!rows || rows.length === 0) return null;
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontSize: 12, color: MUTED, fontWeight: 600, marginBottom: 6, letterSpacing: 0.3 }}>{title}</div>
      <div style={{ background: CARD, borderRadius: 12, overflow: "hidden", overflowX: "auto", boxShadow: cardShadow() }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: SECTION2, color: CARD_SUB }}>
              {columns.map((c) => <th key={c.k} style={th}>{c.l}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} style={{ borderTop: `1px solid ${BORDER}`, color: CARD_TEXT }}>
                {columns.map((c) => {
                  const val = row[c.k];
                  const isNameCol = c.k === "name";
                  const style2 = { ...td, fontWeight: isNameCol ? 600 : 400,
                    color: c.accent && val && val !== "-" && val !== "0" ? DANGER : (c.muted ? CARD_SUB : CARD_TEXT),
                    fontSize: c.muted ? 11 : 12 };
                  return <td key={c.k} style={style2}>{val && val !== "-" ? val : (isNameCol ? val : "—")}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
const th = { textAlign: "left", padding: "6px 9px", fontWeight: 600, fontSize: 10.5, letterSpacing: 0.3 };
const td = { padding: "6px 9px", verticalAlign: "top" };

function GenericDetail({ unit, onClose }) {
  if (!unit) return null;
  const accent = systemAccent(unit.system);
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} className="ab-scroll" style={{ background: SECTION, borderRadius: 16, maxWidth: 620, width: "100%", maxHeight: "86vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
        <div style={{ padding: "18px 20px 14px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 10.5, color: accent, letterSpacing: 0.6, marginBottom: 3, fontWeight: 600 }}>{unit.faction}{unit.isHero ? " · Héroe/Personaje" : ""}</div>
            <div style={{ fontSize: 19, fontWeight: 700, color: TEXT, display: "flex", alignItems: "center", gap: 7 }}>
              {unit.isHero && <HeroStar size={14} color={accent} />}
              {unit.name}
            </div>
          </div>
          <button onClick={onClose} style={{ background: SECTION2, border: "none", color: TEXT, width: 30, height: 30, borderRadius: 8, fontSize: 16, cursor: "pointer", flexShrink: 0 }}>✕</button>
        </div>
        <div style={{ padding: "0 20px 20px" }}>
          <div style={{ background: CARD, borderRadius: 12, boxShadow: cardShadow(), display: "flex", gap: 14, padding: "12px 14px", justifyContent: "space-around", flexWrap: "wrap" }}>
            {unit.statPills.map((p) => <StatPill key={p.l} label={p.l} value={p.v} />)}
            <StatPill label="Puntos" value={unit.points != null ? unit.points : "?"} />
          </div>
          {unit.keywords && unit.keywords.length > 0 && (
            <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
              {unit.keywords.map((k) => <Pill key={k}>{k}</Pill>)}
            </div>
          )}

          <WeaponTable title="Armas cuerpo a cuerpo" columns={unit.meleeCols} rows={unit.meleeRows} />
          <WeaponTable title="Armas a distancia" columns={unit.rangedCols} rows={unit.rangedRows} />

          {unit.abilities && unit.abilities.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, color: MUTED, fontWeight: 600, marginBottom: 6, letterSpacing: 0.3 }}>Habilidades</div>
              {unit.abilities.map((a, i) => (
                <div key={i} style={{ background: CARD, borderRadius: 12, boxShadow: cardShadow(), padding: "10px 13px", marginBottom: 8 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, color: CARD_TEXT, fontSize: 13 }}>{a.name}</span>
                    {a.type && <span style={{ fontSize: 10, color: CARD_SUB }}>{a.type}{a.timing ? ` · ${a.timing}` : ""}</span>}
                  </div>
                  {a.declare && <div style={{ fontSize: 12, color: CARD_SUB, marginTop: 3 }}><i>Declarar:</i> {a.declare}</div>}
                  {a.effect && <div style={{ fontSize: 12.5, color: CARD_TEXT, marginTop: 3, lineHeight: 1.45 }}>{a.effect}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ExtraPicker({ label, options, value, onChange }) {
  const selected = options.find((o) => o.name === value);
  return (
    <div style={{ minWidth: 220, flex: "1 1 220px" }}>
      <div style={{ fontSize: 10.5, color: MUTED, marginBottom: 4 }}>{label}</div>
      <Select value={value || ""} onChange={(e) => onChange(e.target.value)} style={{ width: "100%" }}
        options={<><option value="">— Ninguno —</option>{options.map((o) => <option key={o.name} value={o.name}>{o.name}</option>)}</>} />
      {selected && (selected.effect || selected.declare) && (
        <div style={{ fontSize: 11.5, color: PARCH, marginTop: 6, lineHeight: 1.4, background: INK, borderRadius: 6, padding: "8px 10px" }}>
          {selected.declare && <div style={{ color: MUTED, marginBottom: 3 }}><i>Declarar:</i> {selected.declare}</div>}
          {selected.effect}
        </div>
      )}
    </div>
  );
}

/* =================================================================
   PÁGINA PRINCIPAL DE UN JUEGO: gestor de ejércitos guardados
================================================================= */
function HomePage({ system, onOpenArmy }) {
  const cfg = SYSTEMS[system];
  const accent = systemAccent(system);
  const [armies, setArmies] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newFaction, setNewFaction] = useState(cfg.defaultFaction);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    const idx = await storageListIndex(system);
    setArmies(idx.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)));
  }, [system]);

  useEffect(() => { load(); }, [load]);

  async function createArmy() {
    const name = newName.trim() || `Ejército de ${newFaction}`;
    const id = newId();
    const army = { id, name, faction: newFaction, regiments: [], auxiliary: [], generalId: null, nextId: 1, formation: null, trait: null, artefact: null, updatedAt: Date.now() };
    const ok = await storageSet(`army-${system}:${id}`, army);
    const idx = await storageListIndex(system);
    idx.push({ id, name, faction: newFaction, points: 0, updatedAt: Date.now() });
    await storageSet("army-index-" + system, idx);
    setCreating(false); setNewName("");
    // Pasamos el ejército ya creado directamente, sin depender de releerlo
    // del almacenamiento justo después de escribirlo (evita quedarse en
    // "Cargando…" si esa relectura fallara o tardase).
    onOpenArmy(id, ok ? army : null);
  }

  async function deleteArmy(id, e) {
    e.stopPropagation();
    if (!window.confirm("¿Eliminar este ejército? No se puede deshacer.")) return;
    await storageDelete(`army-${system}:${id}`);
    const idx = await storageListIndex(system);
    await storageSet("army-index-" + system, idx.filter((a) => a.id !== id));
    load();
  }

  if (armies === null) return <div style={{ color: MUTED, padding: 30, textAlign: "center" }}>Cargando ejércitos…</div>;

  const filtered = query ? armies.filter((a) => a.name.toLowerCase().includes(query.toLowerCase())) : armies;
  const limit = system === "w40k" ? POINTS_LIMIT_W40K : POINTS_LIMIT_AOS;

  return (
    <div>
      <SectionHeader label="Mis ejércitos" right={<span style={{ fontSize: 11.5, color: MUTED }}>{armies.length}</span>} />
      <SearchInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar ejércitos…" style={{ marginBottom: 14 }} />

      {creating && (
        <div style={{ background: SECTION, borderRadius: 12, padding: 14, marginBottom: 14 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <SearchInput value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nombre del ejército" style={{ flex: 1, minWidth: 160 }} />
            <Select value={newFaction} onChange={(e) => setNewFaction(e.target.value)}
              options={cfg.factions.map((f) => <option key={f} value={f}>{f}</option>)} style={{ minWidth: 180 }} />
            <button onClick={createArmy} style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: CARD, color: CARD_TEXT, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Crear</button>
            <button onClick={() => setCreating(false)} style={{ padding: "10px 14px", borderRadius: 10, border: `1px solid ${BORDER}`, background: "none", color: MUTED, fontSize: 13, cursor: "pointer" }}>Cancelar</button>
          </div>
        </div>
      )}

      {filtered.length === 0 && !creating && (
        <div style={{ color: MUTED, fontSize: 13, padding: 40, textAlign: "center", border: "1px dashed " + BORDER, borderRadius: 12 }}>
          {armies.length === 0 ? `Todavía no tienes ejércitos de ${cfg.label}. Toca el botón + para crear el primero.` : "Sin resultados."}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map((a) => {
          const over = a.points > limit;
          return (
            <div key={a.id} onClick={() => onOpenArmy(a.id)}
              style={{ background: CARD, borderRadius: 14, padding: "14px 16px", cursor: "pointer", boxShadow: cardShadow() }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: CARD_TEXT }}>{a.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <Pill tone={over ? "danger" : undefined}>{a.points || 0} pts</Pill>
                  <button onClick={(e) => deleteArmy(a.id, e)} style={{ background: "none", border: "none", color: CARD_SUB, fontSize: 17, cursor: "pointer", padding: 0, lineHeight: 1 }}>⋮</button>
                </div>
              </div>
              <div style={{ fontSize: 13, color: CARD_SUB, marginTop: 3 }}>{a.faction}</div>
            </div>
          );
        })}
      </div>

      <FAB onClick={() => setCreating(true)} label="Nuevo ejército" />
    </div>
  );
}

/* =================================================================
   EDITOR DE EJÉRCITO
================================================================= */
function ArmyEditor({ system, armyId, initialArmy, onBack, onOpenDetail }) {
  const cfg = SYSTEMS[system];
  const accent = systemAccent(system);
  const AUX_COLOR = "#6f8299";
  const limit = system === "w40k" ? POINTS_LIMIT_W40K : POINTS_LIMIT_AOS;
  const [army, setArmy] = useState(initialArmy || null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [query, setQuery] = useState("");
  const [nameDraft, setNameDraft] = useState(initialArmy ? initialArmy.name : "");
  const [openConfig, setOpenConfig] = useState(true);
  const [openAdd, setOpenAdd] = useState(true);
  const [openAux, setOpenAux] = useState(true);
  const [collapsedRegs, setCollapsedRegs] = useState({});
  const [draggingIdx, setDraggingIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const [pendingTroop, setPendingTroop] = useState("");
  const [openHeroCard, setOpenHeroCard] = useState(true);
  const [openTroopCard, setOpenTroopCard] = useState(true);
  const [pendingTarget, setPendingTarget] = useState("aux");
  const [menuOpenFor, setMenuOpenFor] = useState(null);
  const [addModalRegId, setAddModalRegId] = useState(null);
  const [toast, setToast] = useState(null);
  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1500);
    return () => clearTimeout(t);
  }, [toast]);
  const toggleReg = (id) => setCollapsedRegs((c) => ({ ...c, [id]: !c[id] }));

  const loadArmy = useCallback(async () => {
    setLoadFailed(false);
    const a = await storageGet(`army-${system}:${armyId}`);
    if (a) {
      setArmy(a); setNameDraft(a.name);
    } else {
      setLoadFailed(true);
    }
  }, [armyId, system]);

  useEffect(() => {
    // Si ya nos pasaron el ejército recién creado, no hace falta releerlo.
    if (initialArmy) return;
    loadArmy();
  }, [armyId, system]); // eslint-disable-line react-hooks/exhaustive-deps

  const persist = useCallback(async (updated) => {
    setArmy(updated);
    await storageSet(`army-${system}:${armyId}`, { ...updated, updatedAt: Date.now() });
    const idx = await storageListIndex(system);
    const points = calcPoints(updated);
    const next = idx.map((a) => (a.id === armyId ? { ...a, name: updated.name, points, updatedAt: Date.now() } : a));
    await storageSet("army-index-" + system, next);
  }, [armyId, system]);

  function calcPoints(a) {
    let p = 0;
    a.regiments.forEach((r) => { if (r.hero) p += r.hero.points || 0; r.units.forEach((u) => (p += u.points || 0)); });
    a.auxiliary.forEach((u) => (p += u.points || 0));
    return p;
  }

  if (!army) {
    if (loadFailed) {
      return (
        <div style={{ padding: 30, textAlign: "center" }}>
          <div style={{ color: MUTED, fontSize: 13, marginBottom: 14 }}>No se pudo cargar este ejército. Puede que el almacenamiento haya fallado momentáneamente.</div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button onClick={loadArmy} style={{ padding: "9px 16px", borderRadius: 8, border: "none", background: CARD, color: CARD_TEXT, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Reintentar</button>
            <button onClick={onBack} style={{ padding: "9px 16px", borderRadius: 8, border: `1px solid ${BORDER}`, background: "none", color: MUTED, fontSize: 13, cursor: "pointer" }}>Volver</button>
          </div>
        </div>
      );
    }
    return <div style={{ color: MUTED, padding: 30, textAlign: "center" }}>Cargando…</div>;
  }

  const faction = army.faction;
  const factionUnits = (() => {
    const raw = cfg.db[faction] || {};
    let list = Object.values(raw).map((u) => cfg.normalize(faction, u));
    if (query) list = list.filter((u) => u.name.toLowerCase().includes(query.toLowerCase()));
    return list.sort((a, b) => (b.isHero - a.isHero) || a.name.localeCompare(b.name));
  })();
  const heroOptions = factionUnits.filter((u) => u.isHero);
  const troopOptions = factionUnits.filter((u) => !u.isHero);
  const allTroopsInFaction = Object.values(cfg.db[faction] || {}).map((u) => cfg.normalize(faction, u)).filter((u) => !u.isHero).sort((a, b) => a.name.localeCompare(b.name));
  const allHeroesInFaction = Object.values(cfg.db[faction] || {}).map((u) => cfg.normalize(faction, u)).filter((u) => u.isHero).sort((a, b) => a.name.localeCompare(b.name));

  const uidNext = () => army.nextId;
  function withNextId(a) { return { ...a, nextId: a.nextId + 1 }; }

  function newRegiment(heroUnit) {
    const id = uidNext();
    persist(withNextId({ ...army, regiments: [...army.regiments, { id, hero: { ...heroUnit, instId: id }, units: [] }] }));
    setToast(`Regimiento creado · ${heroUnit.name}`);
  }
  function addUnitToRegiment(regId, unitName) {
    if (!unitName) return;
    const unit = getUnit(system, faction, unitName);
    if (!unit) return;
    const id = uidNext();
    persist(withNextId({ ...army, regiments: army.regiments.map((r) => (r.id === regId ? { ...r, units: [...r.units, { ...unit, instId: id }] } : r)) }));
    setToast(`${unit.name} añadida`);
  }
  function addAuxiliary(unitName) {
    if (!unitName) return;
    const unit = getUnit(system, faction, unitName);
    if (!unit) return;
    const id = uidNext();
    persist(withNextId({ ...army, auxiliary: [...army.auxiliary, { ...unit, instId: id }] }));
    setToast(`${unit.name} añadida a auxiliares`);
  }
  function removeRegiment(regId) {
    const reg = army.regiments.find((r) => r.id === regId);
    const clearGeneral = reg && reg.hero && reg.hero.instId === army.generalId;
    persist({ ...army, regiments: army.regiments.filter((r) => r.id !== regId), generalId: clearGeneral ? null : army.generalId });
  }
  function removeUnitFromRegiment(regId, instId) {
    persist({ ...army, regiments: army.regiments.map((r) => (r.id === regId ? { ...r, units: r.units.filter((u) => u.instId !== instId) } : r)) });
  }
  function duplicateUnitInRegiment(regId, instId) {
    const reg = army.regiments.find((r) => r.id === regId);
    const unit = reg && reg.units.find((u) => u.instId === instId);
    if (!unit) return;
    const id = uidNext();
    persist(withNextId({ ...army, regiments: army.regiments.map((r) => (r.id === regId ? { ...r, units: [...r.units, { ...unit, instId: id }] } : r)) }));
  }
  function removeAuxiliary(instId) { persist({ ...army, auxiliary: army.auxiliary.filter((u) => u.instId !== instId) }); }
  function duplicateAuxiliary(instId) {
    const unit = army.auxiliary.find((u) => u.instId === instId);
    if (!unit) return;
    const id = uidNext();
    persist(withNextId({ ...army, auxiliary: [...army.auxiliary, { ...unit, instId: id }] }));
  }
  function reorderRegiments(fromIdx, toIdx) {
    if (fromIdx == null || toIdx == null || fromIdx === toIdx || toIdx < 0 || toIdx >= army.regiments.length) return;
    const reordered = [...army.regiments];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    persist({ ...army, regiments: reordered });
  }
  function setGeneral(instId) {
    // El regimiento cuyo héroe se marca como General pasa a ser el primero de la lista.
    const idx = army.regiments.findIndex((r) => r.hero && r.hero.instId === instId);
    if (idx <= 0) { persist({ ...army, generalId: instId }); return; }
    const reordered = [...army.regiments];
    const [moved] = reordered.splice(idx, 1);
    reordered.unshift(moved);
    persist({ ...army, generalId: instId, regiments: reordered });
  }
  function saveName() { persist({ ...army, name: nameDraft.trim() || army.name }); }
  function setExtra(field, value) { persist({ ...army, [field]: value || null }); }

  const extras = (cfg.extras && cfg.extras[faction]) || { formations: [], traits: [], artefacts: [] };
  const totalPoints = calcPoints(army);
  const pct = Math.min(100, (totalPoints / limit) * 100);
  const over = totalPoints > limit;
  const generalLabel = system === "w40k" ? "Warlord" : "General";

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: TEXT, fontSize: 20, cursor: "pointer", padding: "2px 4px", lineHeight: 1 }}>←</button>
        <input value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} onBlur={saveName}
          style={{ background: "transparent", border: "none", color: TEXT, fontSize: 18, fontWeight: 700, padding: "4px 2px", outline: "none", flex: 1, minWidth: 120 }} />
        <Pill>{faction}</Pill>
        <button onClick={() => setShowExport(true)} title="Exportar lista" style={{
          background: "none", border: `1px solid ${BORDER}`, color: MUTED, borderRadius: 8, width: 32, height: 32,
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0,
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v12M7 8l5-5 5 5M5 21h14" />
          </svg>
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 6, padding: "0 2px" }}>
        <div style={{ fontSize: 12, color: MUTED }}>{totalPoints} / {limit} pts</div>
        {over && <div style={{ fontSize: 11, color: DANGER, fontWeight: 600 }}>Excede el límite</div>}
      </div>
      <div style={{ height: 6, background: SECTION2, borderRadius: 3, marginBottom: 18, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: over ? DANGER : accent, transition: "width 0.3s" }} />
      </div>

      {(extras.formations.length > 0 || extras.traits.length > 0 || extras.artefacts.length > 0) && (
        <div style={{ marginBottom: 10 }}>
          <SectionHeader label="Configuración" kind="config" color={MUTED} expanded={openConfig} onToggle={() => setOpenConfig((v) => !v)} />
          {openConfig && (
            <div style={{ background: CARD, borderRadius: 12, padding: 14, boxShadow: cardShadow(), display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
              {extras.formations.length > 0 && <ExtraPickerLight label="Formación de batalla" options={extras.formations} value={army.formation} onChange={(v) => setExtra("formation", v)} />}
              {extras.traits.length > 0 && <ExtraPickerLight label={`Rasgo heroico (${generalLabel})`} options={extras.traits} value={army.trait} onChange={(v) => setExtra("trait", v)} />}
              {extras.artefacts.length > 0 && <ExtraPickerLight label={`Artefacto de Poder (${generalLabel})`} options={extras.artefacts} value={army.artefact} onChange={(v) => setExtra("artefact", v)} />}
            </div>
          )}
        </div>
      )}

      <div style={{ marginBottom: 10 }}>
        <SectionHeader label="Añadir unidades" kind="add" color={accent} expanded={openAdd} onToggle={() => setOpenAdd((v) => !v)} />
        {openAdd && (
        <>
          <SearchInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Buscar en ${faction}...`} style={{ marginBottom: 10 }} />

          {/* Tarjeta de Héroes */}
          <div style={{ background: CARD, borderRadius: 12, padding: 14, boxShadow: cardShadow(), marginBottom: 10 }}>
            <CardCollapseHeader label={system === "w40k" ? "Personajes" : "Héroes"} expanded={openHeroCard} onToggle={() => setOpenHeroCard((v) => !v)} />
            {openHeroCard && (
            <div className="ab-scroll" style={{ maxHeight: 200, overflowY: "auto" }}>
              {heroOptions.map((u) => (
                <div key={u.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: `1px solid ${BORDER}` }}>
                  <button onClick={() => onOpenDetail(u)} style={{ background: "none", border: "none", padding: 0, textAlign: "left", cursor: "pointer", flex: 1, minWidth: 0 }}>
                    <div style={{ color: CARD_TEXT, fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6 }}>
                      <HeroStar color={accent} />{u.name}
                    </div>
                    <div style={{ color: CARD_SUB, fontSize: 11 }}>{u.points != null ? `${u.points} pts` : "pts ?"}</div>
                  </button>
                  <button onClick={() => newRegiment(u)} title="Crear regimiento" style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 8, border: "none", background: CARD_TEXT, color: CARD, fontWeight: 700, fontSize: 17, cursor: "pointer" }}>+</button>
                </div>
              ))}
              {heroOptions.length === 0 && <div style={{ color: CARD_SUB, fontSize: 12 }}>Sin resultados.</div>}
            </div>
            )}
          </div>

          {/* Tarjeta de Tropas */}
          <div style={{ background: CARD, borderRadius: 12, padding: 14, boxShadow: cardShadow() }}>
            <CardCollapseHeader label="Tropas" expanded={openTroopCard} onToggle={() => setOpenTroopCard((v) => !v)} />

            {pendingTroop && (
              <div style={{ background: SECTION2, borderRadius: 8, padding: "8px 10px", marginBottom: 10, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 12, color: CARD_TEXT, fontWeight: 600, flex: "1 1 100%" }}>{pendingTroop}</span>
                <select value={pendingTarget} onChange={(e) => setPendingTarget(e.target.value)}
                  style={{ flex: 1, minWidth: 140, background: "#fff", color: CARD_TEXT, border: `1px solid ${BORDER}`, borderRadius: 7, padding: "7px 8px", fontSize: 12.5, cursor: "pointer" }}>
                  <option value="aux">→ Auxiliares</option>
                  {army.regiments.map((r, i) => (
                    <option key={r.id} value={r.id}>→ Regimiento {i + 1}{r.hero ? ` (${r.hero.name})` : ""}</option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    if (pendingTarget === "aux") addAuxiliary(pendingTroop);
                    else addUnitToRegiment(Number(pendingTarget), pendingTroop);
                    setPendingTroop(""); setPendingTarget("aux");
                  }}
                  style={{ padding: "7px 14px", borderRadius: 7, border: "none", background: CARD_TEXT, color: CARD, fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>
                  Añadir
                </button>
                <button onClick={() => { setPendingTroop(""); setPendingTarget("aux"); }}
                  style={{ padding: "7px 10px", borderRadius: 7, border: `1px solid ${CARD_SUB}`, background: "transparent", color: CARD_SUB, fontSize: 12.5, cursor: "pointer" }}>
                  ✕
                </button>
              </div>
            )}

            <div className="ab-scroll" style={{ maxHeight: 220, overflowY: "auto", display: openTroopCard ? "block" : "none" }}>
              {troopOptions.map((u) => (
                <div key={u.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: `1px solid ${BORDER}` }}>
                  <button onClick={() => onOpenDetail(u)} style={{ background: "none", border: "none", padding: 0, textAlign: "left", cursor: "pointer", flex: 1, minWidth: 0 }}>
                    <div style={{ color: CARD_TEXT, fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name}</div>
                    <div style={{ color: CARD_SUB, fontSize: 11 }}>{u.points != null ? `${u.points} pts` : "pts ?"}</div>
                  </button>
                  <button onClick={() => { setPendingTroop(u.name); setPendingTarget(army.regiments.length > 0 ? String(army.regiments[0].id) : "aux"); }}
                    title="Elegir destino" style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 8, border: `1px solid ${CARD_SUB}`, background: "transparent", color: CARD_TEXT, fontWeight: 700, fontSize: 17, cursor: "pointer" }}>+</button>
                </div>
              ))}
              {troopOptions.length === 0 && <div style={{ color: CARD_SUB, fontSize: 12 }}>Sin resultados.</div>}
            </div>
          </div>
        </>
        )}
      </div>

      {army.regiments.length === 0 && army.auxiliary.length === 0 && (
        <div style={{ color: MUTED, fontSize: 13, padding: 30, textAlign: "center", border: "1px dashed " + BORDER, borderRadius: 12 }}>
          Pulsa "+" sobre un {system === "w40k" ? "personaje" : "héroe"} para crear tu primer regimiento.
        </div>
      )}

      {army.regiments.map((r, idx) => {
        const isGeneral = r.hero && r.hero.instId === army.generalId;
        const isOpen = collapsedRegs[r.id] !== true;
        const isDragOver = dragOverIdx === idx;
        return (
          <div
            key={r.id}
            style={{ marginBottom: 10, opacity: draggingIdx === idx ? 0.4 : 1, borderTop: isDragOver ? `2px solid ${accent}` : "2px solid transparent" }}
            draggable
            onDragStart={() => setDraggingIdx(idx)}
            onDragOver={(e) => { e.preventDefault(); if (dragOverIdx !== idx) setDragOverIdx(idx); }}
            onDragLeave={() => setDragOverIdx((v) => (v === idx ? null : v))}
            onDrop={(e) => { e.preventDefault(); reorderRegiments(draggingIdx, idx); setDraggingIdx(null); setDragOverIdx(null); }}
            onDragEnd={() => { setDraggingIdx(null); setDragOverIdx(null); }}
          >
            <SectionHeader
              label={`Regimiento ${idx + 1}${isGeneral ? ` · ★ ${generalLabel}` : ""}`}
              kind="regiment" color={accent} expanded={isOpen} onToggle={() => toggleReg(r.id)}
              right={
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span title="Arrastra para reordenar" style={{ cursor: "grab", color: MUTED, fontSize: 14, lineHeight: 1, userSelect: "none", padding: "0 2px" }}>⠿</span>
                  <button onClick={() => reorderRegiments(idx, idx - 1)} disabled={idx === 0} title="Subir"
                    style={{ background: "none", border: "none", color: idx === 0 ? "#3a3a40" : MUTED, cursor: idx === 0 ? "default" : "pointer", fontSize: 13, padding: 0, lineHeight: 1 }}>▲</button>
                  <button onClick={() => reorderRegiments(idx, idx + 1)} disabled={idx === army.regiments.length - 1} title="Bajar"
                    style={{ background: "none", border: "none", color: idx === army.regiments.length - 1 ? "#3a3a40" : MUTED, cursor: idx === army.regiments.length - 1 ? "default" : "pointer", fontSize: 13, padding: 0, lineHeight: 1 }}>▼</button>
                  {!isGeneral && r.hero && (
                    <button onClick={() => setGeneral(r.hero.instId)} style={{ background: "none", border: "none", color: accent, fontSize: 11, cursor: "pointer", padding: 0, fontWeight: 600 }}>Marcar {generalLabel}</button>
                  )}
                  <button onClick={() => setMenuOpenFor(menuOpenFor === r.id ? null : r.id)} style={{ background: "none", border: "none", color: MUTED, fontSize: 18, cursor: "pointer", padding: 0, lineHeight: 1 }}>⋮</button>
                </div>
              }
            />
            {menuOpenFor === r.id && (
              <div style={{ background: SECTION2, borderRadius: 10, padding: "10px 12px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: MUTED }}>¿Eliminar este regimiento y todo su contenido?</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setMenuOpenFor(null)} style={{ background: "none", border: `1px solid ${BORDER}`, color: MUTED, borderRadius: 6, fontSize: 11.5, padding: "5px 10px", cursor: "pointer" }}>Cancelar</button>
                  <button onClick={() => { removeRegiment(r.id); setMenuOpenFor(null); }} style={{ background: DANGER, border: "none", color: "#fff", borderRadius: 6, fontSize: 11.5, padding: "5px 10px", cursor: "pointer", fontWeight: 600 }}>Eliminar</button>
                </div>
              </div>
            )}
            {isOpen && <>
            {r.hero && (
              <div style={{
                background: `linear-gradient(90deg, ${accent}22, ${CARD} 40%)`, borderLeft: `3px solid ${accent}`,
                borderRadius: 12, padding: "13px 14px", boxShadow: cardShadow(), marginBottom: 6,
              }}>
                <button onClick={() => onOpenDetail(r.hero)} style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0, width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <span style={{ color: CARD_TEXT, fontSize: 15.5, fontWeight: 800, display: "flex", alignItems: "center", gap: 7 }}>
                    <HeroStar color={accent} size={14} />{r.hero.name}
                  </span>
                  <Pill>{r.hero.points != null ? `${r.hero.points} pts` : "pts ?"}</Pill>
                </button>
                <div style={{ fontSize: 10, color: accent, fontWeight: 700, letterSpacing: 0.5, marginTop: 3, textTransform: "uppercase" }}>
                  {isGeneral ? generalLabel : (system === "w40k" ? "Personaje" : "Héroe")} al mando
                </div>
              </div>
            )}
            {r.units.map((u) => (
              <SwipeableRow key={u.instId} onDelete={() => removeUnitFromRegiment(r.id, u.instId)} onDuplicate={() => duplicateUnitInRegiment(r.id, u.instId)}>
                <div style={{ background: CARD, borderRadius: 12, padding: "11px 14px", boxShadow: cardShadow(), display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <button onClick={() => onOpenDetail(u)} style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0, flex: 1, minWidth: 0 }}>
                    <span style={{ color: CARD_TEXT, fontSize: 14, fontWeight: 600 }}>{u.name}</span>
                  </button>
                  <Pill>{u.points != null ? `${u.points} pts` : "pts ?"}</Pill>
                </div>
              </SwipeableRow>
            ))}
            <button onClick={() => setAddModalRegId(r.id)} style={{
              width: "100%", padding: "10px 0", borderRadius: 10, border: `1px dashed ${BORDER}`,
              background: "none", color: MUTED, fontSize: 13, cursor: "pointer", fontWeight: 600,
            }}>+ Añadir unidad</button>
            </>}
          </div>
        );
      })}

      {addModalRegId != null && (() => {
        const idx2 = army.regiments.findIndex((r) => r.id === addModalRegId);
        if (idx2 === -1) return null;
        return (
          <AddUnitToRegimentModal
            system={system} faction={faction} regLabel={`Regimiento ${idx2 + 1}`}
            onClose={() => setAddModalRegId(null)}
            onPick={(name) => addUnitToRegiment(addModalRegId, name)}
          />
        );
      })()}

      <div style={{ marginBottom: 90 }}>
        <SectionHeader label="Unidades auxiliares" kind="aux" color={AUX_COLOR} expanded={openAux} onToggle={() => setOpenAux((v) => !v)} />
        {openAux && <>
        {army.auxiliary.length === 0 && <div style={{ color: MUTED, fontSize: 12, marginBottom: 8, padding: "0 2px" }}>Ninguna todavía.</div>}
        {army.auxiliary.map((u) => (
          <SwipeableRow key={u.instId} onDelete={() => removeAuxiliary(u.instId)} onDuplicate={() => duplicateAuxiliary(u.instId)}>
          <div style={{ background: CARD, borderRadius: 12, padding: "11px 14px", boxShadow: cardShadow(), display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <button onClick={() => onOpenDetail(u)} style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0, flex: 1, minWidth: 0 }}>
              <span style={{ color: CARD_TEXT, fontSize: 14, fontWeight: 600 }}>{u.name}</span>
            </button>
            <Pill>{u.points != null ? `${u.points} pts` : "pts ?"}</Pill>
          </div>
          </SwipeableRow>
        ))}
        </>}
      </div>

      {toast && (
        <div style={{
          position: "fixed", left: "50%", transform: "translateX(-50%)", bottom: 78, zIndex: 60,
          background: CARD, color: CARD_TEXT, padding: "10px 18px", borderRadius: 10, boxShadow: cardShadow(),
          fontSize: 13, fontWeight: 600, whiteSpace: "nowrap",
        }}>
          {toast}
        </div>
      )}

      {showExport && (
        <ExportModal system={system} faction={faction} army={army} limit={limit} generalLabel={generalLabel} onClose={() => setShowExport(false)} />
      )}
    </>
  );
}

function CardCollapseHeader({ label, expanded, onToggle }) {
  return (
    <button onClick={onToggle} style={{
      width: "100%", background: "none", border: "none", padding: 0, marginBottom: 8,
      display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer",
    }}>
      <span style={{ fontSize: 11, color: CARD_SUB, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase" }}>{label}</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={CARD_SUB} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
        <path d="M6 9l6 6 6-6" />
      </svg>
    </button>
  );
}

/* Fila con gestos de deslizar: izquierda = eliminar, derecha = duplicar.
   Sin necesidad de ningún botón. */
function SwipeableRow({ children, onDelete, onDuplicate }) {
  const [dragX, setDragX] = useState(0);
  const elRef = useRef(null);
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const axisRef = useRef(null); // "x" | "y" | null (aún sin decidir)
  const dragXRef = useRef(0);
  const THRESHOLD = 64;

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    function getPoint(e) {
      if (e.touches && e.touches.length) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      return { x: e.clientX, y: e.clientY };
    }

    function onStart(e) {
      const p = getPoint(e);
      draggingRef.current = true;
      axisRef.current = null;
      startXRef.current = p.x;
      startYRef.current = p.y;
    }
    function onMove(e) {
      if (!draggingRef.current) return;
      const p = getPoint(e);
      const dx = p.x - startXRef.current;
      const dy = p.y - startYRef.current;

      if (axisRef.current === null && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
        axisRef.current = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      }
      if (axisRef.current === "y") return; // el usuario está haciendo scroll vertical: no interferir
      if (axisRef.current === "x") {
        if (e.cancelable) e.preventDefault(); // evita que la página haga scroll mientras deslizamos
        const clamped = Math.max(-130, Math.min(130, dx));
        dragXRef.current = clamped;
        setDragX(clamped);
      }
    }
    function onEnd() {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      const dx = dragXRef.current;
      dragXRef.current = 0;
      axisRef.current = null;
      if (dx <= -THRESHOLD && onDelete) onDelete();
      else if (dx >= THRESHOLD && onDuplicate) onDuplicate();
      setDragX(0);
    }

    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd, { passive: true });
    el.addEventListener("touchcancel", onEnd, { passive: true });
    el.addEventListener("mousedown", onStart);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onEnd);

    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onEnd);
      el.removeEventListener("mousedown", onStart);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onEnd);
    };
  }, [onDelete, onDuplicate]);

  const showBg = dragX !== 0;
  const isDelete = dragX < 0;
  const bg = isDelete ? DANGER : "#3f8f5c";
  const label = isDelete ? "Eliminar" : "Duplicar";

  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: 12, marginBottom: 6 }}>
      {showBg && (
        <div style={{
          position: "absolute", inset: 0, background: bg, borderRadius: 12,
          display: "flex", alignItems: "center", color: "#fff", fontWeight: 700, fontSize: 12,
          justifyContent: isDelete ? "flex-end" : "flex-start", padding: "0 18px",
        }}>
          {label}
        </div>
      )}
      <div
        ref={elRef}
        style={{
          transform: `translateX(${dragX}px)`, transition: draggingRef.current ? "none" : "transform 0.2s ease",
          touchAction: "pan-y", userSelect: "none", WebkitUserSelect: "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* Modal para añadir unidades a un regimiento concreto, con buscador */
function generateExportText(system, faction, army, limit, generalLabel) {
  const cfgLabel = system === "w40k" ? "Warhammer 40.000" : "Age of Sigmar";
  let total = 0;
  const lines = [];
  lines.push(`${army.name}`);
  lines.push(`${faction} — ${cfgLabel}`);
  lines.push("");

  army.regiments.forEach((r, i) => {
    const isGen = r.hero && r.hero.instId === army.generalId;
    lines.push(`Regimiento ${i + 1}${isGen ? ` (${generalLabel})` : ""}`);
    if (r.hero) {
      lines.push(`  ${r.hero.name} — ${r.hero.points != null ? r.hero.points : "?"} pts`);
      total += r.hero.points || 0;
    }
    r.units.forEach((u) => {
      lines.push(`  ${u.name} — ${u.points != null ? u.points : "?"} pts`);
      total += u.points || 0;
    });
    lines.push("");
  });

  if (army.auxiliary.length > 0) {
    lines.push("Auxiliares");
    army.auxiliary.forEach((u) => {
      lines.push(`  ${u.name} — ${u.points != null ? u.points : "?"} pts`);
      total += u.points || 0;
    });
    lines.push("");
  }

  lines.push(`Total: ${total} / ${limit} pts`);
  return lines.join("\n");
}

function ExportModal({ system, faction, army, limit, generalLabel, onClose }) {
  const [copied, setCopied] = useState(false);
  const text = useMemo(() => generateExportText(system, faction, army, limit, generalLabel), [system, faction, army, limit, generalLabel]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      setCopied(false);
    }
  }
  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: army.name, text });
      else copy();
    } catch (e) { /* el usuario canceló el share, no pasa nada */ }
  }

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 65, padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: SECTION, borderRadius: 16, maxWidth: 560, width: "100%", maxHeight: "82vh", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "16px 18px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: TEXT }}>Exportar lista</div>
          <button onClick={onClose} style={{ background: SECTION2, border: "none", color: TEXT, width: 30, height: 30, borderRadius: 8, fontSize: 16, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ padding: "0 18px", flex: 1, overflowY: "auto" }} className="ab-scroll">
          <pre style={{
            background: CARD, color: CARD_TEXT, borderRadius: 10, padding: 14, fontSize: 12.5, lineHeight: 1.5,
            whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "ui-monospace, monospace", margin: 0,
          }}>{text}</pre>
        </div>
        <div style={{ padding: 18, display: "flex", gap: 10 }}>
          <button onClick={copy} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "none", background: CARD, color: CARD_TEXT, fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>
            {copied ? "✓ Copiado" : "Copiar texto"}
          </button>
          <button onClick={share} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: `1px solid ${BORDER}`, background: "none", color: TEXT, fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>
            Compartir
          </button>
        </div>
      </div>
    </div>
  );
}

function AddUnitToRegimentModal({ system, faction, regLabel, onClose, onPick }) {
  const cfg = SYSTEMS[system];
  const accent = systemAccent(system);
  const [query, setQuery] = useState("");
  const units = useMemo(() => {
    const raw = cfg.db[faction] || {};
    return Object.values(raw).map((u) => cfg.normalize(faction, u))
      .filter((u) => u.name.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => (b.isHero - a.isHero) || a.name.localeCompare(b.name));
  }, [faction, query, system]);
  const heroes = units.filter((u) => u.isHero);
  const troops = units.filter((u) => !u.isHero);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 55 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: SECTION, borderRadius: "16px 16px 0 0", width: "100%", maxWidth: 620, height: "80vh", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "16px 18px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 10.5, color: accent, fontWeight: 600 }}>{regLabel}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: TEXT }}>Añadir unidad</div>
          </div>
          <button onClick={onClose} style={{ background: SECTION2, border: "none", color: TEXT, width: 30, height: 30, borderRadius: 8, fontSize: 16, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ padding: "0 18px 10px" }}>
          <SearchInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Buscar en ${faction}...`} style={{ width: "100%" }} />
        </div>
        <div className="ab-scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "0 18px 18px" }}>
          {heroes.length > 0 && (
            <>
              <div style={{ fontSize: 11, color: MUTED, fontWeight: 700, margin: "8px 0 6px", letterSpacing: 0.4, textTransform: "uppercase" }}>
                {system === "w40k" ? "Personajes" : "Héroes"}
              </div>
              {heroes.map((u) => (
                <div key={u.name} style={{ background: CARD, borderRadius: 10, padding: "10px 12px", marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <span style={{ color: CARD_TEXT, fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 6, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <HeroStar color={accent} />{u.name}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <Pill>{u.points != null ? `${u.points} pts` : "pts ?"}</Pill>
                    <button onClick={() => onPick(u.name)} style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: CARD_TEXT, color: CARD, fontWeight: 700, fontSize: 16, cursor: "pointer" }}>+</button>
                  </div>
                </div>
              ))}
            </>
          )}
          <div style={{ fontSize: 11, color: MUTED, fontWeight: 700, margin: "10px 0 6px", letterSpacing: 0.4, textTransform: "uppercase" }}>Tropas</div>
          {troops.map((u) => (
            <div key={u.name} style={{ background: CARD, borderRadius: 10, padding: "10px 12px", marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <span style={{ color: CARD_TEXT, fontWeight: 600, fontSize: 13, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <Pill>{u.points != null ? `${u.points} pts` : "pts ?"}</Pill>
                <button onClick={() => onPick(u.name)} style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: CARD_TEXT, color: CARD, fontWeight: 700, fontSize: 16, cursor: "pointer" }}>+</button>
              </div>
            </div>
          ))}
          {units.length === 0 && <div style={{ color: MUTED, fontSize: 13, textAlign: "center", padding: 20 }}>Sin resultados.</div>}
        </div>
      </div>
    </div>
  );
}

function ExtraPickerLight({ label, options, value, onChange }) {
  const selected = options.find((o) => o.name === value);
  return (
    <div style={{ minWidth: 200, flex: "1 1 200px" }}>
      <div style={{ fontSize: 10.5, color: CARD_SUB, marginBottom: 4, fontWeight: 600 }}>{label}</div>
      <select value={value || ""} onChange={(e) => onChange(e.target.value)}
        style={{ width: "100%", background: SECTION2, color: CARD_TEXT, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "8px 10px", fontSize: 13, cursor: "pointer" }}>
        <option value="">— Ninguno —</option>
        {options.map((o) => <option key={o.name} value={o.name}>{o.name}</option>)}
      </select>
      {selected && (selected.effect || selected.declare) && (
        <div style={{ fontSize: 11.5, color: CARD_TEXT, marginTop: 6, lineHeight: 1.4, background: SECTION2, borderRadius: 8, padding: "8px 10px" }}>
          {selected.declare && <div style={{ color: CARD_SUB, marginBottom: 3 }}><i>Declarar:</i> {selected.declare}</div>}
          {selected.effect}
        </div>
      )}
    </div>
  );
}


/* =================================================================
   MODO: BASE DE DATOS COMPLETA (solo consulta)
================================================================= */
function FullDatabase({ system, onOpenDetail }) {
  const cfg = SYSTEMS[system];
  const accent = systemAccent(system);
  const [faction, setFaction] = useState(cfg.defaultFaction);
  const [query, setQuery] = useState("");

  const units = useMemo(() => {
    const raw = cfg.db[faction] || {};
    return Object.values(raw).map((u) => cfg.normalize(faction, u))
      .filter((u) => u.name.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [faction, query, system]);

  const totalUnits = useMemo(() => Object.values(cfg.db).reduce((n, f) => n + Object.keys(f).length, 0), [system]);

  return (
    <div>
      <SectionHeader label="Base de datos" right={<span style={{ fontSize: 11, color: MUTED }}>{totalUnits} unidades</span>} />
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <Select value={faction} onChange={(e) => setFaction(e.target.value)} style={{ minWidth: 220 }} options={cfg.factions.map((f) => <option key={f} value={f}>{f}</option>)} />
        <SearchInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar unidad..." style={{ flex: 1, minWidth: 160 }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {units.map((u) => (
          <button key={u.name} onClick={() => onOpenDetail(u)}
            style={{ textAlign: "left", background: CARD, borderRadius: 12, padding: "12px 14px", cursor: "pointer", boxShadow: cardShadow(),
              display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, border: "none" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: CARD_TEXT, fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
                {u.isHero && <HeroStar color={accent} />}
                {u.name}
              </div>
              <div style={{ color: CARD_SUB, fontSize: 11.5, marginTop: 2 }}>{u.statPills[0].l} {u.statPills[0].v || "—"}{u.isHero ? " · Héroe" : ""}</div>
            </div>
            <Pill>{u.points != null ? `${u.points} pts` : "pts ?"}</Pill>
          </button>
        ))}
        {units.length === 0 && <div style={{ color: MUTED, fontSize: 13, padding: 20, textAlign: "center" }}>Sin resultados.</div>}
      </div>
    </div>
  );
}

/* =================================================================
   NAVEGACIÓN (Mis ejércitos / Base de datos)
================================================================= */
function BottomTab({ active, label, icon, onClick }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
      background: "none", border: "none", cursor: "pointer", padding: "9px 4px 8px",
      color: active ? PARCH : MUTED,
    }}>
      {icon}
      <span style={{ fontSize: 10.5, fontWeight: active ? 700 : 500 }}>{label}</span>
    </button>
  );
}

function GameApp({ system, onExit }) {
  const cfg = SYSTEMS[system];
  const accent = systemAccent(system);
  const [view, setView] = useState("home");
  const [activeArmyId, setActiveArmyId] = useState(null);
  const [prefetchedArmy, setPrefetchedArmy] = useState(null);
  const [detailUnit, setDetailUnit] = useState(null);

  const iconStyle = (isActive) => ({ width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: isActive ? accent : MUTED, strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" });

  return (
    <div style={{ paddingBottom: 66 }}>
      <div style={{ padding: "16px 18px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={onExit} style={{ background: "none", border: "none", color: MUTED, fontSize: 12, cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 5 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: TEXT }}>{cfg.label}</div>
        </div>
        <div style={{ width: 42 }} />
      </div>

      <div style={{ padding: "16px 16px 4px" }}>
        {view === "home" && <HomePage system={system} onOpenArmy={(id, prefetched) => { setActiveArmyId(id); setPrefetchedArmy(prefetched || null); setView("editor"); }} />}
        {view === "editor" && activeArmyId && <ArmyEditor system={system} armyId={activeArmyId} initialArmy={prefetchedArmy} onBack={() => { setView("home"); setActiveArmyId(null); setPrefetchedArmy(null); }} onOpenDetail={setDetailUnit} />}
        {view === "database" && <FullDatabase system={system} onOpenDetail={setDetailUnit} />}
      </div>

      {detailUnit && <GenericDetail unit={detailUnit} onClose={() => setDetailUnit(null)} />}

      {/* Barra de navegación inferior fija — patrón de apps móviles nativas */}
      <div style={{
        position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 40,
        background: "rgba(10,10,11,0.97)", borderTop: `1px solid ${BORDER}`,
        display: "flex", width: "100%",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}>
        <BottomTab active={view !== "database"} label="Ejércitos" onClick={() => { setView("home"); setActiveArmyId(null); }}
          icon={<svg {...iconStyle(view !== "database")}><path d="M12 2l2.2 4.8L19 8l-3.6 3.4.9 5.1L12 14l-4.3 2.5.9-5.1L5 8l4.8-1.2L12 2z" /></svg>} />
        <BottomTab active={view === "database"} label="Base de datos" onClick={() => setView("database")}
          icon={<svg {...iconStyle(view === "database")}><rect x="4" y="4" width="16" height="4" rx="1" /><rect x="4" y="10" width="16" height="4" rx="1" /><rect x="4" y="16" width="16" height="4" rx="1" /></svg>} />
      </div>
    </div>
  );
}

/* =================================================================
   MENÚ PRINCIPAL
================================================================= */
function MainMenu({ onSelect }) {
  return (
    <div style={{ padding: "56px 20px 40px", width: "100%", boxSizing: "border-box" }}>
     <div style={{ fontSize: 34, fontWeight: 800, textAlign: "center", color: TEXT, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 24 }}>
     ARMY PLANNER
   </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <button onClick={() => onSelect("aos")}
          style={{ textAlign: "left", background: CARD, borderRadius: 14, padding: "22px 20px", cursor: "pointer", border: "none",
            boxShadow: cardShadow(), display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: CARD_TEXT }}>Age of Sigmar</div>
            <div style={{ fontSize: 12, color: CARD_SUB, marginTop: 3 }}>{AOS_FACTIONS.length} facciones registradas</div>
          </div>
          <Pill>4ª Ed.</Pill>
        </button>
        <button onClick={() => onSelect("w40k")}
          style={{ textAlign: "left", background: CARD, borderRadius: 14, padding: "22px 20px", cursor: "pointer", border: "none",
            boxShadow: cardShadow(), display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: CARD_TEXT }}>Warhammer 40.000</div>
            <div style={{ fontSize: 12, color: CARD_SUB, marginTop: 3 }}>{W40K_FACTIONS.length} facciones registradas</div>
          </div>
          <Pill>11ª Ed.</Pill>
        </button>
      </div>
    </div>
  );
}

/* =================================================================
   APP RAÍZ — ocupa todo el ancho disponible, sin márgenes muertos
================================================================= */
function ArmyBuilder() {
  const [game, setGame] = useState(null); // null | "aos" | "w40k"

  return (
    <div style={{ background: BG, minHeight: "100%", width: "100%" }}>
      <style>{`
        .ab-scroll { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.16) transparent; }
        .ab-scroll::-webkit-scrollbar { width: 5px; height: 5px; }
        .ab-scroll::-webkit-scrollbar-track { background: transparent; }
        .ab-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.16); border-radius: 3px; }
        .ab-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.28); }
        html, body { background: ${BG}; }
      `}</style>
      <div style={{ width: "100%", fontFamily: "system-ui, -apple-system, sans-serif", color: TEXT, minHeight: "100%" }}>
        {game === null ? <MainMenu onSelect={setGame} /> : <GameApp system={game} onExit={() => setGame(null)} />}
      </div>
    </div>
  );
}
