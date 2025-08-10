import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Card,
    Chip,
    Button,
    Link,
    CircularProgress,
} from "@mui/material";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { Icon } from "@iconify/react";

interface ProjectItem {
    id: string;
    title: string;
    description: string;
    url?: string;
    channel?: string;
    status?: string;
    category?: string;
    image?: string;
    lastUpdated?: string;
}

interface ProjectsNewProps {
    projects: ProjectItem[];
    loading?: boolean;
}

export default function ProjectsNew({ projects: initialProjects, loading: initialLoading = false }: ProjectsNewProps) {
    const [projects, setProjects] = useState<ProjectItem[]>(initialProjects);
    const [loading, setLoading] = useState(initialLoading);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    // Function to fetch fresh projects from the new app
    const fetchFreshProjects = async () => {
        setLoading(true);
        try {
            console.log('Fetching fresh projects from new app API...');
            const response = await fetch('/api/projects-new', {
                cache: 'no-cache',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            
            if (response.ok) {
                const newProjects = await response.json();
                console.log(`Refreshed: Loaded ${newProjects.length} projects from new app`);
                console.log('API Response Headers:', {
                    projectCount: response.headers.get('X-Project-Count'),
                    fetchTime: response.headers.get('X-Fetch-Time'),
                    contentType: response.headers.get('Content-Type')
                });
                setProjects(newProjects);
                setLastUpdated(new Date());
            }
        } catch (error) {
            console.error('Failed to fetch fresh projects:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch projects if we don't have initial data
    useEffect(() => {
        console.log('ProjectsNew component mounted:', { 
            initialProjectsLength: initialProjects.length, 
            initialLoading, 
            currentLoadingState: loading 
        });
        
        if (initialProjects.length === 0) {
            console.log('No initial projects, fetching from API...');
            fetchFreshProjects();
        } else {
            console.log(`Using ${initialProjects.length} initial projects from SSR, setting loading to false`);
            setLoading(false);
        }
    }, []);

    // Debug logging
    useEffect(() => {
        console.log('Loading state changed:', loading);
    }, [loading]);

    useEffect(() => {
        console.log('Projects state changed:', { count: projects.length, firstProjectTitle: projects[0]?.title });
    }, [projects]);

    return (
        <div className="mx-auto max-w-6xl px-4 py-10">
            {/* Status indicator */}
            <Box className="flex justify-between items-center mb-4">
                <Typography variant="caption" className="text-gray-500">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                </Typography>
                <Box className="flex items-center gap-4">
                    <Button
                        size="small" 
                        variant="outlined"
                        onClick={fetchFreshProjects}
                        disabled={loading}
                        className="text-xs"
                    >
                        Refresh
                    </Button>
                    {loading && (
                        <Box className="flex items-center gap-2">
                            <CircularProgress size={16} />
                            <Typography variant="caption" className="text-gray-500">
                                Loading...
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Box>

            {loading && projects.length === 0 && (
                <Box className="text-center py-6">
                    <CircularProgress size={32} color="success" />
                    <Typography variant="body2" className="mt-4 text-gray-600">
                        Loading projects from new app...
                    </Typography>
                </Box>
            )}

            {/* Projects Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => {
                    return (
                        <Card
                            key={project.id}
                            className="group flex flex-col gap-4 rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 bg-white cursor-pointer"
                        >
                            {/* Project Image */}
                            <Box className="relative w-full">
                                <img
                                    src={project.image || "/images/default.jpg"}
                                    alt={project.title}
                                    className="rounded-xl w-full aspect-[16/9] object-cover bg-gray-100"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        if (target.src !== "/images/default.jpg") {
                                            target.src = "/images/default.jpg";
                                        }
                                    }}
                                />
                            </Box>

                            {/* Content */}
                            <Box className="flex-1 space-y-3">
                                <Box className="flex items-center gap-2 flex-wrap">
                                    <Typography
                                        variant="h6"
                                        className="font-bold tracking-tight text-gray-900"
                                    >
                                        {project.title}
                                    </Typography>
                                    {project.status && (
                                        <Chip
                                            size="small"
                                            label={project.status}
                                            sx={{
                                                backgroundColor: project.status === "Active" ? "#168039" : "#EA4335",
                                                color: "#fff",
                                                fontWeight: 500,
                                            }}
                                        />
                                    )}
                                </Box>

                                {/* Meta info */}
                                <Box className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                    {project.category && (
                                        <span className="flex items-center gap-1">
                                            <LocationOnIcon fontSize="small" />
                                            {project.category}
                                        </span>
                                    )}
                                    {project.lastUpdated && (
                                        <span className="flex items-center gap-1">
                                            <CalendarTodayIcon fontSize="small" />
                                            {new Date(project.lastUpdated).toLocaleDateString()}
                                        </span>
                                    )}
                                </Box>

                                {/* Description */}
                                <Typography
                                    variant="body2"
                                    className="text-sm text-gray-600 leading-relaxed line-clamp-3"
                                >
                                    {project.description}
                                </Typography>

                                {/* Footer Links */}
                                <Box className="flex items-center gap-3 mt-auto pt-2">
                                    {project.url && (
                                        <Link
                                            href={project.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="group p-2 rounded-full bg-gray-100 hover:bg-black transition-colors"
                                            title="Visit Website"
                                        >
                                            <OpenInNewIcon className="h-5 w-5 text-gray-800 group-hover:text-white" />
                                        </Link>
                                    )}
                                    {project.channel && (
                                        <Link
                                            href={project.channel}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="group p-2 rounded-full bg-gray-100 hover:bg-indigo-600 transition-colors"
                                            title="Join Discord"
                                        >
                                            <Icon icon="ic:baseline-discord" className="h-5 w-5 text-gray-800 group-hover:text-white" />
                                        </Link>
                                    )}
                                </Box>

                                {/* Bottom stripe */}
                                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-16 h-1.5 flex rounded-full overflow-hidden shadow-sm">
                                    <div className="w-1/2 bg-[#D32F2F]"></div>
                                    <div className="w-1/2 bg-[#388E3C]"></div>
                                </div>
                            </Box>
                        </Card>
                    );
                })}
            </div>

            {/* Empty state */}
            {!loading && projects.length === 0 && (
                <Box className="text-center py-12">
                    <Typography variant="h6" className="text-gray-500 mb-2">
                        No projects found
                    </Typography>
                    <Typography variant="body2" className="text-gray-400">
                        Try refreshing or check your API configuration
                    </Typography>
                </Box>
            )}
        </div>
    );
}