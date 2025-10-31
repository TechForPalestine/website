import React, { useState, useEffect } from "react";
import { Box, Typography, Card, Container, CircularProgress } from "@mui/material";
import CoffeeIcon from "@mui/icons-material/Coffee";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import GroupsIcon from "@mui/icons-material/Groups";
import RestaurantIcon from "@mui/icons-material/Restaurant";

interface Moderator {
  id: string;
  name: string;
  title: string;
  bio: string;
  photo: string;
}

interface AgendaItem {
  id: string;
  title: string;
  description: string;
  time: string;
  moderator: Moderator | null;
}

// Map agenda titles to appropriate icons and colors
const getAgendaItemStyle = (title: string) => {
  if (title.toLowerCase().includes("coffee") || title.toLowerCase().includes("welcome")) {
    return { icon: CoffeeIcon, color: "#EA4335", bgColor: "white" };
  } else if (title.toLowerCase().includes("lunch")) {
    return { icon: RestaurantIcon, color: "#d97706", bgColor: "white" };
  } else if (title.toLowerCase().includes("breakout") || title.toLowerCase().includes("workshop")) {
    return { icon: GroupsIcon, color: "gradient", bgColor: "gradient" };
  } else if (title.toLowerCase().includes("goodbye") || title.toLowerCase().includes("closing")) {
    return { icon: CoffeeIcon, color: "#EA4335", bgColor: "white" };
  }
  return { icon: AccessTimeIcon, color: "#168039", bgColor: "white" };
};

const sortAgendaItems = (items: AgendaItem[]) => {
  // Extract breakout number for numeric sorting
  const getBreakoutNumber = (title: string) => {
    const match = title.match(/Breakout (\d+)/);
    return match ? parseInt(match[1]) : 0;
  };

  // Group breakouts by session and sort numerically by breakout number
  const session1Breakouts = items
    .filter((item) => item.title.includes("Breakout") && item.time === "10:30 - 12:00")
    .sort((a, b) => getBreakoutNumber(a.title) - getBreakoutNumber(b.title));

  const session2Breakouts = items
    .filter((item) => item.title.includes("Breakout") && item.time === "13:30 - 15:00")
    .sort((a, b) => getBreakoutNumber(a.title) - getBreakoutNumber(b.title));

  // Other items
  const otherItems = items.filter((item) => !item.title.includes("Breakout"));

  // Sort by time (convert to minutes for proper numeric comparison)
  const sorted = otherItems.sort((a, b) => {
    const getStartMinutes = (timeStr: string) => {
      if (!timeStr) return 0;
      const startTime = timeStr.split(" - ")[0];
      const match = startTime.match(/^(\d{1,2}):(\d{2})/);
      if (!match) return 0;
      const hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      return hours * 60 + minutes;
    };

    const timeA = getStartMinutes(a.time);
    const timeB = getStartMinutes(b.time);
    return timeA - timeB;
  });

  // Insert breakouts in the right place
  const result: AgendaItem[] = [];
  let session1Added = false;
  sorted.forEach((item) => {
    result.push(item);
    // Add session 1 after welcome address and keynotes (not just "welcome coffee")
    if (!session1Added && item.title.toLowerCase().includes("keynote")) {
      // Add session 1 marker and breakouts
      result.push({
        id: "session1-header",
        title: "Workshop Session 1",
        description: "",
        time: "10:30 - 12:00",
        moderator: null,
      });
      result.push(...session1Breakouts);
      session1Added = true;
    } else if (item.title.toLowerCase().includes("lunch")) {
      // Add session 2 marker and breakouts
      result.push({
        id: "session2-header",
        title: "Workshop Session 2",
        description: "",
        time: "13:30 - 15:00",
        moderator: null,
      });
      result.push(...session2Breakouts);
    }
  });

  return result;
};

interface LondonGatheringAgendaProps {
  initialAgendaItems?: AgendaItem[];
}

