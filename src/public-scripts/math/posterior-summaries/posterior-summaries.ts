// Interactive figure: posterior summaries via Bayes risk.
// One posterior, three losses (squared, absolute, zero-one), three Bayes-optimal
// summaries (mean, median, mode).

const C = {
  bg: "#ffffff",
  axis: "#5a6577",
  text: "#1f2733",
  textDim: "#5a6577",
  grid: "#e3ddd0",
  panelBg: "rgba(31,74,140,0.08)",
  posterior: "#1f4a8c",
  posteriorFill: "rgba(31,74,140,0.18)",
  mean: "#1f4a8c",
  median: "#2d7a3e",
  mode: "#b8412a",
  user: "#111827",
  risk: "#6b4592",
  riskFill: "rgba(107,69,146,0.18)",
};

type Shape = "skewed" | "bimodal" | "symmetric";
type Loss = "squared" | "absolute" | "zero-one";

// Posterior densities (unnormalized). The figure plots the normalized density.
function gammaPdf(theta: number, shape: number, rate: number) {
  if (theta <= 0) return 0;
  // unnormalized: theta^(shape-1) * exp(-rate*theta)
  return Math.pow(theta, shape - 1) * Math.exp(-rate * theta);
}
function normalPdf(theta: number, mu: number, sigma: number) {
  return Math.exp(-0.5 * ((theta - mu) / sigma) ** 2) / (sigma * Math.sqrt(2 * Math.PI));
}

function densityFn(shape: Shape): (theta: number) => number {
  if (shape === "skewed") {
    // Gamma(2, 1): mean=2, mode=1, median≈1.6783
    return (t) => gammaPdf(t, 2, 1);
  }
  if (shape === "bimodal") {
    // Two-component Gaussian mixture, asymmetric.
    return (t) => 0.55 * normalPdf(t, 0.7, 0.45) + 0.45 * normalPdf(t, 4.0, 0.9);
  }
  // symmetric: Gaussian centered at 3 with sigma 1
  return (t) => normalPdf(t, 3, 1);
}

function rangeFor(shape: Shape): [number, number] {
  if (shape === "skewed") return [0, 8];
  if (shape === "bimodal") return [-2, 8];
  return [-2, 8];
}

