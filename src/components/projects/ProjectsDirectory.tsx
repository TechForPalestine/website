import React, { useEffect, useRef, useState } from "react";
import type { ProjectItem, Tag } from "./projectData";
import { getProjectText } from "./projectData";
import SearchBar from "./SearchBar";
import TagFilter from "./TagFilter";
import ProjectCard from "./ProjectCard";
import ProjectDrawer from "./ProjectDrawer";

interface ProjectsDirectoryProps {
  initialProjects?: ProjectItem[];
  initialTags?: Tag[];
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-56 animate-pulse rounded-[20px] border border-butter bg-sand"
        />
      ))}
    </div>
  );
}

export default function ProjectsDirectory({
  initialProjects = [],
  initialTags = [],
}: ProjectsDirectoryProps) {
  const [projects, setProjects] = useState<ProjectItem[]>(initialProjects);
  const [availableTags, setAvailableTags] = useState<Tag[]>(initialTags);
  const [loading, setLoading] = useState(initialProjects.length === 0);
  const [searchRaw, setSearchRaw] = useState("");
  const [activeTags, setActiveTags] = useState<Tag[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);

  const search = useDebounce(searchRaw, 250);

  useEffect(() => {
    if (initialProjects.length > 0) return;

    const fetchProjects = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/projects", { cache: "no-cache" });
        if (res.ok) {
          const data = await res.json();
          const fetched: ProjectItem[] = data.projects ?? data;
          const tags: Tag[] = data.tags ?? [];
          setProjects(fetched);
          setAvailableTags(tags);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const isFiltering = search.trim().length > 0 || activeTags.length > 0;

  const filtered = projects.filter((p) => {
    const matchesSearch =
      !search.trim() ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      getProjectText(p).toLowerCase().includes(search.toLowerCase());

    const matchesTags =
      activeTags.length === 0 ||
      activeTags.some((at) => (p.tags ?? []).some((t) => t.id === at.id));

    return matchesSearch && matchesTags;
  });

  const featuredProjects = projects.filter((p) => p.featured);
  const mainProjects = isFiltering ? filtered : filtered.filter((p) => !p.featured);

  const handleTagToggle = (tag: Tag) => {
    setActiveTags((prev) =>
      prev.some((t) => t.id === tag.id)
        ? prev.filter((t) => t.id !== tag.id)
        : [...prev, tag]
    );
  };

  const handleCardClick = (project: ProjectItem, buttonEl: HTMLButtonElement) => {
    triggerRef.current = buttonEl;
    setSelectedProject(project);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => setSelectedProject(null), 300);
  };

  return (
    <>
      <div className="px-6 pt-10 pb-14 min-[810px]:px-10 min-[810px]:pt-12 min-[810px]:pb-20">
        <div className="mx-auto max-w-[1400px]">
          {/* Toolbar */}
          <div className="mb-8 flex flex-col gap-5">
            <SearchBar value={searchRaw} onChange={setSearchRaw} className="max-w-xl" />
            {availableTags.length > 0 && (
              <TagFilter
                tags={availableTags}
                activeTags={activeTags}
                onToggle={handleTagToggle}
                onClear={() => setActiveTags([])}
              />
            )}
            {!loading && (
              <p className="ts-body-small text-ink-secondary">
                {isFiltering
                  ? `Showing ${filtered.length} of ${projects.length} projects`
                  : `${projects.length} projects`}
              </p>
            )}
          </div>

          {loading ? (
            <LoadingGrid />
          ) : (
            <>
              {/* Featured band — only when not actively filtering */}
              {!isFiltering && featuredProjects.length > 0 && (
                <section aria-label="Featured projects" className="mb-10">
                  <p className="ts-overline mb-4 text-ink-secondary">Featured</p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {featuredProjects.map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        featured
                        onClick={handleCardClick}
                      />
                    ))}
                  </div>
                  {mainProjects.length > 0 && (
                    <div className="mb-6 mt-10 h-px w-full bg-ink-divider" />
                  )}
                </section>
              )}

              {/* Main grid */}
              {mainProjects.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {mainProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onClick={handleCardClick}
                    />
                  ))}
                </div>
              ) : isFiltering ? (
                <div className="py-16 text-center">
                  <p className="ts-body-large text-ink-secondary">
                    No projects match your filters.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchRaw("");
                      setActiveTags([]);
                    }}
                    className="ts-label mt-4 text-brand hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  >
                    Clear filters
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>

      <ProjectDrawer
        project={selectedProject}
        open={drawerOpen}
        onClose={handleCloseDrawer}
        triggerRef={triggerRef}
      />
    </>
  );
}
