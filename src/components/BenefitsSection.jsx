import { Box, Grid, Typography, Paper, useTheme, Container } from "@mui/material";
import GroupIcon from "@mui/icons-material/Group";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import EventIcon from "@mui/icons-material/Event";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import GavelIcon from "@mui/icons-material/Gavel";
import CampaignIcon from "@mui/icons-material/Campaign";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import Diversity3Icon from "@mui/icons-material/Diversity3";
import MoneyIcon from "@mui/icons-material/Money";

const benefits = [
    {
        title: "Community",
        description: "A supportive community of peers who share the same values",
        icon: <GroupIcon fontSize="large" />,
    },
    {
        title: "New Business & Networking",
        description: "Opportunities to generate new business and build your professional network",
        icon: <PeopleAltIcon fontSize="large" />,
    },
    {
        title: "In-Person Meetups",
        description: "Invitations to in-person meetups around the world with local E4P members",
        icon: <EventIcon fontSize="large" />,
    },
    {
        title: "Funding Introductions",
        description: "Introductions to values-aligned VCs, angel investors and other sources of funding",
        icon: <MoneyIcon fontSize="large" />,
    },
    {
        title: "Hiring Support",
        description: "Support for enriching your hiring pipeline with Palestinian and pro-Palestine talent",
        icon: <Diversity3Icon fontSize="large" />,
    },
    {
        title: "Boycott Alternatives",
        description: "Lists of companies and tech products to boycott and alternatives",
        icon: <RocketLaunchIcon fontSize="large" />,
    },
    {
        title: "PR Assistance",
        description: "PR assistance by amplifying your posts and showcasing your business",
        icon: <CampaignIcon fontSize="large" />,
    },
    {
        title: "Mentorship & Coaching",
        description: "Mentorship and personal coaching by other E4P members",
        icon: <VolunteerActivismIcon fontSize="large" />,
    },
    {
        title: "Legal Assistance",
        description: "Pro bono or discounted legal assistance in case of any legal issues",
        icon: <GavelIcon fontSize="large" />,
    }
];


export function BenefitsSection() {
    const theme = useTheme();

    return (
        <Box py={10}>
            <Container>
                <Typography variant="h4" align="center" fontWeight="bold" mb={6}>
                    By Joining, You Will Get Access To:
                </Typography>

                <Grid container spacing={4}>
                    {benefits.map((item, index) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                            <Paper
                                elevation={3}
                                sx={{
                                    p: 4,
                                    height: "100%",
                                    borderRadius: 3,
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    textAlign: "center",
                                    gap: 2,
                                    transition: "transform 0.2s, box-shadow 0.2s",
                                    "&:hover": {
                                        transform: "translateY(-4px)",
                                        boxShadow: theme.shadows[6],
                                    },
                                }}
                            >
                                <Box color="black" mb={2}>
                                    {item.icon}
                                </Box>

                                <Typography variant="body1" color="text.primary">
                                    {item.description}
                                </Typography>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            </Container>
        </Box>
    );
}
