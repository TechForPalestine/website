import React, { useState } from "react";
import { type ProjectItem, getInitials, resolveLogoSrc, getProjectText } from "./projectData";
import { getActiveSocialFields } from "./socialIcons";

interface ProjectCardProps {
  project: ProjectItem;
  onClick: (project: ProjectItem, buttonEl: HTMLButtonElement) => void;
  featured?: boolean;
}

function LogoFrame({
  logoUrl,
  name,
  size = "sm",
}: {
  logoUrl?: string;
  name: string;
  size?: "sm" | "md";
}) {
  const [failed, setFailed] = useState(false);
  const src = resolveLogoSrc(logoUrl);
  const sizeClass = size === "sm" ? "h-14 w-14" : "h-16 w-16";

  if (!src || failed) {
    return (
      <div
        className={`${sizeClass} flex shrink-0 items-center justify-center rounded-md border border-butter bg-butter`}
        aria-hidden="true"
      >
        <span className="ts-label font-serif text-ink-secondary">{getInitials(name)}</span>
      </div>
    );
  }

  return (
    <div className={`${sizeClass} relative shrink-0`}>
      <div
        className="absolute inset-0 rotate-[-3deg] rounded-md bg-[var(--color-logo-frame)] shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
        aria-hidden="true"
      />
      <div className="relative flex h-full w-full items-center justify-center rounded-md bg-white p-2 shadow-[0_4px_12px_rgba(0,0,0,0.06)]">
        <img
          src={src}
          alt={`${name} logo`}
          className="max-h-full max-w-full object-contain"
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      </div>
    </div>
  );
}

export default function ProjectCard({ project, onClick, featured = false }: ProjectCardProps) {
  const text = getProjectText(project);
  const activeSocials = getActiveSocialFields(project);
  const visibleSocials = activeSocials.slice(0, 3);
  const displayTags = (project.tags ?? []).slice(0, 3);
  const extraTagCount = (project.tags?.length ?? 0) - displayTags.length;

  return (
    <article>
      <button
        type="button"
        onClick={(e) => onClick(project, e.currentTarget)}
        className={[
          "group w-full cursor-pointer rounded-[20px] border text-left transition-colors duration-150",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
          featured
            ? "border-t-2 border-butter border-t-brand bg-page p-8 hover:bg-cream"
            : "border-butter bg-sand p-6 hover:border-brand/30 hover:bg-cream",
        ].join(" ")}
        aria-label={`View details for ${project.name}`}
      >
        <div className="mb-4 flex items-start gap-4">
          <LogoFrame logoUrl={project.logoUrl} name={project.name} size={featured ? "md" : "sm"} />
          <div className="min-w-0 flex-1">
            {project.categoryName && (
              <p className="ts-overline mb-1 text-ink-secondary">{project.categoryName}</p>
            )}
            <h3 className="ts-subheading break-words text-ink">{project.name}</h3>
          </div>
        </div>

        {text && <p className="ts-body mb-4 line-clamp-3 text-ink-secondary">{text}</p>}

        {displayTags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {displayTags.map((tag) => (
              <span
                key={tag.id}
                className="ts-caption rounded-pill border border-ink-divider px-2.5 py-1 text-ink-secondary"
              >
                {tag.name}
              </span>
            ))}
            {extraTagCount > 0 && (
              <span className="ts-caption rounded-pill border border-ink-divider px-2.5 py-1 text-ink-muted">
                +{extraTagCount}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-ink-secondary" aria-hidden="true">
            {visibleSocials.map((field) => (
              <span key={String(field.key)} className="flex h-5 w-5 items-center justify-center">
                {field.icon}
              </span>
            ))}
          </div>
          <span className="ts-label flex items-center gap-1 text-brand group-hover:underline">
            View details
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </span>
        </div>
      </button>
    </article>
  );
}
