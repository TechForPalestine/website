// components/FAQAccordion.jsx
import React from "react";
import { Accordion, AccordionDetails, AccordionSummary, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const FAQAccordion = ({ faqArray }) => {
    return (
        <div>
            {faqArray.map((faq, index) => (
                <Accordion key={index}>
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        aria-controls={`panel${index}-content`}
                        id={`panel${index}-header`}
                    >
                        <Typography>{faq.question}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography
                            align={"left"}
                            dangerouslySetInnerHTML={{ __html: faq.answer }} // Allow HTML rendering
                        />
                    </AccordionDetails>
                </Accordion>
            ))}
        </div>
    );
};

export default FAQAccordion;