export default function LondonGatheringAgenda({
  initialAgendaItems = [],
}: LondonGatheringAgendaProps) {
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>(
    initialAgendaItems.length > 0 ? sortAgendaItems(initialAgendaItems) : []
  );
  const [loading, setLoading] = useState(initialAgendaItems.length === 0);

  useEffect(() => {
    // Only fetch if no initial data provided
    if (initialAgendaItems.length === 0) {
      fetchAgenda();
    }
  }, []);

  const fetchAgenda = async () => {
    try {
      const response = await fetch("/api/speakers");
      const data = await response.json();
      const sorted = sortAgendaItems(data.agendaItems || []);
      setAgendaItems(sorted);
    } catch (error) {
      console.error("Error fetching agenda:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box className="bg-gray-50 py-16">
        <Container maxWidth="lg">
          <Box className="text-center">
            <CircularProgress />
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box className="bg-gray-50 py-16">
      <Container maxWidth="lg">
        <Box className="!mb-12 text-center">
          <Typography
            variant="h2"
            className="!mb-4 !text-4xl !font-bold text-gray-900 sm:!text-5xl md:!text-6xl"
          >
            Agenda
          </Typography>
          <Box className="!mx-auto h-1 w-24 rounded-full bg-gradient-to-r from-[#EA4335] to-[#168039]"></Box>
        </Box>

        <Box className="!mx-auto max-w-4xl space-y-6">
          {agendaItems.map((item) => {
            const style = getAgendaItemStyle(item.title);
            const IconComponent = style.icon;
            const isWorkshopHeader = item.title.includes("Workshop Session");
            const isBreakout = item.title.includes("Breakout");

            if (isWorkshopHeader) {
              return (
                <Card
                  key={item.id}
                  className="rounded-2xl border-0 bg-gradient-to-r from-[#EA4335]/5 to-[#168039]/5 p-6 shadow-lg transition-all duration-300 hover:shadow-xl"
                >
                  <Box className="mb-4 flex items-start gap-4">
                    <Box className="min-w-fit rounded-full bg-gradient-to-r from-[#EA4335] to-[#168039] p-3">
                      <IconComponent className="text-white" />
                    </Box>
                    <Box className="flex-1">
                      <Typography variant="h5" className="font-bold text-gray-900">
                        {item.time}
                      </Typography>
                      <Typography
                        variant="h6"
                        className="bg-gradient-to-r from-[#EA4335] to-[#168039] bg-clip-text font-bold text-transparent"
                      >
                        {item.title}
                      </Typography>
                    </Box>
                  </Box>
                </Card>
              );
            }

            if (isBreakout) {
              return (
                <Box key={item.id} className="pl-12">
                  <Card className="rounded-xl border-0 bg-white p-4 shadow-md transition-all duration-300 hover:shadow-lg">
                    <Typography variant="body1" className="font-medium text-gray-800">
                      • {item.title}
                      {item.moderator && (
                        <span className="font-normal text-gray-600">
                          {" "}
                          (moderated by {item.moderator.name})
                        </span>
                      )}
                    </Typography>
                  </Card>
                </Box>
              );
            }

            return (
              <Card
                key={item.id}
                className="rounded-2xl border-0 bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl"
              >
                <Box className="mb-2 flex items-center gap-4">
                  <Box
                    className="min-w-fit rounded-full p-3"
                    sx={{
                      backgroundColor: style.color === "gradient" ? undefined : style.color,
                      background:
                        style.color === "gradient"
                          ? "linear-gradient(to right, #EA4335, #168039)"
                          : undefined,
                    }}
                  >
                    <IconComponent className="text-white" />
                  </Box>
                  <Box>
                    <Typography variant="h5" className="font-bold text-gray-900">
                      {item.time}
                    </Typography>
                    <Typography
                      variant="h6"
                      className="font-semibold"
                      sx={{ color: style.color === "gradient" ? undefined : style.color }}
                    >
                      {item.title}
                    </Typography>
                  </Box>
                </Box>
              </Card>
            );
          })}
        </Box>
      </Container>
    </Box>
  );
}
