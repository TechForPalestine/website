import { useEffect, useState } from "react";

interface Props {
  projectName: string;
}

export default function ProjectLogo({ projectName }: Props) {
  const [imgError, setImgError] = useState(false);
  const [isProjectPage, setIsProjectPage] = useState(false);

  useEffect(() => {
    // Runs only on client
    if (typeof window !== "undefined") {
      setIsProjectPage(window.location.pathname.startsWith("/projects"));
    }
  }, []);

  const cleaned = projectName
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join("");

  const fallback = "/mark-transparent.png";
  const basePath = "/projectIcons/";
  const possibleExts = ["png", "jpg", "svg"];

  const getImagePath = () => {
    for (const ext of possibleExts) {
      const path = `${basePath}${cleaned}.${ext}`;
      if (!imgError) return path;
    }
    return fallback;
  };

  const containerClass = isProjectPage
    ? "absolute top-4 right-4 h-10 w-10 bg-white border border-gray-200 rounded-full p-1 flex items-center justify-center shadow-sm"
    : "w-24 h-auto p-1 mx-auto"; // For detail page

  return (
    <div className={containerClass}>
      <img
        src={getImagePath()}
        onError={() => setImgError(true)}
        className="h-full w-full rounded-full object-contain"
        alt={`${projectName} logo`}
      />
    </div>
  );
}
