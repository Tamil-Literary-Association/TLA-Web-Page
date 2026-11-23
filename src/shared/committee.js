// The committee (/teams/committee and the card on /teams): rows in the Supabase
// `committee_members` table plus one `committee_settings` row (the year and
// the intro line). See supabase/migrations/committee.sql. Main admins edit
// them at /admin/committee.
//
// When the tables can't be read (committee.sql not run yet, or Supabase is
// down) the committee built into committeeData.js is used, so the page always
// shows someone.
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../helpers/supabaseClient";
import { deleteImages } from "./cloudinaryUpload";
import {
  BUILT_IN_COMMITTEE,
  COMMITTEE_GROUP_DEFS,
  DEFAULT_FOCUS,
  GROUP_IDS,
} from "../Components/teams/committee/committeeData";

const MEMBERS = "committee_members";
const SETTINGS = "committee_settings";
const LS_KEY = "tla_committee_v1";

export { COMMITTEE_GROUP_DEFS };

// ---- Normalising ---------------------------------------------------------------------------

const str = (v) => (typeof v === "string" ? v : "");
const clampFocus = (n) => {
  const v = Math.round(Number(n));
  return Number.isFinite(v) ? Math.min(100, Math.max(0, v)) : DEFAULT_FOCUS;
};

// Whitelist + tidy so a bad row never breaks the page.
export function normalizeMember(r) {
  const o = r || {};
  return {
    id: str(o.id),
    group_id: GROUP_IDS.includes(o.group_id) ? o.group_id : GROUP_IDS[GROUP_IDS.length - 1],
    name: str(o.name),
    role: str(o.role),
    role_en: str(o.role_en),
    photo_url: str(o.photo_url),
    photo_public_id: str(o.photo_public_id),
    photo_focus: o.photo_focus === undefined || o.photo_focus === null ? DEFAULT_FOCUS : clampFocus(o.photo_focus),
    sort_order: Number.isFinite(Number(o.sort_order)) ? Number(o.sort_order) : 0,
    is_visible: o.is_visible !== false,
    updated_at: o.updated_at || null,
  };
}

export const normalizeSettings = (s) => ({
  year: str((s || {}).year).trim() || BUILT_IN_COMMITTEE.year,
  intro: str((s || {}).intro),
});

const byOrder = (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name);

// Everyone sorted into the page's sections, in page order. Sections with
// nobody in them are left out unless `keepEmpty`.
export function groupMembers(members, { keepEmpty = false } = {}) {
  return COMMITTEE_GROUP_DEFS.map((def) => ({
    ...def,
    members: members.filter((m) => m.group_id === def.id).sort(byOrder),
  })).filter((g) => keepEmpty || g.members.length);
}

const BUILT_IN = {
  settings: normalizeSettings(BUILT_IN_COMMITTEE),
  members: BUILT_IN_COMMITTEE.members.map(normalizeMember),
};

// ---- Reading -------------------------------------------------------------------------------

// Visitors get the visible people (row-level security); main admins get
// everyone. Throws when the tables can't be read.
export async function fetchCommittee() {
  const [m, s] = await Promise.all([
    supabase.from(MEMBERS).select("*").order("sort_order", { ascending: true }),
    supabase.from(SETTINGS).select("*").eq("id", 1).maybeSingle(),
  ]);
  if (m.error) throw new Error(m.error.message || "Couldn't read the committee.");
  return {
    members: (m.data || []).map(normalizeMember),
    settings: normalizeSettings(s.error ? null : s.data),
  };
}

function readCache() {
  try {
    const c = JSON.parse(localStorage.getItem(LS_KEY));
    if (!c || !Array.isArray(c.members)) return null;
    return { settings: normalizeSettings(c.settings), members: c.members.map(normalizeMember).filter((x) => x.name) };
  } catch {
    return null;
  }
}

function writeCache(data) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

