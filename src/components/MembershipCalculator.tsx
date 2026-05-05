import { useState } from "react";
import {
  Box,
  TextField,
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
  const [income, setIncome] = useState<string>("");
  const [currency, setCurrency] = useState<string>("USD");

  const handleIncomeTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIncomeType(e.target.value as "annual" | "monthly");
  };

  const currencyData = CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0];
  const isUSD = currency === "USD";
  const numericIncome = parseFloat(income);
  const hasValidIncome = !isNaN(numericIncome) && numericIncome > 0;
  const monthlyIncome = hasValidIncome ? (incomeType === "monthly" ? numericIncome : numericIncome / 12) : 0;
  const suggestedMonthly = Math.round((monthlyIncome * 0.006) * 100) / 100;
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
        <TextField
          size="small"
          type="number"
          value={income}
          onChange={(e) => setIncome(e.target.value)}
          placeholder={incomeType === "annual" ? "e.g. 60000" : "e.g. 5000"}
          sx={{
            flex: 1,
            "& .MuiOutlinedInput-root": {
              backgroundColor: "white",
              "& fieldset": { borderColor: "#d1d5db" },
              "&:hover fieldset": { borderColor: "#9ca3af" },
              "&.Mui-focused fieldset": { borderColor: "#168039" },
            },
          }}
          InputProps={{ inputProps: { min: 0, step: "any" } }}
        />
      </Box>

      {/* Results row */}
      {hasValidIncome && (
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
