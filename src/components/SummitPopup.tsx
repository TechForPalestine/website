import { useState, useEffect } from "react";
import { Dialog, DialogContent, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export default function SummitPopup() {
  const [open, setOpen] = useState(false);

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
        },
      }}
    >
      <DialogContent
        sx={{
          position: "relative",
          padding: 0,
          overflow: "visible",
          backgroundColor: "transparent",
        }}
      >
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            position: "absolute",
            right: -8,
            top: -8,
            backgroundColor: "white",
            color: "black",
            "&:hover": {
              backgroundColor: "#f3f4f6",
            },
            zIndex: 1,
          }}
        >
          <CloseIcon />
        </IconButton>
        <a
          href="https://summit.techforpalestine.org"
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            e.preventDefault();
            handleImageClick();
          }}
          style={{ cursor: "pointer", display: "block" }}
        >
          <img
            src="/images/T4P_Bay_Area_Social_1_NEW.webp"
            alt="Tech for Palestine Summit - Mountain View, CA - January 24, 2026"
            style={{
              width: "100%",
              height: "auto",
              display: "block",
              borderRadius: "8px",
            }}
          />
        </a>
      </DialogContent>
    </Dialog>
  );
}
