"use client";

type TeamLogoSize = "scoreboard" | "event" | "embedded" | "event-embedded";

const SIZES: Record<TeamLogoSize, { img: string; placeholder: string }> = {
  scoreboard: {
    img: "h-[100px] w-[100px] object-cover",
    placeholder: "h-[68px] w-[68px] text-xl",
  },
  embedded: {
    img: "h-[130px] w-[130px] min-w-[130px] object-cover",
    placeholder: "h-[72px] w-[72px] text-xl",
  },
  event: {
    img: "max-h-[80px] max-w-[92px] object-contain",
    placeholder: "h-[76px] w-[76px] text-2xl",
  },
  "event-embedded": {
    img: "h-[140px] w-[140px] min-w-[140px] object-cover",
    placeholder: "h-[80px] w-[80px] text-2xl",
  },
};

interface TeamLogoProps {
  url: string | null;
  name: string;
  abbreviation: string;
  size?: TeamLogoSize;
}

export function TeamLogo({
  url,
  name,
  abbreviation,
  size = "scoreboard",
}: TeamLogoProps) {
  const s = SIZES[size];
  const embedded = size === "embedded" || size === "event-embedded";

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name}
        className={`${s.img} ${
          embedded
            ? "drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]"
            : "object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)]"
        }`}
        draggable={false}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full border-2 border-white/25 bg-black/30 font-black tracking-tighter text-white/90 ${s.placeholder}`}
    >
      {abbreviation.slice(0, 3)}
    </div>
  );
}
