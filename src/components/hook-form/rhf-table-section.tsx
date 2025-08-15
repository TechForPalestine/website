import { useFieldArray, useFormContext, Controller } from 'react-hook-form';
import {
    Box,
    Button,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
} from '@mui/material';
import { Add, Settings, Delete } from '@mui/icons-material';
import { RenderFormFields } from '../inputs-mapping';

type RHFTableSectionProps = {
    name: string;
    label?: string;
    columns?: { fieldname: string; label: string; reqd?: number }[]; // Added reqd field
};

export default function RHFTableSection({ name, label, columns = [] }: RHFTableSectionProps) {
    const { control } = useFormContext();
    const { fields, append, remove } = useFieldArray({ control, name });

    const onAdd = () => {
        append(Object.fromEntries(columns.map((col) => [col.fieldname, ''])));
    };

    return (
        <Box sx={{ width: '100%', mt: 4 }}>
            {/* Label & Add Button */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                {label && (
                    <Typography variant="body1" sx={{ pr: 2 }}>
                        {label}
                    </Typography>
                )}
                <Button
                    color="primary"
                    startIcon={<Add />}
                    onClick={onAdd}
                    sx={{
                        textTransform: 'none',
                        color: '#000',
                    }}
                >
                    Add row
                </Button>
            </Box>

            {/* Table Container */}
            <TableContainer component={Paper} sx={{ boxShadow: 3, borderRadius: 2 }}>
                <Table>
                    {/* Table Header */}
                    <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableRow>
                            {columns.map((col) => (
                                <TableCell key={col.fieldname} sx={{ textAlign: 'center' }}>
                                    {col.label} {col.reqd === 1 && <span style={{ color: 'red' }}>*</span>}
                                </TableCell>
                            ))}
                            {/* Replace "Actions" with a Settings Icon */}
                            <TableCell sx={{ textAlign: 'center' }}>
                                <Settings />
                            </TableCell>
                        </TableRow>
                    </TableHead>

                    {/* Table Body */}
                    <TableBody>
                        {fields.length > 0 ? (
                            fields.map((row, index) => (
                                <TableRow key={row.id}>
                                    {columns.map((col) => (
                                        <TableCell key={col.fieldname} sx={{ textAlign: 'center' }}>
                                            <Controller
                                                name={`${name}[${index}].${col.fieldname}`}
                                                control={control}
                                                render={({ field, fieldState }) => (
                                                    <RenderFormFields
                                                        fields={[col]}
                                                        control={control}
                                                        errors={fieldState?.error ? { [col.fieldname]: fieldState.error } : {}}
                                                        parentName={`${name}[${index}]`}
                                                    />
                                                )}
                                            />
                                        </TableCell>
                                    ))}

                                    {/* Delete Button */}
                                    <TableCell sx={{ textAlign: 'center' }}>
                                        <IconButton
                                            color="error"
                                            onClick={() => remove(index)}
                                            sx={{
                                                '&:hover': { backgroundColor: '#f8d7da' },
                                                transition: '0.3s ease',
                                            }}
                                        >
                                            <Delete />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            /* Show "No Data" when the table is empty */
                            <TableRow>
                                <TableCell colSpan={columns.length + 1} sx={{ textAlign: 'center', py: 3 }}>
                                    <Typography variant="body1" color="textSecondary">
                                        No Data
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}
