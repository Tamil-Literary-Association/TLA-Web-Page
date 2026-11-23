// /admin/committee - who is on the committee page (/teams/committee) and the
// card on /teams. Add, edit, hide, reorder and delete people; set the year.
// Written for someone opening it for the first time: every step says what it
// does and where it shows up. Main admins only. Data: src/shared/committee.js.
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import {
  FaArrowDown,
  FaArrowUp,
  FaCheck,
  FaChevronDown,
  FaEye,
  FaEyeSlash,
  FaGoogleDrive,
  FaExternalLinkAlt,
  FaPen,
  FaPlus,
  FaStar,
  FaTimes,
  FaTrash,
  FaUpload,
  FaUserCircle,
} from "react-icons/fa";

import LotusDivider from "./LotusDivider";
import { prepareImage } from "../shared/imagePrep";
import { COMMITTEE_SCOPE, deleteImages, signUploads, uploadSigned } from "../shared/cloudinaryUpload";
import { isImageFile } from "../shared/useImageUploads";
import { driveFileId, safeUrl } from "../shared/mediaLinks";
import {
  fetchCommittee,
  groupMembers,
  removeMember,
  saveCommitteeSettings,
  saveMember,
  saveMemberOrder,
  setMemberVisible,
} from "../shared/committee";
import { COMMITTEE_GROUP_DEFS, DEFAULT_FOCUS, ROLE_PRESETS } from "../Components/teams/committee/committeeData";
import { PortraitCard, CircleCard } from "../Components/teams/committee/Committee";
import { SmartImage } from "../Components/teams/team-detail/media";
import "./Frame.css";
import "./Admin.css";
import "./AdminMaintenance.css";
import "../Components/teams/committee/committee.css";
import "./AdminCommittee.css";

const GUIDE_KEY = "tla_admin_committee_guide_closed";
const groupDef = (id) => COMMITTEE_GROUP_DEFS.find((g) => g.id === id) || COMMITTEE_GROUP_DEFS[0];

const EMPTY = {
  id: "",
  group_id: "coordinators",
  name: "",
  role: "",
  role_en: "",
  photo_url: "",
  photo_public_id: "",
  photo_focus: DEFAULT_FOCUS,
  sort_order: 0,
  is_visible: true,
};

