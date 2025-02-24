import { Controller, useFormContext } from 'react-hook-form';
import TextField from '@mui/material/TextField';
import type { TextFieldProps } from '@mui/material';

// ----------------------------------------------------------------------

type Props = TextFieldProps & {
    name: string;
    rules?: { required?: boolean | string };
};

export default function RHFTextField({ name, label, helperText, type, rules, ...other }: Props) {
    const { control } = useFormContext();

    return (
        <Controller
            name={name}
            control={control}
            rules={rules}
            render={({ field, fieldState: { error } }) => (
                <TextField
                    {...field}
                    label={
                        rules?.required ? (
                            <span>
                {label} <span style={{ color: 'red' }}>*</span>
              </span>
                        ) : (
                            label
                        )
                    }
                    fullWidth
                    type={type}
                    value={field.value ?? ''} // Default to empty string if value is null or undefined
                    onChange={(event) => {
                        if (type === 'number') {
                            field.onChange(Number(event.target.value));
                        } else {
                            field.onChange(event.target.value);
                        }
                    }}
                    error={!!error}
                    helperText={error ? error?.message : helperText}
                    sx={{
                        backgroundColor: 'white', // ✅ Set background to white
                        borderRadius: '8px', // Optional: Rounded corners
                        '& .MuiInputBase-input': {
                            backgroundColor: 'white', // Ensure input itself is white
                        },
                    }}
                    {...other}
                />
            )}
        />
    );
}
