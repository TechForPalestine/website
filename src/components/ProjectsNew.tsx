import React, {
  Suspense,
  lazy,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  InputAdornment,
  Link,
  TextField,
  ThemeProvider,
  Typography,
  createTheme,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import {
  TAG_CHIP,
  getProjectText,
  type ProjectItem,
  type Tag,
} from "./projects/directoryShared";
import { FeaturedProjectCard, ProjectGridCard } from "./projects/DirectoryCards";
import { findProjectBySlug, projectPath } from "../utils/projectSlug";

interface ProjectsNewProps {
  projects: ProjectItem[];
  loading?: boolean;
  availableTags?: Tag[];
}

// The details dialog is only needed once someone opens a project, so it is
// split out of this chunk and preloaded while the browser is idle.
const loadDialog = () => import("./projects/ProjectDetailsDialog");
const ProjectDetailsDialog = lazy(loadDialog);

const DIALOG_CLOSE_MS = 200;
const PROJECTS_PATH = "/projects";

// The slug of a /projects/<slug> URL, or "" on the plain directory.
function slugFromLocation(): string {
  const path = window.location.pathname;
  return path.startsWith(`${PROJECTS_PATH}/`) ? path.slice(PROJECTS_PATH.length + 1) : "";
}
const ANNOUNCE_CLEAR_MS = 1500;

// This island ran on MUI's default theme, so every unstyled component
// resolved `primary.main` to Material blue #1976d2 — card borders, input
// focus rings, icon hovers. Blue is a named PRODUCT.md anti-reference, and
// because `primary.main` is an indirection rather than a literal hex, neither
// the detector nor a grep for "blue" could see it. Mapping the palette once
// here is what stops the default leaking back in through the next MUI
// component someone adds. Values from DESIGN.md.
const projectsTheme = createTheme({
  palette: {
    primary: { main: "#157A3E", dark: "#2F5C3F", contrastText: "#FFFFFF" },
    text: { primary: "#2A2428", secondary: "#73656E" },
    divider: "#D6D6D6",
    background: { paper: "#FFFFFF" },
  },
  shape: { borderRadius: 8 },
  typography: { fontFamily: "Outfit, system-ui, sans-serif" },
});

// Pixel strings, not numbers: in MUI's sx a bare `width: 1` means 100%, not
// 1px. This live region is absolutely positioned against <body>, so a
// 100%-tall box starting mid-page overflowed the bottom of the document and
// left blank scroll space under the footer.
const visuallyHidden = {
  position: "absolute",
  width: "1px",
  height: "1px",
  margin: "-1px",
  padding: 0,
  border: 0,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
} as const;

const featuredGridSx = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
  gap: 3,
} as const;

const projectGridSx = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
  gap: 2,
} as const;

interface SearchEntry {
  name: string;
  text: string;
}

export default function ProjectsNew(props: ProjectsNewProps) {
  return (
    <ThemeProvider theme={projectsTheme}>
      <ProjectsDirectory {...props} />
    </ThemeProvider>
  );
}

