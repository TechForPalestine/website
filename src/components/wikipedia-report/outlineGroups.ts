// Open/closed state of the sidebar outline's collapsible groups. DOM-free so
// it can be tested; ReportScripts applies the result to the page.
//
// By default a group is open while the reader is inside it ("active"). A
// reader's own toggle overrides that:
//   - a group opened by hand stays open until the reader closes it;
//   - a group closed by hand stays closed while it is still being read, and
//     the override is forgotten once the reader leaves it, so it opens again
//     automatically on return.

export type GroupOverride = "open" | "closed";
export type GroupOverrides = ReadonlyMap<string, GroupOverride>;

export const EMPTY_OVERRIDES: GroupOverrides = new Map();

export function isGroupOpen(
  id: string,
  activeIds: ReadonlySet<string>,
  overrides: GroupOverrides
): boolean {
  const override = overrides.get(id);
  if (override) return override === "open";
  return activeIds.has(id);
}

/** The reader pressed a group's toggle: flip whatever it shows now. */
export function toggleGroup(
  overrides: GroupOverrides,
  id: string,
  activeIds: ReadonlySet<string>
): GroupOverrides {
  const next = new Map(overrides);
  next.set(id, isGroupOpen(id, activeIds, overrides) ? "closed" : "open");
  return next;
}

/** The reading position moved: drop hand-closes for groups no longer being read. */
export function settleOverrides(
  overrides: GroupOverrides,
  activeIds: ReadonlySet<string>
): GroupOverrides {
  const stale = [...overrides].filter(([id, value]) => value === "closed" && !activeIds.has(id));
  if (stale.length === 0) return overrides;
  const next = new Map(overrides);
  for (const [id] of stale) next.delete(id);
  return next;
}
