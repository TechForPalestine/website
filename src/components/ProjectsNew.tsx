import React, { useState, useEffect } from "react";
import { Box, Typography, Card, Chip, Link, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import CloseIcon from "@mui/icons-material/Close";
import GitHubIcon from "@mui/icons-material/GitHub";
import TwitterIcon from "@mui/icons-material/Twitter";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import FacebookIcon from "@mui/icons-material/Facebook";
import YouTubeIcon from "@mui/icons-material/YouTube";
import TelegramIcon from "@mui/icons-material/Telegram";
import InstagramIcon from "@mui/icons-material/Instagram";

interface ProjectItem {
    id: number;
    name: string;
    description: string;
    elevatorPitch?: string;
    websiteUrl?: string;
    logoUrl?: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    leadName?: string;
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
}

interface ProjectsNewProps {
    projects: ProjectItem[];
    loading?: boolean;
}

export default function ProjectsNew({ projects: initialProjects, loading: initialLoading = false }: ProjectsNewProps) {
    const [projects, setProjects] = useState<ProjectItem[]>(initialProjects);
    const [loading, setLoading] = useState(initialLoading);
    const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    const handleCardClick = (project: ProjectItem) => {
        setSelectedProject(project);
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setTimeout(() => setSelectedProject(null), 200);
    };

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/projects', { cache: 'no-cache' });
            if (response.ok) {
                const data = await response.json();
                setProjects(data);
            }
        } catch (error) {
            // Silently handle error
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (initialProjects.length === 0) {
            fetchProjects();
        }
    }, []);

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
        } catch {
            return dateString;
        }
    };

    if (loading && projects.length === 0) {
        return (
            <Box sx={{ maxWidth: 1200, margin: '0 auto', px: 2, py: 5 }}>
                <Box sx={{ textAlign: 'center', py: 6 }}>
                    <CircularProgress size={40} />
                    <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                        Loading projects...
                    </Typography>
                </Box>
            </Box>
        );
    }

    if (projects.length === 0) {
        return (
            <Box sx={{ maxWidth: 1200, margin: '0 auto', px: 2, py: 5 }}>
                <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                        No projects found
                    </Typography>
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 1200, margin: '0 auto', px: 2, py: 5 }}>
            <Box sx={{
                display: 'grid',
                gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    lg: 'repeat(3, 1fr)'
                },
                gap: 2
            }}>
                {projects.map((project) => {
                    const logoSrc = project.logoUrl?.startsWith("/")
                        ? `https://projecthub.techforpalestine.org${project.logoUrl}`
                        : project.logoUrl || "/images/default.jpg";

                    return (
                        <Card
                            key={project.id}
                            onClick={() => handleCardClick(project)}
                            sx={{
                                p: 3,
                                position: 'relative',
                                border: '1px solid',
                                borderColor: 'divider',
                                boxShadow: 1,
                                '&:hover': { boxShadow: 3 },
                                transition: 'box-shadow 0.2s',
                                cursor: 'pointer',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                        >

                            {/* Logo and header */}
                            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                <Box
                                    component="img"
                                    src={logoSrc}
                                    alt={project.name}
                                    sx={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: '50%',
                                        objectFit: 'cover',
                                        bgcolor: '#f5f5f5',
                                        flexShrink: 0
                                    }}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = "/images/default.jpg";
                                    }}
                                />
                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            fontSize: '1rem',
                                            fontWeight: 600,
                                            mb: 0.5,
                                            overflow: 'hidden',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            minHeight: '2.5em',
                                            lineHeight: 1.25
                                        }}
                                    >
                                        {project.name}
                                    </Typography>
                                    {project.leadName && (
                                        <Typography variant="body2" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                                            Led by {project.leadName}
                                        </Typography>
                                    )}
                                </Box>
                            </Box>

                            {/* Description */}
                            <Typography
                                variant="body2"
                                sx={{
                                    color: 'text.primary',
                                    mb: 2,
                                    lineHeight: 1.5,
                                    fontSize: '0.875rem',
                                    overflow: 'hidden',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: 'vertical',
                                    minHeight: '4em'
                                }}
                            >
                                {project.elevatorPitch || project.description}
                            </Typography>

                            {/* Footer */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                                        📅 {formatDate(project.createdAt)}
                                    </Typography>
                                    {project.websiteUrl && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                                                🔗
                                            </Typography>
                                            <Link
                                                href={project.websiteUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                sx={{
                                                    fontSize: '0.75rem',
                                                    color: 'primary.main',
                                                    textDecoration: 'none',
                                                    '&:hover': { textDecoration: 'underline' }
                                                }}
                                            >
                                                Visit Site
                                            </Link>
                                        </div>
                                    )}
                                </Box>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: 'text.secondary',
                                        fontSize: '0.75rem',
                                        cursor: 'pointer',
                                        '&:hover': { color: 'primary.main' }
                                    }}
                                >
                                    Click to view details
                                </Typography>
                            </Box>
                        </Card>
                    );
                })}
            </Box>

            {/* Project Details Dialog */}
            <Dialog
                open={dialogOpen}
                onClose={handleCloseDialog}
                maxWidth="md"
                fullWidth
            >
                {selectedProject && (
                    <>
                        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box
                                    component="img"
                                    src={selectedProject.logoUrl?.startsWith("/")
                                        ? `https://projecthub.techforpalestine.org${selectedProject.logoUrl}`
                                        : selectedProject.logoUrl || "/images/default.jpg"}
                                    alt={selectedProject.name}
                                    sx={{
                                        width: 56,
                                        height: 56,
                                        borderRadius: '50%',
                                        objectFit: 'cover',
                                        bgcolor: '#f5f5f5'
                                    }}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = "/images/default.jpg";
                                    }}
                                />
                                <Box>
                                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                                        {selectedProject.name}
                                    </Typography>
                                    {selectedProject.leadName && (
                                        <Typography variant="body2" color="text.secondary">
                                            Led by {selectedProject.leadName}
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                            <IconButton onClick={handleCloseDialog} size="small">
                                <CloseIcon />
                            </IconButton>
                        </DialogTitle>
                        <DialogContent dividers sx={{ p: 4 }}>
                            {/* Description */}
                            <Typography variant="body1" sx={{ lineHeight: 1.8, mb: 4, fontSize: '1rem', color: 'text.primary' }}>
                                {selectedProject.elevatorPitch || selectedProject.description}
                            </Typography>

                            {/* Info Chips */}
                            {(selectedProject.categoryName || selectedProject.mentor) && (
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                                        About
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        {selectedProject.categoryName && (
                                            <Chip
                                                label={selectedProject.categoryName}
                                                sx={{
                                                    bgcolor: '#f3e5f5',
                                                    color: '#7b1fa2',
                                                    fontWeight: 500
                                                }}
                                            />
                                        )}
                                        {selectedProject.mentor && (
                                            <Chip
                                                label={`Mentor: ${selectedProject.mentor}`}
                                                variant="outlined"
                                                sx={{ fontWeight: 500 }}
                                            />
                                        )}
                                    </Box>
                                </Box>
                            )}

                            {/* Social Media Links */}
                            {(selectedProject.discordUsername || selectedProject.githubUrl || selectedProject.twitterUrl || selectedProject.linkedinUrl ||
                              selectedProject.instagramUrl || selectedProject.facebookUrl || selectedProject.youtubeUrl ||
                              selectedProject.telegramUrl || selectedProject.mastodonUrl || selectedProject.blueskyUrl ||
                              selectedProject.tiktokUrl || selectedProject.signalUrl || selectedProject.upscrolledUrl) && (
                                <Box>
                                    <Typography variant="body2" sx={{ mb: 1.5, fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                                        Connect
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                                        {selectedProject.discordUsername && (
                                            <Button
                                                variant="outlined"
                                                href={`https://discord.com/users/${selectedProject.discordUsername.replace('@', '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                startIcon={
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                                                    </svg>
                                                }
                                                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 500, px: 2 }}
                                            >
                                                Discord
                                            </Button>
                                        )}
                                        {selectedProject.githubUrl && (
                                            <Button variant="outlined" href={selectedProject.githubUrl} target="_blank" rel="noopener noreferrer" startIcon={<GitHubIcon />} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 500, px: 2 }}>
                                                GitHub
                                            </Button>
                                        )}
                                        {selectedProject.twitterUrl && (
                                            <Button variant="outlined" href={selectedProject.twitterUrl} target="_blank" rel="noopener noreferrer" startIcon={<TwitterIcon />} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 500, px: 2 }}>
                                                Twitter
                                            </Button>
                                        )}
                                        {selectedProject.linkedinUrl && (
                                            <Button variant="outlined" href={selectedProject.linkedinUrl} target="_blank" rel="noopener noreferrer" startIcon={<LinkedInIcon />} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 500, px: 2 }}>
                                                LinkedIn
                                            </Button>
                                        )}
                                        {selectedProject.instagramUrl && (
                                            <Button variant="outlined" href={selectedProject.instagramUrl} target="_blank" rel="noopener noreferrer" startIcon={<InstagramIcon />} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 500, px: 2 }}>
                                                Instagram
                                            </Button>
                                        )}
                                        {selectedProject.facebookUrl && (
                                            <Button variant="outlined" href={selectedProject.facebookUrl} target="_blank" rel="noopener noreferrer" startIcon={<FacebookIcon />} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 500, px: 2 }}>
                                                Facebook
                                            </Button>
                                        )}
                                        {selectedProject.youtubeUrl && (
                                            <Button variant="outlined" href={selectedProject.youtubeUrl} target="_blank" rel="noopener noreferrer" startIcon={<YouTubeIcon />} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 500, px: 2 }}>
                                                YouTube
                                            </Button>
                                        )}
                                        {selectedProject.telegramUrl && (
                                            <Button variant="outlined" href={selectedProject.telegramUrl} target="_blank" rel="noopener noreferrer" startIcon={<TelegramIcon />} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 500, px: 2 }}>
                                                Telegram
                                            </Button>
                                        )}
                                        {selectedProject.mastodonUrl && (
                                            <Button variant="outlined" href={selectedProject.mastodonUrl} target="_blank" rel="noopener noreferrer" startIcon={<span style={{ fontSize: '18px' }}>🐘</span>} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 500, px: 2 }}>
                                                Mastodon
                                            </Button>
                                        )}
                                        {selectedProject.blueskyUrl && (
                                            <Button variant="outlined" href={selectedProject.blueskyUrl} target="_blank" rel="noopener noreferrer" startIcon={<span style={{ fontSize: '18px' }}>🦋</span>} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 500, px: 2 }}>
                                                Bluesky
                                            </Button>
                                        )}
                                        {selectedProject.tiktokUrl && (
                                            <Button variant="outlined" href={selectedProject.tiktokUrl} target="_blank" rel="noopener noreferrer" startIcon={<span style={{ fontSize: '18px' }}>🎵</span>} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 500, px: 2 }}>
                                                TikTok
                                            </Button>
                                        )}
                                        {selectedProject.signalUrl && (
                                            <Button variant="outlined" href={selectedProject.signalUrl} target="_blank" rel="noopener noreferrer" startIcon={<span style={{ fontSize: '18px' }}>💬</span>} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 500, px: 2 }}>
                                                Signal
                                            </Button>
                                        )}
                                        {selectedProject.upscrolledUrl && (
                                            <Button
                                                variant="outlined"
                                                href={selectedProject.upscrolledUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                startIcon={
                                                    <Box component="img" src="/upscrolled-icon.svg" alt="Upscrolled" sx={{ width: 20, height: 20 }} />
                                                }
                                                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 500, px: 2 }}
                                            >
                                                Upscrolled
                                            </Button>
                                        )}
                                    </Box>
                                </Box>
                            )}
                        </DialogContent>
                        <DialogActions sx={{ px: 4, py: 3, bgcolor: '#fafafa' }}>
                            <Button onClick={handleCloseDialog} sx={{ textTransform: 'none', fontWeight: 500, color: 'text.secondary' }}>
                                Close
                            </Button>
                            {selectedProject.websiteUrl && (
                                <Button
                                    variant="contained"
                                    href={selectedProject.websiteUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    endIcon={<OpenInNewIcon />}
                                    sx={{
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        px: 3,
                                        py: 1,
                                        borderRadius: 2,
                                        bgcolor: '#1976d2',
                                        '&:hover': { bgcolor: '#1565c0' }
                                    }}
                                >
                                    Visit Website
                                </Button>
                            )}
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </Box>
    );
}
