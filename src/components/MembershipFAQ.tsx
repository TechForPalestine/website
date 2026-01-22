import { useState } from "react";
import { Box, Typography, Accordion, AccordionSummary, AccordionDetails } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const faqData = [
  {
    question: "How does membership support Palestinian liberation?",
    answer: (
      <Typography variant="body1" sx={{ color: "text.secondary", lineHeight: 1.75 }}>
        Membership brings together like-minded members and activists to lead, co-lead or support
        projects and committees. Members can support the movement by contributing financially or by
        getting involved directly as a working committee leader or member.
      </Typography>
    ),
  },
  {
    question: "How do I get involved after signup?",
    answer: (
      <>
        <Typography
          variant="body1"
          sx={{ color: "text.secondary", lineHeight: 1.75, mb: 2 }}
        >
          We will send you an email about the ways to get involved as a member:
        </Typography>
        <Box component="ul" sx={{ ml: 3, color: "text.secondary" }}>
          <li style={{ marginBottom: "8px" }}>
            Get T4P support on leveling up personal and corporate boycotts, using ethical
            alternatives, and learning how to activate against tech complicity.
          </li>
          <li style={{ marginBottom: "8px" }}>
            Bring T4P resources into your companies for hiring and policy support.
          </li>
          <li style={{ marginBottom: "8px" }}>
            Meet with us one-on-one to see how your skills and interests can support the mission
          </li>
          <li style={{ marginBottom: "8px" }}>
            Join working committees of fellow advocates taking direct action for Palestinian
            liberation.
          </li>
          <li style={{ marginBottom: "8px" }}>
            Attend meetups and webinars to connect and learn from other activists.
          </li>
          <li style={{ marginBottom: "8px" }}>
            Stay up-to-date by reading and sharing movement updates
          </li>
        </Box>
      </>
    ),
  },
  {
    question: "Why are there membership dues?",
    answer: (
      <>
        <Typography
          variant="body1"
          sx={{ color: "text.secondary", lineHeight: 1.75, mb: 2 }}
        >
          Dues are pay-what-you-can and help us progress towards our goal of 10,000 projects for
          Palestine by supporting project work itself - grants for advocacy projects, access to
          expert trainings, mentorship from startup founders, and other developmental opportunities
          to help projects scale - and by supporting the infrastructure that lets us get work done,
          including software and employees.
        </Typography>
        <Typography variant="body1" sx={{ color: "text.secondary", lineHeight: 1.75 }}>
          Tech for Palestine aims for inclusivity. If you are unable to access banking services,
          please reach out to{" "}
          <a
            href="mailto:membership@techforpalestine.org"
            style={{ color: "#168039", textDecoration: "underline" }}
          >
            membership@techforpalestine.org
          </a>{" "}
          to request a waiver of dues.
        </Typography>
      </>
    ),
  },
  {
    question: "Are dues tax deductible? Can I apply gift aid?",
    answer: (
      <Typography variant="body1" sx={{ color: "text.secondary", lineHeight: 1.75 }}>
        Yes, if you are in the US your dues are tax deductible. If you are in the UK, contact us at{" "}
        <a
          href="mailto:membership@techforpalestine.org"
          style={{ color: "#168039", textDecoration: "underline" }}
        >
          membership@techforpalestine.org
        </a>{" "}
        after signing up, and we will ensure future donations are processed through our gift aid
        partner.
      </Typography>
    ),
  },
  {
    question:
      "Can I pay annually or via a different payment method (DAF, cryptocurrency, foundation, etc.)?",
    answer: (
      <Typography variant="body1" sx={{ color: "text.secondary", lineHeight: 1.75 }}>
        These options will be supported in the future, and we will help you migrate to your
        preferred method of giving once available.
      </Typography>
    ),
  },
];

export default function MembershipFAQ() {
  const [expanded, setExpanded] = useState<string | false>(false);

  const handleChange = (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <Box sx={{ mt: 8 }}>
      <Typography
        variant="h4"
        component="h2"
        sx={{
          mb: 6,
          textAlign: "center",
          fontWeight: "bold",
          color: "text.primary",
        }}
      >
        Membership FAQ
      </Typography>

      <Box sx={{ maxWidth: 800, mx: "auto" }}>
        {faqData.map((faq, index) => (
          <Accordion
            key={index}
            expanded={expanded === `panel${index}`}
            onChange={handleChange(`panel${index}`)}
            sx={{
              mb: 2,
              "&:before": {
                display: "none",
              },
              boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
              border: "1px solid #e5e7eb",
              borderRadius: "8px !important",
              "&.Mui-expanded": {
                margin: "0 0 16px 0",
              },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                "& .MuiAccordionSummary-content": {
                  my: 2,
                },
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  fontSize: "1.125rem",
                  color: "text.primary",
                }}
              >
                {faq.question}
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0, pb: 3 }}>{faq.answer}</AccordionDetails>
          </Accordion>
        ))}
      </Box>

      {/* Contact */}
      <Box
        sx={{
          mt: 6,
          p: 3,
          borderRadius: 2,
          backgroundColor: "#f0fdf4",
          maxWidth: 800,
          mx: "auto",
        }}
      >
        <Typography variant="body1" sx={{ color: "text.secondary", lineHeight: 1.75 }}>
          For additional questions about membership, please email{" "}
          <a
            href="mailto:membership@techforpalestine.org"
            style={{
              color: "#168039",
              textDecoration: "underline",
              fontWeight: 600,
            }}
          >
            membership@techforpalestine.org
          </a>
          .
        </Typography>
      </Box>
    </Box>
  );
}
