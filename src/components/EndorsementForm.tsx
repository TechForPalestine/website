import { useState } from "react";
import { useForm } from "react-hook-form";
import TextField from "@mui/material/TextField";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";

type FormData = {
  contactName: string;
  contactEmail: string;
  organizationName: string;
  organizationWebsite: string;
  request: string;
  campaignPurpose: string;
  campaignLink: string;
  isT4PProject: boolean;
};

const inputSx = {
  backgroundColor: "white",
  borderRadius: "8px",
  "& .MuiInputBase-input": {
    backgroundColor: "white",
  },
};

export default function EndorsementForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: { isT4PProject: false },
  });

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/endorsement-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error || "Submission failed");
      }

      reset();
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {/* Contact info row */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3 }}>
          <TextField
            label={
              <span>
                Contact name <span style={{ color: "red" }}>*</span>
              </span>
            }
            fullWidth
            sx={inputSx}
            error={!!errors.contactName}
            helperText={errors.contactName?.message}
            {...register("contactName", { required: "Contact name is required" })}
          />
          <TextField
            label={
              <span>
                Contact email <span style={{ color: "red" }}>*</span>
              </span>
            }
            type="email"
            fullWidth
            sx={inputSx}
            error={!!errors.contactEmail}
            helperText={errors.contactEmail?.message}
            {...register("contactEmail", {
              required: "Contact email is required",
              pattern: { value: /^\S+@\S+\.\S+$/, message: "Invalid email address" },
            })}
          />
        </Box>

        {/* Organization row */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3 }}>
          <TextField
            label={
              <span>
                Organization name <span style={{ color: "red" }}>*</span>
              </span>
            }
            fullWidth
            sx={inputSx}
            error={!!errors.organizationName}
            helperText={errors.organizationName?.message}
            {...register("organizationName", { required: "Organization name is required" })}
          />
          <TextField
            label={
              <span>
                Organization website <span style={{ color: "red" }}>*</span>
              </span>
            }
            type="url"
            fullWidth
            sx={inputSx}
            error={!!errors.organizationWebsite}
            helperText={errors.organizationWebsite?.message}
            {...register("organizationWebsite", {
              required: "Organization website is required",
              pattern: {
                value: /^https?:\/\/.+/,
                message: "Must be a valid URL starting with http:// or https://",
              },
            })}
          />
        </Box>

        {/* Request */}
        <TextField
          label={
            <span>
              Your request <span style={{ color: "red" }}>*</span>
            </span>
          }
          fullWidth
          sx={inputSx}
          error={!!errors.request}
          helperText={errors.request?.message || "Briefly describe what you're requesting from T4P"}
          {...register("request", { required: "Please describe your request" })}
        />

        {/* Campaign purpose */}
        <TextField
          label={
            <span>
              Purpose of your campaign <span style={{ color: "red" }}>*</span>
            </span>
          }
          fullWidth
          multiline
          minRows={4}
          sx={inputSx}
          error={!!errors.campaignPurpose}
          helperText={
            errors.campaignPurpose?.message || "Describe the goals and purpose of your campaign"
          }
          {...register("campaignPurpose", { required: "Campaign purpose is required" })}
        />

        {/* Campaign link */}
        <TextField
          label={
            <span>
              Campaign link <span style={{ color: "red" }}>*</span>
            </span>
          }
          type="url"
          fullWidth
          sx={inputSx}
          error={!!errors.campaignLink}
          helperText={errors.campaignLink?.message || "Link to your campaign website or page"}
          {...register("campaignLink", {
            required: "Campaign link is required",
            pattern: {
              value: /^https?:\/\/.+/,
              message: "Must be a valid URL starting with http:// or https://",
            },
          })}
        />

        {/* T4P project checkbox */}
        <FormControlLabel
          control={<Checkbox {...register("isT4PProject")} />}
          label="This campaign is an existing Tech for Palestine project"
        />

        {error && <Alert severity="error">{error}</Alert>}

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{
              backgroundColor: "#168039",
              "&:hover": { backgroundColor: "#0f5c2a" },
              px: 4,
              py: 1.5,
              fontWeight: 600,
            }}
          >
            {submitting ? "Submitting..." : "Submit Endorsement Request"}
          </Button>
          {submitted && (
            <Alert severity="success">
              <strong>Thank you!</strong> Your endorsement request has been received. We'll review it and be in touch soon.
            </Alert>
          )}
        </Box>
      </Box>
    </form>
  );
}
