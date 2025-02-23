import { ChangeEvent } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Box, Button, Typography } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

// ----------------------------------------------------------------------

type Props = {
    name: string;
    label?: string;
};

export default function RHFFileUpload({ name, label }: Props) {
    const { control, setValue, watch } = useFormContext();
    const file = watch(name); // Watch the file value to update UI correctly

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0] || null;
        setValue(name, selectedFile, { shouldValidate: true }); // Ensure validation updates
    };

    return (
        <Controller
            name={name}
            control={control}
            render={({ fieldState: { error } }) => (
                <Box>
                    <input
                        type="file"
                        accept="image/*,.pdf,.doc,.docx"
                        style={{ display: 'none' }}
                        id={name}
                        onChange={handleFileChange}
                    />
                    <label htmlFor={name}>
                        <Button
                            fullWidth
                            variant="outlined"
                            component="span"
                            startIcon={<CloudUploadIcon />}
                            sx={{
                                height: 56, // Matches MUI TextField default height
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: 1,
                                borderColor: 'grey.400',
                                backgroundColor: 'background.paper',
                                textTransform: 'none',
                                '&:hover': {
                                    backgroundColor: 'grey.100',
                                },
                            }}
                        >
                            {file ? file.name : label || 'Upload File'}
                        </Button>
                    </label>

                    {error && (
                        <Typography color="error" variant="body2" mt={1}>
                            {error.message}
                        </Typography>
                    )}
                </Box>
            )}
        />
    );
}
