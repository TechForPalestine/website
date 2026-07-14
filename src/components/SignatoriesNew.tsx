import { useState, useEffect } from "react";

interface Signatory {
  id: string;
  name: string;
  company: string;
  position: string;
  linkedinUrl: string;
  signedAt: string;
  approved: boolean;
}

interface SignatoriesNewProps {
  initialSignatories?: Signatory[];
  loading?: boolean;
}

export default function SignatoriesNew({
  initialSignatories = [],
  loading: initialLoading = false,
}: SignatoriesNewProps) {
  const [signatories, setSignatories] = useState<Signatory[]>(initialSignatories);
  const [loading, setLoading] = useState(initialLoading);
  const [error, setError] = useState<string | null>(null);

  const fetchSignatories = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/e4p-signatories");
      if (!response.ok) {
        throw new Error("Failed to fetch signatories");
      }

      const data = await response.json();
      setSignatories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch signatories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialSignatories.length === 0) {
      fetchSignatories();
    }
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 w-3/4 rounded bg-butter"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="ts-body-large mb-4 text-brand">{error}</p>
        <button
          onClick={fetchSignatories}
          className="ts-label rounded-pill bg-brand px-5 py-3 text-white transition-colors hover:bg-brand-hover"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (signatories.length === 0) {
    return (
      <div className="py-8">
        <p className="ts-body-large text-ink-secondary">
          No signatories yet. Be the first to sign the pledge!
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="ts-label mb-6 text-ink-secondary">
        {signatories.length} {signatories.length === 1 ? "signatory" : "signatories"}
      </p>

      <ul>
        {signatories.map((signatory) => (
          <li
            key={signatory.id}
            className="flex flex-wrap items-baseline gap-x-1.5 border-b border-butter py-3 last:border-b-0"
          >
            <span className="ts-label text-ink">{signatory.name}</span>
            <span className="ts-body-small text-ink-secondary">
              {signatory.position} at {signatory.company}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
