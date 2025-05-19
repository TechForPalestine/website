import { useEffect, useState } from 'react';

interface Props {
    projectName: string;
}

export default function ProjectLogo({ projectName }: Props) {
    const [src, setSrc] = useState("");

    useEffect(() => {
        const cleaned = projectName
            .replace(/[^a-zA-Z0-9\s]/g, "")
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .join("");

        const tryExtensions = async () => {
            const exts = ["png", "jpg", "svg"];
            for (const ext of exts) {
                const path = `/projectIcons/${cleaned}.${ext}`;
                const res = await fetch(path, { method: "HEAD" });
                if (res.ok) {
                    setSrc(path);
                    return;
                }
            }
            setSrc("/mark-transparent.png");
        };

        tryExtensions();
    }, [projectName]);

    return (

    <div className="absolute top-4 right-4 h-10 w-10 bg-white border border-gray-200 rounded-full p-1 flex items-center justify-center shadow-sm">
        <img src={src} className="max-h-full max-w-full object-contain" />
    </div>

);
}
