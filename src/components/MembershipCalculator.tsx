import { useState } from "react";
import {
  Box,
  Slider,
  FormControl,
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

const rowSx = {
  display: "flex",
  alignItems: "center",
  gap: 1.5,
  mb: 1,
};

const labelSx = {
  fontSize: "0.875rem",
  fontWeight: 600,
  color: "#1f2937",
  whiteSpace: "nowrap",
  minWidth: 110,
};

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

  const currencyData = CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0];
  const isUSD = currency === "USD";
  const monthlyIncome = incomeType === "monthly" ? income : income / 12;
  const suggestedMonthly = Math.round((monthlyIncome / 167) * 100) / 100;
  const suggestedAnnual = Math.round(suggestedMonthly * 12 * 100) / 100;

  return (
    <Box
      sx={{
        maxWidth: 600,
        mx: "auto",
        borderRadius: 2,
        border: "2px solid #168039",
        backgroundColor: "white",
        p: 1.5,
        mb: 4,
      }}
    >
      {/* Currency row */}
      <Box sx={rowSx}>
        <Typography sx={labelSx}>Currency</Typography>
        <FormControl size="small" sx={{ flex: 1 }}>
          <Select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            sx={{
              fontSize: "0.875rem",
              backgroundColor: "white",
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#d1d5db" },
              "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#9ca3af" },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#168039" },
            }}
          >
            {CURRENCIES.map((curr) => (
              <MenuItem key={curr.code} value={curr.code} sx={{ fontSize: "0.875rem" }}>
                {curr.symbol} {curr.name} ({curr.code})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Income row */}
      <Box sx={rowSx}>
        <Box sx={{ minWidth: 110 }}>
          <Typography sx={labelSx}>Income</Typography>
          <FormControl component="fieldset">
            <RadioGroup
              row
              value={incomeType}
              onChange={handleIncomeTypeChange}
              sx={{
                flexWrap: "nowrap",
                gap: 2,
                "& .MuiFormControlLabel-label": { fontSize: "0.75rem", color: "#374151" },
                "& .MuiFormControlLabel-root": { mr: 0 },
                "& .MuiRadio-root": { p: 0.5, color: "#9ca3af", "&.Mui-checked": { color: "#168039" } },
              }}
            >
              <FormControlLabel value="monthly" control={<Radio size="small" />} label="Monthly" />
              <FormControlLabel value="annual" control={<Radio size="small" />} label="Annual" />
            </RadioGroup>
          </FormControl>
        </Box>
        <Box sx={{ flex: 1, display: "flex", alignItems: "center", gap: 1 }}>
          <Box sx={{ flex: 1, px: 0.5 }}>
            <Slider
              value={income}
              min={0}
              max={max}
              step={step}
              onChange={(_, val) => setIncome(val as number)}
              sx={{
                color: "#9ca3af",
                height: 4,
                py: "10px",
                "& .MuiSlider-thumb": {
                  width: 18,
                  height: 18,
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
          <Typography sx={{ fontSize: "0.875rem", fontWeight: 600, color: "#374151", whiteSpace: "nowrap", minWidth: 70, textAlign: "right" }}>
            {currencyData.symbol}{income.toLocaleString()}{income === max ? "+" : ""}
          </Typography>
        </Box>
      </Box>

      {/* Results row */}
      {income > 0 && (
        <Box
          sx={{
            display: "flex",
            gap: 1,
            mt: 0.5,
            p: 1.5,
            backgroundColor: "#f0fdf4",
            borderRadius: 1.5,
            border: "2px solid #168039",
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: "#166534", lineHeight: 1.3 }}>
              Suggested Monthly Dues:
            </Typography>
            <Typography sx={{ fontSize: "1.4rem", fontWeight: "bold", color: "#168039", lineHeight: 1.2 }}>
              {currencyData.symbol}{suggestedMonthly.toFixed(2)}
            </Typography>
            {!isUSD && (
              <Typography sx={{ fontSize: "0.7rem", color: "#6b7280" }}>
                (~${Math.round(suggestedMonthly * currencyData.usdRate)} USD)
              </Typography>
            )}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: "#166534", lineHeight: 1.3 }}>
              Suggested Annual Dues:
            </Typography>
            <Typography sx={{ fontSize: "1.4rem", fontWeight: "bold", color: "#168039", lineHeight: 1.2 }}>
              {currencyData.symbol}{suggestedAnnual.toFixed(2)}
            </Typography>
            {!isUSD && (
              <Typography sx={{ fontSize: "0.7rem", color: "#6b7280" }}>
                (~${Math.round(suggestedAnnual * currencyData.usdRate)} USD)
              </Typography>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}
