import React from 'react';
import { Card, CardContent, Typography, Button, Grid, Box } from '@mui/material';
import LaunchIcon from '@mui/icons-material/Launch';

type Resource = {
  name: string;
  url: string;
  description?: string;
  logo: string;
};

type Section = {
  name: string;
  resources: Resource[];
};

export default function ResourceList({ sections }: { sections: Section[] }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
            <div style={{ maxWidth: '1200px', width: '100%', padding: '0 1rem' }}>
                {sections.map((section: Section) => (
                    <div key={section.name} style={{ marginBottom: '3rem' }}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                            {section.name}
                        </Typography>
                        <Grid container spacing={3}>
                            {section.resources.map((res: Resource) => (
                                <Grid item xs={12} sm={6} md={4} key={res.name}>
                                    <Card
                                        elevation={2}
                                        sx={{
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            borderRadius: 3,
                                            padding: 2,
                                            textAlign: 'center',
                                        }}
                                    >
                                        {/*<CardMedia*/}
                                        {/*    component="img"*/}
                                        {/*    image={res.logo}*/}
                                        {/*    alt={res.name}*/}
                                        {/*    sx={{*/}
                                        {/*        height: 60,*/}
                                        {/*        width: 60,*/}
                                        {/*        objectFit: 'contain',*/}
                                        {/*        margin: '1rem auto',*/}
                                        {/*    }}*/}
                                        {/*/>*/}
                                        <Box sx={{ height: 60, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                            <img src={res.logo} alt={res.name} style={{ maxHeight: '100%', maxWidth: '80%' }} />
                                        </Box>
                                        <CardContent sx={{ paddingBottom: 0 }}>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                                                {res.name}
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{ fontSize: '0.875rem', lineHeight: 1.6 }}
                                            >
                                                {res.description}
                                            </Typography>
                                        </CardContent>
                                        <Button
                                            href={res.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            endIcon={<LaunchIcon />}
                                            sx={{
                                                marginTop: '1.5rem',
                                                fontWeight: 500,
                                                textTransform: 'none',
                                                color: '#166534',
                                                backgroundColor: 'transparent',
                                                padding: 0,
                                                minWidth: 0,
                                                justifyContent: 'center',
                                                '&:hover': {
                                                    textDecoration: 'underline',
                                                    backgroundColor: 'transparent',
                                                },
                                            }}
                                        >
                                            {generateLabel(res.name)}
                                        </Button>

                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </div>
                ))}
            </div>
        </div>
    );
}

function generateLabel(name: string) {
    const map: Record<string, string> = {
        Upwork: 'Hire on Upwork',
        Dribble: 'View on Dribble',
        TAP: 'View TAP Program',
        Manara: 'Hire via Manara',
        Bees: 'Hire via Bees',
        Youmna: 'Meet Your Assistant',
    };

    const key = Object.keys(map).find((k) => name.includes(k));
    return key ? map[key] : `Explore ${name}`;
}
