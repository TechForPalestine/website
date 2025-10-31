import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  IconButton,
  Button,
  Grid,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

interface Speaker {
  id: string;
  name: string;
  title: string;
  bio: string;
  photo: string;
}

interface LondonGatheringSpeakersProps {
  initialSpeakers?: Speaker[];
}

export default function LondonGatheringSpeakers({
  initialSpeakers = [],
}: LondonGatheringSpeakersProps) {
  const [speakers, setSpeakers] = useState<Speaker[]>(initialSpeakers);
  const [loading, setLoading] = useState(initialSpeakers.length === 0);
  const [selectedSpeaker, setSelectedSpeaker] = useState<Speaker | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Only fetch if no initial data provided
    if (initialSpeakers.length === 0) {
      fetchSpeakers();
    }
  }, []);

  const fetchSpeakers = async () => {
    try {
      const response = await fetch("/api/speakers");
      const data = await response.json();
      setSpeakers(data.speakers || []);
    } catch (error) {
      console.error("Error fetching speakers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClickOpen = (speaker: Speaker) => {
    setSelectedSpeaker(speaker);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" className="py-16">
        <Box className="text-center">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" className="py-16">
      <Box className="!mb-12 text-center">
        <Typography
          variant="h2"
          className="!mb-4 !text-4xl !font-bold text-gray-900 sm:!text-5xl md:!text-6xl"
        >
          Speakers
        </Typography>
        <Box className="!mx-auto h-1 w-24 rounded-full bg-gradient-to-r from-[#EA4335] to-[#168039]"></Box>
      </Box>

      <Grid container spacing={4} justifyContent="center">
        {speakers.map((speaker) => (
          <Grid item xs={6} sm={4} md={2.4} key={speaker.id}>
            <Box
              className="cursor-pointer text-center transition-transform duration-300 hover:scale-105"
              onClick={() => handleClickOpen(speaker)}
            >
              <Avatar
                src={speaker.photo}
                alt={speaker.name}
                sx={{
                  width: 120,
                  height: 120,
                  margin: "0 auto 12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                  },
                }}
              />
              <Typography variant="h6" className="!mb-1 !text-base !font-bold text-gray-900">
                {speaker.name}
              </Typography>
              <Typography variant="body2" className="!text-sm text-gray-600">
                {speaker.title}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Speaker Bio Modal */}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "16px",
          },
        }}
      >
        {selectedSpeaker && (
          <>
            <DialogTitle sx={{ m: 0, p: 2, paddingRight: 6 }}>
              <Box className="flex items-center gap-3">
                <Avatar
                  src={selectedSpeaker.photo}
                  alt={selectedSpeaker.name}
                  sx={{
                    width: 60,
                    height: 60,
                  }}
                />
                <Box>
                  <Typography variant="h6" className="!font-bold">
                    {selectedSpeaker.name}
                  </Typography>
                  <Typography variant="body2" className="text-gray-600">
                    {selectedSpeaker.title}
                  </Typography>
                </Box>
              </Box>
              <IconButton
                aria-label="close"
                onClick={handleClose}
                sx={{
                  position: "absolute",
                  right: 8,
                  top: 8,
                  color: (theme) => theme.palette.grey[500],
                }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <Typography variant="body1" className="leading-relaxed text-gray-800">
                {selectedSpeaker.bio || "Bio coming soon..."}
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose} className="!text-[#EA4335]">
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
}
