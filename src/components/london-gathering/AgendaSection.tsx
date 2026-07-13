import { useState, useEffect } from "react";

interface Moderator {
  id: string;
  name: string;
  title: string;
  bio: string;
  photo: string;
}

interface AgendaItem {
  id: string;
  title: string;
  description: string;
  time: string;
  moderator: Moderator | null;
}

function sortAgendaItems(items: AgendaItem[]): AgendaItem[] {
  const getBreakoutNumber = (title: string) => {
    const match = title.match(/Breakout (\d+)/);
    return match ? parseInt(match[1]) : 0;
  };

  const session1Breakouts = items
    .filter((item) => item.title.includes("Breakout") && item.time === "10:30 - 12:00")
    .sort((a, b) => getBreakoutNumber(a.title) - getBreakoutNumber(b.title));

  const session2Breakouts = items
    .filter((item) => item.title.includes("Breakout") && item.time === "13:30 - 15:00")
    .sort((a, b) => getBreakoutNumber(a.title) - getBreakoutNumber(b.title));

  const otherItems = items.filter((item) => !item.title.includes("Breakout"));

  const sorted = otherItems.sort((a, b) => {
    const getStartMinutes = (timeStr: string) => {
      if (!timeStr) return 0;
      const startTime = timeStr.split(" - ")[0];
      const match = startTime.match(/^(\d{1,2}):(\d{2})/);
      if (!match) return 0;
      return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
    };
    return getStartMinutes(a.time) - getStartMinutes(b.time);
  });

  const result: AgendaItem[] = [];
  let session1Added = false;
  sorted.forEach((item) => {
    result.push(item);
    if (!session1Added && item.title.toLowerCase().includes("keynote")) {
      result.push({
        id: "session1-header",
        title: "Workshop Session 1",
        description: "",
        time: "10:30 - 12:00",
        moderator: null,
      });
      result.push(...session1Breakouts);
      session1Added = true;
    } else if (item.title.toLowerCase().includes("lunch")) {
      result.push({
        id: "session2-header",
        title: "Workshop Session 2",
        description: "",
        time: "13:30 - 15:00",
        moderator: null,
      });
      result.push(...session2Breakouts);
    }
  });

  return result;
}

function AgendaIcon({ title }: { title: string }) {
  const t = title.toLowerCase();
  if (
    t.includes("coffee") ||
    t.includes("welcome") ||
    t.includes("goodbye") ||
    t.includes("closing")
  ) {
    return (
      <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
        <path d="M2 21v-2h18v2H2zm2-4v-5q0-.825.588-1.413Q5.175 10 6 10h8q.825 0 1.413.587Q16 11.175 16 12v5h2q.825 0 1.413-.587Q20 15.825 20 15v-3q0-.825-.587-1.413Q18.825 10 18 10h-1V8h1q1.65 0 2.825 1.175Q22 10.35 22 12v3q0 1.65-1.175 2.825Q19.65 19 18 19h-2V12H6v5H4z" />
      </svg>
    );
  }
  if (t.includes("lunch")) {
    return (
      <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z" />
      </svg>
    );
  }
  if (t.includes("breakout") || t.includes("workshop")) {
    return (
      <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 12.75c1.63 0 3.07.39 4.24.9c1.08.48 1.76 1.56 1.76 2.73V18H6v-1.61c0-1.18.68-2.26 1.76-2.73c1.17-.52 2.61-.91 4.24-.91zM4 13c1.1 0 2-.9 2-2s-.9-2-2-2s-2 .9-2 2s.9 2 2 2zm1.13 1.1c-.37-.06-.74-.1-1.13-.1c-.99 0-1.93.21-2.78.58A2.01 2.01 0 0 0 0 16.43V18h4.5v-1.61c0-.83.23-1.61.63-2.29zM20 13c1.1 0 2-.9 2-2s-.9-2-2-2s-2 .9-2 2s.9 2 2 2zm4 3.43c0-.81-.48-1.53-1.22-1.85A6.95 6.95 0 0 0 20 14c-.39 0-.76.04-1.13.1c.4.68.63 1.46.63 2.29V18H24v-1.57zM12 6c1.66 0 3 1.34 3 3s-1.34 3-3 3s-3-1.34-3-3s1.34-3 3-3z" />
      </svg>
    );
  }
  return (
    <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8s8 3.58 8 8s-3.58 8-8 8zm.5-13H11v6l5.25 3.15l.75-1.23l-4.5-2.67z" />
    </svg>
  );
}

function getIconBg(title: string): string {
  const t = title.toLowerCase();
  if (
    t.includes("coffee") ||
    t.includes("welcome") ||
    t.includes("goodbye") ||
    t.includes("closing")
  )
    return "bg-brand";
  if (t.includes("lunch")) return "bg-[#d97706]";
  if (t.includes("breakout") || t.includes("workshop")) return "bg-ink-dark";
  return "bg-[#168039]";
}

interface AgendaSectionProps {
  initialAgendaItems?: AgendaItem[];
}

export default function AgendaSection({ initialAgendaItems = [] }: AgendaSectionProps) {
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>(
    initialAgendaItems.length > 0 ? sortAgendaItems(initialAgendaItems) : []
  );
  const [loading, setLoading] = useState(initialAgendaItems.length === 0);

  useEffect(() => {
    if (initialAgendaItems.length === 0) {
      fetch("/api/speakers")
        .then((r) => r.json())
        .then((data) => setAgendaItems(sortAgendaItems(data.agendaItems || [])))
        .catch((err) => console.error("Error fetching agenda:", err))
        .finally(() => setLoading(false));
    }
  }, []);

  if (loading) {
    return (
      <section className="bg-sand px-6 py-14 min-[810px]:px-10 min-[810px]:py-20">
        <div className="mx-auto max-w-[1400px] text-center">
          <p className="ts-body-large text-ink-secondary">Loading agenda...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-sand px-6 py-14 min-[810px]:px-10 min-[810px]:py-20">
      <div className="mx-auto max-w-[1400px]">
        <p className="ts-overline mb-6 text-ink-secondary">Schedule</p>
        <h2 className="ts-heading mb-12 text-ink">Agenda</h2>

        <div className="mx-auto max-w-[860px] space-y-4">
          {agendaItems.map((item) => {
            const isWorkshopHeader = item.title.includes("Workshop Session");
            const isBreakout = item.title.includes("Breakout");

            if (isWorkshopHeader) {
              return (
                <div key={item.id} className="rounded-[20px] bg-ink-dark p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10">
                      <AgendaIcon title={item.title} />
                    </div>
                    <div>
                      <p className="ts-label text-butter">{item.time}</p>
                      <p className="ts-body-large mt-1 font-medium text-brand-light">
                        {item.title}
                      </p>
                    </div>
                  </div>
                </div>
              );
            }

            if (isBreakout) {
              return (
                <div key={item.id} className="pl-8 min-[810px]:pl-14">
                  <div className="rounded-[16px] border border-butter bg-cream px-5 py-4">
                    <p className="ts-body-small text-ink">
                      {item.title}
                      {item.moderator && (
                        <span className="text-ink-secondary">
                          {" "}
                          (moderated by {item.moderator.name})
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              );
            }

            return (
              <div key={item.id} className="rounded-[20px] border border-butter bg-page p-6">
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${getIconBg(item.title)}`}
                  >
                    <AgendaIcon title={item.title} />
                  </div>
                  <div>
                    <p className="ts-label text-ink-secondary">{item.time}</p>
                    <p className="ts-body-large mt-1 font-medium text-ink">{item.title}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
