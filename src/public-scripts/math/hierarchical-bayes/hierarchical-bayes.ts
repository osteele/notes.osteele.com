// Interactive figure: hierarchical Bayes & partial pooling on a J-group toy.
// Each row of the figure is one group; ✕ = no-pool, ○ = partial-pool, ▲ = true θ.

const C = {
  bg: "#ffffff",
  axis: "#5a6577",
  text: "#1f2733",
  textDim: "#5a6577",
  grid: "#e3ddd0",
  raw: "rgba(154,163,178,0.65)",
  truth: "#fbbf24",
  truthEdge: "#92400e",
  noPool: "#1f4a8c",
  partPool: "#2d7a3e",
  grand: "#111827",
  shrinkLine: "rgba(45,122,62,0.55)",
};

function gaussianSample(mu: number, sigma: number) {
  // Box–Muller.
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return mu + sigma * z;
}

(function () {
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

  const JIn = document.getElementById("hb-J") as HTMLInputElement;
  const JV = document.getElementById("hb-J-v") as HTMLElement;
  const nIn = document.getElementById("hb-n") as HTMLInputElement;
  const nV = document.getElementById("hb-n-v") as HTMLElement;
  const sigmaIn = document.getElementById("hb-sigma") as HTMLInputElement;
  const sigmaV = document.getElementById("hb-sigma-v") as HTMLElement;
  const tauTrueIn = document.getElementById("hb-tau-true") as HTMLInputElement;
  const tauTrueV = document.getElementById("hb-tau-true-v") as HTMLElement;
  const tauIn = document.getElementById("hb-tau") as HTMLInputElement;
  const tauV = document.getElementById("hb-tau-v") as HTMLElement;
  const readout = document.getElementById("shrink-readout") as HTMLElement;

  type GroupData = { theta: number; ys: number[]; ybar: number };
  let data: GroupData[] = [];

  function generate() {
    const J = +JIn.value;
    const n = +nIn.value;
    const sigma = +sigmaIn.value;
    const tauTrue = +tauTrueIn.value;
    data = [];
    for (let j = 0; j < J; j++) {
      const theta = gaussianSample(0, tauTrue);
      const ys: number[] = [];
      for (let i = 0; i < n; i++) ys.push(gaussianSample(theta, sigma));
      const ybar = ys.reduce((s, v) => s + v, 0) / ys.length;
      data.push({ theta, ys, ybar });
    }
    draw();
  }

  function fitTau() {
    const n = +nIn.value;
    const sigma = +sigmaIn.value;
    const sigma2OverN = sigma * sigma / n;
    const ybars = data.map((g) => g.ybar);
    const m = ybars.reduce((s, v) => s + v, 0) / ybars.length;
    const S2 = ybars.length > 1
      ? ybars.reduce((s, v) => s + (v - m) ** 2, 0) / (ybars.length - 1)
      : 0;
    const tau2 = Math.max(0, S2 - sigma2OverN);
    const tau = Math.sqrt(tau2);
    tauIn.value = tau.toFixed(2);
    tauV.textContent = tau.toFixed(2);
    draw();
  }

  // Layout
  const pad = { l: 56, r: 16, t: 26, b: 56 };
  const labelW = 42; // left side for group labels
  function rowsLayout() {
    const rowsY0 = pad.t + 8;
    const rowsY1 = h - pad.b;
    const rowH = (rowsY1 - rowsY0) / Math.max(1, data.length);
    return { rowsY0, rowsY1, rowH };
  }
  function xRange() {
    // Auto-scale to data with margin.
    const all: number[] = [];
    data.forEach((g) => { all.push(g.theta, g.ybar); for (const y of g.ys) all.push(y); });
    if (all.length === 0) return [-4, 4];
    const lo = Math.min(...all), hi = Math.max(...all);
    const margin = Math.max(0.5, (hi - lo) * 0.1);
    return [lo - margin, hi + margin];
  }

  function draw() {
    JV.textContent = (+JIn.value).toFixed(0);
    nV.textContent = (+nIn.value).toFixed(0);
    sigmaV.textContent = (+sigmaIn.value).toFixed(2);
    tauTrueV.textContent = (+tauTrueIn.value).toFixed(2);
    tauV.textContent = (+tauIn.value).toFixed(2);

    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
    if (data.length === 0) return;

    const J = data.length;
    const sigma = +sigmaIn.value;
    const n = +nIn.value;
    const tau = +tauIn.value;
    const tau2 = tau * tau;
    const sigma2OverN = sigma * sigma / n;

    // Grand mean (mean of group means).
    const ybars = data.map((g) => g.ybar);
    const grandMean = ybars.reduce((s, v) => s + v, 0) / ybars.length;

    // Partial-pool estimates: θ̂_j = (τ² ȳ_j + (σ²/n) μ̂) / (τ² + σ²/n)
    const denom = tau2 + sigma2OverN;
    const thetas = data.map((g) => {
      if (denom === 0) return grandMean; // τ = 0 and n → ∞: full pool
      return (tau2 * g.ybar + sigma2OverN * grandMean) / denom;
    });

    const [xLo, xHi] = xRange();
    const mapX = (x: number) => pad.l + labelW + (x - xLo) / (xHi - xLo) * (w - pad.l - pad.r - labelW);
    const { rowsY0, rowsY1, rowH } = rowsLayout();

    // X-axis at top
    ctx.strokeStyle = C.axis; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.l + labelW, pad.t);
    ctx.lineTo(w - pad.r, pad.t);
    ctx.stroke();
    // X ticks
    ctx.fillStyle = C.textDim; ctx.font = "11px -apple-system, sans-serif"; ctx.textAlign = "center";
    const xTicks = 7;
    for (let i = 0; i <= xTicks; i++) {
      const xv = xLo + (i / xTicks) * (xHi - xLo);
      const X = mapX(xv);
      ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(X, pad.t); ctx.lineTo(X, rowsY1); ctx.stroke();
      ctx.strokeStyle = C.axis;
      ctx.beginPath(); ctx.moveTo(X, pad.t - 3); ctx.lineTo(X, pad.t + 3); ctx.stroke();
      ctx.fillText(xv.toFixed(1), X, pad.t - 8);
    }
    ctx.fillStyle = C.textDim; ctx.textAlign = "left";
    ctx.fillText("θ", w - pad.r - 6, pad.t - 8);

    // Grand-mean dashed vertical line
    ctx.strokeStyle = C.grand; ctx.lineWidth = 1.4; ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(mapX(grandMean), pad.t);
    ctx.lineTo(mapX(grandMean), rowsY1);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = C.grand; ctx.font = "600 11px -apple-system, sans-serif"; ctx.textAlign = "center";
    ctx.fillText(`grand mean ${grandMean.toFixed(2)}`, mapX(grandMean), rowsY1 + 14);

    // Group rows
    ctx.textBaseline = "middle";
    for (let j = 0; j < J; j++) {
      const g = data[j];
      const yRow = rowsY0 + (j + 0.5) * rowH;
      // Row baseline
      ctx.strokeStyle = "rgba(0,0,0,0.04)"; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad.l + labelW, yRow);
      ctx.lineTo(w - pad.r, yRow);
      ctx.stroke();
      // Label
      ctx.fillStyle = C.textDim; ctx.font = "11px -apple-system, sans-serif"; ctx.textAlign = "right";
      ctx.fillText(`j=${j + 1}`, pad.l + labelW - 8, yRow);
      // Raw dots
      ctx.fillStyle = C.raw;
      const dotR = Math.max(1.5, Math.min(3, rowH * 0.15));
      for (const y of g.ys) {
        ctx.beginPath();
        ctx.arc(mapX(y), yRow, dotR, 0, Math.PI * 2);
        ctx.fill();
      }
      // Shrinkage line from ✕ to ○
      ctx.strokeStyle = C.shrinkLine; ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(mapX(g.ybar), yRow);
      ctx.lineTo(mapX(thetas[j]), yRow);
      ctx.stroke();
      // No-pool ✕
      const X1 = mapX(g.ybar);
      ctx.strokeStyle = C.noPool; ctx.lineWidth = 2;
      const cr = Math.max(4, Math.min(7, rowH * 0.32));
      ctx.beginPath();
      ctx.moveTo(X1 - cr, yRow - cr); ctx.lineTo(X1 + cr, yRow + cr);
      ctx.moveTo(X1 + cr, yRow - cr); ctx.lineTo(X1 - cr, yRow + cr);
      ctx.stroke();
      // Partial-pool ○
      const X2 = mapX(thetas[j]);
      ctx.fillStyle = "#fff"; ctx.strokeStyle = C.partPool; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(X2, yRow, cr, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      // True ▲
      const X3 = mapX(g.theta);
      const tr = Math.max(4.5, Math.min(7, rowH * 0.35));
      ctx.fillStyle = C.truth; ctx.strokeStyle = C.truthEdge; ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(X3, yRow - tr);
      ctx.lineTo(X3 + tr, yRow + tr * 0.85);
      ctx.lineTo(X3 - tr, yRow + tr * 0.85);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
    }
    ctx.textBaseline = "alphabetic";

    // Bottom band: MSE comparison and τ̂ from EB.
    const sigma2OverN_now = sigma * sigma / n;
    const S2 = ybars.length > 1
      ? ybars.reduce((s, v) => s + (v - grandMean) ** 2, 0) / (ybars.length - 1)
      : 0;
    const tauEB = Math.sqrt(Math.max(0, S2 - sigma2OverN_now));

    const mseNP = data.reduce((s, g) => s + (g.ybar - g.theta) ** 2, 0) / J;
    const msePP = data.reduce((s, g, i) => s + (thetas[i] - g.theta) ** 2, 0) / J;
    const mseCP = data.reduce((s, g) => s + (grandMean - g.theta) ** 2, 0) / J;
    const Bj = denom === 0 ? 1 : sigma2OverN / denom;

    readout.innerHTML = `
      <div class="row"><span class="lbl">shrinkage factor $B$</span><span>${Bj.toFixed(3)} &nbsp; (1 = full pool, 0 = none)</span></div>
      <div class="row"><span class="lbl">$\\hat\\tau$ via empirical Bayes</span><span>${tauEB.toFixed(3)}</span></div>
      <div class="row"><span class="lbl">MSE · no-pool</span><span>${mseNP.toFixed(3)}</span></div>
      <div class="row"><span class="lbl">MSE · partial-pool</span><span>${msePP.toFixed(3)}</span></div>
      <div class="row"><span class="lbl">MSE · complete-pool</span><span>${mseCP.toFixed(3)}</span></div>
      <div class="row"><span class="lbl">best</span><span>${(["no-pool", "partial-pool", "complete-pool"] as const)[[mseNP, msePP, mseCP].indexOf(Math.min(mseNP, msePP, mseCP))]}</span></div>
    `;
    // Re-render KaTeX in readout (only if available).
    const w2: any = window;
    if (typeof w2.renderMathInElement === "function") {
      w2.renderMathInElement(readout, { throwOnError: false, delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false },
      ] });
    }
  }

  // Wire controls
  function onInputDraw(el: HTMLInputElement, v: HTMLElement, decimals = 2, regen = false) {
    el.addEventListener("input", () => {
      v.textContent = (+el.value).toFixed(decimals);
      if (regen) generate(); else draw();
    });
  }
  onInputDraw(JIn, JV, 0, true);
  onInputDraw(nIn, nV, 0, true);
  onInputDraw(sigmaIn, sigmaV, 2, true);
  onInputDraw(tauTrueIn, tauTrueV, 2, true);
  onInputDraw(tauIn, tauV, 2, false);

  document.getElementById("hb-fit")?.addEventListener("click", fitTau);
  document.getElementById("hb-resample")?.addEventListener("click", generate);
  document.getElementById("hb-pull-zero")?.addEventListener("click", () => {
    tauIn.value = "0"; tauV.textContent = "0.00"; draw();
  });
  document.getElementById("hb-pull-large")?.addEventListener("click", () => {
    tauIn.value = "5"; tauV.textContent = "5.00"; draw();
  });

  generate();
})();
