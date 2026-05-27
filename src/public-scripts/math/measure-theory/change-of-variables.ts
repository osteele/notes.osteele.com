// Figure 5a: the Jacobian as a local area ratio. Two side-by-side panels,
// source U on the left and target V on the right under a chosen
// diffeomorphism g. A 20×20 reference grid is drawn on the source; the
// image of that grid is drawn on the target. A draggable focus cell shows
// the local area scaling |det Dg| and the density ratio.

const COLORS = {
  bg: "#ffffff",
  grid: "#e3ddd0",
  gridStrong: "#b9b0a0",
  axis: "#5a6577",
  text: "#1f2733",
  textDim: "#5a6577",
  cellEdge: "#1f4a8c",
  cellFill: "rgba(31,74,140,0.18)",
  cellFillImg: "rgba(31,74,140,0.32)",
  focus: "#b8412a",
  focusFill: "rgba(184,65,42,0.30)",
  orientPos: "#2d7a3e",
  orientNeg: "#b8412a",
  density: "#6b4592",
};

function setupCanvas(canvas: HTMLCanvasElement) {
  const ratio = window.devicePixelRatio || 1;
  const intrinsicW = parseInt(canvas.getAttribute("width") || "0", 10);
  const intrinsicH = parseInt(canvas.getAttribute("height") || "0", 10);
  canvas.style.width = "100%";
  canvas.style.height = `${canvas.getBoundingClientRect().width * intrinsicH / intrinsicW}px`;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * ratio;
  canvas.height = rect.height * ratio;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(ratio, ratio);
  return { ctx, w: rect.width, h: rect.height };
}

type Vec2 = [number, number];

type Mat2 = [[number, number], [number, number]];

interface MapDef {
  name: string;
  domain: { x: [number, number]; y: [number, number] };
  range: { x: [number, number]; y: [number, number] };
  // g: (source) → (target).
  g: (p: Vec2) => Vec2;
  // g⁻¹: (target) → (source); used so clicks in the target panel drive the
  // same focus point. May return null when the target point has no
  // preimage in the displayed source domain.
  gInv: (q: Vec2) => Vec2 | null;
  // Jacobian determinant at source point.
  detJ: (p: Vec2) => number;
  // Full 2×2 Jacobian Dg at source point. The two columns are the images
  // of the unit basis vectors e₁ and e₂ under the differential; the
  // parallelogram in the target panel is exactly the image of the unit
  // square under this matrix.
  Dg: (p: Vec2) => Mat2;
  // For display: a short label and a TeX-free description.
  detLabel: string;
  description: string;
  // Symbolic form for the matrix display ("constant" or a function of focus).
  DgSymbolic: (p: Vec2) => string[][];
}

const SHEAR_S = 0.8;
const SCALE_A = 1.4;
const SCALE_B = 0.7;

