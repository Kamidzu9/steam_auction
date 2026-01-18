"use client";

import React, { forwardRef, useImperativeHandle, useMemo, useRef, useState } from "react";

type Item = { appid: number; name: string; image?: string };

export type AuctionWheelHandle = {
  spinTo: (targetAppId: number, durationMs?: number) => Promise<number>;
};

const AuctionWheel = forwardRef<AuctionWheelHandle, { items: Item[]; defaultDurationMs?: number }>(
  ({ items, defaultDurationMs = 4200 }, ref) => {
    const [rotation, setRotation] = useState(0);
    const [selected, setSelected] = useState<number | null>(null);
    const [spinDuration, setSpinDuration] = useState(defaultDurationMs);
    const discRef = useRef<HTMLDivElement | null>(null);
    const draggingRef = useRef(false);
    const lastPointerRef = useRef<{ angle: number; time: number } | null>(null);

    // render exact items so mapping is precise
    const visible = useMemo(() => items, [items]);

    function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
      const rad = (angleDeg * Math.PI) / 180;
      return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
    }

    useImperativeHandle(ref, () => ({
      spinTo(targetAppId: number, durationMs?: number) {
        return new Promise<number>((resolve) => {
          const count = visible.length;
          if (!count) {
            resolve(-1);
            return;
          }

          const dur = durationMs ?? spinDuration ?? defaultDurationMs;
          setSpinDuration(dur);

          const targetIdx = Math.max(0, visible.findIndex((it) => it.appid === targetAppId));

          const slice = 360 / count;
          const rounds = 6 + Math.floor(Math.random() * 3);
          const targetCenter = targetIdx * slice + slice / 2;
          const randomOffset = (Math.random() - 0.5) * (slice * 0.15);
          const final = rounds * 360 + (360 - targetCenter) + randomOffset;

          setSelected(null);
          requestAnimationFrame(() => setRotation(final));

          setTimeout(() => {
            const normalized = (final % 360 + 360) % 360;
            const landed = Math.floor(((360 - normalized) % 360) / slice);
            setSelected(landed);
            resolve(landed);
          }, dur + 30);
        });
      },
    }));

    const size = 380;
    const cx = size / 2;
    const cy = size / 2;
    const outerR = size / 2 - 6;
    const innerR = Math.max(48, size * 0.2);

    function pointAngle(pageX: number, pageY: number) {
      const rect = discRef.current?.getBoundingClientRect();
      if (!rect) return 0;
      const x = pageX - (rect.left + rect.width / 2);
      const y = pageY - (rect.top + rect.height / 2);
      const ang = (Math.atan2(y, x) * 180) / Math.PI;
      return ang;
    }

    function onPointerDown(e: React.PointerEvent) {
      const ang = pointAngle(e.pageX, e.pageY);
      draggingRef.current = true;
      lastPointerRef.current = { angle: ang, time: performance.now() };
      // stop any transition so we follow pointer
      setSpinDuration(0);
      (e.target as Element).setPointerCapture?.(e.pointerId);
    }

    function onPointerMove(e: React.PointerEvent) {
      if (!draggingRef.current) return;
      const ang = pointAngle(e.pageX, e.pageY);
      const last = lastPointerRef.current;
      if (!last) {
        lastPointerRef.current = { angle: ang, time: performance.now() };
        return;
      }
      const delta = ang - last.angle;
      // apply delta to rotation
      setRotation((r) => r + delta);
      lastPointerRef.current = { angle: ang, time: performance.now() };
    }

    function onPointerUp(e: React.PointerEvent) {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      const last = lastPointerRef.current;
      if (!last) return;
      const ang = pointAngle(e.pageX, e.pageY);
      const now = performance.now();
      const dt = Math.max(1, now - last.time);
      const dv = ang - last.angle;
      const velocity = dv / dt; // deg per ms

      // inertia: spin further based on velocity
      const extra = velocity * 3000; // heuristic
      const final = rotation + extra;
      const dur = Math.min(6000, Math.max(400, Math.abs(extra) * 1.5));
      setSpinDuration(dur);
      requestAnimationFrame(() => setRotation(final));
      lastPointerRef.current = null;
    }

    return (
      <div style={{ width: size, height: size }} className="relative">
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-rose-500 text-sm font-semibold text-white shadow-lg">▼</div>

        <div
          ref={discRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="rounded-full bg-transparent touch-none"
          style={{
            width: size,
            height: size,
            transform: `rotate(${rotation}deg)`,
            transition: `transform ${spinDuration}ms cubic-bezier(.15,.9,.3,1)`,
            touchAction: 'none'
          }}
        >
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <defs>
              <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000" floodOpacity="0.45" />
              </filter>
            </defs>

            {visible.map((item, i) => {
              const startAngle = (360 / visible.length) * i - 90;
              const endAngle = (360 / visible.length) * (i + 1) - 90;
              const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
              const outerStart = polarToCartesian(cx, cy, outerR, endAngle);
              const outerEnd = polarToCartesian(cx, cy, outerR, startAngle);
              const innerStart = polarToCartesian(cx, cy, innerR, startAngle);
              const innerEnd = polarToCartesian(cx, cy, innerR, endAngle);

              const path = `M ${outerStart.x} ${outerStart.y} A ${outerR} ${outerR} 0 ${largeArc} 0 ${outerEnd.x} ${outerEnd.y} L ${innerStart.x} ${innerStart.y} A ${innerR} ${innerR} 0 ${largeArc} 1 ${innerEnd.x} ${innerEnd.y} Z`;

              const midAngle = (startAngle + endAngle) / 2;
              const textPos = polarToCartesian(cx, cy, (innerR + outerR) / 2, midAngle);
              const isSelected = selected === i;
              const hue = (i * 47) % 360;

              return (
                <g key={`${item.appid}-${i}`} filter={isSelected ? "url(#shadow)" : undefined}>
                  <path d={path} fill={`hsl(${hue} 60% 18%)`} stroke={`hsl(${hue} 60% 25%)`} strokeWidth={1} />
                  <text
                    x={textPos.x}
                    y={textPos.y}
                    fill="#e6eef8"
                    fontSize={10}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${midAngle}, ${textPos.x}, ${textPos.y})`}
                    style={{ pointerEvents: "none" }}
                  >
                    {item.name}
                  </text>
                </g>
              );
            })}

            {/* center hub */}
            <g>
              <circle cx={cx} cy={cy} r={innerR - 8} fill="#0b1220" stroke="#172033" strokeWidth={2} />
            </g>
          </svg>

          {/* center hub is visual only; wheel is spun programmatically from Dashboard */}
        </div>
      </div>
    );
  }
);

export default AuctionWheel;

