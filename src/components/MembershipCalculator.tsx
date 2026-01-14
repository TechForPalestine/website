import { useState } from "react";
import {
  Card,
  CardContent,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  Box,
  Select,
  MenuItem,
  InputLabel,
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
  const [incomeType, setIncomeType] = useState<"annual" | "monthly">("annual");
  const [income, setIncome] = useState<string>("");
  const [currency, setCurrency] = useState<string>("USD");
  const [suggestedAmount, setSuggestedAmount] = useState<number | null>(null);

  const getCurrencySymbol = () => {
    return CURRENCIES.find((c) => c.code === currency)?.symbol || "$";
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
    <Card
      elevation={3}
      sx={{
        maxWidth: 600,
        mx: "auto",
        borderRadius: 2,
        border: "2px solid",
        borderColor: "success.main",
      }}
    >
      <CardContent sx={{ p: 4 }}>
        <Typography
          variant="h5"
          component="h2"
          gutterBottom
          sx={{ fontWeight: "bold", color: "text.primary", mb: 3 }}
        >
          Calculate Your Suggested Contribution
        </Typography>

        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel id="currency-select-label">Currency</InputLabel>
          <Select
            labelId="currency-select-label"
            value={currency}
            label="Currency"
            onChange={handleCurrencyChange}
          >
            {CURRENCIES.map((curr) => (
              <MenuItem key={curr.code} value={curr.code}>
                {curr.symbol} {curr.name} ({curr.code})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl component="fieldset" sx={{ mb: 3, width: "100%" }}>
          <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600 }}>
            Income Period
          </FormLabel>
          <RadioGroup
            row
            value={incomeType}
            onChange={handleIncomeTypeChange}
            sx={{ gap: 2 }}
          >
            <FormControlLabel
              value="annual"
              control={<Radio />}
              label="Annual Income"
            />
            <FormControlLabel
              value="monthly"
              control={<Radio />}
              label="Monthly Income"
            />
          </RadioGroup>
        </FormControl>

        <TextField
          fullWidth
          label={
            incomeType === "annual"
              ? `Annual Income (in thousands ${getCurrencySymbol()})`
              : `Monthly Income (in thousands ${getCurrencySymbol()})`
          }
          type="number"
          value={income}
          onChange={handleIncomeChange}
          variant="outlined"
          placeholder="e.g., 50 for 50k"
          sx={{ mb: 4 }}
          InputProps={{
            inputProps: { min: 0, step: "any" },
          }}
          helperText="Enter your income in thousands (e.g., 50 = 50,000)"
        />

        {suggestedAmount !== null && (
          <Box
            sx={{
              mt: 3,
              p: 3,
              backgroundColor: "success.50",
              borderRadius: 2,
              border: "2px solid",
              borderColor: "success.main",
            }}
          >
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, color: "success.dark", mb: 1 }}
            >
              Suggested Monthly Contribution:
            </Typography>
            <Typography
              variant="h4"
              sx={{ fontWeight: "bold", color: "success.main" }}
            >
              {getCurrencySymbol()}{suggestedAmount.toFixed(2)}
            </Typography>
            <Typography
              variant="body2"
              sx={{ mt: 2, color: "text.secondary", fontStyle: "italic" }}
            >
              This is a suggested amount based on your income. Please contribute what feels
              meaningful to you.
            </Typography>
          </Box>
        )}

        {income && suggestedAmount === null && (
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            Please enter a valid positive number
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
