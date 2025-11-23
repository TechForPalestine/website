import * as React from "react";
import { Accordion, AccordionSummary, AccordionDetails, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import RichTextRenderer from "./RichTextRenderer";
import type { RichTextSegment } from "../types/richText";

type FAQAccordionProps = {
  question: string;
  answer: React.ReactNode | string | RichTextSegment[];
};

export default function FAQAccordion({ question, answer }: FAQAccordionProps) {
  return (
    <Accordion>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="faq-content"
        id={`faq-${question.replaceAll(" ", "-")}`}
      >
        <Typography>{question}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        {typeof answer === "string" ? (
          <Typography>{answer}</Typography>
        ) : Array.isArray(answer) ? (
          <RichTextRenderer richText={answer} />
        ) : (
          answer
        )}
      </AccordionDetails>
    </Accordion>
  );
}
