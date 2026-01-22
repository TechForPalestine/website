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
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real" },
  { code: "MXN", symbol: "MX$", name: "Mexican Peso" },
  { code: "ZAR", symbol: "R", name: "South African Rand" },
];

export default function MembershipCalculator() {
  const [incomeType, setIncomeType] = useState<"annual" | "monthly">("monthly");
  const [income, setIncome] = useState<string>("");
  const [currency, setCurrency] = useState<string>("USD");
  const [suggestedAmount, setSuggestedAmount] = useState<number | null>(null);

  const getCurrencySymbol = () => {
    return CURRENCIES.find((c) => c.code === currency)?.symbol || "$";
  };

  const getCurrencyName = () => {
    const curr = CURRENCIES.find((c) => c.code === currency);
    return curr ? `${curr.symbol} ${curr.name} (${curr.code})` : "$ US Dollar (USD)";
  };

  const getIncomeLabel = () => {
    const currSymbol = getCurrencySymbol();
    return incomeType === "annual"
      ? `Annual Income (in thousands ${currSymbol})`
      : `Monthly Income (in thousands ${currSymbol})`;
  };

  const calculateSuggestion = (value: string) => {
    const numericValue = parseFloat(value);

    if (isNaN(numericValue) || numericValue <= 0) {
      setSuggestedAmount(null);
      return;
    }

    // Convert from thousands to actual value
    const actualValue = numericValue * 1000;

    let suggestion: number;
    if (incomeType === "annual") {
      suggestion = actualValue / 2000;
    } else {
      suggestion = actualValue / 167;
    }

    setSuggestedAmount(Math.round(suggestion * 100) / 100); // Round to 2 decimal places
  };

  const handleIncomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setIncome(value);
    calculateSuggestion(value);
  };

  const handleIncomeTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newType = e.target.value as "annual" | "monthly";
    setIncomeType(newType);
    if (income) {
      calculateSuggestion(income);
    }
  };

  const handleCurrencyChange = (e: any) => {
    setCurrency(e.target.value);
  };

  return (
    <Box
      sx={{
        maxWidth: 600,
        mx: "auto",
        borderRadius: 3,
        border: "4px solid #168039",
        backgroundColor: "white",
        p: 3,
      }}
    >
      <Typography
        variant="h5"
        component="h2"
        sx={{
          fontWeight: "bold",
          color: "#1f2937",
          mb: 2.5,
          fontSize: "1.75rem",
        }}
      >
        Calculate Your Suggested Contribution
      </Typography>

      {/* Currency */}
      <Box sx={{ mb: 2 }}>
        <FormLabel
          sx={{
            display: "block",
            mb: 1,
            fontWeight: 600,
            color: "#1f2937",
            fontSize: "0.95rem",
          }}
        >
          Currency
        </FormLabel>
        <FormControl fullWidth>
          <Select
            value={currency}
            onChange={handleCurrencyChange}
            displayEmpty
            sx={{
              backgroundColor: "white",
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "#d1d5db",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "#9ca3af",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "#168039",
              },
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
      <Box sx={{ mb: 2 }}>
        <FormLabel
          component="legend"
          sx={{
            display: "block",
            mb: 1,
            fontWeight: 600,
            color: "#1f2937",
            fontSize: "0.95rem",
          }}
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
              "& .MuiFormControlLabel-label": {
                fontSize: "0.95rem",
                color: "#374151",
              },
              "& .MuiRadio-root": {
                color: "#9ca3af",
                "&.Mui-checked": {
                  color: "#168039",
                },
              },
            }}
          >
            <FormControlLabel value="annual" control={<Radio />} label="Annual Income" />
            <FormControlLabel value="monthly" control={<Radio />} label="Monthly Income" />
          </RadioGroup>
        </FormControl>
      </Box>

      {/* Income Input */}
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          type="number"
          value={income}
          onChange={handleIncomeChange}
          placeholder="e.g., 50 for 50k"
          sx={{
            "& .MuiOutlinedInput-root": {
              backgroundColor: "white",
              "& fieldset": {
                borderColor: "#d1d5db",
              },
              "&:hover fieldset": {
                borderColor: "#9ca3af",
              },
              "&.Mui-focused fieldset": {
                borderColor: "#168039",
              },
            },
          }}
          InputProps={{
            inputProps: { min: 0, step: "any" },
          }}
        />
        <Typography
          variant="caption"
          sx={{
            display: "block",
            mt: 0.5,
            color: "#6b7280",
            fontStyle: "italic",
            fontSize: "0.875rem",
          }}
        >
          Enter your income in thousands (e.g., 50 = 50,000)
        </Typography>
      </Box>

      {/* Suggested Amount Result */}
      {suggestedAmount !== null && (
        <Box
          sx={{
            mt: 2.5,
            p: 2.5,
            backgroundColor: "#f0fdf4",
            borderRadius: 2,
            border: "2px solid #168039",
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: "#166534",
              mb: 0.5,
              fontSize: "1.125rem",
            }}
          >
            Suggested Monthly Contribution:
          </Typography>
          <Typography
            variant="h4"
            sx={{
              fontWeight: "bold",
              color: "#168039",
              fontSize: "2rem",
            }}
          >
            {getCurrencySymbol()}
            {suggestedAmount.toFixed(2)}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              mt: 1.5,
              color: "#4b5563",
              fontStyle: "italic",
              fontSize: "0.875rem",
            }}
          >
            This is a suggested amount based on your income. Please contribute what feels
            meaningful to you.
          </Typography>
        </Box>
      )}

      {income && suggestedAmount === null && (
        <Typography
          variant="body2"
          sx={{
            mt: 1.5,
            color: "#dc2626",
            fontSize: "0.875rem",
          }}
        >
          Please enter a valid positive number
        </Typography>
      )}
    </Box>
  );
}
