import { useEffect, useRef, useState } from "react";

import { NS5Robot } from "../robot/NS5Robot";
import { useWander } from "../../hooks/use-wander";

import "./CabinScene.css";

const FLOOR_Y = 520;
const ROBOT_Y = 572;

// Deterministic starfield so server and browser render the same sky.
function seededStars(count: number) {
  let s = 42;

  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };

  return Array.from({ length: count }, () => ({
    x: 300 + rnd() * 400,
    y: 70 + rnd() * 240,
    r: 0.5 + rnd() * 1.4,
    d: rnd() * 4,
  }));
}

const STARS = seededStars(70);

const BOOKS = [
  { x: 58, w: 12, h: 46, c: "fill-burgundy" },
  { x: 72, w: 9, h: 40, c: "fill-amber-deep" },
  { x: 83, w: 14, h: 50, c: "fill-silver" },
  { x: 99, w: 10, h: 42, c: "fill-planet" },
  { x: 111, w: 8, h: 36, c: "fill-oxblood" },
];

const BOOKS_2 = [
  { x: 128, w: 11, h: 44, c: "fill-planet-deep" },
  { x: 141, w: 13, h: 48, c: "fill-cream-shade" },
  { x: 156, w: 9, h: 38, c: "fill-burgundy" },
];

const MODE_LABEL: Record<string, string> = {
  idle: "Idling · sipping coffee",
  walking: "Waddling about",
  hop: "Doing a little hop",
  wave: "Waving at Earth",
  listening: "Listening at terminal",
};

