import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Card,
    Button,
    Link,
    CircularProgress,
} from "@mui/material";

interface ProjectItem {
    id: number;
    name: string;
    description: string;
    elevatorPitch?: string;
    websiteUrl?: string;
    logoUrl?: string;
    discordUsername?: string;
    twitterUrl?: string;
    linkedinUrl?: string;
    githubUrl?: string;
    instagramUrl?: string;
    youtubeUrl?: string;
    telegramUrl?: string;
    status: string;
    createdAt: string;
    updatedAt: string;
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
        console.log('Projects state changed:', { count: projects.length, firstProjectName: projects[0]?.name });
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
                                    src={project.logoUrl || "/images/default.jpg"}
                                    alt={project.name}
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
                                <Typography
                                    variant="h6"
                                    className="font-bold tracking-tight text-gray-900 mb-3"
                                >
                                    {project.name}
                                </Typography>

                                {/* Description */}
                                <Typography
                                    variant="body2"
                                    className="text-sm text-gray-600 leading-relaxed line-clamp-3"
                                >
                                    {project.elevatorPitch || project.description}
                                </Typography>

                                {/* Footer Links */}
                                <Box className="flex items-center gap-3 mt-auto pt-2">
                                    {project.websiteUrl && (
                                        <Link
                                            href={project.websiteUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="group p-2 rounded-full bg-gray-100 hover:bg-black transition-colors"
                                            title="Visit Website"
                                        >
                                            <OpenInNewIcon className="h-5 w-5 text-gray-800 group-hover:text-white" />
                                        </Link>
                                    )}
                                    {project.githubUrl && (
                                        <Link
                                            href={project.githubUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="group p-2 rounded-full bg-gray-100 hover:bg-gray-800 transition-colors"
                                            title="View GitHub"
                                        >
                                            <svg className="h-5 w-5 text-gray-800 group-hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                            </svg>
                                        </Link>
                                    )}
                                    {project.twitterUrl && (
                                        <Link
                                            href={project.twitterUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="group p-2 rounded-full bg-gray-100 hover:bg-blue-500 transition-colors"
                                            title="Follow on Twitter"
                                        >
                                            <svg className="h-5 w-5 text-gray-800 group-hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                                            </svg>
                                        </Link>
                                    )}
                                    {project.linkedinUrl && (
                                        <Link
                                            href={project.linkedinUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="group p-2 rounded-full bg-gray-100 hover:bg-blue-700 transition-colors"
                                            title="View LinkedIn"
                                        >
                                            <svg className="h-5 w-5 text-gray-800 group-hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                            </svg>
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