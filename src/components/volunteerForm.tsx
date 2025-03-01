import { useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { Backdrop, CircularProgress, Grid, Typography, Button, Box, Stack, Alert, Divider, Paper } from '@mui/material';
import { RenderFormFields } from './inputs-mapping';
import FormProvider from './hook-form/index';
import { transformObject } from '../utils/helpers';
import { fetchFormFields, submitForm } from '../store/api';

export const defaultValues = {};

const VolunteerForm = () => {
    const methods = useForm({ defaultValues, mode: 'onSubmit' });

    const { control, handleSubmit, formState: { isSubmitting, errors }, setError } = methods;
    const [fields, setFields] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setErrorState] = useState<string | null>(null);
    const [submissionErrors, setSubmissionErrors] = useState<any[]>([]);

    useEffect(() => {
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

        if(records.skills__checkbox){
            const result = Object.entries(records.skills__checkbox).map(([skill, skill_level]) => ({
                skill,
                skill_level
            }));

            console.log(result)
            records.skills__checkbox = result
        }

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
        }
    });

    const structuredSections: any[] = [];
    let currentSection: any = { title: '', columns: [[]] };

    fields.forEach((field) => {
        if (field.fieldtype === "Section Break") {
            if (currentSection.columns.some(col => col.length > 0)) {
                structuredSections.push(currentSection);
            }
            currentSection = { title: field.label || " ", columns: [[]] };
        } else if (field.fieldtype === "Column Break") {
            currentSection.columns.push([]);
        } else {
            currentSection.columns[currentSection.columns.length - 1].push(field);
        }
    });

    if (currentSection.columns.some(col => col.length > 0)) {
        structuredSections.push(currentSection);
    }

    const values = methods.getValues();
    console.log('Current form values:', values);
    return (
        <Box sx={{ p: 10 }}>
            <Box sx={{ textAlign: "center" }}>
                <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                    Volunteer With Us
                </Typography>
                <Typography
                    variant="body2"
                    sx={{
                        mx: "auto",
                        p: 3,
                        fontSize: "1.1rem",
                        lineHeight: 1.8,
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                    }}
                >
                    Welcome and thank you for offering your time to support {" "}
                    <Typography component="span" sx={{ fontWeight: "bold", color: "green" }}>
                        Tech For Palestine
                    </Typography>’s projects. All our projects are volunteer-powered, and without volunteers like you, we could not support all the awesome initiatives and work happening across T4P!
                    <br /><br />
                    We’re thrilled by the high level of interest and are constantly finding new ways to engage our volunteers to make an impact. To be added to our confidential list of volunteers and matched with one of our open roles, please share as much as possible with us about your relevant skills, experience, interests, and realistic time availability so we can match you with something that is a great fit.
                </Typography>
            </Box>

            <Paper elevation={3} sx={{ p: 6, mt: 4, borderRadius: "8px", backgroundColor: "rgba(255, 255, 255, 0.8)" }}>
                <Grid container spacing={4}>
                    {loading || isSubmitting ? (
                        <Backdrop open sx={{ zIndex: (theme) => theme.zIndex.modal + 1 }}>
                            <CircularProgress color="primary" />
                        </Backdrop>
                    ) : null}

                    {error && <Typography variant="h6" color="error">{error}</Typography>}

                    {submissionErrors.length > 0 && (
                        <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
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
                                        {section.columns.map((column, columnIdx) => (
                                            <Grid item xs={12} sm={section.columns.length === 1 ? 12 : 6} key={`column-${sectionIdx}-${columnIdx}`}>
                                                {column.map((field: any) => (
                                                    <RenderFormFields key={field.fieldname} fields={[field]} control={control} errors={errors} />
                                                ))}
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Grid>
                            ))}

                            <Stack alignItems="center" width={1}>
                                <Button sx={{ mt: 6 }} size="large" type="submit" variant="contained" color="error">
                                    Submit Form
                                </Button>
                            </Stack>
                        </Grid>
                    </FormProvider>
                </Grid>
            </Paper>
        </Box>
    );
};

export default VolunteerForm;
