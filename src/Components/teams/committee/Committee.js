import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowLeft, FaArrowRight, FaChevronLeft, FaChevronRight, FaTimes, FaExpand } from "react-icons/fa";
import { SmartImage } from "../team-detail/media";
import { useCommittee } from "../../../shared/committee";
import { DEFAULT_FOCUS } from "./committeeData";
import Crest from "../../../images/Logo-Nav/logo.png";
import "./committee.css";

const initials = (name) =>
  String(name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const pad2 = (n) => String(n).padStart(2, "0");

// Photo widths asked from Drive/Cloudinary. The viewer first shows the size
// the card already loaded (so it appears at once), then fades in the sharper one.
const W_XL = 820;
const W_CARD = 600;
const W_CIRCLE = 320;
const W_VIEWER = 1000;

const cardWidth = (group, i) => (group.layout === "circles" ? W_CIRCLE : group.layout === "podium" && i === 0 ? W_XL : W_CARD);

// Keeps the chosen part of the photo in view (0 = top … 100 = bottom).
const focusStyle = (m) => ({ objectPosition: `center ${m.photo_focus ?? DEFAULT_FOCUS}%` });

const Blank = ({ name, className = "" }) => <span className={`cm-initials ${className}`}>{initials(name)}</span>;

// Fades a block in once it scrolls into view. Without IntersectionObserver
// (or with reduced motion) it is simply shown.
function useInView() {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, seen];
}

// Also used by the admin's live preview (src/Pages/AdminCommittee.js).
export function PortraitCard({ member, onOpen, size = "md", style }) {
  return (
    <button type="button" className={`cm-portrait cm-portrait--${size}`} onClick={() => onOpen && onOpen(member)} style={style}>
      <span className="cm-portrait-photo">
        <SmartImage
          src={member.photo_url}
          width={size === "xl" ? W_XL : W_CARD}
          alt=""
          style={focusStyle(member)}
          fallback={<Blank name={member.name} />}
        />
      </span>
      <span className="cm-portrait-shade" aria-hidden="true" />
      {size === "xl" && member.role_en && <span className="cm-portrait-badge">{member.role_en}</span>}
      <span className="cm-portrait-text">
        <span className="cm-portrait-name">{member.name}</span>
        {member.role && <span className="cm-portrait-role">{member.role}</span>}
        {size !== "xl" && member.role_en && <span className="cm-portrait-role-en">{member.role_en}</span>}
      </span>
      <span className="cm-portrait-zoom" aria-hidden="true">
        <FaExpand />
      </span>
      <span className="cm-sr">
        {member.name}
        {member.role_en ? `, ${member.role_en}` : ""}. View photo
      </span>
    </button>
  );
}

export function CircleCard({ member, onOpen, style }) {
  return (
    <button type="button" className="cm-circle" onClick={() => onOpen && onOpen(member)} style={style}>
      <span className="cm-circle-ring">
        <span className="cm-circle-photo">
          <SmartImage src={member.photo_url} width={W_CIRCLE} alt="" style={focusStyle(member)} fallback={<Blank name={member.name} />} />
        </span>
      </span>
      <span className="cm-circle-name">{member.name}</span>
      <span className="cm-sr">
        {member.role_en ? `, ${member.role_en}` : ""}. View photo
      </span>
    </button>
  );
}

function GroupHead({ group, number }) {
  return (
    <div className="cm-head">
      <span className="cm-head-num">{pad2(number)}</span>
      <div className="cm-head-text">
        <h2 id={`cm-${group.id}`} className="cm-head-title">
          {group.title}
        </h2>
        <span className="cm-head-sub">
          {group.subtitle} · {group.members.length}
        </span>
      </div>
      <span className="cm-head-line" aria-hidden="true" />
    </div>
  );
}

