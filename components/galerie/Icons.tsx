import type { CSSProperties, SVGProps } from "react";

type IconProps = Omit<SVGProps<SVGSVGElement>, "children">;
type ArrowDirection = "right" | "up-right" | "up" | "down-right" | "down";

const inlineIcon: CSSProperties = {
  display: "inline-block",
  width: "1em",
  height: "1em",
  flexShrink: 0,
  verticalAlign: "-.125em",
};

/** Decorative icons inherit the surrounding type size and colour. */
export function ArrowIcon({ direction = "up-right", style, ...props }: IconProps & { direction?: ArrowDirection }) {
  const rotation = { right: 0, "up-right": -45, up: -90, "down-right": 45, down: 90 }[direction];
  return <svg {...props} viewBox="0 0 32 32" width="1em" height="1em" fill="none" aria-hidden="true" focusable="false" style={{ ...inlineIcon, ...style }}><g transform={`rotate(${rotation} 16 16)`}><path d="M5 16h21M17 7l9 9-9 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></g></svg>;
}

export function MaisonMark({ style, ...props }: IconProps) {
  return <svg {...props} viewBox="0 0 32 32" width="1em" height="1em" fill="none" aria-hidden="true" focusable="false" style={{ ...inlineIcon, ...style }}><path d="M16 3v26M3 16h26M6.8 6.8l18.4 18.4M6.8 25.2 25.2 6.8" stroke="currentColor" strokeWidth="2.3" strokeLinecap="square" /></svg>;
}

export function PlayPauseIcon({ paused, style, ...props }: IconProps & { paused: boolean }) {
  return <svg {...props} viewBox="0 0 32 32" width="1em" height="1em" fill="none" aria-hidden="true" focusable="false" style={{ ...inlineIcon, ...style }}>{paused ? <path d="m10 5 17 11-17 11Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /> : <path d="M11 6v20M21 6v20" stroke="currentColor" strokeWidth="3" />}</svg>;
}

export function CopyIcon({ style, ...props }: IconProps) {
  return <svg {...props} viewBox="0 0 32 32" width="1em" height="1em" fill="none" aria-hidden="true" focusable="false" style={{ ...inlineIcon, ...style }}><rect x="11" y="11" width="15" height="17" rx="1.5" stroke="currentColor" strokeWidth="1.7" /><path d="M21 7V4H5v18h3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export function CheckIcon({ style, ...props }: IconProps) {
  return <svg {...props} viewBox="0 0 32 32" width="1em" height="1em" fill="none" aria-hidden="true" focusable="false" style={{ ...inlineIcon, ...style }}><path d="m6 17 7 7L27 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
