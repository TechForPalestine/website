import type { ReactNode } from "react";

// Inputs per DESIGN.md §5: Paper, 1px Ink Divider border, rounded-sm,
// shadow-sm, Grove border plus a 2px Grove ring on focus, Ink Muted
// placeholders. Red marks an invalid field and nothing else.
export const inputClass =
  "block w-full rounded-sm border border-ink-divider bg-paper px-4 py-3 text-[17px] leading-normal text-ink shadow-sm transition-colors placeholder:text-ink-muted focus:border-grove focus:outline-none focus:ring-2 focus:ring-grove motion-reduce:transition-none aria-[invalid=true]:border-red-700 aria-[invalid=true]:focus:ring-red-700";

export interface FieldIds {
  /** Value for the control's aria-describedby (hint and error ids), if any. */
  describedBy: string | undefined;
  invalid: boolean;
}

interface FormFieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  /** Extra text beside the hint, such as a character count. */
  meta?: ReactNode;
  children: (ids: FieldIds) => ReactNode;
}

/**
 * A labelled control with an optional hint above and an error below. The
 * label is always visible; the control receives aria-describedby and
 * aria-invalid through the render prop so the error is announced with it.
 */
export default function FormField({
  id,
  label,
  hint,
  error,
  optional = false,
  meta,
  children,
}: FormFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="min-w-0">
      <label htmlFor={id} className="block text-[15px] font-bold leading-snug text-ink">
        {label}
        {optional && <span className="ml-2 font-normal text-ink-secondary">(optional)</span>}
      </label>
      {(hint || meta) && (
        <div className="mt-1 flex items-baseline justify-between gap-4 text-[15px] leading-snug text-ink-secondary">
          {hint && <p id={hintId}>{hint}</p>}
          {meta && <span className="ml-auto shrink-0 tabular-nums">{meta}</span>}
        </div>
      )}
      <div className="mt-2">{children({ describedBy, invalid: Boolean(error) })}</div>
      {error && (
        <p id={errorId} className="mt-2 flex items-start gap-2 text-[15px] font-bold text-red-700">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="mt-0.5 h-4 w-4 shrink-0"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
