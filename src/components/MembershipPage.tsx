import { useEffect, useRef, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
} from "@mui/material";
import MembershipCalculator from "./MembershipCalculator";

const teams = [
  {
    name: "Coaching for Palestinian Entrepreneurs",
    description:
      "Support Palestinian entrepreneurs with job skills for professional growth.",
  },
  {
    name: "Tech Accountability",
    description:
      "Develop content like blogs, social media posts, and more to hold tech companies accountable for supporting Israel's war crimes.",
  },
  {
    name: "Legal Aid",
    description:
      "Help connect pro-bono resources from law firms to cases of discrimination against the Palestinian identity or pro-Palestinian speech.",
  },
  {
    name: "US Events",
    description:
      "Organize in-person T4P events in the US to help grow the movement.",
  },
  {
    name: "T4P Hackathons",
    description:
      "Arrange hackathons to kickstart software solutions to movement problems.",
  },
  {
    name: "Boycott Search",
    description:
      "Develop a search engine that aggregates boycott targets and alternatives to Zionist resources, providing a central entry point to easily navigate boycotting information across organizations.",
  },
];

function QgivEmbed() {
  const scriptLoadedRef = useRef(false);

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
    <Box sx={{ overflow: "hidden" }}>
      <div
        className="qgiv-embed-container"
        data-qgiv-embed="true"
        data-embed-id="88902"
        data-embed="https://secure.qgiv.com/for/dafize/embed/88902/"
        data-width="630"
      />
    </Box>
  );
}

export default function MembershipPage() {
  const [showCalculator] = useState<boolean>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("calculator") !== "no";
  });

  useEffect(() => {
    if (typeof window.plausible !== "undefined") {
      window.plausible("Membership Page", {
        props: { membership_variant: showCalculator ? "Calculator" : "No Calculator" },
      });
    }
  }, [showCalculator]);

  return (
    <Box sx={{ maxWidth: 800, mx: "auto" }}>
      {/* Intro */}
      <Typography variant="h5" component="h2" sx={{ mb: 3, fontWeight: 700, color: "#111827" }}>
        Becoming a member is the best way to donate to Tech for Palestine
      </Typography>
      <Typography variant="body1" sx={{ mb: 2, fontSize: "1.125rem", lineHeight: 1.75, color: "#374151" }}>
        Your membership dues fund training, financial grants, and volunteers for pro-Palestine projects
        like Upscrolled, Boycat, and Newscord. We suggest monthly dues equal to one hour's salary.
      </Typography>
      <Typography variant="body1" sx={{ mb: 1, fontSize: "1.125rem", lineHeight: 1.75, color: "#374151" }}>
        As a member, you are invited to join our portal, the <strong>Hub</strong>, where you can:
      </Typography>
      <Box
        component="ul"
        sx={{
          ml: 3,
          pl: 2,
          mb: 2,
          color: "#374151",
          fontSize: "1.125rem",
          listStyleType: "disc",
          "& li": { mb: 0.75, lineHeight: 1.75 },
        }}
      >
        <li>Join teams working on advocacy projects for Palestinian liberation</li>
        <li>Start an initiative of your own, with T4P support and resources to help you grow</li>
        <li>Connect with our member network</li>
        <li>Receive a monthly newsletter with updates about T4P's work</li>
      </Box>
      <Typography variant="body1" sx={{ mb: 5, fontSize: "1.125rem", lineHeight: 1.75, color: "#374151" }}>
        Whether you're a thinker, builder, leader, software developer, marketer, or activist, there's a place for you to contribute in your own way.
      </Typography>

      {/* Team cards */}
      <Typography variant="h5" component="h2" sx={{ mb: 3, fontWeight: 700, color: "#111827" }}>
        A few examples of our teams:
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

      {/* Membership Dues */}
      <Typography variant="h5" component="h2" sx={{ mb: 3, fontWeight: 700, color: "#111827" }}>
        Membership Dues
      </Typography>
      <Typography variant="body1" sx={{ mb: 3, fontSize: "1.125rem", lineHeight: 1.75, color: "#374151" }}>
        {showCalculator
          ? "Contribute any amount for membership dues. We suggest monthly dues equal to one hour's salary, which you can calculate below:"
          : "Contribute any amount for membership dues. We suggest monthly dues equal to one hour's salary."}
      </Typography>

      {showCalculator && <MembershipCalculator />}

      {/* Payment form + side info */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 340px" },
          gap: 3,
          mt: 3,
          alignItems: "start",
        }}
      >
        <QgivEmbed />

        {/* Side info */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Inclusivity / waiver note */}
          <Box
            sx={{
              p: 3,
              borderRadius: 2,
              backgroundColor: "#f9fafb",
              border: "1px solid #e5e7eb",
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 700, color: "#111827", mb: 1.5, fontSize: "0.95rem" }}>
              Inclusivity &amp; waivers
            </Typography>
            <Typography variant="body2" sx={{ color: "#374151", lineHeight: 1.75, mb: 1.5 }}>
              Tech for Palestine aims for inclusivity. Please contact{" "}
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
                "& li": { mb: 0.5, lineHeight: 1.75, fontSize: "0.875rem" },
              }}
            >
              <li>Not having access to banking services/debit card</li>
              <li>Being located in Gaza or the West Bank</li>
              <li>Being a refugee from Gaza or the West Bank evacuated during the genocide</li>
              <li>Not being able to afford membership due to personal circumstances</li>
              <li>Being a T4P paid staff member</li>
            </Box>
            <Typography variant="body2" sx={{ color: "#374151", lineHeight: 1.75, mb: 1.5 }}>
              If you are in the US, your dues are tax deductible. If you are in the UK, contact us at{" "}
              <a
                href="mailto:membership@techforpalestine.org"
                style={{ color: "#168039", textDecoration: "underline" }}
              >
                membership@techforpalestine.org
              </a>{" "}
              after signup and we will ensure that future donations are processed through our gift aid
              partner.
            </Typography>
            <Typography variant="body2" sx={{ color: "#374151", lineHeight: 1.75, mb: 0 }}>
              Options to pay via DAF, cryptocurrency, foundations, and other methods will be supported
              in the future. We will help you migrate to your preferred method of giving once available.
            </Typography>
          </Box>

          {/* Contact */}
          <Box
            sx={{
              p: 3,
              borderRadius: 2,
              backgroundColor: "#f0fdf4",
              border: "1px solid #d1fae5",
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 700, color: "#111827", mb: 1.5, fontSize: "0.95rem" }}>
              Get in touch
            </Typography>
            <Typography variant="body2" sx={{ color: "#374151", lineHeight: 1.75 }}>
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
      </Box>
    </Box>
  );
}
