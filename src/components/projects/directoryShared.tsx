import React, { useCallback, useEffect, useRef, useState } from "react";
import { Box } from "@mui/material";
import GitHubIcon from "@mui/icons-material/GitHub";
import TwitterIcon from "@mui/icons-material/Twitter";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import FacebookIcon from "@mui/icons-material/Facebook";
import YouTubeIcon from "@mui/icons-material/YouTube";
import TelegramIcon from "@mui/icons-material/Telegram";
import InstagramIcon from "@mui/icons-material/Instagram";
import EmailIcon from "@mui/icons-material/Email";
import LanguageIcon from "@mui/icons-material/Language";
import { sanitizeUrl, sanitizeEmail } from "./projectData";
import { copyToClipboard } from "../../utils/copyAnchorLink";

// Shared by the directory, its cards and the details dialog.

export interface Tag {
  id: number;
  name: string;
  type: string;
}

export interface ProjectItem {
  id: number;
  name: string;
  description: string;
  impactStatement?: string;
  elevatorPitch?: string;
  websiteUrl?: string;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
  leadName?: string;
  leaderPhoto?: string;
  leaderBio?: string;
  publicEmail?: string;
  donationUrl?: string;
  involvementUrl?: string;
  categoryName?: string;
  discordUsername?: string;
  mentor?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  youtubeUrl?: string;
  telegramUrl?: string;
  mastodonUrl?: string;
  blueskyUrl?: string;
  tiktokUrl?: string;
  signalUrl?: string;
  upscrolledUrl?: string;
  tags?: Tag[];
  featured?: boolean;
}

export const getInitials = (name: string): string => {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0])?.toUpperCase();
  } else if (words.length === 1) {
    return words[0][0]?.toUpperCase();
  }
  return "P";
};

export const getProjectText = (project: ProjectItem): string =>
  project.description || project.elevatorPitch || project.impactStatement || "";

// Tags previously drew from a 12-colour Material palette keyed on `id % 12`,
// so a tag's colour was arbitrary and carried no meaning. DESIGN.md allows one
// accent, so every tag shares the First Light chip.
export const TAG_CHIP = { bgcolor: "#E7F2E9", color: "#2F5C3F" };

export const resolveLogoSrc = (url: string | undefined): string => {
  if (!url) return "";
  return url.startsWith("/") ? `https://projecthub.techforpalestine.org${url}` : url;
};

export const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
};

export const formatMonthYear = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  } catch {
    return "";
  }
};

// Inline SVG paths for brand icons not available in MUI
const MastodonSvg = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M23.268 5.313c-.35-2.578-2.617-4.61-5.304-5.004C17.51.242 15.792 0 11.813 0h-.03c-3.98 0-4.835.242-5.288.309C3.882.692 1.496 2.518.917 5.127.64 6.412.61 7.837.661 9.143c.074 1.874.088 3.745.26 5.611.118 1.24.325 2.47.62 3.68.55 2.237 2.777 4.098 4.96 4.857 2.336.792 4.849.923 7.256.38.265-.061.527-.132.786-.213.585-.184 1.27-.39 1.774-.753a.057.057 0 0 0 .023-.043v-1.809a.052.052 0 0 0-.02-.041.053.053 0 0 0-.046-.01 20.282 20.282 0 0 1-4.709.545c-2.73 0-3.463-1.284-3.674-1.818a5.593 5.593 0 0 1-.319-1.433.053.053 0 0 1 .066-.054c1.517.363 3.072.546 4.632.546.376 0 .75 0 1.125-.01 1.57-.044 3.224-.124 4.768-.422.038-.008.077-.015.11-.024 2.435-.464 4.753-1.92 4.989-5.604.008-.145.03-1.52.03-1.67.002-.512.167-3.63-.024-5.545zm-3.748 9.195h-2.561V8.29c0-1.309-.55-1.976-1.67-1.976-1.23 0-1.846.79-1.846 2.35v3.403h-2.546V8.663c0-1.56-.617-2.35-1.848-2.35-1.112 0-1.668.668-1.67 1.977v6.218H4.822V8.102c0-1.31.337-2.35 1.011-3.12.696-.77 1.608-1.164 2.74-1.164 1.311 0 2.302.5 2.962 1.498l.638 1.06.638-1.06c.66-.999 1.65-1.498 2.96-1.498 1.13 0 2.043.395 2.74 1.164.675.77 1.012 1.81 1.012 3.12z" />
  </svg>
);

