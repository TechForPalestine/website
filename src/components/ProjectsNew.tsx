import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  Link,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  InputAdornment,
  TextField,
  Autocomplete,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import CloseIcon from "@mui/icons-material/Close";
import GitHubIcon from "@mui/icons-material/GitHub";
import TwitterIcon from "@mui/icons-material/Twitter";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import FacebookIcon from "@mui/icons-material/Facebook";
import YouTubeIcon from "@mui/icons-material/YouTube";
import TelegramIcon from "@mui/icons-material/Telegram";
import InstagramIcon from "@mui/icons-material/Instagram";
import EmailIcon from "@mui/icons-material/Email";
import LanguageIcon from "@mui/icons-material/Language";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import GroupsIcon from "@mui/icons-material/Groups";

interface Tag {
  id: number;
  name: string;
  type: string;
}

interface ProjectItem {
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

interface ProjectsNewProps {
  projects: ProjectItem[];
  loading?: boolean;
  availableTags?: Tag[];
}

/** Only allow http: and https: URLs to prevent javascript: / data: XSS vectors. Returns empty string for unsafe/invalid URLs. */
const sanitizeUrl = (url: string | undefined): string => {
  if (!url) return "";
  try {
    const parsed = new URL(url, "https://placeholder.invalid");
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return url;
    }
  } catch {
    // malformed URL
  }
  return "";
};

const sanitizeEmail = (email: string | undefined): string => {
  if (!email) return "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
};

const getInitials = (name: string): string => {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0])?.toUpperCase();
  } else if (words.length === 1) {
    return words[0][0]?.toUpperCase();
  }
  return "P";
};

const getProjectText = (project: ProjectItem): string =>
  project.description || project.elevatorPitch || project.impactStatement || "";

const TAG_COLORS = [
  { bgcolor: "#1565c0", color: "#fff" }, // dark blue
  { bgcolor: "#6a1b9a", color: "#fff" }, // dark purple
  { bgcolor: "#1b5e20", color: "#fff" }, // dark green
  { bgcolor: "#b71c1c", color: "#fff" }, // dark red
  { bgcolor: "#004d40", color: "#fff" }, // dark teal
  { bgcolor: "#880e4f", color: "#fff" }, // dark pink
  { bgcolor: "#1a237e", color: "#fff" }, // indigo
  { bgcolor: "#bf360c", color: "#fff" }, // deep orange
  { bgcolor: "#37474f", color: "#fff" }, // blue-grey
  { bgcolor: "#4e342e", color: "#fff" }, // brown
  { bgcolor: "#33691e", color: "#fff" }, // dark lime
  { bgcolor: "#006064", color: "#fff" }, // dark cyan
];

const getTagColor = (id: number) => TAG_COLORS[id % TAG_COLORS.length];

const resolveLogoSrc = (url: string | undefined): string => {
  if (!url) return "";
  return url.startsWith("/") ? `https://projecthub.techforpalestine.org${url}` : url;
};

