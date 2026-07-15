function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function dayDiff(date: Date, now: Date): number {
  return Math.round((startOfDay(date) - startOfDay(now)) / (24 * 60 * 60 * 1000));
}

// Short form for the banner: "Today at 7:30 PM" / "Tomorrow at 7:30 PM" /
// "Wed 7:30 PM". `now` must be passed in rather than read internally so the
// same function produces correct output whether called on the server or in
// the visitor's browser (see design doc on server-vs-visitor time zone).
export function formatShortCallTime(iso: string, now: Date): string {
  const date = new Date(iso);
  const time = date.toLocaleString(undefined, { hour: "numeric", minute: "2-digit" });
  const diff = dayDiff(date, now);
  if (diff === 0) return `Today at ${time}`;
  if (diff === 1) return `Tomorrow at ${time}`;
  const weekday = date.toLocaleString(undefined, { weekday: "short" });
  return `${weekday} ${time}`;
}

// Long form for the community-call pages: "Today at 7:30 PM" / "Tomorrow at
// 7:30 PM" / "Wednesday, July 15 at 7:30 PM".
export function formatLongCallTime(iso: string, now: Date): string {
  const date = new Date(iso);
  const time = date.toLocaleString(undefined, { hour: "numeric", minute: "2-digit" });
  const diff = dayDiff(date, now);
  if (diff === 0) return `Today at ${time}`;
  if (diff === 1) return `Tomorrow at ${time}`;
  const day = date.toLocaleString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  return `${day} at ${time}`;
}
