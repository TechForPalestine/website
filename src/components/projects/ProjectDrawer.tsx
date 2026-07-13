import React, { useEffect, useRef, useState } from "react";
import {
  type ProjectItem,
  getInitials,
  resolveLogoSrc,
  sanitizeUrl,
  sanitizeEmail,
  formatMonthYear,
  formatDate,
} from "./projectData";
import { getActiveSocialFields, getSocialHref } from "./socialIcons";

interface ProjectDrawerProps {
  project: ProjectItem | null;
  open: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

function DrawerLogoFrame({ logoUrl, name }: { logoUrl?: string; name: string }) {
  const [failed, setFailed] = useState(false);
  const src = resolveLogoSrc(logoUrl);

  if (!src || failed) {
    return (
      <div
        className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-butter bg-butter"
        aria-hidden="true"
      >
        <span className="ts-subheading font-serif text-ink-secondary">{getInitials(name)}</span>
      </div>
    );
  }

  return (
    <div className="relative h-20 w-20 shrink-0">
      <div
        className="absolute inset-0 rotate-[-3deg] rounded-lg bg-[var(--color-logo-frame)] shadow-[0_6px_20px_rgba(0,0,0,0.06)]"
        aria-hidden="true"
      />
      <div className="relative flex h-full w-full items-center justify-center rounded-lg bg-white p-3 shadow-[0_6px_20px_rgba(0,0,0,0.08)]">
        <img
          src={src}
          alt={`${name} logo`}
          className="max-h-full max-w-full object-contain"
          loading="eager"
          decoding="async"
          onError={() => setFailed(true)}
        />
      </div>
    </div>
  );
}

function LeaderPhoto({ src, name }: { src: string; name: string }) {
  const [failed, setFailed] = useState(false);
  const safeSrc = sanitizeUrl(src);

  if (!safeSrc || failed) {
    return (
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand/10">
        <span className="ts-label text-brand">{getInitials(name)}</span>
      </div>
    );
  }

  return (
    <img
      src={safeSrc}
      alt={name}
      className="h-12 w-12 shrink-0 rounded-full object-cover"
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

export default function ProjectDrawer({ project, open, onClose, triggerRef }: ProjectDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  // Enter: render hidden first, then transition in next frame so CSS plays on first open too.
  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    } else {
      setVisible(false);
    }
  }, [open]);

  // Freeze Lenis (smooth scroll) while modal is open so wheel events can't move the page.
  useEffect(() => {
    const lenis = (window as any).__lenis;
    if (open) {
      lenis?.stop();
    } else {
      lenis?.start();
    }
    return () => {
      lenis?.start();
    };
  }, [open]);