function ProjectsDirectory({
  projects: initialProjects,
  loading: initialLoading = false,
  availableTags: initialTags = [],
}: ProjectsNewProps) {
  const [projects, setProjects] = useState<ProjectItem[]>(initialProjects);
  const [availableTags, setAvailableTags] = useState<Tag[]>(initialTags);
  const [loading, setLoading] = useState(initialLoading);
  const [loadError, setLoadError] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTags, setActiveTags] = useState<Tag[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const closeTimer = useRef<number | undefined>(undefined);
  const deepLinkHandled = useRef(false);

  // Typing stays responsive: the input follows searchQuery immediately, while
  // the (much heavier) grid follows the deferred value and may lag a frame.
  const deferredQuery = useDeferredValue(searchQuery);

  const showProject = useCallback((project: ProjectItem) => {
    window.clearTimeout(closeTimer.current);
    setSelectedProject(project);
    setDialogOpen(true);
  }, []);

  const hideProject = useCallback(() => {
    setDialogOpen(false);
    closeTimer.current = window.setTimeout(() => setSelectedProject(null), DIALOG_CLOSE_MS);
  }, []);

  // Callbacks handed to memoized cards must keep a stable identity, or every
  // card would re-render whenever the parent does. Opening and closing also
  // move the address bar, so every project has a shareable URL.
  const handleOpen = useCallback(
    (project: ProjectItem) => {
      history.pushState(null, "", projectPath(project));
      showProject(project);
    },
    [showProject]
  );

  const handleClose = useCallback(() => {
    history.pushState(null, "", PROJECTS_PATH);
    hideProject();
  }, [hideProject]);

  const announce = useCallback((message: string) => {
    setAnnouncement(message);
    window.setTimeout(() => setAnnouncement(""), ANNOUNCE_CLEAR_MS);
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const response = await fetch("/api/projects", { cache: "no-cache" });
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects ?? data);
        setAvailableTags(data.tags ?? []);
      } else {
        // A failed load must not fall through to the empty state: "no projects"
        // and "we could not reach ProjectHub" are different things to say.
        console.error(`[ProjectsNew] API returned status ${response.status}:`, response.statusText);
        setLoadError(true);
      }
    } catch (error) {
      console.error("[ProjectsNew] Fetch error:", error);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialProjects.length === 0) {
      fetchProjects();
    }
  }, []);

  // Fetch the dialog chunk once there is something to click, when idle.
  useEffect(() => {
    if (projects.length === 0) return;
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(() => void loadDialog());
      return () => w.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(() => void loadDialog(), 2000);
    return () => window.clearTimeout(id);
  }, [projects.length]);

  // A direct load of /projects/<slug> is this same page; the dialog for that
  // project just needs opening once the real list is in. Never pushes a URL:
  // the address bar is already right.
  useEffect(() => {
    if (projects.length === 0 || deepLinkHandled.current) return;
    deepLinkHandled.current = true;
    const slug = slugFromLocation();
    if (!slug) return;
    const project = findProjectBySlug(projects, slug);
    if (project) showProject(project);
  }, [projects, showProject]);

  // Keeps the dialog in step with browser back and forward. Only ever reads
  // the URL, so it cannot stack extra history entries on top of the ones
  // handleOpen and handleClose already pushed.
  useEffect(() => {
    const onPopState = () => {
      const slug = slugFromLocation();
      const project = slug ? findProjectBySlug(projects, slug) : undefined;
      if (project) showProject(project);
      else hideProject();
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [projects, showProject, hideProject]);

  // Lowercased once per data load rather than twice per project per keystroke.
  const searchIndex = useMemo(() => {
    const index = new Map<number, SearchEntry>();
    for (const p of projects) {
      index.set(p.id, {
        name: p.name.toLowerCase(),
        text: getProjectText(p).toLowerCase(),
      });
    }
    return index;
  }, [projects]);

  const featuredProjects = useMemo(() => projects.filter((p) => p.featured), [projects]);
  const isFiltering = deferredQuery !== "" || activeTags.length > 0;

  const filteredProjects = useMemo(() => {
    const query = deferredQuery.toLowerCase();
    const tagIds = new Set(activeTags.map((t) => t.id));
    return projects.filter((project) => {
      if (!isFiltering && project.featured) return false;

      const entry = searchIndex.get(project.id);
      const matchesSearch =
        query === "" || !!entry?.name.includes(query) || !!entry?.text.includes(query);
      const matchesTags = tagIds.size === 0 || !!project.tags?.some((t) => tagIds.has(t.id));

      return matchesSearch && matchesTags;
    });
  }, [projects, searchIndex, deferredQuery, activeTags, isFiltering]);

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

  if (loadError && projects.length === 0) {
    return (
      <Box sx={{ maxWidth: 1200, margin: "0 auto", px: 2, py: 5 }}>
        <Box sx={{ maxWidth: "65ch", py: 6 }}>
          <Typography component="h2" sx={{ fontWeight: 800, fontSize: "28px", color: "#2A2428" }}>
            We could not load the project directory
          </Typography>
          <Typography sx={{ mt: 2, fontSize: "19px", lineHeight: 1.625, color: "#73656E" }}>
            This is a problem on our end, not a sign that the incubator is empty. There are 90+
            projects in the directory.
          </Typography>
          <Button
            onClick={fetchProjects}
            disableElevation
            sx={{
              mt: 3,
              minHeight: 44,
              px: 2.5,
              py: 1.75,
              borderRadius: "999px",
              bgcolor: "#157A3E",
              color: "#fff",
              fontSize: "13px",
              fontWeight: 700,
              textTransform: "none",
              "&:hover": { bgcolor: "#2F5C3F" },
            }}
          >
            Try again
          </Button>
          <Typography sx={{ mt: 3, fontSize: "16px", lineHeight: 1.6, color: "#73656E" }}>
            Still stuck?{" "}
            <Link href="/incubator" sx={{ color: "#157A3E", fontWeight: 500 }}>
              Read about the incubator
            </Link>{" "}
            or{" "}
            <Link href="/contact" sx={{ color: "#157A3E", fontWeight: 500 }}>
              get in touch
            </Link>
            .
          </Typography>
        </Box>
      </Box>
    );
  }

  if (projects.length === 0) {
    return (
      <Box sx={{ maxWidth: 1200, margin: "0 auto", px: 2, py: 5 }}>
        <Box sx={{ maxWidth: "65ch", py: 6 }}>
          <Typography component="h2" sx={{ fontWeight: 800, fontSize: "28px", color: "#2A2428" }}>
            No projects to show yet
          </Typography>
          <Typography sx={{ mt: 2, fontSize: "19px", lineHeight: 1.625, color: "#73656E" }}>
            The directory is empty right now. Check back soon, or{" "}
            <Link href="/incubator" sx={{ color: "#157A3E", fontWeight: 500 }}>
              read about the incubator
            </Link>
            .
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <>
      {/* Filter bar — held to the content width. */}
      <Box sx={{ maxWidth: 1200, margin: "0 auto", px: 2, pt: 5 }}>
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
                  const { key, ...tagProps } = getTagProps({ index });
                  return (
                    <Chip
                      key={key}
                      {...tagProps}
                      label={option.name}
                      size="small"
                      sx={{ ...TAG_CHIP, fontWeight: 500, border: "none" }}
                    />
                  );
                })
              }
              renderOption={(props, option) => {
                const { key, ...optionProps } = props as {
                  key: React.Key;
                } & React.HTMLAttributes<HTMLLIElement>;
                return (
                  <li key={key} {...optionProps}>
                    <Chip
                      label={option.name}
                      size="small"
                      sx={{ ...TAG_CHIP, fontWeight: 500, border: "none", pointerEvents: "none" }}
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
      </Box>

      {/* Featured sits in a full-bleed First Light band (DESIGN.md). The band
          is what marks these projects as featured; the cards themselves are
          identical to every other card, so the accent is never spent on
          decoration. */}
      {!isFiltering && featuredProjects.length > 0 && (
        <Box
          sx={{
            bgcolor: "#E7F2E9",
            borderTop: "1px solid #D2E4D6",
            borderBottom: "1px solid #D2E4D6",
            py: 5,
            mb: 6,
          }}
        >
          <Box sx={{ maxWidth: 1200, margin: "0 auto", px: 2 }}>
            <Typography
              component="p"
              sx={{
                fontWeight: 700,
                fontSize: "12px",
                lineHeight: 1,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#2F5C3F",
                mb: 2.5,
              }}
            >
              Featured Projects
            </Typography>
            <Box sx={featuredGridSx}>
              {featuredProjects.map((project) => (
                <FeaturedProjectCard key={project.id} project={project} onOpen={handleOpen} />
              ))}
            </Box>
          </Box>
        </Box>
      )}

      <Box sx={{ maxWidth: 1200, margin: "0 auto", px: 2, pb: 5 }}>
        {filteredProjects.length === 0 && (
          <Box sx={{ maxWidth: "65ch", py: 6 }}>
            <Typography sx={{ fontSize: "19px", lineHeight: 1.625, color: "text.secondary" }}>
              No projects match your filters.
            </Typography>
          </Box>
        )}

        <Box sx={projectGridSx}>
          {filteredProjects.map((project) => (
            <ProjectGridCard
              key={project.id}
              project={project}
              isFiltering={isFiltering}
              onOpen={handleOpen}
              onAnnounce={announce}
            />
          ))}
        </Box>

        {selectedProject && (
          <Suspense fallback={null}>
            <ProjectDetailsDialog
              key={selectedProject.id}
              project={selectedProject}
              open={dialogOpen}
              onClose={handleClose}
              onAnnounce={announce}
            />
          </Suspense>
        )}
      </Box>
      <Box component="span" role="status" aria-live="polite" sx={visuallyHidden}>
        {announcement}
      </Box>
    </>
  );
}
