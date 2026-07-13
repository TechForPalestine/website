import { useState, useEffect, useRef, useCallback } from "react";

interface Speaker {
  id: string;
  name: string;
  title: string;
  bio: string;
  photo: string;
}

interface SpeakersSectionProps {
  initialSpeakers?: Speaker[];
}

export default function SpeakersSection({ initialSpeakers = [] }: SpeakersSectionProps) {
  const [speakers, setSpeakers] = useState<Speaker[]>(initialSpeakers);
  const [loading, setLoading] = useState(initialSpeakers.length === 0);
  const [selectedSpeaker, setSelectedSpeaker] = useState<Speaker | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (initialSpeakers.length === 0) {
      fetch("/api/speakers")
        .then((r) => r.json())
        .then((data) => setSpeakers(data.speakers || []))
        .catch((err) => console.error("Error fetching speakers:", err))
        .finally(() => setLoading(false));
    }
  }, []);

  const openModal = useCallback((speaker: Speaker) => {
    setSelectedSpeaker(speaker);
    dialogRef.current?.showModal();
  }, []);

  const closeModal = useCallback(() => {
    dialogRef.current?.close();
  }, []);

  if (loading) {
    return (
      <section className="bg-page px-6 py-14 min-[810px]:px-10 min-[810px]:py-20">
        <div className="mx-auto max-w-[1400px] text-center">
          <p className="ts-body-large text-ink-secondary">Loading speakers...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-page px-6 py-14 min-[810px]:px-10 min-[810px]:py-20">
      <div className="mx-auto max-w-[1400px]">
        <p className="ts-overline mb-6 text-ink-secondary">Who spoke</p>
        <h2 className="ts-heading mb-12 text-ink">Speakers</h2>

        <div className="grid grid-cols-2 gap-6 min-[640px]:grid-cols-3 min-[1050px]:grid-cols-5">
          {speakers.map((speaker) => (
            <button
              key={speaker.id}
              onClick={() => openModal(speaker)}
              className="group flex flex-col items-center text-center"
            >
              <img
                src={speaker.photo || "/images/default.jpg"}
                alt={speaker.name}
                className="speaker-avatar mb-4 h-24 w-24 rounded-full object-cover transition-transform duration-200 group-hover:scale-105 min-[810px]:h-28 min-[810px]:w-28"
                loading="lazy"
                decoding="async"
              />
              <p className="ts-label mb-1 text-ink group-hover:text-brand">{speaker.name}</p>
              <p className="ts-body-small text-ink-secondary">{speaker.title}</p>
            </button>
          ))}
        </div>
      </div>

      <dialog
        ref={dialogRef}
        className="m-auto w-full max-w-lg rounded-[20px] border border-butter bg-page p-0 backdrop:bg-ink/40"
        onClick={(e) => {
          if (e.target === dialogRef.current) closeModal();
        }}
      >
        {selectedSpeaker && (
          <div className="p-6 min-[810px]:p-8">
            <div className="mb-6 flex items-center gap-4">
              <img
                src={selectedSpeaker.photo || "/images/default.jpg"}
                alt={selectedSpeaker.name}
                className="speaker-avatar h-16 w-16 rounded-full object-cover"
              />
              <div className="flex-1">
                <p className="ts-label text-ink">{selectedSpeaker.name}</p>
                <p className="ts-body-small mt-0.5 text-ink-secondary">{selectedSpeaker.title}</p>
              </div>
              <button
                onClick={closeModal}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-secondary transition-colors hover:bg-sand hover:text-ink"
                aria-label="Close"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="border-t border-butter pt-6">
              <p className="ts-body-small leading-relaxed text-ink-secondary">
                {selectedSpeaker.bio || "Bio coming soon..."}
              </p>
            </div>
          </div>
        )}
      </dialog>
    </section>
  );
}
