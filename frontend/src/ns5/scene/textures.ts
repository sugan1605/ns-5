import * as THREE from "three";

import { P } from "./palette";

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  return { c, ctx };
}

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

function finish(c: HTMLCanvasElement, repeat?: [number, number], color = true) {
  const t = new THREE.CanvasTexture(c);
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  t.anisotropy = 4;
  return t;
}

function noise(ctx: CanvasRenderingContext2D, w: number, h: number, amount: number, seed = 3) {
  const r = seeded(seed);
  for (let i = 0; i < (w * h) / 6; i++) {
    const v = r() > 0.5 ? 255 : 0;
    ctx.fillStyle = `rgba(${v},${v},${v},${r() * amount})`;
    ctx.fillRect(r() * w, r() * h, 1.5, 1.5);
  }
}

/** Hull wall: panel seams, rivets and soft grime. */
export function wallTexture(repeat: [number, number]) {
  const { c, ctx } = canvas(512, 512);
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, "#2A3442");
  g.addColorStop(1, "#202935");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);
  noise(ctx, 512, 512, 0.06, 5);
  ctx.strokeStyle = "rgba(8,11,16,0.9)";
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, 508, 508);
  ctx.beginPath();
  ctx.moveTo(0, 340);
  ctx.lineTo(512, 340);
  ctx.stroke();
  ctx.strokeStyle = "rgba(165,181,197,0.12)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(7, 7, 498, 498);
  ctx.beginPath();
  ctx.moveTo(0, 345);
  ctx.lineTo(512, 345);
  ctx.stroke();
  ctx.fillStyle = "rgba(165,181,197,0.35)";
  for (const [x, y] of [
    [22, 22],
    [490, 22],
    [22, 490],
    [490, 490],
    [22, 320],
    [490, 320],
  ]) {
    ctx.beginPath();
    ctx.arc(x!, y!, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  // vent slats
  ctx.fillStyle = "rgba(8,11,16,0.7)";
  for (let i = 0; i < 6; i++) ctx.fillRect(60, 390 + i * 14, 140, 6);
  return finish(c, repeat);
}

/** Deck plating with a fine grip pattern. */
export function floorTexture(repeat: [number, number]) {
  const { c, ctx } = canvas(512, 512);
  ctx.fillStyle = "#222B37";
  ctx.fillRect(0, 0, 512, 512);
  noise(ctx, 512, 512, 0.07, 9);
  ctx.strokeStyle = "rgba(165,181,197,0.07)";
  ctx.lineWidth = 2;
  for (let y = 0; y < 512; y += 16)
    for (let x = (y / 16) % 2 ? 8 : 0; x < 512; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, y + 5);
      ctx.lineTo(x + 6, y);
      ctx.stroke();
    }
  ctx.strokeStyle = "rgba(6,9,13,0.95)";
  ctx.lineWidth = 5;
  ctx.strokeRect(0, 0, 512, 512);
  return finish(c, repeat);
}

