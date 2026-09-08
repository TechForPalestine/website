import React, { useId, useState } from "react";
import { getApplyTarget, type OpenRole } from "./openRoleData";
import type { SkinTokens } from "./openRoleSkins";

/** Descriptions shorter than this read fine in full, so they get no toggle. */
const CLAMP_THRESHOLD = 260;

function ClockIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function Chevron({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`transition-transform duration-150 ${expanded ? "rotate-180" : ""}`}
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

interface OpenRoleCardProps {
  role: OpenRole;
  tokens: SkinTokens;
}

export default function OpenRoleCard({ role, tokens }: OpenRoleCardProps) {
  const [expanded, setExpanded] = useState(false);
  const descriptionId = useId();
  const apply = getApplyTarget(role);
  const isTeamRole = role.type === "team";
  const canCollapse = role.description.length > CLAMP_THRESHOLD;
  const isCollapsed = canCollapse && !expanded;

  return (
    <article className={tokens.card}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {(role.orgName || isTeamRole) && (
            <p className="mb-1.5 flex flex-wrap items-center gap-2">
              {role.orgName && <span className={tokens.org}>{role.orgName}</span>}
              {isTeamRole && <span className={tokens.orgMarker}>T4P team</span>}
            </p>
          )}
          <h3 className={`${tokens.title} break-words`}>{role.title}</h3>
        </div>

        <a
          href={apply.href}
          className={`${isTeamRole ? tokens.applyTeam : tokens.applyProject} ${tokens.focus} shrink-0`}
        >
          {apply.label}
          <span className="sr-only"> as {role.title}</span>
        </a>
      </div>

      {(role.skillCategories.length > 0 || role.timeCommitment) && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {role.skillCategories.map((skill) => (
            <li key={skill} className={tokens.pill}>
              {skill}
            </li>
          ))}
          {role.timeCommitment && (
            <li className={tokens.pill}>
              <ClockIcon />
              {role.timeCommitment}
            </li>
          )}
        </ul>
      )}

      {role.description && (
        <>
          <p
            id={descriptionId}
            className={`mt-4 max-w-[75ch] ${tokens.body} ${
              isCollapsed ? "line-clamp-3" : "whitespace-pre-line"
            }`}
          >
            {/* Several descriptions open with a short heading line, which would
                spend the three-line clamp on almost no content. Flattening the
                whitespace while collapsed gives three full lines of preview. */}
            {isCollapsed ? role.description.replace(/\s+/g, " ") : role.description}
          </p>

          {canCollapse && (
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              aria-expanded={expanded}
              aria-controls={descriptionId}
              className={`mt-1 ${tokens.disclosure} ${tokens.focus}`}
            >
              {expanded ? "Show less" : "Read the full role"}
              <Chevron expanded={expanded} />
            </button>
          )}
        </>
      )}

      {expanded && role.areasOfInterest.length > 0 && (
        <p className="mt-3">
          <span className={tokens.detailLabel}>Areas of interest: </span>
          <span className={tokens.body}>{role.areasOfInterest.join(", ")}</span>
        </p>
      )}
    </article>
  );
}