const initials = (name) =>
  String(name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export default function AdminCommittee() {
  const [rows, setRows] = useState(null); // null = loading
  const [setupNeeded, setSetupNeeded] = useState(false);
  const [settings, setSettings] = useState(null);
  const [settingsDraft, setSettingsDraft] = useState({ year: "", intro: "" });
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [busyId, setBusyId] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [editing, setEditing] = useState(null); // { member, isNew }
  const [guideOpen, setGuideOpen] = useState(() => {
    try {
      return localStorage.getItem(GUIDE_KEY) !== "1";
    } catch {
      return true;
    }
  });

  const load = useCallback(() => {
    fetchCommittee()
      .then((d) => {
        setRows(d.members);
        setSettings(d.settings);
        setSettingsDraft(d.settings);
        setSetupNeeded(false);
      })
      .catch(() => {
        setRows([]);
        setSetupNeeded(true);
      });
  }, []);

  useEffect(load, [load]);

  const toggleGuide = () => {
    setGuideOpen((open) => {
      try {
        localStorage.setItem(GUIDE_KEY, open ? "1" : "0");
      } catch {
        /* ignore */
      }
      return !open;
    });
  };

  const say = (type, text) => setMsg({ type, text });
  const fail = (err) => say("err", err.message || "Something went wrong. Please try again.");

  const groups = useMemo(() => groupMembers(rows || [], { keepEmpty: true }), [rows]);
  const total = (rows || []).length;
  const shown = (rows || []).filter((r) => r.is_visible).length;

  // ---- settings ----
  const settingsDirty = !!settings && (settings.year !== settingsDraft.year.trim() || settings.intro !== settingsDraft.intro.trim());
  const saveSettings = async () => {
    if (!settingsDraft.year.trim()) {
      say("err", "Type the committee year, for example 2026/27.");
      return;
    }
    setSavingSettings(true);
    say("", "");
    try {
      const done = await saveCommitteeSettings(settingsDraft);
      setSettings(done);
      setSettingsDraft(done);
      say("ok", "Saved. The new year and intro are live on the committee page.");
    } catch (err) {
      fail(err);
    } finally {
      setSavingSettings(false);
    }
  };

  // ---- people ----
  const startAdd = (groupId) => {
    const inGroup = (rows || []).filter((r) => r.group_id === groupId);
    const nextOrder = inGroup.reduce((m, r) => Math.max(m, r.sort_order + 1), 0);
    const preset = ROLE_PRESETS.find((p) => p.group === groupId);
    setEditing({
      isNew: true,
      member: {
        ...EMPTY,
        group_id: groupId,
        sort_order: nextOrder,
        role: groupId === "coordinators" && preset ? preset.role : "",
        role_en: groupId === "coordinators" && preset ? preset.roleEn : "",
      },
    });
    say("", "");
  };

  const startEdit = (member) => {
    setEditing({ isNew: false, member: { ...member } });
    say("", "");
  };

  const onSaved = (saved, { isNew, oldPublicId }) => {
    setRows((cur) => (isNew ? [...(cur || []), saved] : (cur || []).map((r) => (r.id === saved.id ? saved : r))));
    if (oldPublicId && oldPublicId !== saved.photo_public_id) deleteImages([oldPublicId]).catch(() => {});
    setEditing(null);
    say("ok", `${saved.name} ${isNew ? "was added" : "was saved"}${saved.is_visible ? " and is live on the committee page." : ". They are hidden, so visitors don't see them yet."}`);
  };

  const toggle = async (row) => {
    setBusyId(row.id);
    say("", "");
    try {
      await setMemberVisible(row.id, !row.is_visible);
      setRows((cur) => cur.map((r) => (r.id === row.id ? { ...r, is_visible: !row.is_visible } : r)));
      say("ok", row.is_visible ? `${row.name} is now hidden from visitors. Press "Show" to bring them back.` : `${row.name} is showing on the page again.`);
    } catch (err) {
      fail(err);
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (row) => {
    const ok = window.confirm(
      `Delete ${row.name} from the committee for good?\n\nThis can't be undone. If you only want to take them off the page for now, press "Hide" instead.`
    );
    if (!ok) return;
    setBusyId(row.id);
    say("", "");
    try {
      await removeMember(row);
      setRows((cur) => cur.filter((r) => r.id !== row.id));
      say("ok", `${row.name} was deleted.`);
    } catch (err) {
      fail(err);
    } finally {
      setBusyId(null);
    }
  };

  const move = async (group, index, by) => {
    const j = index + by;
    const list = group.members;
    if (j < 0 || j >= list.length) return;
    const before = rows;
    const swapped = [...list];
    [swapped[index], swapped[j]] = [swapped[j], swapped[index]];
    const renumbered = swapped.map((r, i) => ({ ...r, sort_order: i }));
    setRows((cur) => cur.map((r) => renumbered.find((x) => x.id === r.id) || r));
    say("", "");
    try {
      await saveMemberOrder(swapped);
    } catch (err) {
      setRows(before);
      fail(err);
    }
  };

  return (
    <div className="frame-page admin-page ac-page">
      <Helmet>
        <title>Committee · Admin</title>
      </Helmet>

      <header className="frame-topbar">
        <span className="frame-brand">தமிழ் இலக்கிய மன்றம்</span>
        <LotusDivider />
        <span className="frame-subtitle">Admin · Committee</span>
      </header>

      <div className="admin-hub admin-hub-wide ac-hub">
        <div className="ac-toprow">
          <Link to="/admin" className="admin-back">
            ← Dashboard
          </Link>
          <a href="/teams/committee" target="_blank" rel="noopener noreferrer" className="ac-viewlink">
            View the committee page <FaExternalLinkAlt />
          </a>
        </div>

        <div className="ac-title">
          <h1>Committee</h1>
          <p>
            The people on the <b>செயற்குழு</b> page and in the "Meet our committee" card on the Teams page.
            {rows && !setupNeeded && (
              <span className="ac-count">
                {shown} showing{total > shown ? ` · ${total - shown} hidden` : ""}
              </span>
            )}
          </p>
        </div>

        <Guide open={guideOpen} onToggle={toggleGuide} />

        {msg.text && (
          <p className={`ac-msg ${msg.type === "ok" ? "is-ok" : "is-err"}`} role="status">
            {msg.type === "ok" ? <FaCheck /> : <FaTimes />} {msg.text}
          </p>
        )}

        {rows === null && <p className="am-hint">Loading the committee…</p>}

        {setupNeeded && <SetupNeeded onRetry={load} />}

        {rows && !setupNeeded && (
          <>
            <section className="ac-card">
              <div className="ac-card-head">
                <span className="ac-step">1</span>
                <div>
                  <h2>Committee year and intro</h2>
                  <p className="am-hint">Shown at the top of the committee page and on the Teams page card.</p>
                </div>
              </div>
              <div className="ac-settings">
                <label className="ac-field">
                  <span className="ac-label">Committee year</span>
                  <input
                    className="ac-input"
                    value={settingsDraft.year}
                    maxLength={20}
                    placeholder="2026/27"
                    onChange={(e) => setSettingsDraft((d) => ({ ...d, year: e.target.value }))}
                  />
                  <small className="am-hint">Write it like 2026/27. Appears as "Committee 2026 / 27".</small>
                </label>
                <label className="ac-field ac-field-wide">
                  <span className="ac-label">
                    Intro sentence <em>(optional)</em>
                  </span>
                  <textarea
                    className="ac-input ac-textarea"
                    rows={2}
                    maxLength={400}
                    value={settingsDraft.intro}
                    placeholder={`Leave empty to show: மன்றத்தின் ஒவ்வொரு நிகழ்வையும் முன்னின்று நடத்தும் எமது ${shown} பேர் கொண்ட செயற்குழு.`}
                    onChange={(e) => setSettingsDraft((d) => ({ ...d, intro: e.target.value }))}
                  />
                  <small className="am-hint">The line under the big title. Leave it empty and the site writes one for you with the right number of people.</small>
                </label>
              </div>
              <div className="ac-actions">
                <button type="button" className="frame-btn frame-btn-primary" onClick={saveSettings} disabled={savingSettings || !settingsDirty}>
                  {savingSettings ? "Saving…" : settingsDirty ? "Save year and intro" : "Saved"}
                </button>
                {settingsDirty && (
                  <button type="button" className="am-chip" onClick={() => setSettingsDraft(settings)}>
                    Undo changes
                  </button>
                )}
              </div>
            </section>

            <div className="ac-card-head ac-people-head">
              <span className="ac-step">2</span>
              <div>
                <h2>People, section by section</h2>
                <p className="am-hint">
                  The page shows these four sections from top to bottom. Use <b>↑ ↓</b> to change the order inside a section.
                  Every change is live straight away; there is no separate "publish" button.
                </p>
              </div>
            </div>

            {groups.map((g, gi) => (
              <GroupPanel
                key={g.id}
                group={g}
                number={gi + 1}
                busyId={busyId}
                onAdd={() => startAdd(g.id)}
                onEdit={startEdit}
                onToggle={toggle}
                onRemove={remove}
                onMove={(i, by) => move(g, i, by)}
              />
            ))}
          </>
        )}
      </div>

      {editing && (
        <Editor
          key={editing.member.id || "new"}
          initial={editing.member}
          isNew={editing.isNew}
          rows={rows || []}
          onCancel={() => setEditing(null)}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}

// ---- Guide --------------------------------------------------------------------------------

function Guide({ open, onToggle }) {
  return (
    <section className={`ac-guide${open ? " is-open" : ""}`}>
      <button type="button" className="ac-guide-toggle" onClick={onToggle} aria-expanded={open}>
        <span className="ac-guide-badge">?</span>
        <span>
          <b>New here? How this page works</b>
          <small>{open ? "Hide the guide" : "Show the 5-step guide"}</small>
        </span>
        <FaChevronDown className="ac-guide-chev" />
      </button>
      {open && (
        <ol className="ac-guide-steps">
          <li>
            <b>The page has four sections.</b> Office bearers (big cards, the first person in the middle), Team coordinators
            and Editors (portrait cards), and Coordinators (small round photos). Each person belongs to one section.
          </li>
          <li>
            <b>To add someone,</b> press <span className="ac-kbd"><FaPlus /> Add person</span> in their section. Type the name,
            pick the role, and add a photo. The preview shows exactly how they will look on the website.
          </li>
          <li>
            <b>Photos:</b> either upload one from your computer, or paste a Google Drive link. For Drive, the photo must be shared
            as <i>"Anyone with the link"</i>, otherwise visitors see initials instead of the face.
          </li>
          <li>
            <b>Order:</b> use <span className="ac-kbd">↑</span> <span className="ac-kbd">↓</span> to move people. In Office
            bearers, whoever is <b>first</b> is shown in the middle, larger, with a gold frame, so keep the President first.
          </li>
          <li>
            <b>Hide or Delete?</b> <i>Hide</i> takes someone off the page but keeps them here, so you can bring them back.
            <i> Delete</i> removes them for good. Everything you change is live on the website immediately.
          </li>
        </ol>
      )}
      {open && (
        <p className="ac-guide-tip">
          <FaStar /> <b>New committee next year?</b> Change the year in step 1, then edit each card with the new person's name,
          role and photo, delete the ones you don't need, and add the rest.
        </p>
      )}
    </section>
  );
}

function SetupNeeded({ onRetry }) {
  return (
    <section className="ac-card ac-setup">
      <h2>One-time setup needed</h2>
      <p>
        The committee can't be edited yet because its database tables don't exist. Until then the website keeps showing the
        built-in 2026/27 committee, so nothing is broken.
      </p>
      <ol>
        <li>
          Open your project in <b>Supabase</b> and go to <b>SQL Editor</b>.
        </li>
        <li>
          Paste everything from <code>supabase/migrations/committee.sql</code> and press <b>Run</b>. It copies today's committee in, so
          nobody has to be typed again.
        </li>
        <li>Come back here and press the button below.</li>
      </ol>
      <button type="button" className="frame-btn frame-btn-primary" onClick={onRetry}>
        I've run it, check again
      </button>
    </section>
  );
}

// ---- One section -------------------------------------------------------------------------

function GroupPanel({ group, number, busyId, onAdd, onEdit, onToggle, onRemove, onMove }) {
  const list = group.members;
  return (
    <section className="ac-group">
      <header className="ac-group-head">
        <span className="ac-group-num">{String(number).padStart(2, "0")}</span>
        <div className="ac-group-titles">
          <h3>
            {group.title} <span>{group.subtitle}</span>
          </h3>
          <p className="am-hint">{group.help}</p>
        </div>
        <button type="button" className="frame-btn frame-btn-primary ac-add" onClick={onAdd}>
          <FaPlus /> Add person
        </button>
      </header>

      {list.length === 0 ? (
        <p className="ac-empty">Nobody in this section yet. This section is left off the page until you add someone.</p>
      ) : (
        <ul className="ac-list">
          {list.map((m, i) => (
            <li key={m.id} className={`ac-row${m.is_visible ? "" : " is-hidden"}`}>
              <span className="ac-pos">{i + 1}</span>
              <span className={`ac-thumb${group.layout === "circles" ? " is-round" : ""}`}>
                <SmartImage
                  src={m.photo_url}
                  width={160}
                  alt=""
                  style={{ objectPosition: `center ${m.photo_focus}%` }}
                  fallback={<b>{initials(m.name)}</b>}
                />
              </span>
              <span className="ac-who">
                <b>{m.name}</b>
                <small>
                  {m.role || <i>No Tamil role</i>}
                  {m.role_en ? ` · ${m.role_en}` : ""}
                </small>
                <span className="ac-tags">
                  {group.layout === "podium" && i === 0 && (
                    <span className="ac-tag is-gold">
                      <FaStar /> Shown biggest, in the middle
                    </span>
                  )}
                  {!m.is_visible && <span className="ac-tag is-off">Hidden from visitors</span>}
                  {!m.photo_url && <span className="ac-tag is-warn">No photo yet</span>}
                </span>
              </span>
              <span className="ac-btns">
                <button type="button" className="am-chip" onClick={() => onMove(i, -1)} disabled={i === 0 || busyId === m.id} aria-label={`Move ${m.name} up`} title="Move up">
                  <FaArrowUp />
                </button>
                <button
                  type="button"
                  className="am-chip"
                  onClick={() => onMove(i, 1)}
                  disabled={i === list.length - 1 || busyId === m.id}
                  aria-label={`Move ${m.name} down`}
                  title="Move down"
                >
                  <FaArrowDown />
                </button>
                <button type="button" className="am-chip ac-chip-strong" onClick={() => onEdit(m)} disabled={busyId === m.id}>
                  <FaPen /> Edit
                </button>
                <button type="button" className="am-chip" onClick={() => onToggle(m)} disabled={busyId === m.id}>
                  {m.is_visible ? (
                    <>
                      <FaEyeSlash /> Hide
                    </>
                  ) : (
                    <>
                      <FaEye /> Show
                    </>
                  )}
                </button>
                <button type="button" className="am-chip ac-danger" onClick={() => onRemove(m)} disabled={busyId === m.id}>
                  <FaTrash /> Delete
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ---- Add / edit a person -------------------------------------------------------------------

const OTHER = "__other";

function Editor({ initial, isNew, rows, onCancel, onSaved }) {
  const [draft, setDraft] = useState(initial);
  const [photoTab, setPhotoTab] = useState(() => (initial.photo_public_id || !initial.photo_url ? "upload" : "drive"));
  const [driveText, setDriveText] = useState(initial.photo_public_id ? "" : initial.photo_url);
  const [uploading, setUploading] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);
  const uploadedHere = useRef([]); // uploads made in this editor, deleted again if not saved
  const panelRef = useRef(null);

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);
  const def = groupDef(draft.group_id);

  // The role picker shows the role that matches the typed text, else "Other".
  const presetValue = useMemo(() => {
    const i = ROLE_PRESETS.findIndex((p) => p.role === draft.role && p.roleEn === draft.role_en);
    if (i >= 0) return String(i);
    return draft.role || draft.role_en ? OTHER : "";
  }, [draft.role, draft.role_en]);
  const [showRoleFields, setShowRoleFields] = useState(() => presetValue === OTHER);

  // Where this person would sit in their section, for the preview.
  const position = useMemo(() => {
    if (!isNew && initial.group_id === draft.group_id) return rows.filter((r) => r.group_id === draft.group_id && r.sort_order < draft.sort_order).length;
    return rows.filter((r) => r.group_id === draft.group_id && r.id !== draft.id).length;
  }, [rows, draft.group_id, draft.sort_order, draft.id, initial.group_id, isNew]);
  const previewSize = def.layout === "podium" ? (position === 0 ? "xl" : "lg") : "md";

  const close = useCallback(() => {
    if (dirty && !window.confirm("Close without saving? Your changes to this person will be lost.")) return;
    const orphans = uploadedHere.current;
    if (orphans.length) deleteImages(orphans).catch(() => {});
    onCancel();
  }, [dirty, onCancel]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [close]);

  useEffect(() => {
    const first = panelRef.current && panelRef.current.querySelector("input");
    if (first) first.focus();
  }, []);

  const pickPreset = (value) => {
    if (value === OTHER) {
      setShowRoleFields(true);
      return;
    }
    if (value === "") {
      set({ role: "", role_en: "" });
      setShowRoleFields(false);
      return;
    }
    const p = ROLE_PRESETS[Number(value)];
    set({ role: p.role, role_en: p.roleEn });
    setShowRoleFields(false);
  };

  const onFile = async (file) => {
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;
    if (!isImageFile(file)) {
      setError("That file isn't a picture. Choose a JPG, PNG or WebP photo.");
      return;
    }
    setError("");
    setUploading("Preparing the photo…");
    try {
      const prepared = await prepareImage(file);
      setUploading("Uploading…");
      const [signed] = await signUploads(COMMITTEE_SCOPE, 1);
      const up = await uploadSigned(prepared.blob, signed, {
        filename: file.name,
        onProgress: (p) => setUploading(`Uploading… ${Math.round(p * 100)}%`),
      });
      uploadedHere.current.push(up.publicId);
      set({ photo_url: up.url, photo_public_id: up.publicId });
      setDriveText("");
    } catch (err) {
      const m = err.message || "";
      setError(
        /invalid team|own team/i.test(m)
          ? "Photo upload isn't switched on for the committee yet (the web team needs to redeploy the cloudinary-sign function). For now, use \"Paste a Google Drive link\" instead."
          : `The photo couldn't be uploaded: ${m || "unknown error"}. Check your connection and try again, or use a Google Drive link.`
      );
    } finally {
      setUploading("");
    }
  };

  const onDrive = (text) => {
    setDriveText(text);
    const url = safeUrl(text);
    set({ photo_url: url, photo_public_id: "" });
  };

  const driveProblem = photoTab === "drive" && driveText.trim() && (!safeUrl(driveText) ? "That doesn't look like a link. It should start with https://" : !driveFileId(driveText) ? "This isn't a Google Drive file link. In Drive, right-click the photo → Share → Copy link." : "");

  const submit = async (e) => {
    e.preventDefault();
    if (!draft.name.trim()) {
      setError("Type the person's name. It's the only thing you must fill in.");
      return;
    }
    if (driveProblem) {
      setError(driveProblem);
      return;
    }
    if (!draft.photo_url && !window.confirm("Save without a photo? The page will show their initials until you add one.")) return;
    setSaving(true);
    setError("");
    try {
      // Moving to another section puts them at the end of it.
      let sort_order = draft.sort_order;
      if (isNew || draft.group_id !== initial.group_id) {
        sort_order = rows.filter((r) => r.group_id === draft.group_id && r.id !== draft.id).reduce((m, r) => Math.max(m, r.sort_order + 1), 0);
      }
      const saved = await saveMember({ ...draft, sort_order }, { isNew });
      uploadedHere.current = uploadedHere.current.filter((id) => id !== saved.photo_public_id);
      if (uploadedHere.current.length) deleteImages(uploadedHere.current).catch(() => {});
      onSaved(saved, { isNew, oldPublicId: isNew ? "" : initial.photo_public_id });
    } catch (err) {
      setError(err.message || "Could not save. Please try again.");
      setSaving(false);
    }
  };

  const previewMember = { ...draft, name: draft.name.trim() || "Name", id: "preview" };

  return (
    <div className="ac-overlay" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <form className="ac-editor" ref={panelRef} onSubmit={submit} aria-label={isNew ? "Add a person" : `Edit ${initial.name}`}>
        <header className="ac-editor-head">
          <div>
            <h2>{isNew ? "Add a person" : `Edit ${initial.name}`}</h2>
            <p className="am-hint">Fill in the steps below. Only the name is required.</p>
          </div>
          <button type="button" className="ac-x" onClick={close} aria-label="Close">
            <FaTimes />
          </button>
        </header>

        <div className="ac-editor-body">
          <div className="ac-form">
            {/* 1. Name */}
            <div className="ac-q">
              <span className="ac-qnum">1</span>
              <label className="ac-field">
                <span className="ac-label">Name *</span>
                <input className="ac-input" value={draft.name} maxLength={60} placeholder="e.g. Yathursanan" onChange={(e) => set({ name: e.target.value })} />
                <small className="am-hint">Write it the way it should appear on the website, in English letters.</small>
              </label>
            </div>

            {/* 2. Section */}
            <div className="ac-q">
              <span className="ac-qnum">2</span>
              <label className="ac-field">
                <span className="ac-label">Section of the page</span>
                <select className="ac-input" value={draft.group_id} onChange={(e) => set({ group_id: e.target.value })}>
                  {COMMITTEE_GROUP_DEFS.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.subtitle} · {g.title}
                    </option>
                  ))}
                </select>
                <small className="am-hint">{def.help}</small>
              </label>
            </div>

            {/* 3. Role */}
            <div className="ac-q">
              <span className="ac-qnum">3</span>
              <div className="ac-field">
                <span className="ac-label">Role</span>
                <select className="ac-input" value={showRoleFields && presetValue !== OTHER ? OTHER : presetValue} onChange={(e) => pickPreset(e.target.value)}>
                  <option value="">Choose a role…</option>
                  <optgroup label={`Usual for ${def.subtitle}`}>
                    {ROLE_PRESETS.map((p, i) =>
                      p.group === draft.group_id ? (
                        <option key={i} value={i}>
                          {p.roleEn} · {p.role}
                        </option>
                      ) : null
                    )}
                  </optgroup>
                  <optgroup label="Other roles">
                    {ROLE_PRESETS.map((p, i) =>
                      p.group !== draft.group_id ? (
                        <option key={i} value={i}>
                          {p.roleEn} · {p.role}
                        </option>
                      ) : null
                    )}
                  </optgroup>
                  <option value={OTHER}>Something else, I'll type it…</option>
                </select>
                {(showRoleFields || presetValue === OTHER) && (
                  <div className="ac-two">
                    <label className="ac-field">
                      <span className="ac-sublabel">In Tamil</span>
                      <input className="ac-input ac-tamil" value={draft.role} maxLength={80} placeholder="e.g. ஊடக அணி ஒருங்கிணைப்பாளர்" onChange={(e) => set({ role: e.target.value })} />
                    </label>
                    <label className="ac-field">
                      <span className="ac-sublabel">In English</span>
                      <input className="ac-input" value={draft.role_en} maxLength={80} placeholder="e.g. Media Team Coordinator" onChange={(e) => set({ role_en: e.target.value })} />
                    </label>
                  </div>
                )}
                <small className="am-hint">
                  Pick from the list. If the role isn't there, choose "Something else" and type it in Tamil and English.
                  {draft.role && !showRoleFields && presetValue !== OTHER && (
                    <>
                      {" "}
                      <button type="button" className="ac-linkbtn" onClick={() => setShowRoleFields(true)}>
                        Change the wording
                      </button>
                    </>
                  )}
                </small>
              </div>
            </div>

            {/* 4. Photo */}
            <div className="ac-q">
              <span className="ac-qnum">4</span>
              <div className="ac-field">
                <span className="ac-label">Photo</span>
                <div className="ac-tabs" role="tablist">
                  <button type="button" role="tab" aria-selected={photoTab === "upload"} className={photoTab === "upload" ? "is-on" : ""} onClick={() => setPhotoTab("upload")}>
                    <FaUpload /> Upload from this device
                  </button>
                  <button type="button" role="tab" aria-selected={photoTab === "drive"} className={photoTab === "drive" ? "is-on" : ""} onClick={() => setPhotoTab("drive")}>
                    <FaGoogleDrive /> Paste a Google Drive link
                  </button>
                </div>

                {photoTab === "upload" ? (
                  <div className="ac-drop" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files[0]); }}>
                    <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files[0])} />
                    <button type="button" className="frame-btn frame-btn-primary" onClick={() => fileRef.current && fileRef.current.click()} disabled={!!uploading}>
                      <FaUpload /> {uploading || (draft.photo_url ? "Choose a different photo" : "Choose a photo")}
                    </button>
                    <small className="am-hint">Or drag a photo onto this box. A portrait (taller than wide) photo looks best. Big photos are made smaller automatically.</small>
                  </div>
                ) : (
                  <div className="ac-drive">
                    <input
                      className="ac-input"
                      value={driveText}
                      placeholder="https://drive.google.com/file/d/…/view"
                      onChange={(e) => onDrive(e.target.value)}
                    />
                    {driveProblem ? <small className="ac-inline-err">{driveProblem}</small> : null}
                    <small className="am-hint">
                      In Google Drive: right-click the photo → <b>Share</b> → under "General access" choose <b>Anyone with the link</b> →{" "}
                      <b>Copy link</b>, then paste it here.
                    </small>
                  </div>
                )}

                {draft.photo_url && (
                  <button type="button" className="ac-linkbtn" onClick={() => { set({ photo_url: "", photo_public_id: "" }); setDriveText(""); }}>
                    Remove the photo
                  </button>
                )}
              </div>
            </div>

            {/* 5. Framing */}
            {draft.photo_url && (
              <div className="ac-q">
                <span className="ac-qnum">5</span>
                <label className="ac-field">
                  <span className="ac-label">Keep the face in view</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={draft.photo_focus}
                    onChange={(e) => set({ photo_focus: Number(e.target.value) })}
                    className="ac-range"
                  />
                  <span className="ac-range-labels">
                    <span>Show the top of the photo</span>
                    <button type="button" className="ac-linkbtn" onClick={() => set({ photo_focus: DEFAULT_FOCUS })} disabled={draft.photo_focus === DEFAULT_FOCUS}>
                      Reset
                    </button>
                    <span>Show the bottom</span>
                  </span>
                  <small className="am-hint">Cards cut the photo to fit. If a head is cut off, drag the slider left; watch the preview.</small>
                </label>
              </div>
            )}

            {/* 6. Visible */}
            <div className="ac-q">
              <span className="ac-qnum">{draft.photo_url ? 6 : 5}</span>
              <label className="ac-check">
                <input type="checkbox" checked={draft.is_visible} onChange={(e) => set({ is_visible: e.target.checked })} />
                <span>
                  <b>Show on the website</b>
                  <small className="am-hint">Untick to save them without visitors seeing them yet.</small>
                </span>
              </label>
            </div>
          </div>

          <aside className="ac-preview">
            <span className="ac-label">Preview: how visitors will see this</span>
            <div className="cm ac-preview-stage">
              {def.layout === "circles" ? (
                <div className="ac-preview-circle">
                  <CircleCard member={previewMember} />
                </div>
              ) : (
                <PortraitCard member={previewMember} size={previewSize} />
              )}
            </div>
            <small className="am-hint">
              {def.layout === "podium" && position === 0
                ? "First in Office bearers: shown in the middle, larger, with a gold frame."
                : def.layout === "circles"
                ? "Coordinators are shown as round photos with just the name."
                : `Shown as a portrait card in ${def.subtitle}.`}
            </small>
            {!draft.photo_url && (
              <p className="ac-nophoto">
                <FaUserCircle /> No photo yet: their initials are shown instead.
              </p>
            )}
          </aside>
        </div>

        {error && (
          <p className="ac-msg is-err ac-editor-err" role="alert">
            <FaTimes /> {error}
          </p>
        )}

        <footer className="ac-editor-foot">
          <button type="button" className="am-chip" onClick={close}>
            Cancel
          </button>
          <button type="submit" className="frame-btn frame-btn-primary" disabled={saving || !!uploading}>
            {saving ? "Saving…" : isNew ? "Add to the committee" : "Save changes"}
          </button>
        </footer>
      </form>
    </div>
  );
}