/** Cream robot paint with gentle wear. */
export function creamTexture() {
  const { c, ctx } = canvas(256, 256);
  ctx.fillStyle = P.cream;
  ctx.fillRect(0, 0, 256, 256);
  const r = seeded(21);
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = `rgba(150,110,70,${0.04 + r() * 0.06})`;
    ctx.beginPath();
    ctx.ellipse(r() * 256, r() * 256, 4 + r() * 18, 2 + r() * 8, r() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  noise(ctx, 256, 256, 0.05, 13);
  ctx.strokeStyle = "rgba(90,60,40,0.18)";
  for (let i = 0; i < 12; i++) {
    ctx.beginPath();
    const x = r() * 256;
    const y = r() * 256;
    ctx.moveTo(x, y);
    ctx.lineTo(x + r() * 20 - 10, y + r() * 6);
    ctx.stroke();
  }
  return finish(c);
}

/** Soft radial glow for sprites. */
export function glowTexture() {
  const { c, ctx } = canvas(128, 128);
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.25, "rgba(255,255,255,0.45)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return finish(c);
}

/** Four-point star flare for the North Star. */
export function flareTexture() {
  const { c, ctx } = canvas(256, 256);
  ctx.translate(128, 128);
  for (const [len, w, a] of [
    [128, 5, 0.9],
    [70, 3, 0.5],
  ] as const) {
    for (let i = 0; i < 4; i++) {
      ctx.save();
      ctx.rotate((Math.PI / 2) * i + (len === 70 ? Math.PI / 4 : 0));
      const g = ctx.createLinearGradient(0, 0, len, 0);
      g.addColorStop(0, `rgba(255,236,200,${a})`);
      g.addColorStop(1, "rgba(255,236,200,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, -w);
      ctx.lineTo(len, 0);
      ctx.lineTo(0, w);
      ctx.fill();
      ctx.restore();
    }
  }
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 40);
  g.addColorStop(0, "rgba(255,250,235,1)");
  g.addColorStop(1, "rgba(244,184,96,0)");
  ctx.fillStyle = g;
  ctx.fillRect(-40, -40, 80, 80);
  return finish(c);
}

/** Banded planet surface with cloud streaks. */
export function planetTexture() {
  const { c, ctx } = canvas(512, 256);
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, "#2B4A66");
  g.addColorStop(0.45, "#4E7FA6");
  g.addColorStop(0.6, "#6E98B8");
  g.addColorStop(1, "#1F3549");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 256);
  const r = seeded(31);
  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = `rgba(220,229,239,${0.05 + r() * 0.18})`;
    ctx.beginPath();
    ctx.ellipse(r() * 512, r() * 256, 20 + r() * 80, 2 + r() * 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 20; i++) {
    ctx.fillStyle = `rgba(94,156,110,${0.15 + r() * 0.2})`;
    ctx.beginPath();
    ctx.ellipse(r() * 512, 80 + r() * 110, 10 + r() * 30, 6 + r() * 14, r() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  return finish(c);
}

/** Faint nebula backdrop. */
export function nebulaTexture() {
  const { c, ctx } = canvas(1024, 512);
  ctx.fillStyle = "#06090E";
  ctx.fillRect(0, 0, 1024, 512);
  const r = seeded(47);
  const blobs: [string, number][] = [
    ["78,127,166", 0.16],
    ["244,184,96", 0.07],
    ["89,9,7", 0.12],
  ];
  for (let i = 0; i < 26; i++) {
    const [col, a] = blobs[i % blobs.length]!;
    const x = r() * 1024;
    const y = 80 + r() * 300;
    const rad = 60 + r() * 200;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, `rgba(${col},${a})`);
    g.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1024, 512);
  }
  for (let i = 0; i < 700; i++) {
    ctx.fillStyle = `rgba(220,229,239,${r() * 0.7})`;
    ctx.fillRect(r() * 1024, r() * 512, r() < 0.95 ? 1 : 2, r() < 0.95 ? 1 : 2);
  }
  return finish(c);
}

/** Simple text label (chest plate, mug). */
export function labelTexture(text: string, color: string, size = 64, w = 256, h = 96) {
  const { c, ctx } = canvas(w, h);
  ctx.fillStyle = color;
  ctx.font = `700 ${size}px "IBM Plex Mono", monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, w / 2, h / 2 + 2);
  return finish(c);
}

/** Star chart poster for the wall. */
export function posterTexture() {
  const { c, ctx } = canvas(256, 360);
  ctx.fillStyle = "#E3D6BF";
  ctx.fillRect(0, 0, 256, 360);
  ctx.fillStyle = "#151C26";
  ctx.fillRect(14, 14, 228, 260);
  const r = seeded(77);
  ctx.fillStyle = "#DCE5EF";
  for (let i = 0; i < 80; i++) ctx.fillRect(14 + r() * 228, 14 + r() * 260, 1.5, 1.5);
  ctx.strokeStyle = "rgba(244,184,96,0.8)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  const pts = [
    [60, 200],
    [90, 170],
    [120, 180],
    [150, 140],
    [170, 90],
    [200, 70],
  ];
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x!, y!) : ctx.moveTo(x!, y!)));
  ctx.stroke();
  ctx.fillStyle = "#F4B860";
  for (const [x, y] of pts) {
    ctx.beginPath();
    ctx.arc(x!, y!, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#590907";
  ctx.font = '700 22px "IBM Plex Mono", monospace';
  ctx.fillText("NORTH STAR", 24, 312);
  ctx.font = '400 13px "IBM Plex Mono", monospace';
  ctx.fillText("ROUTE 05 · VISIT SOON", 24, 336);
  return finish(c);
}

/** Keyboard keycap grid. */
export function keyboardTexture() {
  const { c, ctx } = canvas(256, 96);
  ctx.fillStyle = "#151C26";
  ctx.fillRect(0, 0, 256, 96);
  ctx.fillStyle = "#3A4554";
  for (let row = 0; row < 4; row++)
    for (let col = 0; col < 12; col++) ctx.fillRect(8 + col * 20.3, 8 + row * 21, 16, 16);
  ctx.fillStyle = "#78D69B";
  ctx.fillRect(220, 71, 28, 16);
  return finish(c);
}

/** Canvas the monitor redraws itself into. */
export function screenCanvas() {
  const { c, ctx } = canvas(512, 320);
  const tex = finish(c);
  return { canvas: c, ctx, tex };
}
