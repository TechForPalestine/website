import { Controller, useFormContext } from 'react-hook-form';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import InputLabel from '@mui/material/InputLabel';
import type { SxProps, Theme } from '@mui/material/styles';
import FormHelperText from '@mui/material/FormHelperText';
import TextField from '@mui/material/TextField';
import type { TextFieldProps } from '@mui/material';
import FormControl from '@mui/material/FormControl';
import type { FormControlProps } from '@mui/material/FormControl';

// ----------------------------------------------------------------------

type RHFSelectProps = TextFieldProps & {
  name: string;
  native?: boolean;
  maxHeight?: boolean | number;
  children: React.ReactNode;
  PaperPropsSx?: SxProps<Theme>;
};

export function RHFSelect({
                            name,
                            native,
                            maxHeight = 220,
                            helperText,
                            children,
                            PaperPropsSx,
                            rules,
                            label,
                            ...other
                          }: RHFSelectProps) {
  const { control } = useFormContext();

  return (
      <Controller
          name={name}
          control={control}
          rules={rules}
          render={({ field, fieldState: { error } }) => (
              <TextField
                  {...field}
                  select
                  fullWidth
                  label={
                    rules?.required ? (
                        <span>
                {label} <span style={{ color: 'red' }}>*</span>
              </span>
                    ) : (
                        label
                    )
                  }
                  SelectProps={{
                    native,
                    MenuProps: {
                      PaperProps: {
                        sx: {
                          ...(!native && {
                            maxHeight: typeof maxHeight === 'number' ? maxHeight : 'unset',
                          }),
                          ...PaperPropsSx,
                        },
                      },
                    },
                    sx: { textTransform: 'capitalize' },
                  }}
                  error={!!error}
                  helperText={error ? error?.message : helperText}
                  {...other}
              >
                {children}
              </TextField>
          )}
      />
  );
}

// ----------------------------------------------------------------------

type RHFMultiSelectProps = FormControlProps & {
  name: string;
  label?: string;
  chip?: boolean;
  checkbox?: boolean;
  placeholder?: string;
  helperText?: React.ReactNode;
  options: {
    label: string;
    value: string;
    name:string
  }[];
};

export function RHFMultiSelect({
                                 name,
                                 chip,
                                 label,
                                 options,
                                 checkbox,
                                 placeholder,
                                 helperText,
                                 rules,
                                 ...other
                               }: RHFMultiSelectProps) {
  const { control } = useFormContext();

  const renderValues = (selectedIds: string[] = []) => {
    const selectedItems = options.filter((item) => selectedIds.includes(item.name));

    if (!selectedItems.length && placeholder) {
      return <Box sx={{ color: 'text.disabled' }}>{placeholder}</Box>;
    }

    if (chip) {
      return (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {selectedItems.map((item) => (
                <Chip key={item.name} size="small" label={item.label} />
            ))}
          </Box>
      );
    }

    return selectedItems.map((item) => item.label).join(', ');
  };

  return (
      <Controller
          name={name}
          rules={rules}
          control={control}
          render={({ field, fieldState: { error } }) => (
              <FormControl error={!!error} {...other}>
                {label && (
                    <InputLabel id={name}>
                      {rules?.required ? (
                          <span>
                  {label} <span style={{ color: 'red' }}>*</span>
                </span>
                      ) : (
                          label
                      )}
                    </InputLabel>
                )}
                <Select
                    {...field}
                    multiple
                    displayEmpty={!!placeholder}
                    id={`multiple-${name}`}
                    labelId={name}
                    label={label}
                    value={Array.isArray(field.value) ? field.value : []} // Ensure value is always an array
                    onChange={(event) => field.onChange(event.target.value as string[])} // Ensure correct update
                    renderValue={renderValues}
                >
                  {options.map((option) => {
                    const selected = field.value?.includes(option.name) || false;

                      console.log(options ,"options")
                    return (
                        <MenuItem key={option.name} value={option.name}>
                          {checkbox && <Checkbox size="small" disableRipple checked={selected} />}
                          {option.label}
                        </MenuItem>
                    );
                  })}
                </Select>

                {(!!error || helperText) && (
                    <FormHelperText error={!!error}>{error ? error?.message : helperText}</FormHelperText>
                )}
              </FormControl>
          )}
      />
  );
}
