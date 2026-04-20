import { useState } from "react";
import {
  Box,
  Slider,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  Select,
  MenuItem,
} from "@mui/material";

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

const MAX_MONTHLY = 20000;
const MAX_ANNUAL = 240000;

export default function MembershipCalculator() {
  const [incomeType, setIncomeType] = useState<"annual" | "monthly">("monthly");
  const [income, setIncome] = useState<number>(5000);
  const [currency, setCurrency] = useState<string>("USD");

  const max = incomeType === "monthly" ? MAX_MONTHLY : MAX_ANNUAL;
  const step = incomeType === "monthly" ? 100 : 1000;

  const handleIncomeTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newType = e.target.value as "annual" | "monthly";
    setIncomeType(newType);
    setIncome(newType === "monthly" ? 5000 : 60000);
  };

  const handleCurrencyChange = (e: any) => {
    setCurrency(e.target.value);
  };

  const currencyData = CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0];
  const isUSD = currency === "USD";
  const monthlyIncome = incomeType === "monthly" ? income : income / 12;
  const suggestedAmount = Math.round((monthlyIncome / 167) * 100) / 100;
  const usdMonthly = Math.round(suggestedAmount * currencyData.usdRate);
  const annualAmount = Math.round(suggestedAmount * 12 * 100) / 100;
  const usdAnnual = Math.round(annualAmount * currencyData.usdRate);

  const resultBoxSx = {
    flex: 1,
    p: 2,
    backgroundColor: "#f0fdf4",
    borderRadius: 2,
    border: "2px solid #168039",
  };

  return (
    <Box
      sx={{
        maxWidth: 600,
        mx: "auto",
        borderRadius: 2,
        border: "2px solid #168039",
        backgroundColor: "white",
        p: 2,
        mb: 4,
      }}
    >
      <Typography
        variant="body1"
        component="h2"
        sx={{ fontWeight: "bold", color: "#1f2937", mb: 1.5, fontSize: "0.95rem" }}
      >
        Calculate Your Suggested Contribution
      </Typography>

      {/* Currency */}
      <Box sx={{ mb: 1.5 }}>
        <FormLabel sx={{ display: "block", mb: 1, fontWeight: 600, color: "#1f2937", fontSize: "0.95rem" }}>
          Currency
        </FormLabel>
        <FormControl fullWidth>
          <Select
            value={currency}
            onChange={handleCurrencyChange}
            displayEmpty
            sx={{
              backgroundColor: "white",
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#d1d5db" },
              "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#9ca3af" },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#168039" },
            }}
          >
            {CURRENCIES.map((curr) => (
              <MenuItem key={curr.code} value={curr.code}>
                {curr.symbol} {curr.name} ({curr.code})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Income Period */}
      <Box sx={{ mb: 1.5 }}>
        <FormLabel
          component="legend"
          sx={{ display: "block", mb: 1, fontWeight: 600, color: "#1f2937", fontSize: "0.95rem" }}
        >
          Income Period
        </FormLabel>
        <FormControl component="fieldset">
          <RadioGroup
            row
            value={incomeType}
            onChange={handleIncomeTypeChange}
            sx={{
              gap: 1,
              "& .MuiFormControlLabel-label": { fontSize: "0.95rem", color: "#374151" },
              "& .MuiRadio-root": { color: "#9ca3af", "&.Mui-checked": { color: "#168039" } },
            }}
          >
            <FormControlLabel value="annual" control={<Radio />} label="Annual Income" />
            <FormControlLabel value="monthly" control={<Radio />} label="Monthly Income" />
          </RadioGroup>
        </FormControl>
      </Box>

      {/* Income Slider */}
      <Box sx={{ mb: 1.5 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", mb: 1 }}>
          <FormLabel sx={{ fontWeight: 600, color: "#1f2937", fontSize: "0.95rem" }}>
            {incomeType === "monthly" ? "Monthly" : "Annual"} Income
          </FormLabel>
          <Typography sx={{ fontSize: "0.95rem", fontWeight: 600, color: "#374151" }}>
            {currencyData.symbol}{income.toLocaleString()}{income === max ? "+" : ""}
          </Typography>
        </Box>
        <Box sx={{ px: 0.5 }}>
          <Slider
            value={income}
            min={0}
            max={max}
            step={step}
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
          <Typography sx={{ fontSize: "0.75rem", color: "#9ca3af" }}>{currencyData.symbol}{max.toLocaleString()}+</Typography>
        </Box>
      </Box>

      {/* Results */}
      {income > 0 && (
        <Box sx={{ mt: 1.5, display: "flex", gap: 2, flexWrap: "wrap" }}>
          {/* Monthly */}
          <Box sx={resultBoxSx}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: "#166534", mb: 0.5, fontSize: "1rem" }}>
              Suggested Monthly Contribution:
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: "bold", color: "#168039", fontSize: "1.75rem" }}>
              {currencyData.symbol}{suggestedAmount.toFixed(2)}
              {!isUSD && (
                <Typography component="span" sx={{ fontWeight: 400, color: "#6b7280", fontSize: "1rem", ml: 1 }}>
                  (~${usdMonthly})
                </Typography>
              )}
            </Typography>
          </Box>

          {/* Annual — only when user selected annual income */}
          {incomeType === "annual" && (
            <Box sx={resultBoxSx}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: "#166534", mb: 0.5, fontSize: "1rem" }}>
                Suggested Annual Contribution:
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: "bold", color: "#168039", fontSize: "1.75rem" }}>
                {currencyData.symbol}{annualAmount.toFixed(2)}
                {!isUSD && (
                  <Typography component="span" sx={{ fontWeight: 400, color: "#6b7280", fontSize: "1rem", ml: 1 }}>
                    (~${usdAnnual})
                  </Typography>
                )}
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {income > 0 && (
        <Typography variant="body2" sx={{ mt: 1, color: "#4b5563", fontStyle: "italic", fontSize: "0.875rem" }}>
          This is a suggested amount based on your income. Please contribute what feels meaningful to you.
          {!isUSD && " USD equivalent is approximate."}
        </Typography>
      )}
    </Box>
  );
}
