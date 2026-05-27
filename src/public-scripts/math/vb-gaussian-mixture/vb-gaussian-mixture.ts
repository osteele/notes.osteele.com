// Variational Bayes for a 2-D Gaussian mixture: CAVI updates with Normal–Wishart
// component priors and a Dirichlet prior on mixing weights. Demonstrates automatic
// component pruning when α₀ < 1.

const D = 2;

const PALETTE = [
  "#1f4a8c", "#b8412a", "#2d7a3e", "#6b4592",
  "#d4690a", "#0d9488", "#9333ea", "#dc2626",
  "#0284c7", "#65a30d",
];

const C = {
  bg: "#ffffff",
  axis: "#5a6577",
  text: "#1f2733",
  textDim: "#5a6577",
  grid: "#e3ddd0",
  truth: "#fbbf24",
  truthEdge: "#92400e",
  elbo: "#6b4592",
  elboFill: "rgba(107,69,146,0.18)",
};

// ── Math helpers ────────────────────────────────────────────────────────────

function gaussianSample(mu = 0, sigma = 1) {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return mu + sigma * z;
}

// Digamma ψ(x) for x > 0 via recursion + asymptotic series.
function digamma(x: number): number {
  let result = 0;
  while (x < 6) {
    result -= 1 / x;
    x += 1;
  }
  const x2 = 1 / (x * x);
  result += Math.log(x) - 1 / (2 * x)
          - x2 * (1 / 12 - x2 * (1 / 120 - x2 / 252));
  return result;
}

// 2x2 symmetric matrix as [a, b, c] meaning [[a, b], [b, c]].
type SymMat2 = [number, number, number];
function symInv(M: SymMat2): SymMat2 {
  const [a, b, c] = M;
  const det = a * c - b * b;
  if (Math.abs(det) < 1e-12) return [1e12, 0, 1e12];
  return [c / det, -b / det, a / det];
}
function symLogDet(M: SymMat2): number {
  const det = M[0] * M[2] - M[1] * M[1];
  return Math.log(Math.max(det, 1e-300));
}
function quadForm(M: SymMat2, vx: number, vy: number): number {
  return vx * vx * M[0] + 2 * vx * vy * M[1] + vy * vy * M[2];
}

// Eigendecomposition of a 2x2 symmetric matrix: returns (λ1, λ2, angle of first eigenvector).
function symEig(M: SymMat2): { l1: number; l2: number; angle: number } {
  const [a, b, c] = M;
  const tr = a + c, det = a * c - b * b;
  const disc = Math.max(0, tr * tr / 4 - det);
  const s = Math.sqrt(disc);
  const l1 = tr / 2 + s;
  const l2 = tr / 2 - s;
  // Eigenvector of l1
  let angle: number;
  if (Math.abs(b) > 1e-9) {
    angle = Math.atan2(l1 - a, b);
  } else {
    angle = a >= c ? 0 : Math.PI / 2;
  }
  return { l1, l2, angle };
}

// ── Data generation ─────────────────────────────────────────────────────────

type Point = { x: number; y: number; k: number };
function generateData(trueK: number, perCluster: number): { points: Point[]; centers: { x: number; y: number }[] } {
  const centers: { x: number; y: number }[] = [];
  const R = 3;
  for (let k = 0; k < trueK; k++) {
    const ang = 2 * Math.PI * k / trueK + 0.2 * gaussianSample();
    centers.push({ x: R * Math.cos(ang), y: R * Math.sin(ang) });
  }
  const points: Point[] = [];
  for (let k = 0; k < trueK; k++) {
    const sx = 0.5 + 0.3 * Math.abs(gaussianSample()), sy = 0.5 + 0.3 * Math.abs(gaussianSample());
    for (let i = 0; i < perCluster; i++) {
      points.push({ x: centers[k].x + gaussianSample(0, sx), y: centers[k].y + gaussianSample(0, sy), k });
    }
  }
  return { points, centers };
}

// ── VB-GMM state ────────────────────────────────────────────────────────────

