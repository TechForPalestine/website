import React from "react";
import Slider from "react-slick";
import {
    Card,
    CardContent,
    Typography,
    Avatar,
    Box,
    Link,
    Container,
} from "@mui/material";
import LinkedInIcon from "@mui/icons-material/LinkedIn";

// founders array
const founders = [
    {
        name: "Aline Sara",
        title: "Co-Founder, Entrepreneurs for Palestine",
        image: "https://entrepreneursforpalestine.com/boondigitalsolut/wp-content/uploads/2025/02/5.png",
        linkedin: "https://www.linkedin.com/in/alinesara/",
    },
    {
        name: "Iva Gumnishka",
        title: "Co-Founder",
        image: "https://entrepreneursforpalestine.com/boondigitalsolut/wp-content/uploads/2024/12/15ce5e18-3dc8-4178-9051-ef9dac71effa.png",
        linkedin: "https://www.linkedin.com/in/ivagumnishka/",
    },
    {
        name: "Paul Biggar",
        title: "Founder, Tech for Palestine",
        image: "https://entrepreneursforpalestine.com/boondigitalsolut/wp-content/uploads/2025/02/7.png",
        linkedin: "https://www.linkedin.com/in/paulbiggar/",
    },
    {
        name: "Miguel de Icaza",
        title: "CEO, Xibbon",
        image: "https://entrepreneursforpalestine.com/boondigitalsolut/wp-content/uploads/2025/02/9.png",
        linkedin: "https://www.linkedin.com/in/migueld1/",
    },
    {
        name: "Fadi Ghandour",
        title: "Executive Chairman, Wamda Group",
        image: "https://entrepreneursforpalestine.com/boondigitalsolut/wp-content/uploads/2025/02/1-2.png",
        linkedin: "https://www.linkedin.com/in/fadi-ghandour-52353b/",
    },
    {
        name: "Amir Nathoo",
        title: "Co-Founder and CEO, Outschool",
        image: "https://entrepreneursforpalestine.com/boondigitalsolut/wp-content/uploads/2025/02/3.png",
        linkedin: "https://www.linkedin.com/in/amirnathoo/",
    },
    {
        name: "Stephanie Nadi Olson",
        title: "Founder and Executive Chair of the Board, We Are Rosie",
        image: "https://entrepreneursforpalestine.com/boondigitalsolut/wp-content/uploads/2025/02/2.png",
        linkedin: "https://www.linkedin.com/in/snadi/",
    },
    {
        name: "Reem Qawasmi",
        title: "Venture Partner, Ibtikar Fund",
        image: "https://entrepreneursforpalestine.com/boondigitalsolut/wp-content/uploads/2025/02/10.png",
        linkedin: "https://www.linkedin.com/in/reemqawasmi/",
    },
    {
        name: "Essma Bengabsia",
        title: "Founder, Bengabsia Consulting",
        image: "https://entrepreneursforpalestine.com/boondigitalsolut/wp-content/uploads/2025/02/6.png",
        linkedin: "https://www.linkedin.com/in/essmabengabsia/",
    },
    {
        name: "Arshan Ahmad",
        title: "Co-Founder, Friday Ventures",
        image: "https://entrepreneursforpalestine.com/boondigitalsolut/wp-content/uploads/2025/02/Photos-2.png",
        linkedin: "https://www.linkedin.com/in/arshanahmad/",
    },
];

const sliderSettings = {
    dots: true,
    arrows: true,
    infinite: true,
    speed: 500,
    autoplay: true,
    autoplaySpeed: 4000,
    slidesToShow: 3,
    slidesToScroll: 1,
    responsive: [
        {
            breakpoint: 960,
            settings: { slidesToShow: 2 },
        },
        {
            breakpoint: 600,
            settings: { slidesToShow: 1 },
        },
    ],
};

export default function FoundersCarousel() {
    return (
        <Box py={10}>
            <Container>
                <Typography variant="h4" fontWeight="bold" textAlign="center" mb={4}>
                    Meet the Founders
                </Typography>

                <Slider {...sliderSettings}>
                    {founders.map((f, i) => (
                        <Box key={i} px={2}>
                            <Card sx={{ textAlign: "center", height: "100%" }}>
                                <CardContent>
                                    <Avatar
                                        src={f.image}
                                        alt={f.name}
                                        sx={{ width: 100, height: 100, mx: "auto", mb: 2 }}
                                    />
                                    <Typography variant="h6">{f.name}</Typography>
                                    <Typography variant="body2" color="textSecondary" mb={1}>
                                        {f.title}
                                    </Typography>
                                    <Link
                                        href={f.linkedin}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        color="inherit"
                                        underline="hover"
                                        aria-label={`LinkedIn of ${f.name}`}
                                    >
                                        <LinkedInIcon fontSize="medium" />
                                    </Link>
                                </CardContent>
                            </Card>
                        </Box>
                    ))}
                </Slider>
            </Container>
        </Box>
    );
}
