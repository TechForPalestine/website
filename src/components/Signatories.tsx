import React, { useState, useEffect } from "react";

interface Signatory {
  id: string;
  name: string;
  company: string;
  position: string;
  linkedinUrl: string;
  signedAt: string;
  approved: boolean;
}

interface SignatoriesProps {
  initialSignatories?: Signatory[];
  loading?: boolean;
}

export default function Signatories({
  initialSignatories = [],
  loading: initialLoading = false,
}: SignatoriesProps) {
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
      console.error("Error fetching signatories:", err);
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
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 w-3/4 rounded bg-gray-200"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="mb-4 text-red-600">{error}</p>
        <button
          onClick={fetchSignatories}
          className="rounded bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (signatories.length === 0) {
    return (
      <div className="py-8">
        <p className="text-gray-600">No signatories yet. Be the first to sign the pledge!</p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-4 text-gray-600">
        {signatories.length} {signatories.length === 1 ? "signatory" : "signatories"}
      </p>

      <ul className="list-disc space-y-2 pl-6 marker:text-red-600">
        {signatories.map((signatory) => (
          <li key={signatory.id} className="text-gray-900">
            <div className="flex items-center gap-1">
              <span className="font-semibold">{signatory.name}</span>
              <span className="text-gray-600">-</span>
              <span className="text-gray-600">{signatory.position}</span>
              <span className="text-gray-600">at</span>
              <span className="text-gray-600">{signatory.company}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
