import { Typography, Container, Stack, Button, Box } from "@mui/material";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

const WelcomeView = () => {
  return (
    <Container
      sx={{
        textAlign: "center",
        pt: { xs: 5, md: 10 },
        pb: { xs: 10, md: 20 },
      }}
    >
      <Box sx={{ width: 80, margin: "auto" }}>
        <img src={"/palestine.png"} />
      </Box>
      <Stack spacing={1} sx={{ my: 5 }}>
        <Typography variant="h3">Your Application is complete!</Typography>

        {/*<Typography sx={{ color: 'text.secondary' }}>{message}</Typography>*/}
      </Stack>

      <Button
        href={"/"}
        size="large"
        variant="contained"
        endIcon={<ArrowForwardIosIcon fontSize="small" />}
      >
        Back to home
      </Button>
    </Container>
  );
};

export default WelcomeView;
