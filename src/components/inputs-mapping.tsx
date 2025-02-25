import { useEffect, useState, memo, useRef } from 'react';
import { MenuItem, Divider, Grid, Checkbox, FormControlLabel } from '@mui/material';
import { RHFSelect, RHFTextField, RHFMultiSelect, RHFFileUpload, RHFTableSection } from '../components/hook-form';
import Stack from '@mui/material/Stack';
import type { StackProps } from '@mui/material';
import Typography from '@mui/material/Typography';
import { fetchFormFields } from '../store/api'; // ✅ Import API call

const parseOptions = (options) => options.split('\n').filter((option) => option.trim() !== '');

const transformTableFields = (field) => {
    if (!field.table_fields) return [];
    return field.table_fields.map(({ fieldname, label }) => ({
        value: fieldname,
        label,
    }));
};
const useAllLinkOptions = (fields) => {
    const [options, setOptions] = useState({});
    const [loading, setLoading] = useState(true);
    const fetchedOnce = useRef(false); // ✅ Prevents duplicate API calls

    useEffect(() => {
        if (fields.length === 0 || fetchedOnce.current) return; // ✅ Avoids unnecessary fetches

        const fetchAllOptions = async () => {
            setLoading(true);
            const newOptions = {};

            for (const field of fields) {
                if (field.fieldtype === 'Link' && !newOptions[field.fieldname]) {
                    try {
                        const { data } = await fetchFormFields(`/incubator_management.api.incubator.${field.fieldname}`);
                        newOptions[field.fieldname] = data || [];
                    } catch (err) {
                        newOptions[field.fieldname] = [];
                    }
                } else if (field.fieldtype === 'Table MultiSelect') {
                    newOptions[field.fieldname] = {};
                    let key = field.table_fields[0].fieldname;
                    try {
                        const { data } = await fetchFormFields(`/incubator_management.api.incubator.${key}`);
                        newOptions[field.fieldname][key] = data || [];
                    } catch (err) {
                        newOptions[field.fieldname][key] = [];
                    }
                }
            }

            setOptions(newOptions);
            setLoading(false);
            fetchedOnce.current = true; // ✅ Prevents future duplicate calls
        };

        fetchAllOptions();
    }, [fields]); // ✅ Runs only when fields change

    return { options, loading };
};

const getRules = (field) => {
    return {
        required: field.reqd ? 'This field is required' : false,
        pattern:
            field.options === 'Email'
                ? {
                    value: /^[\w-\\.]+@([\w-]+\.)+[\w-]{2,4}$/,
                    message: 'Invalid email format',
                }
                : field.options === 'URL'
                    ? {
                        value: /^(https?:\/\/)?([\w\d\-]+\.)+[\w]{2,}\/?.*$/,
                        message: 'Invalid URL format',
                    }
                    : undefined,
    };
};

export const RenderFormFields = memo(({ fields, control, errors, parentName = '' }) => {
        const { options, loading } = useAllLinkOptions(fields);

        return fields.map((field) => (
            <RenderInput
                key={field.fieldname}
                field={field}
                control={control}
                errors={errors}
                options={options}
                loading={loading}
                parentName={parentName} // Pass down parentName for nested fields
            />
        ));
    }
)
export const RenderInput = ({ field, control, errors, options, loading, parentName }) => {
    if (!field) return null; // Prevent errors if field is undefined

    // Compute field path based on parentName
    const fieldName = parentName ? `${parentName}.${field.fieldname}` : field.fieldname;

    switch (field.fieldtype) {
        case 'Data':
        case 'Text':
            return (
                <Block label={field.label} description={field.description}>
                    <RHFTextField
                        name={fieldName} // Use computed fieldName
                        label={field.label}
                        rules={getRules(field)}
                    />
                </Block>
            );
        case 'Small Text':
            return (
                <Block label={field.label} description={field.description}>
                    <RHFTextField
                        multiline={true}
                        rows={4}
                        name={fieldName} // Use computed fieldName
                        label={field.label}
                        rules={getRules(field)}
                    />
                </Block>
            );
        case 'Select':
            return (
                <Block label={field.label} description={field.description}>
                    <RHFSelect
                        name={fieldName} // Use computed fieldName
                        label={field.label}
                        rules={getRules(field)}
                    >
                        <MenuItem value="">None</MenuItem>
                        <Divider sx={{ borderStyle: 'dashed' }} />
                        {parseOptions(field.options).map((option) => (
                            <MenuItem key={option} value={option}>
                                {option}
                            </MenuItem>
                        ))}
                    </RHFSelect>
                </Block>
            );
        case 'Check':
            return (
                <Block description={field.description}>
                    <FormControlLabel
                        control={<Checkbox name={fieldName} />}
                        label={field.label}
                    />
                </Block>
            );
        case 'Table MultiSelect':
            let key = field.table_fields[0].fieldname;

            return (
                <Block label={field.label} description={field.description}>
                    <RHFMultiSelect
                        chip
                        checkbox
                        rules={getRules(field)}
                        // name={fieldName} // Use computed fieldName
                        name={`${field.fieldname}.${key}`} // Use computed fieldName
                        label={field.label}
                        options={options[field.fieldname] ? options[field.fieldname][key] : [] || []}
                    />
                </Block>
            );

        case 'Attach':
            return (
                <Block label={field.label} description={field.description}>
                    <RHFFileUpload name={fieldName} label={field.label} />
                </Block>
            );

        case 'Table':
            return (
                <Block label={field.label} description={field.description}>
                    <RHFTableSection
                        label={field.label}
                        name={fieldName} // Use computed fieldName
                        columns={field.table_fields || []} // Ensure table_fields is passed correctly
                    />
                </Block>
            );

        case 'Link':
            return (
                <Block label={field.label} description={field.description}>
                    <RHFSelect
                        name={fieldName}
                        label={field.label}
                        rules={getRules(field)}
                    >
                        <MenuItem value="">None</MenuItem>
                        <Divider sx={{ borderStyle: 'dashed' }} />
                        {loading ? (
                            <MenuItem disabled>Loading...</MenuItem>
                        ) : (
                            (options[field.fieldname] || []).map((option, index) => (
                                <MenuItem key={index} value={option.name}>
                                    {option.name}
                                </MenuItem>
                            ))
                        )}
                    </RHFSelect>
                </Block>
            );
        case "Section Break":
            return (
                <Grid key={field.fieldname} item xs={12}>
                    <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
                        {field.label || ""}
                    </Typography>
                    <Divider />
                </Grid>
            );

        default:
            return null;
    }
};

interface BlockProps extends StackProps {
    label?: string;
    children: React.ReactNode;
}

function Block({ label = 'RHFTextField', sx, children,description }: BlockProps) {
    return (
        <Stack spacing={1} sx={{  mb: 2 , width: 1, ...sx }} >
            {children}
            <Typography variant={'caption'} sx={{color:"gray"}}>{description}</Typography>
        </Stack>
    );
}
