import { useState, type FormEvent } from "react";
import { Box, Typography, TextField, Button, CircularProgress } from "@mui/material";

export interface AboutYouData {
  name: string;
  email: string;
}

interface AboutYouStepProps {
  onContinue: (data: AboutYouData) => void;
  /** Pre-fills the fields when the visitor returns to this step from payment. */
  initialValues?: AboutYouData;
  /** Renders the "Next" button as a plain element matching `Button.astro`'s
   * `primary` variant (brand rose, `rounded-pill`, `ts-label` type) instead
   * of the legacy pages' hardcoded-green MUI button. The design-system pages
   * (`MembershipDues.tsx`) set this so the button matches every other CTA on
   * the page instead of clashing with the site's rose brand color. The
   * legacy pages (`LegacyJoinSection.tsx`) already use green CTAs elsewhere,
   * so they keep the default (`flatButton` omitted/false). */
  flatButton?: boolean;
  /** True while the parent is transitioning to the payment step. Shown as a
   * spinner on this button (rather than only in the payment panel below) so
   * the click gets feedback exactly where the visitor is looking, instead of
   * feedback appearing lower on the page once the panel swaps. */
  submitting?: boolean;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Step 1 of the membership join flow: collects name/email before the visitor
 * is handed to the Qgiv payment step. Validates on submit only, matching the
 * email format `/api/membership-complete.ts` validates server-side.
 */
export default function AboutYouStep({
  onContinue,
  initialValues,
  flatButton = false,
  submitting = false,
}: AboutYouStepProps) {
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
        disabled={submitting}
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
        disabled={submitting}
      />

      <Typography variant="body2" sx={{ color: "#374151", mt: 2, mb: 3, textAlign: "center" }}>
        You&apos;ll be redirected to our secure payment partner to complete your membership.
      </Typography>

      <Box sx={{ display: "flex", justifyContent: "center" }}>
        {flatButton ? (
          // Mirrors Button.astro's `primary` variant class-for-class (base +
          // md size + primary color) so this button reads as the same
          // component as every other CTA on the design-system pages, rather
          // than a one-off MUI element with its own color/shape/typography.
          <button
            type="submit"
            disabled={submitting}
            className="ts-label inline-flex min-h-[44px] min-w-[120px] items-center justify-center gap-2 rounded-pill border border-transparent bg-brand px-5 py-3.5 text-white transition-all duration-150 hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:scale-[0.98] disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-70 disabled:active:scale-100"
          >
            {submitting && (
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                aria-hidden="true"
              />
            )}
            {submitting ? "Loading…" : "Next"}
          </button>
        ) : (
          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            startIcon={
              submitting ? (
                <CircularProgress size={16} thickness={5} sx={{ color: "inherit" }} />
              ) : undefined
            }
            sx={{
              backgroundColor: "#168039",
              borderRadius: 999,
              px: 4,
              py: 1.5,
              minWidth: 120,
              fontWeight: 600,
              textTransform: "none",
              "&:hover": { backgroundColor: "#116b2f" },
              "&.Mui-disabled": {
                backgroundColor: "#168039",
                opacity: 0.7,
                color: "#fff",
              },
            }}
          >
            {submitting ? "Loading…" : "Next"}
          </Button>
        )}
      </Box>
    </Box>
  );
}
