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
  name: string;
  email: string;
  company: string;
  position: string;
  linkedin: string;
  agreement: boolean;
};

const inputSx = {
  backgroundColor: "white",
  borderRadius: "8px",
  "& .MuiInputBase-input": {
    backgroundColor: "white",
  },
};

export default function PledgeForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: { agreement: false },
  });

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    setError(null);

    try {
      const body = new FormData();
      body.set("name", data.name);
      body.set("email", data.email);
      body.set("company", data.company);
      body.set("position", data.position);
      body.set("linkedin", data.linkedin);
      if (data.agreement) body.set("agreement", "on");

      const response = await fetch("/api/e4p-pledge-sign", {
        method: "POST",
        body,
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
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3 }}>
          <TextField
            label={
              <span>
                Name <span style={{ color: "#AB4956" }}>*</span>
              </span>
            }
            fullWidth
            sx={inputSx}
            error={!!errors.name}
            helperText={errors.name?.message}
            {...register("name", { required: "Name is required" })}
          />
          <TextField
            label={
              <span>
                Email <span style={{ color: "#AB4956" }}>*</span>
              </span>
            }
            type="email"
            fullWidth
            sx={inputSx}
            error={!!errors.email}
            helperText={errors.email?.message}
            {...register("email", {
              required: "Email is required",
              pattern: { value: /^\S+@\S+\.\S+$/, message: "Invalid email address" },
            })}
          />
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3 }}>
          <TextField
            label={
              <span>
                Your company <span style={{ color: "#AB4956" }}>*</span>
              </span>
            }
            fullWidth
            sx={inputSx}
            error={!!errors.company}
            helperText={errors.company?.message}
            {...register("company", { required: "Company is required" })}
          />
          <TextField
            label={
              <span>
                Your position <span style={{ color: "#AB4956" }}>*</span>
              </span>
            }
            fullWidth
            sx={inputSx}
            error={!!errors.position}
            helperText={errors.position?.message}
            {...register("position", { required: "Position is required" })}
          />
        </Box>

        <TextField
          label={
            <span>
              LinkedIn URL <span style={{ color: "#AB4956" }}>*</span>
            </span>
          }
          type="url"
          fullWidth
          placeholder="https://linkedin.com/in/your-profile"
          sx={inputSx}
          error={!!errors.linkedin}
          helperText={errors.linkedin?.message}
          {...register("linkedin", {
            required: "LinkedIn URL is required",
            pattern: {
              value: /^https?:\/\/.+/,
              message: "Must be a valid URL starting with http:// or https://",
            },
          })}
        />

        <FormControlLabel
          control={<Checkbox {...register("agreement", { required: true })} />}
          label="I agree that my submitted data will be processed and stored by Entrepreneurs for Palestine and that my name, position and company will be listed under the Signatories section of this pledge."
        />
        {errors.agreement && (
          <Alert severity="error" sx={{ mt: -2 }}>
            You must agree before signing the pledge.
          </Alert>
        )}

        {error && <Alert severity="error">{error}</Alert>}

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{
              backgroundColor: "#AB4956",
              "&:hover": { backgroundColor: "#D35464" },
              px: 4,
              py: 1.5,
              fontWeight: 600,
            }}
          >
            {submitting ? "Signing..." : "Sign pledge"}
          </Button>
          {submitted && (
            <Alert severity="success">
              <strong>Thank you for signing the pledge.</strong> We will include you in the list of
              signatories once your submission has been verified.
            </Alert>
          )}
        </Box>
      </Box>
    </form>
  );
}
