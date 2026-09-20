import { useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EmailIcon from "@mui/icons-material/Email";
import GroupsIcon from "@mui/icons-material/Groups";
import LanguageIcon from "@mui/icons-material/Language";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import { sanitizeEmail, sanitizeUrl } from "./projectData";
import {
  TAG_CHIP,
  formatDate,
  formatMonthYear,
  getActiveSocialFields,
  getInitials,
  getSocialHref,
  resolveLogoSrc,
  useCopyText,
  type ProjectItem,
} from "./directoryShared";

// Loaded on demand: most visitors never open a project, so the dialog and its
// content stay out of the initial chunk. The parent keys this by project id,
// which resets the image-failure state without an explicit reset step.

interface ProjectDetailsDialogProps {
  project: ProjectItem;
  open: boolean;
  onClose: () => void;
  onAnnounce: (message: string) => void;
}

export default function ProjectDetailsDialog({
  project: selectedProject,
  open,
  onClose,
  onAnnounce,
}: ProjectDetailsDialogProps) {
  const [dialogLogoFailed, setDialogLogoFailed] = useState(false);
  const [dialogLeaderPhotoFailed, setDialogLeaderPhotoFailed] = useState(false);
  const [emailCopied, copyText] = useCopyText();

  const handleEmailClick = () => {
    copyText(sanitizeEmail(selectedProject.publicEmail)).then((ok) => {
      if (ok) onAnnounce("Email address copied to clipboard");
    });
  };

  const hasLogo =
    selectedProject.logoUrl &&
    selectedProject.logoUrl !== "/images/default.jpg" &&
    !dialogLogoFailed;
  const logoSrc = hasLogo ? resolveLogoSrc(selectedProject.logoUrl) : "";
  const hasLeaderPhotoInDialog =
    !!selectedProject.leaderPhoto && !dialogLeaderPhotoFailed;
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
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          pr: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, minWidth: 0, flex: 1 }}>
          {showDialogInitials ? (
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                bgcolor: "#E7F2E9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                fontSize: "1.4rem",
                fontWeight: 500,
                color: "#2F5C3F",
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
                bgcolor: "#F2F3EE",
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
              <Typography component="h2" sx={{ fontSize: "1.5rem", fontWeight: 700 }}>
                {selectedProject.name}
              </Typography>
              {selectedProject.featured && (
                <Chip
                  label="Featured project"
                  size="small"
                  color="primary"
                  sx={{ fontWeight: 600 }}
                />
              )}
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {[selectedProject.categoryName, joinedDate ? `Joined ${joinedDate}` : ""]
                .filter(Boolean)
                .join(" · ")}
            </Typography>
          </Box>
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ flexShrink: 0, mt: 0.5 }}
        >
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
              <Tooltip
                open={emailCopied}
                title="Email copied"
                placement="top"
                arrow
                describeChild
              >
                <Button
                  variant="outlined"
                  href={`mailto:${sanitizeEmail(selectedProject.publicEmail)}`}
                  onClick={handleEmailClick}
                  startIcon={<EmailIcon />}
                  sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
                >
                  Contact
                </Button>
              </Tooltip>
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
              // A 4px coloured left border is a banned side-stripe
              // (DESIGN.md). Full hairline on the band tint instead.
              bgcolor: "#E7F2E9",
              border: "1px solid #D2E4D6",
              borderRadius: "16px",
              p: 2.5,
              mb: 3,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                mb: 0.5,
                fontWeight: 600,
                color: "#2F5C3F",
                textTransform: "uppercase",
                fontSize: "0.7rem",
                letterSpacing: 1,
              }}
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
                const { bgcolor, color } = TAG_CHIP;
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

      <DialogActions
        sx={{ px: 4, py: 2, bgcolor: "#F2F3EE", justifyContent: "space-between" }}
      >
        <Typography variant="caption" sx={{ color: "text.disabled" }}>
          Last updated {updatedDate}
        </Typography>
        <Button
          onClick={onClose}
          sx={{ textTransform: "none", fontWeight: 500, color: "text.secondary" }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