const formatDate = (dateString: string): string => {
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

const formatMonthYear = (dateString: string): string => {
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
type SocialField = {
  key: keyof ProjectItem;
  label: string;
  icon: React.ReactNode;
  isEmail?: boolean;
  isDiscord?: boolean;
};

const SOCIAL_FIELDS: SocialField[] = [
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
  { key: "upscrolledUrl", label: "Upscrolled", icon: <Box component="img" src="/upscrolled-icon.svg" alt="" sx={{ width: 20, height: 20 }} /> },
  { key: "discordUsername", label: "Discord", icon: <DiscordSvg />, isDiscord: true },
  { key: "publicEmail", label: "Email", icon: <EmailIcon fontSize="small" />, isEmail: true },
];

function getSocialHref(field: SocialField, project: ProjectItem): string {
  if (field.isEmail) return `mailto:${sanitizeEmail(project[field.key] as string | undefined)}`;
  if (field.isDiscord) {
    const username = (project[field.key] as string | undefined) ?? "";
    return `https://discord.com/users/${username.replace("@", "")}`;
  }
  return sanitizeUrl(project[field.key] as string | undefined);
}

function getActiveSocialFields(project: ProjectItem): SocialField[] {
  return SOCIAL_FIELDS.filter((f) => {
    const val = project[f.key];
    if (!val) return false;
    if (f.isEmail) return !!sanitizeEmail(val as string);
    if (f.isDiscord) return true;
    return !!sanitizeUrl(val as string);
  });
}

export default function ProjectsNew({
  projects: initialProjects,
  loading: initialLoading = false,
  availableTags: initialTags = [],
}: ProjectsNewProps) {
  const [projects, setProjects] = useState<ProjectItem[]>(initialProjects);
  const [availableTags, setAvailableTags] = useState<Tag[]>(initialTags);
  const [loading, setLoading] = useState(initialLoading);
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
  const [dialogLogoFailed, setDialogLogoFailed] = useState(false);
  const [dialogLeaderPhotoFailed, setDialogLeaderPhotoFailed] = useState(false);
  const [activeTags, setActiveTags] = useState<Tag[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const handleCardClick = (project: ProjectItem) => {
    setSelectedProject(project);
    setDialogLogoFailed(false);
    setDialogLeaderPhotoFailed(false);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setTimeout(() => {
      setSelectedProject(null);
      setDialogLogoFailed(false);
      setDialogLeaderPhotoFailed(false);
    }, 200);
  };

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/projects", { cache: "no-cache" });
      if (response.ok) {
        const data = await response.json();
        const projects = data.projects ?? data;
        const tags = data.tags ?? [];
        console.log(`[ProjectsNew] Successfully fetched ${projects.length} projects, ${tags.length} tags`);
        setProjects(projects);
        setAvailableTags(tags);
      } else {
        console.error(`[ProjectsNew] API returned status ${response.status}:`, response.statusText);
      }
    } catch (error) {
      console.error("[ProjectsNew] Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialProjects.length === 0) {
      fetchProjects();
    }
  }, []);

  if (loading && projects.length === 0) {
    return (
      <Box sx={{ maxWidth: 1200, margin: "0 auto", px: 2, py: 5 }}>
        <Box sx={{ textAlign: "center", py: 6 }}>
          <CircularProgress size={40} />
          <Typography variant="body2" sx={{ mt: 2, color: "text.secondary" }}>
            Loading projects...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (projects.length === 0) {
    return (
      <Box sx={{ maxWidth: 1200, margin: "0 auto", px: 2, py: 5 }}>
        <Box sx={{ textAlign: "center", py: 6 }}>
          <Typography variant="h6" sx={{ color: "text.secondary" }}>
            Projects coming soon.
          </Typography>
        </Box>
      </Box>
    );
  }

  const activeTagIds = new Set(activeTags.map((t) => t.id));
  const isFiltering = searchQuery !== "" || activeTags.length > 0;
  const featuredProjects = projects.filter((p) => p.featured);

  const filteredProjects = projects.filter((project) => {
    if (!isFiltering && project.featured) return false;

    const matchesSearch =
      searchQuery === "" ||
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getProjectText(project).toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTags =
      activeTagIds.size === 0 ||
      project.tags?.some((t) => activeTagIds.has(t.id));

    return matchesSearch && matchesTags;
  });

  return (
    <Box sx={{ maxWidth: 1200, margin: "0 auto", px: 2, py: 5 }}>
      {/* Search and tag filters */}
      <Box sx={{ mb: 4, display: "flex", gap: 2, flexDirection: { xs: "column", sm: "row" } }}>
        <TextField
          placeholder="Search projects…"
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
          sx={{ flex: 1 }}
        />
        {availableTags.length > 0 && (
          <Autocomplete
            multiple
            options={availableTags}
            getOptionLabel={(option) => option.name}
            value={activeTags}
            onChange={(_, newValue) => setActiveTags(newValue)}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const { bgcolor, color } = getTagColor(availableTags.findIndex((t) => t.id === option.id));
                const { key, ...tagProps } = getTagProps({ index });
                return (
                  <Chip
                    key={key}
                    {...tagProps}
                    label={option.name}
                    size="small"
                    sx={{ bgcolor, color, fontWeight: 500, border: "none" }}
                  />
                );
              })
            }
            renderOption={(props, option) => {
              const { bgcolor, color } = getTagColor(availableTags.findIndex((t) => t.id === option.id));
              const { key, ...optionProps } = props as { key: React.Key } & React.HTMLAttributes<HTMLLIElement>;
              return (
                <li key={key} {...optionProps}>
                  <Chip
                    label={option.name}
                    size="small"
                    sx={{ bgcolor, color, fontWeight: 500, border: "none", pointerEvents: "none" }}
                  />
                </li>
              );
            }}
            renderInput={(params) => (
              <TextField {...params} placeholder="Filter by tag…" size="small" />
            )}
            sx={{ flex: 1, minWidth: 220 }}
          />
        )}
      </Box>

      {/* Featured hero section — layout unchanged per spec */}
      {!isFiltering && featuredProjects.length > 0 && (
        <Box sx={{ mb: 6 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
            Featured Projects
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
              gap: 3,
              mt: 1,
            }}
          >
            {featuredProjects.map((project) => {
              const hasLogo = project.logoUrl && project.logoUrl !== "/images/default.jpg";
              const logoSrc = hasLogo ? resolveLogoSrc(project.logoUrl) : "";
              const showInitials = !hasLogo || failedImages.has(project.id);

              return (
                <Card
                  key={project.id}
                  onClick={() => handleCardClick(project)}
                  sx={{
                    p: 3,
                    border: "2px solid",
                    borderColor: "primary.main",
                    boxShadow: 3,
                    "&:hover": { boxShadow: 6 },
                    transition: "box-shadow 0.2s",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Box sx={{ display: "flex", gap: 2, mb: 2, alignItems: "center" }}>
                    {showInitials ? (
                      <Box
                        sx={{
                          width: 52,
                          height: 52,
                          borderRadius: "50%",
                          bgcolor: "#E3F9ED",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          fontSize: "1.1rem",
                          fontWeight: 500,
                          color: "#666",
                        }}
                      >
                        {getInitials(project.name)}
                      </Box>
                    ) : (
                      <Box
                        component="img"
                        src={logoSrc}
                        alt={project.name}
                        sx={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                        onError={() => setFailedImages((prev) => new Set(prev).add(project.id))}
                      />
                    )}
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1.125rem", lineHeight: 1.25 }}>
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
                  {sanitizeUrl(project.websiteUrl) && (
                    <Box sx={{ mt: 2 }}>
                      <Link
                        href={sanitizeUrl(project.websiteUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        sx={{ fontSize: "0.875rem" }}
                      >
                        Visit site →
                      </Link>
                    </Box>
                  )}
                </Card>
              );
            })}
          </Box>
        </Box>
      )}

      {filteredProjects.length === 0 && (
        <Box sx={{ textAlign: "center", py: 6 }}>
          <Typography variant="body1" sx={{ color: "text.secondary" }}>
            No projects match your filters.
          </Typography>
        </Box>
      )}

      {/* Project grid */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            lg: "repeat(3, 1fr)",
          },
          gap: 2,
        }}
      >
        {filteredProjects.map((project) => {
          const hasLogo = project.logoUrl && project.logoUrl !== "/images/default.jpg";
          const logoSrc = hasLogo ? resolveLogoSrc(project.logoUrl) : "";
          const hasLeaderPhoto = !!project.leaderPhoto;
          const leaderPhotoSrc = hasLeaderPhoto ? resolveLogoSrc(project.leaderPhoto) : "";
          const shouldShowInitials = (!hasLogo && !hasLeaderPhoto) || failedImages.has(project.id);
          // Project logo takes priority; leader photo only fills in when there's no project logo
          const avatarSrc = hasLogo ? logoSrc : leaderPhotoSrc;

          const activeSocials = getActiveSocialFields(project);
          const visibleSocials = activeSocials.slice(0, 4);
          const overflowCount = activeSocials.length - 4;

          return (
            <Card
              key={project.id}
              onClick={() => handleCardClick(project)}
              sx={{
                p: 3,
                position: "relative",
                border: "1px solid",
                borderColor: "divider",
                boxShadow: 1,
                "&:hover": { boxShadow: 3 },
                transition: "box-shadow 0.2s",
                cursor: "pointer",
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Header strip */}
              <Box sx={{ display: "flex", gap: 2, mb: 1.5, alignItems: "center" }}>
                {shouldShowInitials ? (
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      bgcolor: "#E3F9ED",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      fontSize: "0.9rem",
                      fontWeight: 500,
                      color: "#666",
                    }}
                  >
                    {getInitials(project.name)}
                  </Box>
                ) : (
                  <Box
                    component="img"
                    src={avatarSrc}
                    alt={project.name}
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      objectFit: "cover",
                      bgcolor: "#f5f5f5",
                      flexShrink: 0,
                    }}
                    onError={() => setFailedImages((prev) => new Set(prev).add(project.id))}
                  />
                )}
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontSize: "1rem",
                      fontWeight: 600,
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      lineHeight: 1.25,
                    }}
                  >
                    {project.name}
                  </Typography>
                </Box>
                {project.featured && isFiltering && (
                  <Chip label="Featured" size="small" color="primary" sx={{ flexShrink: 0, fontWeight: 600 }} />
                )}
              </Box>

              {/* Category + tags row */}
              {(project.categoryName || (project.tags && project.tags.length > 0)) && (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1.5 }}>
                  {project.categoryName && (
                    <Chip
                      label={project.categoryName}
                      size="small"
                      sx={{ bgcolor: "#f0f0f0", color: "text.secondary", fontSize: "0.7rem", fontWeight: 500 }}
                    />
                  )}
                  {project.tags?.slice(0, 3).map((tag) => {
                    const { bgcolor, color } = getTagColor(availableTags.findIndex((t) => t.id === tag.id));
                    return (
                      <Chip
                        key={tag.id}
                        label={tag.name}
                        size="small"
                        sx={{ bgcolor, color, fontSize: "0.7rem", fontWeight: 500, border: "none" }}
                      />
                    );
                  })}
                  {project.tags && project.tags.length > 3 && (
                    <Chip
                      label={`+${project.tags.length - 3}`}
                      size="small"
                      sx={{ bgcolor: "#f0f0f0", color: "text.secondary", fontSize: "0.7rem" }}
                    />
                  )}
                </Box>
              )}

              {/* Body text */}
              <Typography
                variant="body2"
                sx={{
                  color: "text.primary",
                  mb: 2,
                  lineHeight: 1.5,
                  fontSize: "0.875rem",
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  flexGrow: 1,
                }}
              >
                {getProjectText(project)}
              </Typography>

              {/* Footer row */}
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: "auto" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
                  {visibleSocials.map((field) => (
                    <IconButton
                      key={field.key}
                      component="a"
                      href={getSocialHref(field, project)}
                      target={field.isEmail ? undefined : "_blank"}
                      rel={field.isEmail ? undefined : "noopener noreferrer"}
                      onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      size="small"
                      aria-label={`${project.name} on ${field.label}`}
                      sx={{ color: "text.secondary", p: 0.5, "&:hover": { color: "primary.main" } }}
                    >
                      {field.icon}
                    </IconButton>
                  ))}
                  {overflowCount > 0 && (
                    <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.7rem", ml: 0.25 }}>
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
        })}
      </Box>

      {/* Project Details Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        {selectedProject && (() => {
          const hasLogo =
            selectedProject.logoUrl &&
            selectedProject.logoUrl !== "/images/default.jpg" &&
            !dialogLogoFailed;
          const logoSrc = hasLogo ? resolveLogoSrc(selectedProject.logoUrl) : "";
          const hasLeaderPhotoInDialog = !!selectedProject.leaderPhoto && !dialogLeaderPhotoFailed;
          const leaderPhotoSrcDialog = hasLeaderPhotoInDialog
            ? resolveLogoSrc(selectedProject.leaderPhoto)
            : "";
          const showDialogInitials = !hasLogo && !hasLeaderPhotoInDialog;
          // Project logo takes priority; leader photo only fills in when there's no project logo
          const dialogAvatarSrc = hasLogo ? logoSrc : leaderPhotoSrcDialog;

          const ctaCount = [
            sanitizeUrl(selectedProject.websiteUrl),
            sanitizeUrl(selectedProject.donationUrl),
            sanitizeUrl(selectedProject.involvementUrl),
            sanitizeEmail(selectedProject.publicEmail),
          ].filter(Boolean).length;

          const activeSocials = getActiveSocialFields(selectedProject);
          const joinedDate = formatMonthYear(selectedProject.createdAt);
          const updatedDate = formatDate(selectedProject.updatedAt);

          return (
            <>
              <DialogTitle
                sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", pr: 1 }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, minWidth: 0, flex: 1 }}>
                  {showDialogInitials ? (
                    <Box
                      sx={{
                        width: 64,
                        height: 64,
                        borderRadius: "50%",
                        bgcolor: "#E3F9ED",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        fontSize: "1.4rem",
                        fontWeight: 500,
                        color: "#666",
                      }}
                    >
                      {getInitials(selectedProject.name)}
                    </Box>
                  ) : (
                    <Box
                      component="img"
                      src={dialogAvatarSrc}
                      alt={selectedProject.name}
                      sx={{
                        width: 64,
                        height: 64,
                        borderRadius: "50%",
                        objectFit: "cover",
                        bgcolor: "#f5f5f5",
                        flexShrink: 0,
                      }}
                      onError={() => {
                        if (hasLeaderPhotoInDialog) {
                          setDialogLeaderPhotoFailed(true);
                        } else {
                          setDialogLogoFailed(true);
                        }
                      }}
                    />
                  )}
                  <Box sx={{ minWidth: 0 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                      <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        {selectedProject.name}
                      </Typography>
                      {selectedProject.featured && (
                        <Chip label="Featured project" size="small" color="primary" sx={{ fontWeight: 600 }} />
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                      {[selectedProject.categoryName, joinedDate ? `Joined ${joinedDate}` : ""].filter(Boolean).join(" · ")}
                    </Typography>
                  </Box>
                </Box>
                <IconButton onClick={handleCloseDialog} size="small" sx={{ flexShrink: 0, mt: 0.5 }}>
                  <CloseIcon />
                </IconButton>
              </DialogTitle>

              <DialogContent dividers sx={{ p: 4 }}>
                {/* Primary CTA row */}
                {ctaCount > 0 && (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 4 }}>
                    {sanitizeUrl(selectedProject.websiteUrl) && (
                      <Button
                        variant="contained"
                        href={sanitizeUrl(selectedProject.websiteUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        startIcon={<LanguageIcon />}
                        sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
                      >
                        Visit website
                      </Button>
                    )}
                    {sanitizeUrl(selectedProject.donationUrl) && (
                      <Button
                        variant="contained"
                        href={sanitizeUrl(selectedProject.donationUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        startIcon={<VolunteerActivismIcon />}
                        sx={{
                          textTransform: "none",
                          fontWeight: 600,
                          borderRadius: 2,
                          bgcolor: "#E65100",
                          "&:hover": { bgcolor: "#BF360C" },
                        }}
                      >
                        Donate
                      </Button>
                    )}
                    {sanitizeUrl(selectedProject.involvementUrl) && (
                      <Button
                        variant="outlined"
                        href={sanitizeUrl(selectedProject.involvementUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        startIcon={<GroupsIcon />}
                        sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
                      >
                        Get involved
                      </Button>
                    )}
                    {sanitizeEmail(selectedProject.publicEmail) && (
                      <Button
                        variant="outlined"
                        href={`mailto:${sanitizeEmail(selectedProject.publicEmail)}`}
                        startIcon={<EmailIcon />}
                        sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
                      >
                        Contact
                      </Button>
                    )}
                  </Box>
                )}

                {/* About the project */}
                <Typography
                  variant="body1"
                  sx={{ lineHeight: 1.8, mb: 3, fontSize: "1rem", color: "text.primary" }}
                >
                  {selectedProject.description}
                </Typography>

                {/* Our Impact callout */}
                {selectedProject.impactStatement && (
                  <Box
                    sx={{
                      bgcolor: "#f0fdf4",
                      borderLeft: "4px solid #168039",
                      borderRadius: 1,
                      p: 2,
                      mb: 3,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ mb: 0.5, fontWeight: 600, color: "#168039", textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: 1 }}
                    >
                      Our Impact
                    </Typography>
                    <Typography variant="body1" sx={{ lineHeight: 1.7, color: "text.primary" }}>
                      {selectedProject.impactStatement}
                    </Typography>
                  </Box>
                )}

                {/* About the leader */}
                {selectedProject.leaderBio && (
                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        mb: 1.5,
                        fontWeight: 600,
                        color: "text.secondary",
                        textTransform: "uppercase",
                        fontSize: "0.75rem",
                        letterSpacing: 1,
                      }}
                    >
                      About the leader
                    </Typography>
                    <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
                      {selectedProject.leaderPhoto && !dialogLeaderPhotoFailed && (
                        <Box
                          component="img"
                          src={resolveLogoSrc(selectedProject.leaderPhoto)}
                          alt={selectedProject.leadName ?? "Leader"}
                          sx={{
                            width: 80,
                            height: 80,
                            borderRadius: "50%",
                            objectFit: "cover",
                            flexShrink: 0,
                          }}
                          onError={() => setDialogLeaderPhotoFailed(true)}
                        />
                      )}
                      <Typography variant="body2" sx={{ lineHeight: 1.7, color: "text.primary" }}>
                        {selectedProject.leaderBio}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* Connect */}
                {activeSocials.length > 0 && (
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{
                        mb: 1.5,
                        fontWeight: 600,
                        color: "text.secondary",
                        textTransform: "uppercase",
                        fontSize: "0.75rem",
                        letterSpacing: 1,
                      }}
                    >
                      Connect
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                      {activeSocials.map((field) => (
                        <Button
                          key={field.key}
                          variant="outlined"
                          component="a"
                          href={getSocialHref(field, selectedProject)}
                          target={field.isEmail ? undefined : "_blank"}
                          rel={field.isEmail ? undefined : "noopener noreferrer"}
                          startIcon={field.icon}
                          aria-label={`${selectedProject.name} on ${field.label}`}
                          sx={{
                            borderRadius: 2,
                            textTransform: "none",
                            fontWeight: 500,
                            px: 2,
                          }}
                        >
                          {field.label}
                        </Button>
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Tags */}
                {selectedProject.tags && selectedProject.tags.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        mb: 1,
                        fontWeight: 600,
                        color: "text.secondary",
                        textTransform: "uppercase",
                        fontSize: "0.75rem",
                        letterSpacing: 1,
                      }}
                    >
                      Tags
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                      {selectedProject.tags.map((tag) => {
                        const { bgcolor, color } = getTagColor(availableTags.findIndex((t) => t.id === tag.id));
                        return (
                          <Chip
                            key={tag.id}
                            label={tag.name}
                            size="small"
                            sx={{ bgcolor, color, fontWeight: 500, border: "none" }}
                          />
                        );
                      })}
                    </Box>
                  </Box>
                )}
              </DialogContent>

              <DialogActions sx={{ px: 4, py: 2, bgcolor: "#fafafa", justifyContent: "space-between" }}>
                <Typography variant="caption" sx={{ color: "text.disabled" }}>
                  Last updated {updatedDate}
                </Typography>
                <Button
                  onClick={handleCloseDialog}
                  sx={{ textTransform: "none", fontWeight: 500, color: "text.secondary" }}
                >
                  Close
                </Button>
              </DialogActions>
            </>
          );
        })()}
      </Dialog>
    </Box>
  );
}
