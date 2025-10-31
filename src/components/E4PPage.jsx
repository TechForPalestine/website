import React from "react";
import { Box, Container, Typography, Grid, Button } from "@mui/material";
import Map from "./Map.jsx";
import FoundersCarousel from "./foundersSection.jsx";
import { BenefitsSection } from "./BenefitsSection.jsx";

export function E4PPage() {
  return (
    <Box>
      <Container maxWidth="lg" sx={{ py: 10 }}>
        {/* Title + Intro */}
        <Typography variant="h2" fontWeight="bold" textAlign="center" gutterBottom>
          Entrepreneurs for Palestine
        </Typography>
        <Typography variant="body1" textAlign="center" maxWidth="md" mx="auto" mb={6}>
          Entrepreneurs for Palestine is a global community of founders and CEOs who are joining
          forces to stand up for what's right. As entrepreneurs, we hold a lot of collective power
          which we can use in order to make a difference for the Palestinian cause. We seek to make
          an impact by being intentional in how we hire, which clients and suppliers we work with,
          and where we fundraise.
        </Typography>

        {/* CTA Buttons */}
        <Box textAlign="center" mb={8}>
          <Button
            variant="contained"
            size="large"
            href="https://techforpalestine.org/e4p/sign-up"
            sx={{
              mx: 1,
              mb: 1,
              backgroundColor: "#15803d",
              color: "#fff",
              "&:hover": {
                backgroundColor: "#166534",
              },
            }}
          >
            Join the Community
          </Button>
          <Button
            variant="contained"
            size="large"
            href="/e4p/pledge"
            sx={{
              mx: 1,
              mb: 1,
              backgroundColor: "#dc2626",
              color: "#fff",
              "&:hover": {
                backgroundColor: "#b91c1c",
              },
            }}
          >
            Sign the E4P Pledge
          </Button>
        </Box>

        {/* Benefits Section Two-Column */}
        <BenefitsSection />

        {/* Global Community + Map */}
        <Box mb={10} sx={{ backgroundColor: "#f8fafc", p: 4, borderRadius: 2 }}>
          <Typography
            variant="h4"
            fontWeight="bold"
            textAlign="center"
            mb={2}
            sx={{ color: "#15803d" }}
          >
            A Global Community
          </Typography>
          <Typography variant="body1" textAlign="center" maxWidth="md" mx="auto" mb={4}>
            Our community spans across 44 countries on 6 continents. More than 270 CEOs and founders
            have already joined the movement.
          </Typography>
          <Box textAlign="center">
            <Map />
          </Box>
        </Box>

        <FoundersCarousel />

        {/* Sign Up + Calendars */}
        <Box sx={{ backgroundColor: "#fef2f2", p: 4, borderRadius: 2, mb: 6 }}>
          <Box textAlign="center" mb={6}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Ready to Join?
            </Typography>
            <Typography variant="body1" color="textSecondary" mb={3}>
              If you're an entrepreneur, schedule a short introductory call based on your region.
              Please include your company, position, and LinkedIn URL for verification.
            </Typography>
          </Box>

          <Grid container spacing={4} justifyContent="center" mb={4}>
            <Grid item xs={12} sm={6} md={6}>
              <Typography
                variant="subtitle1"
                gutterBottom
                align="center"
                sx={{ color: "#15803d", fontWeight: "bold" }}
              >
                Americas
              </Typography>
              <Box
                sx={{
                  height: 600,
                  width: "100%",
                  borderRadius: 2,
                  overflow: "hidden",
                  boxShadow: 1,
                }}
              >
                <iframe
                  title="Calendly Americas"
                  src="https://calendly.com/hsyed-hsyedlegal/entrepreneurs-for-palestine?background_color=ffffff&text_color=1a1a1a&primary_color=cf1026"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  allow="fullscreen"
                />
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={6}>
              <Typography
                variant="subtitle1"
                gutterBottom
                align="center"
                sx={{ color: "#15803d", fontWeight: "bold" }}
              >
                Europe / Asia
              </Typography>
              <Box
                sx={{
                  height: 600,
                  width: "100%",
                  borderRadius: 2,
                  overflow: "hidden",
                  boxShadow: 1,
                }}
              >
                <iframe
                  title="Calendly Europe/Asia"
                  src="https://calendly.com/megan-techforpalestine/30min?background_color=ffffff&text_color=1a1a1a&primary_color=cf1026"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  allow="fullscreen"
                />
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
}