function Group({ group, number, onOpen }) {
  const [ref, seen] = useInView();
  const stagger = (i) => ({ "--d": `${Math.min(i, 12) * 60}ms` });

  let body;
  if (group.layout === "podium") {
    const [lead, left, right, ...rest] = group.members;
    body = (
      <>
        <div className="cm-podium">
          {left && <PortraitCard member={left} onOpen={onOpen} size="lg" style={stagger(1)} />}
          <PortraitCard member={lead} onOpen={onOpen} size="xl" style={stagger(0)} />
          {right && <PortraitCard member={right} onOpen={onOpen} size="lg" style={stagger(2)} />}
        </div>
        {rest.length > 0 && (
          <div className="cm-row cm-row--lg">
            {rest.map((m, i) => (
              <PortraitCard key={m.id} member={m} onOpen={onOpen} size="lg" style={stagger(i + 3)} />
            ))}
          </div>
        )}
      </>
    );
  } else if (group.layout === "circles") {
    body = (
      <div className="cm-circles">
        {group.members.map((m, i) => (
          <CircleCard key={m.id} member={m} onOpen={onOpen} style={stagger(i)} />
        ))}
      </div>
    );
  } else {
    body = (
      <div className="cm-row">
        {group.members.map((m, i) => (
          <PortraitCard key={m.id} member={m} onOpen={onOpen} style={stagger(i)} />
        ))}
      </div>
    );
  }

  return (
    <section
      ref={ref}
      id={group.id}
      className={`cm-group cm-group--${group.layout}${seen ? " is-in" : ""}`}
      aria-labelledby={`cm-${group.id}`}
    >
      <GroupHead group={group} number={number} />
      {body}
    </section>
  );
}

function Viewer({ people, index, onClose, onStep }) {
  const member = people[index];
  const closeRef = useRef(null);
  const [sharp, setSharp] = useState("");
  useEffect(() => setSharp(""), [member.id]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") onStep(1);
      else if (e.key === "ArrowLeft") onStep(-1);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current && closeRef.current.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, onStep]);

  // Swipe left/right on phones.
  const touch = useRef(null);
  const onTouchStart = (e) => {
    touch.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e) => {
    if (touch.current == null) return;
    const dx = e.changedTouches[0].clientX - touch.current;
    if (Math.abs(dx) > 50) onStep(dx < 0 ? 1 : -1);
    touch.current = null;
  };

  return (
    <div className="cm-viewer" role="dialog" aria-modal="true" aria-label={member.name} onClick={onClose}>
      <div className="cm-viewer-panel" onClick={(e) => e.stopPropagation()} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="cm-viewer-photo">
          <SmartImage
            key={`${member.id}-quick`}
            src={member.photo_url}
            width={member.cardWidth}
            alt=""
            loading="eager"
            style={focusStyle(member)}
            fallback={<Blank name={member.name} className="cm-initials--big" />}
          />
          <SmartImage
            key={`${member.id}-sharp`}
            src={member.photo_url}
            width={W_VIEWER}
            alt={member.name}
            loading="eager"
            style={focusStyle(member)}
            className={`cm-viewer-sharp${sharp === member.id ? " is-loaded" : ""}`}
            onLoad={() => setSharp(member.id)}
          />
        </div>
        <div className="cm-viewer-info">
          <span className="cm-viewer-group">{member.group}</span>
          <span className="cm-viewer-name">{member.name}</span>
          {member.role && <span className="cm-viewer-role">{member.role}</span>}
          {member.role_en && <span className="cm-viewer-role-en">{member.role_en}</span>}
          <span className="cm-viewer-count">
            {index + 1} / {people.length}
          </span>
        </div>
        <button type="button" ref={closeRef} className="cm-viewer-close" onClick={onClose} aria-label="Close">
          <FaTimes />
        </button>
        <button type="button" className="cm-viewer-nav cm-viewer-nav--prev" onClick={() => onStep(-1)} aria-label="Previous">
          <FaChevronLeft />
        </button>
        <button type="button" className="cm-viewer-nav cm-viewer-nav--next" onClick={() => onStep(1)} aria-label="Next">
          <FaChevronRight />
        </button>
      </div>
    </div>
  );
}

