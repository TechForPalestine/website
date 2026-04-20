import { useState } from "react";
import { Box, Slider, Typography, Select, MenuItem, FormControl, FormLabel } from "@mui/material";

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

const MIN_INCOME = 0;
const MAX_INCOME = 20000;
const STEP = 100;
const DEFAULT_INCOME = 5000;

export default function MembershipCalculator() {
  const [income, setIncome] = useState<number>(DEFAULT_INCOME);
  const [currency, setCurrency] = useState<string>("USD");

  const currencyData = CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0];
  const suggested = Math.round((income / 167) * 100) / 100;
  const isUSD = currency === "USD";
  const usdSuggested = Math.round(suggested * currencyData.usdRate);

  return (
    <Box
      sx={{
        maxWidth: 600,
        mx: "auto",
        borderRadius: 2,
        border: "1px solid #e5e7eb",
        backgroundColor: "white",
        p: 3,
        mb: 4,
      }}
    >
      <Typography
        variant="body1"
        component="h2"
        sx={{ fontWeight: "bold", color: "#1f2937", mb: 2.5, fontSize: "0.95rem" }}
      >
        Calculate Your Suggested Contribution
      </Typography>

      {/* Currency */}
      <Box sx={{ mb: 2.5 }}>
        <FormLabel sx={{ display: "block", mb: 1, fontWeight: 600, color: "#1f2937", fontSize: "0.875rem" }}>
          Currency
        </FormLabel>
        <FormControl size="small" fullWidth>
          <Select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            sx={{
              backgroundColor: "white",
              fontSize: "0.875rem",
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#d1d5db" },
              "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#9ca3af" },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#6b7280" },
            }}
          >
            {CURRENCIES.map((c) => (
              <MenuItem key={c.code} value={c.code} sx={{ fontSize: "0.875rem" }}>
                {c.symbol} {c.name} ({c.code})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Slider */}
      <Box sx={{ mb: 1 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", mb: 1 }}>
          <FormLabel sx={{ fontWeight: 600, color: "#1f2937", fontSize: "0.875rem" }}>
            Monthly Income
          </FormLabel>
          <Typography sx={{ fontSize: "1rem", fontWeight: 600, color: "#374151" }}>
            {currencyData.symbol}{income.toLocaleString()}{income === MAX_INCOME ? "+" : ""}
          </Typography>
        </Box>
        <Box sx={{ px: 0.5 }}>
          <Slider
            value={income}
            min={MIN_INCOME}
            max={MAX_INCOME}
            step={STEP}
            onChange={(_, val) => setIncome(val as number)}
            sx={{
              color: "#9ca3af",
              height: 4,
              "& .MuiSlider-thumb": {
                width: 20,
                height: 20,
                backgroundColor: "#fff",
                border: "none",
                boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
                "&:hover, &.Mui-focusVisible": { boxShadow: "0 1px 6px rgba(0,0,0,0.35)" },
              },
              "& .MuiSlider-track": { height: 4, border: "none", color: "#6b7280" },
              "& .MuiSlider-rail": { height: 4, color: "#e5e7eb" },
            }}
          />
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography sx={{ fontSize: "0.75rem", color: "#9ca3af" }}>{currencyData.symbol}0</Typography>
          <Typography sx={{ fontSize: "0.75rem", color: "#9ca3af" }}>{currencyData.symbol}{MAX_INCOME.toLocaleString()}+</Typography>
        </Box>
      </Box>

      {/* Result */}
      {income > 0 && (
        <Box
          sx={{
            mt: 2.5,
            p: 2,
            backgroundColor: "#f0fdf4",
            borderRadius: 2,
            border: "1px solid #bbf7d0",
          }}
        >
          <Typography sx={{ fontWeight: 600, color: "#166534", mb: 0.5, fontSize: "0.875rem" }}>
            Suggested Monthly Contribution
          </Typography>
          <Typography sx={{ fontSize: "1.75rem", fontWeight: "bold", color: "#168039" }}>
            {currencyData.symbol}{suggested.toFixed(2)}
            {!isUSD && (
              <Typography component="span" sx={{ fontWeight: 400, color: "#6b7280", fontSize: "1rem", ml: 1 }}>
                (~${usdSuggested})
              </Typography>
            )}
          </Typography>
          <Typography sx={{ fontSize: "0.8rem", color: "#4b5563", mt: 0.5, fontStyle: "italic" }}>
            ≈ one hour of your time. Contribute what feels right to you.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
