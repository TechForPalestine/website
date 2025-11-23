import React from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EmailIcon from "@mui/icons-material/Email";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import CampaignIcon from "@mui/icons-material/Campaign";
import GroupsIcon from "@mui/icons-material/Groups";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import WorkIcon from "@mui/icons-material/Work";
import BlockIcon from "@mui/icons-material/Block";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import BusinessIcon from "@mui/icons-material/Business";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import PeopleIcon from "@mui/icons-material/People";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import LondonGatheringSpeakers from "./LondonGatheringSpeakers";
import LondonGatheringAgenda from "./LondonGatheringAgenda";

const theme = createTheme();

const themes = [
  { name: "Scaling Up Boycotts", icon: ShoppingCartIcon },
  { name: "Media Bias and Hasbara", icon: CampaignIcon },
  { name: "Protests and Activism", icon: GroupsIcon },
  { name: "Palestinian Tech Sector", icon: BusinessIcon },
  { name: "MedTech for Palestine", icon: MedicalServicesIcon },
  { name: "Hiring Palestinians", icon: WorkIcon },
  { name: "Social Media Censorship", icon: BlockIcon },
  { name: "Investors for Palestine", icon: TrendingUpIcon },
];

interface LondonGatheringProps {
  initialAgendaData?: {
    agendaItems: any[];
    speakers: any[];
  };
}

