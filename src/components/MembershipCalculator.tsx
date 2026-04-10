import { useState } from "react";
import {
  Box,
  TextField,
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

export default function MembershipCalculator() {
  const [incomeType, setIncomeType] = useState<"annual" | "monthly">("monthly");
  const [income, setIncome] = useState<string>("");
  const [currency, setCurrency] = useState<string>("USD");
  const [suggestedAmount, setSuggestedAmount] = useState<number | null>(null);

  const getCurrencyData = () => CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0];

  const calculateSuggestion = (value: string, type: "annual" | "monthly" = incomeType) => {
    const numericValue = parseFloat(value);
    if (isNaN(numericValue) || numericValue <= 0) {
      setSuggestedAmount(null);
      return;
    }
    const suggestion = type === "annual" ? numericValue / 2000 : numericValue / 167;
    setSuggestedAmount(Math.round(suggestion * 100) / 100);
  };

  const handleIncomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setIncome(value);
    calculateSuggestion(value);
  };

  const handleIncomeTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newType = e.target.value as "annual" | "monthly";
    setIncomeType(newType);
    if (income) calculateSuggestion(income, newType);
  };

  const handleCurrencyChange = (e: any) => {
    setCurrency(e.target.value);
  };

  const currencyData = getCurrencyData();
  const isUSD = currency === "USD";
  const usdMonthly = suggestedAmount !== null ? Math.round(suggestedAmount * currencyData.usdRate) : null;
  const annualAmount = suggestedAmount !== null ? Math.round(suggestedAmount * 12 * 100) / 100 : null;
  const usdAnnual = annualAmount !== null ? Math.round(annualAmount * currencyData.usdRate) : null;

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

      {/* Income Input */}
      <Box sx={{ mb: 1.5 }}>
        <TextField
          fullWidth
          type="number"
          value={income}
          onChange={handleIncomeChange}
          placeholder={incomeType === "annual" ? "e.g., 60000" : "e.g., 5000"}
          sx={{
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

      {/* Results */}
      {suggestedAmount !== null && (
        <Box sx={{ mt: 1.5, display: "flex", gap: 2, flexWrap: "wrap" }}>
          {/* Monthly */}
          <Box sx={resultBoxSx}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: "#166534", mb: 0.5, fontSize: "1rem" }}>
              Suggested Monthly Contribution:
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: "bold", color: "#168039", fontSize: "1.75rem" }}>
              {currencyData.symbol}{suggestedAmount.toFixed(2)}
              {!isUSD && usdMonthly !== null && (
                <Typography component="span" sx={{ fontWeight: 400, color: "#6b7280", fontSize: "1rem", ml: 1 }}>
                  (~${usdMonthly})
                </Typography>
              )}
            </Typography>
          </Box>

          {/* Annual — only when user selected annual income */}
          {incomeType === "annual" && annualAmount !== null && (
            <Box sx={resultBoxSx}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: "#166534", mb: 0.5, fontSize: "1rem" }}>
                Suggested Annual Contribution:
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: "bold", color: "#168039", fontSize: "1.75rem" }}>
                {currencyData.symbol}{annualAmount.toFixed(2)}
                {!isUSD && usdAnnual !== null && (
                  <Typography component="span" sx={{ fontWeight: 400, color: "#6b7280", fontSize: "1rem", ml: 1 }}>
                    (~${usdAnnual})
                  </Typography>
                )}
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {suggestedAmount !== null && (
        <Typography variant="body2" sx={{ mt: 1, color: "#4b5563", fontStyle: "italic", fontSize: "0.875rem" }}>
          This is a suggested amount based on your income. Please contribute what feels meaningful to you.
          {!isUSD && " USD equivalent is approximate."}
        </Typography>
      )}

      {income && suggestedAmount === null && (
        <Typography variant="body2" sx={{ mt: 1.5, color: "#dc2626", fontSize: "0.875rem" }}>
          Please enter a valid positive number
        </Typography>
      )}
    </Box>
  );
}
