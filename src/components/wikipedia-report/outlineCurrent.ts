export interface HeadingPosition {
  id: string;
  top: number;
}

/** Last heading whose top has passed the activation line (headings in document order). */
export function currentHeadingLinear(
  headings: readonly HeadingPosition[],
  offset: number
): string | null {
  let current: string | null = null;
  for (const heading of headings) {
    if (heading.top - offset > 0) break;
    current = heading.id;
  }
  return current;
}

/**
 * Same decision for pages split into sections. Section tops are cheap to
 * measure; per-section heading positions are read lazily (only for the
 * section being read; earlier sections only yield an id, never a position) so skipped
 * (content-visibility) sections are not forced to lay out.
 */
export function currentHeadingBySection(
  sectionTops: readonly number[],
  headingsOf: (sectionIndex: number) => readonly HeadingPosition[],
  lastIdOf: (sectionIndex: number) => string | null,
  offset: number
): string | null {
  let sectionIndex = -1;
  for (let i = 0; i < sectionTops.length; i++) {
    if (sectionTops[i] - offset > 0) break;
    sectionIndex = i;
  }
  if (sectionIndex < 0) return null;

  const inSection = currentHeadingLinear(headingsOf(sectionIndex), offset);
  if (inSection) return inSection;

  for (let i = sectionIndex - 1; i >= 0; i--) {
    const id = lastIdOf(i);
    if (id) return id;
  }
  return null;
}
