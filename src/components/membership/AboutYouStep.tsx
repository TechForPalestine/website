import { useState, type FormEvent } from "react";
import { Box, Typography, TextField, Button } from "@mui/material";

export interface AboutYouData {
  name: string;
  email: string;
}

interface AboutYouStepProps {
  onContinue: (data: AboutYouData) => void;
  /** Pre-fills the fields when the visitor returns to this step from payment. */
  initialValues?: AboutYouData;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Step 1 of the membership join flow: collects name/email before the visitor
 * is handed to the Qgiv payment step. Validates on submit only, matching the
 * email format `/api/membership-complete.ts` validates server-side.
 */
export default function AboutYouStep({ onContinue, initialValues }: AboutYouStepProps) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [email, setEmail] = useState(initialValues?.email ?? "");
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    const nextNameError = trimmedName.length === 0 ? "Please enter your name." : "";
    const nextEmailError = EMAIL_PATTERN.test(trimmedEmail)
      ? ""
      : "Please enter a valid email address.";

    setNameError(nextNameError);
    setEmailError(nextEmailError);

    if (nextNameError || nextEmailError) return;

    onContinue({ name: trimmedName, email: trimmedEmail });
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 480 }}>
      <TextField
        label="Name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        error={Boolean(nameError)}
        helperText={nameError}
        fullWidth
        margin="normal"
        autoComplete="name"
      />

      <TextField
        label="Email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={Boolean(emailError)}
        helperText={emailError}
        fullWidth
        margin="normal"
        autoComplete="email"
      />

      <Typography variant="body2" sx={{ color: "#374151", mt: 2, mb: 3, textAlign: "center" }}>
        You&apos;ll be redirected to our secure payment partner to complete your membership.
      </Typography>

      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <Button
          type="submit"
          variant="contained"
          sx={{
            backgroundColor: "#168039",
            borderRadius: 999,
            px: 4,
            py: 1.5,
            fontWeight: 600,
            textTransform: "none",
            "&:hover": { backgroundColor: "#116b2f" },
          }}
        >
          Next
        </Button>
      </Box>
    </Box>
  );
}
