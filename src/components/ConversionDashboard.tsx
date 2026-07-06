import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

Chart.register(
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

interface DailyCount {
  date: string;
  goal: string;
  count: number;
}

interface ConversionDetail {
  goal: string;
  amount: string;
  variant: string;
  count: number;
}

interface StatsResponse {
  plausible: DailyCount[];
  dropped: DailyCount[];
  details: ConversionDetail[];
  dateFrom: string;
  dateTo: string;
  error?: string;
}

interface ConversionDashboardProps {
  token: string;
}

const GOAL_LABELS: Record<string, string> = {
  "One-time-donate": "One-time Donation",
  "Monthly-donate": "Monthly Donation",
  "Membership-complete": "Membership",
};

const GOAL_COLORS: Record<string, { border: string }> = {
  "One-time-donate": { border: "#B8860B" },
  "Monthly-donate": { border: "#6B7A4F" },
  "Membership-complete": { border: "#AB4956" },
};

const DATE_RANGE_PRESETS = [7, 30, 90] as const;

const GOAL_KEYS = [
  "One-time-donate",
  "Monthly-donate",
  "Membership-complete",
] as const;

function buildDateRange(days: number): [string, string] {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return [from.toISOString().slice(0, 10), to.toISOString().slice(0, 10)];
}

function mergeCountsByGoal(
  plausible: DailyCount[],
  dropped: DailyCount[]
): DailyCount[] {
  const merged = new Map<string, number>();
  for (const d of [...plausible, ...dropped]) {
    const key = `${d.date}:${d.goal}`;
    merged.set(key, (merged.get(key) || 0) + d.count);
  }
  return Array.from(merged, ([key, count]) => {
    const [date, ...goalParts] = key.split(":");
    return { date, goal: goalParts.join(":"), count };
  });
}

function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const dayOfWeek = d.getDay();
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  d.setDate(d.getDate() - daysSinceMonday);
  return d.toISOString().slice(0, 10);
}

function bucketByWeek(counts: DailyCount[]): DailyCount[] {
  const merged = new Map<string, number>();
  for (const c of counts) {
    const key = `${getWeekStart(c.date)}:${c.goal}`;
    merged.set(key, (merged.get(key) || 0) + c.count);
  }
  return Array.from(merged, ([key, count]) => {
    const [date, ...goalParts] = key.split(":");
    return { date, goal: goalParts.join(":"), count };
  });
}

function SegmentedButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`ts-label rounded-pill px-4 py-2 text-sm transition-colors focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-brand ${
        active
          ? "bg-brand text-white"
          : "bg-transparent text-ink hover:bg-ink/5"
      }`}
    >
      {children}
    </button>
  );
}

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-sand ${className}`} />;
}

function StatCard({
  label,
  value,
  valueColor,
  emphasized = false,
}: {
  label: string;
  value: string;
  valueColor?: string;
  emphasized?: boolean;
}) {
  return (
    <div
      className={`rounded-md p-5 ${emphasized ? "bg-brand/5" : "bg-sand"}`}
    >
      <p className="ts-caption text-ink-secondary uppercase tracking-wide">
        {label}
      </p>
      <p
        className={emphasized ? "ts-stat-large mt-1" : "ts-stat mt-1"}
        style={{ color: valueColor }}
      >
        {value}
      </p>
    </div>
  );
}

export default function ConversionDashboard({
  token,
}: ConversionDashboardProps) {
  const [defaultFrom, defaultTo] = buildDateRange(30);
  const [dateFrom, setDateFrom] = useState(defaultFrom);
  const [dateTo, setDateTo] = useState(defaultTo);
  const [activePreset, setActivePreset] = useState<number | null>(30);
  const [goalFilter, setGoalFilter] = useState("all");
  const [data, setData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        token,
        date_from: dateFrom,
        date_to: dateTo,
      });
      const res = await fetch(`/api/admin/conversion-stats?${params}`);
      if (!res.ok) {
        throw new Error(
          res.status === 401 ? "Unauthorized" : "Failed to fetch stats"
        );
      }
      const json = (await res.json()) as StatsResponse;
      if (json.error) throw new Error(json.error);
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [token, dateFrom, dateTo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const rangeDays = useMemo(() => {
    const from = new Date(dateFrom + "T00:00:00");
    const to = new Date(dateTo + "T00:00:00");
    return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
  }, [dateFrom, dateTo]);

  const isAggregated = rangeDays > 30;

  const chartData = useMemo(() => {
    if (!data) return null;
    const allCounts = mergeCountsByGoal(data.plausible, data.dropped);
    const filtered =
      goalFilter === "all"
        ? allCounts
        : allCounts.filter((d) => d.goal === goalFilter);
    const bucketed = isAggregated ? bucketByWeek(filtered) : filtered;
    const dates = Array.from(new Set(bucketed.map((d) => d.date))).sort();
    const goals = Array.from(new Set(bucketed.map((d) => d.goal)));
    return { bucketed, dates, goals };
  }, [data, goalFilter, isAggregated]);

  useEffect(() => {
    if (!chartData || !chartRef.current) return;
    const { bucketed, dates, goals } = chartData;

    const datasets = goals.map((goal) => {
      const byDate = new Map<string, number>();
      for (const d of bucketed.filter((c) => c.goal === goal)) {
        byDate.set(d.date, (byDate.get(d.date) || 0) + d.count);
      }
      const colors = GOAL_COLORS[goal] || { border: "#AB4956" };
      return {
        label: GOAL_LABELS[goal] || goal,
        data: dates.map((d) => byDate.get(d) || 0),
        borderColor: colors.border,
        backgroundColor: colors.border,
        pointBackgroundColor: colors.border,
        pointRadius: 3,
        borderWidth: 2,
        tension: 0.15,
        fill: false,
      };
    });

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    chartInstance.current = new Chart(chartRef.current, {
      type: "line",
      data: {
        labels: dates.map((d) =>
          new Date(d + "T00:00:00").toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })
        ),
        datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "top" },
          tooltip: {
            callbacks: {
              title: (items) => {
                const idx = items[0]?.dataIndex;
                if (idx === undefined) return "";
                return dates[idx];
              },
            },
          },
        },
        scales: {
          x: {},
          y: { beginAtZero: true, ticks: { stepSize: 1 } },
        },
      },
    });

    return () => {
      chartInstance.current?.destroy();
      chartInstance.current = null;
    };
  }, [chartData]);

  const allCounts = data
    ? mergeCountsByGoal(data.plausible, data.dropped)
    : [];

  const totalConversions = allCounts.reduce((sum, d) => sum + d.count, 0);

  const chartAriaLabel = `Conversions from ${dateFrom} to ${dateTo}, total ${totalConversions}${
    isAggregated ? ", shown as weekly totals" : ""
  }`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="ts-overline text-brand">Admin</p>
      <h1 className="ts-heading mt-1">Conversion Dashboard</h1>
      <p className="ts-body-small mt-2 text-ink-secondary">
        Conversion events tracked across /donate and /membership pages.
      </p>

      {/* Date range + goal filter */}
      <div className="mt-8 flex flex-wrap items-end gap-6">
        <div>
          <label htmlFor="date-from" className="ts-caption text-ink-secondary">
            From
          </label>
          <input
            type="date"
            id="date-from"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setActivePreset(null);
            }}
            className="ts-body-small mt-1 block rounded-md border border-ink-divider bg-page px-3 py-2 text-ink focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-brand"
          />
        </div>
        <div>
          <label htmlFor="date-to" className="ts-caption text-ink-secondary">
            To
          </label>
          <input
            type="date"
            id="date-to"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setActivePreset(null);
            }}
            className="ts-body-small mt-1 block rounded-md border border-ink-divider bg-page px-3 py-2 text-ink focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-brand"
          />
        </div>
        <div className="flex gap-2">
          {DATE_RANGE_PRESETS.map((days) => (
            <SegmentedButton
              key={days}
              active={activePreset === days}
              onClick={() => {
                const [f, t] = buildDateRange(days);
                setDateFrom(f);
                setDateTo(t);
                setActivePreset(days);
              }}
            >
              {days}d
            </SegmentedButton>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <SegmentedButton
            active={goalFilter === "all"}
            onClick={() => setGoalFilter("all")}
          >
            All Goals
          </SegmentedButton>
          {GOAL_KEYS.map((goal) => (
            <SegmentedButton
              key={goal}
              active={goalFilter === goal}
              onClick={() => setGoalFilter(goal)}
            >
              {GOAL_LABELS[goal]}
            </SegmentedButton>
          ))}
        </div>
      </div>

      {loading && (
        <div className="mt-8 space-y-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-24" />
            ))}
          </div>
          <SkeletonBlock className="h-80" />
        </div>
      )}

      {error && (
        <div className="ts-body-small mt-8 rounded-md border border-brand/30 bg-brand/5 p-4 text-brand">
          {error}
        </div>
      )}

      {data && !loading && totalConversions === 0 && (
        <div className="ts-body-small mt-8 rounded-md bg-sand p-6 text-ink-secondary">
          No conversions recorded in this range. Try widening the date range
          or clearing the goal filter.
        </div>
      )}

      {data && !loading && totalConversions > 0 && (
        <>
          {/* Summary cards */}
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
            <StatCard
              label="Total Conversions"
              value={String(totalConversions)}
              emphasized
            />
            {GOAL_KEYS.map((goal) => {
              const count = allCounts
                .filter((d) => d.goal === goal)
                .reduce((s, d) => s + d.count, 0);
              const colors = GOAL_COLORS[goal];
              return (
                <StatCard
                  key={goal}
                  label={GOAL_LABELS[goal]}
                  value={String(count)}
                  valueColor={colors.border}
                />
              );
            })}
          </div>

          {/* Chart */}
          <div className="mt-8 rounded-md bg-sand p-6">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="ts-label text-ink">
                {isAggregated ? "Weekly Conversions" : "Daily Conversions"}
              </h2>
              {isAggregated && (
                <span className="ts-caption text-ink-secondary">
                  Weekly totals (range &gt; 30 days)
                </span>
              )}
            </div>
            <div className="relative h-80">
              <canvas ref={chartRef} role="img" aria-label={chartAriaLabel} />
            </div>
          </div>

          {/* Raw counts table — accessible fallback for the chart above */}
          {chartData && chartData.dates.length > 0 && (
            <div className="mt-4 rounded-md bg-sand p-5">
              <h3 className="ts-caption text-ink-secondary uppercase tracking-wide">
                {isAggregated ? "Weekly Counts" : "Daily Counts"}
              </h3>
              <div className="mt-3 max-h-64 overflow-y-auto">
                <table className="ts-body-small w-full">
                  <thead>
                    <tr className="sticky top-0 border-b border-ink-divider bg-sand">
                      <th className="ts-label pb-1 text-left text-ink-secondary">
                        {isAggregated ? "Week of" : "Date"}
                      </th>
                      {chartData.goals.map((goal) => (
                        <th
                          key={goal}
                          className="ts-label pb-1 text-right text-ink-secondary"
                        >
                          {GOAL_LABELS[goal] || goal}
                        </th>
                      ))}
                      <th className="ts-label pb-1 text-right text-ink-secondary">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.dates.map((date) => {
                      const rowCounts = chartData.goals.map((goal) => {
                        const row = chartData.bucketed.find(
                          (c) => c.date === date && c.goal === goal
                        );
                        return row?.count ?? 0;
                      });
                      const rowTotal = rowCounts.reduce((s, c) => s + c, 0);
                      return (
                        <tr key={date} className="border-b border-ink-divider/50">
                          <td className="py-1 text-ink">{date}</td>
                          {rowCounts.map((count, i) => (
                            <td
                              key={chartData.goals[i]}
                              className="py-1 text-right text-ink"
                            >
                              {count}
                            </td>
                          ))}
                          <td className="py-1 text-right font-medium text-ink">
                            {rowTotal}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Conversion details per goal */}
          {data.details.length > 0 && (
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {GOAL_KEYS.map((goal) => {
                const rows = data.details.filter((d) => d.goal === goal);
                if (rows.length === 0) return null;
                const hasVariant = goal === "Membership-complete";
                const tracked = rows
                  .filter((r) => r.amount && !isNaN(parseFloat(r.amount)))
                  .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));
                const untrackedCount = rows
                  .filter((r) => !r.amount || isNaN(parseFloat(r.amount)))
                  .reduce((s, r) => s + r.count, 0);
                const total = tracked.reduce(
                  (sum, r) => sum + parseFloat(r.amount) * r.count,
                  0
                );
                const colors = GOAL_COLORS[goal];
                return (
                  <div key={`detail-${goal}`} className="rounded-md bg-sand p-5">
                    <h3 className="ts-caption text-ink-secondary uppercase tracking-wide">
                      {GOAL_LABELS[goal]}
                    </h3>
                    <p
                      className="ts-stat mt-1"
                      style={{ color: colors?.border }}
                    >
                      $
                      {total.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    <div className="mt-3 max-h-64 overflow-y-auto">
                      <table className="ts-body-small w-full">
                        <thead>
                          <tr className="sticky top-0 border-b border-ink-divider bg-sand">
                            <th className="ts-label pb-1 text-left text-ink-secondary">
                              Amount
                            </th>
                            {hasVariant && (
                              <th className="ts-label pb-1 text-left text-ink-secondary">
                                Variant
                              </th>
                            )}
                            <th className="ts-label pb-1 text-right text-ink-secondary">
                              Count
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {tracked.map((r, i) => (
                            <tr key={i} className="border-b border-ink-divider/50">
                              <td className="py-1 text-ink">
                                $
                                {parseFloat(r.amount).toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </td>
                              {hasVariant && (
                                <td className="py-1 text-ink-secondary">
                                  {r.variant || "—"}
                                </td>
                              )}
                              <td className="py-1 text-right font-medium text-ink">
                                {r.count}
                              </td>
                            </tr>
                          ))}
                          {untrackedCount > 0 && (
                            <tr className="border-b border-ink-divider/50">
                              <td className="py-1 italic text-ink-muted">
                                Untracked
                              </td>
                              {hasVariant && <td />}
                              <td className="py-1 text-right font-medium text-ink-muted">
                                {untrackedCount}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
