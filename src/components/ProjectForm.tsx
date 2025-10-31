import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import {
  Backdrop,
  CircularProgress,
  Grid,
  Typography,
  Button,
  Box,
  Stack,
  Alert,
  Divider,
} from "@mui/material";
import { RenderFormFields } from "../components/inputs-mapping";
import FormProvider from "../components/hook-form";
import { transformObject } from "../utils/helpers";
import { fetchFormFields, submitForm } from "../store/api";

export const defaultValues = {};

const ProjectForm = () => {
  const methods = useForm({ defaultValues, mode: "onSubmit" });

  const {
    control,
    handleSubmit,
    formState: { isSubmitting, errors },
    setError,
  } = methods;
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setErrorState] = useState<string | null>(null);
  const [submissionErrors, setSubmissionErrors] = useState<any[]>([]);

  useEffect(() => {
    const loadFormFields = async () => {
      setLoading(true);
      try {
        const { data } = await fetchFormFields(
          "/incubator_management.api.meta.project_application"
        );
        setFields(data?.fields || []);
      } catch (err: any) {
        setErrorState("Failed to load form fields.");
      } finally {
        setLoading(false);
      }
    };
    loadFormFields();
  }, []);

  const onSubmit = handleSubmit(async (records) => {
    const res = await submitForm(
      "/incubator_management.api.applications.project.apply",
      transformObject(records)
    );
    const { message, hasErrors, errors: apiErrors } = res;

    if (hasErrors) {
      setSubmissionErrors(apiErrors);
      apiErrors.forEach((err: any) => {
        if (err.field) {
          setError(err.field, { type: "server", message: err.message });
        }
      });
    } else {
      window.location.href = "/success";
      // navigate('/success', { state: { message } });
    }
  });

  const structuredSections: any[] = [];
  let currentSection: any = { title: "", columns: [[]] };

  fields.forEach((field: any) => {
    if (field.fieldtype === "Section Break") {
      if (currentSection.columns.some((col: any[]) => col.length > 0)) {
        structuredSections.push(currentSection);
      }
      currentSection = { title: field.label || " ", columns: [[]] };
    } else if (field.fieldtype === "Column Break") {
      currentSection.columns.push([]);
    } else {
      currentSection.columns[currentSection.columns.length - 1].push(field);
    }
  });

  if (currentSection.columns.some((col: any[]) => col.length > 0)) {
    structuredSections.push(currentSection);
  }

  return (
    <Box sx={{ p: 10 }}>
      {/* Header Section */}
      <Box sx={{ textAlign: "center" }}>
        <Typography variant="h4" sx={{ fontWeight: "bold" }}>
          Build a Project with Us
        </Typography>
        <Typography
          variant="body2"
          sx={{
            mx: "auto",
            p: 3,
            fontSize: "1.1rem",
            lineHeight: 1.8,
          }}
        >
          Thank you very much for your interest in building a project in the{" "}
          <Typography component="span" sx={{ fontWeight: "bold", color: "green" }}>
            Tech For Palestine
          </Typography>{" "}
          incubator. Please be sure to provide as much information as possible to help us better
          understand what you are building. We look forward to working with you for a{" "}
          <Typography component="span" sx={{ fontWeight: "bold", color: "red" }}>
            free Palestine!
          </Typography>
          <br />
          <br />
          More{" "}
          <a href="/incubator" target="_blank" rel="noopener noreferrer">
            details about the incubator
          </a>{" "}
          and some{" "}
          <a href="/ideas" target="_blank" rel="noopener noreferrer">
            suggested project ideas
          </a>{" "}
          are available here.
        </Typography>
      </Box>

      {/* Form Container */}
      <Box
        sx={{
          mx: "auto",
          p: 5,
          mt: 6,
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          borderRadius: "12px",
          boxShadow: "0 8px 16px rgba(0, 0, 0, 0.1)",
        }}
      >
        {loading || isSubmitting ? (
          <Backdrop open sx={{ zIndex: (theme) => theme.zIndex.modal + 1 }}>
            <CircularProgress color="primary" />
          </Backdrop>
        ) : null}

        {error && (
          <Typography variant="h6" color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        {submissionErrors.length > 0 && (
          <Alert severity="error" sx={{ width: "100%", mb: 2 }}>
            {submissionErrors.map((err, index) => (
              <div key={index} dangerouslySetInnerHTML={{ __html: `Error: ${err.message}` }} />
            ))}
          </Alert>
        )}

        <FormProvider methods={methods} onSubmit={onSubmit}>
          <Grid container spacing={3}>
            {structuredSections.map((section, sectionIdx) => (
              <Grid key={`section-${sectionIdx}`} item xs={12}>
                {section.title && (
                  <>
                    <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
                      {section.title}
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                  </>
                )}
                <Grid container spacing={2}>
                  {section.columns.map((column: any[], columnIdx: number) => (
                    <Grid
                      item
                      xs={12}
                      sm={section.columns.length === 1 ? 12 : 6}
                      key={`column-${sectionIdx}-${columnIdx}`}
                    >
                      {column.map((field: any) => (
                        <RenderFormFields
                          key={field.fieldname}
                          fields={[field]}
                          control={control}
                          errors={errors}
                        />
                      ))}
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            ))}

            <Stack alignItems="center" width={1}>
              <Button sx={{ mt: 6 }} size="large" type="submit" variant="contained" color="primary">
                Submit
              </Button>
            </Stack>
          </Grid>
        </FormProvider>
      </Box>
    </Box>
  );
};

export default ProjectForm;