  // Focus management + ESC key
  useEffect(() => {
    if (!open || !panelRef.current) return;

    const panel = panelRef.current;
    const focusables = panel.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    first?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Restore focus to trigger on close
  useEffect(() => {
    if (!open && triggerRef?.current) {
      triggerRef.current.focus();
    }
  }, [open, triggerRef]);

  if (!project) return null;

  const activeSocials = getActiveSocialFields(project);
  const websiteUrl = sanitizeUrl(project.websiteUrl);
  const donationUrl = sanitizeUrl(project.donationUrl);
  const involvementUrl = sanitizeUrl(project.involvementUrl);
  const email = sanitizeEmail(project.publicEmail);

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className={[
        "fixed inset-0 z-50 flex items-center justify-center px-4 py-8",
        "bg-ink/60 backdrop-blur-sm",
        "transition-opacity duration-300 motion-reduce:transition-none",
        visible ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
      ].join(" ")}
      role="dialog"
      aria-modal="true"
      aria-label={`${project.name} details`}
    >
      <div
        ref={panelRef}
        data-lenis-prevent
        className={[
          "relative max-h-[90vh] w-full max-w-2xl overflow-y-auto overscroll-y-contain rounded-[20px] border border-butter bg-page p-6 shadow-xl min-[810px]:p-8",
          "transition-all duration-300 ease-out motion-reduce:transition-none",
          visible ? "scale-100 opacity-100" : "scale-95 opacity-0",
        ].join(" ")}
        tabIndex={-1}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-ink-divider text-ink-secondary transition-colors hover:border-brand/30 hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          aria-label="Close"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Identity block */}
        <div className="mb-6 flex items-start gap-4 pr-10">
          <DrawerLogoFrame logoUrl={project.logoUrl} name={project.name} />
          <div className="min-w-0">
            {project.featured && <p className="ts-overline mb-1 text-brand">Featured</p>}
            <h2 className="ts-heading break-words text-ink">{project.name}</h2>
            {project.categoryName && (
              <p className="ts-body-small mt-1 text-ink-secondary">{project.categoryName}</p>
            )}
            {project.createdAt && (
              <p className="ts-caption mt-1 text-ink-muted">
                Joined {formatMonthYear(project.createdAt)}
              </p>
            )}
          </div>
        </div>

        {/* Primary CTAs */}
        <div className="mb-8 flex flex-wrap gap-3">
          {websiteUrl && (
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ts-label inline-flex min-h-[44px] items-center gap-2 rounded-pill border border-transparent bg-brand px-5 py-3 text-white transition-colors hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:scale-[0.98]"
            >
              Visit website
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" />
              </svg>
            </a>
          )}
          {donationUrl && (
            <a
              href={donationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ts-label inline-flex min-h-[44px] items-center gap-2 rounded-pill border border-ink bg-transparent px-5 py-3 text-ink transition-colors hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:scale-[0.98]"
            >
              Donate
            </a>
          )}
          {involvementUrl && (
            <a
              href={involvementUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ts-label inline-flex min-h-[44px] items-center gap-2 rounded-pill border border-ink bg-transparent px-5 py-3 text-ink transition-colors hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:scale-[0.98]"
            >
              Get involved
            </a>
          )}
          {email && (
            <a
              href={`mailto:${email}`}
              className="ts-label inline-flex min-h-[44px] items-center gap-2 rounded-pill border border-transparent bg-transparent px-0 py-3 text-brand hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              Contact
            </a>
          )}
        </div>

        <div className="mb-8 h-px w-full bg-ink-divider" />

        {/* About */}
        {project.description && (
          <section className="mb-8">
            <h3 className="ts-overline mb-3 text-ink-secondary">About</h3>
            <p className="ts-body text-ink">{project.description}</p>
          </section>
        )}

        {/* Impact callout */}
        {project.impactStatement && (
          <div className="mb-8 rounded-lg border border-butter bg-cream px-5 py-4">
            <p className="ts-overline mb-2 text-ink-secondary">Our impact</p>
            <p className="ts-body text-ink">{project.impactStatement}</p>
          </div>
        )}

        {/* Leader */}
        {project.leadName && (
          <section className="mb-8">
            <h3 className="ts-overline mb-3 text-ink-secondary">Project lead</h3>
            <div className="flex items-start gap-3">
              {project.leaderPhoto && (
                <LeaderPhoto src={project.leaderPhoto} name={project.leadName} />
              )}
              <div>
                <p className="ts-label text-ink">{project.leadName}</p>
                {project.leaderBio && (
                  <p className="ts-body-small mt-1 text-ink-secondary">{project.leaderBio}</p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Social links */}
        {activeSocials.length > 0 && (
          <section className="mb-8">
            <h3 className="ts-overline mb-3 text-ink-secondary">Find them online</h3>
            <div className="flex flex-wrap gap-2">
              {activeSocials.map((field) => {
                const href = getSocialHref(field, project);
                if (!href) return null;
                const isExternal = !field.isEmail;
                return (
                  <a
                    key={String(field.key)}
                    href={href}
                    target={isExternal ? "_blank" : undefined}
                    rel={isExternal ? "noopener noreferrer" : undefined}
                    className="ts-body-small inline-flex min-h-[36px] items-center gap-1.5 rounded-pill border border-ink-divider px-3 py-1.5 text-ink-secondary transition-colors hover:border-brand/40 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  >
                    <span className="flex h-4 w-4 items-center justify-center" aria-hidden="true">
                      {field.icon}
                    </span>
                    {field.label}
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* Tags */}
        {(project.tags?.length ?? 0) > 0 && (
          <section className="mb-8">
            <h3 className="ts-overline mb-3 text-ink-secondary">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {project.tags!.map((tag) => (
                <span
                  key={tag.id}
                  className="ts-caption rounded-pill border border-ink-divider px-3 py-1.5 text-ink-secondary"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Last updated */}
        {project.updatedAt && (
          <p className="ts-caption text-ink-muted">Last updated {formatDate(project.updatedAt)}</p>
        )}
      </div>
    </div>
  );
}
