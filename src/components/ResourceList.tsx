import React from 'react';
import {
    Card,
    CardContent,
    CardMedia,
    Typography,
    Button,
    Grid,
    CardActions
} from '@mui/material';

export default function ResourceList({ sections }) {
    return (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
                <div style={{ maxWidth: '1200px', width: '100%', padding: '0 1rem' }}>

                {sections.map((section) => (
                <div key={section.name} style={{ marginBottom: '2rem' }}>
                    <Typography variant="h5" gutterBottom>{section.name}</Typography>
                    <Grid container spacing={3}>
                        {section.resources.map((res) => (
                            <Grid item xs={12} sm={6} md={4} key={res.name}>
                                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                    <CardMedia
                                        component="img"
                                        image={res.logo}
                                        alt={res.name}
                                        sx={{
                                            height: 100,
                                            width: 100,
                                            objectFit: 'contain',
                                            margin: '1rem auto 0 auto',
                                        }}
                                    />

                                    <CardContent>
                                        <Typography variant="h6" component="div" gutterBottom>
                                            {res.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {res.description}
                                        </Typography>
                                    </CardContent>
                                    <CardActions sx={{ marginTop: 'auto', padding: 2 }}>
                                        <Button
                                            size="small"
                                            color="primary"
                                            href={res.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            variant="contained"
                                        >
                                            Visit Website
                                        </Button>
                                    </CardActions>
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
