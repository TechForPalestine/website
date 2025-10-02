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
import CoffeeIcon from "@mui/icons-material/Coffee";
import RestaurantIcon from "@mui/icons-material/Restaurant";

const theme = createTheme();

const themes = [
    { name: "Scaling Up Boycotts", icon: ShoppingCartIcon },
    { name: "Media Bias and Hasbara", icon: CampaignIcon },
    { name: "Protests and Activism", icon: GroupsIcon },
    { name: "Palestinian Tech Sector", icon: BusinessIcon },
    { name: "MedTech for Palestine", icon: MedicalServicesIcon },
    { name: "Hiring Palestinians", icon: WorkIcon },
    { name: "Social Media Censorship", icon: BlockIcon },
    { name: "Investors for Palestine", icon: TrendingUpIcon }
];

export default function LondonGathering() {
    return (
        <ThemeProvider theme={theme}>
            <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <Box className="bg-gradient-to-br from-red-50 to-green-50 py-16">
                <Container maxWidth="lg">
                    <Box className="text-center">
                        <Typography 
                            variant="h1" 
                            className="!font-bold !text-4xl sm:!text-5xl md:!text-6xl lg:!text-7xl !mb-6 bg-gradient-to-r from-[#EA4335] to-[#168039] bg-clip-text text-transparent"
                        >
                            T4P Community Gathering
                        </Typography>
                        
                        <Box className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 mb-2 text-gray-700 text-base sm:text-lg">
                            <Box className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm">
                                <LocationOnIcon className="text-[#EA4335]" />
                                <span className="font-medium">London</span>
                            </Box>
                            <Box className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm">
                                <CalendarTodayIcon className="text-[#168039]" />
                                <span className="font-medium">November 8, 2025</span>
                            </Box>
                        </Box>
                        
                        <Typography variant="h5" className="text-gray-700 font-medium !mb-4 text-lg sm:text-xl">
                            Palestine House
                        </Typography>
                        
                        <Button
                            variant="contained"
                            size="large"
                            className="bg-amber-800 hover:bg-amber-900 text-white px-8 sm:px-10 py-3 sm:py-4 rounded-full text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                            href="https://secure.qgiv.com/for/eventstest/event/t4pcommunitygatheringlondon"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Buy tickets
                        </Button>
                        
                        <div className="text-center">
                            <Typography variant="h6" className="text-gray-600 max-w-3xl !mx-auto leading-relaxed !mt-4">
                                A full day event for T4P community members with workshops and networking opportunities
                            </Typography>
                        </div>
                    </Box>
                </Container>
            </Box>

            {/* About the event */}
            <Container maxWidth="lg" className="!py-8 sm:!py-16">
                <Box className="text-center !mb-8">
                    <Typography variant="h2" className="!font-bold !text-4xl sm:!text-5xl md:!text-6xl !mb-4 text-gray-900">
                        About the event
                    </Typography>
                    <Box className="w-24 h-1 bg-gradient-to-r from-[#EA4335] to-[#168039] !mx-auto rounded-full"></Box>
                </Box>
                
                <Box className="grid md:grid-cols-2 !gap-6 md:!gap-12 items-center">
                    <Box className="space-y-6">
                        <Typography variant="h6" className="text-gray-800 leading-relaxed !text-lg sm:!text-xl text-left">
                            The Tech for Palestine Community Gathering will bring together 100 professionals who work at the intersection of tech and pro-Palestine activism.
                        </Typography>
                        
                        <Typography variant="body1" className="text-gray-700 leading-relaxed !text-lg text-left">
                            Whether you work in the field of combatting media bias, scaling boycotts, making protests safer, or building alternatives to big tech platforms, this event is for you.
                        </Typography>
                        
                        <Typography variant="body1" className="text-gray-700 leading-relaxed !text-lg text-left">
                            The gathering will also be open to entrepreneurs, investors and organizers who want to network with innovators and support their work.
                        </Typography>
                        
                        <Box className="pt-4">
                            <Button
                                variant="contained"
                                size="large"
                                className="bg-amber-800 hover:bg-amber-900 text-white px-8 py-3 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                                href="https://secure.qgiv.com/for/eventstest/event/t4pcommunitygatheringlondon"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Buy tickets
                            </Button>
                        </Box>
                    </Box>
                    
                    <Box className="relative">
                        <Box className="absolute inset-0 bg-gradient-to-br from-[#EA4335]/10 to-[#168039]/10 rounded-2xl transform rotate-3"></Box>
                        <Box className="relative bg-white rounded-2xl p-2 shadow-xl">
                            <img 
                                src="/images/london-gathering/about-image.webp" 
                                alt="Tech for Palestine community gathering"
                                className="w-full aspect-[4/3] object-cover rounded-xl"
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
                    <Box className="text-center !mb-8">
                        <Typography variant="h2" className="!font-bold !text-4xl sm:!text-5xl md:!text-6xl !mb-4 text-gray-900">
                            Location
                        </Typography>
                        <Box className="w-24 h-1 bg-gradient-to-r from-[#EA4335] to-[#168039] !mx-auto rounded-full"></Box>
                    </Box>
                    
                    <Box className="grid md:grid-cols-2 gap-12 items-center">
                        <Box className="relative">
                            <Box className="rounded-2xl aspect-square overflow-hidden shadow-lg">
                                <img 
                                    src="/images/london-gathering/location-left-image.webp" 
                                    alt="Palestine House location in London"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = "/images/default.jpg";
                                    }}
                                />
                            </Box>
                        </Box>
                        
                        <Box>
                            <Card className="p-8 rounded-2xl border-0 shadow-xl bg-white">
                                <CardContent className="p-0">
                                    <Typography variant="h3" className="font-bold mb-6 text-gray-900">
                                        London
                                    </Typography>
                                    
                                    <Box>
                                        <Box className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                                            <Box className="p-2 bg-[#168039] rounded-full">
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
                                        
                                        <Box className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                                            <Box className="p-2 bg-[#EA4335] rounded-full">
                                                <LocationOnIcon className="text-white" />
                                            </Box>
                                            <div>
                                                <Typography variant="body1" className="font-semibold text-gray-900 mb-1">
                                                    Palestine House
                                                </Typography>
                                                <Typography variant="body2" className="text-gray-600">
                                                    113 High Holborn<br/>
                                                    London WC1V 6JQ
                                                </Typography>
                                            </div>
                                        </Box>
                                    </Box>
                                    
                                    <Button
                                        variant="outlined"
                                        className="mt-6 border-[#EA4335] text-[#EA4335] hover:bg-[#EA4335] hover:text-white px-6 py-2 rounded-full"
                                        href="https://maps.app.goo.gl/yzdjzqE5PvYLjpX49"
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

            {/* Themes */}
            <Container maxWidth="lg" className="py-16">
                <Box className="text-center !mb-8">
                    <Typography variant="h2" className="!font-bold !text-4xl sm:!text-5xl md:!text-6xl !mb-4 text-gray-900">
                        Themes
                    </Typography>
                    <Box className="w-24 h-1 bg-gradient-to-r from-[#EA4335] to-[#168039] !mx-auto rounded-full"></Box>
                </Box>
                
                <Box className="flex flex-wrap justify-center gap-4">
                    {themes.map((theme, index) => {
                        const IconComponent = theme.icon;
                        return (
                            <Chip
                                key={index}
                                icon={<IconComponent className="!text-current" />}
                                label={theme.name}
                                className="px-6 py-3 text-base font-medium bg-white border-2 border-gray-200 hover:border-[#EA4335] hover:bg-[#EA4335] hover:text-white transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md"
                            />
                        );
                    })}
                </Box>
            </Container>

            {/* Agenda */}
            <Box className="bg-gray-50 py-16">
                <Container maxWidth="lg">
                    <Box className="text-center !mb-12">
                        <Typography variant="h2" className="!font-bold !text-4xl sm:!text-5xl md:!text-6xl !mb-4 text-gray-900">
                            Agenda
                        </Typography>
                        <Box className="w-24 h-1 bg-gradient-to-r from-[#EA4335] to-[#168039] !mx-auto rounded-full"></Box>
                    </Box>
                    
                    <Box className="max-w-4xl !mx-auto space-y-6">
                        {/* Registration */}
                        <Card className="p-6 rounded-2xl border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-300">
                            <Box className="flex items-center gap-4 mb-2">
                                <Box className="p-3 bg-[#EA4335] rounded-full min-w-fit">
                                    <CoffeeIcon className="text-white" />
                                </Box>
                                <Box>
                                    <Typography variant="h5" className="font-bold text-gray-900">
                                        9:00 - 10:00
                                    </Typography>
                                    <Typography variant="h6" className="text-[#EA4335] font-semibold">
                                        Registration and welcome coffee
                                    </Typography>
                                </Box>
                            </Box>
                        </Card>

                        {/* Opening */}
                        <Card className="p-6 rounded-2xl border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-300">
                            <Box className="flex items-center gap-4 mb-2">
                                <Box className="p-3 bg-[#168039] rounded-full min-w-fit">
                                    <AccessTimeIcon className="text-white" />
                                </Box>
                                <Box>
                                    <Typography variant="h5" className="font-bold text-gray-900">
                                        10:00 - 10:30
                                    </Typography>
                                    <Typography variant="h6" className="text-[#168039] font-semibold">
                                        Opening of the event
                                    </Typography>
                                </Box>
                            </Box>
                        </Card>

                        {/* Workshop Session 1 */}
                        <Card className="p-6 rounded-2xl border-0 shadow-lg bg-gradient-to-r from-[#EA4335]/5 to-[#168039]/5 hover:shadow-xl transition-all duration-300">
                            <Box className="flex items-start gap-4 mb-4">
                                <Box className="p-3 bg-gradient-to-r from-[#EA4335] to-[#168039] rounded-full min-w-fit">
                                    <GroupsIcon className="text-white" />
                                </Box>
                                <Box className="flex-1">
                                    <Typography variant="h5" className="font-bold text-gray-900">
                                        10:30 - 12:00
                                    </Typography>
                                    <Typography variant="h6" className="bg-gradient-to-r from-[#EA4335] to-[#168039] bg-clip-text text-transparent font-bold mb-3">
                                        Workshop Session 1
                                    </Typography>
                                    <Box className="space-y-2">
                                        <Typography variant="body1" className="text-gray-800">
                                            • Breakout 1: Pro-Palestine Activism in the UK
                                        </Typography>
                                        <Typography variant="body1" className="text-gray-800">
                                            • Breakout 2: The Palestinian Tech Sector Today and Tomorrow
                                        </Typography>
                                        <Typography variant="body1" className="text-gray-800">
                                            • Breakout 3: MedTech for Palestine
                                        </Typography>
                                        <Typography variant="body1" className="text-gray-800">
                                            • Breakout 4: Scaling Boycotts through Tech
                                        </Typography>
                                        <Typography variant="body1" className="text-gray-800">
                                            • Breakout 5: Combatting Media Bias and Hasbara
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Card>

                        {/* Lunch */}
                        <Card className="p-6 rounded-2xl border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-300">
                            <Box className="flex items-center gap-4 mb-2">
                                <Box className="p-3 bg-amber-800 rounded-full min-w-fit">
                                    <RestaurantIcon className="text-white" />
                                </Box>
                                <Box>
                                    <Typography variant="h5" className="font-bold text-gray-900">
                                        12:00 - 13:30
                                    </Typography>
                                    <Typography variant="h6" className="text-amber-800 font-semibold">
                                        Lunch
                                    </Typography>
                                </Box>
                            </Box>
                        </Card>

                        {/* Workshop Session 2 */}
                        <Card className="p-6 rounded-2xl border-0 shadow-lg bg-gradient-to-r from-[#168039]/5 to-[#EA4335]/5 hover:shadow-xl transition-all duration-300">
                            <Box className="flex items-start gap-4 mb-4">
                                <Box className="p-3 bg-gradient-to-r from-[#168039] to-[#EA4335] rounded-full min-w-fit">
                                    <GroupsIcon className="text-white" />
                                </Box>
                                <Box className="flex-1">
                                    <Typography variant="h5" className="font-bold text-gray-900">
                                        13:30 - 15:00
                                    </Typography>
                                    <Typography variant="h6" className="bg-gradient-to-r from-[#168039] to-[#EA4335] bg-clip-text text-transparent font-bold mb-3">
                                        Workshop Session 2
                                    </Typography>
                                    <Box className="space-y-2">
                                        <Typography variant="body1" className="text-gray-800">
                                            • Breakout 6: Social Media Activism and Censorship
                                        </Typography>
                                        <Typography variant="body1" className="text-gray-800">
                                            • Breakout 7: Investors for Palestine
                                        </Typography>
                                        <Typography variant="body1" className="text-gray-800">
                                            • Breakout 8: Hiring Palestinian Talent
                                        </Typography>
                                        <Typography variant="body1" className="text-gray-800">
                                            • Breakout 9: Tech and Humanitarian Aid
                                        </Typography>
                                        <Typography variant="body1" className="text-gray-800">
                                            • Breakout 10: Data and AI for Palestine
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Card>

                        {/* Closing */}
                        <Card className="p-6 rounded-2xl border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-300">
                            <Box className="flex items-center gap-4 mb-2">
                                <Box className="p-3 bg-[#EA4335] rounded-full min-w-fit">
                                    <CoffeeIcon className="text-white" />
                                </Box>
                                <Box>
                                    <Typography variant="h5" className="font-bold text-gray-900">
                                        15:00 - 16:00
                                    </Typography>
                                    <Typography variant="h6" className="text-[#EA4335] font-semibold">
                                        Closing and coffee
                                    </Typography>
                                </Box>
                            </Box>
                        </Card>
                    </Box>
                </Container>
            </Box>

            {/* About Tech for Palestine */}
            <Container maxWidth="lg" className="py-16">
                <Box className="text-center !mb-8">
                    <Typography variant="h2" className="!font-bold !text-4xl sm:!text-5xl md:!text-6xl !mb-4 text-gray-900">
                        About Tech for Palestine
                    </Typography>
                    <Box className="w-24 h-1 bg-gradient-to-r from-[#EA4335] to-[#168039] !mx-auto rounded-full"></Box>
                </Box>
                
                <Box className="grid md:grid-cols-2 gap-12 items-center !mb-6">
                    <Box>
                        <Typography variant="h6" className="text-gray-800 leading-relaxed text-lg !mb-6 text-left">
                            We bring together a global community of tech professionals who support the Palestinian liberation movement and want to contribute their expertise to meaningful, impactful tech projects.
                        </Typography>
                    </Box>
                    
                    <Box className="grid grid-cols-2 gap-6">
                        <Card className="p-6 text-center border-0 rounded-2xl shadow-lg bg-gradient-to-br from-[#EA4335]/5 to-[#EA4335]/10 hover:shadow-xl transition-all duration-300 cursor-pointer" onClick={() => window.open('/projects', '_blank')}>
                            <RocketLaunchIcon className="text-[#EA4335] mx-auto mb-2" fontSize="large" />
                            <Typography variant="h4" className="font-bold mb-2 text-[#EA4335]">
                                70+
                            </Typography>
                            <Typography variant="h6" className="font-semibold mb-2 text-gray-900">
                                Incubator
                            </Typography>
                            <Typography variant="body2" className="text-gray-600">
                                Impactful advocacy projects
                            </Typography>
                        </Card>
                        
                        <Card className="p-6 text-center border-0 rounded-2xl shadow-lg bg-gradient-to-br from-[#168039]/5 to-[#168039]/10 hover:shadow-xl transition-all duration-300 cursor-pointer" onClick={() => window.open('/about', '_blank')}>
                            <PeopleIcon className="text-[#168039] mx-auto mb-2" fontSize="large" />
                            <Typography variant="h4" className="font-bold mb-2 text-[#168039]">
                                9K+
                            </Typography>
                            <Typography variant="h6" className="font-semibold mb-2 text-gray-900">
                                Community
                            </Typography>
                            <Typography variant="body2" className="text-gray-600">
                                Tech workers worldwide
                            </Typography>
                        </Card>
                        
                        <Card className="p-6 text-center border-0 rounded-2xl shadow-lg bg-gradient-to-br from-[#EA4335]/5 to-[#EA4335]/10 hover:shadow-xl transition-all duration-300 cursor-pointer" onClick={() => window.open('https://techforpalestine.org/volunteer', '_blank')}>
                            <VolunteerActivismIcon className="text-[#EA4335] mx-auto mb-2" fontSize="large" />
                            <Typography variant="h4" className="font-bold mb-2 text-[#EA4335]">
                                1K+
                            </Typography>
                            <Typography variant="h6" className="font-semibold mb-2 text-gray-900">
                                Volunteers
                            </Typography>
                            <Typography variant="body2" className="text-gray-600">
                                Donate skills to projects you care about
                            </Typography>
                        </Card>
                        
                        <Card className="p-6 text-center border-0 rounded-2xl shadow-lg bg-gradient-to-br from-[#168039]/5 to-[#168039]/10 hover:shadow-xl transition-all duration-300 cursor-pointer" onClick={() => window.open('/e4p', '_blank')}>
                            <AccountBalanceIcon className="text-[#168039] mx-auto mb-2" fontSize="large" />
                            <Typography variant="h4" className="font-bold mb-2 text-[#168039]">
                                250+
                            </Typography>
                            <Typography variant="h6" className="font-semibold mb-2 text-gray-900">
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
                    <Box className="text-center !mb-8">
                        <Typography variant="h2" className="!font-bold !text-4xl sm:!text-5xl md:!text-6xl !mb-4 text-gray-900">
                            Sponsors
                        </Typography>
                        <Box className="w-24 h-1 bg-gradient-to-r from-[#EA4335] to-[#168039] !mx-auto rounded-full"></Box>
                    </Box>
                    
                    <Box className="text-center !mb-8">
                        <Card className="inline-block bg-white p-8 rounded-2xl shadow-xl transform hover:scale-105 transition-transform duration-300">
                            <a href="https://www.ya-soko.com/" target="_blank" rel="noopener noreferrer" className="block">
                                <img 
                                    src="/images/london-gathering/YASOKO.webp" 
                                    alt="YASOKO Sponsor"
                                    className="h-24 w-auto mx-auto"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        // Fallback to text if image fails
                                        target.style.display = 'none';
                                        const parent = target.parentElement;
                                        if (parent) {
                                            parent.innerHTML = '<Typography variant="h3" className="font-bold text-black">YASOKO</Typography>';
                                        }
                                    }}
                                />
                            </a>
                        </Card>
                    </Box>
                    
                    <Card className="max-w-2xl !mx-auto p-8 text-center border-0 rounded-2xl shadow-xl bg-white">
                        <Typography variant="h4" className="font-bold !mb-4 text-gray-900">
                            Interested in becoming a sponsor?
                        </Typography>
                        <Typography variant="body1" className="text-gray-600 !mb-6 text-lg">
                            Contact us to receive our sponsorship package and learn more about T4P initiatives.
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<EmailIcon />}
                            size="large"
                            className="bg-amber-800 hover:bg-amber-900 text-white px-8 py-3 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
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
                        <Typography variant="h2" className="font-bold text-4xl md:text-5xl !mb-6">
                            Ready to join us?
                        </Typography>
                        <Typography variant="h6" className="!mb-8 max-w-3xl !mx-auto leading-relaxed opacity-90">
                            Don't miss this opportunity to connect with fellow tech professionals 
                            supporting Palestine and learn about impactful projects.
                        </Typography>
                        <Button
                            variant="contained"
                            size="large"
                            className="bg-amber-800 text-white hover:bg-amber-900 px-12 py-4 rounded-full text-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300"
                            id="tickets"
                            href="https://secure.qgiv.com/for/eventstest/event/t4pcommunitygatheringlondon"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Buy tickets
                        </Button>
                    </Box>
                </Container>
            </Box>
            </div>
        </ThemeProvider>
    );
}