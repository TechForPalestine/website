import * as React from 'react';
import {
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Typography,
    Link
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

type FAQAccordionProps = {
    question: string;
    answer: React.ReactNode;
};

export default function FAQAccordion({ question, answer }: FAQAccordionProps) {
    return (
        <Accordion>
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="faq-content"
                id={`faq-${question}`}
            >
                <Typography>{question}</Typography>
            </AccordionSummary>
            <AccordionDetails>
                {answer}
            </AccordionDetails>
        </Accordion>
    );
}
