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

interface DroppedEvent {
  eventName: string;
  timestamp: string;
  props: Record<string, string>;
  hasIp: boolean;
  hasUserAgent: boolean;
}

interface StatsResponse {
  plausible: DailyCount[];
  dropped: DailyCount[];
  droppedEvents: DroppedEvent[];
  dateFrom: string;
  dateTo: string;
  error?: string;
}

interface ConversionDashboardProps {
  token: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildDateRange(days: number): [string, string] {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return [from.toISOString().slice(0, 10), to.toISOString().slice(0, 10)];
}

export default function ConversionDashboard({
  token,
}: ConversionDashboardProps) {
  const [defaultFrom, defaultTo] = buildDateRange(30);
  const [dateFrom, setDateFrom] = useState(defaultFrom);
  const [dateTo, setDateTo] = useState(defaultTo);
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

    const allDates = new Set<string>();
    for (const d of data.plausible) allDates.add(d.date);
    for (const d of data.dropped) allDates.add(d.date);
    const dates = Array.from(allDates).sort();

    const plausibleByDate = new Map<string, number>();
    const droppedByDate = new Map<string, number>();

    for (const d of data.plausible) {
      plausibleByDate.set(d.date, (plausibleByDate.get(d.date) || 0) + d.count);
    }
    for (const d of data.dropped) {
      droppedByDate.set(d.date, (droppedByDate.get(d.date) || 0) + d.count);
    }

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
        datasets: [
          {
            label: "Tracked (Plausible)",
            data: dates.map((d) => plausibleByDate.get(d) || 0),
            backgroundColor: "#16803980",
            borderColor: "#168039",
            borderWidth: 1,
          },
          {
            label: "Dropped",
            data: dates.map((d) => droppedByDate.get(d) || 0),
            backgroundColor: "#dc262680",
            borderColor: "#dc2626",
            borderWidth: 1,
          },
        ],
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
  }, [data]);

  const totalTracked =
    data?.plausible.reduce((sum, d) => sum + d.count, 0) || 0;
  const totalDropped =
    data?.dropped.reduce((sum, d) => sum + d.count, 0) || 0;
  const dropRate =
    totalTracked + totalDropped > 0
      ? ((totalDropped / (totalTracked + totalDropped)) * 100).toFixed(1)
      : "0";

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900">
        Donation Conversion Dashboard
      </h1>
      <p className="mt-2 text-sm text-gray-600">
        Tracked conversions from Plausible vs. silently dropped events (VPN
        users, bot-like browsers).
      </p>

      {/* Date range filter */}
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
          <button
            type="button"
            onClick={() => {
              const [f, t] = buildDateRange(7);
              setDateFrom(f);
              setDateTo(t);
            }}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            7d
          </button>
          <button
            type="button"
            onClick={() => {
              const [f, t] = buildDateRange(30);
              setDateFrom(f);
              setDateTo(t);
            }}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            30d
          </button>
          <button
            type="button"
            onClick={() => {
              const [f, t] = buildDateRange(90);
              setDateFrom(f);
              setDateTo(t);
            }}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            90d
          </button>
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
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <p className="text-sm font-medium text-gray-500">
                Tracked Conversions
              </p>
              <p className="mt-1 text-3xl font-bold text-green-700">
                {totalTracked}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <p className="text-sm font-medium text-gray-500">
                Dropped Conversions
              </p>
              <p className="mt-1 text-3xl font-bold text-red-600">
                {totalDropped}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <p className="text-sm font-medium text-gray-500">Drop Rate</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {dropRate}%
              </p>
            </div>
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

          {/* Breakdown by goal */}
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {["One-time-donate", "Monthly-donate"].map((goal) => {
              const tracked =
                data.plausible
                  .filter((d) => d.goal === goal)
                  .reduce((s, d) => s + d.count, 0) || 0;
              const dropped =
                data.dropped
                  .filter((d) => d.goal === goal)
                  .reduce((s, d) => s + d.count, 0) || 0;
              const label =
                goal === "One-time-donate" ? "One-time" : "Monthly";
              return (
                <div
                  key={goal}
                  className="rounded-lg border border-gray-200 bg-white p-5"
                >
                  <h3 className="text-sm font-medium text-gray-500">
                    {label} Donations
                  </h3>
                  <div className="mt-2 flex items-baseline gap-4">
                    <span className="text-2xl font-bold text-green-700">
                      {tracked}
                    </span>
                    <span className="text-sm text-gray-500">tracked</span>
                    <span className="text-2xl font-bold text-red-600">
                      {dropped}
                    </span>
                    <span className="text-sm text-gray-500">dropped</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dropped events table */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-800">
              Dropped Events Detail
            </h2>
            {data.droppedEvents.length === 0 ? (
              <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
                <p className="text-gray-500">
                  No dropped conversions in this date range.
                </p>
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <p className="mb-3 text-sm text-gray-500">
                  {data.droppedEvents.length} dropped event
                  {data.droppedEvents.length !== 1 ? "s" : ""}
                </p>
                <table className="min-w-full divide-y divide-gray-200 rounded-lg border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Event
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Source
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        IP
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        UA
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {data.droppedEvents.map((event, i) => (
                      <tr key={i}>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                          {formatDate(event.timestamp)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                          {event.eventName}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                          {event.props.amount
                            ? `$${event.props.amount}`
                            : "—"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                          {event.props.source ||
                            event.props.donate_form_variant ||
                            "—"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm">
                          <span
                            className={
                              event.hasIp
                                ? "text-green-700"
                                : "text-red-600"
                            }
                          >
                            {event.hasIp ? "Yes" : "No"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm">
                          <span
                            className={
                              event.hasUserAgent
                                ? "text-green-700"
                                : "text-red-600"
                            }
                          >
                            {event.hasUserAgent ? "Yes" : "No"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
