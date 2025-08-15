import { Controller, useFormContext } from 'react-hook-form';
import { Radio, RadioGroup, FormControlLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, FormHelperText } from '@mui/material';

type SkillOption = {
    skill: string;  // Changed from 'skill_name' to 'skill'
    label: string;
};

type Props = {
    name: string;
    skills: SkillOption[];
    skillLevels: string[]; // Dynamic columns (e.g., Beginner, Intermediate, Advanced)
};

export default function RHFSkillSelector({ name, skills = [], skillLevels = [] }: Props) {
    const { control, setValue, formState: { errors }, watch } = useFormContext();

    // Handle radio change to update the selected skill
    const handleRadioChange = (skill: string, skill_level: string) => {
        console.log(skill , "skill")
        // Update the form value to store the skill level for the corresponding skill
        setValue(name, {
            ...watch(name),
            [skill]: skill_level, // Store skill level for each skill
        });
    };

    return (
        <TableContainer component={Paper} sx={{ backgroundColor: 'white', borderRadius: '8px' }}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell><strong>Skill</strong></TableCell>
                        {skillLevels.map((level) => (
                            <TableCell key={level}><strong>{level}</strong></TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {skills.map(({ skill, label }) => {  // Changed 'skill_name' to 'skill'
                        // Fetch the selected skill level for the current skill
                        const selectedSkillLevel = watch(name)?.[skill]; // Changed 'skill_name' to 'skill'

                        // Get the validation error for the current skill
                        const skillError = (errors as any)[name]?.[skill]; // Changed 'skill_name' to 'skill'

                        return (
                            <TableRow key={skill} sx={{ backgroundColor: skillError ? '#f8d7da' : 'transparent' }}> {/* Changed 'skill_name' to 'skill' */}
                                <TableCell>{label}
                                    {/* Displaying error below the skill name */}
                                    {skillError && (
                                        <FormHelperText error>{skillError.message}</FormHelperText>
                                    )}
                                </TableCell>
                                {skillLevels.map((level) => (
                                    <TableCell key={level} align="center">
                                        <Controller
                                            name={`${name}[${skill}]`} // Unique name for each skill level (changed 'skill_name' to 'skill')
                                            control={control}
                                            rules={{
                                                required: `Please select a skill level for ${label}`, // Dynamic error message
                                            }}
                                            render={({ field }) => (
                                                <>
                                                    <RadioGroup
                                                        {...field}
                                                        value={selectedSkillLevel || ''}
                                                        onChange={(e) => handleRadioChange(skill, e.target.value)} // Changed 'skill_name' to 'skill'
                                                    >
                                                        <FormControlLabel
                                                            value={level}
                                                            control={<Radio />}
                                                            label={level}
                                                        />
                                                    </RadioGroup>
                                                </>
                                            )}
                                        />
                                    </TableCell>
                                ))}
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
