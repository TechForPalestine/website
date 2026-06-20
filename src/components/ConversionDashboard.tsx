import { useEffect, useRef, useState, useCallback } from "react";
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

Chart.register(
  BarController,
  BarElement,
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

interface PropBreakdown {
  goal: string;
  prop: string;
  value: string;
  count: number;
}

interface StatsResponse {
  plausible: DailyCount[];
  dropped: DailyCount[];
  propBreakdowns: PropBreakdown[];
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

const GOAL_COLORS: Record<string, { bg: string; border: string }> = {
  "One-time-donate": { bg: "#16803980", border: "#168039" },
  "Monthly-donate": { bg: "#2563eb80", border: "#2563eb" },
  "Membership-complete": { bg: "#7c3aed80", border: "#7c3aed" },
};

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

export default function ConversionDashboard({
  token,
}: ConversionDashboardProps) {
  const [defaultFrom, defaultTo] = buildDateRange(30);
  const [dateFrom, setDateFrom] = useState(defaultFrom);
  const [dateTo, setDateTo] = useState(defaultTo);
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

  useEffect(() => {
    if (!data || !chartRef.current) return;

    const allCounts = mergeCountsByGoal(data.plausible, data.dropped);

    const filtered =
      goalFilter === "all"
        ? allCounts
        : allCounts.filter((d) => d.goal === goalFilter);

    const dates = Array.from(new Set(filtered.map((d) => d.date))).sort();
    const goals = Array.from(new Set(filtered.map((d) => d.goal)));

    const datasets = goals.map((goal) => {
      const byDate = new Map<string, number>();
      for (const d of filtered.filter((c) => c.goal === goal)) {
        byDate.set(d.date, (byDate.get(d.date) || 0) + d.count);
      }
      const colors = GOAL_COLORS[goal] || { bg: "#16803980", border: "#168039" };
      return {
        label: GOAL_LABELS[goal] || goal,
        data: dates.map((d) => byDate.get(d) || 0),
        backgroundColor: colors.bg,
        borderColor: colors.border,
        borderWidth: 1,
      };
    });

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    chartInstance.current = new Chart(chartRef.current, {
      type: "bar",
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
          x: { stacked: true },
          y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1 } },
        },
      },
    });

    return () => {
      chartInstance.current?.destroy();
      chartInstance.current = null;
    };
  }, [data, goalFilter]);

  const allCounts = data
    ? mergeCountsByGoal(data.plausible, data.dropped)
    : [];

  const totalConversions = allCounts.reduce((sum, d) => sum + d.count, 0);

  const goalKeys = ["One-time-donate", "Monthly-donate", "Membership-complete"] as const;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900">
        Donation Conversion Dashboard
      </h1>
      <p className="mt-2 text-sm text-gray-600">
        Conversion events tracked across /donate and /membership pages.
      </p>

      {/* Date range + goal filter */}
      <div className="mt-6 flex flex-wrap items-end gap-4">
        <div>
          <label
            htmlFor="date-from"
            className="block text-sm font-medium text-gray-700"
          >
            From
          </label>
          <input
            type="date"
            id="date-from"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="mt-1 block rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>
        <div>
          <label
            htmlFor="date-to"
            className="block text-sm font-medium text-gray-700"
          >
            To
          </label>
          <input
            type="date"
            id="date-to"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="mt-1 block rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => {
                const [f, t] = buildDateRange(days);
                setDateFrom(f);
                setDateTo(t);
              }}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {days}d
            </button>
          ))}
        </div>
        <div>
          <label
            htmlFor="goal-filter"
            className="block text-sm font-medium text-gray-700"
          >
            Goal
          </label>
          <select
            id="goal-filter"
            value={goalFilter}
            onChange={(e) => setGoalFilter(e.target.value)}
            className="mt-1 block rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="all">All Goals</option>
            {goalKeys.map((goal) => (
              <option key={goal} value={goal}>
                {GOAL_LABELS[goal]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="mt-8 text-center text-gray-500">Loading...</div>
      )}

      {error && (
        <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {data && !loading && (
        <>
          {/* Summary cards */}
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <p className="text-sm font-medium text-gray-500">
                Total Conversions
              </p>
              <p className="mt-1 text-3xl font-bold text-green-700">
                {totalConversions}
              </p>
            </div>
            {goalKeys.map((goal) => {
              const count = allCounts
                .filter((d) => d.goal === goal)
                .reduce((s, d) => s + d.count, 0);
              const colors = GOAL_COLORS[goal];
              return (
                <div
                  key={goal}
                  className="rounded-lg border border-gray-200 bg-white p-5"
                >
                  <p className="text-sm font-medium text-gray-500">
                    {GOAL_LABELS[goal]}
                  </p>
                  <p
                    className="mt-1 text-3xl font-bold"
                    style={{ color: colors.border }}
                  >
                    {count}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Chart */}
          <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-800">
              Daily Conversions
            </h2>
            <div className="relative h-80">
              <canvas ref={chartRef} />
            </div>
          </div>

          {/* Property breakdowns */}
          {data.propBreakdowns.length > 0 && (
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Amount totals per goal */}
              {goalKeys.map((goal) => {
                const amounts = data.propBreakdowns.filter(
                  (p) => p.goal === goal && p.prop === "amount" && p.value
                );
                if (amounts.length === 0) return null;
                const total = amounts.reduce(
                  (sum, p) => sum + parseFloat(p.value || "0") * p.count,
                  0
                );
                return (
                  <div
                    key={`amount-${goal}`}
                    className="rounded-lg border border-gray-200 bg-white p-5"
                  >
                    <h3 className="text-sm font-medium text-gray-500">
                      {GOAL_LABELS[goal]} — Total Amount
                    </h3>
                    <p
                      className="mt-1 text-2xl font-bold"
                      style={{ color: GOAL_COLORS[goal]?.border }}
                    >
                      ${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {amounts.reduce((s, p) => s + p.count, 0)} conversions
                    </p>
                  </div>
                );
              })}

              {/* Membership variant breakdown */}
              {(() => {
                const variants = data.propBreakdowns.filter(
                  (p) =>
                    p.goal === "Membership-complete" &&
                    p.prop === "membership_variant"
                );
                if (variants.length === 0) return null;
                return (
                  <div className="rounded-lg border border-gray-200 bg-white p-5">
                    <h3 className="text-sm font-medium text-gray-500">
                      Membership — Calculator Variant
                    </h3>
                    <div className="mt-3 space-y-2">
                      {variants.map((v) => (
                        <div
                          key={v.value}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm text-gray-700">
                            {v.value || "(not set)"}
                          </span>
                          <span className="text-sm font-semibold text-gray-900">
                            {v.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </>
      )}
    </div>
  );
}
