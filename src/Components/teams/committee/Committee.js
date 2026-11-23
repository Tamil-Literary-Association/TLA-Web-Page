import React from "react";
import { Link } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { SmartImage } from "../team-detail/media";
import { COMMITTEE_GROUPS, COMMITTEE_YEAR, COMMITTEE_COUNT } from "./committeeData";
import "./committee.css";

const initials = (name) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

function MemberCard({ member, featured = false }) {
  return (
    <figure className={`cm-card${featured ? " cm-card--featured" : ""}`}>
      <div className="cm-photo">
        <SmartImage
          src={member.photo}
          width={featured ? 720 : 520}
          alt={`${member.name}, ${member.roleEn}`}
          fallback={<span className="cm-initials">{initials(member.name)}</span>}
        />
      </div>
      <figcaption>
        <span className="cm-name">{member.name}</span>
        <span className="cm-role">{member.role}</span>
        <span className="cm-role-en">{member.roleEn}</span>
      </figcaption>
    </figure>
  );
}

function Group({ group }) {
  const [first, ...rest] = group.members;
  return (
    <section className={`cm-group${group.lead ? " cm-group--lead" : ""}`} aria-labelledby={`cm-${group.id}`}>
      <div className="cm-group-head">
        <h2 id={`cm-${group.id}`} className="cm-group-title">
          {group.title}
        </h2>
        <span className="cm-group-sub">{group.subtitle}</span>
        <span className="cm-rule" aria-hidden="true">
          <i />
        </span>
      </div>

      {group.lead ? (
        <>
          <div className="cm-featured-row">
            <MemberCard member={first} featured />
          </div>
          <div className="cm-grid cm-grid--lead">
            {rest.map((m) => (
              <MemberCard key={m.name} member={m} />
            ))}
          </div>
        </>
      ) : (
        <div className="cm-grid">
          {group.members.map((m) => (
            <MemberCard key={m.name} member={m} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function Committee() {
  return (
    <div className="cm">
      <header className="cm-hero">
        <div className="cm-hero-inner">
          <Link to="/teams" className="cm-back">
            <FaArrowLeft /> அணிகள்
          </Link>
          <span className="cm-year">{COMMITTEE_YEAR}</span>
          <h1 className="cm-title">செயற்குழு</h1>
          <span className="cm-title-en">Committee {COMMITTEE_YEAR}</span>
          <span className="cm-lede">
            மன்றத்தின் ஒவ்வொரு நிகழ்வையும் முன்னின்று நடத்தும் {COMMITTEE_COUNT} பேர் கொண்ட எமது செயற்குழு.
          </span>
        </div>
      </header>

      <div className="cm-body">
        {COMMITTEE_GROUPS.map((g) => (
          <Group key={g.id} group={g} />
        ))}
      </div>
    </div>
  );
}
