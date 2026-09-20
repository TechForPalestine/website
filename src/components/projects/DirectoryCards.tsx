import React, { memo, useMemo, useState } from "react";
import { Box, Card, Chip, IconButton, Link, Tooltip, Typography } from "@mui/material";
import { sanitizeEmail, sanitizeUrl } from "./projectData";
import {
  TAG_CHIP,
  getActiveSocialFields,
  getInitials,
  getProjectText,
  getSocialHref,
  resolveLogoSrc,
  useCopyText,
  type ProjectItem,
} from "./directoryShared";

// The two card types are memoized and keep their own transient state (a failed
// image, a copied email). Both used to live in the parent, so any of them
// re-rendered every card in the directory. Static `sx` objects are hoisted to
// module scope so emotion is not handed a fresh object per card per render.

const DEFAULT_LOGO = "/images/default.jpg";
const CARD_TRANSITION = "border-color 150ms cubic-bezier(0.22, 1, 0.36, 1)";
const CARD_SHADOW = "0 1px 2px 0 rgb(0 0 0 / 0.05)";
const FOCUS_RING = { outline: "2px solid #157A3E", outlineOffset: "2px" } as const;

const featuredCardSx = {
  p: 3,
  border: "1px solid #D2E4D6",
  borderRadius: "24px",
  boxShadow: CARD_SHADOW,
  transition: CARD_TRANSITION,
  "&:hover": { borderColor: "#157A3E" },
  "&:focus-visible": FOCUS_RING,
  cursor: "pointer",
  display: "flex",
  flexDirection: "column",
} as const;

const gridCardSx = {
  p: 3,
  position: "relative",
  border: "1px solid",
  borderColor: "divider",
  borderRadius: "24px",
  boxShadow: CARD_SHADOW,
  transition: CARD_TRANSITION,
  "&:hover": { borderColor: "#157A3E" },
  "&:focus-visible": FOCUS_RING,
  cursor: "pointer",
  height: "100%",
  display: "flex",
  flexDirection: "column",
} as const;

const initialsSx = (size: number, fontSize: string) =>
  ({
    width: size,
    height: size,
    borderRadius: "50%",
    bgcolor: "#E7F2E9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    fontSize,
    fontWeight: 500,
    color: "#2F5C3F",
  }) as const;

const featuredAvatarSx = {
  width: 52,
  height: 52,
  borderRadius: "50%",
  objectFit: "cover",
  flexShrink: 0,
} as const;
const gridAvatarSx = {
  width: 40,
  height: 40,
  borderRadius: "50%",
  objectFit: "cover",
  bgcolor: "#F2F3EE",
  flexShrink: 0,
} as const;
const featuredInitialsSx = initialsSx(52, "1.1rem");
const gridInitialsSx = initialsSx(40, "0.9rem");

const clampedTitleSx = {
  fontSize: "1rem",
  fontWeight: 600,
  overflow: "hidden",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  lineHeight: 1.25,
} as const;
const clampedBodySx = {
  color: "text.primary",
  mb: 2,
  lineHeight: 1.5,
  fontSize: "0.875rem",
  overflow: "hidden",
  display: "-webkit-box",
  WebkitLineClamp: 3,
  WebkitBoxOrient: "vertical",
  flexGrow: 1,
} as const;
const neutralChipSx = {
  bgcolor: "#F2F3EE",
  color: "text.secondary",
  fontSize: "0.7rem",
  fontWeight: 500,
} as const;
const tagChipSx = {
  ...TAG_CHIP,
  fontSize: "0.7rem",
  fontWeight: 500,
  border: "none",
} as const;
const socialButtonSx = {
  color: "text.secondary",
  p: 0.5,
  "&:hover": { color: "primary.main" },
} as const;

const stop = (e: React.SyntheticEvent) => e.stopPropagation();

interface FeaturedProjectCardProps {
  project: ProjectItem;
  onOpen: (project: ProjectItem) => void;
}

