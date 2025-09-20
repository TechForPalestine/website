import React, { useState, useEffect } from 'react';

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

export default function Signatories({ initialSignatories = [], loading: initialLoading = false }: SignatoriesProps) {
  const [signatories, setSignatories] = useState<Signatory[]>(initialSignatories);
  const [loading, setLoading] = useState(initialLoading);
  const [error, setError] = useState<string | null>(null);

  const fetchSignatories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/e4p-signatories');
      if (!response.ok) {
        throw new Error('Failed to fetch signatories');
      }
      
      const data = await response.json();
      setSignatories(data);
    } catch (err) {
      console.error('Error fetching signatories:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch signatories');
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
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={fetchSignatories}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (signatories.length === 0) {
    return (
      <div className="py-8">
        <p className="text-gray-600">
          No signatories yet. Be the first to sign the pledge!
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-gray-600 mb-4">
        {signatories.length} {signatories.length === 1 ? 'signatory' : 'signatories'}
      </p>
      
      <ul className="list-disc marker:text-red-600 pl-6 space-y-2">
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