import s from "./AgentAvatar.module.css";

/** A small, local character asset: no image request, tracking or animation library. */
export default function AgentAvatar({ animated = false }: { animated?: boolean }) {
  return <svg className={`${s.character} ${animated ? s.animated : ""}`} viewBox="0 0 64 64" fill="none" aria-hidden="true">
    <g className={s.body}>
      <path d="M19 22C9 17 9 9 12 8c7 0 13 5 14 12M39 20C41 9 47 6 51 8c3 6 0 13-6 17" fill="#a7ccbf" stroke="#345a55" strokeWidth="1.6" strokeLinejoin="round"/>
      <path d="M13 35c0-13 8-20 19-20s19 7 19 20v4c0 12-8 17-19 17S13 51 13 39z" fill="#e5f1e8" stroke="#345a55" strokeWidth="1.7"/>
      <path d="M19 49c0 5 1 7 5 7m16-7c0 5-1 7-5 7" stroke="#345a55" strokeWidth="1.6" strokeLinecap="round"/>
      <ellipse cx="20" cy="39" rx="4" ry="2.5" fill="#e3b8a8"/><ellipse cx="44" cy="39" rx="4" ry="2.5" fill="#e3b8a8"/>
      <g className={s.eyes}><ellipse cx="25" cy="33" rx="2.4" ry="3" fill="#26483f"/><ellipse cx="39" cy="33" rx="2.4" ry="3" fill="#26483f"/><circle cx="25.6" cy="32.2" r=".7" fill="white"/><circle cx="39.6" cy="32.2" r=".7" fill="white"/></g>
      <path d="M29 40c1.5 2 4.5 2 6 0" stroke="#345a55" strokeWidth="1.7" strokeLinecap="round"/>
      <path d="m28 20 4 3 4-3" stroke="#a7ccbf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </g>
  </svg>;
}
