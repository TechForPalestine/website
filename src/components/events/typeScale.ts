
// Font sizes only (not family/weight/color) matched to /events-new's type
// scale in src/styles/design-system.css, stepped at the same 390/810/1200
// breakpoints. Each constant is named after the .ts-* role it mirrors.
export const TS_HEADING_SIZE =
  "text-[32px] leading-[1.22] min-[810px]:text-[36px] min-[1200px]:text-[38px]"; // day-of-month numerals
export const TS_SUBHEADING_SIZE =
  "text-[28px] leading-[1.22] min-[810px]:text-[30px] min-[1200px]:text-[32px]"; // event titles
export const TS_EYEBROW_SIZE =
  "text-[18px] leading-[1.32] min-[810px]:text-[19px] min-[1200px]:text-[24px]"; // description sub-headings
export const TS_BODY_LARGE_SIZE = "text-[18px] leading-[1.48] min-[810px]:text-[20px]"; // empty-state message
export const TS_BODY_SIZE = "text-[16px] leading-[1.22] min-[810px]:text-[18px]"; // category subtitle, description paragraphs
export const TS_LABEL_SIZE = "text-[16px] leading-[1] min-[810px]:text-[18px]"; // button labels, past-card titles
export const TS_BODY_SMALL_SIZE = "text-[14px] leading-[1.22] min-[810px]:text-[16px]"; // event time/date supporting text
export const TS_CAPTION_SIZE = "text-[14px] leading-[1]"; // category chip pill
export const TS_OVERLINE_SIZE = "text-[12px]"; // weekday/month labels — already matches text-xs