export function CabinScene({ isTyping }: { isTyping: boolean }) {
  const { x, duration, facing, mode } = useWander(isTyping);

  const boxRef = useRef<HTMLDivElement>(null);

  // Narrow containers crop the sides (keeping NS-5 large);
  // wide ones show the whole room.
  const [fit, setFit] = useState<"meet" | "slice">("meet");

  useEffect(() => {
    const el = boxRef.current;

    if (!el) return;

    const ro = new ResizeObserver(([entry]) => {
      if (!entry) return;

      const { width, height } = entry.contentRect;

      setFit(height > 0 && width / height < 1.45 ? "slice" : "meet");
    });

    ro.observe(el);

    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={boxRef}
      className="cabin-scene relative h-full w-full overflow-hidden rounded-xl border border-border hull"
    >
      <svg
        viewBox="0 0 1000 600"
        preserveAspectRatio={`xMidYMax ${fit}`}
        className="cabin-scene__svg absolute inset-0 h-full w-full"
        role="img"
        aria-label="NS-5's cabin aboard the North Star, with an observation window onto space"
      >
        <defs>
          <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: "var(--charcoal)" }} />
            <stop offset="1" style={{ stopColor: "var(--panel)" }} />
          </linearGradient>

          <radialGradient id="space" cx="0.6" cy="0.3" r="0.9">
            <stop offset="0" style={{ stopColor: "var(--planet-deep)" }} />
            <stop offset="0.6" style={{ stopColor: "var(--space)" }} />
            <stop offset="1" style={{ stopColor: "var(--void)" }} />
          </radialGradient>

          <radialGradient id="starGlow">
            <stop
              offset="0"
              style={{ stopColor: "var(--amber)", stopOpacity: 0.9 }}
            />
            <stop
              offset="0.35"
              style={{ stopColor: "var(--amber)", stopOpacity: 0.25 }}
            />
            <stop
              offset="1"
              style={{ stopColor: "var(--amber)", stopOpacity: 0 }}
            />
          </radialGradient>

          <radialGradient id="planet" cx="0.35" cy="0.2" r="0.9">
            <stop offset="0" style={{ stopColor: "var(--planet)" }} />
            <stop offset="0.7" style={{ stopColor: "var(--planet-deep)" }} />
            <stop offset="1" style={{ stopColor: "var(--void)" }} />
          </radialGradient>

          <linearGradient id="cone" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0"
              style={{ stopColor: "var(--amber)", stopOpacity: 0.18 }}
            />
            <stop
              offset="1"
              style={{ stopColor: "var(--amber)", stopOpacity: 0 }}
            />
          </linearGradient>

          <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: "var(--panel)" }} />
            <stop offset="1" style={{ stopColor: "var(--space)" }} />
          </linearGradient>

          <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
            <stop
              offset="0"
              style={{ stopColor: "var(--soft)", stopOpacity: 0.07 }}
            />
            <stop
              offset="0.4"
              style={{ stopColor: "var(--soft)", stopOpacity: 0 }}
            />
          </linearGradient>

          <clipPath id="windowClip">
            <rect x={300} y={70} width={400} height={280} rx={46} />
          </clipPath>

          {/* Navigation terminal clipping area */}
          <clipPath id="termClip">
            <rect x={798} y={334} width={116} height={78} rx={4} />
          </clipPath>
        </defs>

        {/* Hull wall */}
        <rect
          x={-2000}
          y={-2000}
          width={5000}
          height={2600}
          fill="url(#wall)"
        />

        {[-40, 120, 250, 750, 880, 1040].map((sx) => (
          <g key={sx}>
            <line
              x1={sx}
              y1={-2000}
              x2={sx}
              y2={FLOOR_Y}
              className="stroke-space"
              strokeWidth={2}
              opacity={0.6}
            />
            <line
              x1={sx + 2}
              y1={-2000}
              x2={sx + 2}
              y2={FLOOR_Y}
              className="stroke-silver"
              strokeWidth={0.6}
              opacity={0.12}
            />
            {[60, 300, 480].map((ry) => (
              <circle
                key={ry}
                cx={sx + 8}
                cy={ry}
                r={2}
                className="fill-panel-hi"
              />
            ))}
          </g>
        ))}

        {/* Ceiling and warm lights */}
        <rect
          x={-2000}
          y={-2000}
          width={5000}
          height={2030}
          className="fill-space"
        />
        <rect
          x={-2000}
          y={26}
          width={5000}
          height={6}
          className="fill-panel-hi"
          opacity={0.6}
        />

        {[160, 500, 840].map((lx) => (
          <g key={lx}>
            <path
              d={`M ${lx - 40} 32 L ${lx + 40} 32 L ${lx + 120} ${FLOOR_Y} L ${lx - 120} ${FLOOR_Y} Z`}
              fill="url(#cone)"
            />
            <rect
              x={lx - 42}
              y={28}
              width={84}
              height={6}
              rx={3}
              className="fill-amber"
              opacity={0.9}
            />
          </g>
        ))}

        {/* Observation window */}
        <g clipPath="url(#windowClip)">
          <rect
            x={300}
            y={70}
            width={400}
            height={280}
            fill="url(#space)"
          />

          {STARS.map((st, i) => (
            <circle
              key={i}
              cx={st.x}
              cy={st.y}
              r={st.r}
              className="fill-soft ns-twinkle"
              style={{ animationDelay: `${st.d}s` }}
            />
          ))}

          <circle
            cx={575}
            cy={135}
            r={70}
            fill="url(#starGlow)"
            className="ns-star-pulse"
          />

          <path
            d="M 575 108 L 580 130 L 602 135 L 580 140 L 575 162 L 570 140 L 548 135 L 570 130 Z"
            className="fill-amber"
          />

          <circle cx={575} cy={135} r={3.5} className="fill-soft" />

          <circle cx={500} cy={590} r={290} fill="url(#planet)" />

          <circle
            cx={500}
            cy={590}
            r={290}
            fill="none"
            className="stroke-silver"
            strokeWidth={2}
            opacity={0.35}
          />

          <path
            d="M 300 330 Q 420 300 520 312 T 700 300"
            className="stroke-soft"
            strokeWidth={10}
            opacity={0.06}
            fill="none"
          />

          <rect
            x={300}
            y={70}
            width={400}
            height={280}
            fill="url(#glass)"
          />
        </g>

        <rect
          x={300}
          y={70}
          width={400}
          height={280}
          rx={46}
          fill="none"
          className="stroke-panel-hi"
          strokeWidth={14}
        />

        <rect
          x={300}
          y={70}
          width={400}
          height={280}
          rx={46}
          fill="none"
          className="stroke-silver"
          strokeWidth={1}
          opacity={0.3}
        />

        <rect
          x={290}
          y={350}
          width={420}
          height={12}
          rx={4}
          className="fill-panel-hi"
        />

        {[320, 680].map((bx) => (
          <circle
            key={bx}
            cx={bx}
            cy={210}
            r={3}
            className="fill-silver"
            opacity={0.5}
          />
        ))}

        {/* Bookshelf */}
        <g>
          <rect
            x={48}
            y={150}
            width={128}
            height={6}
            rx={2}
            className="fill-panel-hi"
          />
          <rect
            x={48}
            y={240}
            width={128}
            height={6}
            rx={2}
            className="fill-panel-hi"
          />

          {BOOKS.map((b) => (
            <rect
              key={b.x}
              x={b.x}
              y={150 - b.h}
              width={b.w}
              height={b.h}
              rx={1.5}
              className={b.c}
            />
          ))}

          <rect
            x={124}
            y={112}
            width={30}
            height={38}
            rx={3}
            className="fill-charcoal stroke-silver"
            strokeWidth={1}
          />

          <circle cx={139} cy={128} r={6} className="fill-cream" />
          <circle cx={139} cy={128} r={2} className="fill-amber" />
          <circle cx={164} cy={140} r={9} className="fill-planet" />

          <path
            d="M 155 140 Q 164 134 173 140"
            className="stroke-leaf"
            strokeWidth={2}
            fill="none"
          />

          {BOOKS_2.map((b) => (
            <rect
              key={b.x}
              x={b.x}
              y={240 - b.h}
              width={b.w}
              height={b.h}
              rx={1.5}
              className={b.c}
            />
          ))}

          <path d="M 62 240 L 72 206 L 82 240 Z" className="fill-silver" />
          <rect
            x={68}
            y={226}
            width={8}
            height={5}
            className="fill-burgundy"
          />
          <circle cx={100} cy={232} r={8} className="fill-amber" />
          <circle cx={97} cy={229} r={1.4} className="fill-space" />
          <path
            d="M 105 230 L 111 232 L 105 234 Z"
            className="fill-amber-deep"
          />
        </g>

        {/* Ship clock */}
        <g transform="translate(815 120)">
          <circle
            r={30}
            className="fill-charcoal stroke-panel-hi"
            strokeWidth={5}
          />
          <line
            x1={0}
            y1={0}
            x2={0}
            y2={-18}
            className="stroke-soft"
            strokeWidth={2.5}
            strokeLinecap="round"
          />
          <line
            x1={0}
            y1={0}
            x2={14}
            y2={6}
            className="stroke-amber"
            strokeWidth={2}
            strokeLinecap="round"
          />
          <circle r={2.5} className="fill-amber" />
        </g>

        {/* NS-5 doodle pinned on the wall */}
        <g transform="translate(888 200) rotate(6)">
          <rect
            x={-26}
            y={-30}
            width={52}
            height={60}
            rx={2}
            className="fill-cream"
            opacity={0.92}
          />
          <circle
            cx={0}
            cy={-6}
            r={12}
            fill="none"
            className="stroke-burgundy"
            strokeWidth={2}
          />
          <circle cx={-4} cy={-7} r={2.5} className="fill-amber-deep" />
          <circle cx={4} cy={-7} r={2.5} className="fill-amber-deep" />
          <path
            d="M -8 14 Q 0 20 8 14"
            className="stroke-burgundy"
            strokeWidth={2}
            fill="none"
          />
          <circle cx={0} cy={-30} r={3} className="fill-oxblood" />
        </g>

        {/* Floor */}
        <rect
          x={-2000}
          y={FLOOR_Y}
          width={5000}
          height={600}
          fill="url(#floor)"
        />

        <rect
          x={-2000}
          y={FLOOR_Y}
          width={5000}
          height={3}
          className="fill-silver"
          opacity={0.18}
        />

        {[-300, 0, 200, 400, 600, 800, 1000, 1300].map((fx) => (
          <line
            key={fx}
            x1={fx}
            y1={FLOOR_Y}
            x2={500 + (fx - 500) * 1.6}
            y2={600}
            className="stroke-space"
            strokeWidth={1.5}
            opacity={0.7}
          />
        ))}

        <line
          x1={-2000}
          y1={556}
          x2={3000}
          y2={556}
          className="stroke-space"
          strokeWidth={1.5}
          opacity={0.6}
        />

        {/* Rug */}
        <ellipse
          cx={520}
          cy={572}
          rx={230}
          ry={22}
          className="fill-burgundy"
          opacity={0.22}
        />

        <ellipse
          cx={520}
          cy={572}
          rx={200}
          ry={16}
          fill="none"
          className="stroke-amber"
          strokeWidth={1}
          opacity={0.18}
          strokeDasharray="6 8"
        />

        {/* Robot chair */}
        <g transform="translate(160 0)">
          <rect
            x={-8}
            y={522}
            width={16}
            height={36}
            className="fill-panel-hi"
          />
          <ellipse cx={0} cy={566} rx={42} ry={7} className="fill-panel-hi" />

          <rect
            x={-54}
            y={404}
            width={108}
            height={104}
            rx={34}
            className="fill-charcoal stroke-panel-hi"
            strokeWidth={4}
          />

          <rect
            x={-40}
            y={418}
            width={80}
            height={60}
            rx={22}
            className="fill-oxblood"
            opacity={0.85}
          />

          <rect
            x={-64}
            y={476}
            width={128}
            height={46}
            rx={18}
            className="fill-burgundy"
          />

          <rect
            x={-64}
            y={476}
            width={128}
            height={10}
            rx={5}
            className="fill-soft"
            opacity={0.08}
          />

          <rect
            x={-70}
            y={466}
            width={18}
            height={44}
            rx={9}
            className="fill-panel-hi"
          />
          <rect
            x={52}
            y={466}
            width={18}
            height={44}
            rx={9}
            className="fill-panel-hi"
          />
          <circle
            cx={0}
            cy={498}
            r={3}
            className="fill-amber"
            opacity={0.7}
          />
        </g>

        {/* Plant (Fernanda) */}
        <g transform="translate(262 0)">
          <path
            d="M -22 528 L 22 528 L 16 570 L -16 570 Z"
            className="fill-burgundy"
          />
          <rect
            x={-24}
            y={522}
            width={48}
            height={8}
            rx={3}
            className="fill-oxblood"
          />

          {[
            "M 0 522 Q -30 490 -36 450 Q -12 476 0 522",
            "M 0 522 Q 4 470 -6 430 Q 18 466 0 522",
            "M 0 522 Q 28 488 40 456 Q 34 494 0 522",
            "M 0 522 Q -18 500 -42 494 Q -20 486 0 522",
          ].map((d) => (
            <path key={d} d={d} className="fill-leaf" />
          ))}
        </g>

        {/* Desk and navigation terminal */}
        <g>
          <rect
            x={760}
            y={438}
            width={210}
            height={12}
            rx={3}
            className="fill-panel-hi"
          />
          <rect
            x={772}
            y={450}
            width={10}
            height={120}
            className="fill-panel"
          />
          <rect
            x={948}
            y={450}
            width={10}
            height={120}
            className="fill-panel"
          />
          <rect
            x={900}
            y={450}
            width={50}
            height={60}
            rx={3}
            className="fill-panel"
          />
          <circle
            cx={925}
            cy={480}
            r={3}
            className="fill-silver"
            opacity={0.5}
          />
          <rect
            x={846}
            y={420}
            width={20}
            height={18}
            className="fill-panel"
          />

          <rect
            x={788}
            y={324}
            width={136}
            height={98}
            rx={8}
            className="fill-charcoal stroke-panel-hi"
            strokeWidth={4}
          />

          <rect
            x={798}
            y={334}
            width={116}
            height={78}
            rx={4}
            className="fill-void"
          />

          <g clipPath="url(#termClip)">
            <circle
              cx={856}
              cy={373}
              r={28}
              fill="none"
              className="stroke-signal"
              strokeWidth={1}
              opacity={0.5}
            />
            <circle
              cx={856}
              cy={373}
              r={14}
              fill="none"
              className="stroke-signal"
              strokeWidth={1}
              opacity={0.35}
            />
            <line
              x1={798}
              y1={373}
              x2={914}
              y2={373}
              className="stroke-signal"
              strokeWidth={0.6}
              opacity={0.3}
            />
            <line
              x1={856}
              y1={334}
              x2={856}
              y2={412}
              className="stroke-signal"
              strokeWidth={0.6}
              opacity={0.3}
            />
            <path
              d="M 856 345 L 859 370 L 856 373 L 853 370 Z"
              className="fill-amber"
            />
            <rect
              x={836}
              y={334}
              width={2}
              height={78}
              className="fill-signal ns-scan"
              opacity={0.5}
            />
          </g>

          <circle
            cx={808}
            cy={344}
            r={2.5}
            className={
              isTyping
                ? "fill-signal ns-blink-dot"
                : "fill-amber ns-blink-dot"
            }
          />

          {/* Lamp */}
          <path
            d="M 946 438 L 946 380 L 920 362"
            className="stroke-silver"
            strokeWidth={3}
            fill="none"
          />
          <path
            d="M 908 356 L 934 352 L 928 372 Z"
            className="fill-amber"
          />

          {/* Sticky note and coffee ring */}
          <rect
            x={928}
            y={330}
            width={26}
            height={24}
            className="fill-amber"
            opacity={0.85}
            transform="rotate(-8 941 342)"
          />

          <ellipse
            cx={890}
            cy={436}
            rx={10}
            ry={2.5}
            fill="none"
            className="stroke-amber-deep"
            strokeWidth={1}
            opacity={0.5}
          />
        </g>

        {/* NS-5 */}
        <g
          className="ns-walker"
          data-mode={mode}
          style={{
            transform: `translate(${x}px, ${ROBOT_Y}px) scale(1.04)`,
            transitionDuration: `${duration}ms`,
          }}
        >
          <g
            className="ns-facing"
            style={{ transform: `scaleX(${facing})` }}
          >
            <NS5Robot />
          </g>
        </g>
      </svg>

      {/* HUD overlay */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3 sm:p-4">
        <div className="rounded-md bg-void/70 px-2.5 py-1.5 backdrop-blur-sm">
          <div className="label-tech">Cabin 05 · Deck 2</div>
          <div className="hidden text-xs text-soft sm:block">
            Personal quarters of NS-5
          </div>
        </div>

        <div className="hidden items-center gap-2 rounded-md bg-void/70 px-2.5 py-1.5 backdrop-blur-sm sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-signal glow-signal ns-blink-dot" />
          <span className="label-tech">O₂ 21% · Hull nominal</span>
        </div>
      </div>

      <div
        className="pointer-events-none absolute bottom-3 left-3 hidden rounded-md bg-void/70 px-2.5 py-1.5 sm:bottom-4 sm:left-4 sm:block"
        aria-live="polite"
      >
        <span className="label-tech">Unit status </span>
        <span className="text-xs text-amber">{MODE_LABEL[mode]}</span>
      </div>
    </div>
  );
}