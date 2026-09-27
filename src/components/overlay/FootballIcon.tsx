"use client";

interface FootballIconProps {
  color: string;
  size?: number;
}

/** Small American football for possession indicator */
export function FootballIcon({ color, size = 22 }: FootballIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
    >
      <ellipse cx="12" cy="12" rx="10" ry="6.5" fill={color} transform="rotate(-32 12 12)" />
      <path
        d="M7.5 11.2c2.2-1.1 4.5-1.6 6.8-1.5M8.8 13.1c2-.7 4.1-1 6.2-.9M10.1 15c1.7-.2 3.5-.2 5.2.1"
        stroke="rgba(0,0,0,0.22)"
        strokeWidth="0.65"
        strokeLinecap="round"
        transform="rotate(-32 12 12)"
      />
      <path
        d="M12 8.2v7.6M10.2 10.8h3.6M10.2 13.2h3.6"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="0.55"
        strokeLinecap="round"
        transform="rotate(-32 12 12)"
      />
    </svg>
  );
}
