import { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent,
  Alert,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const teams = [
  {
    name: "Coaching for Palestinian Entrepreneurs",
    description:
      "Supporting Palestinian entrepreneurs in their personal and professional growth, resilience, and success, through coaching programs run in collaboration with Coaching Minds and BVisionRY.",
  },
  {
    name: "Tech Accountability",
    description:
      "Developing content to hold tech companies and founders accountable for supporting Israel's war crimes.",
  },
  {
    name: "Legal Aid Platform",
    description:
      "This team is coordinating efforts to bring pro-bono resources from law firms to bear on cases of discrimination against the Palestinian identity or pro-Palestinian speech.",
  },
  {
    name: "US Events",
    description:
      "This team is organizing in-person events in the US for T4P members and others to come together, connect, build relationships, feel part of a larger community, educate people, and grow the T4P network.",
  },
];

function QgivEmbed() {
  const scriptLoadedRef = useRef(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (scriptLoadedRef.current) return;
    scriptLoadedRef.current = true;

    const script = document.createElement("script");
    script.src = "https://secure.qgiv.com/resources/core/js/embed.js";
    script.id = "qgiv-embedjs";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <Box sx={{ mt: 3 }}>
      <div
        className="qgiv-embed-container"
        data-qgiv-embed="true"
        data-embed-id="88902"
        data-embed="https://secure.qgiv.com/for/dafize/embed/88902/"
        data-width="630"
      />

      {!confirmed ? (
        <Box sx={{ mt: 3 }}>
          <button
            onClick={() => setConfirmed(true)}
            style={{
              backgroundColor: "#168039",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "12px 24px",
              fontSize: "1rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            I've completed my payment
          </button>
        </Box>
      ) : (
        <Alert severity="success" sx={{ mt: 3 }}>
          <Typography sx={{ mb: 1 }}>
            <strong>Welcome to T4P!</strong>
          </Typography>
          <Typography>
            Check your email for a link to set up your Hub account. If you don't see it within a
            few minutes, check your spam folder or contact{" "}
            <a href="mailto:membership@techforpalestine.org" style={{ color: "#168039", fontWeight: 600 }}>
              membership@techforpalestine.org
            </a>
            .
          </Typography>
        </Alert>
      )}
    </Box>
  );
}

export default function MembershipPage() {
  const [expanded, setExpanded] = useState<string | false>("dues");

  const handleChange =
    (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };

  const accordionSx = {
    mb: 2,
    "&:before": { display: "none" },
    boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
    border: "1px solid #e5e7eb",
    borderRadius: "8px !important",
    "&.Mui-expanded": { margin: "0 0 16px 0" },
  };

  const summaryTitleSx = {
    fontWeight: 700,
    fontSize: "1.25rem",
    color: "#111827",
  };

  return (
    <Box sx={{ maxWidth: 800, mx: "auto" }}>
      {/* Intro */}
      <Typography variant="body1" sx={{ mb: 4, fontSize: "1.125rem", lineHeight: 1.75, color: "#374151" }}>
        Join the coalition working on impactful initiatives for Palestinian liberation. Browse
        activism initiatives looking for your skills, or start an initiative of your own with T4P
        support.
      </Typography>

      {/* Team cards */}
      <Typography variant="h5" component="h2" sx={{ mb: 3, fontWeight: 700, color: "#111827" }}>
        See just a few examples of our teams:
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: 2,
          mb: 6,
        }}
      >
        {teams.map((team) => (
          <Card
            key={team.name}
            variant="outlined"
            sx={{ borderRadius: 2, borderColor: "#e5e7eb", height: "100%" }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="h6"
                component="h3"
                sx={{ fontWeight: 700, mb: 1, fontSize: "1rem", color: "#111827" }}
              >
                {team.name}
              </Typography>
              <Typography variant="body2" sx={{ color: "#6b7280", lineHeight: 1.7 }}>
                {team.description}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Membership Dues accordion */}
      <Accordion expanded={expanded === "dues"} onChange={handleChange("dues")} sx={accordionSx}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ "& .MuiAccordionSummary-content": { my: 2 } }}>
          <Typography sx={summaryTitleSx}>Membership Dues</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0, pb: 3, px: 3 }}>
          <Typography variant="body1" sx={{ color: "#374151", lineHeight: 1.75, mb: 2 }}>
            Membership dues fund training, financial grants, and volunteers for breakthrough
            projects like Upscrolled, Boycat, Thaura, Jaywalk, Newscord, and more.
          </Typography>
          <Typography variant="body1" sx={{ color: "#374151", lineHeight: 1.75, mb: 2 }}>
            Dues are pay-what-you-can, starting at $1 per month. We suggest a contribution equal
            to one hour's salary.
          </Typography>
          <Typography variant="body1" sx={{ color: "#374151", lineHeight: 1.75, mb: 2 }}>
            If you are in the US, your dues are tax deductible. If you are in the UK, contact us
            at{" "}
            <a
              href="mailto:membership@techforpalestine.org"
              style={{ color: "#168039", textDecoration: "underline" }}
            >
              membership@techforpalestine.org
            </a>{" "}
            after signup and we will ensure that future donations are processed through our gift
            aid partner.
          </Typography>
          <Typography variant="body1" sx={{ color: "#374151", lineHeight: 1.75, mb: 1 }}>
            Tech for Palestine aims for inclusivity. Please reach out to{" "}
            <a
              href="mailto:membership@techforpalestine.org"
              style={{ color: "#168039", textDecoration: "underline" }}
            >
              membership@techforpalestine.org
            </a>{" "}
            to request a waiver of dues in the following circumstances:
          </Typography>
          <Box
            component="ul"
            sx={{
              ml: 3,
              pl: 2,
              mb: 2,
              color: "#374151",
              listStyleType: "disc",
              "& li": { mb: 0.5, lineHeight: 1.75 },
            }}
          >
            <li>Not having access to banking services/debit card</li>
            <li>Being located in Gaza or the West Bank</li>
            <li>Being a refugee from Gaza or the West Bank evacuated during the genocide</li>
            <li>Not being able to afford membership due to personal circumstances</li>
            <li>Being a T4P paid staff member</li>
          </Box>
          <Typography variant="body1" sx={{ color: "#374151", lineHeight: 1.75, mb: 3 }}>
            Options to pay via DAF, cryptocurrency, foundations, and other methods will be
            supported in the future. We will help you migrate to your preferred method of giving
            once available.
          </Typography>

          <QgivEmbed />
        </AccordionDetails>
      </Accordion>

      {/* Mobilizing for Palestine accordion */}
      <Accordion
        expanded={expanded === "mobilizing"}
        onChange={handleChange("mobilizing")}
        sx={accordionSx}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ "& .MuiAccordionSummary-content": { my: 2 } }}>
          <Typography sx={summaryTitleSx}>Mobilizing for Palestine</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0, pb: 3, px: 3 }}>
          <Typography variant="body1" sx={{ color: "#374151", lineHeight: 1.75, mb: 2 }}>
            We're mobilizing tech workers and professionals – founders, engineers, marketers,
            lawyers, analysts, finance pros, and more – using our unique skillsets to fight for
            Palestine. With your Hub access, you can:
          </Typography>
          <Box
            component="ul"
            sx={{
              ml: 3,
              pl: 2,
              mb: 3,
              color: "#374151",
              listStyleType: "disc",
              "& li": { mb: 0.5, lineHeight: 1.75 },
            }}
          >
            <li>
              Browse and join teams scaling activism initiatives and tech projects for Palestine
            </li>
            <li>
              Create a team for your own activism initiative, and connect with T4P members for
              support and T4P leadership for strategy and resources
            </li>
            <li>See team updates, including progress and requests for support</li>
          </Box>
          <Typography variant="body1" sx={{ color: "#374151", lineHeight: 1.75, mb: 2 }}>
            T4P member accounts are anonymous by default - you can choose to share information
            about yourself with the community, or keep your account private.
          </Typography>
          <Typography variant="body1" sx={{ color: "#374151", lineHeight: 1.75, mb: 1, fontWeight: 600 }}>
            Coming soon:
          </Typography>
          <Box
            component="ul"
            sx={{
              ml: 3,
              pl: 2,
              color: "#374151",
              listStyleType: "disc",
              "& li": { mb: 0.5, lineHeight: 1.75 },
            }}
          >
            <li>Activism Journey - earn badges by trying out activism tools &amp; taking small actions</li>
            <li>Community meetups</li>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Contact */}
      <Box
        sx={{
          mt: 6,
          p: 3,
          borderRadius: 2,
          backgroundColor: "#f0fdf4",
          textAlign: "center",
        }}
      >
        <Typography variant="body1" sx={{ color: "#374151", lineHeight: 1.75 }}>
          If you have questions, set up an{" "}
          <a
            href="https://calendly.com/d/ctpm-sw2-yvc/t4p-intro-call?month=2026-03"
            style={{ color: "#168039", textDecoration: "underline", fontWeight: 600 }}
            target="_blank"
            rel="noopener noreferrer"
          >
            intro call
          </a>{" "}
          or reach out to us at{" "}
          <a
            href="mailto:membership@techforpalestine.org"
            style={{ color: "#168039", textDecoration: "underline", fontWeight: 600 }}
          >
            membership@techforpalestine.org
          </a>
          !
        </Typography>
      </Box>
    </Box>
  );
}