const BlueskySvg = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.206-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8z" />
  </svg>
);

const TikTokSvg = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
  </svg>
);

const SignalSvg = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 0a12 12 0 1 0 0 24A12 12 0 0 0 12 0zm.87 5.82a6.18 6.18 0 0 1 4.76 9.6l.37 1.35-1.4-.37a6.18 6.18 0 1 1-3.73-10.58zm-5.1 3.34a.81.81 0 1 0 0 1.62.81.81 0 0 0 0-1.62zm4.23 0a.81.81 0 1 0 0 1.62.81.81 0 0 0 0-1.62zm4.23 0a.81.81 0 1 0 0 1.62.81.81 0 0 0 0-1.62z" />
  </svg>
);

const DiscordSvg = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

// Social fields in priority order for the card's icon row (capped at 4 visible)
export type SocialField = {
  key: keyof ProjectItem;
  label: string;
  icon: React.ReactNode;
  isEmail?: boolean;
  isDiscord?: boolean;
};

export const SOCIAL_FIELDS: SocialField[] = [
  { key: "websiteUrl", label: "Website", icon: <LanguageIcon fontSize="small" /> },
  { key: "githubUrl", label: "GitHub", icon: <GitHubIcon fontSize="small" /> },
  { key: "twitterUrl", label: "Twitter", icon: <TwitterIcon fontSize="small" /> },
  { key: "linkedinUrl", label: "LinkedIn", icon: <LinkedInIcon fontSize="small" /> },
  { key: "instagramUrl", label: "Instagram", icon: <InstagramIcon fontSize="small" /> },
  { key: "facebookUrl", label: "Facebook", icon: <FacebookIcon fontSize="small" /> },
  { key: "youtubeUrl", label: "YouTube", icon: <YouTubeIcon fontSize="small" /> },
  { key: "telegramUrl", label: "Telegram", icon: <TelegramIcon fontSize="small" /> },
  { key: "mastodonUrl", label: "Mastodon", icon: <MastodonSvg /> },
  { key: "blueskyUrl", label: "Bluesky", icon: <BlueskySvg /> },
  { key: "tiktokUrl", label: "TikTok", icon: <TikTokSvg /> },
  { key: "signalUrl", label: "Signal", icon: <SignalSvg /> },
  {
    key: "upscrolledUrl",
    label: "Upscrolled",
    icon: <Box component="img" src="/upscrolled-icon.svg" alt="" sx={{ width: 20, height: 20 }} />,
  },
  { key: "discordUsername", label: "Discord", icon: <DiscordSvg />, isDiscord: true },
  { key: "publicEmail", label: "Email", icon: <EmailIcon fontSize="small" />, isEmail: true },
];

export function getSocialHref(field: SocialField, project: ProjectItem): string {
  if (field.isEmail) return `mailto:${sanitizeEmail(project[field.key] as string | undefined)}`;
  if (field.isDiscord) {
    const username = (project[field.key] as string | undefined) ?? "";
    return `https://discord.com/users/${username.replace("@", "")}`;
  }
  return sanitizeUrl(project[field.key] as string | undefined);
}

export function getActiveSocialFields(project: ProjectItem): SocialField[] {
  return SOCIAL_FIELDS.filter((f) => {
    const val = project[f.key];
    if (!val) return false;
    if (f.isEmail) return !!sanitizeEmail(val as string);
    if (f.isDiscord) return true;
    return !!sanitizeUrl(val as string);
  });
}


const COPIED_FEEDBACK_MS = 1500;

// A failed mailto: is silent: the browser fires no event, so the page cannot
// detect a missing mail handler. Copying the address on every click, while
// still letting the mailto: proceed, works whether or not one exists.
// Local to the control that uses it, so a copy re-renders one card rather
// than the whole directory.
export function useCopyText(): [boolean, (text: string) => Promise<boolean>] {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = useCallback(async (text: string) => {
    if (!(await copyToClipboard(text))) return false;
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
    return true;
  }, []);

  return [copied, copy];
}