type VBState = {
  K: number;
  alpha0: number;
  alpha: number[];                  // Dirichlet pseudo-counts
  beta0: number;
  beta: number[];                   // Normal–Wishart β
  m: number[][];                    // means, K × 2
  m0: [number, number];
  nu0: number;
  nu: number[];                     // Wishart ν
  W0inv: SymMat2;
  W: SymMat2[];                     // Wishart W (each K)
  Winv: SymMat2[];                  // cached W⁻¹
  R: number[][];                    // responsibilities N × K
  N: number;
};

function initVB(points: Point[], K: number, alpha0: number): VBState {
  const N = points.length;
  // Data mean and cov for the prior.
  let mx = 0, my = 0;
  for (const p of points) { mx += p.x; my += p.y; }
  mx /= N; my /= N;
  let sxx = 0, sxy = 0, syy = 0;
  for (const p of points) {
    sxx += (p.x - mx) ** 2;
    sxy += (p.x - mx) * (p.y - my);
    syy += (p.y - my) ** 2;
  }
  sxx /= N; sxy /= N; syy /= N;
  const S0: SymMat2 = [sxx + 1e-2, sxy, syy + 1e-2];

  // Prior hyperparameters.
  const m0: [number, number] = [mx, my];
  const beta0 = 0.05;
  const nu0 = D + 1;
  const W0inv: SymMat2 = [S0[0] * nu0, S0[1] * nu0, S0[2] * nu0];

  // Initialize component means by random points from the dataset (with jitter).
  const m: number[][] = [];
  const usedIdx = new Set<number>();
  for (let k = 0; k < K; k++) {
    let i;
    do { i = Math.floor(Math.random() * N); } while (usedIdx.has(i) && usedIdx.size < N);
    usedIdx.add(i);
    m.push([points[i].x + gaussianSample(0, 0.2), points[i].y + gaussianSample(0, 0.2)]);
  }

  // Initialize W = (W0inv / nu0)^{-1}  (so that E[Λ] = ν W has Wishart mean = prior precision)
  const W0: SymMat2 = symInv([W0inv[0] / nu0, W0inv[1] / nu0, W0inv[2] / nu0]);
  const W: SymMat2[] = Array.from({ length: K }, () => [W0[0], W0[1], W0[2]] as SymMat2);
  const Winv: SymMat2[] = W.map((Wk) => symInv(Wk));

  return {
    K,
    alpha0,
    alpha: new Array(K).fill(alpha0 + N / K),
    beta0,
    beta: new Array(K).fill(beta0),
    m,
    m0,
    nu0,
    nu: new Array(K).fill(nu0),
    W0inv,
    W,
    Winv,
    R: Array.from({ length: N }, () => new Array(K).fill(1 / K)),
    N,
  };
}

// E-step: update responsibilities.
function eStep(state: VBState, points: Point[]) {
  const { K, alpha, m, beta, nu, W, R } = state;
  const sumAlpha = alpha.reduce((s, v) => s + v, 0);
  const psiSum = digamma(sumAlpha);
  const lnPi = alpha.map((a) => digamma(a) - psiSum);
  const lnDetLambda = new Array<number>(K);
  for (let k = 0; k < K; k++) {
    let s = 0;
    for (let d = 1; d <= D; d++) s += digamma((nu[k] + 1 - d) / 2);
    lnDetLambda[k] = s + D * Math.log(2) + symLogDet(W[k]);
  }
  const N = points.length;
  for (let n = 0; n < N; n++) {
    const p = points[n];
    const lnRho = new Array<number>(K);
    let maxLn = -Infinity;
    for (let k = 0; k < K; k++) {
      const dx = p.x - m[k][0], dy = p.y - m[k][1];
      const quad = quadForm(W[k], dx, dy);
      const E_quad = D / beta[k] + nu[k] * quad;
      lnRho[k] = lnPi[k] + 0.5 * lnDetLambda[k] - 0.5 * D * Math.log(2 * Math.PI) - 0.5 * E_quad;
      if (lnRho[k] > maxLn) maxLn = lnRho[k];
    }
    let z = 0;
    for (let k = 0; k < K; k++) { lnRho[k] = Math.exp(lnRho[k] - maxLn); z += lnRho[k]; }
    for (let k = 0; k < K; k++) R[n][k] = lnRho[k] / Math.max(z, 1e-300);
  }
}