const MAPS: Record<string, MapDef> = {
  shear: {
    name: "Linear shear",
    domain: { x: [-1.5, 1.5], y: [-1.5, 1.5] },
    range: { x: [-2.7, 2.7], y: [-1.5, 1.5] },
    g: ([x, y]) => [x + SHEAR_S * y, y],
    gInv: ([u, v]) => [u - SHEAR_S * v, v],
    detJ: () => 1,
    Dg: () => [[1, SHEAR_S], [0, 1]],
    DgSymbolic: () => [["1", String(SHEAR_S)], ["0", "1"]],
    detLabel: "1 (everywhere)",
    description: "g(x,y) = (x + 0.8·y, y). Cells skew but areas are preserved — same density.",
  },
  scale: {
    name: "Linear scale",
    domain: { x: [-1.5, 1.5], y: [-1.5, 1.5] },
    range: { x: [-2.5, 2.5], y: [-1.5, 1.5] },
    g: ([x, y]) => [SCALE_A * x, SCALE_B * y],
    gInv: ([u, v]) => [u / SCALE_A, v / SCALE_B],
    detJ: () => SCALE_A * SCALE_B,
    Dg: () => [[SCALE_A, 0], [0, SCALE_B]],
    DgSymbolic: () => [[String(SCALE_A), "0"], ["0", String(SCALE_B)]],
    detLabel: `${(SCALE_A * SCALE_B).toFixed(2)} (everywhere)`,
    description: `g(x,y) = (${SCALE_A}·x, ${SCALE_B}·y). Uniform area scaling; density dilutes by the same factor.`,
  },
  polar: {
    // Source = (r, θ) rectangle; target = Cartesian disc. r ∈ [0.1, 1.4],
    // θ ∈ [0, 2π] gives a clear annulus with no degenerate cells at r=0.
    name: "Polar",
    domain: { x: [0.1, 1.4], y: [0, 2 * Math.PI] },
    range: { x: [-1.5, 1.5], y: [-1.5, 1.5] },
    g: ([r, t]) => [r * Math.cos(t), r * Math.sin(t)],
    gInv: ([u, v]) => {
      const r = Math.hypot(u, v);
      let t = Math.atan2(v, u);
      if (t < 0) t += 2 * Math.PI;
      return [r, t];
    },
    detJ: ([r]) => r,
    Dg: ([r, t]) => [
      [Math.cos(t), -r * Math.sin(t)],
      [Math.sin(t),  r * Math.cos(t)],
    ],
    DgSymbolic: () => [["cos θ", "−r·sin θ"], ["sin θ", "r·cos θ"]],
    detLabel: "r (position-dependent)",
    description: "g(r, θ) = (r·cos θ, r·sin θ). |det Dg| = r: cells fan out as r grows; the singular line r=0 has been clipped.",
  },
  reflection: {
    name: "Reflection",
    domain: { x: [-1.5, 1.5], y: [-1.5, 1.5] },
    range: { x: [-1.5, 1.5], y: [-1.5, 1.5] },
    g: ([x, y]) => [x, -y],
    gInv: ([u, v]) => [u, -v],
    detJ: () => -1,
    Dg: () => [[1, 0], [0, -1]],
    DgSymbolic: () => [["1", "0"], ["0", "−1"]],
    detLabel: "−1 (orientation-reversing)",
    description: "g(x,y) = (x, −y). det Dg = −1 (orientation reversed); |det Dg| = 1, so density is unchanged.",
  },
};

// Internal state per figure.
interface State {
  mapKey: string;
  focus: Vec2; // in source domain coordinates
  showOrientation: boolean;
  showSourceBump: boolean; // toggle for non-uniform source density
}

function fmt(x: number, digits = 3): string {
  if (!Number.isFinite(x)) return "—";
  const a = Math.abs(x);
  if (a !== 0 && (a < 0.01 || a >= 1000)) return x.toExponential(2);
  return x.toFixed(digits);
}

function sourceDensity(p: Vec2, st: State): number {
  if (!st.showSourceBump) return 1; // uniform
  // Gaussian bump centered at the middle of the source domain.
  const m = MAPS[st.mapKey];
  const cx = (m.domain.x[0] + m.domain.x[1]) / 2;
  const cy = (m.domain.y[0] + m.domain.y[1]) / 2;
  const sx = (m.domain.x[1] - m.domain.x[0]) / 4;
  const sy = (m.domain.y[1] - m.domain.y[0]) / 4;
  const z = ((p[0] - cx) / sx) ** 2 + ((p[1] - cy) / sy) ** 2;
  return Math.exp(-0.5 * z);
}

// What to display on the source side: when the user hasn't asked for a
// non-uniform input density, the source panel shows |det Dg| itself — the
// local area-scaling factor of the map, evaluated at each source point.
// This is a real, non-forced quantity that lives on U; for linear maps it
// is constant (correctly, those maps stretch everywhere by the same factor)
// and for the polar map it varies as r, revealing the radial stretching
// pattern that the target panel can only show indirectly. Once the
// Gaussian-bump toggle is on, the source panel switches to f_X — that is
// the more informative thing to look at when the input is non-uniform.
function sourceShade(p: Vec2, st: State, m: MapDef): number {
  if (st.showSourceBump) return sourceDensity(p, st);
  return Math.abs(m.detJ(p));
}

function densityColor(density: number, maxDensity: number): string {
  // Map a density value in [0, maxDensity] to a purple tint.
  const t = Math.min(1, density / maxDensity);
  // Background-blend with white: stronger density → more saturated purple.
  const baseR = 107, baseG = 69, baseB = 146;
  const r = Math.round(255 + (baseR - 255) * t);
  const g = Math.round(255 + (baseG - 255) * t);
  const b = Math.round(255 + (baseB - 255) * t);
  return `rgb(${r},${g},${b})`;
}

