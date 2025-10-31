import React, { useState, useEffect } from "react";
import FAQAccordion from "./FAQAccordion";
import { CircularProgress, Typography, Box } from "@mui/material";
import type { RichTextSegment } from "../types/richText";

interface FAQItem {
  id: string;
  question: string;
  answer: string | RichTextSegment[];
}

interface FAQListProps {
  faqs: FAQItem[];
  loading?: boolean;
}

export default function FAQList({
  faqs: initialFaqs = [],
  loading: initialLoading = false,
}: FAQListProps) {
  const [faqs, setFaqs] = useState<FAQItem[]>(initialFaqs);
  const [loading, setLoading] = useState(initialLoading);

  const urlSearchParams = new URLSearchParams(window.location.search);
  const params = Object.fromEntries(urlSearchParams.entries());
  const showAll = params?.showAll === "yes";

  const fetchFreshFAQs = async () => {
    setLoading(true);
    try {
      console.log("Fetching fresh FAQs from Notion API...");
      // Encode the showAll parameter
      const encodedShowAll = encodeURIComponent(showAll ? "yes" : "no");
      const response = await fetch(showAll ? `/api/faq?showAll=${encodedShowAll}` : "/api/faq", {
        cache: "no-cache",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      if (response.ok) {
        const newFaqs = await response.json();
        console.log(`Refreshed: Loaded ${newFaqs.length} FAQs from Notion`);
        setFaqs(newFaqs);
      } else {
        console.error("Failed to fetch FAQs:", response.status);
      }
    } catch (error) {
      console.error("Failed to fetch fresh FAQs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("FAQList component mounted:", {
      initialFaqsLength: initialFaqs.length,
      initialLoading,
      currentLoadingState: loading,
    });

    if (initialFaqs.length === 0) {
      console.log("No initial FAQs, fetching from API...");
      fetchFreshFAQs();
    } else {
      console.log(`Using ${initialFaqs.length} initial FAQs from SSR, setting loading to false`);
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Loading FAQs...
        </Typography>
      </Box>
    );
  }

  if (faqs.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography variant="body1" color="text.secondary">
          No FAQs available at the moment.
        </Typography>
      </Box>
    );
  }

  return (
    <div className={"mt-6"}>
      {faqs.map((faq, index) => (
        <FAQAccordion key={faq.id || index} question={faq.question} answer={faq.answer} />
      ))}
    </div>
  );
}
