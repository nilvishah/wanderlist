import { useMemo, type ReactNode } from "react";
import type { ColorFamily, Scene } from "../lib/types";
import { family, STAR_COLOR, type Family } from "../lib/colors";
import { between, rng } from "../lib/seed";

interface Props {
  scene: Scene;
  color: ColorFamily | string;
  seed: string;
  className?: string;
}

const W = 320;
const H = 180;

// ---------- Shared pieces ----------

function SunOrMoon({ r, f, x, y, size }: { r: () => number; f: Family; x: number; y: number; size: number }) {
  if (r() < 0.28) {
    return (
      <g>
        <circle cx={x} cy={y} r={size} fill="#FFF8EC" />
        <circle cx={x + size * 0.45} cy={y - size * 0.25} r={size * 0.92} fill={f.tint} />
      </g>
    );
  }
  return <circle cx={x} cy={y} r={size} fill={STAR_COLOR} />;
}

function ridge(r: () => number, baseY: number, minPeak: number, maxPeak: number, peaks: number) {
  const step = (W + 20) / (peaks * 2);
  let x = -10;
  let d = `M -10 ${H} L -10 ${baseY - between(r, 0, 20)}`;
  for (let i = 0; i < peaks; i++) {
    x += step * between(r, 0.7, 1.3);
    d += ` L ${x.toFixed(1)} ${between(r, minPeak, maxPeak).toFixed(1)}`;
    x += step * between(r, 0.7, 1.3);
    d += ` L ${x.toFixed(1)} ${(baseY - between(r, 0, 22)).toFixed(1)}`;
  }
  d += ` L ${W + 10} ${baseY - between(r, 0, 20)} L ${W + 10} ${H} Z`;
  return d;
}

function wave(r: () => number, y: number, amp: number, len: number) {
  const x0 = -between(r, 0, len) - 10;
  let d = `M ${x0.toFixed(1)} ${y}`;
  for (let x = x0; x < W + len; x += len) {
    d += ` q ${len / 4} ${-amp} ${len / 2} 0 t ${len / 2} 0`;
  }
  d += ` L ${W + len} ${H} L ${x0.toFixed(1)} ${H} Z`;
  return d;
}

function pine(x: number, baseY: number, h: number, fill: string, key: string) {
  const w = h * 0.42;
  return (
    <g key={key} fill={fill}>
      <path d={`M ${x} ${baseY - h} L ${x + w / 2} ${baseY - h * 0.45} L ${x - w / 2} ${baseY - h * 0.45} Z`} />
      <path d={`M ${x} ${baseY - h * 0.7} L ${x + w * 0.62} ${baseY - h * 0.12} L ${x - w * 0.62} ${baseY - h * 0.12} Z`} />
      <rect x={x - 1.5} y={baseY - h * 0.14} width={3} height={h * 0.16} />
    </g>
  );
}

// ---------- Scenes ----------

function hike(r: () => number, f: Family): ReactNode[] {
  const out: ReactNode[] = [];
  out.push(<rect key="bg" width={W} height={H} fill={f.tint} />);
  out.push(<SunOrMoon key="sun" r={r} f={f} x={between(r, 50, 270)} y={between(r, 34, 62)} size={between(r, 13, 19)} />);
  out.push(<path key="back" d={ridge(r, 130, 48, 95, 3)} fill={f.main} opacity={0.45} />);
  out.push(<path key="mid" d={ridge(r, 150, 70, 118, 3)} fill={f.main} />);
  out.push(<path key="front" d={wave(r, 160, between(r, 6, 12), between(r, 110, 170))} fill={f.deep} />);
  const trees = 1 + Math.floor(r() * 3);
  for (let i = 0; i < trees; i++) {
    out.push(pine(between(r, 20, W - 20), 162, between(r, 26, 40), f.deep, `pine${i}`));
  }
  return out;
}