// M-step: update variational hyperparameters.
function mStep(state: VBState, points: Point[]) {
  const { K, alpha0, beta0, m0, nu0, W0inv, R, alpha, beta, m, nu, W } = state;
  const N = points.length;
  for (let k = 0; k < K; k++) {
    let Nk = 0, xbarX = 0, xbarY = 0;
    for (let n = 0; n < N; n++) Nk += R[n][k];
    if (Nk < 1e-10) Nk = 0;
    if (Nk > 0) {
      for (let n = 0; n < N; n++) {
        xbarX += R[n][k] * points[n].x;
        xbarY += R[n][k] * points[n].y;
      }
      xbarX /= Nk; xbarY /= Nk;
    }
    // S_k = (1/Nk) Σ_n R_nk (x - xbar)(x - xbar)^T
    let Sxx = 0, Sxy = 0, Syy = 0;
    if (Nk > 0) {
      for (let n = 0; n < N; n++) {
        const dx = points[n].x - xbarX, dy = points[n].y - xbarY;
        Sxx += R[n][k] * dx * dx;
        Sxy += R[n][k] * dx * dy;
        Syy += R[n][k] * dy * dy;
      }
      Sxx /= Nk; Sxy /= Nk; Syy /= Nk;
    }
    alpha[k] = alpha0 + Nk;
    beta[k] = beta0 + Nk;
    nu[k] = nu0 + Nk;
    // m_k = (β0 m0 + Nk xbar) / β_k
    m[k][0] = (beta0 * m0[0] + Nk * xbarX) / beta[k];
    m[k][1] = (beta0 * m0[1] + Nk * xbarY) / beta[k];
    // W_k⁻¹ = W0⁻¹ + Nk S_k + (β0 Nk / β_k) (xbar - m0)(xbar - m0)^T
    const corrFactor = (Nk > 0) ? (beta0 * Nk) / beta[k] : 0;
    const cx = xbarX - m0[0], cy = xbarY - m0[1];
    const WinvNew: SymMat2 = [
      W0inv[0] + Nk * Sxx + corrFactor * cx * cx,
      W0inv[1] + Nk * Sxy + corrFactor * cx * cy,
      W0inv[2] + Nk * Syy + corrFactor * cy * cy,
    ];
    W[k] = symInv(WinvNew);
    state.Winv[k] = WinvNew;
  }
}

// A monotonic objective used for the convergence trace. Strictly: this is
// the expected complete-data log-likelihood minus entropy of q(Z), which is
// the dominant moving term of the ELBO under CAVI. (Other ELBO terms move
// slowly once the variational parameters stabilize.)
function objective(state: VBState, points: Point[]): number {
  const { K, alpha, m, beta, nu, W, R } = state;
  const sumAlpha = alpha.reduce((s, v) => s + v, 0);
  const psiSum = digamma(sumAlpha);
  const lnPi = alpha.map((a) => digamma(a) - psiSum);
  const lnDetLambda = new Array<number>(K);
  for (let k = 0; k < K; k++) {
    let s = 0;
    for (let d = 1; d <= D; d++) s += digamma((nu[k] + 1 - d) / 2);
    lnDetLambda[k] = s + D * Math.log(2) + symLogDet(W[k]);
  }
  const N = points.length;
  let L = 0;
  for (let n = 0; n < N; n++) {
    for (let k = 0; k < K; k++) {
      const r = R[n][k];
      if (r < 1e-12) continue;
      const dx = points[n].x - m[k][0], dy = points[n].y - m[k][1];
      const E_quad = D / beta[k] + nu[k] * quadForm(W[k], dx, dy);
      const lnRho = lnPi[k] + 0.5 * lnDetLambda[k] - 0.5 * D * Math.log(2 * Math.PI) - 0.5 * E_quad;
      L += r * (lnRho - Math.log(r));
    }
  }
  return L;
}

// ── Figure ──────────────────────────────────────────────────────────────────

