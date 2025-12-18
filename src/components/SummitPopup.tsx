import { useState, useEffect } from "react";
import { Dialog, DialogContent, IconButton, Button, Box } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

export default function SummitPopup() {
  const [open, setOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    // Check if user has already seen the popup in this session
    const hasSeenPopup = sessionStorage.getItem("summitPopupSeen");

    if (!hasSeenPopup) {
      // Show popup after a short delay
      const timer = setTimeout(() => {
        setOpen(true);
        sessionStorage.setItem("summitPopupSeen", "true");
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setOpen(false);
  };

  const handleImageClick = () => {
    window.open("https://summit.techforpalestine.org", "_blank", "noopener,noreferrer");
    handleClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      PaperProps={{
        sx: {
          backgroundColor: "transparent",
          boxShadow: "none",
          overflow: "visible",
          maxHeight: "90vh",
        },
      }}
    >
      <DialogContent
        sx={{
          position: "relative",
          padding: "16px",
          backgroundColor: "black",
          borderRadius: "8px",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            color: "black",
            "&:hover": {
              backgroundColor: "#f3f4f6",
            },
            zIndex: 2,
          }}
        >
          <CloseIcon />
        </IconButton>
        <Box
          sx={{
            position: "relative",
            borderRadius: "8px",
            overflow: "hidden",
            flex: "0 1 auto",
            maxHeight: "calc(85vh - 120px)",
          }}
        >
          <a
            href="https://summit.techforpalestine.org"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.preventDefault();
              handleImageClick();
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
              cursor: "pointer",
              display: "block",
              position: "relative",
            }}
          >
            <img
              src="/images/T4P_Bay_Area_Social_1_NEW.webp"
              alt="Tech for Palestine Summit - Mountain View, CA - January 24, 2026"
              style={{
                width: "100%",
                height: "auto",
                maxHeight: "calc(85vh - 120px)",
                objectFit: "contain",
                display: "block",
                transition: "transform 0.3s ease, filter 0.3s ease",
                transform: isHovered ? "scale(1.02)" : "scale(1)",
                filter: isHovered ? "brightness(0.95)" : "brightness(1)",
              }}
            />
            {isHovered && (
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                  pointerEvents: "none",
                }}
              >
                <OpenInNewIcon sx={{ color: "#166534" }} />
                <span style={{ color: "#166534", fontWeight: 600, fontSize: "16px" }}>
                  Click to visit summit website
                </span>
              </Box>
            )}
          </a>
        </Box>
        <Box sx={{ mt: 2, flex: "0 0 auto" }}>
          <Button
            variant="contained"
            endIcon={<OpenInNewIcon />}
            onClick={handleImageClick}
            fullWidth
            sx={{
              backgroundColor: "#166534",
              "&:hover": {
                backgroundColor: "#15803d",
              },
              textTransform: "none",
              fontSize: "16px",
              fontWeight: 600,
              py: 1.5,
            }}
          >
            Learn More About the Summit
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