// What visitors see: { year, intro, groups, count, preview }. Starts from the
// last answer (or the built-in committee) so the page draws at once, then asks
// the database.
export function useCommittee() {
  const [data, setData] = useState(() => readCache() || BUILT_IN);

  useEffect(() => {
    let alive = true;
    fetchCommittee()
      .then((d) => {
        const shown = { settings: d.settings, members: d.members.filter((x) => x.is_visible) };
        // An empty table (everyone deleted) still shows the empty page, not the built-in people.
        writeCache(shown);
        if (alive) setData(shown);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return useMemo(() => {
    const groups = groupMembers(data.members);
    const first = groups.find((g) => g.id === "office-bearers") || groups[0];
    // The Teams page card: the first office bearer in the middle, others either side.
    let preview = [];
    if (first) {
      const [lead, ...rest] = first.members;
      const pool = [...rest, ...groups.filter((g) => g !== first).flatMap((g) => g.members)];
      preview = [pool[2], pool[0], lead, pool[1], pool[3]].filter(Boolean);
    }
    return {
      year: data.settings.year,
      intro: data.settings.intro,
      groups,
      count: data.members.length,
      preview,
    };
  }, [data]);
}

// ---- Writing (main admins) -----------------------------------------------------------------

// Row-level security turns "not allowed" into "0 rows", not an error.
function needRow(data) {
  if (!data || !data.length) throw new Error("Nothing was saved - only main admins can change the committee.");
}

const friendly = (error, fallback) => {
  const m = (error && error.message) || "";
  if (/committee_members_name_present/.test(m)) return "Type the person's name.";
  if (/relation .* does not exist|PGRST205|Could not find the table/i.test(m))
    return "The committee tables aren't set up yet. Run supabase/migrations/committee.sql in Supabase first.";
  return m || fallback;
};

// Adds the person when `isNew`, updates them otherwise. -> the saved row.
export async function saveMember(member, { isNew = false } = {}) {
  const clean = normalizeMember(member);
  const body = {
    group_id: clean.group_id,
    name: clean.name.trim(),
    role: clean.role.trim(),
    role_en: clean.role_en.trim(),
    photo_url: clean.photo_url.trim(),
    photo_public_id: clean.photo_public_id,
    photo_focus: clean.photo_focus,
    sort_order: clean.sort_order,
    is_visible: clean.is_visible,
  };
  const q = isNew ? supabase.from(MEMBERS).insert(body) : supabase.from(MEMBERS).update(body).eq("id", clean.id);
  const { data, error } = await q.select("*");
  if (error) throw new Error(friendly(error, "Could not save."));
  needRow(data);
  return normalizeMember(data[0]);
}

export async function setMemberVisible(id, visible) {
  const { data, error } = await supabase.from(MEMBERS).update({ is_visible: visible }).eq("id", id).select("id");
  if (error) throw new Error(friendly(error, "Could not save."));
  needRow(data);
}

// Deletes the person, and their uploaded photo (if the admin uploaded one).
export async function removeMember(member) {
  const { data, error } = await supabase.from(MEMBERS).delete().eq("id", member.id).select("id");
  if (error) throw new Error(friendly(error, "Could not delete."));
  needRow(data);
  if (member.photo_public_id) deleteImages([member.photo_public_id]).catch(() => {});
}

// `rows` is one section's people in the new order; numbers them 0..n-1,
// saving only what changed.
export async function saveMemberOrder(rows) {
  const results = await Promise.all(
    rows.map((r, i) => (r.sort_order === i ? null : supabase.from(MEMBERS).update({ sort_order: i }).eq("id", r.id)))
  );
  const failed = results.find((r) => r && r.error);
  if (failed) throw new Error(friendly(failed.error, "Could not save the order."));
}

export async function saveCommitteeSettings({ year, intro }) {
  const body = { id: 1, year: str(year).trim(), intro: str(intro).trim() };
  const { data, error } = await supabase.from(SETTINGS).upsert(body).select("*");
  if (error) throw new Error(friendly(error, "Could not save."));
  needRow(data);
  return normalizeSettings(data[0]);
}
