// Bayesian regression: penalties as priors.
// Two figures.
//   Figure 1 (fig-shrink): a single 1-D coefficient β. Top panel = negative log
//     posterior L(β) = (β − β_OLS)² + penalty(β) for ridge / LASSO / L0.
//     Bottom panel = the resulting estimator map β̂(β_OLS) for each. Slide β_OLS
//     and λ; watch linear-shrinkage / soft-threshold / hard-threshold appear.
//   Figure 2 (fig-geom): the canonical 2-D constraint geometry. OLS quadratic
//     contours centered at a draggable β_OLS, with the L1 diamond and L2 disk
//     constraint regions; touch points marked. Shows why LASSO uniquely lands
//     on the axes.

const C = {
  bg: "#ffffff",
  axis: "#5a6577",
  text: "#1f2733",
  textDim: "#5a6577",
  grid: "#e3ddd0",
  ridge: "#1f4a8c",
  lasso: "#2d7a3e",
  l0: "#b8412a",
  ols: "#111827",
  data: "#94a3b8",
  identityLine: "#cbd5e1",
};

// ----- shared math -----

function ridgeMap(bOLS: number, lambda: number): number {
  return bOLS / (1 + lambda);
}
function lassoMap(bOLS: number, lambda: number): number {
  const t = lambda / 2;
  if (bOLS > t) return bOLS - t;
  if (bOLS < -t) return bOLS + t;
  return 0;
}
function l0Map(bOLS: number, lambda: number): number {
  // L(β) = (β − β_OLS)² + λ · 1[β ≠ 0]
  // Compare L(0) = β_OLS² with L(β_OLS) = λ. Cutoff at |β_OLS| = √λ.
  return bOLS * bOLS > lambda ? bOLS : 0;
}

function lossRidge(b: number, bOLS: number, lambda: number): number {
  return (b - bOLS) * (b - bOLS) + lambda * b * b;
}
function lossLasso(b: number, bOLS: number, lambda: number): number {
  return (b - bOLS) * (b - bOLS) + lambda * Math.abs(b);
}
function lossL0(b: number, bOLS: number, lambda: number): number {
  return (b - bOLS) * (b - bOLS) + (b === 0 ? 0 : lambda);
}

// =========================================================================
// FIGURE 1: shrinkage / thresholding
// =========================================================================