(function changeOfVariablesFigure() {
  const canvas = document.getElementById("fig-cov-2d") as HTMLCanvasElement | null;
  if (!canvas) return;

  const state: State = {
    mapKey: "polar",
    focus: [0.7, Math.PI / 4],
    showOrientation: false,
    // Default to a non-uniform input density so the source panel always
    // has visible structure. For linear maps |det Dg| is constant and a
    // |det Dg|-shaded source would be flat; the bump's image under the
    // map is the more informative thing to look at by default. Toggling
    // the bump off reveals the |det Dg| field — useful mainly for polar.
    showSourceBump: true,
  };

  // Wire up controls.
  const presetButtons = document.querySelectorAll<HTMLElement>("[data-fig-cov-preset]");
  presetButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const k = btn.getAttribute("data-fig-cov-preset")!;
      if (!MAPS[k]) return;
      state.mapKey = k;
      // Reset focus to a sensible default within the new domain.
      const d = MAPS[k].domain;
      state.focus = [
        (d.x[0] + d.x[1]) / 2 + (d.x[1] - d.x[0]) * 0.15,
        (d.y[0] + d.y[1]) / 2 + (d.y[1] - d.y[0]) * 0.15,
      ];
      presetButtons.forEach((b) => b.classList.toggle(
        "active", b === btn,
      ));
      draw();
    });
  });
  // Mark the initial preset as active.
  presetButtons.forEach((b) =>
    b.classList.toggle("active", b.getAttribute("data-fig-cov-preset") === state.mapKey),
  );

  const orientToggle = document.getElementById("fig-cov-orient") as HTMLInputElement | null;
  if (orientToggle) {
    orientToggle.checked = state.showOrientation;
    orientToggle.addEventListener("change", () => {
      state.showOrientation = orientToggle.checked;
      draw();
    });
  }

  const bumpToggle = document.getElementById("fig-cov-bump") as HTMLInputElement | null;
  if (bumpToggle) {
    bumpToggle.checked = state.showSourceBump;
    bumpToggle.addEventListener("change", () => {
      state.showSourceBump = bumpToggle.checked;
      draw();
    });
  }

  // Drag handler: clicks and drags on EITHER panel update the focus.
  // Source clicks set the focus directly; target clicks invert g and update
  // the source-domain focus, so the user can drive the figure from either
  // side. CSS-pixel dimensions are read from `getBoundingClientRect`,
  // since `setupCanvas` sets `style.height` from the rendered width.
  let dragging = false;
  canvas.style.touchAction = "none";
  const localXY = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  function cssRect() {
    const r = canvas!.getBoundingClientRect();
    return { w: r.width, h: r.height };
  }
  function clampToDomain(p: Vec2, m: MapDef): Vec2 {
    return [
      Math.max(m.domain.x[0], Math.min(m.domain.x[1], p[0])),
      Math.max(m.domain.y[0], Math.min(m.domain.y[1], p[1])),
    ];
  }
  function hitFocus(x: number, y: number): Vec2 | null {
    const { w, h } = cssRect();
    const layout = computeLayout(w, h);
    const m = MAPS[state.mapKey];
    const src = pixelToSource(x, y, layout.left, m);
    if (src) return clampToDomain(src, m);
    const tgt = pixelToRange(x, y, layout.right, m);
    if (tgt) {
      const pre = m.gInv(tgt);
      if (pre) return clampToDomain(pre, m);
    }
    return null;
  }
  canvas.addEventListener("pointerdown", (e) => {
    const { x, y } = localXY(e);
    const p = hitFocus(x, y);
    if (p) {
      state.focus = p;
      dragging = true;
      canvas.setPointerCapture(e.pointerId);
      e.preventDefault();
      draw();
    }
  });
  canvas.addEventListener("pointermove", (e) => {
    const { x, y } = localXY(e);
    if (!dragging) {
      // Hover cursor: indicate that either panel is interactive.
      canvas.style.cursor = hitFocus(x, y) ? "crosshair" : "";
      return;
    }
    const p = hitFocus(x, y);
    if (p) {
      state.focus = p;
      draw();
    }
  });
  const endDrag = (e: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    try { canvas.releasePointerCapture(e.pointerId); } catch {}
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  function computeLayout(w: number, h: number) {
    // Two square panels with a gap, leaving space for axis labels.
    const labelPad = 28; // space at top for axis labels
    const gap = 24;
    const panelSize = Math.min(h - labelPad - 14, (w - gap) / 2 - 4);
    const totalW = panelSize * 2 + gap;
    const x0 = (w - totalW) / 2;
    const y0 = labelPad;
    return {
      left:  { x: x0, y: y0, size: panelSize },
      right: { x: x0 + panelSize + gap, y: y0, size: panelSize },
    };
  }

  function panelTransform(panel: { x: number; y: number; size: number }, range: { x: [number, number]; y: [number, number] }) {
    const xUnit = panel.size / (range.x[1] - range.x[0]);
    const yUnit = panel.size / (range.y[1] - range.y[0]);
    const toPx = (p: Vec2): Vec2 => [
      panel.x + (p[0] - range.x[0]) * xUnit,
      panel.y + panel.size - (p[1] - range.y[0]) * yUnit,
    ];
    return { xUnit, yUnit, toPx };
  }

  function pixelToSource(px: number, py: number, panel: { x: number; y: number; size: number }, m: MapDef): Vec2 | null {
    if (px < panel.x || px > panel.x + panel.size) return null;
    if (py < panel.y || py > panel.y + panel.size) return null;
    const xUnit = panel.size / (m.domain.x[1] - m.domain.x[0]);
    const yUnit = panel.size / (m.domain.y[1] - m.domain.y[0]);
    return [
      m.domain.x[0] + (px - panel.x) / xUnit,
      m.domain.y[0] + (panel.y + panel.size - py) / yUnit,
    ];
  }

  function pixelToRange(px: number, py: number, panel: { x: number; y: number; size: number }, m: MapDef): Vec2 | null {
    if (px < panel.x || px > panel.x + panel.size) return null;
    if (py < panel.y || py > panel.y + panel.size) return null;
    const xUnit = panel.size / (m.range.x[1] - m.range.x[0]);
    const yUnit = panel.size / (m.range.y[1] - m.range.y[0]);
    return [
      m.range.x[0] + (px - panel.x) / xUnit,
      m.range.y[0] + (panel.y + panel.size - py) / yUnit,
    ];
  }

  function drawPanelFrame(ctx: CanvasRenderingContext2D, panel: { x: number; y: number; size: number }, label: string) {
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(panel.x, panel.y, panel.size, panel.size);
    ctx.strokeStyle = COLORS.axis;
    ctx.lineWidth = 1.2;
    ctx.strokeRect(panel.x, panel.y, panel.size, panel.size);
    ctx.fillStyle = COLORS.text;
    ctx.font = "bold 13px -apple-system, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(label, panel.x + panel.size / 2, panel.y - 10);
  }

  function draw() {
    const { ctx, w, h } = setupCanvas(canvas!);
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, w, h);

    const layout = computeLayout(w, h);
    const m = MAPS[state.mapKey];

    const sourceLabel = state.mapKey === "polar" ? "Source U: (r, θ)" : "Source U ⊂ ℝ²";
    const targetLabel = state.mapKey === "polar" ? "Target V ⊂ ℝ²" : "Target V ⊂ ℝ²";
    drawPanelFrame(ctx, layout.left, sourceLabel);
    drawPanelFrame(ctx, layout.right, targetLabel);

    const Lsrc = panelTransform(layout.left, m.domain);
    const Lrng = panelTransform(layout.right, m.range);

    // Normalize the source and target shading palettes against the grid
    // max in each panel. Both are computed in a single sweep so the colors
    // are stable across drags.
    const nx = 18, ny = 18;
    const dx = (m.domain.x[1] - m.domain.x[0]) / nx;
    const dy = (m.domain.y[1] - m.domain.y[0]) / ny;
    let maxSourceShade = 1e-9;
    let maxTargetDensity = 1e-9;
    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < ny; j++) {
        const x = m.domain.x[0] + (i + 0.5) * dx;
        const y = m.domain.y[0] + (j + 0.5) * dy;
        maxSourceShade = Math.max(maxSourceShade, sourceShade([x, y], state, m));
        const sd = sourceDensity([x, y], state);
        maxTargetDensity = Math.max(maxTargetDensity, sd / Math.max(1e-3, Math.abs(m.detJ([x, y]))));
      }
    }

    // Pass 1: fill cells (source & target) with density-tinted color.
    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < ny; j++) {
        const x0 = m.domain.x[0] + i * dx;
        const y0 = m.domain.y[0] + j * dy;
        const x1 = x0 + dx;
        const y1 = y0 + dy;
        const xc = (x0 + x1) / 2;
        const yc = (y0 + y1) / 2;
        const sd = sourceDensity([xc, yc], state);
        const detJ = m.detJ([xc, yc]);
        const td = sd / Math.max(1e-3, Math.abs(detJ));
        const ss = sourceShade([xc, yc], state, m);

        // Source cell fill.
        const p00 = Lsrc.toPx([x0, y0]);
        const p10 = Lsrc.toPx([x1, y0]);
        const p11 = Lsrc.toPx([x1, y1]);
        const p01 = Lsrc.toPx([x0, y1]);
        ctx.beginPath();
        ctx.moveTo(p00[0], p00[1]);
        ctx.lineTo(p10[0], p10[1]);
        ctx.lineTo(p11[0], p11[1]);
        ctx.lineTo(p01[0], p01[1]);
        ctx.closePath();
        ctx.fillStyle = densityColor(ss, maxSourceShade);
        ctx.fill();

        // Target cell fill (warped quadrilateral).
        const g00 = Lrng.toPx(m.g([x0, y0]));
        const g10 = Lrng.toPx(m.g([x1, y0]));
        const g11 = Lrng.toPx(m.g([x1, y1]));
        const g01 = Lrng.toPx(m.g([x0, y1]));
        ctx.beginPath();
        ctx.moveTo(g00[0], g00[1]);
        ctx.lineTo(g10[0], g10[1]);
        ctx.lineTo(g11[0], g11[1]);
        ctx.lineTo(g01[0], g01[1]);
        ctx.closePath();
        ctx.fillStyle = densityColor(td, maxTargetDensity);
        ctx.fill();

      }
    }

    // Pass 2: draw grid edges on top.
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 0.8;
    for (let i = 0; i <= nx; i++) {
      const x = m.domain.x[0] + i * dx;
      // Source vertical line.
      ctx.beginPath();
      let p = Lsrc.toPx([x, m.domain.y[0]]);
      ctx.moveTo(p[0], p[1]);
      p = Lsrc.toPx([x, m.domain.y[1]]);
      ctx.lineTo(p[0], p[1]);
      ctx.stroke();
      // Target image of vertical line: sample finely.
      ctx.beginPath();
      const steps = 32;
      for (let k = 0; k <= steps; k++) {
        const y = m.domain.y[0] + (k / steps) * (m.domain.y[1] - m.domain.y[0]);
        const gp = Lrng.toPx(m.g([x, y]));
        if (k === 0) ctx.moveTo(gp[0], gp[1]); else ctx.lineTo(gp[0], gp[1]);
      }
      ctx.stroke();
    }
    for (let j = 0; j <= ny; j++) {
      const y = m.domain.y[0] + j * dy;
      ctx.beginPath();
      let p = Lsrc.toPx([m.domain.x[0], y]);
      ctx.moveTo(p[0], p[1]);
      p = Lsrc.toPx([m.domain.x[1], y]);
      ctx.lineTo(p[0], p[1]);
      ctx.stroke();
      ctx.beginPath();
      const steps = 32;
      for (let k = 0; k <= steps; k++) {
        const x = m.domain.x[0] + (k / steps) * (m.domain.x[1] - m.domain.x[0]);
        const gp = Lrng.toPx(m.g([x, y]));
        if (k === 0) ctx.moveTo(gp[0], gp[1]); else ctx.lineTo(gp[0], gp[1]);
      }
      ctx.stroke();
    }

    // Focus cell — a small square in the source space, drawn larger so it
    // stands out from the background grid.
    const focusW = Math.max(dx * 1.5, (m.domain.x[1] - m.domain.x[0]) * 0.08);
    const focusH = Math.max(dy * 1.5, (m.domain.y[1] - m.domain.y[0]) * 0.08);
    const fx = state.focus[0];
    const fy = state.focus[1];
    const corners: Vec2[] = [
      [fx - focusW / 2, fy - focusH / 2],
      [fx + focusW / 2, fy - focusH / 2],
      [fx + focusW / 2, fy + focusH / 2],
      [fx - focusW / 2, fy + focusH / 2],
    ];
    // Clip the focus square to the domain so the warped image stays valid.
    const clamped: Vec2[] = corners.map(([x, y]) => [
      Math.max(m.domain.x[0], Math.min(m.domain.x[1], x)),
      Math.max(m.domain.y[0], Math.min(m.domain.y[1], y)),
    ]);
    // Source focus square.
    ctx.fillStyle = COLORS.focusFill;
    ctx.strokeStyle = COLORS.focus;
    ctx.lineWidth = 2;
    ctx.beginPath();
    clamped.forEach((c, k) => {
      const p = Lsrc.toPx(c);
      if (k === 0) ctx.moveTo(p[0], p[1]);
      else ctx.lineTo(p[0], p[1]);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Target image of the focus square, sampled along edges.
    ctx.beginPath();
    const edgeSteps = 24;
    for (let k = 0; k < 4; k++) {
      const a = clamped[k];
      const b = clamped[(k + 1) % 4];
      for (let s = 0; s <= edgeSteps; s++) {
        const t = s / edgeSteps;
        const pt: Vec2 = [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];
        const gp = Lrng.toPx(m.g(pt));
        if (k === 0 && s === 0) ctx.moveTo(gp[0], gp[1]);
        else ctx.lineTo(gp[0], gp[1]);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Chirality marker: an "F"-shaped glyph drawn inside the focus cell
    // and its image. Under orientation-preserving maps the F stays an F
    // (skewed or curved, but readable left-to-right); under reflection it
    // appears mirrored. This is the actual visible signal of det Dg's
    // sign, in place of the earlier global tint that didn't show
    // anything most users could see.
    if (state.showOrientation) {
      // Three strokes that compose an F in a local [0,1]² coordinate system.
      const FSEG: [Vec2, Vec2][] = [
        [[0.32, 0.18], [0.32, 0.82]], // vertical stem
        [[0.32, 0.82], [0.72, 0.82]], // top bar
        [[0.32, 0.52], [0.62, 0.52]], // middle bar
      ];
      const fLeft = clamped[0][0], fBot = clamped[0][1];
      const fW = clamped[2][0] - clamped[0][0];
      const fH = clamped[2][1] - clamped[0][1];
      const localToSource = (uv: Vec2): Vec2 => [
        fLeft + uv[0] * fW,
        fBot + uv[1] * fH,
      ];
      ctx.lineWidth = 2.4;
      ctx.lineCap = "round";
      ctx.strokeStyle = "#1f2733"; // near-black, readable on any density tint
      // Source F (straight lines).
      for (const [a, b] of FSEG) {
        const aPx = Lsrc.toPx(localToSource(a));
        const bPx = Lsrc.toPx(localToSource(b));
        ctx.beginPath();
        ctx.moveTo(aPx[0], aPx[1]);
        ctx.lineTo(bPx[0], bPx[1]);
        ctx.stroke();
      }
      // Target F (sample each segment so non-linear maps curve correctly).
      const fSteps = 12;
      for (const [a, b] of FSEG) {
        ctx.beginPath();
        for (let i = 0; i <= fSteps; i++) {
          const t = i / fSteps;
          const uv: Vec2 = [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];
          const gp = Lrng.toPx(m.g(localToSource(uv)));
          if (i === 0) ctx.moveTo(gp[0], gp[1]);
          else ctx.lineTo(gp[0], gp[1]);
        }
        ctx.stroke();
      }
      ctx.lineCap = "butt";
    }

    // Tangent indicators: draw the two basis-vector images at the focus
    // point. These vectors ARE the columns of Dg at the focus — the
    // parallelogram they span is the Jacobian image of the unit square.
    const Dg = m.Dg([fx, fy]);
    const g0 = m.g([fx, fy]);
    const Jcol1: Vec2 = [Dg[0][0], Dg[1][0]];
    const Jcol2: Vec2 = [Dg[0][1], Dg[1][1]];
    const targetAxisScale = 0.20 * Math.min(m.range.x[1] - m.range.x[0], m.range.y[1] - m.range.y[0]);
    const norm1 = Math.hypot(Jcol1[0], Jcol1[1]) || 1;
    const norm2 = Math.hypot(Jcol2[0], Jcol2[1]) || 1;
    const arrow1: Vec2 = [g0[0] + Jcol1[0] / norm1 * targetAxisScale, g0[1] + Jcol1[1] / norm1 * targetAxisScale];
    const arrow2: Vec2 = [g0[0] + Jcol2[0] / norm2 * targetAxisScale, g0[1] + Jcol2[1] / norm2 * targetAxisScale];
    ctx.strokeStyle = COLORS.cellEdge;
    ctx.lineWidth = 1.6;
    const a1Px = Lrng.toPx(arrow1);
    const a2Px = Lrng.toPx(arrow2);
    drawArrow(ctx, Lrng.toPx(g0), a1Px);
    drawArrow(ctx, Lrng.toPx(g0), a2Px);

    // Label the two arrows as the columns of Dg so the matrix view in the
    // readout connects to the figure.
    ctx.font = "bold 11px -apple-system, system-ui, sans-serif";
    ctx.fillStyle = COLORS.cellEdge;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("Dg·e₁", a1Px[0] + 5, a1Px[1] - 2);
    ctx.fillText("Dg·e₂", a2Px[0] + 5, a2Px[1] - 2);

    // Readout.
    const focusDetJ = m.detJ([fx, fy]);
    const sd = sourceDensity([fx, fy], state);
    const td = sd / Math.max(1e-3, Math.abs(focusDetJ));
    const readout = document.getElementById("fig-cov-2d-readout");
    if (readout) {
      const focusStr = state.mapKey === "polar"
        ? `(r, θ) = (${fmt(fx, 2)}, ${fmt(fy, 2)})`
        : `(x, y) = (${fmt(fx, 2)}, ${fmt(fy, 2)})`;
      const orient = focusDetJ >= 0 ? "preserved" : "reversed";
      const sourceLegend = state.showSourceBump
        ? `source shading = f<sub>X</sub>`
        : `source shading = |det Dg| (local area-scale factor; constant for linear maps, equal to r in polar)`;
      const sym = m.DgSymbolic([fx, fy]);
      const num = [
        [fmt(Dg[0][0], 2), fmt(Dg[0][1], 2)],
        [fmt(Dg[1][0], 2), fmt(Dg[1][1], 2)],
      ];
      readout.innerHTML =
        `<strong>${m.name}.</strong> ${m.description}<br>` +
        `At focus ${focusStr}: ` +
        `Dg = ${matrixHTML(sym)} = ${matrixHTML(num)}, ` +
        `<strong>|det Dg| = ${fmt(Math.abs(focusDetJ), 3)}</strong> ` +
        `(${m.detLabel}, orientation ${orient}). ` +
        `f<sub>X</sub> = ${fmt(sd, 3)} → f<sub>Y</sub> = ${fmt(td, 3)}. ` +
        `<em>${sourceLegend}; target shading = f<sub>Y</sub>.</em>`;
    }
  }

  // Render a 2×2 matrix as inline HTML with bracket borders. The entries
  // are arbitrary strings so we can show symbolic forms (e.g. "cos θ") and
  // numeric values side by side.
  function matrixHTML(cells: string[][]): string {
    const cellStyle = "padding:0 6px; text-align:center; font-variant-numeric:tabular-nums;";
    const wrapStyle = "display:inline-grid; grid-template-columns:auto auto; grid-auto-rows:1.2em; align-items:center; vertical-align:middle; padding:1px 4px; margin:0 2px; border-left:1px solid currentColor; border-right:1px solid currentColor; font-family:'Times New Roman', serif;";
    return `<span style="${wrapStyle}">` +
      `<span style="${cellStyle}">${cells[0][0]}</span><span style="${cellStyle}">${cells[0][1]}</span>` +
      `<span style="${cellStyle}">${cells[1][0]}</span><span style="${cellStyle}">${cells[1][1]}</span>` +
      `</span>`;
  }

  function drawArrow(ctx: CanvasRenderingContext2D, from: Vec2, to: Vec2) {
    const dx = to[0] - from[0];
    const dy = to[1] - from[1];
    const len = Math.hypot(dx, dy);
    if (len < 2) return;
    const ux = dx / len, uy = dy / len;
    ctx.beginPath();
    ctx.moveTo(from[0], from[1]);
    ctx.lineTo(to[0], to[1]);
    ctx.stroke();
    const ah = 7;
    ctx.beginPath();
    ctx.moveTo(to[0], to[1]);
    ctx.lineTo(to[0] - ux * ah - uy * ah * 0.5, to[1] - uy * ah + ux * ah * 0.5);
    ctx.lineTo(to[0] - ux * ah + uy * ah * 0.5, to[1] - uy * ah - ux * ah * 0.5);
    ctx.closePath();
    ctx.fillStyle = ctx.strokeStyle as string;
    ctx.fill();
  }

  draw();
  window.addEventListener("resize", draw);
})();
