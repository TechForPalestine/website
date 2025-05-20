import { useState } from 'react';

interface Props {
    projectName: string;
}

export default function ProjectLogo({ projectName }: Props) {
    const [imgError, setImgError] = useState(false);

    const cleaned = projectName
        .replace(/[^a-zA-Z0-9\s]/g, "")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .join("");

    const fallback = "/mark-transparent.png";

    const possibleExts = ["png", "jpg", "svg"];
    const basePath = "/projectIcons/";

    // Try multiple extensions (but this only works well if you know which one works)
    const getImagePath = () => {
        for (const ext of possibleExts) {
            const path = `${basePath}${cleaned}.${ext}`;
            if (!imgError) return path;
        }
        return fallback;
    };

    return (
        <div className="absolute top-4 right-4 h-10 w-10 bg-white border border-gray-200 rounded-full p-1 flex items-center justify-center shadow-sm">
            <img
                src={getImagePath()}
                onError={() => setImgError(true)}
                className="max-h-full max-w-full object-contain"
                alt={`${projectName} logo`}
            />
        </div>
    );
}
