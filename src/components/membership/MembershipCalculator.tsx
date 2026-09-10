import { useState } from "react";

const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar", usdRate: 1 },
  { code: "EUR", symbol: "€", name: "Euro", usdRate: 1.08 },
  { code: "GBP", symbol: "£", name: "British Pound", usdRate: 1.27 },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar", usdRate: 0.74 },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", usdRate: 0.65 },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", usdRate: 0.0067 },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc", usdRate: 1.12 },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan", usdRate: 0.14 },
  { code: "INR", symbol: "₹", name: "Indian Rupee", usdRate: 0.012 },
  { code: "BRL", symbol: "R$", name: "Brazilian Real", usdRate: 0.19 },
  { code: "MXN", symbol: "MX$", name: "Mexican Peso", usdRate: 0.057 },
  { code: "ZAR", symbol: "R", name: "South African Rand", usdRate: 0.055 },
];

interface MembershipCalculatorProps {
  /** Accent theme for the border and result figures. `"brand"` (default) matches
   * the design-system rose brand color used by `MembershipDues`; `"green"` matches
   * the membership join flow's green accent (`JoinFlow`), which is deliberately
   * distinct from the site's rose `brand` token. */
  theme?: "brand" | "green";
  /** Uses the design system's ts-* typography scale instead of plain Tailwind
   * sizes — only correct where `design-system.css` is loaded. See the same
   * prop on `JoinFlow`. */
  designSystem?: boolean;
}

const THEME_CLASSES: Record<"brand" | "green", { border: string; text: string; ring: string; focusBorder: string }> = {
  brand: {
    border: "border-brand",
    text: "text-brand",
    ring: "focus:ring-brand",
    focusBorder: "focus:border-brand",
  },
  green: {
    border: "border-[#157A3E]",
    text: "text-[#157A3E]",
    ring: "focus:ring-[#157A3E]",
    focusBorder: "focus:border-[#157A3E]",
  },
};

export default function MembershipCalculator({
  theme = "brand",
  designSystem = false,
}: MembershipCalculatorProps) {
  const accent = THEME_CLASSES[theme];
  const labelClass = designSystem ? "ts-label text-ink" : "text-sm font-medium text-ink";
  const overlineClass = designSystem
    ? "ts-overline text-ink-secondary"
    : "text-xs font-medium uppercase tracking-[0.12em] text-ink-secondary";
  const resultLabelClass = designSystem ? "ts-body-small text-ink-secondary" : "text-sm text-ink-secondary";
  const resultFigureClass = designSystem ? "ts-stat" : "font-serif text-3xl";
  const resultSubClass = designSystem ? "ts-caption text-ink-muted" : "text-sm text-ink-muted";
  const emptyStateClass = designSystem ? "ts-body-small text-ink-muted" : "text-sm text-ink-muted";
  const [incomeType, setIncomeType] = useState<"annual" | "monthly">("monthly");
  const [income, setIncome] = useState<string>("");
  const [currency, setCurrency] = useState<string>("USD");

  const currencyData = CURRENCIES.find((c) => c.code === currency) ?? CURRENCIES[0];
  const isUSD = currency === "USD";
  const numericIncome = parseFloat(income);
  const hasValidIncome = !isNaN(numericIncome) && numericIncome > 0;
  const monthlyIncome = hasValidIncome
    ? incomeType === "monthly"
      ? numericIncome
      : numericIncome / 12
    : 0;
  const suggestedMonthly = Math.round(monthlyIncome * 0.006 * 100) / 100;
  const suggestedAnnual = Math.round(suggestedMonthly * 12 * 100) / 100;

  return (
    <div className={`mb-8 rounded-[20px] border-2 ${accent.border} bg-page p-6 min-[810px]:p-8`}>
      {/* Header */}
      <p className={`mb-5 text-left ${overlineClass}`}>Calculate your suggested dues</p>

      {/* Inputs — single row on desktop */}
      <div className="flex flex-col gap-3 min-[640px]:flex-row min-[640px]:items-end">
        {/* Currency */}
        <div className="flex-1">
          <label htmlFor="calc-currency" className={`mb-1.5 block ${labelClass}`}>
            Currency
          </label>
          <div className="relative">
            <select
              id="calc-currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className={`w-full appearance-none rounded-lg border border-butter bg-sand px-3 py-2.5 pr-8 text-sm text-ink focus:outline-none focus:ring-1 ${accent.focusBorder} ${accent.ring}`}
            >
              {CURRENCIES.map((curr) => (
                <option key={curr.code} value={curr.code}>
                  {curr.symbol} {curr.name} ({curr.code})
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-ink-muted">
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2 4L6 8L10 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>
        </div>

        {/* Period toggle */}
        <div>
          <p className={`mb-1.5 ${labelClass}`}>Period</p>
          <div className="flex rounded-lg border border-butter bg-sand p-0.5">
            {(["monthly", "annual"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setIncomeType(type)}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-all duration-150 ${
                  incomeType === type
                    ? "bg-ink text-white shadow-sm"
                    : "text-ink-secondary hover:text-ink"
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Amount */}
        <div className="flex-1">
          <label htmlFor="calc-income" className={`mb-1.5 block ${labelClass}`}>
            {incomeType === "monthly" ? "Monthly income" : "Annual income"}
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-ink-muted">
              {currencyData.symbol}
            </span>
            <input
              id="calc-income"
              type="number"
              min={0}
              step="any"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              placeholder={incomeType === "annual" ? "60 000" : "5 000"}
              className={`w-full rounded-lg border border-butter bg-sand py-2.5 pl-7 pr-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 ${accent.focusBorder} ${accent.ring}`}
            />
          </div>
        </div>
      </div>

      {/* Results */}
      {hasValidIncome ? (
        <div className="mt-5 grid grid-cols-2 gap-3" aria-live="polite">
          <div className="rounded-[12px] bg-sand px-5 py-4">
            <p className={`mb-1 ${resultLabelClass}`}>Monthly dues</p>
            <p className={`${resultFigureClass} ${accent.text}`}>
              {currencyData.symbol}
              {suggestedMonthly.toFixed(2)}
            </p>
            {!isUSD && (
              <p className={`mt-0.5 ${resultSubClass}`}>
                ~${Math.round(suggestedMonthly * currencyData.usdRate)} USD
              </p>
            )}
          </div>
          <div className="rounded-[12px] bg-sand px-5 py-4">
            <p className={`mb-1 ${resultLabelClass}`}>Annual dues</p>
            <p className={`${resultFigureClass} ${accent.text}`}>
              {currencyData.symbol}
              {suggestedAnnual.toFixed(2)}
            </p>
            {!isUSD && (
              <p className={`mt-0.5 ${resultSubClass}`}>
                ~${Math.round(suggestedAnnual * currencyData.usdRate)} USD
              </p>
            )}
          </div>
        </div>
      ) : (
        <p className={`mt-4 text-center ${emptyStateClass}`}>
          Enter your income above to see a suggested amount.
        </p>
      )}
    </div>
  );
}
