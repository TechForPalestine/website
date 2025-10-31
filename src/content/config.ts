// src/content/config.ts
import { defineCollection, z } from "astro:content";

const projectsCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    url: z.string().optional(),
    channel: z.string().optional(),
  }),
});

export const collections = {
  projects: projectsCollection,
};
