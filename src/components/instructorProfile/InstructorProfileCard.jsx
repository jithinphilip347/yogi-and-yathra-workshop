"use client";

import React, { useState } from "react";
import { FiShield } from "react-icons/fi";
import { resolveMediaUrl } from "@/utils/mediaUrl";
import "./InstructorProfileCard.scss";

const normalizeExpertise = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Older profiles may store expertise as a comma-separated string.
  }

  return value.split(",");
};

export default function InstructorProfileCard({ person, sectionTitle = "Meet your instructor", fallbackRole = "Instructor" }) {
  const [failedAvatar, setFailedAvatar] = useState("");
  if (!person?.name) return null;

  const avatar = person.avatar_url || person.avatar || "";
  const biography = person.short_bio || person.full_biography || person.bio_graphy || "";
  const expertiseTags = normalizeExpertise(person.expertise)
    .filter((item) => typeof item === "string" && item.trim())
    .map((item) => item.trim());
  const initials = person.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  return (
    <section className="experienceInstructorSection">
      {sectionTitle && <h2 className="experienceInstructorSectionTitle">{sectionTitle}</h2>}
      <article className="experienceInstructorCard">
        <div className="experienceInstructorAvatarColumn">
          {avatar && failedAvatar !== avatar
            ? <img className="experienceInstructorAvatar" src={resolveMediaUrl(avatar, "")} alt={person.name} width={180} height={180} onError={() => setFailedAvatar(avatar)} />
            : <div className="experienceInstructorAvatar experienceInstructorAvatarFallback" aria-label={`${person.name} profile image unavailable`}>{initials}</div>}
          <span className="experienceInstructorBadge"><FiShield aria-hidden="true" />{fallbackRole}</span>
        </div>
        <div className="experienceInstructorInfo">
          <h3 className="experienceInstructorName">{person.name}</h3>
          <p className="experienceInstructorTitle">{person.professional_title || fallbackRole}</p>
          {biography && <p className="experienceInstructorBio">{biography}</p>}
          {(expertiseTags.length > 0 || person.years_of_experience != null) && <div className="experienceInstructorTags">
            {expertiseTags.map((area, index) => <span key={`${area}-${index}`}>{area}</span>)}
            {person.years_of_experience != null && <span>{person.years_of_experience}+ years experience</span>}
          </div>}
        </div>
      </article>
    </section>
  );
}