function beach(r: () => number, f: Family): ReactNode[] {
  const out: ReactNode[] = [];
  const horizon = between(r, 92, 110);
  out.push(<rect key="bg" width={W} height={H} fill={f.tint} />);
  out.push(<circle key="sun" cx={between(r, 60, 260)} cy={horizon - between(r, 8, 30)} r={between(r, 16, 24)} fill={STAR_COLOR} />);
  out.push(<path key="w1" d={wave(r, horizon, between(r, 3, 5), between(r, 40, 60))} fill={f.main} opacity={0.5} />);
  out.push(<path key="w2" d={wave(r, horizon + 26, between(r, 4, 7), between(r, 50, 75))} fill={f.main} />);
  out.push(<path key="w3" d={wave(r, horizon + 52, between(r, 5, 8), between(r, 60, 90))} fill={f.deep} />);

  if (r() < 0.55) {
    // Sailboat
    const bx = between(r, 40, 260);
    const by = horizon + 16;
    out.push(
      <g key="boat">
        <path d={`M ${bx - 16} ${by} L ${bx + 16} ${by} L ${bx + 10} ${by + 7} L ${bx - 10} ${by + 7} Z`} fill={f.deep} />
        <path d={`M ${bx} ${by - 2} L ${bx} ${by - 30} L ${bx + 14} ${by - 4} Z`} fill="#FFFFFF" />
        <path d={`M ${bx - 2} ${by - 2} L ${bx - 2} ${by - 22} L ${bx - 12} ${by - 4} Z`} fill="#FFFFFF" opacity={0.85} />
      </g>
    );
  } else {
    // Palm on the side
    const left = r() < 0.5;
    const px = left ? between(r, 18, 50) : between(r, 270, 302);
    const lean = left ? 1 : -1;
    const top = between(r, 46, 64);
    const tx = px + lean * 18;
    out.push(
      <g key="palm" fill={f.deep}>
        <path
          d={`M ${px - 3} ${H} Q ${px + lean * 4} ${(H + top) / 2} ${tx} ${top} L ${tx + 3} ${top + 2} Q ${px + lean * 9} ${(H + top) / 2} ${px + 4} ${H} Z`}
        />
        {[-1, -0.4, 0.3, 1].map((a, i) => (
          <path
            key={i}
            d={`M ${tx} ${top} q ${a * 22} ${-12 + Math.abs(a) * 4} ${a * 40} ${8 + Math.abs(a) * 10} q ${-a * 18} ${-14} ${-a * 40} ${-8 - Math.abs(a) * 10} Z`}
          />
        ))}
      </g>
    );
  }
  return out;
}

function city(r: () => number, f: Family): ReactNode[] {
  const out: ReactNode[] = [];
  out.push(<rect key="bg" width={W} height={H} fill={f.tint} />);
  out.push(<SunOrMoon key="sun" r={r} f={f} x={between(r, 50, 270)} y={between(r, 30, 52)} size={between(r, 12, 18)} />);

  // Back skyline
  let x = -6;
  let i = 0;
  while (x < W) {
    const w = between(r, 20, 36);
    const h = between(r, 60, 110);
    out.push(<rect key={`b${i++}`} x={x} y={H - h} width={w} height={h} fill={f.main} opacity={0.45} />);
    x += w + between(r, 0, 4);
  }

  // Front skyline with lit windows
  x = -4;
  i = 0;
  while (x < W) {
    const w = between(r, 22, 38);
    const h = between(r, 36, 82);
    const top = H - h;
    out.push(<rect key={`f${i}`} x={x} y={top} width={w} height={h} fill={f.deep} />);
    if (r() < 0.2) {
      out.push(<rect key={`s${i}`} x={x + w / 2 - 1} y={top - 12} width={2} height={12} fill={f.deep} />);
    }
    const cols = Math.max(1, Math.floor((w - 6) / 7));
    const rows = Math.max(1, Math.floor((h - 10) / 9));
    for (let cx = 0; cx < cols; cx++) {
      for (let cy = 0; cy < rows; cy++) {
        if (r() < 0.42) {
          out.push(
            <rect
              key={`w${i}-${cx}-${cy}`}
              x={x + 4 + cx * 7}
              y={top + 6 + cy * 9}
              width={3}
              height={4}
              fill={f.tint}
              opacity={between(r, 0.65, 1)}
            />
          );
        }
      }
    }
    x += w + between(r, 1, 5);
    i++;
  }
  return out;
}

