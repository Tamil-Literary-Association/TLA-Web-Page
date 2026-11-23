import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowRight, FaTrophy, FaCalendarAlt } from "react-icons/fa";
import "./teams.css";
import { useTeamPages, upcomingCompetitions, daysUntil } from "../../shared/teamPages";
import { SmartImage } from "./team-detail/media";
import {
    fetchTeamJoinConfig,
    getCachedTeamJoinConfig,
} from "../../shared/teamJoinConfig";
import {
    COMMITTEE_YEAR,
    COMMITTEE_COUNT,
    COMMITTEE_PREVIEW,
} from "./committee/committeeData";
import "./committee/committeeCard.css";

const Teams = () => {
    const [joinCfg, setJoinCfg] = useState(getCachedTeamJoinConfig);
    const pages = useTeamPages().filter((t) => !t.hidden);
    const upcoming = upcomingCompetitions(pages);

    useEffect(() => {
        let alive = true;
        fetchTeamJoinConfig()
            .then((c) => {
                if (alive) setJoinCfg(c);
            })
            .catch(() => {});
        return () => {
            alive = false;
        };
    }, []);

    return (
        <div className="teams">
            <h1>அணிகள்</h1>
            <p className="intro">
            தமிழ் இலக்கிய மன்றத்தினால் வருடந்தோறும் தமக்கேயான தனியான பாணியில் தமிழருவி, சொற்கணை, பொங்கல் விழா, வாணி விழா, ஜீவநதி, துடுப்பாட்ட சுற்றுப்போட்டிகள் என எமது பல்கலைக்கழக மாணவர்கள் மட்டுமன்றி ஏனைய பல்கலைக்கழக மாணவர்கள், பாடசாலை மாணவர்கள் மட்டுமன்றி உலகெங்கும் பரந்து வாழும் தமிழ் மக்களின் திறன் விருத்திக்கும் ஆளுமை வளர்ச்சிக்கும் ஏற்பாடு செய்யப்பட்டு வருகின்றது. இந்த அனைத்து நிகழ்வுகளிற்கான ஏற்பாடுகள் ஆரம்பம் முதல் இறுதி வரை செவ்வனே புதிய படைப்புகளாகவும் தொழில்நுட்ப வளர்ச்சியின் அத்தியாயமாகவும் அமைய வடிவமைக்க வழிகோலும் வகையில் முதுகென்பாக இருக்கின்றார்கள் நம் வலையமைப்பு அணி, ஊடக அணி, வடிவமைப்பு அணி, தொழில்நுட்ப அணி.
            </p>

            <Link to="/teams/committee" className="teams-committee">
                <div className="teams-committee-text">
                    <span className="teams-committee-eyebrow">
                        செயற்குழு · {COMMITTEE_YEAR}
                    </span>
                    <span className="teams-committee-title">
                        எமது செயற்குழுவைச் சந்தியுங்கள்
                    </span>
                    <span className="teams-committee-desc">
                        மன்றத்தின் ஒவ்வொரு நிகழ்வையும் முன்னின்று நடத்தும் {COMMITTEE_COUNT} பேர் கொண்ட அணி — பதவி வகிப்போர், இதழாசிரியர்கள், ஒருங்கிணைப்பாளர்கள்.
                    </span>
                    <span className="teams-committee-cta">
                        செயற்குழுவைப் பார்க்க <FaArrowRight />
                    </span>
                </div>
                <div className="teams-committee-fan" aria-hidden="true">
                    {COMMITTEE_PREVIEW.map((m, i) => (
                        <span
                            key={m.name}
                            className={`teams-committee-photo teams-committee-photo--${i}`}
                        >
                            <SmartImage
                                src={m.photo}
                                width={320}
                                alt=""
                                fallback={<span className="teams-committee-blank" />}
                            />
                        </span>
                    ))}
                    <span className="teams-committee-count">
                        <b>{COMMITTEE_COUNT}</b> பேர்
                    </span>
                </div>
            </Link>

            {joinCfg.enabled && (
                <Link to="/teams/join" className="teams-join-banner">
                    <div>
                        <p className="teams-join-title">எங்கள் அணியில் இணையுங்கள்</p>
                        <p className="teams-join-text">
                            புதிய உறுப்பினர்களை நாங்கள் வரவேற்கிறோம் இப்போதே விண்ணப்பிக்கவும்.
                        </p>
                    </div>
                    <span className="teams-join-cta">
                        விண்ணப்பிக்க <FaArrowRight />
                    </span>
                </Link>
            )}

            {upcoming.length > 0 && (
                <section className="teams-upcoming">
                    <p className="teams-upcoming-title">
                        <FaTrophy /> வரவிருக்கும் போட்டிகள்
                    </p>
                    <div className="teams-upcoming-row">
                        {upcoming.map((c) => {
                            const days = daysUntil(c.date);
                            return (
                                <Link
                                    to={`/teams/${c.teamId}`}
                                    key={`${c.teamId}-${c.id}`}
                                    className="teams-upcoming-card"
                                >
                                    <span className="teams-upcoming-days">
                                        {days === 0 ? "இன்று!" : `${days} நாட்களில்`}
                                    </span>
                                    <span className="teams-upcoming-name">{c.name}</span>
                                    <span className="teams-upcoming-meta">
                                        <FaCalendarAlt /> {c.date} · {c.teamTitle}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </section>
            )}

            {pages.map((team) => {
                return (
                    <Link
                        to={`/teams/${team.id}`}
                        key={team.id}
                        className="teams-card"
                    >
                        <div className="teams-card-head">
                            {team.logo && (
                                <SmartImage
                                    src={team.logo}
                                    width={160}
                                    alt=""
                                    className="teams-card-logo"
                                />
                            )}
                            <p className="teams-card-title">{team.title}</p>
                        </div>
                        <p className="teams-card-description">{team.summary}</p>
                        <span className="teams-card-more">
                            மேலும் அறிய <FaArrowRight />
                        </span>
                    </Link>
                );
            })}
        </div>
    );
};

export default Teams;