export const FeaturedProjectCard = memo(function FeaturedProjectCard({
  project,
  onOpen,
}: FeaturedProjectCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const hasLogo = !!project.logoUrl && project.logoUrl !== DEFAULT_LOGO;
  const showInitials = !hasLogo || imageFailed;
  const websiteUrl = sanitizeUrl(project.websiteUrl);

  return (
    <Card onClick={() => onOpen(project)} sx={featuredCardSx}>
      <Box sx={{ display: "flex", gap: 2, mb: 2, alignItems: "center" }}>
        {showInitials ? (
          <Box sx={featuredInitialsSx}>{getInitials(project.name)}</Box>
        ) : (
          <Box
            component="img"
            src={resolveLogoSrc(project.logoUrl)}
            alt={project.name}
            width={52}
            height={52}
            loading="lazy"
            decoding="async"
            sx={featuredAvatarSx}
            onError={() => setImageFailed(true)}
          />
        )}
        <Box sx={{ minWidth: 0 }}>
          <Typography
            component="h3"
            sx={{ fontWeight: 700, fontSize: "1.125rem", lineHeight: 1.25 }}
          >
            {project.name}
          </Typography>
          {project.leadName && (
            <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.875rem" }}>
              Led by {project.leadName}
            </Typography>
          )}
        </Box>
      </Box>
      <Typography variant="body2" sx={{ color: "text.primary", lineHeight: 1.6, flexGrow: 1 }}>
        {getProjectText(project)}
      </Typography>
      {websiteUrl && (
        <Box sx={{ mt: 2 }}>
          <Link
            href={websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={stop}
            sx={{ fontSize: "0.875rem" }}
          >
            Visit site →
          </Link>
        </Box>
      )}
    </Card>
  );
});

interface ProjectGridCardProps {
  project: ProjectItem;
  isFiltering: boolean;
  onOpen: (project: ProjectItem) => void;
  onAnnounce: (message: string) => void;
}

export const ProjectGridCard = memo(function ProjectGridCard({
  project,
  isFiltering,
  onOpen,
  onAnnounce,
}: ProjectGridCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const [emailCopied, copyText] = useCopyText();

  // Sanitizing 15 social fields per project is regex work; do it once per
  // project object instead of on every render of every card.
  const socials = useMemo(() => getActiveSocialFields(project), [project]);
  const visibleSocials = socials.slice(0, 4);
  const overflowCount = socials.length - 4;

  const hasLogo = !!project.logoUrl && project.logoUrl !== DEFAULT_LOGO;
  const hasLeaderPhoto = !!project.leaderPhoto;
  const showInitials = (!hasLogo && !hasLeaderPhoto) || imageFailed;
  // Project logo takes priority; leader photo only fills in when there's no project logo
  const avatarSrc = resolveLogoSrc(hasLogo ? project.logoUrl : project.leaderPhoto);

  const handleEmailClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    copyText(sanitizeEmail(project.publicEmail)).then((ok) => {
      if (ok) onAnnounce("Email address copied to clipboard");
    });
  };

  return (
    <Card onClick={() => onOpen(project)} sx={gridCardSx}>
      <Box sx={{ display: "flex", gap: 2, mb: 1.5, alignItems: "center" }}>
        {showInitials ? (
          <Box sx={gridInitialsSx}>{getInitials(project.name)}</Box>
        ) : (
          <Box
            component="img"
            src={avatarSrc}
            alt={project.name}
            width={40}
            height={40}
            loading="lazy"
            decoding="async"
            sx={gridAvatarSx}
            onError={() => setImageFailed(true)}
          />
        )}
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography component="h3" sx={clampedTitleSx}>
            {project.name}
          </Typography>
        </Box>
        {project.featured && isFiltering && (
          <Chip
            label="Featured"
            size="small"
            color="primary"
            sx={{ flexShrink: 0, fontWeight: 600 }}
          />
        )}
      </Box>

      {(project.categoryName || (project.tags && project.tags.length > 0)) && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1.5 }}>
          {project.categoryName && (
            <Chip label={project.categoryName} size="small" sx={neutralChipSx} />
          )}
          {project.tags?.slice(0, 3).map((tag) => (
            <Chip key={tag.id} label={tag.name} size="small" sx={tagChipSx} />
          ))}
          {project.tags && project.tags.length > 3 && (
            <Chip label={`+${project.tags.length - 3}`} size="small" sx={neutralChipSx} />
          )}
        </Box>
      )}

      <Typography variant="body2" sx={clampedBodySx}>
        {getProjectText(project)}
      </Typography>

      <Box
        sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: "auto" }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
          {visibleSocials.map((field) => {
            const icon = (
              <IconButton
                key={field.key}
                component="a"
                href={getSocialHref(field, project)}
                target={field.isEmail ? undefined : "_blank"}
                rel={field.isEmail ? undefined : "noopener noreferrer"}
                onClick={field.isEmail ? handleEmailClick : stop}
                size="small"
                aria-label={
                  field.isEmail
                    ? `Email ${project.name} (also copies the address)`
                    : `${project.name} on ${field.label}`
                }
                sx={socialButtonSx}
              >
                {field.icon}
              </IconButton>
            );
            return field.isEmail ? (
              <Tooltip
                key={field.key}
                open={emailCopied}
                title="Email copied"
                placement="top"
                arrow
                describeChild
              >
                {icon}
              </Tooltip>
            ) : (
              icon
            );
          })}
          {overflowCount > 0 && (
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", fontSize: "0.7rem", ml: 0.25 }}
            >
              +{overflowCount}
            </Typography>
          )}
        </Box>
        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
            fontSize: "0.75rem",
            cursor: "pointer",
            "&:hover": { color: "primary.main" },
          }}
        >
          More info →
        </Typography>
      </Box>
    </Card>
  );
});
