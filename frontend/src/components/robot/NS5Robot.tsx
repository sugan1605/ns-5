
import { useEffect, useRef, useState } from 'react'
import './NS5Robot.css'

export type RobotMode = 'idle' | 'walking' | 'hop' | 'wave' | 'listening'

interface NS5RobotProps {
  /** Pupils follow the pointer when true. */
  trackPointer?: boolean

  /** Show the steaming NS-5 coffee mug. */
  withMug?: boolean

  /** Draw the floor shadow (off for avatars). */
  withShadow?: boolean
}

const MAX_PUPIL = 4

/**
 * NS-5 drawn as an SVG <g>.
 * Feet at (0,0), approximately 230 units tall.
 * Animation is controlled by a parent data-mode attribute.
 */
export function NS5Robot({
  trackPointer = true,
  withMug = true,
  withShadow = true,
}: NS5RobotProps) {
  const eyesRef = useRef<SVGGElement>(null)

  const [pupil, setPupil] = useState({ x: 0, y: 0 })
  const [blink, setBlink] = useState(false)

  // Pointer tracking
  useEffect(() => {
    if (!trackPointer) return

    let frame = 0

    const onMove = (event: PointerEvent) => {
      cancelAnimationFrame(frame)

      frame = requestAnimationFrame(() => {
        const element = eyesRef.current
        if (!element) return

        const rect = element.getBoundingClientRect()

        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2

        const dx = event.clientX - centerX
        const dy = event.clientY - centerY

        const distance = Math.hypot(dx, dy) || 1
        const reach = Math.min(1, distance / 220)

        // Correct horizontal direction when robot is mirrored.
        const matrix = element.getScreenCTM()
        const flip = matrix && matrix.a < 0 ? -1 : 1

        setPupil({
          x: (dx / distance) * MAX_PUPIL * reach * flip,
          y: (dy / distance) * MAX_PUPIL * reach,
        })
      })
    }

    window.addEventListener('pointermove', onMove)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onMove)
    }
  }, [trackPointer])

  // Automatic blinking
  useEffect(() => {
    let blinkTimer: ReturnType<typeof setTimeout>
    let resetTimer: ReturnType<typeof setTimeout>

    const loop = () => {
      blinkTimer = setTimeout(
        () => {
          setBlink(true)

          resetTimer = setTimeout(() => {
            setBlink(false)
          }, 140)

          loop()
        },
        2600 + Math.random() * 3200,
      )
    }

    loop()

    return () => {
      clearTimeout(blinkTimer)
      clearTimeout(resetTimer)
    }
  }, [])

  const eyeScale = blink ? 0.12 : 1

  return (
    <g>
      {/* Floor shadow */}
      {withShadow && (
        <ellipse
          cx={0}
          cy={2}
          rx={44}
          ry={7}
          className="fill-void"
          opacity={0.55}
        />
      )}

      <g className="ns-part ns-bob">
        <g className="ns-part ns-float">

          {/* Left tread foot */}
          <g className="ns-part ns-foot-l">
            <rect
              x={-22}
              y={-24}
              width={8}
              height={14}
              rx={2}
              className="fill-silver"
            />
            <rect
              x={-32}
              y={-13}
              width={26}
              height={13}
              rx={5}
              className="fill-burgundy"
            />
            <circle cx={-25} cy={-6} r={3} className="fill-panel-hi" />
            <circle cx={-14} cy={-6} r={3} className="fill-panel-hi" />
          </g>

          {/* Right tread foot */}
          <g className="ns-part ns-foot-r">
            <rect
              x={14}
              y={-24}
              width={8}
              height={14}
              rx={2}
              className="fill-silver"
            />
            <rect
              x={6}
              y={-13}
              width={26}
              height={13}
              rx={5}
              className="fill-burgundy"
            />
            <circle cx={14} cy={-6} r={3} className="fill-panel-hi" />
            <circle cx={25} cy={-6} r={3} className="fill-panel-hi" />
          </g>

          {/* Right arm */}
          <g className="ns-part ns-arm-r">
            <rect
              x={34}
              y={-92}
              width={14}
              height={40}
              rx={7}
              className="fill-cream-shade"
            />
            <rect
              x={34}
              y={-60}
              width={14}
              height={7}
              rx={3}
              className="fill-burgundy"
            />
            <circle cx={41} cy={-48} r={7} className="fill-cream" />
          </g>

          {/* Body */}
          <rect
            x={-40}
            y={-102}
            width={80}
            height={86}
            rx={8}
            className="fill-cream"
          />

          <rect
            x={-40}
            y={-30}
            width={80}
            height={14}
            rx={4}
            className="fill-cream-shade"
            opacity={0.7}
          />

          <rect
            x={-41}
            y={-24}
            width={82}
            height={6}
            className="fill-burgundy"
          />

          <rect
            x={-22}
            y={-86}
            width={44}
            height={32}
            rx={9}
            className="fill-oxblood"
          />

          <circle cx={-11} cy={-76} r={3.2} className="fill-amber" />
          <circle
            cx={0}
            cy={-76}
            r={3.2}
            className="fill-signal ns-blink-dot"
          />
          <circle cx={11} cy={-76} r={3.2} className="fill-silver" />

          <rect
            x={-14}
            y={-66}
            width={28}
            height={4}
            rx={2}
            className="fill-burgundy"
          />

          <text
            x={0}
            y={-30}
            textAnchor="middle"
            className="fill-burgundy"
            fontSize={8}
            fontWeight={700}
            fontFamily="IBM Plex Mono, monospace"
            letterSpacing={1}
          >
            NS-5
          </text>

          {/* Left arm and coffee mug */}
          <g className="ns-part ns-arm-l">
            <rect
              x={-48}
              y={-92}
              width={14}
              height={40}
              rx={7}
              className="fill-cream-shade"
            />

            <rect
              x={-48}
              y={-60}
              width={14}
              height={7}
              rx={3}
              className="fill-burgundy"
            />

            {withMug && (
              <g>
                <path
                  d="M -64 -58 q -8 0 -8 7 q 0 7 8 7"
                  className="stroke-soft"
                  strokeWidth={3}
                  fill="none"
                />

                <rect
                  x={-64}
                  y={-64}
                  width={22}
                  height={24}
                  rx={4}
                  className="fill-soft"
                />

                <rect
                  x={-64}
                  y={-58}
                  width={22}
                  height={5}
                  className="fill-burgundy"
                />

                <text
                  x={-53}
                  y={-45}
                  textAnchor="middle"
                  className="fill-oxblood"
                  fontSize={6}
                  fontWeight={700}
                  fontFamily="IBM Plex Mono, monospace"
                >
                  NS-5
                </text>

                <path
                  d="M -57 -68 q -3 -5 0 -10"
                  className="stroke-silver ns-steam"
                  strokeWidth={1.6}
                  fill="none"
                  strokeLinecap="round"
                />

                <path
                  d="M -50 -68 q 3 -6 0 -12"
                  className="stroke-silver ns-steam"
                  style={{ animationDelay: '1.2s' }}
                  strokeWidth={1.6}
                  fill="none"
                  strokeLinecap="round"
                />
              </g>
            )}

            <circle cx={-41} cy={-48} r={7} className="fill-cream" />
          </g>

          {/* Neck */}
          <rect
            x={-5}
            y={-142}
            width={10}
            height={40}
            rx={3}
            className="fill-burgundy"
          />

          <rect
            x={-12}
            y={-108}
            width={24}
            height={6}
            rx={2}
            className="fill-panel-hi"
          />

          <circle cx={0} cy={-142} r={6} className="fill-silver" />

          {/* Head */}
          <g className="ns-part ns-head">
            <rect
              x={-8}
              y={-160}
              width={16}
              height={12}
              rx={2}
              className="fill-burgundy"
            />

            {/* Antenna */}
            <g className="ns-part ns-antenna">
              <line
                x1={40}
                y1={-180}
                x2={44}
                y2={-206}
                className="stroke-silver"
                strokeWidth={2.5}
                strokeLinecap="round"
              />

              <circle
                cx={44}
                cy={-209}
                r={8}
                className="fill-amber"
                opacity={0.25}
              />

              <circle cx={44} cy={-209} r={4.5} className="fill-amber" />
            </g>

            {/* Eyes */}
            <g ref={eyesRef}>
              {[-1, 1].map((side) => (
                <g
                  key={side}
                  transform={`translate(${side * 25} -164) rotate(${side * -9})`}
                >
                  <rect
                    x={-27}
                    y={-21}
                    width={54}
                    height={40}
                    rx={18}
                    className="fill-cream"
                  />

                  <rect
                    x={-28}
                    y={-25}
                    width={56}
                    height={7}
                    rx={3}
                    className="fill-cream-shade"
                  />

                  <circle r={16} className="fill-burgundy" />
                  <circle r={13} className="fill-charcoal" />

                  <g
                    style={{
                      transform: `scaleY(${eyeScale})`,
                      transition: 'transform 90ms ease',
                    }}
                  >
                    <circle r={10} className="fill-amber" />

                    <g
                      style={{
                        transform: `translate(${pupil.x * 0.8}px, ${pupil.y * 0.8}px)`,
                        transition: 'transform 120ms ease-out',
                      }}
                    >
                      <circle r={5} className="fill-space" />
                      <circle
                        cx={-2.2}
                        cy={-2.4}
                        r={1.9}
                        className="fill-soft"
                      />
                    </g>
                  </g>
                </g>
              ))}
            </g>
          </g>
        </g>
      </g>
    </g>
  )
}

/** Compact NS-5 portrait for message avatars and unit ID cards. */
export function NS5Avatar({ className }: { className?: string }) {
  return (
    <svg
      viewBox="-62 -222 124 124"
      className={className}
      aria-hidden="true"
    >
      <NS5Robot
        trackPointer={false}
        withMug={false}
        withShadow={false}
      />
    </svg>
  )
}
