import React, { useState, useEffect } from "react";
import {
    Box,
    Button,
    Dialog,
    DialogContent,
    IconButton,
    Typography,
    ThemeProvider,
    createTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import LocationOnIcon from "@mui/icons-material/LocationOn";

const theme = createTheme();

export default function LondonGatheringPopup() {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        // Check if user has closed the popup before
        const hasClosedPopup = localStorage.getItem("londonGatheringPopupClosed");

        if (!hasClosedPopup) {
            // Show popup after 2 seconds
            const timer = setTimeout(() => {
                setOpen(true);
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = () => {
        setOpen(false);
        // Remember that user closed the popup
        localStorage.setItem("londonGatheringPopupClosed", "true");
    };

    const handleRegister = () => {
        window.open("https://secure.qgiv.com/for/eventstest/event/t4pcommunitygatheringlondon", "_blank");
        handleClose();
    };

    return (
        <ThemeProvider theme={theme}>
            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    className: "!rounded-2xl overflow-hidden"
                }}
            >
                <IconButton
                    onClick={handleClose}
                    className="!absolute !top-2 !right-2 !z-10 !text-gray-600 hover:!text-gray-900"
                >
                    <CloseIcon />
                </IconButton>

                <DialogContent className="!p-0">
                    <Box className="bg-gradient-to-br from-red-50 to-green-50 p-8 text-center">
                        <Typography
                            variant="h4"
                            className="!font-bold !mb-4 !text-3xl sm:!text-4xl bg-gradient-to-r from-[#EA4335] to-[#168039] bg-clip-text text-transparent"
                        >
                            Tech for Palestine Gathering
                        </Typography>

                        <Typography variant="h6" className="!mb-6 text-gray-800 !text-xl">
                            Join us for the Tech for Palestine Gathering in London on November 8th!
                        </Typography>

                        <Box className="flex flex-col sm:flex-row justify-center items-center gap-3 !mb-6 text-gray-700">
                            <Box className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
                                <LocationOnIcon className="text-[#EA4335]" fontSize="small" />
                                <span className="font-medium">London</span>
                            </Box>
                            <Box className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
                                <CalendarTodayIcon className="text-[#168039]" fontSize="small" />
                                <span className="font-medium">November 8, 2025</span>
                            </Box>
                        </Box>

                        <Typography variant="body1" className="!mb-6 text-gray-700 max-w-md !mx-auto !text-center">
                            A full day event for T4P community members with workshops and networking opportunities at Palestine House.
                        </Typography>

                        <Button
                            variant="contained"
                            size="large"
                            onClick={handleRegister}
                            className="!bg-amber-800 hover:!bg-amber-900 !text-white !px-8 !py-3 !rounded-full !text-lg !font-semibold !shadow-lg hover:!shadow-xl !transition-all !duration-300"
                        >
                            Register now
                        </Button>
                    </Box>
                </DialogContent>
            </Dialog>
        </ThemeProvider>
    );
}
