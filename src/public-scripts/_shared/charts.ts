// Shared chart primitives for the math-page scripts. Bundled into each
// importing page via esbuild (bundle: true).
//
// `drawClippedLine` is the key one: it plots (x, v) samples against a
// value-axis panel and, where v exceeds the panel's [-maxAbs, maxAbs] range,
// breaks the polyline at the interpolated edge crossing and draws a
// tangent-aligned arrowhead OUTSIDE the panel. Without this, off-chart
// segments either render as a flat line clamped to the edge (looking
// constant) or vanish silently — both misleading.

type Pt = number[];
interface Arrow { tipX: number; tipY: number; dirX: number; dirY: number; }

export function drawLine(
  ctx: CanvasRenderingContext2D,
  points: Pt[],
  stroke: string,
  width = 2,
): void {
  ctx.beginPath();
  let penDown = false;
  for (const pt of points) {
    if (!Number.isFinite(pt[0]) || !Number.isFinite(pt[1])) {
      penDown = false;
      continue;
    }
    if (!penDown) {
      ctx.moveTo(pt[0], pt[1]);
      penDown = true;
    } else {
      ctx.lineTo(pt[0], pt[1]);
    }
  }
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width;
  ctx.stroke();
}

export interface ClippedLineOptions {
  width?: number;
  /** Apex distance (px) of off-chart arrowheads, measured from the panel edge along the tangent. */
  apexLen?: number;
  /** Half the arrowhead base width (px), perpendicular to the tangent. */
  halfBase?: number;
}

// Plots (xs[i], vs[i]) as a polyline clipped to value range [vMin, vMax]
// mapped linearly onto a panel y=panelY..panelY+panelH (vMax → panelY,
// vMin → panelY+panelH). `xS` maps a data-space x to a canvas x. Off-chart
// segments are omitted; at each edge crossing the polyline is extended to
// the exact interpolated crossing and a filled arrowhead is drawn just
// outside the panel, oriented along the curve's tangent at that point.
//
// For symmetric value ranges pass vMin = -maxAbs, vMax = +maxAbs.
export function drawClippedLine(
  ctx: CanvasRenderingContext2D,
  xs: number[],
  vs: number[],
  vMin: number,
  vMax: number,
  xS: (x: number) => number,
  panelY: number,
  panelH: number,
  color: string,
  opts: ClippedLineOptions = {},
): void {
  const width = opts.width ?? 2;
  const apexLen = opts.apexLen ?? 7;
  const halfBase = opts.halfBase ?? 4;
  const topY = panelY;
  const botY = panelY + panelH;
  const vRange = vMax - vMin;
  const yFor = (v: number) => panelY + panelH - ((v - vMin) / vRange) * panelH;
  const inRange = (v: number) => Number.isFinite(v) && v >= vMin && v <= vMax;

  function crossingX(xIn: number, vIn: number, xOut: number, vOut: number, exitTop: boolean): number {
    const target = exitTop ? vMax : vMin;
    if (Number.isFinite(vOut) && vOut !== vIn) {
      const t = (target - vIn) / (vOut - vIn);
      return xS(xIn + t * (xOut - xIn));
    }
    return xS(xIn);
  }

  const segments: Pt[][] = [];
  const arrows: Arrow[] = [];
  let current: Pt[] | null = null;

  for (let i = 0; i < vs.length; i++) {
    const v = vs[i];
    const x = xs[i];
    const here = inRange(v);
    if (i > 0) {
      const vPrev = vs[i - 1];
      const xPrev = xs[i - 1];
      const there = inRange(vPrev);
      if (there !== here) {
        const vIn = there ? vPrev : v;
        const vOut = there ? v : vPrev;
        const xInData = there ? xPrev : x;
        const xOutData = there ? x : xPrev;
        const vMid = (vMin + vMax) / 2;
        const exitTop = Number.isFinite(vOut) ? vOut > vMax : vIn >= vMid;
        const cx = crossingX(xInData, vIn, xOutData, vOut, exitTop);
        const cy = exitTop ? topY : botY;
        if (there) {
          // Leaving in-range: tangent points from the last in-range sample
          // toward the crossing — i.e. outward off the panel edge.
          const ref = current && current.length > 0 ? current[current.length - 1] : [cx, cy] as Pt;
          current!.push([cx, cy]);
          segments.push(current!);
          arrows.push(makeArrow(cx, cy, cx - ref[0], cy - ref[1], exitTop));
          current = null;
        } else {
          // Entering in-range: tangent points from the first in-range
          // sample back to the crossing — also outward.
          const inPx: Pt = [xS(x), yFor(v)];
          arrows.push(makeArrow(cx, cy, cx - inPx[0], cy - inPx[1], exitTop));
          current = [[cx, cy], inPx];
          continue;
        }
      }
    }
    if (here) {
      if (!current) current = [];
      current.push([xS(x), yFor(v)]);
    }
  }
  if (current && current.length > 1) segments.push(current);

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  for (const seg of segments) {
    ctx.beginPath();
    seg.forEach((pt, k) => (k === 0 ? ctx.moveTo(pt[0], pt[1]) : ctx.lineTo(pt[0], pt[1])));
    ctx.stroke();
  }
  ctx.fillStyle = color;
  for (const a of arrows) drawArrowhead(ctx, a, apexLen, halfBase);
  ctx.restore();
}

// Build an arrow at (cx, cy) with direction taken from (dx, dy), but with the
// vertical component sign-forced to match exitTop. The tangent can land on
// near-zero dy when the curve crosses the panel boundary in nearly-horizontal
// fashion or when the first in-range sample sits almost on the boundary —
// without the sign enforcement, floating-point noise on dy makes the arrow
// flip up vs down at random as slider values change.
function makeArrow(cx: number, cy: number, dx: number, dy: number, exitTop: boolean): Arrow {
  const desiredDirY = exitTop ? -1 : 1;
  const m = Math.hypot(dx, dy);
  if (m < 1e-6) return { tipX: cx, tipY: cy, dirX: 0, dirY: desiredDirY };
  let nx = dx / m;
  let ny = dy / m;
  if (ny === 0 || Math.sign(ny) !== Math.sign(desiredDirY)) ny = desiredDirY * Math.abs(ny || 1);
  // Re-normalize after potential sign flip (nx unchanged in magnitude).
  const m2 = Math.hypot(nx, ny);
  if (m2 > 0) { nx /= m2; ny /= m2; }
  return { tipX: cx, tipY: cy, dirX: nx, dirY: ny };
}

function drawArrowhead(
  ctx: CanvasRenderingContext2D,
  a: Arrow,
  apexLen: number,
  halfBase: number,
): void {
  const apexX = a.tipX + a.dirX * apexLen;
  const apexY = a.tipY + a.dirY * apexLen;
  const perpX = -a.dirY;
  const perpY = a.dirX;
  ctx.beginPath();
  ctx.moveTo(apexX, apexY);
  ctx.lineTo(a.tipX + perpX * halfBase, a.tipY + perpY * halfBase);
  ctx.lineTo(a.tipX - perpX * halfBase, a.tipY - perpY * halfBase);
  ctx.closePath();
  ctx.fill();
}
