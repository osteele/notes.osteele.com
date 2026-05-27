// Figure 4d: the Fisher metric on the (μ, σ) plane for the Normal family.
//
// Three overlay modes share a single canvas:
//   1. "ellipses"  — CRLB ellipses (semi-axes from I⁻¹) at a grid of (μ, σ).
//   2. "jeffreys"  — heatmap of √det I(μ, σ) = √2 / σ².
//   3. "warp"      — coordinate-change overlay (μ, σ) ↔ (μ, log σ).
//
// A separate toggle lifts the plane into 3D as a parametric surface patch:
// (μ, σ) embedded in ℝ³ as (μ, σ cos φ(σ), σ sin φ(σ)) with φ chosen so
// the surface visibly bends — this is a *suggestive* embedding, not an
// isometric one (no isometric embedding of the hyperbolic half-plane in
// ℝ³ exists globally). Geodesics and CRLB ellipses lift onto the surface
// without distortion of the (μ, σ) values.
//
// The shared helpers live in _shared/info-geometry.ts and will be reused
// by downstream figures: KL ≈ ½ Fisher quadratic, natural gradient field,
// dually-flat exponential-family coordinates.

import {
  defaultCamera,
  drawMetricEllipse,
  ellipseFromMetric,
  fisherGeodesicNormal,
  fisherNormalMuSigma,
  jeffreysNormalMuSigma,
  klNormal,
  orbitCamera,
  project3,
  type Camera3,
  type Mat2,
  type Vec2,
} from "../../_shared/info-geometry";