function initShrink(): void {
  const canvas = document.getElementById("fig-shrink") as HTMLCanvasElement | null;
  if (!canvas) return;
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const rect = canvas.getBoundingClientRect();
  const w = rect.width || +canvas.getAttribute("width")! || 780;
  const h = rect.height || +canvas.getAttribute("height")! || 480;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  canvas.style.width = w + "px";
  canvas.style.height = h + "px";
  const ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);

  const bIn = document.getElementById("fig-shrink-bols") as HTMLInputElement;
  const bV = document.getElementById("fig-shrink-bols-v") as HTMLElement;
  const lIn = document.getElementById("fig-shrink-lambda") as HTMLInputElement;
  const lV = document.getElementById("fig-shrink-lambda-v") as HTMLElement;
  const readout = document.getElementById("shrink-readout") as HTMLElement;

  let bOLS = parseFloat(bIn.value);
  let lambda = parseFloat(lIn.value);

  // Layout: two stacked panels.
  // Common horizontal axis: β (or β_OLS for bottom).
  const padL = 64, padR = 24, padT = 18, padB = 36;
  const gap = 28;
  const innerW = w - padL - padR;
  const panelH = (h - padT - padB - gap) / 2;
  const topY = padT;
  const botY = padT + panelH + gap;

  const xMin = -3.2, xMax = 3.2;
  const xS = (b: number) => padL + ((b - xMin) / (xMax - xMin)) * innerW;
  const xUnS = (px: number) => xMin + ((px - padL) / innerW) * (xMax - xMin);

  // Top panel y-range: dynamic based on current loss values.
  function topYS(loss: number, lossMax: number): number {
    return topY + panelH - (loss / lossMax) * (panelH - 6);
  }
  // Bottom panel y-range: fixed.
  const yMin = -3.0, yMax = 3.0;
  const botYS = (v: number) => botY + panelH - ((v - yMin) / (yMax - yMin)) * panelH;

  function drawAxes(): void {
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = C.grid;
    ctx.lineWidth = 1;
    // Light grid + zero lines for both panels.
    for (let xi = Math.ceil(xMin); xi <= Math.floor(xMax); xi++) {
      const px = xS(xi);
      ctx.beginPath();
      ctx.moveTo(px, topY); ctx.lineTo(px, topY + panelH);
      ctx.moveTo(px, botY); ctx.lineTo(px, botY + panelH);
      ctx.stroke();
    }
    // Zero line, bottom panel only (vertical reference at β_OLS=0 done elsewhere).
    for (let yi = -3; yi <= 3; yi++) {
      const py = botYS(yi);
      ctx.beginPath();
      ctx.moveTo(padL, py); ctx.lineTo(padL + innerW, py);
      ctx.stroke();
    }
    // Panel borders.
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 1;
    ctx.strokeRect(padL, topY, innerW, panelH);
    ctx.strokeRect(padL, botY, innerW, panelH);

    // Axis labels.
    ctx.fillStyle = C.text;
    ctx.font = "12px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("β", padL + innerW / 2, topY + panelH + 26);
    ctx.fillText("β_OLS  (unregularized fit)", padL + innerW / 2, botY + panelH + 26);
    ctx.save();
    ctx.translate(16, topY + panelH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("− log posterior", 0, 0);
    ctx.restore();
    ctx.save();
    ctx.translate(16, botY + panelH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("β̂  (MAP)", 0, 0);
    ctx.restore();

    // x-axis tick labels, top panel
    ctx.textAlign = "center";
    ctx.fillStyle = C.textDim;
    for (let xi = -3; xi <= 3; xi++) {
      ctx.fillText(String(xi), xS(xi), topY + panelH + 14);
      ctx.fillText(String(xi), xS(xi), botY + panelH + 14);
    }
    // y-axis tick labels, bottom panel
    ctx.textAlign = "right";
    for (let yi = -3; yi <= 3; yi++) {
      ctx.fillText(String(yi), padL - 6, botYS(yi) + 4);
    }
  }

  function drawCurves(): void {
    // Compute loss curves; share a y-scale based on the larger of the three loss maxima at panel ends.
    const N = 401;
    const bs = new Array<number>(N);
    const lr = new Array<number>(N);
    const ll = new Array<number>(N);
    const l0 = new Array<number>(N);
    for (let i = 0; i < N; i++) {
      const b = xMin + ((xMax - xMin) * i) / (N - 1);
      bs[i] = b;
      lr[i] = lossRidge(b, bOLS, lambda);
      ll[i] = lossLasso(b, bOLS, lambda);
      l0[i] = lossL0(b, bOLS, lambda);
    }
    // Cap visible loss so a single curve does not blow the scale.
    const visibleCap = Math.min(
      Math.max(...lr, ...ll, ...l0, 1),
      (xMax - bOLS) * (xMax - bOLS) + lambda * Math.max(xMax * xMax, Math.abs(xMax)),
    );
    const lossMax = visibleCap;

    function plot(values: number[], color: string): void {
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < N; i++) {
        const v = values[i];
        if (v > lossMax) {
          if (started) { ctx.stroke(); started = false; }
          continue;
        }
        const x = xS(bs[i]);
        const y = topYS(v, lossMax);
        if (!started) { ctx.moveTo(x, y); started = true; }
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    plot(lr, C.ridge);
    plot(ll, C.lasso);
    plot(l0, C.l0);

    // L0 has a discontinuity at β=0 (penalty drops from λ to 0). Draw the
    // singleton at β=0 with the lower value as a small marker.
    const l0AtZero = bOLS * bOLS; // no penalty
    if (l0AtZero <= lossMax) {
      ctx.beginPath();
      ctx.arc(xS(0), topYS(l0AtZero, lossMax), 3, 0, Math.PI * 2);
      ctx.fillStyle = C.l0;
      ctx.fill();
    }

    // Mark each estimator's optimum on the top panel.
    const opts: [number, string][] = [
      [ridgeMap(bOLS, lambda), C.ridge],
      [lassoMap(bOLS, lambda), C.lasso],
      [l0Map(bOLS, lambda), C.l0],
    ];
    for (const [bhat, color] of opts) {
      const lossAt =
        color === C.ridge ? lossRidge(bhat, bOLS, lambda)
          : color === C.lasso ? lossLasso(bhat, bOLS, lambda)
          : lossL0(bhat, bOLS, lambda);
      if (lossAt <= lossMax) {
        ctx.beginPath();
        ctx.arc(xS(bhat), topYS(lossAt, lossMax), 5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = "white";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    // β_OLS reference: dashed vertical line crossing both panels.
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = C.ols;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(xS(bOLS), topY);
    ctx.lineTo(xS(bOLS), botY + panelH);
    ctx.stroke();
    ctx.restore();

    // Top panel: small "β_OLS" tick label.
    ctx.fillStyle = C.ols;
    ctx.font = "11px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`β_OLS = ${bOLS.toFixed(2)}`, xS(bOLS), topY - 4);
  }

  function drawEstimatorMap(): void {
    // Bottom panel: β̂(β_OLS) for each estimator, over the full x-range.
    const N = 401;
    const xs = new Array<number>(N);
    const ridgeY = new Array<number>(N);
    const lassoY = new Array<number>(N);
    const l0Y = new Array<number>(N);
    for (let i = 0; i < N; i++) {
      const x = xMin + ((xMax - xMin) * i) / (N - 1);
      xs[i] = x;
      ridgeY[i] = ridgeMap(x, lambda);
      lassoY[i] = lassoMap(x, lambda);
      l0Y[i] = l0Map(x, lambda);
    }
    // Identity reference y=x.
    ctx.strokeStyle = C.identityLine;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(xS(xMin), botYS(xMin));
    ctx.lineTo(xS(xMax), botYS(xMax));
    ctx.stroke();
    ctx.setLineDash([]);

    function plotMap(values: number[], color: string, dash: number[] = []): void {
      ctx.save();
      if (dash.length) ctx.setLineDash(dash);
      // L0 has jumps; plot by segments of equal sign of value.
      ctx.beginPath();
      let started = false;
      let prev = NaN;
      for (let i = 0; i < N; i++) {
        const x = xS(xs[i]);
        const y = botYS(values[i]);
        const cur = values[i];
        if (started && Math.abs(cur - prev) > 0.5 && xs[i] !== xs[i - 1]) {
          // jump
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x, y);
        } else if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
        prev = cur;
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();
    }
    plotMap(ridgeY, C.ridge);
    plotMap(lassoY, C.lasso);
    plotMap(l0Y, C.l0);

    // Current β̂ markers + horizontal projection from each.
    const bhats: [number, string][] = [
      [ridgeMap(bOLS, lambda), C.ridge],
      [lassoMap(bOLS, lambda), C.lasso],
      [l0Map(bOLS, lambda), C.l0],
    ];
    for (const [bhat, color] of bhats) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(xS(bOLS), botYS(bhat), 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "white";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Faint horizontal guide to the y-axis.
      ctx.save();
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.35;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(padL, botYS(bhat));
      ctx.lineTo(xS(bOLS), botYS(bhat));
      ctx.stroke();
      ctx.restore();
    }
  }

  function updateReadout(): void {
    const r = ridgeMap(bOLS, lambda);
    const l = lassoMap(bOLS, lambda);
    const z = l0Map(bOLS, lambda);
    readout.innerHTML =
      `β_OLS = <strong>${bOLS.toFixed(2)}</strong>, ` +
      `λ = <strong>${lambda.toFixed(2)}</strong>. ` +
      `β̂_ridge = <span style="color:${C.ridge};font-weight:600">${r.toFixed(2)}</span>, ` +
      `β̂_LASSO = <span style="color:${C.lasso};font-weight:600">${l.toFixed(2)}</span>, ` +
      `β̂_L0 = <span style="color:${C.l0};font-weight:600">${z.toFixed(2)}</span>.`;
    bV.textContent = bOLS.toFixed(2);
    lV.textContent = lambda.toFixed(2);
  }

  function render(): void {
    drawAxes();
    drawCurves();
    drawEstimatorMap();
    updateReadout();
  }

  bIn.addEventListener("input", () => { bOLS = parseFloat(bIn.value); render(); });
  lIn.addEventListener("input", () => { lambda = parseFloat(lIn.value); render(); });
  render();
}

// =========================================================================
// FIGURE 2: 2-D constraint geometry
// =========================================================================

function initGeom(): void {
  const canvas = document.getElementById("fig-geom") as HTMLCanvasElement | null;
  if (!canvas) return;
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const rect = canvas.getBoundingClientRect();
  const w = rect.width || +canvas.getAttribute("width")! || 600;
  const h = rect.height || +canvas.getAttribute("height")! || 520;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  canvas.style.width = w + "px";
  canvas.style.height = h + "px";
  const ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);

  const rIn = document.getElementById("fig-geom-r") as HTMLInputElement;
  const rV = document.getElementById("fig-geom-r-v") as HTMLElement;
  const corrIn = document.getElementById("fig-geom-corr") as HTMLInputElement;
  const corrV = document.getElementById("fig-geom-corr-v") as HTMLElement;
  const readout = document.getElementById("geom-readout") as HTMLElement;

  // Coordinate frame: β1 horizontal, β2 vertical, both in [-2, 2].
  const pad = 36;
  const size = Math.min(w, h) - 2 * pad;
  const cx = w / 2;
  const cy = h / 2;
  const dMin = -2.0, dMax = 2.0;
  const dToPx = (d: number) => ((d - dMin) / (dMax - dMin)) * size - size / 2;
  const xS = (b1: number) => cx + dToPx(b1);
  const yS = (b2: number) => cy - dToPx(b2);
  const pxToD = (px: number, ax: "x" | "y"): number => {
    const center = ax === "x" ? cx : cy;
    const off = ax === "x" ? (px - center) : -(px - center);
    return dMin + ((off + size / 2) / size) * (dMax - dMin);
  };

  // Draggable OLS point.
  let bOLS = { b1: 1.4, b2: 0.9 };
  let r = parseFloat(rIn.value); // constraint radius
  let corr = parseFloat(corrIn.value); // covariance shape parameter [-0.9, 0.9]
  let dragging = false;

  function ellipseQuadFn(b1: number, b2: number): number {
    // OLS loss = (β − β_OLS)^T A (β − β_OLS).
    // A is 2x2 positive definite with shape determined by corr.
    // A = [[1, corr],[corr, 1]] (positive definite for |corr|<1).
    const d1 = b1 - bOLS.b1;
    const d2 = b2 - bOLS.b2;
    return d1 * d1 + d2 * d2 + 2 * corr * d1 * d2;
  }

  // Compute MAP under L1 (diamond) and L2 (disk) constraints with radius r,
  // and L0 (axis-aligned point set: origin + axes truncated to radius r).
  function solveL2(): { b1: number; b2: number } {
    // Minimise (β-β_OLS)^T A (β-β_OLS) subject to β1^2 + β2^2 <= r^2.
    // If β_OLS is inside, MAP = β_OLS; otherwise project along A's anisotropy.
    // For visual purposes, do a fine sweep over θ on the circle.
    if (Math.hypot(bOLS.b1, bOLS.b2) <= r) return { ...bOLS };
    let bestV = Infinity, bestT = 0;
    const N = 720;
    for (let i = 0; i < N; i++) {
      const t = (2 * Math.PI * i) / N;
      const b1 = r * Math.cos(t), b2 = r * Math.sin(t);
      const v = ellipseQuadFn(b1, b2);
      if (v < bestV) { bestV = v; bestT = t; }
    }
    return { b1: r * Math.cos(bestT), b2: r * Math.sin(bestT) };
  }
  function solveL1(): { b1: number; b2: number } {
    // Minimise on |β1|+|β2| <= r. Sample the diamond boundary; if interior point
    // wins, return interior.
    const interior = ellipseQuadFn(bOLS.b1, bOLS.b2);
    if (Math.abs(bOLS.b1) + Math.abs(bOLS.b2) <= r) return { ...bOLS };
    let bestV = interior, bestPt = { ...bOLS };
    const N = 360;
    for (let i = 0; i < N; i++) {
      // Parametrize diamond: 4 edges.
      const t = (4 * i) / N; // 0..4
      const seg = Math.floor(t);
      const f = t - seg;
      let b1 = 0, b2 = 0;
      if (seg === 0) { b1 = r * (1 - f); b2 = r * f; }
      else if (seg === 1) { b1 = -r * f; b2 = r * (1 - f); }
      else if (seg === 2) { b1 = -r * (1 - f); b2 = -r * f; }
      else { b1 = r * f; b2 = -r * (1 - f); }
      const v = ellipseQuadFn(b1, b2);
      if (v < bestV) { bestV = v; bestPt = { b1, b2 }; }
    }
    return bestPt;
  }
  function solveL0(): { b1: number; b2: number } {
    // For visualization: support set = {origin, axes}. The MAP minimises the
    // OLS quadratic over {(0,0), (β1_OLS,0), (0,β2_OLS)}.
    const cands = [
      { b1: 0, b2: 0 },
      { b1: bOLS.b1, b2: 0 },
      { b1: 0, b2: bOLS.b2 },
      { ...bOLS },
    ];
    let best = cands[0], bestV = Infinity;
    for (const c of cands) {
      // Penalty is λ · ||c||_0. For visual consistency we treat the constraint as
      // "at most one nonzero" by giving the full-support candidate (β_OLS) the
      // largest penalty unless it sits inside an analogous L2 ball of radius r.
      const supp = (c.b1 !== 0 ? 1 : 0) + (c.b2 !== 0 ? 1 : 0);
      const allowed = supp <= (r >= 1.4 ? 2 : 1); // shrink "budget" with r
      if (!allowed) continue;
      const v = ellipseQuadFn(c.b1, c.b2);
      if (v < bestV) { bestV = v; best = c; }
    }
    return best;
  }

  function drawFrame(): void {
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, w, h);

    // Grid.
    ctx.strokeStyle = C.grid;
    ctx.lineWidth = 1;
    for (let g = -2; g <= 2; g++) {
      ctx.beginPath();
      ctx.moveTo(xS(g), yS(dMin)); ctx.lineTo(xS(g), yS(dMax));
      ctx.moveTo(xS(dMin), yS(g)); ctx.lineTo(xS(dMax), yS(g));
      ctx.stroke();
    }
    // Axes.
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(xS(dMin), yS(0)); ctx.lineTo(xS(dMax), yS(0));
    ctx.moveTo(xS(0), yS(dMin)); ctx.lineTo(xS(0), yS(dMax));
    ctx.stroke();

    ctx.fillStyle = C.text;
    ctx.font = "12px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("β₁", xS(dMax) + 12, yS(0) + 4);
    ctx.fillText("β₂", xS(0), yS(dMax) - 8);
  }

  function drawContours(): void {
    // Draw a handful of quadratic contours at increasing levels.
    const levels = [0.05, 0.2, 0.5, 1.0, 1.8];
    const N = 360;
    // A = [[1, corr],[corr, 1]]. Diagonalise to get principal axes:
    // eigenvalues 1±corr, with eigenvectors (1,1)/√2 and (1,-1)/√2.
    const lam1 = 1 + corr, lam2 = 1 - corr;
    const ang = Math.PI / 4; // rotation
    const ca = Math.cos(ang), sa = Math.sin(ang);
    for (const lev of levels) {
      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        const t = (2 * Math.PI * i) / N;
        // Ellipse in eigen-frame.
        const u = Math.sqrt(lev / lam1) * Math.cos(t);
        const v = Math.sqrt(lev / lam2) * Math.sin(t);
        const b1 = bOLS.b1 + (ca * u - sa * v);
        const b2 = bOLS.b2 + (sa * u + ca * v);
        const px = xS(b1), py = yS(b2);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.strokeStyle = C.data;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.55;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  function drawConstraintRegions(): void {
    // L2 disk
    ctx.beginPath();
    ctx.arc(xS(0), yS(0), (size / 2) * (r / (dMax - dMin)) * 2, 0, Math.PI * 2);
    ctx.strokeStyle = C.ridge;
    ctx.fillStyle = "rgba(31, 74, 140, 0.06)";
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();

    // L1 diamond.
    ctx.beginPath();
    ctx.moveTo(xS(r), yS(0));
    ctx.lineTo(xS(0), yS(r));
    ctx.lineTo(xS(-r), yS(0));
    ctx.lineTo(xS(0), yS(-r));
    ctx.closePath();
    ctx.strokeStyle = C.lasso;
    ctx.fillStyle = "rgba(45, 122, 62, 0.06)";
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();

    // L0 support set: origin + axis crosses at ±r.
    ctx.strokeStyle = C.l0;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(xS(-r), yS(0)); ctx.lineTo(xS(r), yS(0));
    ctx.moveTo(xS(0), yS(-r)); ctx.lineTo(xS(0), yS(r));
    ctx.stroke();
    // Mark origin.
    ctx.fillStyle = C.l0;
    ctx.beginPath();
    ctx.arc(xS(0), yS(0), 3, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawMAPs(): void {
    const l2 = solveL2();
    const l1 = solveL1();
    const l0 = solveL0();
    const targets: [{ b1: number; b2: number }, string, string][] = [
      [l2, C.ridge, "ridge"],
      [l1, C.lasso, "LASSO"],
      [l0, C.l0, "L0"],
    ];
    for (const [pt, color] of targets) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(xS(pt.b1), yS(pt.b2), 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // OLS point.
    ctx.fillStyle = C.ols;
    ctx.beginPath();
    ctx.arc(xS(bOLS.b1), yS(bOLS.b2), 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = C.text;
    ctx.font = "11px Inter, system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("β_OLS", xS(bOLS.b1) + 9, yS(bOLS.b2) - 6);

    readout.innerHTML =
      `β_OLS = (<strong>${bOLS.b1.toFixed(2)}</strong>, <strong>${bOLS.b2.toFixed(2)}</strong>), ` +
      `radius r = <strong>${r.toFixed(2)}</strong>, correlation = <strong>${corr.toFixed(2)}</strong>. ` +
      `β̂_ridge = <span style="color:${C.ridge};font-weight:600">(${l2.b1.toFixed(2)}, ${l2.b2.toFixed(2)})</span>, ` +
      `β̂_LASSO = <span style="color:${C.lasso};font-weight:600">(${l1.b1.toFixed(2)}, ${l1.b2.toFixed(2)})</span>, ` +
      `β̂_L0 = <span style="color:${C.l0};font-weight:600">(${l0.b1.toFixed(2)}, ${l0.b2.toFixed(2)})</span>.`;
    rV.textContent = r.toFixed(2);
    corrV.textContent = corr.toFixed(2);
  }

  function render(): void {
    drawFrame();
    drawConstraintRegions();
    drawContours();
    drawMAPs();
  }

  canvas.addEventListener("mousedown", (ev) => {
    const rect2 = canvas.getBoundingClientRect();
    const px = ev.clientX - rect2.left;
    const py = ev.clientY - rect2.top;
    const ds = Math.hypot(px - xS(bOLS.b1), py - yS(bOLS.b2));
    if (ds < 16) dragging = true;
    else {
      // Click anywhere else to teleport β_OLS.
      bOLS.b1 = clamp(pxToD(px, "x"), dMin, dMax);
      bOLS.b2 = clamp(pxToD(py, "y"), dMin, dMax);
      render();
    }
  });
  canvas.addEventListener("mousemove", (ev) => {
    if (!dragging) return;
    const rect2 = canvas.getBoundingClientRect();
    bOLS.b1 = clamp(pxToD(ev.clientX - rect2.left, "x"), dMin, dMax);
    bOLS.b2 = clamp(pxToD(ev.clientY - rect2.top, "y"), dMin, dMax);
    render();
  });
  window.addEventListener("mouseup", () => { dragging = false; });

  rIn.addEventListener("input", () => { r = parseFloat(rIn.value); render(); });
  corrIn.addEventListener("input", () => { corr = parseFloat(corrIn.value); render(); });

  render();
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

initShrink();
initGeom();