function culture(r: () => number, f: Family): ReactNode[] {
  const out: ReactNode[] = [];
  const ground = 150;
  out.push(<rect key="bg" width={W} height={H} fill={f.tint} />);
  out.push(<SunOrMoon key="sun" r={r} f={f} x={between(r, 40, 280)} y={between(r, 30, 50)} size={between(r, 12, 17)} />);
  const kind = Math.floor(r() * 3);
  const cx = between(r, 120, 200);

  if (kind === 0) {
    // Aqueduct arches
    const top = between(r, 72, 92);
    out.push(<rect key="arch-body" x={-10} y={top} width={W + 20} height={ground - top} fill={f.main} />);
    const archW = between(r, 30, 42);
    const gap = between(r, 10, 14);
    for (let ax = -between(r, 0, archW); ax < W; ax += archW + gap) {
      const rad = archW / 2;
      const archTop = top + between(r, 14, 18);
      out.push(
        <path
          key={`a${ax.toFixed(0)}`}
          d={`M ${ax} ${ground} V ${archTop + rad} A ${rad} ${rad} 0 0 1 ${ax + archW} ${archTop + rad} V ${ground} Z`}
          fill={f.tint}
        />
      );
    }
    out.push(<rect key="arch-cap" x={-10} y={top - 6} width={W + 20} height={7} fill={f.deep} />);
  } else if (kind === 1) {
    // Pagoda / temple roofs
    const tiers = 3 + Math.floor(r() * 2);
    let y = ground;
    let w = between(r, 70, 90);
    for (let t = 0; t < tiers; t++) {
      const bodyH = between(r, 14, 18);
      y -= bodyH;
      out.push(<rect key={`pb${t}`} x={cx - w / 2 + 8} y={y} width={w - 16} height={bodyH} fill={f.main} />);
      const roofH = 9;
      y -= roofH;
      out.push(
        <path
          key={`pr${t}`}
          d={`M ${cx - w / 2 - 8} ${y + roofH - 3} Q ${cx - w / 2} ${y + roofH} ${cx - w / 2 + 6} ${y + roofH} L ${cx + w / 2 - 6} ${y + roofH} Q ${cx + w / 2} ${y + roofH} ${cx + w / 2 + 8} ${y + roofH - 3} L ${cx + w / 2 - 10} ${y} L ${cx - w / 2 + 10} ${y} Z`}
          fill={f.deep}
        />
      );
      w *= 0.78;
    }
    out.push(<rect key="spire" x={cx - 1.5} y={y - 14} width={3} height={14} fill={f.deep} />);
  } else {
    // Dome with towers
    const bodyW = between(r, 80, 100);
    const bodyH = between(r, 32, 40);
    const bodyTop = ground - bodyH;
    const domeR = bodyW * 0.32;
    out.push(<rect key="body" x={cx - bodyW / 2} y={bodyTop} width={bodyW} height={bodyH} fill={f.main} />);
    out.push(<path key="dome" d={`M ${cx - domeR} ${bodyTop} A ${domeR} ${domeR} 0 0 1 ${cx + domeR} ${bodyTop} Z`} fill={f.main} />);
    out.push(<rect key="finial" x={cx - 1.5} y={bodyTop - domeR - 12} width={3} height={13} fill={f.deep} />);
    out.push(<path key="door" d={`M ${cx - 9} ${ground} V ${ground - 16} A 9 9 0 0 1 ${cx + 9} ${ground - 16} V ${ground} Z`} fill={f.deep} />);
    for (const side of [-1, 1]) {
      const tx = cx + side * (bodyW / 2 + 16);
      const th = between(r, 70, 90);
      out.push(<rect key={`t${side}`} x={tx - 5} y={ground - th} width={10} height={th} fill={f.deep} />);
      out.push(<path key={`tc${side}`} d={`M ${tx - 6} ${ground - th} L ${tx} ${ground - th - 10} L ${tx + 6} ${ground - th} Z`} fill={f.deep} />);
    }
  }
  out.push(<rect key="ground" x={0} y={ground} width={W} height={H - ground} fill={f.deep} />);
  return out;
}

function other(r: () => number, f: Family): ReactNode[] {
  const out: ReactNode[] = [];
  out.push(<rect key="bg" width={W} height={H} fill={f.tint} />);
  out.push(<circle key="sun" cx={between(r, 60, 260)} cy={between(r, 40, 64)} r={between(r, 14, 20)} fill={STAR_COLOR} />);
  out.push(<path key="h1" d={wave(r, between(r, 104, 118), between(r, 10, 16), between(r, 180, 240))} fill={f.main} opacity={0.5} />);
  out.push(<path key="h2" d={wave(r, between(r, 128, 138), between(r, 10, 14), between(r, 200, 260))} fill={f.main} />);
  out.push(<path key="h3" d={wave(r, 156, between(r, 6, 10), between(r, 160, 220))} fill={f.deep} />);
  const vx = between(r, 130, 190);
  out.push(
    <path
      key="road"
      d={`M ${vx - 2} 132 Q ${vx + between(r, -30, 30)} 150 ${vx - 40} ${H} L ${vx + 30} ${H} Q ${vx + between(r, -20, 20)} 152 ${vx + 2} 132 Z`}
      fill="#FFF8EC"
      opacity={0.9}
    />
  );
  return out;
}

const RENDERERS: Record<Scene, (r: () => number, f: Family) => ReactNode[]> = {
  hike,
  beach,
  city,
  culture,
  other,
};

export default function SceneIllustration({ scene, color, seed, className }: Props) {
  const content = useMemo(() => {
    const render = RENDERERS[scene] ?? other;
    return render(rng(`${scene}:${seed}`), family(color));
  }, [scene, color, seed]);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMax slice"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {content}
    </svg>
  );
}