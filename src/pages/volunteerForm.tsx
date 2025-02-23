import { useForm } from 'react-hook-form';
import { useEffect, useState, useMemo } from 'react';
// import { useNavigate } from 'react-router-dom';
import { Backdrop, CircularProgress, Grid, Typography, Button, Box, Stack, Alert, Divider } from '@mui/material';
import { RenderFormFields } from '../components/inputs-mapping';
import FormProvider from '../components/hook-form';
import { transformObject } from '../utils/helpers';
import { fetchFormFields, submitForm } from '../store/api';

export const defaultValues = {};

const VolunteerForm = () => {
    // const navigate = useNavigate();
    const methods = useForm({ defaultValues, mode: 'onSubmit' });

    const { control, handleSubmit, formState: { isSubmitting, errors }, setError } = methods;
    const [fields, setFields] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setErrorState] = useState<string | null>(null);
    const [submissionErrors, setSubmissionErrors] = useState<any[]>([]);

    useEffect(() => {
        console.log("🔄 Fetching form fields");
        const loadFormFields = async () => {
            setLoading(true);
            try {
                const { data } = await fetchFormFields('/incubator_management.api.meta.volunteering_application');
                setFields(data?.fields.filter((row: any) => row.fieldname !== 'amended_from') || []);
            } catch (err: any) {
                setErrorState('Failed to load form fields.');
            } finally {
                setLoading(false);
            }
        };
        loadFormFields();
    }, []);

    const onSubmit = handleSubmit(async (records) => {
        console.log('🚀 Submitting Form:', records);
        const res = await submitForm('/incubator_management.api.applications.volunteering.apply', transformObject(records));
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

    // Grouping fields into sections and columns correctly
    const structuredSections: any[] = [];
    let currentSection: any = { title: '', columns: [[]] };

    fields.forEach((field) => {
        if (field.fieldtype === "Section Break") {
            // Save previous section if it contains fields
            if (currentSection.columns.some(col => col.length > 0)) {
                structuredSections.push(currentSection);
            }
            // Start a new section
            currentSection = { title: field.label || " ", columns: [[]] };
        } else if (field.fieldtype === "Column Break") {
            // Start a new column in the current section
            currentSection.columns.push([]);
        } else {
            // Add field to the last column in the current section
            currentSection.columns[currentSection.columns.length - 1].push(field);
        }
    });

    // Push the last section
    if (currentSection.columns.some(col => col.length > 0)) {
        structuredSections.push(currentSection);
    }

    // const tableFields = useMemo(() => fields.filter((field) => field.fieldtype === 'Table'), [fields]);

    console.log(structuredSections ,"structuredSections")
    return (
        <Box sx={{p:10}}>
            {/* Header Section */}
            <Box>
                <Typography variant="h2" align="center">
                    Volunteer With Us
                </Typography>
            </Box>

            {/* Form Section */}
            <Grid container spacing={4} sx={{ p: 6 }}>
                {loading || isSubmitting ? (
                    <Backdrop open sx={{ zIndex: (theme) => theme.zIndex.modal + 1 }}>
                        <CircularProgress color="primary" />
                    </Backdrop>
                ) : null}

                {error && <Typography variant="h6" color="error">{error}</Typography>}

                {/* Global Error Alert */}
                {submissionErrors.length > 0 && (
                    <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                        {submissionErrors.map((err, index) => (
                            <div key={index} dangerouslySetInnerHTML={{ __html: `Error: ${err.message}` }} />
                        ))}
                    </Alert>
                )}

                <FormProvider methods={methods} onSubmit={onSubmit}>
                    <Grid container spacing={3}>

                        {/* Render structured sections & columns */}
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
                                <Grid container spacing={2} >
                                    {section.columns.map((column, columnIdx) => (
                                        <Grid item xs={12} sm={section.columns.length==1?12:6} key={`column-${sectionIdx}-${columnIdx}`} >
                                            {column.map((field: any) => (
                                                <RenderFormFields key={field.fieldname} fields={[field]} control={control} errors={errors} />
                                            ))}
                                        </Grid>
                                    ))}
                                </Grid>
                            </Grid>
                        ))}



                        {/* Submit Button */}
                        <Stack alignItems="center" width={1}>
                            <Button sx={{ mt: 6 }} size="large" type="submit" variant="contained" color="error">
                                Submit Form
                            </Button>
                        </Stack>
                    </Grid>
                </FormProvider>
            </Grid>
        </Box>
    );
};

export default VolunteerForm;
