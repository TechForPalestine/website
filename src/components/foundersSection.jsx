import { Box, Typography, Avatar, Grid, Paper, Stack } from "@mui/material";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";

const founders = [
  {
    name: "Chris Musei-Sequeira",
    title: "Founder, CJSC — USA",
    image: "/images/chris-linkedin.jpg",
    linkedin: "https://www.linkedin.com/in/cjsequeira/",
    quote: `I'm so glad to be a member of Entrepreneurs for Palestine,
where I know everyone stands for basic human decency.
We are so many different people from so many parts of the world,
but we all agree on this most fundamental value.`,
  },
  {
    name: "Sami Abu Heiba",
    title: "Founder, GIL — Palestine",
    image: "/images/sami-linkedin.jpg",
    linkedin: "https://www.linkedin.com/in/samiabuheiba/",
    quote: `Joining E4P has been an incredibly rich and inspiring experience.
It connected me with a diverse community of purpose-driven entrepreneurs
and gave me access to valuable tools, insights, and opportunities for growth.
Being part of this network reminds me daily of the power of collaboration and shared impact.`,
  },
  {
    name: "Ariana Alexander-Sefre",
    title: "Founder, SPOKE — UK",
    image: "/images/ariana-linkedin.jpg",
    linkedin: "https://www.linkedin.com/in/arianasefre/",
    quote: `I joined E4P because I started to ask myself who I can truly trust.
I don’t want to work with, or take investment from, people who aren’t on the right side of history.
From now on, I believe it’s essential to align with people and brands who will stand up to injustice when they see it.
That’s why E4P is a great community; because everyone here shares those values.`,
  },
];

export default function FoundersTestimonials() {
  return (
    <Box py={12}>
      <Typography variant="h4" align="center" fontWeight="bold" mb={8}>
        Testimonials
      </Typography>
      <Grid container spacing={6} justifyContent="center">
        {founders.map((f, i) => (
          <Grid item xs={12} sm={6} md={4} key={i}>
            <Paper
              elevation={4}
              sx={{
                p: 5,
                borderRadius: 5,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                position: "relative",
                background: "linear-gradient(135deg, #ffffff, #f9f9f9)",
                boxShadow: "0 8px 20px rgba(0,0,0,0.05)",
              }}
            >
              <FormatQuoteIcon
                sx={{
                  position: "absolute",
                  top: 20,
                  left: 20,
                  fontSize: 50,
                  color: "grey.200",
                }}
              />
              <Typography
                variant="body1"
                sx={{ mb: 2, ml: 4, color: "text.primary", fontStyle: "italic" }}
              >
                {f.quote}
              </Typography>

              <Stack direction="row" spacing={2} alignItems="center" mt="auto">
                <Avatar src={f.image} alt={f.name} sx={{ width: 60, height: 60 }} />
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {f.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {f.title}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
