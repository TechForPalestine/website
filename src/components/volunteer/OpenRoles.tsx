import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  clampPage,
  getPageCount,
  getPageMarkers,
  getSkillFilters,
  MEMBERSHIP_URL,
  normalizeOpenRoles,
  type OpenRole,
} from "./openRoleData";
import { getSkinTokens, type OpenRolesSkin } from "./openRoleSkins";
import OpenRoleCard from "./OpenRoleCard";

type LoadState = "loading" | "ready" | "error";

interface OpenRolesProps {
  skin?: OpenRolesSkin;
}

const ALL_SKILLS = "all";

/**
 * The Hub reports ~15 skill categories, most with a single role. Showing all of
 * them at once buries the list under filters, so the long tail sits behind a
 * toggle — the same treatment TagFilter gives project tags.
 */
const MAX_VISIBLE_FILTERS = 8;

/** Expanded cards run long, so a page stays short enough to scan. */
const ROLES_PER_PAGE = 8;

export default function OpenRoles({ skin = "classic" }: OpenRolesProps) {
  const tokens = getSkinTokens(skin);
  const [roles, setRoles] = useState<OpenRole[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [activeSkill, setActiveSkill] = useState<string>(ALL_SKILLS);
  const [showAllFilters, setShowAllFilters] = useState(false);
  const [page, setPage] = useState(1);
  const countRef = useRef<HTMLParagraphElement>(null);

  const load = useCallback(async () => {
    setState("loading");
    try {
      const response = await fetch("/api/open-roles", { cache: "no-cache" });
      if (!response.ok) throw new Error(`Request failed: ${response.status}`);
      const payload = await response.json();
      setRoles(normalizeOpenRoles(payload.roles));
      setState("ready");
    } catch {
      setState("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const skillFilters = useMemo(() => getSkillFilters(roles), [roles]);

  const visibleRoles = useMemo(
    () =>
      activeSkill === ALL_SKILLS
        ? roles
        : roles.filter((role) => role.skillCategories.includes(activeSkill)),
    [roles, activeSkill]
  );

  const pageCount = getPageCount(visibleRoles.length, ROLES_PER_PAGE);
  const currentPage = clampPage(page, pageCount);
  const firstIndex = (currentPage - 1) * ROLES_PER_PAGE;
  const pageRoles = visibleRoles.slice(firstIndex, firstIndex + ROLES_PER_PAGE);

  const selectSkill = (skill: string) => {
    setActiveSkill(skill);
    setPage(1);
  };

  // A new page replaces the cards in place, so bring the top of the list back
  // into view and move focus there, or keyboard and screen reader users are
  // left on a pager at the foot of cards they have not read.
  const goToPage = (next: number) => {
    setPage(clampPage(next, pageCount));
    const count = countRef.current;
    if (!count) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    count.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    count.focus({ preventScroll: true });
  };

  if (state === "loading") {
    return (
      <div className="space-y-4" aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading open roles</span>
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className={`h-40 animate-pulse motion-reduce:animate-none ${tokens.skeleton}`}
          />
        ))}
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className={tokens.notice}>
        <p>
          We couldn&rsquo;t load open roles just now. Try again, or{" "}
          <a href={MEMBERSHIP_URL} className={`${tokens.link} ${tokens.focus}`}>
            become a member
          </a>{" "}
          and we&rsquo;ll match you to a role.
        </p>
        <button
          type="button"
          onClick={load}
          className={`mt-4 ${tokens.applyProject} ${tokens.focus}`}
        >
          Try again
        </button>
      </div>
    );
  }

  if (roles.length === 0) {
    return (
      <p className={tokens.notice}>
        No roles are open right now.{" "}
        <a href={MEMBERSHIP_URL} className={`${tokens.link} ${tokens.focus}`}>
          Become a member
        </a>{" "}
        and we&rsquo;ll get in touch when one opens up.
      </p>
    );
  }

  const hiddenFilterCount = Math.max(skillFilters.length - MAX_VISIBLE_FILTERS, 0);
  const visibleFilters =
    showAllFilters || hiddenFilterCount === 0
      ? skillFilters
      : skillFilters.filter(
          // Keep the active filter on screen even when it lives in the tail.
          (filter, index) => index < MAX_VISIBLE_FILTERS || filter.name === activeSkill
        );

  return (
    <div>
      {skillFilters.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => selectSkill(ALL_SKILLS)}
            aria-pressed={activeSkill === ALL_SKILLS}
            className={`${tokens.chip} ${
              activeSkill === ALL_SKILLS ? tokens.chipActive : tokens.chipIdle
            } ${tokens.focus}`}
          >
            All roles
            <span className="ml-1.5 opacity-70">{roles.length}</span>
          </button>

          {visibleFilters.map((filter) => {
            const isActive = filter.name === activeSkill;
            return (
              <button
                key={filter.name}
                type="button"
                onClick={() => selectSkill(filter.name)}
                aria-pressed={isActive}
                className={`${tokens.chip} ${isActive ? tokens.chipActive : tokens.chipIdle} ${
                  tokens.focus
                }`}
              >
                {filter.name}
                <span className="ml-1.5 opacity-70">{filter.count}</span>
              </button>
            );
          })}

          {hiddenFilterCount > 0 && (
            <button
              type="button"
              onClick={() => setShowAllFilters((value) => !value)}
              className={`${tokens.chip} ${tokens.chipIdle} ${tokens.focus}`}
            >
              {showAllFilters ? "Show fewer skills" : `${hiddenFilterCount} more skills`}
            </button>
          )}
        </div>
      )}

      <p
        ref={countRef}
        tabIndex={-1}
        className={`mb-6 scroll-mt-28 outline-none ${tokens.count}`}
        aria-live="polite"
      >
        {pageCount > 1
          ? `Showing ${firstIndex + 1}–${firstIndex + pageRoles.length} of ${visibleRoles.length} open roles`
          : visibleRoles.length === 1
            ? "1 open role"
            : `${visibleRoles.length} open roles`}
        {activeSkill !== ALL_SKILLS && ` in ${activeSkill}`}
      </p>

      <div className="space-y-4">
        {pageRoles.map((role) => (
          <OpenRoleCard key={role.id} role={role} tokens={tokens} />
        ))}
      </div>

      {pageCount > 1 && (
        <nav aria-label="Open roles pages" className="mt-8">
          <ul className="flex flex-wrap items-center justify-center gap-2">
            <li>
              <button
                type="button"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`${tokens.chip} ${tokens.chipIdle} ${tokens.focus} disabled:pointer-events-none disabled:opacity-40`}
              >
                <span aria-hidden="true">←</span>
                <span className="ml-1.5">Previous</span>
              </button>
            </li>
            {getPageMarkers(currentPage, pageCount).map((marker, index) =>
              marker === "gap" ? (
                <li key={`gap-${index}`} aria-hidden="true" className={`px-1 ${tokens.count}`}>
                  …
                </li>
              ) : (
                <li key={marker}>
                  <button
                    type="button"
                    onClick={() => goToPage(marker)}
                    aria-current={marker === currentPage ? "page" : undefined}
                    aria-label={`Page ${marker}`}
                    className={`${tokens.chip} min-w-[44px] justify-center ${
                      marker === currentPage ? tokens.chipActive : tokens.chipIdle
                    } ${tokens.focus}`}
                  >
                    {marker}
                  </button>
                </li>
              )
            )}
            <li>
              <button
                type="button"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === pageCount}
                className={`${tokens.chip} ${tokens.chipIdle} ${tokens.focus} disabled:pointer-events-none disabled:opacity-40`}
              >
                <span className="mr-1.5">Next</span>
                <span aria-hidden="true">→</span>
              </button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}