export default function LondonGathering(
  { initialAgendaData }: LondonGatheringProps = {
    initialAgendaData: { agendaItems: [], speakers: [] },
  }
) {
  return (
    <ThemeProvider theme={theme}>
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <Box className="bg-gradient-to-br from-red-50 to-green-50 py-16">
          <Container maxWidth="lg">
            <Box className="text-center">
              <Typography
                variant="h1"
                className="!mb-6 bg-gradient-to-r from-[#EA4335] to-[#168039] bg-clip-text !text-4xl !font-bold text-transparent sm:!text-5xl md:!text-6xl lg:!text-7xl"
              >
                Tech for Palestine Gathering
              </Typography>

              <Box className="mb-2 flex flex-col items-center justify-center gap-4 text-base text-gray-700 sm:flex-row sm:gap-6 sm:text-lg">
                <Box className="flex items-center gap-3 rounded-full bg-white px-4 py-2 shadow-sm">
                  <LocationOnIcon className="text-[#EA4335]" />
                  <span className="font-medium">London</span>
                </Box>
                <Box className="flex items-center gap-3 rounded-full bg-white px-4 py-2 shadow-sm">
                  <CalendarTodayIcon className="text-[#168039]" />
                  <span className="font-medium">November 8, 2025</span>
                </Box>
              </Box>

              <Typography
                variant="h5"
                className="!mb-4 text-lg font-medium text-gray-700 sm:text-xl"
              >
                Palestine House
              </Typography>

              <img
                src="/images/london-gathering/sold-out-png-12.png"
                alt="Sold Out"
                className="mx-auto h-24 w-auto"
              />

              <div className="text-center">
                <Typography
                  variant="h6"
                  className="!mx-auto !mt-4 max-w-3xl leading-relaxed text-gray-600"
                >
                  A full day event for T4P community members with workshops and networking
                  opportunities
                </Typography>
              </div>
            </Box>
          </Container>
        </Box>

        {/* Themes */}
        <Container maxWidth="lg" className="py-16">
          <Box className="!mb-8 text-center">
            <Typography
              variant="h2"
              className="!mb-4 !text-4xl !font-bold text-gray-900 sm:!text-5xl md:!text-6xl"
            >
              Themes
            </Typography>
            <Box className="!mx-auto h-1 w-24 rounded-full bg-gradient-to-r from-[#EA4335] to-[#168039]"></Box>
          </Box>

          <Box className="flex flex-wrap justify-center gap-4">
            {themes.map((theme, index) => {
              const IconComponent = theme.icon;
              return (
                <Chip
                  key={index}
                  icon={<IconComponent className="!text-current" />}
                  label={theme.name}
                  className="cursor-pointer border-2 border-gray-200 bg-white px-6 py-3 text-base font-medium shadow-sm transition-all duration-300 hover:border-[#EA4335] hover:bg-[#EA4335] hover:text-white hover:shadow-md"
                />
              );
            })}
          </Box>
        </Container>

        {/* About the event */}
        <Container maxWidth="lg" className="!py-8 sm:!py-16">
          <Box className="!mb-8 text-center">
            <Typography
              variant="h2"
              className="!mb-4 !text-4xl !font-bold text-gray-900 sm:!text-5xl md:!text-6xl"
            >
              About the event
            </Typography>
            <Box className="!mx-auto h-1 w-24 rounded-full bg-gradient-to-r from-[#EA4335] to-[#168039]"></Box>
          </Box>

          <Box className="grid items-center !gap-6 md:grid-cols-2 md:!gap-12">
            <Box className="space-y-6">
              <Typography
                variant="h6"
                className="text-left !text-lg leading-relaxed text-gray-800 sm:!text-xl"
              >
                The Tech for Palestine Community Gathering will bring together 100 professionals who
                work at the intersection of tech and pro-Palestine activism.
              </Typography>

              <Typography
                variant="body1"
                className="text-left !text-lg leading-relaxed text-gray-700"
              >
                Whether you work in the field of combatting media bias, scaling boycotts, making
                protests safer, or building alternatives to big tech platforms, this event is for
                you.
              </Typography>

              <Typography
                variant="body1"
                className="text-left !text-lg leading-relaxed text-gray-700"
              >
                The gathering will also be open to entrepreneurs, investors and organizers who want
                to network with innovators and support their work.
              </Typography>

              <Box className="pt-4">
                <img
                  src="/images/london-gathering/sold-out-png-12.png"
                  alt="Sold Out"
                  className="h-24 w-auto"
                />
              </Box>
            </Box>

            <Box className="relative">
              <Box className="absolute inset-0 rotate-3 transform rounded-2xl bg-gradient-to-br from-[#EA4335]/10 to-[#168039]/10"></Box>
              <Box className="relative rounded-2xl bg-white p-2 shadow-xl">
                <img
                  src="/images/london-gathering/about-image.webp"
                  alt="Tech for Palestine community gathering"
                  className="aspect-[4/3] w-full rounded-xl object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/images/default.jpg";
                  }}
                />
              </Box>
            </Box>
          </Box>
        </Container>

        {/* Location */}
        <Box className="bg-gray-50 py-16">
          <Container maxWidth="lg">
            <Box className="!mb-8 text-center">
              <Typography
                variant="h2"
                className="!mb-4 !text-4xl !font-bold text-gray-900 sm:!text-5xl md:!text-6xl"
              >
                Location
              </Typography>
              <Box className="!mx-auto h-1 w-24 rounded-full bg-gradient-to-r from-[#EA4335] to-[#168039]"></Box>
            </Box>

            <Box className="grid items-center gap-12 md:grid-cols-2">
              <Box className="relative">
                <Box className="aspect-square overflow-hidden rounded-2xl shadow-lg">
                  <img
                    src="/images/london-gathering/location-left-image.webp"
                    alt="Palestine House location in London"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/images/default.jpg";
                    }}
                  />
                </Box>
              </Box>

              <Box>
                <Card className="rounded-2xl border-0 bg-white p-8 shadow-xl">
                  <CardContent className="p-0">
                    <Typography variant="h3" className="mb-6 font-bold text-gray-900">
                      London
                    </Typography>

                    <Box>
                      <Box className="flex items-center gap-4 rounded-xl bg-gray-50 p-4">
                        <Box className="rounded-full bg-[#168039] p-2">
                          <AccessTimeIcon className="text-white" />
                        </Box>
                        <div>
                          <Typography variant="body1" className="font-semibold text-gray-900">
                            9:00am - 4:00pm
                          </Typography>
                          <Typography variant="body2" className="text-gray-600">
                            Full day event
                          </Typography>
                        </div>
                      </Box>

                      <Box className="flex items-start gap-4 rounded-xl bg-gray-50 p-4">
                        <Box className="rounded-full bg-[#EA4335] p-2">
                          <LocationOnIcon className="text-white" />
                        </Box>
                        <div>
                          <Typography variant="body1" className="mb-1 font-semibold text-gray-900">
                            Palestine House
                          </Typography>
                          <Typography variant="body2" className="text-gray-600">
                            113 High Holborn
                            <br />
                            London WC1V 6JQ
                          </Typography>
                        </div>
                      </Box>
                    </Box>

                    <Button
                      variant="outlined"
                      className="mt-6 rounded-full border-[#EA4335] px-6 py-2 text-[#EA4335] hover:bg-[#EA4335] hover:text-white"
                      href="https://maps.app.goo.gl/nhy7XaRrfPh4Usex6"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Get directions
                    </Button>
                  </CardContent>
                </Card>
              </Box>
            </Box>
          </Container>
        </Box>

        {/* Speakers */}
        <LondonGatheringSpeakers initialSpeakers={initialAgendaData?.speakers || []} />

        {/* Agenda */}
        <LondonGatheringAgenda initialAgendaItems={initialAgendaData?.agendaItems || []} />

        {/* About Tech for Palestine */}
        <Container maxWidth="lg" className="py-16">
          <Box className="!mb-8 text-center">
            <Typography
              variant="h2"
              className="!mb-4 !text-4xl !font-bold text-gray-900 sm:!text-5xl md:!text-6xl"
            >
              About Tech for Palestine
            </Typography>
            <Box className="!mx-auto h-1 w-24 rounded-full bg-gradient-to-r from-[#EA4335] to-[#168039]"></Box>
          </Box>

          <Box className="!mb-6 grid items-center gap-12 md:grid-cols-2">
            <Box>
              <Typography
                variant="h6"
                className="!mb-6 text-left text-lg leading-relaxed text-gray-800"
              >
                We bring together a global community of tech professionals who support the
                Palestinian liberation movement and want to contribute their expertise to
                meaningful, impactful tech projects.
              </Typography>
            </Box>

            <Box className="grid grid-cols-2 gap-6">
              <Card
                className="cursor-pointer rounded-2xl border-0 bg-gradient-to-br from-[#EA4335]/5 to-[#EA4335]/10 p-6 text-center shadow-lg transition-all duration-300 hover:shadow-xl"
                onClick={() => window.open("/projects", "_blank")}
              >
                <RocketLaunchIcon className="mx-auto mb-2 text-[#EA4335]" fontSize="large" />
                <Typography variant="h4" className="mb-2 font-bold text-[#EA4335]">
                  70+
                </Typography>
                <Typography variant="h6" className="mb-2 font-semibold text-gray-900">
                  Incubator
                </Typography>
                <Typography variant="body2" className="text-gray-600">
                  Impactful advocacy projects
                </Typography>
              </Card>

              <Card
                className="cursor-pointer rounded-2xl border-0 bg-gradient-to-br from-[#168039]/5 to-[#168039]/10 p-6 text-center shadow-lg transition-all duration-300 hover:shadow-xl"
                onClick={() => window.open("/about", "_blank")}
              >
                <PeopleIcon className="mx-auto mb-2 text-[#168039]" fontSize="large" />
                <Typography variant="h4" className="mb-2 font-bold text-[#168039]">
                  9K+
                </Typography>
                <Typography variant="h6" className="mb-2 font-semibold text-gray-900">
                  Community
                </Typography>
                <Typography variant="body2" className="text-gray-600">
                  Tech workers worldwide
                </Typography>
              </Card>

              <Card
                className="cursor-pointer rounded-2xl border-0 bg-gradient-to-br from-[#EA4335]/5 to-[#EA4335]/10 p-6 text-center shadow-lg transition-all duration-300 hover:shadow-xl"
                onClick={() => window.open("https://techforpalestine.org/volunteer", "_blank")}
              >
                <VolunteerActivismIcon className="mx-auto mb-2 text-[#EA4335]" fontSize="large" />
                <Typography variant="h4" className="mb-2 font-bold text-[#EA4335]">
                  1K+
                </Typography>
                <Typography variant="h6" className="mb-2 font-semibold text-gray-900">
                  Volunteers
                </Typography>
                <Typography variant="body2" className="text-gray-600">
                  Donate skills to projects you care about
                </Typography>
              </Card>

              <Card
                className="cursor-pointer rounded-2xl border-0 bg-gradient-to-br from-[#168039]/5 to-[#168039]/10 p-6 text-center shadow-lg transition-all duration-300 hover:shadow-xl"
                onClick={() => window.open("/e4p", "_blank")}
              >
                <AccountBalanceIcon className="mx-auto mb-2 text-[#168039]" fontSize="large" />
                <Typography variant="h4" className="mb-2 font-bold text-[#168039]">
                  250+
                </Typography>
                <Typography variant="h6" className="mb-2 font-semibold text-gray-900">
                  Entrepreneurs
                </Typography>
                <Typography variant="body2" className="text-gray-600">
                  Pro-Palestine entrepreneurs
                </Typography>
              </Card>
            </Box>
          </Box>
        </Container>

        {/* Sponsors */}
        <Box className="bg-gray-50 py-16">
          <Container maxWidth="lg">
            <Box className="!mb-8 text-center">
              <Typography
                variant="h2"
                className="!mb-4 !text-4xl !font-bold text-gray-900 sm:!text-5xl md:!text-6xl"
              >
                Sponsors
              </Typography>
              <Box className="!mx-auto h-1 w-24 rounded-full bg-gradient-to-r from-[#EA4335] to-[#168039]"></Box>
            </Box>

            {/* Premium Sponsor */}
            <Box className="!mb-12 text-center">
              <Typography variant="h4" className="!mb-6 !font-bold text-gray-700">
                Premium Sponsor
              </Typography>
              <Card className="inline-block transform rounded-2xl bg-white p-12 shadow-xl transition-transform duration-300 hover:scale-105">
                <a
                  href="https://www.dna.online/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <img
                    src="/images/london-gathering/DNA.webp"
                    alt="DNA Premium Sponsor"
                    className="mx-auto h-32 w-auto"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML =
                          '<Typography variant="h3" className="font-bold text-black">DNA</Typography>';
                      }
                    }}
                  />
                </a>
              </Card>
            </Box>

            {/* Gold Sponsors */}
            <Box className="!mb-8 text-center">
              <Typography variant="h4" className="!mb-6 !font-bold text-gray-700">
                Gold Sponsors
              </Typography>
              <Box className="flex flex-wrap justify-center gap-8">
                <Card className="transform rounded-2xl bg-white p-8 shadow-xl transition-transform duration-300 hover:scale-105">
                  <a
                    href="https://allyforaction.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <img
                      src="/images/london-gathering/Host_Logo_Artworks_RGB_Colour_Blue.webp"
                      alt="Host Gold Sponsor"
                      className="mx-auto h-24 w-auto"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML =
                            '<Typography variant="h3" className="font-bold text-black">Host</Typography>';
                        }
                      }}
                    />
                  </a>
                </Card>

                <Card className="transform rounded-2xl bg-white p-8 shadow-xl transition-transform duration-300 hover:scale-105">
                  <a
                    href="https://www.ya-soko.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <img
                      src="/images/london-gathering/YASOKO.webp"
                      alt="YASOKO Gold Sponsor"
                      className="mx-auto h-24 w-auto"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML =
                            '<Typography variant="h3" className="font-bold text-black">YASOKO</Typography>';
                        }
                      }}
                    />
                  </a>
                </Card>
              </Box>
            </Box>

            <Card className="!mx-auto max-w-2xl rounded-2xl border-0 bg-white p-8 text-center shadow-xl">
              <Typography variant="h4" className="!mb-4 font-bold text-gray-900">
                Interested in becoming a sponsor?
              </Typography>
              <Typography variant="body1" className="!mb-6 text-lg text-gray-600">
                Contact us to receive our sponsorship package and learn more about T4P initiatives.
              </Typography>
              <Button
                variant="contained"
                startIcon={<EmailIcon />}
                size="large"
                className="rounded-full bg-amber-800 px-8 py-3 text-lg font-semibold text-white shadow-lg transition-all duration-300 hover:bg-amber-900 hover:shadow-xl"
                href="mailto:contact@techforpalestine.org"
              >
                Contact us
              </Button>
            </Card>
          </Container>
        </Box>

        {/* Call to Action */}
        <Box className="bg-gradient-to-br from-[#EA4335] to-[#168039] py-20">
          <Container maxWidth="lg">
            <Box className="text-center text-white">
              <Typography variant="h2" className="!mb-6 text-4xl font-bold md:text-5xl">
                Ready to join us?
              </Typography>
              <Typography
                variant="h6"
                className="!mx-auto !mb-8 max-w-3xl leading-relaxed opacity-90"
              >
                Don't miss this opportunity to connect with fellow tech professionals supporting
                Palestine and learn about impactful projects.
              </Typography>
              <img
                src="/images/london-gathering/sold-out-png-12.png"
                alt="Sold Out"
                className="mx-auto h-32 w-auto"
              />
            </Box>
          </Container>
        </Box>
      </div>
    </ThemeProvider>
  );
}