(function () {
  const canvas = document.getElementById("fig-vbgmm") as HTMLCanvasElement | null;
  if (!canvas) return;
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const rect = canvas.getBoundingClientRect();
  const w = rect.width || +canvas.getAttribute("width")! || 780;
  const h = rect.height || +canvas.getAttribute("height")! || 540;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  canvas.style.width = w + "px";
  canvas.style.height = h + "px";
  const ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);

  const trueKIn = document.getElementById("vb-true-k") as HTMLInputElement;
  const trueKV = document.getElementById("vb-true-k-v") as HTMLElement;
  const nIn = document.getElementById("vb-n") as HTMLInputElement;
  const nV = document.getElementById("vb-n-v") as HTMLElement;
  const KIn = document.getElementById("vb-K") as HTMLInputElement;
  const KV = document.getElementById("vb-K-v") as HTMLElement;
  const alphaIn = document.getElementById("vb-alpha") as HTMLInputElement;
  const alphaV = document.getElementById("vb-alpha-v") as HTMLElement;
  const speedIn = document.getElementById("vb-speed") as HTMLInputElement;
  const speedV = document.getElementById("vb-speed-v") as HTMLElement;
  const runBtn = document.getElementById("vb-runpause") as HTMLButtonElement;
  const stepBtn = document.getElementById("vb-step") as HTMLButtonElement;
  const reinitBtn = document.getElementById("vb-reinit") as HTMLButtonElement;
  const resampleBtn = document.getElementById("vb-resample") as HTMLButtonElement;
  const readout = document.getElementById("vbgmm-readout") as HTMLElement;

  let dataset: { points: Point[]; centers: { x: number; y: number }[] } = generateData(+trueKIn.value, +nIn.value);
  let state: VBState = initVB(dataset.points, +KIn.value, Math.pow(10, +alphaIn.value));
  let elboHistory: number[] = [];
  let iteration = 0;
  let running = false;
  let lastTick = 0;

  function resample() {
    dataset = generateData(+trueKIn.value, +nIn.value);
    reinit();
  }
  function reinit() {
    state = initVB(dataset.points, +KIn.value, Math.pow(10, +alphaIn.value));
    elboHistory = [];
    iteration = 0;
    draw();
  }
  function oneIteration() {
    eStep(state, dataset.points);
    mStep(state, dataset.points);
    iteration++;
    elboHistory.push(objective(state, dataset.points));
    if (elboHistory.length > 200) elboHistory.shift();
  }
  function step() {
    oneIteration();
    draw();
  }

  // Layout
  const pad = { l: 12, r: 12, t: 14, b: 14 };
  const scatterRight = 0.66;
  const scatterW = (w - pad.l - pad.r) * scatterRight - 8;
  const scatterH = h * 0.66;
  const piX = pad.l + scatterW + 12;
  const piW = w - pad.r - piX;
  const piH = scatterH;
  const elboX = pad.l;
  const elboY = pad.t + scatterH + 16;
  const elboW = w - pad.l - pad.r;
  const elboH = h - elboY - pad.b - 14;

  function dataExtent(): { xMin: number; xMax: number; yMin: number; yMax: number } {
    let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
    for (const p of dataset.points) {
      if (p.x < xMin) xMin = p.x;
      if (p.x > xMax) xMax = p.x;
      if (p.y < yMin) yMin = p.y;
      if (p.y > yMax) yMax = p.y;
    }
    const padX = (xMax - xMin) * 0.1 + 0.5;
    const padY = (yMax - yMin) * 0.1 + 0.5;
    return { xMin: xMin - padX, xMax: xMax + padX, yMin: yMin - padY, yMax: yMax + padY };
  }

  function draw() {
    trueKV.textContent = (+trueKIn.value).toFixed(0);
    nV.textContent = (+nIn.value).toFixed(0);
    KV.textContent = (+KIn.value).toFixed(0);
    alphaV.textContent = (+alphaIn.value).toFixed(1);
    speedV.textContent = (+speedIn.value).toFixed(0);

    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);

    // ── Scatter panel
    const { xMin, xMax, yMin, yMax } = dataExtent();
    // Preserve aspect ratio.
    const dx = xMax - xMin, dy = yMax - yMin;
    const aspectData = dy / dx;
    const aspectPanel = scatterH / scatterW;
    let scale: number, offsetX = 0, offsetY = 0;
    if (aspectData > aspectPanel) {
      scale = scatterH / dy;
      offsetX = (scatterW - dx * scale) / 2;
    } else {
      scale = scatterW / dx;
      offsetY = (scatterH - dy * scale) / 2;
    }
    const mapX = (x: number) => pad.l + offsetX + (x - xMin) * scale;
    const mapY = (y: number) => pad.t + offsetY + scatterH - (y - yMin) * scale;
    // Panel border
    ctx.strokeStyle = C.axis; ctx.lineWidth = 1;
    ctx.strokeRect(pad.l + 0.5, pad.t + 0.5, scatterW, scatterH);

    // E[π_k] for ordering and opacity.
    const sumAlpha = state.alpha.reduce((s, v) => s + v, 0);
    const Epi = state.alpha.map((a) => a / sumAlpha);

    // Argmax responsibility per point.
    const argmax = dataset.points.map((_, n) => {
      let best = 0, bestR = state.R[n][0];
      for (let k = 1; k < state.K; k++) {
        if (state.R[n][k] > bestR) { best = k; bestR = state.R[n][k]; }
      }
      return { k: best, conf: bestR };
    });

    // Scatter points.
    for (let n = 0; n < dataset.points.length; n++) {
      const p = dataset.points[n];
      const { k, conf } = argmax[n];
      const col = PALETTE[k % PALETTE.length];
      ctx.fillStyle = col;
      ctx.globalAlpha = 0.35 + 0.55 * conf;
      ctx.beginPath();
      ctx.arc(mapX(p.x), mapY(p.y), 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // True cluster centers.
    for (const c of dataset.centers) {
      ctx.fillStyle = C.truth; ctx.strokeStyle = C.truthEdge; ctx.lineWidth = 1.4;
      const X = mapX(c.x), Y = mapY(c.y);
      const r = 6;
      ctx.beginPath();
      ctx.moveTo(X, Y - r);
      ctx.lineTo(X + r, Y + r * 0.85);
      ctx.lineTo(X - r, Y + r * 0.85);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
    }

    // Component ellipses: covariance = E[Σ_k] = (ν_k W_k)^{-1} for the Gaussian
    // observation model component. Scale gives 1-σ contour.
    for (let k = 0; k < state.K; k++) {
      const pi_k = Epi[k];
      if (pi_k < 1e-3) continue;
      const cov = symInv([state.W[k][0] * state.nu[k], state.W[k][1] * state.nu[k], state.W[k][2] * state.nu[k]]);
      const { l1, l2, angle } = symEig(cov);
      const a = Math.sqrt(Math.max(l1, 1e-6));
      const b = Math.sqrt(Math.max(l2, 1e-6));
      const cx = mapX(state.m[k][0]), cy = mapY(state.m[k][1]);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-angle); // canvas y is flipped
      const col = PALETTE[k % PALETTE.length];
      const alpha = Math.min(1, 0.4 + 1.2 * pi_k);
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.8 + 1.5 * pi_k;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.ellipse(0, 0, a * scale, b * scale, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      // Mean dot.
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    // Header text.
    ctx.fillStyle = C.textDim; ctx.font = "11px -apple-system, sans-serif"; ctx.textAlign = "left";
    ctx.fillText(`iteration ${iteration}`, pad.l + 6, pad.t + 14);

    // ── π_k bar chart panel
    ctx.strokeStyle = C.axis; ctx.lineWidth = 1;
    ctx.strokeRect(piX + 0.5, pad.t + 0.5, piW, piH);
    const order = Epi.map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v);
    const barH = (piH - 24) / Math.max(1, state.K);
    ctx.fillStyle = C.textDim; ctx.textAlign = "left";
    ctx.fillText("E[π_k]", piX + 6, pad.t + 14);
    let aliveCount = 0;
    for (let r = 0; r < state.K; r++) {
      const { v, i } = order[r];
      const y = pad.t + 22 + r * barH;
      const col = PALETTE[i % PALETTE.length];
      ctx.fillStyle = col;
      ctx.globalAlpha = Math.min(1, 0.45 + 1.5 * v);
      const fullW = piW - 32;
      ctx.fillRect(piX + 24, y + 2, Math.max(1, v * fullW), Math.max(2, barH - 4));
      ctx.globalAlpha = 1;
      ctx.fillStyle = C.text; ctx.font = "10px -apple-system, sans-serif"; ctx.textAlign = "right";
      ctx.fillText(`k=${i + 1}`, piX + 20, y + barH / 2 + 3);
      ctx.fillStyle = C.textDim; ctx.textAlign = "right";
      ctx.fillText(v.toFixed(3), piX + piW - 4, y + barH / 2 + 3);
      if (v >= 0.02) aliveCount++;
    }

    // ── ELBO panel
    ctx.strokeStyle = C.axis; ctx.lineWidth = 1;
    ctx.strokeRect(elboX + 0.5, elboY + 0.5, elboW, elboH);
    ctx.fillStyle = C.textDim; ctx.font = "11px -apple-system, sans-serif"; ctx.textAlign = "left";
    ctx.fillText("convergence trace (variational objective ↑)", elboX + 6, elboY + 14);
    if (elboHistory.length > 1) {
      const eMin = Math.min(...elboHistory), eMax = Math.max(...elboHistory);
      const span = Math.max(1e-6, eMax - eMin);
      ctx.fillStyle = C.elboFill;
      ctx.beginPath();
      ctx.moveTo(elboX, elboY + elboH);
      elboHistory.forEach((v, i) => {
        const X = elboX + (i / (elboHistory.length - 1)) * elboW;
        const Y = elboY + elboH - ((v - eMin) / span) * (elboH - 22) - 6;
        ctx.lineTo(X, Y);
      });
      ctx.lineTo(elboX + elboW, elboY + elboH);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = C.elbo; ctx.lineWidth = 1.6;
      ctx.beginPath();
      elboHistory.forEach((v, i) => {
        const X = elboX + (i / (elboHistory.length - 1)) * elboW;
        const Y = elboY + elboH - ((v - eMin) / span) * (elboH - 22) - 6;
        i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
      });
      ctx.stroke();
      ctx.fillStyle = C.textDim; ctx.textAlign = "right";
      ctx.fillText(`L = ${elboHistory[elboHistory.length - 1].toFixed(1)}`, elboX + elboW - 6, elboY + 14);
    }

    // Readout.
    readout.innerHTML = `
      <div class="row"><span class="lbl">iteration</span><span>${iteration}</span></div>
      <div class="row"><span class="lbl">α₀ (Dirichlet)</span><span>${Math.pow(10, +alphaIn.value).toExponential(2)}</span></div>
      <div class="row"><span class="lbl">surviving components</span><span>${aliveCount} of ${state.K}</span></div>
      <div class="row"><span class="lbl">true clusters</span><span>${dataset.centers.length}</span></div>
    `;
  }

  function tick(now: number) {
    if (running) {
      const sps = +speedIn.value;
      const interval = 1000 / sps;
      if (now - lastTick > interval) {
        lastTick = now;
        oneIteration();
        draw();
      }
    }
    requestAnimationFrame(tick);
  }

  runBtn.addEventListener("click", () => {
    running = !running;
    runBtn.textContent = running ? "Pause" : "Run";
  });
  stepBtn.addEventListener("click", step);
  reinitBtn.addEventListener("click", reinit);
  resampleBtn.addEventListener("click", resample);
  function changeListener(el: HTMLInputElement, v: HTMLElement, decimals: number, regen: boolean) {
    el.addEventListener("input", () => {
      v.textContent = (+el.value).toFixed(decimals);
      if (regen) {
        if (el === trueKIn || el === nIn) resample();
        else reinit();
      }
    });
  }
  changeListener(trueKIn, trueKV, 0, true);
  changeListener(nIn, nV, 0, true);
  changeListener(KIn, KV, 0, true);
  changeListener(alphaIn, alphaV, 1, true);
  changeListener(speedIn, speedV, 0, false);

  draw();
  requestAnimationFrame(tick);
})();