(function () {
  const canvas = document.getElementById("fig-summaries") as HTMLCanvasElement | null;
  if (!canvas) return;
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const rect = canvas.getBoundingClientRect();
  const w = rect.width || +canvas.getAttribute("width")! || 780;
  const h = rect.height || +canvas.getAttribute("height")! || 460;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  canvas.style.width = w + "px";
  canvas.style.height = h + "px";
  const ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);

  const xIn = document.getElementById("fig-summaries-x") as HTMLInputElement;
  const xV = document.getElementById("fig-summaries-x-v") as HTMLElement;
  const readout = document.getElementById("summaries-readout") as HTMLElement;
  const lossTabs = Array.from(document.querySelectorAll<HTMLButtonElement>(".ps-tab"));
  const shapeTabs = Array.from(document.querySelectorAll<HTMLButtonElement>(".ps-shape"));

  let shape: Shape = "skewed";
  let loss: Loss = "squared";
  let xhat = 1.7;

  // Cached posterior arrays for current shape.
  let pdf: number[] = [];
  let xs: number[] = [];
  let normConst = 1;
  let mean = 0, median = 0, mode = 0, posteriorVar = 0;
  let riskCurve: number[] = [];
  let riskMin = 0, riskMax = 1;
  let xMin = 0, xMax = 1;
  const N = 400;

  function recomputeShape() {
    [xMin, xMax] = rangeFor(shape);
    const d = densityFn(shape);
    xs = Array.from({ length: N }, (_, i) => xMin + (i / (N - 1)) * (xMax - xMin));
    const raw = xs.map(d);
    // Trapezoidal integral for normalization.
    const dx = xs[1] - xs[0];
    let total = 0;
    for (let i = 0; i < raw.length - 1; i++) total += 0.5 * (raw[i] + raw[i + 1]) * dx;
    normConst = total;
    pdf = raw.map((v) => v / normConst);

    // Mean: ∫ θ p(θ) dθ
    let m = 0;
    for (let i = 0; i < pdf.length - 1; i++) m += 0.5 * (xs[i] * pdf[i] + xs[i + 1] * pdf[i + 1]) * dx;
    mean = m;

    // Variance: ∫ (θ-mean)² p dθ
    let v = 0;
    for (let i = 0; i < pdf.length - 1; i++) {
      const a = (xs[i] - mean) ** 2 * pdf[i];
      const b = (xs[i + 1] - mean) ** 2 * pdf[i + 1];
      v += 0.5 * (a + b) * dx;
    }
    posteriorVar = v;

    // Median: cumulative ≥ 0.5
    let cum = 0;
    median = xs[xs.length - 1];
    for (let i = 0; i < pdf.length - 1; i++) {
      const inc = 0.5 * (pdf[i] + pdf[i + 1]) * dx;
      if (cum + inc >= 0.5) {
        const frac = (0.5 - cum) / inc;
        median = xs[i] + frac * dx;
        break;
      }
      cum += inc;
    }

    // Mode: argmax pdf
    let bestIdx = 0;
    for (let i = 1; i < pdf.length; i++) if (pdf[i] > pdf[bestIdx]) bestIdx = i;
    mode = xs[bestIdx];

    // Update slider range.
    xIn.min = xMin.toFixed(2);
    xIn.max = xMax.toFixed(2);

    recomputeRisk();
  }

  // Bayes risk as a function of x̂ along the same grid.
  function recomputeRisk() {
    const dx = xs[1] - xs[0];
    // For zero-one (continuous limit), use R_eps(x̂) = 1 - eps · p(x̂); pick eps = 0.4
    // to keep the curve visible. The minimum location is unaffected.
    const eps = 0.4;
    riskCurve = xs.map((xh) => {
      let r = 0;
      for (let i = 0; i < pdf.length - 1; i++) {
        let La, Lb;
        if (loss === "squared") {
          La = (xs[i] - xh) ** 2;
          Lb = (xs[i + 1] - xh) ** 2;
        } else if (loss === "absolute") {
          La = Math.abs(xs[i] - xh);
          Lb = Math.abs(xs[i + 1] - xh);
        } else {
          // 0-1 with thin-window approximation: density at x̂ scaled.
          // (computed analytically below; loop just sums pdf outside [x̂-eps/2, x̂+eps/2])
          const in1 = Math.abs(xs[i] - xh) <= eps / 2 ? 0 : 1;
          const in2 = Math.abs(xs[i + 1] - xh) <= eps / 2 ? 0 : 1;
          La = in1 * pdf[i];
          Lb = in2 * pdf[i + 1];
          r += 0.5 * (La + Lb) * dx;
          continue;
        }
        r += 0.5 * (La * pdf[i] + Lb * pdf[i + 1]) * dx;
      }
      return r;
    });
    riskMin = Math.min(...riskCurve);
    riskMax = Math.max(...riskCurve);
  }

  // Layout
  const pad = { l: 44, r: 16, t: 12, b: 30 };
  const gap = 24;
  const totalH = h - pad.t - pad.b - gap;
  const topH = totalH * 0.55;
  const bottomH = totalH - topH;
  const px0 = pad.l, px1 = w - pad.r;
  const yPost0 = pad.t, yPost1 = pad.t + topH;
  const yRisk0 = yPost1 + gap, yRisk1 = yRisk0 + bottomH;

  function mapX(theta: number) {
    return px0 + (theta - xMin) / (xMax - xMin) * (px1 - px0);
  }
  function mapYPost(p: number, pMax: number) {
    return yPost1 - (p / pMax) * (yPost1 - yPost0 - 8) - 4;
  }
  function mapYRisk(r: number) {
    const span = riskMax - riskMin || 1;
    return yRisk1 - ((r - riskMin) / span) * (yRisk1 - yRisk0 - 8) - 4;
  }

  function drawGrid(x: number, y: number, ww: number, hh: number, xt: number, yt: number) {
    ctx.strokeStyle = C.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < xt; i++) {
      const px = x + (i / xt) * ww;
      ctx.moveTo(px, y); ctx.lineTo(px, y + hh);
    }
    for (let i = 1; i < yt; i++) {
      const py = y + (i / yt) * hh;
      ctx.moveTo(x, py); ctx.lineTo(x + ww, py);
    }
    ctx.stroke();
    ctx.strokeStyle = C.axis;
    ctx.strokeRect(x + 0.5, y + 0.5, ww, hh);
  }

  function vline(x: number, y0: number, y1: number, color: string, label?: string, opts: { dashed?: boolean; thick?: boolean } = {}) {
    ctx.strokeStyle = color;
    ctx.lineWidth = opts.thick ? 2 : 1.3;
    ctx.setLineDash(opts.dashed ? [4, 4] : []);
    ctx.beginPath();
    ctx.moveTo(x, y0);
    ctx.lineTo(x, y1);
    ctx.stroke();
    ctx.setLineDash([]);
    if (label) {
      ctx.fillStyle = color;
      ctx.font = "600 11px -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(label, x, y0 - 4);
    }
  }

  function draw() {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);

    // ── Posterior panel
    drawGrid(px0, yPost0, px1 - px0, yPost1 - yPost0, 10, 4);
    const pMax = Math.max(...pdf) * 1.05;
    // Fill under curve
    ctx.fillStyle = C.posteriorFill;
    ctx.beginPath();
    ctx.moveTo(mapX(xs[0]), yPost1);
    xs.forEach((x, i) => ctx.lineTo(mapX(x), mapYPost(pdf[i], pMax)));
    ctx.lineTo(mapX(xs[xs.length - 1]), yPost1);
    ctx.closePath();
    ctx.fill();
    // Stroke
    ctx.strokeStyle = C.posterior; ctx.lineWidth = 1.6;
    ctx.beginPath();
    xs.forEach((x, i) => i ? ctx.lineTo(mapX(x), mapYPost(pdf[i], pMax)) : ctx.moveTo(mapX(x), mapYPost(pdf[i], pMax)));
    ctx.stroke();

    // Summary lines
    vline(mapX(mean), yPost0, yPost1, C.mean, `mean ${mean.toFixed(2)}`);
    vline(mapX(median), yPost0 + 18, yPost1, C.median, `median ${median.toFixed(2)}`);
    vline(mapX(mode), yPost0 + 36, yPost1, C.mode, `mode ${mode.toFixed(2)}`);

    // Estimator
    vline(mapX(xhat), yPost0, yPost1, C.user, undefined, { thick: true, dashed: true });
    // Estimator dot at top of panel
    ctx.fillStyle = C.user;
    ctx.beginPath(); ctx.arc(mapX(xhat), yPost0 + 6, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.user; ctx.font = "600 11px -apple-system, sans-serif"; ctx.textAlign = "center";
    ctx.fillText(`x̂ = ${xhat.toFixed(2)}`, mapX(xhat), yPost0 + 22);

    // Axis labels
    ctx.fillStyle = C.textDim; ctx.font = "11px -apple-system, sans-serif"; ctx.textAlign = "left";
    ctx.fillText("posterior p(θ | y)", px0 + 6, yPost0 + 14);
    ctx.textAlign = "right";
    ctx.fillText("θ", px1 - 4, yPost1 + 16);

    // ── Risk panel
    drawGrid(px0, yRisk0, px1 - px0, yRisk1 - yRisk0, 10, 4);
    // Filled risk curve
    ctx.fillStyle = C.riskFill;
    ctx.beginPath();
    ctx.moveTo(mapX(xs[0]), yRisk1);
    xs.forEach((x, i) => ctx.lineTo(mapX(x), mapYRisk(riskCurve[i])));
    ctx.lineTo(mapX(xs[xs.length - 1]), yRisk1);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = C.risk; ctx.lineWidth = 1.8;
    ctx.beginPath();
    xs.forEach((x, i) => i ? ctx.lineTo(mapX(x), mapYRisk(riskCurve[i])) : ctx.moveTo(mapX(x), mapYRisk(riskCurve[i])));
    ctx.stroke();

    // Risk-min marker
    const minIdx = riskCurve.indexOf(riskMin);
    if (minIdx >= 0) {
      ctx.fillStyle = "#fbbf24"; ctx.strokeStyle = "#92400e"; ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(mapX(xs[minIdx]), mapYRisk(riskMin), 6, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#92400e"; ctx.font = "600 11px -apple-system, sans-serif"; ctx.textAlign = "center";
      ctx.fillText(`min at ${xs[minIdx].toFixed(2)}`, mapX(xs[minIdx]), mapYRisk(riskMin) - 10);
    }
    // Estimator
    vline(mapX(xhat), yRisk0, yRisk1, C.user, undefined, { thick: true, dashed: true });
    // Risk value at estimator
    const xhatIdx = Math.max(0, Math.min(xs.length - 1, Math.round((xhat - xMin) / (xMax - xMin) * (xs.length - 1))));
    const rAt = riskCurve[xhatIdx];
    ctx.fillStyle = C.user;
    ctx.beginPath(); ctx.arc(mapX(xhat), mapYRisk(rAt), 5, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = C.textDim; ctx.font = "11px -apple-system, sans-serif"; ctx.textAlign = "left";
    const lossLabel = loss === "squared" ? "R(x̂) = E[(θ − x̂)²]"
                    : loss === "absolute" ? "R(x̂) = E[|θ − x̂|]"
                    : "R(x̂) = E[1{|θ − x̂| > ε/2}]  (ε = 0.4)";
    ctx.fillText(`Bayes risk · ${lossLabel}`, px0 + 6, yRisk0 + 14);
    ctx.textAlign = "right";
    ctx.fillText("x̂", px1 - 4, yRisk1 + 16);

    // Readout
    const optX = xs[minIdx];
    const optName = loss === "squared" ? "mean" : loss === "absolute" ? "median" : "mode";
    readout.innerHTML = `
      <div class="row"><span class="lbl">posterior mean</span><span>${mean.toFixed(3)}</span></div>
      <div class="row"><span class="lbl">posterior median</span><span>${median.toFixed(3)}</span></div>
      <div class="row"><span class="lbl">posterior mode</span><span>${mode.toFixed(3)}</span></div>
      <div class="row"><span class="lbl">posterior var</span><span>${posteriorVar.toFixed(3)}</span></div>
      <div class="row"><span class="lbl">argmin R(x̂)</span><span>${optX.toFixed(3)} · ${optName}</span></div>
      <div class="row"><span class="lbl">R(x̂) at your estimator</span><span>${rAt.toFixed(3)}</span></div>
    `;
  }

  function setLoss(l: Loss) {
    loss = l;
    lossTabs.forEach((b) => b.classList.toggle("active", b.dataset.loss === l));
    recomputeRisk();
    draw();
  }
  function setShape(s: Shape) {
    shape = s;
    shapeTabs.forEach((b) => b.classList.toggle("active", b.dataset.shape === s));
    recomputeShape();
    // Reset estimator to median for the new posterior.
    xhat = median;
    xIn.value = xhat.toFixed(2);
    xV.textContent = xhat.toFixed(2);
    draw();
  }

  lossTabs.forEach((b) => b.addEventListener("click", () => setLoss(b.dataset.loss as Loss)));
  shapeTabs.forEach((b) => b.addEventListener("click", () => setShape(b.dataset.shape as Shape)));
  xIn.addEventListener("input", () => {
    xhat = +xIn.value;
    xV.textContent = xhat.toFixed(2);
    draw();
  });
  document.getElementById("fig-summaries-snap-mean")?.addEventListener("click", () => {
    xhat = mean; xIn.value = mean.toFixed(2); xV.textContent = mean.toFixed(2); draw();
  });
  document.getElementById("fig-summaries-snap-median")?.addEventListener("click", () => {
    xhat = median; xIn.value = median.toFixed(2); xV.textContent = median.toFixed(2); draw();
  });
  document.getElementById("fig-summaries-snap-mode")?.addEventListener("click", () => {
    xhat = mode; xIn.value = mode.toFixed(2); xV.textContent = mode.toFixed(2); draw();
  });

  // Click on canvas to set estimator (within posterior or risk panel)
  canvas.addEventListener("click", (e) => {
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left;
    if (x < px0 || x > px1) return;
    xhat = xMin + (x - px0) / (px1 - px0) * (xMax - xMin);
    xhat = Math.max(xMin, Math.min(xMax, xhat));
    xIn.value = xhat.toFixed(2);
    xV.textContent = xhat.toFixed(2);
    draw();
  });

  // Initial render
  recomputeShape();
  xhat = mean;  // start at mean of skewed posterior
  xIn.value = xhat.toFixed(2);
  xV.textContent = xhat.toFixed(2);
  draw();
})();