export default function Committee() {
  const { year, intro, groups, count } = useCommittee();

  // Everyone in page order, so the photo viewer can step through the whole committee.
  const people = useMemo(
    () => groups.flatMap((g) => g.members.map((m, i) => ({ ...m, group: g.title, cardWidth: cardWidth(g, i) }))),
    [groups]
  );

  const [openId, setOpenId] = useState(null);
  const index = openId ? people.findIndex((m) => m.id === openId) : -1;
  const onOpen = useCallback((member) => setOpenId(member.id), []);
  const onClose = useCallback(() => setOpenId(null), []);
  const onStep = useCallback(
    (d) =>
      setOpenId((id) => {
        const i = people.findIndex((m) => m.id === id);
        return people[(i + d + people.length) % people.length].id;
      }),
    [people]
  );

  return (
    <div className="cm">
      <header className="cm-hero">
        <svg className="cm-hero-rosette" viewBox="-260 -260 520 520" aria-hidden="true">
          <g fill="none" stroke="currentColor" strokeLinecap="round">
            <circle r="250" strokeWidth="1" opacity=".5" />
            <circle r="236" strokeWidth="2.5" strokeDasharray="1 13" />
            <circle r="205" strokeWidth="1.2" opacity=".6" />
            {Array.from({ length: 12 }, (_, i) => (
              <g key={i} transform={`rotate(${i * 30})`} strokeWidth="1.6">
                <path d="M0 -200 C34 -160 34 -120 0 -92 C-34 -120 -34 -160 0 -200 Z" />
                <path d="M0 -182 C18 -156 18 -130 0 -110 C-18 -130 -18 -156 0 -182 Z" opacity=".6" />
              </g>
            ))}
            {Array.from({ length: 8 }, (_, i) => (
              <path key={i} transform={`rotate(${i * 45})`} strokeWidth="1.8" d="M0 -92 C40 -70 40 -30 0 -10 C-40 -30 -40 -70 0 -92 Z" />
            ))}
            <circle r="92" strokeWidth="1.2" opacity=".7" />
          </g>
        </svg>

        <div className="cm-hero-inner">
          <Link to="/teams" className="cm-back">
            <FaArrowLeft /> அணிகள்
          </Link>

          <img src={Crest} alt="" className="cm-crest" width="88" height="88" />
          <span className="cm-eyebrow">தமிழ் இலக்கிய மன்றம் · மொறட்டுவைப் பல்கலைக்கழகம்</span>
          <h1 className="cm-title">செயற்குழு</h1>
          {year && (
            <span className="cm-year">
              <i aria-hidden="true" />
              Committee {year.replace("/", " / ")}
              <i aria-hidden="true" />
            </span>
          )}
          <span className="cm-lede">
            {intro || `மன்றத்தின் ஒவ்வொரு நிகழ்வையும் முன்னின்று நடத்தும் எமது ${count} பேர் கொண்ட செயற்குழு.`}
          </span>
        </div>
        <svg className="cm-hero-edge" viewBox="0 0 1440 48" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 48 L0 22 Q 60 0 120 22 T 240 22 T 360 22 T 480 22 T 600 22 T 720 22 T 840 22 T 960 22 T 1080 22 T 1200 22 T 1320 22 T 1440 22 L1440 48 Z" />
        </svg>
      </header>

      <div className="cm-body">
        {groups.map((g, i) => (
          <Group key={g.id} group={g} number={i + 1} onOpen={onOpen} />
        ))}

        <aside className="cm-outro">
          <span className="cm-outro-title">எம்முடன் இணைந்து பயணிக்க</span>
          <span className="cm-outro-text">எமது அணிகளைப் பற்றி அறிந்து கொள்ளுங்கள், அல்லது எம்மைத் தொடர்பு கொள்ளுங்கள்.</span>
          <span className="cm-outro-actions">
            <Link to="/teams" className="cm-btn cm-btn--gold">
              அணிகள் <FaArrowRight />
            </Link>
            <Link to="/contact" className="cm-btn">
              தொடர்புகள்
            </Link>
          </span>
        </aside>
      </div>

      {index >= 0 && <Viewer people={people} index={index} onClose={onClose} onStep={onStep} />}
    </div>
  );
}