const C = {
  bg: "#ffffff",
  grid: "#e3ddd0",
  gridStrong: "#b9b0a0",
  axis: "#5a6577",
  text: "#1f2733",
  textDim: "#5a6577",
  ellipse: "#1f4a8c",
  ellipseFill: "rgba(31,74,140,0.22)",
  jeffreysLo: "#fff7e0",
  jeffreysHi: "#6b4592",
  warp: "#d4690a",
  warpAlt: "#1f4a8c",
  geodesic: "#2d7a3e",
  point: "#b8412a",
  surface: "rgba(31,74,140,0.10)",
  surfaceLine: "#7a8aa6",
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

function fmt(x: number, digits = 3): string {
  if (!Number.isFinite(x)) return "—";
  const a = Math.abs(x);
  if (a !== 0 && (a < 0.01 || a >= 1000)) return x.toExponential(2);
  return x.toFixed(digits);
}

type Mode = "ellipses" | "jeffreys" | "warp";

interface State {
  mode: Mode;
  point: Vec2; // a draggable (μ, σ) — used for the focus ellipse / readout
  sample: { n: number; mu: number; sigma: number } | null;
  view3d: boolean;
  cam: Camera3;
}

const MU_RANGE: [number, number] = [-3, 3];
const SIGMA_RANGE: [number, number] = [0.3, 3];

(function fisherMetricFigure() {
  const canvas = document.getElementById("fig-fisher-metric") as HTMLCanvasElement | null;
  if (!canvas) return;

  const state: State = {
    mode: "ellipses",
    point: [0, 1],
    sample: null,
    view3d: false,
    cam: defaultCamera(720, 400),
  };

  // Controls ----------------------------------------------------------------
  const modeButtons = document.querySelectorAll<HTMLElement>("[data-fig-fm-mode]");
  modeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      state.mode = (btn.getAttribute("data-fig-fm-mode") || "ellipses") as Mode;
      modeButtons.forEach((b) => b.classList.toggle("active", b === btn));
      draw();
    });
  });
  modeButtons.forEach((b) =>
    b.classList.toggle("active", b.getAttribute("data-fig-fm-mode") === state.mode),
  );

  const view3dToggle = document.getElementById("fig-fm-3d") as HTMLInputElement | null;
  if (view3dToggle) {
    view3dToggle.checked = state.view3d;
    view3dToggle.addEventListener("change", () => {
      state.view3d = view3dToggle.checked;
      draw();
    });
  }

  const sampleToggle = document.getElementById("fig-fm-sample") as HTMLInputElement | null;
  const sampleSizeInput = document.getElementById("fig-fm-n") as HTMLInputElement | null;
  const sampleSizeReadout = document.getElementById("fig-fm-n-v") as HTMLElement | null;
  function updateSample() {
    if (sampleToggle && sampleToggle.checked) {
      const n = sampleSizeInput ? parseInt(sampleSizeInput.value, 10) : 25;
      state.sample = { n, mu: state.point[0], sigma: state.point[1] };
    } else {
      state.sample = null;
    }
    if (sampleSizeInput && sampleSizeReadout) sampleSizeReadout.textContent = sampleSizeInput.value;
  }
  if (sampleToggle) sampleToggle.addEventListener("change", () => { updateSample(); draw(); });
  if (sampleSizeInput) sampleSizeInput.addEventListener("input", () => { updateSample(); draw(); });
  updateSample();

  // Drag handler on canvas — only active in 2D view; in 3D the canvas drag
  // orbits the camera instead.
  let dragging: "point" | "camera" | null = null;
  let lastDragXY: { x: number; y: number } | null = null;
  canvas.style.touchAction = "none";
  const localXY = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  // CSS-pixel dimensions of the canvas. These match the coordinates used
  // by `setupCanvas` for drawing and by `pointermove`/`pointerdown` for
  // hit-testing — do NOT read `canvas.getAttribute("height")` (intrinsic),
  // since the styled height is rescaled to preserve aspect ratio when the
  // page is narrower than the intrinsic width.
  function cssRect() {
    const r = canvas!.getBoundingClientRect();
    return { w: r.width, h: r.height };
  }

  canvas.addEventListener("pointerdown", (e) => {
    const xy = localXY(e);
    if (state.view3d) {
      dragging = "camera";
      lastDragXY = xy;
    } else {
      const { w, h } = cssRect();
      const layout = computeLayout(w, h);
      const p = pixelToParam(xy.x, xy.y, layout);
      if (p) {
        state.point = p;
        updateSample();
        dragging = "point";
      }
    }
    canvas!.setPointerCapture(e.pointerId);
    e.preventDefault();
    draw();
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const xy = localXY(e);
    if (dragging === "camera" && lastDragXY) {
      const dx = xy.x - lastDragXY.x;
      const dy = xy.y - lastDragXY.y;
      orbitCamera(state.cam, -dx * 0.01, -dy * 0.01);
      lastDragXY = xy;
    } else if (dragging === "point") {
      const { w, h } = cssRect();
      const layout = computeLayout(w, h);
      const p = pixelToParam(xy.x, xy.y, layout);
      if (p) {
        state.point = p;
        updateSample();
      }
    }
    draw();
  });
  const endDrag = (e: PointerEvent) => {
    if (!dragging) return;
    dragging = null;
    lastDragXY = null;
    try { canvas!.releasePointerCapture(e.pointerId); } catch {}
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  // Layout ------------------------------------------------------------------
  interface Layout {
    plot: { x: number; y: number; w: number; h: number };
    inset: { x: number; y: number; w: number; h: number };
    xUnit: number; // pixels per μ-unit
    yUnit: number; // pixels per σ-unit
    toPx: (p: Vec2) => Vec2;
    toParam: (px: number, py: number) => Vec2;
  }

  function computeLayout(w: number, h: number): Layout {
    const left = 56, right = 12, top = 14, bottom = 38;
    // Reserve a right-side inset for live indicators (Gaussian density,
    // Fisher diagonal). Skipped when the canvas is too narrow.
    const insetW = w > 600 ? 158 : 0;
    const insetGap = insetW > 0 ? 16 : 0;
    const plot = {
      x: left,
      y: top,
      w: w - left - right - insetGap - insetW,
      h: h - top - bottom,
    };
    const inset = {
      x: plot.x + plot.w + insetGap,
      y: top,
      w: insetW,
      h: plot.h,
    };
    const xUnit = plot.w / (MU_RANGE[1] - MU_RANGE[0]);
    const yUnit = plot.h / (SIGMA_RANGE[1] - SIGMA_RANGE[0]);
    const toPx = (p: Vec2): Vec2 => [
      plot.x + (p[0] - MU_RANGE[0]) * xUnit,
      plot.y + plot.h - (p[1] - SIGMA_RANGE[0]) * yUnit,
    ];
    const toParam = (px: number, py: number): Vec2 => [
      MU_RANGE[0] + (px - plot.x) / xUnit,
      SIGMA_RANGE[0] + (plot.y + plot.h - py) / yUnit,
    ];
    return { plot, inset, xUnit, yUnit, toPx, toParam };
  }

  function pixelToParam(px: number, py: number, layout: Layout): Vec2 | null {
    if (px < layout.plot.x || px > layout.plot.x + layout.plot.w) return null;
    if (py < layout.plot.y || py > layout.plot.y + layout.plot.h) return null;
    const p = layout.toParam(px, py);
    return [
      Math.max(MU_RANGE[0], Math.min(MU_RANGE[1], p[0])),
      Math.max(SIGMA_RANGE[0], Math.min(SIGMA_RANGE[1], p[1])),
    ];
  }

  // Drawing -----------------------------------------------------------------
  function draw() {
    const { ctx, w, h } = setupCanvas(canvas!);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, w, h);

    if (state.view3d) {
      drawSurface3D(ctx, w, h);
    } else {
      const layout = computeLayout(w, h);
      drawAxes(ctx, layout);
      switch (state.mode) {
        case "jeffreys": drawJeffreys(ctx, layout); break;
        case "warp":     drawWarp(ctx, layout); break;
        case "ellipses":
        default:         drawEllipses(ctx, layout); break;
      }
      drawSigmaIsobar(ctx, layout);
      drawFocus(ctx, layout);
      drawInset(ctx, layout);
    }
    updateReadout();
  }

  // A faint horizontal line at the focus σ-value across the plot. The
  // Fisher metric depends only on σ — the isobar makes "all points on this
  // row have the same metric" visible at a glance.
  function drawSigmaIsobar(ctx: CanvasRenderingContext2D, L: Layout) {
    const yPx = L.toPx([0, state.point[1]])[1];
    ctx.save();
    ctx.strokeStyle = "rgba(184,65,42,0.45)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(L.plot.x, yPx);
    ctx.lineTo(L.plot.x + L.plot.w, yPx);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  function drawAxes(ctx: CanvasRenderingContext2D, L: Layout) {
    ctx.fillStyle = C.bg;
    ctx.fillRect(L.plot.x, L.plot.y, L.plot.w, L.plot.h);
    ctx.strokeStyle = C.grid;
    ctx.lineWidth = 1;
    // μ grid lines.
    for (let v = MU_RANGE[0]; v <= MU_RANGE[1] + 1e-9; v += 1) {
      const x = L.plot.x + (v - MU_RANGE[0]) * L.xUnit;
      ctx.beginPath();
      ctx.moveTo(x, L.plot.y);
      ctx.lineTo(x, L.plot.y + L.plot.h);
      ctx.stroke();
    }
    // σ grid lines.
    for (let v = 0.5; v <= SIGMA_RANGE[1] + 1e-9; v += 0.5) {
      if (v < SIGMA_RANGE[0]) continue;
      const y = L.plot.y + L.plot.h - (v - SIGMA_RANGE[0]) * L.yUnit;
      ctx.beginPath();
      ctx.moveTo(L.plot.x, y);
      ctx.lineTo(L.plot.x + L.plot.w, y);
      ctx.stroke();
    }
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 1.2;
    ctx.strokeRect(L.plot.x, L.plot.y, L.plot.w, L.plot.h);

    ctx.fillStyle = C.textDim;
    ctx.font = "12px -apple-system, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let v = MU_RANGE[0]; v <= MU_RANGE[1] + 1e-9; v += 1) {
      const x = L.plot.x + (v - MU_RANGE[0]) * L.xUnit;
      ctx.fillText(String(v), x, L.plot.y + L.plot.h + 6);
    }
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let v = 0.5; v <= SIGMA_RANGE[1] + 1e-9; v += 0.5) {
      if (v < SIGMA_RANGE[0]) continue;
      const y = L.plot.y + L.plot.h - (v - SIGMA_RANGE[0]) * L.yUnit;
      ctx.fillText(v.toFixed(1), L.plot.x - 6, y);
    }
    ctx.fillStyle = C.text;
    ctx.font = "italic 13px -apple-system, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("μ", L.plot.x + L.plot.w / 2, L.plot.y + L.plot.h + 22);
    ctx.save();
    ctx.translate(L.plot.x - 36, L.plot.y + L.plot.h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("σ", 0, 0);
    ctx.restore();
  }

  // CRLB-ellipse field. The Cramér–Rao ellipse for an estimator with sample
  // size n at parameter θ has covariance (n · I(θ))⁻¹. We draw the unit
  // metric ball of I(μ, σ) — semi-axes 1/√λᵢ — scaled to a constant pixel
  // size that fits the grid spacing. This is purely a *direction* indicator;
  // the readout shows the actual CRLB scale for the chosen sample.
  function drawEllipses(ctx: CanvasRenderingContext2D, L: Layout) {
    const nx = 9, ny = 7;
    const dx = (MU_RANGE[1] - MU_RANGE[0]) / nx;
    const dy = (SIGMA_RANGE[1] - SIGMA_RANGE[0]) / ny;
    // Choose the ellipse "size" so the largest one fits inside its cell.
    // Largest semi-axis is 1/√λ_min; at σ_max, λ_min = 1/σ_max² so 1/√λ_min = σ_max.
    // We want this to occupy ≈40% of the cell.
    const cellPxX = dx * L.xUnit;
    const cellPxY = dy * L.yUnit;
    const cellMinPx = Math.min(cellPxX, cellPxY);
    const targetMaxPx = 0.40 * cellMinPx;
    const rScale = targetMaxPx / Math.max(SIGMA_RANGE[1] * L.yUnit, SIGMA_RANGE[1] * L.xUnit);

    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < ny; j++) {
        const mu = MU_RANGE[0] + (i + 0.5) * dx;
        const sigma = SIGMA_RANGE[0] + (j + 0.5) * dy;
        const I = fisherNormalMuSigma(mu, sigma);
        const px = L.toPx([mu, sigma]);
        drawMetricEllipse(ctx, I, px[0], px[1], L.xUnit, L.yUnit, rScale, C.ellipse, C.ellipseFill, 1.2);
      }
    }
  }

  // Heatmap of √det I = √2 / σ². Drawn as a rasterized rectangle in 6-pixel
  // tiles for speed.
  function drawJeffreys(ctx: CanvasRenderingContext2D, L: Layout) {
    const tile = 6;
    // Normalize against the max value (at σ_min).
    const maxVal = jeffreysNormalMuSigma(0, SIGMA_RANGE[0]);
    for (let y = L.plot.y; y < L.plot.y + L.plot.h; y += tile) {
      for (let x = L.plot.x; x < L.plot.x + L.plot.w; x += tile) {
        const cx = x + tile / 2;
        const cy = y + tile / 2;
        const p = L.toParam(cx, cy);
        const v = jeffreysNormalMuSigma(p[0], p[1]);
        const t = Math.min(1, v / maxVal);
        // Interpolate between two endpoint colors.
        const lo = [255, 247, 224];
        const hi = [107, 69, 146];
        const r = Math.round(lo[0] + (hi[0] - lo[0]) * t);
        const g = Math.round(lo[1] + (hi[1] - lo[1]) * t);
        const b = Math.round(lo[2] + (hi[2] - lo[2]) * t);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, y, tile, tile);
      }
    }
    // Re-draw axis frame and tick text on top.
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 1.2;
    ctx.strokeRect(L.plot.x, L.plot.y, L.plot.w, L.plot.h);

    // Contour lines at fixed levels of √det I.
    const levels = [0.5, 1, 2, 4];
    ctx.strokeStyle = "rgba(31,33,42,0.4)";
    ctx.lineWidth = 1;
    ctx.font = "11px -apple-system, system-ui, sans-serif";
    ctx.fillStyle = "rgba(31,33,42,0.7)";
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    for (const lvl of levels) {
      // √2/σ² = lvl  ⇒  σ = √(√2 / lvl)
      const sigma = Math.sqrt(Math.SQRT2 / lvl);
      if (sigma < SIGMA_RANGE[0] || sigma > SIGMA_RANGE[1]) continue;
      const y = L.toPx([0, sigma])[1];
      ctx.beginPath();
      ctx.moveTo(L.plot.x, y);
      ctx.lineTo(L.plot.x + L.plot.w, y);
      ctx.stroke();
      ctx.fillText(`√det I = ${lvl}`, L.plot.x + 6, y - 2);
    }
  }

  // Coordinate-warp overlay. Two grids superimposed on the (μ, σ) plane:
  //   • the orange grid corresponds to constant lines in (μ, log σ);
  //   • the blue grid corresponds to constant lines in (μ, σ).
  // Jeffreys density transforms to a *flat* density in (μ, log σ) — visible
  // as a "uniform sheet" once the warped grid is overlaid on the heatmap.
  function drawWarp(ctx: CanvasRenderingContext2D, L: Layout) {
    // Faint Jeffreys heatmap underneath, to anchor the reader.
    drawJeffreys(ctx, L);

    // Blue: lines of constant μ and constant σ.
    ctx.strokeStyle = C.warpAlt;
    ctx.lineWidth = 1.2;
    for (let v = MU_RANGE[0]; v <= MU_RANGE[1] + 1e-9; v += 0.5) {
      const p1 = L.toPx([v, SIGMA_RANGE[0]]);
      const p2 = L.toPx([v, SIGMA_RANGE[1]]);
      ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.stroke();
    }
    for (let v = 0.5; v <= SIGMA_RANGE[1] + 1e-9; v += 0.5) {
      if (v < SIGMA_RANGE[0]) continue;
      const p1 = L.toPx([MU_RANGE[0], v]);
      const p2 = L.toPx([MU_RANGE[1], v]);
      ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.stroke();
    }

    // Orange: lines of constant log σ — i.e., uniformly spaced in log σ.
    ctx.strokeStyle = C.warp;
    ctx.lineWidth = 1.6;
    ctx.setLineDash([4, 3]);
    const logMin = Math.log(SIGMA_RANGE[0]);
    const logMax = Math.log(SIGMA_RANGE[1]);
    const stepsLog = 6;
    for (let i = 0; i <= stepsLog; i++) {
      const ls = logMin + (i / stepsLog) * (logMax - logMin);
      const sigma = Math.exp(ls);
      const p1 = L.toPx([MU_RANGE[0], sigma]);
      const p2 = L.toPx([MU_RANGE[1], sigma]);
      ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.stroke();
    }
    ctx.setLineDash([]);

    // Annotate.
    ctx.fillStyle = C.warp;
    ctx.font = "11px -apple-system, system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.fillText("dashed: log σ grid (uniform in log σ)", L.plot.x + L.plot.w - 6, L.plot.y + 4);
    ctx.fillStyle = C.warpAlt;
    ctx.textBaseline = "alphabetic";
    ctx.fillText("solid: (μ, σ) grid (uniform in σ)", L.plot.x + L.plot.w - 6, L.plot.y + L.plot.h - 6);
  }

  // Right-side inset: a live preview of the Gaussian distribution that the
  // focus point names. As the user drags the focus, the bell visibly shifts
  // (μ) and reshapes (σ); in sample mode, the narrower sampling
  // distribution of μ̂ ~ N(μ, σ²/n) is overlaid in red, so the CRLB scale
  // (1/√n times the population σ) is read directly off the same axes as
  // the population. Below the curve, a small "metric panel" prints the
  // Fisher diagonal entries and bars for √det I and (in sample mode) the
  // CRLB std for μ̂, all updating as the focus moves.
  function drawInset(ctx: CanvasRenderingContext2D, L: Layout) {
    if (L.inset.w <= 0) return; // canvas too narrow — no inset
    const [mu, sigma] = state.point;
    const I = fisherNormalMuSigma(mu, sigma);
    const sqrtDet = jeffreysNormalMuSigma(mu, sigma);
    const sqrtDetMax = jeffreysNormalMuSigma(0, SIGMA_RANGE[0]);

    // Inset background.
    ctx.fillStyle = "#fcf9f0";
    ctx.fillRect(L.inset.x, L.inset.y, L.inset.w, L.inset.h);
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 1;
    ctx.strokeRect(L.inset.x, L.inset.y, L.inset.w, L.inset.h);

    // Header.
    ctx.fillStyle = C.text;
    ctx.font = "bold 11px -apple-system, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(
      `N(μ = ${fmt(mu, 2)}, σ² = ${fmt(sigma * sigma, 2)})`,
      L.inset.x + L.inset.w / 2,
      L.inset.y + 6,
    );

    // Gaussian density sub-plot.
    const padX = 8, padY = 22;
    const plotX = L.inset.x + padX;
    const plotW = L.inset.w - 2 * padX;
    const plotY = L.inset.y + padY;
    const plotH = 130;
    const xRange: [number, number] = [-5, 5];
    const xUnit = plotW / (xRange[1] - xRange[0]);
    // Fix y-axis at the population peak for the smallest σ in the figure,
    // so the bell visibly shrinks as σ grows.
    const yMax = 1 / (SIGMA_RANGE[0] * Math.sqrt(2 * Math.PI)) * 1.05;
    const yUnit = plotH / yMax;
    const toXPx = (x: number) => plotX + (x - xRange[0]) * xUnit;
    const toYPx = (y: number) => plotY + plotH - Math.min(yMax, y) * yUnit;
    const gauss = (x: number, m: number, s: number) =>
      Math.exp(-0.5 * ((x - m) / s) ** 2) / (s * Math.sqrt(2 * Math.PI));

    // Baseline.
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(plotX, plotY + plotH);
    ctx.lineTo(plotX + plotW, plotY + plotH);
    ctx.stroke();

    // Population density curve, filled.
    const samples = 80;
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i <= samples; i++) {
      const x = xRange[0] + (i / samples) * (xRange[1] - xRange[0]);
      pts.push({ x: toXPx(x), y: toYPx(gauss(x, mu, sigma)) });
    }
    ctx.beginPath();
    ctx.moveTo(pts[0].x, plotY + plotH);
    for (const p of pts) ctx.lineTo(p.x, p.y);
    ctx.lineTo(pts[pts.length - 1].x, plotY + plotH);
    ctx.closePath();
    ctx.fillStyle = "rgba(31,74,140,0.16)";
    ctx.fill();
    ctx.beginPath();
    pts.forEach((p, k) => (k === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.strokeStyle = C.ellipse;
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Mean marker.
    const mPx = toXPx(mu);
    if (mPx >= plotX && mPx <= plotX + plotW) {
      ctx.save();
      ctx.strokeStyle = C.point;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(mPx, plotY);
      ctx.lineTo(mPx, plotY + plotH);
      ctx.stroke();
      ctx.restore();
    }
    // ±σ ticks at the baseline.
    ctx.strokeStyle = "rgba(184,65,42,0.65)";
    ctx.lineWidth = 1;
    for (const k of [-1, 1]) {
      const x = mu + k * sigma;
      const px = toXPx(x);
      if (px >= plotX && px <= plotX + plotW) {
        ctx.beginPath();
        ctx.moveTo(px, plotY + plotH);
        ctx.lineTo(px, plotY + plotH - 8);
        ctx.stroke();
      }
    }

    // Sampling-distribution overlay: μ̂ ~ N(μ, σ²/n). Drawn at the same
    // (μ, density) scale so its narrowness directly visualizes √n shrinkage.
    if (state.sample) {
      const sHat = sigma / Math.sqrt(state.sample.n);
      ctx.beginPath();
      for (let i = 0; i <= samples; i++) {
        const x = xRange[0] + (i / samples) * (xRange[1] - xRange[0]);
        const px = toXPx(x);
        const py = toYPx(gauss(x, mu, sHat));
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = C.point;
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }

    // Tiny x-axis tick labels.
    ctx.fillStyle = C.textDim;
    ctx.font = "9px -apple-system, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (const v of [-4, -2, 0, 2, 4]) {
      ctx.fillText(String(v), toXPx(v), plotY + plotH + 2);
    }

    // Metric panel below the curve. Show the actual 2×2 matrix I, not
    // just its diagonal entries — the "matrix-valued field" framing is
    // the point of this section.
    const panelY = plotY + plotH + 14;
    const matH = 34;
    ctx.fillStyle = C.text;
    ctx.font = "bold 11px -apple-system, system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    const matLabelW = 22;
    ctx.fillText("I =", plotX, panelY + matH / 2);
    const matX0 = plotX + matLabelW + 4;
    const matW = plotW - matLabelW - 4;
    const colX = [matX0 + matW * 0.30, matX0 + matW * 0.78];
    const rowY = [panelY + 9, panelY + matH - 9];

    ctx.strokeStyle = C.text;
    ctx.lineWidth = 1.4;
    const bL = matX0 - 2;
    const bR = matX0 + matW + 2;
    const bTickW = 4;
    ctx.beginPath();
    ctx.moveTo(bL + bTickW, panelY);
    ctx.lineTo(bL, panelY);
    ctx.lineTo(bL, panelY + matH);
    ctx.lineTo(bL + bTickW, panelY + matH);
    ctx.moveTo(bR - bTickW, panelY);
    ctx.lineTo(bR, panelY);
    ctx.lineTo(bR, panelY + matH);
    ctx.lineTo(bR - bTickW, panelY + matH);
    ctx.stroke();

    ctx.font = "11px 'Times New Roman', serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = C.text;
    ctx.fillText(fmt(I[0][0], 3), colX[0], rowY[0]);
    ctx.fillText("0", colX[1], rowY[0]);
    ctx.fillText("0", colX[0], rowY[1]);
    ctx.fillText(fmt(I[1][1], 3), colX[1], rowY[1]);

    // √det I bar.
    const barY = panelY + matH + 14;
    const barH = 10;
    const barLabelW = 70;
    const barBoxX = plotX + barLabelW;
    const barBoxW = plotW - barLabelW;
    ctx.fillStyle = C.textDim;
    ctx.fillText("√det I", plotX, barY);
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 0.8;
    ctx.strokeRect(barBoxX, barY - 2, barBoxW, barH);
    const t = Math.min(1, sqrtDet / sqrtDetMax);
    ctx.fillStyle = C.jeffreysHi;
    ctx.fillRect(barBoxX, barY - 2, barBoxW * t, barH);
    ctx.fillStyle = C.text;
    ctx.font = "10px -apple-system, system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(fmt(sqrtDet, 3), barBoxX + barBoxW - 4, barY + barH / 2 - 2);

    // CRLB row (only in sample mode).
    if (state.sample) {
      const crlbY = barY + 22;
      const stdMu = sigma / Math.sqrt(state.sample.n);
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = C.point;
      ctx.fillText(`CRLB σ̂_μ = σ/√n = ${fmt(stdMu, 3)}`, plotX, crlbY);
      ctx.fillStyle = C.textDim;
      ctx.fillText(`(n = ${state.sample.n})`, plotX, crlbY + 13);
    }
  }

  function drawFocus(ctx: CanvasRenderingContext2D, L: Layout) {
    const px = L.toPx(state.point);
    const I = fisherNormalMuSigma(state.point[0], state.point[1]);

    // For CRLB given a sample, the covariance is (n · I)⁻¹: ellipse semi-axes
    // grow as 1/√n. Use a fixed visual radius for "no sample" mode that
    // matches the field, and the actual CRLB scale when a sample is on.
    let rScale: number;
    let label: string;
    if (state.sample) {
      // True CRLB ellipse: covariance Σ = I⁻¹ / n, so semi-axes = 1/√(n λ).
      // ellipseFromMetric draws the unit ball of n·I (semi-axes 1/√(nλ)), so
      // pass n·I as the metric and r = 1.
      const nI: Mat2 = [
        [I[0][0] * state.sample.n, I[0][1] * state.sample.n],
        [I[1][0] * state.sample.n, I[1][1] * state.sample.n],
      ];
      drawMetricEllipse(ctx, nI, px[0], px[1], L.xUnit, L.yUnit, 1, C.point, "rgba(184,65,42,0.18)", 2);
      label = "CRLB ellipse";
    } else {
      // Unit metric-ball of I, at a fixed display size that matches the field.
      const cellPx = Math.min(L.plot.w / 9, L.plot.h / 7) * 0.40;
      rScale = cellPx / Math.max(state.point[1] * L.xUnit, state.point[1] * L.yUnit);
      drawMetricEllipse(ctx, I, px[0], px[1], L.xUnit, L.yUnit, rScale, C.point, "rgba(184,65,42,0.18)", 2);
      label = "I unit ball";
    }
    // Center dot.
    ctx.fillStyle = C.point;
    ctx.beginPath();
    ctx.arc(px[0], px[1], 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = "11px -apple-system, system-ui, sans-serif";
    ctx.fillStyle = C.point;
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    ctx.fillText(label, px[0] + 6, px[1] - 6);
  }

  // 3D surface embedding -----------------------------------------------------
  //
  // Embed (μ, σ) as (μ, σ·cos(α log σ), σ·sin(α log σ)) for a chosen α.
  // This wraps the σ-axis around so that growing σ moves the surface
  // outward AND rotates it — a visual cue that "moving in σ" is a richer
  // motion than μ. Geodesics and ellipses are mapped onto the surface
  // using the same embedding.
  function embed3D(mu: number, sigma: number): [number, number, number] {
    // Normalize (μ, σ) into a friendly [-1.5, 1.5]³ box.
    const muN = mu / 2.5;
    const alpha = 1.6;
    const u = Math.log(sigma);
    const x = muN;
    const y = sigma * Math.cos(alpha * u) * 0.6;
    const z = sigma * Math.sin(alpha * u) * 0.6;
    // Lift the whole patch up so σ small ↔ low z.
    return [x, y - 0.3, z - 0.3];
  }

  function drawSurface3D(ctx: CanvasRenderingContext2D, w: number, h: number) {
    state.cam.width = w;
    state.cam.height = h;

    // Rasterize a (μ, σ) grid into a list of quads, sorted by depth.
    const nx = 28, ny = 28;
    const dx = (MU_RANGE[1] - MU_RANGE[0]) / nx;
    const dy = (SIGMA_RANGE[1] - SIGMA_RANGE[0]) / ny;

    interface Quad {
      pts: { x: number; y: number; depth: number }[];
      depth: number;
      fill: string;
      stroke: string | null;
    }
    const quads: Quad[] = [];
    const jeffreysMax = jeffreysNormalMuSigma(0, SIGMA_RANGE[0]);

    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < ny; j++) {
        const mu = MU_RANGE[0] + i * dx;
        const sigma = SIGMA_RANGE[0] + j * dy;
        const corners: Vec2[] = [
          [mu, sigma],
          [mu + dx, sigma],
          [mu + dx, sigma + dy],
          [mu, sigma + dy],
        ];
        const projected = corners.map((c) => project3(state.cam, embed3D(c[0], c[1])));
        if (projected.some((p) => !Number.isFinite(p.x))) continue;
        const depth = (projected[0].depth + projected[1].depth + projected[2].depth + projected[3].depth) / 4;

        let fill: string;
        if (state.mode === "jeffreys" || state.mode === "warp") {
          const muc = mu + dx / 2;
          const sigmac = sigma + dy / 2;
          const v = jeffreysNormalMuSigma(muc, sigmac);
          const t = Math.min(1, v / jeffreysMax);
          const lo = [255, 247, 224], hi = [107, 69, 146];
          const r = Math.round(lo[0] + (hi[0] - lo[0]) * t);
          const g = Math.round(lo[1] + (hi[1] - lo[1]) * t);
          const b = Math.round(lo[2] + (hi[2] - lo[2]) * t);
          fill = `rgb(${r},${g},${b})`;
        } else {
          fill = "rgba(31,74,140,0.10)";
        }
        quads.push({ pts: projected, depth, fill, stroke: C.surfaceLine });
      }
    }
    // Painter's: far first.
    quads.sort((a, b) => b.depth - a.depth);
    for (const q of quads) {
      ctx.beginPath();
      ctx.moveTo(q.pts[0].x, q.pts[0].y);
      for (let k = 1; k < q.pts.length; k++) ctx.lineTo(q.pts[k].x, q.pts[k].y);
      ctx.closePath();
      ctx.fillStyle = q.fill;
      ctx.fill();
      if (q.stroke) {
        ctx.strokeStyle = "rgba(122,138,166,0.35)";
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }

    // Mark the focus point in 3D.
    const focusEmbed = embed3D(state.point[0], state.point[1]);
    const focusProj = project3(state.cam, focusEmbed);
    if (Number.isFinite(focusProj.x)) {
      ctx.fillStyle = C.point;
      ctx.beginPath();
      ctx.arc(focusProj.x, focusProj.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Geodesic from (μ=0, σ=2) to the focus point, traced on the surface.
    // This is the payoff for downstream KL-as-geodesic figure: the path is
    // computed in the Poincaré half-plane and lifted to the surface.
    if (state.mode === "ellipses") {
      const geo = fisherGeodesicNormal([0, 2], state.point, 48);
      ctx.strokeStyle = C.geodesic;
      ctx.lineWidth = 2;
      ctx.beginPath();
      let first = true;
      for (const pt of geo.points) {
        const proj = project3(state.cam, embed3D(pt[0], pt[1]));
        if (!Number.isFinite(proj.x)) { first = true; continue; }
        if (first) { ctx.moveTo(proj.x, proj.y); first = false; }
        else ctx.lineTo(proj.x, proj.y);
      }
      ctx.stroke();
    }

    // Caption note on 3D ambiguity.
    ctx.fillStyle = C.textDim;
    ctx.font = "11px -apple-system, system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("3D embedding is suggestive, not isometric. Drag to orbit.", 12, 12);
    if (state.mode === "ellipses") {
      ctx.fillStyle = C.geodesic;
      ctx.fillText("Green: Fisher-geodesic from (μ=0, σ=2) to the focus point.", 12, 28);
    }
  }

  // Readout -----------------------------------------------------------------
  function updateReadout() {
    const readout = document.getElementById("fig-fisher-metric-readout");
    if (!readout) return;
    const [mu, sigma] = state.point;
    const sqrtDet = jeffreysNormalMuSigma(mu, sigma);
    const I = fisherNormalMuSigma(mu, sigma);
    const e = ellipseFromMetric(I, 1);
    const parts: string[] = [];
    parts.push(
      `At (μ, σ) = (${fmt(mu, 2)}, ${fmt(sigma, 2)}): ` +
      `I = diag(${fmt(I[0][0], 3)}, ${fmt(I[1][1], 3)}), ` +
      `<strong>√det I = ${fmt(sqrtDet, 3)}</strong>.`,
    );
    parts.push(
      `Unit metric ball semi-axes: ${fmt(e.semiMajor, 3)} (σ-direction), ${fmt(e.semiMinor, 3)} (μ-direction). ` +
      `Ratio = √2 (always).`,
    );
    if (state.sample) {
      const n = state.sample.n;
      const stdMu = sigma / Math.sqrt(n);
      const stdSigma = sigma / Math.sqrt(2 * n);
      parts.push(
        `Sample n = ${n}: CRLB std for μ̂ is σ/√n = ${fmt(stdMu, 3)}, for σ̂ is σ/√(2n) = ${fmt(stdSigma, 3)}.`,
      );
    }
    if (state.mode === "warp") {
      parts.push(
        `Jeffreys density: ∝ 1/σ² in (μ, σ) — improper at σ → 0. Pulled to (μ, log σ) it becomes flat (uniform on log σ), recovering the standard noninformative-on-scale prior.`,
      );
    }
    readout.innerHTML = parts.join(" ");
  }

  draw();
  window.addEventListener("resize", draw);
})();
