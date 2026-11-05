// The three Notion "Category" values shown on /ideas, in display order, with
// the copy each filter needs. The labels are unchanged from the original tabs.

export type IdeaCategory = "new" | "existing" | "started";

/** Where every "apply" action on /ideas leads (ProjectHub application). */
export const IDEA_APPLY_URL = "https://projecthub.techforpalestine.org/apply";

export interface IdeaCategoryCopy {
  id: IdeaCategory;
  label: string;
  /** One line under the filter explaining what this list is. */
  summary: string;
  /** Per-idea apply action; "Apply" for new ideas, as on the original cards. */
  action: string;
}

export const IDEA_CATEGORIES: readonly IdeaCategoryCopy[] = [
  {
    id: "new",
    label: "Ideas for new projects",
    summary: "Nobody has started these yet. Apply to build one from the ground up.",
    action: "Apply",
  },
  {
    id: "existing",
    label: "Existing projects needing leaders",
    summary: "These projects exist and need someone to take them forward.",
    action: "Take the lead",
  },
  {
    id: "started",
    label: "Started projects",
    summary: "Work is already under way on these. Apply to take the lead.",
    action: "Take the lead",
  },
];
