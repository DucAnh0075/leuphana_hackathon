import type { SVGProps } from "react";

type IconName = "arrow" | "back" | "check" | "document" | "download" | "expand" | "minus" | "plus" | "close" | "pages" | "shield" | "signal" | "hospital" | "pulse" | "users" | "history" | "inbox" | "bed" | "chevron" | "alert";
const paths: Record<IconName, React.ReactNode> = {
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  back: <path d="M19 12H5m6-6-6 6 6 6" />,
  check: <path d="m5 12 4 4L19 6" />,
  document: <><path d="M14 3H5v18h14V8zM14 3v5h5M8 12h8M8 16h6" /></>,
  download: <path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" />,
  expand: <path d="M8 4H4v4m12-4h4v4M4 16v4h4m12-4v4h-4M9 12h6" />,
  minus: <path d="M5 12h14" />,
  plus: <path d="M5 12h14M12 5v14" />,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  pages: <><rect x="3" y="4" width="18" height="16" rx="1" /><path d="M9 4v16M5 8h2m-2 4h2m-2 4h2" /></>,
  shield: <><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6z" /><path d="m8 12 3 3 5-6" /></>,
  signal: <><path d="M8 8a6 6 0 0 1 0 8m4-11a10 10 0 0 1 0 14m4-17a14 14 0 0 1 0 20" /><circle cx="5" cy="12" r="1" /></>,
  hospital: <><path d="M4 21V7l8-4 8 4v14H4zm5 0v-6h6v6M12 6v6M9 9h6" /></>,
  pulse: <path d="M2 12h5l3-8 4 16 3-8h5" />,
  users: <><circle cx="9" cy="7" r="3" /><path d="M3 21v-3a6 6 0 0 1 12 0v3M17 4a3 3 0 0 1 0 6m1 4a5 5 0 0 1 3 4v3" /></>,
  history: <><path d="M4 7a9 9 0 1 1-1 9M4 3v5h5M12 7v5l3 2" /></>,
  inbox: <><path d="M3 13 6 4h12l3 9v7H3zm0 0h5l2 3h4l2-3h5" /></>,
  bed: <><path d="M3 4v17M3 14h18v7M7 9h12a2 2 0 0 1 2 2v3H7z" /><circle cx="6" cy="10" r="2" /></>,
  chevron: <path d="m7 10 5 5 5-5" />,
  alert: <><path d="m12 3 10 18H2zM12 9v5" /><path d="M12 17h.01" /></>,
};
export function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>;
}
