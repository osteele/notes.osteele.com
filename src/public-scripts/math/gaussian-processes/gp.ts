import { drawClippedLine } from "../../_shared/charts";

const C = {
  bg: "#ffffff",
  grid: "#e3ddd0",
  axis: "#5a6577",
  text: "#1f2733",
  textDim: "#5a6577",
  blue: "#1f4a8c",
  blueFill: "rgba(31,74,140,0.24)",
  red: "#b8412a",
  redFill: "rgba(184,65,42,0.30)",
  green: "#2d7a3e",
  greenFill: "rgba(45,122,62,0.26)",
  purple: "#6b4592",
  purpleFill: "rgba(107,69,146,0.42)",
  orange: "#d4690a",
};

function setupCanvas(canvas) {
  const ratio = window.devicePixelRatio || 1;
  const intrinsicW = parseInt(canvas.getAttribute("width"), 10);
  const intrinsicH = parseInt(canvas.getAttribute("height"), 10);
  canvas.style.width = "100%";
  canvas.style.height = `${canvas.getBoundingClientRect().width * intrinsicH / intrinsicW}px`;
  canvas.width = intrinsicW * ratio;
  canvas.height = intrinsicH * ratio;
  const ctx = canvas.getContext("2d");
  ctx.scale(ratio, ratio);
  return { ctx, w: intrinsicW, h: intrinsicH };
}

function pointerPoint(canvas, ev, w, h) {
  const r = canvas.getBoundingClientRect();
  return [
    (ev.clientX - r.left) * w / r.width,
    (ev.clientY - r.top) * h / r.height,
  ];
}

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const fmt = (x, d = 3) => Number.isFinite(x) ? x.toFixed(d) : "∞";
const randn = (() => {
  let spare = null;
  return () => {
    if (spare !== null) { const v = spare; spare = null; return v; }
    const u = Math.max(1e-12, Math.random());
    const v = Math.random();
    const r = Math.sqrt(-2 * Math.log(u));
    spare = r * Math.sin(2 * Math.PI * v);
    return r * Math.cos(2 * Math.PI * v);
  };
})();

// ─────────── Figure 2b: Joint Gaussian conditioning slice ───────────
(function figSlice() {
  const canvas = document.getElementById("fig2-slice");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const x1In = document.getElementById("fig2-slice-x1");
  const x2In = document.getElementById("fig2-slice-x2");
  const y1In = document.getElementById("fig2-slice-y1");
  const x1V = document.getElementById("fig2-slice-x1-v");
  const x2V = document.getElementById("fig2-slice-x2-v");
  const y1V = document.getElementById("fig2-slice-y1-v");
  const readout = document.getElementById("fig2-slice-readout");
  function draw() {
    const x1 = +x1In.value, x2 = +x2In.value, y1 = +y1In.value;
    x1V.textContent = x1.toFixed(2); x2V.textContent = x2.toFixed(2); y1V.textContent = y1.toFixed(2);
    const ell = 0.22;
    const rho = kernel1("rbf", x1, x2, ell, 1);
    const condMean = rho * y1;
    const condSd = Math.sqrt(Math.max(1e-6, 1 - rho * rho));
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
    const cx = 195, cy = 178, scale = 82;
    drawAxes(ctx, 46, 30, 300, 270, 6, 6);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.PI / 4);
    ctx.scale(scale * Math.sqrt(1 + rho), scale * Math.sqrt(1 - rho));
    ctx.beginPath(); ctx.arc(0, 0, 1.96, 0, Math.PI * 2);
    ctx.restore();
    ctx.fillStyle = C.blueFill; ctx.strokeStyle = C.blue; ctx.lineWidth = 2; ctx.fill(); ctx.stroke();
    const y1Px = cx + y1 * scale * 0.55;
    ctx.strokeStyle = C.red; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(y1Px, 34); ctx.lineTo(y1Px, 300); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = C.red; ctx.beginPath(); ctx.arc(y1Px, cy + condMean * -scale * 0.55, 5, 0, Math.PI * 2); ctx.fill();
    const px = 420, py = 54, pw = 280, ph = 220;
    drawAxes(ctx, px, py, pw, ph, 8, 4);
    const xs = Array.from({ length: 180 }, (_, i) => -3 + i / 179 * 6);
    const vals = xs.map((z) => normalPdf((z - condMean) / condSd) / condSd);
    const maxV = Math.max(...vals) * 1.1;
    const pts = vals.map((v, i) => [px + (i / 179) * pw, py + ph - (v / maxV) * ph]);
    ctx.beginPath();
    pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
    ctx.lineTo(px + pw, py + ph); ctx.lineTo(px, py + ph); ctx.closePath(); ctx.fillStyle = C.greenFill; ctx.fill();
    line(ctx, pts, C.green, 2);
    ctx.fillStyle = C.text; ctx.font = "700 12px -apple-system, sans-serif"; ctx.fillText("conditional f(x₂) | f(x₁)", px + 12, py + 18);
    readout.innerHTML =
      `<div class="row"><span class="lbl">covariance</span><span>k(x₁,x₂) = ${rho.toFixed(3)}</span></div>` +
      `<div class="row"><span class="lbl">conditional</span><span>mean ${condMean.toFixed(3)}, sd ${condSd.toFixed(3)}</span></div>`;
  }
  [x1In, x2In, y1In].forEach((input) => input.addEventListener("input", draw));
  draw();
})();

// ─────────── Figure 4b: Kernel comparison as model selection ───────────
(function figKernelCompare() {
  const canvas = document.getElementById("fig4-kernels");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const readout = document.getElementById("fig4-kernels-readout");
  let mode = "smooth";
  const obsX = [0.06, 0.15, 0.25, 0.36, 0.48, 0.58, 0.69, 0.82, 0.93];
  function makeObs() {
    return obsX.map((x, i) => {
      const jitter = [0.06, -0.05, 0.04, -0.03, 0.03, -0.06, 0.04, -0.02, 0.05][i];
      let y;
      if (mode === "periodic") y = Math.sin(2 * Math.PI * 3 * x) * 0.9 + jitter;
      else if (mode === "rough") y = Math.sin(13 * x) * 0.45 + Math.sin(37 * x) * 0.35 + jitter;
      else y = Math.sin(2 * Math.PI * x) * 0.75 + 0.5 * x - 0.2 + jitter;
      return { x, y };
    });
  }
  function logMarginalType(obs, type, ell, noise = 0.12) {
    const n = obs.length;
    const K = Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (_, j) => kernel1(type, obs[i].x, obs[j].x, ell, 1) + (i === j ? noise * noise + 1e-7 : 0)));
    const L = cholesky(K);
    const y = obs.map((p) => p.y);
    const alpha = solveChol(L, y);
    const logDet = 2 * L.reduce((s, row, i) => s + Math.log(row[i]), 0);
    return -0.5 * dot(y, alpha) - 0.5 * logDet - 0.5 * n * Math.log(2 * Math.PI);
  }
  function drawPanel(obs, type, name, x0, y0, ww, hh, color) {
    drawAxes(ctx, x0, y0, ww, hh, 5, 4);
    const ell = type === "periodic" ? 0.17 : type === "m12" ? 0.12 : 0.22;
    const xs = xGrid(120);
    const post = gpPosterior1(obs, xs, ell, 0.12, type);
    const pts = post.map((p) => [x0 + p.x * ww, y0 + hh / 2 - p.mean * hh * 0.26]);
    line(ctx, pts, color, 2);
    obs.forEach((p) => {
      ctx.fillStyle = C.red; ctx.beginPath(); ctx.arc(x0 + p.x * ww, y0 + hh / 2 - p.y * hh * 0.26, 4, 0, Math.PI * 2); ctx.fill();
    });
    const lml = logMarginalType(obs, type, ell);
    ctx.fillStyle = C.text; ctx.font = "700 12px -apple-system, sans-serif"; ctx.fillText(`${name}: LML ${lml.toFixed(1)}`, x0 + 8, y0 + 16);
    return lml;
  }
  function draw() {
    const obs = makeObs();
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
    const panels = [
      ["rbf", "RBF smooth", C.blue],
      ["periodic", "Periodic", C.red],
      ["m12", "Rough Matérn", C.green],
    ];
    const lmls = panels.map(([type, name, color], i) => drawPanel(obs, type, name, 38, 28 + i * 124, 660, 102, color));
    const best = panels[lmls.indexOf(Math.max(...lmls))][1];
    readout.innerHTML = `<div class="row"><span class="lbl">best marginal likelihood</span><span>${best}</span></div><div class="row"><span class="lbl">lesson</span><span>kernel choice changes the posterior and the evidence score, not just the curve style</span></div>`;
  }
  document.querySelectorAll("[data-kernel-data]").forEach((button) => button.addEventListener("click", () => {
    mode = button.dataset.kernelData;
    document.querySelectorAll("[data-kernel-data]").forEach((b) => b.classList.toggle("active", b === button));
    draw();
  }));
  draw();
})();

function erf(x) {
  const sign = x < 0 ? -1 : 1;
  const a = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * a);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a);
  return sign * y;
}
const normalPdf = z => Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
const normalCdf = z => 0.5 * (1 + erf(z / Math.SQRT2));

function kernel1(type, a, b, ell, sf = 1) {
  const r = Math.abs(a - b);
  const q = r / Math.max(ell, 1e-6);
  const s2 = sf * sf;
  if (type === "m12" || type === "ou") return s2 * Math.exp(-q);
  if (type === "m32") return s2 * (1 + Math.sqrt(3) * q) * Math.exp(-Math.sqrt(3) * q);
  if (type === "m52") return s2 * (1 + Math.sqrt(5) * q + 5 * q * q / 3) * Math.exp(-Math.sqrt(5) * q);
  if (type === "periodic") return s2 * Math.exp(-2 * Math.sin(Math.PI * r / 0.5) ** 2 / (ell * ell));
  if (type === "linear") return s2 * (1 + 4 * (a - 0.5) * (b - 0.5));
  if (type === "rq") return s2 * (1 + (r * r) / (2 * 0.55 * ell * ell)) ** -0.55;
  return s2 * Math.exp(-0.5 * q * q);
}
function kernel2(a, b, ell, sf = 1) {
  const dx = a.x - b.x, dy = a.y - b.y;
  return sf * sf * Math.exp(-0.5 * (dx * dx + dy * dy) / (ell * ell));
}

function cholesky(A) {
  const n = A.length;
  const L = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let s = A[i][j];
      for (let k = 0; k < j; k++) s -= L[i][k] * L[j][k];
      if (i === j) L[i][j] = Math.sqrt(Math.max(s, 1e-10));
      else L[i][j] = s / L[j][j];
    }
  }
  return L;
}
function solveChol(L, b) {
  const n = L.length;
  const y = Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    let s = b[i];
    for (let k = 0; k < i; k++) s -= L[i][k] * y[k];
    y[i] = s / L[i][i];
  }
  const x = Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = y[i];
    for (let k = i + 1; k < n; k++) s -= L[k][i] * x[k];
    x[i] = s / L[i][i];
  }
  return x;
}
function dot(a, b) { return a.reduce((s, x, i) => s + x * b[i], 0); }
function matVecLower(L, z) {
  return L.map((row, i) => row.slice(0, i + 1).reduce((s, x, k) => s + x * z[k], 0));
}
function gpPosterior1(obs, xs, ell, noise, type = "rbf", sf = 1) {
  if (!obs.length) return xs.map(x => ({ x, mean: 0, sd: sf }));
  const n = obs.length;
  const K = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => kernel1(type, obs[i].x, obs[j].x, ell, sf) + (i === j ? noise * noise + 1e-7 : 0)));
  const L = cholesky(K);
  const alpha = solveChol(L, obs.map(p => p.y));
  return xs.map(x => {
    const k = obs.map(p => kernel1(type, x, p.x, ell, sf));
    const mean = dot(k, alpha);
    const v = solveChol(L, k);
    const variance = Math.max(1e-8, kernel1(type, x, x, ell, sf) - dot(k, v));
    return { x, mean, sd: Math.sqrt(variance) };
  });
}
function logMarginal(obs, ell, noise, sf = 1) {
  const n = obs.length;
  const K = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => kernel1("rbf", obs[i].x, obs[j].x, ell, sf) + (i === j ? noise * noise + 1e-7 : 0)));
  const L = cholesky(K);
  const y = obs.map(p => p.y);
  const alpha = solveChol(L, y);
  const logDet = 2 * L.reduce((s, row, i) => s + Math.log(row[i]), 0);
  return -0.5 * dot(y, alpha) - 0.5 * logDet - 0.5 * n * Math.log(2 * Math.PI);
}

function drawAxes(ctx, x, y, w, h, verticals = 10, horizontals = 4) {
  ctx.strokeStyle = C.grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= verticals; i++) {
    const px = x + (i / verticals) * w;
    ctx.beginPath(); ctx.moveTo(px, y); ctx.lineTo(px, y + h); ctx.stroke();
  }
  for (let i = 0; i <= horizontals; i++) {
    const py = y + (i / horizontals) * h;
    ctx.beginPath(); ctx.moveTo(x, py); ctx.lineTo(x + w, py); ctx.stroke();
  }
  ctx.strokeStyle = C.axis;
  ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + h); ctx.lineTo(x + w, y + h); ctx.stroke();
}
function line(ctx, pts, color, width = 2) {
  ctx.beginPath();
  pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
}
function heat(v) {
  const t = clamp((v + 1) / 2, 0, 1);
  const r = Math.round(31 + 153 * t);
  const g = Math.round(74 - 9 * t + 65 * (1 - Math.abs(t - 0.5) * 2));
  const b = Math.round(140 - 98 * t);
  return `rgb(${r},${g},${b})`;
}
function xGrid(n = 80) { return Array.from({ length: n }, (_, i) => i / (n - 1)); }

async function playKernelAudio(type) {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  const ac = new AudioCtx();
  const duration = 1.6;
  const n = Math.floor(ac.sampleRate * duration);
  const m = 260;
  const ell = type === "periodic" ? 0.18 : type === "ou" ? 0.08 : 0.22;
  const xs = xGrid(m);
  const K = xs.map((a) => xs.map((b) => kernel1(type, a, b, ell, 1) + (a === b ? 1e-6 : 0)));
  const L = cholesky(K);
  const z = xs.map(() => randn());
  const sample = matVecLower(L, z);
  const mean = sample.reduce((a, b) => a + b, 0) / sample.length;
  const sd = Math.sqrt(sample.reduce((a, b) => a + (b - mean) ** 2, 0) / sample.length) || 1;
  const normalized = sample.map((x) => (x - mean) / sd);
  const buffer = ac.createBuffer(1, n, ac.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let i = 0; i < n; i++) {
    const pos = (i / (n - 1)) * (normalized.length - 1);
    const j = Math.floor(pos);
    const frac = pos - j;
    const v = normalized[j] * (1 - frac) + normalized[Math.min(normalized.length - 1, j + 1)] * frac;
    const fade = Math.min(1, i / 1200, (n - i) / 1200);
    channel[i] = 0.15 * fade * v;
  }
  const source = ac.createBufferSource();
  source.buffer = buffer;
  source.connect(ac.destination);
  source.start();
}

document.querySelectorAll("[data-gp-audio]").forEach((button) => {
  button.addEventListener("click", () => playKernelAudio(button.dataset.gpAudio));
});

const sharedObs = [
  { x: 0.09, y: 0.25 }, { x: 0.24, y: 1.0 }, { x: 0.41, y: -0.15 },
  { x: 0.58, y: -0.85 }, { x: 0.76, y: 0.55 }, { x: 0.91, y: 0.05 },
];

(function fig1() {
  const canvas = document.getElementById("fig1");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const ellIn = document.getElementById("fig1-ell");
  const sfIn = document.getElementById("fig1-sf");
  const ellV = document.getElementById("fig1-ell-v");
  const sfV = document.getElementById("fig1-sf-v");
  const readout = document.getElementById("fig1-readout");
  const kernels = [
    ["rbf", "RBF"], ["m12", "Matérn 1/2"], ["m32", "Matérn 3/2"],
    ["m52", "Matérn 5/2"], ["periodic", "Periodic"], ["linear", "Linear"], ["rq", "Rational quadratic"],
  ];
  let samples = new Map();
  function regenerate() {
    samples = new Map();
    const xs = xGrid(56);
    for (const [type] of kernels) {
      const K = xs.map(a => xs.map(b => kernel1(type, a, b, +ellIn.value, +sfIn.value) + (a === b ? 1e-7 : 0)));
      const L = cholesky(K);
      samples.set(type, Array.from({ length: 5 }, () => matVecLower(L, xs.map(() => randn()))));
    }
  }
  function draw() {
    const ell = +ellIn.value, sf = +sfIn.value;
    ellV.textContent = ell.toFixed(2); sfV.textContent = sf.toFixed(2);
    if (!samples.size) regenerate();
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
    const cardW = 240, cardH = 118;
    kernels.forEach(([type, name], idx) => {
      const col = idx % 2, row = Math.floor(idx / 2);
      const x0 = 18 + col * (cardW + 24), y0 = 24 + row * (cardH + 10);
      ctx.strokeStyle = "#d8d2c4"; ctx.strokeRect(x0, y0, cardW, cardH);
      ctx.fillStyle = C.text; ctx.font = "700 11px -apple-system, sans-serif"; ctx.textAlign = "left"; ctx.textBaseline = "top";
      ctx.fillText(name, x0 + 8, y0 + 6);
      const n = 12, hs = 7, hx = x0 + 8, hy = y0 + 24;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        const v = kernel1(type, i / (n - 1), j / (n - 1), ell, 1);
        ctx.fillStyle = heat(v * 2 - 1);
        ctx.fillRect(hx + j * hs, hy + i * hs, hs, hs);
      }
      const px = x0 + 104, py = y0 + 22, pw = 124, ph = 82;
      drawAxes(ctx, px, py, pw, ph, 3, 2);
      const ys = samples.get(type);
      const colors = [C.blue, C.red, C.green, C.purple, C.orange];
      const sampleMax = 3 * sf;
      const sampleBandH = ph * 0.92;
      const sampleBandTop = py + ph / 2 - sampleBandH / 2;
      ys.forEach((arr, sidx) => {
        const xData = arr.map((_, i) => i / (arr.length - 1));
        drawClippedLine(
          ctx,
          xData,
          arr,
          -sampleMax,
          sampleMax,
          t => px + t * pw,
          sampleBandTop,
          sampleBandH,
          colors[sidx],
          { width: 1.25, apexLen: 5, halfBase: 3 },
        );
      });
    });
    readout.innerHTML =
      `<div class="row"><span class="lbl">kernel role</span><span>nearby inputs have covariance k(x,x′), so samples move together over length-scale ℓ</span></div>`;
  }
  [ellIn, sfIn].forEach(input => input.addEventListener("input", () => { regenerate(); draw(); }));
  document.getElementById("fig1-resample").addEventListener("click", () => { regenerate(); draw(); });
  regenerate(); draw();
})();

// Fixed-range plot: v ∈ [-vMax, +vMax] maps to a vertical band centered on
// the panel that occupies vSpan of plotH. plot.y does NOT clamp — drawing
// code must clip via canvas state (filled bands) or use drawClippedLine
// (stroked curves), so off-chart trajectories don't render as constant edges.
function makePlot(canvas, ctx, w, h, pad = { l: 44, r: 14, t: 16, b: 34 }) {
  const plotW = w - pad.l - pad.r, plotH = h - pad.t - pad.b;
  const vMax = 2.5;
  const vSpan = 0.48; // half-height of the value band as a fraction of plotH
  const midY = pad.t + plotH / 2;
  const yPanelTop = midY - plotH * vSpan; // v = +vMax
  const yPanelH = plotH * vSpan * 2;       // v = -vMax at yPanelTop + yPanelH
  return {
    x: t => pad.l + t * plotW,
    y: v => midY - (v / vMax) * plotH * vSpan,
    invX: px => clamp((px - pad.l) / plotW, 0, 1),
    invY: py => clamp((midY - py) / (plotH * vSpan) * vMax, -vMax, vMax),
    pad, plotW, plotH,
    vMax, yPanelTop, yPanelH,
  };
}
function drawPosterior(ctx, plot, post, obs, title) {
  drawAxes(ctx, plot.pad.l, plot.pad.t, plot.plotW, plot.plotH, 10, 4);
  // Clip the 95% band to the panel rect so points outside [-vMax, vMax] don't
  // bleed into adjacent figures or render as flat edges.
  ctx.save();
  ctx.beginPath();
  ctx.rect(plot.pad.l, plot.pad.t, plot.plotW, plot.plotH);
  ctx.clip();
  ctx.beginPath();
  post.forEach((p, i) => {
    const x = plot.x(p.x), y = plot.y(p.mean + 1.96 * p.sd);
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  });
  for (let i = post.length - 1; i >= 0; i--) {
    const p = post[i]; ctx.lineTo(plot.x(p.x), plot.y(p.mean - 1.96 * p.sd));
  }
  ctx.closePath(); ctx.fillStyle = C.blueFill; ctx.fill();
  ctx.restore();
  // Mean line: route through the clipped-line helper so off-chart segments
  // break (and arrowheads mark the exit) instead of clamping to the edge.
  drawClippedLine(
    ctx,
    post.map(p => p.x),
    post.map(p => p.mean),
    -plot.vMax,
    plot.vMax,
    plot.x,
    plot.yPanelTop,
    plot.yPanelH,
    C.blue,
    { width: 2.2 },
  );
  for (const p of obs) {
    ctx.fillStyle = C.red; ctx.beginPath(); ctx.arc(plot.x(p.x), plot.y(p.y), 5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = C.textDim; ctx.font = "11px -apple-system, sans-serif"; ctx.textAlign = "left"; ctx.textBaseline = "top";
  ctx.fillText(title, plot.pad.l + 5, plot.pad.t + 5);
}

const posteriorState = { obs: sharedObs.map(p => ({ ...p })), ell: 0.22, noise: 0.12, listeners: [] };
const notifyPosterior = () => posteriorState.listeners.forEach(fn => fn());
const onPosterior = fn => posteriorState.listeners.push(fn);

(function fig2() {
  const canvas = document.getElementById("fig2");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const ellIn = document.getElementById("fig2-ell");
  const noiseIn = document.getElementById("fig2-noise");
  const ellV = document.getElementById("fig2-ell-v");
  const noiseV = document.getElementById("fig2-noise-v");
  const readout = document.getElementById("fig2-readout");
  const plot = makePlot(canvas, ctx, w, h);
  let drag = -1;
  function sync() {
    posteriorState.ell = +ellIn.value;
    posteriorState.noise = +noiseIn.value;
    ellV.textContent = posteriorState.ell.toFixed(2);
    noiseV.textContent = posteriorState.noise.toFixed(2);
    notifyPosterior();
  }
  function draw() {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
    const xs = xGrid(180);
    const post = gpPosterior1(posteriorState.obs, xs, posteriorState.ell, posteriorState.noise);
    drawPosterior(ctx, plot, post, posteriorState.obs, "click to add, drag to move");
    readout.innerHTML =
      `<div class="row"><span class="lbl">observations</span><span>${posteriorState.obs.length}</span></div>` +
      `<div class="row"><span class="lbl">posterior</span><span>mean = k_*ᵀ(K+σ_n²I)⁻¹y; variance pinches near data</span></div>`;
  }
  function pointer(ev) {
    return pointerPoint(canvas, ev, w, h);
  }
  function hit(mx, my) {
    return posteriorState.obs.findIndex(p => (plot.x(p.x) - mx) ** 2 + (plot.y(p.y) - my) ** 2 < 100);
  }
  canvas.addEventListener("pointerdown", ev => {
    const [mx, my] = pointer(ev);
    drag = hit(mx, my);
    if (drag < 0) {
      posteriorState.obs.push({ x: plot.invX(mx), y: plot.invY(my) });
      drag = posteriorState.obs.length - 1;
    }
    canvas.setPointerCapture(ev.pointerId);
    draw(); notifyPosterior(); ev.preventDefault();
  });
  canvas.addEventListener("pointermove", ev => {
    if (drag < 0) return;
    const [mx, my] = pointer(ev);
    posteriorState.obs[drag] = { x: plot.invX(mx), y: plot.invY(my) };
    draw(); notifyPosterior(); ev.preventDefault();
  });
  canvas.addEventListener("pointerup", ev => { drag = -1; if (canvas.hasPointerCapture(ev.pointerId)) canvas.releasePointerCapture(ev.pointerId); });
  canvas.addEventListener("pointercancel", () => { drag = -1; });
  document.getElementById("fig2-reset").addEventListener("click", () => {
    posteriorState.obs = sharedObs.map(p => ({ ...p }));
    draw(); notifyPosterior();
  });
  [ellIn, noiseIn].forEach(input => input.addEventListener("input", () => { sync(); draw(); }));
  sync(); draw();
})();

(function fig3() {
  const canvas = document.getElementById("fig3");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const readout = document.getElementById("fig3-readout");
  function draw() {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
    const ells = [0.08, 0.22, 0.65], labels = ["short ℓ: wiggly", "medium ℓ", "long ℓ: stiff"];
    ells.forEach((ell, i) => {
      const pad = { l: 35 + i * 245, r: w - (35 + i * 245 + 215), t: 25, b: 38 };
      const plot = makePlot(canvas, ctx, w, h, pad);
      plot.plotW = 215; plot.plotH = 250;
      const xs = xGrid(150);
      const post = gpPosterior1(sharedObs, xs, ell, 0.10);
      drawPosterior(ctx, plot, post, sharedObs, labels[i]);
    });
    readout.innerHTML = `<div class="row"><span class="lbl">same data</span><span>length-scale controls how far one observation influences the function</span></div>`;
  }
  draw();
})();

(function fig4() {
  const canvas = document.getElementById("fig4");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const readout = document.getElementById("fig4-readout");
  let selected = { ell: 0.22, noise: 0.12 };
  const obs = sharedObs;
  const landscape = [];
  let best = { v: -Infinity, ell: 0.2, noise: 0.1 }, lo = Infinity, hi = -Infinity;
  for (let i = 0; i < 44; i++) {
    const row = [];
    const ell = 0.05 + i / 43 * 0.75;
    for (let j = 0; j < 34; j++) {
      const noise = 0.03 + j / 33 * 0.55;
      const v = logMarginal(obs, ell, noise);
      row.push(v); lo = Math.min(lo, v); hi = Math.max(hi, v);
      if (v > best.v) best = { v, ell, noise };
    }
    landscape.push(row);
  }
  function draw() {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
    const lx = 38, ly = 25, lw = 300, lh = 245;
    for (let i = 0; i < 44; i++) for (let j = 0; j < 34; j++) {
      const t = (landscape[i][j] - lo) / (hi - lo);
      ctx.fillStyle = heat(t * 2 - 1);
      ctx.fillRect(lx + i * lw / 44, ly + (33 - j) * lh / 34, lw / 44 + 1, lh / 34 + 1);
    }
    function pos(ell, noise) {
      return [lx + ((ell - 0.05) / 0.75) * lw, ly + lh - ((noise - 0.03) / 0.55) * lh];
    }
    for (const [p, color, label] of [[best, C.green, "opt"], [selected, C.red, "selected"]] as [{ ell: number; noise: number }, string, string][]) {
      const [x, y] = pos(p.ell, p.noise);
      ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = color; ctx.font = "11px -apple-system, sans-serif"; ctx.fillText(label, x + 9, y + 4);
    }
    ctx.fillStyle = C.textDim; ctx.font = "11px -apple-system, sans-serif"; ctx.textAlign = "left"; ctx.textBaseline = "top";
    ctx.fillText("log p(y | X, ℓ, σ_n)", lx + 5, ly + 5);
    ctx.fillText("ℓ →", lx + lw - 24, ly + lh + 9);
    ctx.save(); ctx.translate(lx - 24, ly + 22); ctx.rotate(-Math.PI / 2); ctx.fillText("noise σ_n", 0, 0); ctx.restore();
    const pad = { l: 390, r: 24, t: 30, b: 48 };
    const plot = makePlot(canvas, ctx, w, h, pad);
    plot.plotW = w - pad.l - pad.r; plot.plotH = 250;
    const post = gpPosterior1(obs, xGrid(180), selected.ell, selected.noise);
    drawPosterior(ctx, plot, post, obs, "posterior for selected hyperparameters");
    readout.innerHTML =
      `<div class="row"><span class="lbl">selected</span><span>ℓ=${fmt(selected.ell, 2)}, σ_n=${fmt(selected.noise, 2)}</span></div>` +
      `<div class="row"><span class="lbl">best on grid</span><span>ℓ=${fmt(best.ell, 2)}, σ_n=${fmt(best.noise, 2)}, log ML=${fmt(best.v, 2)}</span></div>`;
  }
  canvas.addEventListener("click", ev => {
    const [mx, my] = pointerPoint(canvas, ev, w, h);
    const lx = 38, ly = 25, lw = 300, lh = 245;
    if (mx >= lx && mx <= lx + lw && my >= ly && my <= ly + lh) {
      selected = { ell: 0.05 + ((mx - lx) / lw) * 0.75, noise: 0.03 + (1 - (my - ly) / lh) * 0.55 };
      draw();
    }
  });
  draw();
})();

(function fig5() {
  const canvas = document.getElementById("fig5");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const readout = document.getElementById("fig5-readout");
  let pts = [
    { x: 0.18, y: 0.28, z: 1.0 }, { x: 0.35, y: 0.75, z: -0.4 },
    { x: 0.70, y: 0.30, z: 0.2 }, { x: 0.82, y: 0.78, z: 1.1 },
  ];
  const box = { x: 80, y: 30, w: 320, h: 320 };
  let drag = -1;
  function posteriorAt(query) {
    if (!pts.length) return { mean: 0, sd: 1 };
    const n = pts.length, ell = 0.28, noise = 0.08;
    const K = Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (_, j) => kernel2(pts[i], pts[j], ell) + (i === j ? noise * noise + 1e-7 : 0)));
    const L = cholesky(K);
    const alpha = solveChol(L, pts.map(p => p.z));
    const k = pts.map(p => kernel2(query, p, ell));
    const mean = dot(k, alpha);
    const v = solveChol(L, k);
    const sd = Math.sqrt(Math.max(1e-8, 1 - dot(k, v)));
    return { mean, sd };
  }
  function draw() {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
    const g = 42;
    for (let i = 0; i < g; i++) for (let j = 0; j < g; j++) {
      const q = { x: (i + 0.5) / g, y: (j + 0.5) / g };
      const p = posteriorAt(q);
      ctx.fillStyle = heat(clamp(p.mean / 1.6, -1, 1));
      ctx.globalAlpha = clamp(1.1 - p.sd, 0.2, 1);
      ctx.fillRect(box.x + i * box.w / g, box.y + (g - 1 - j) * box.h / g, box.w / g + 1, box.h / g + 1);
    }
    ctx.globalAlpha = 1; ctx.strokeStyle = C.axis; ctx.strokeRect(box.x, box.y, box.w, box.h);
    for (const p of pts) {
      ctx.fillStyle = p.z >= 0 ? C.red : C.blue;
      ctx.beginPath(); ctx.arc(box.x + p.x * box.w, box.y + (1 - p.y) * box.h, 7, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
    }
    const sx = 455, sy = 54;
    ctx.fillStyle = C.textDim; ctx.font = "12px -apple-system, sans-serif"; ctx.textAlign = "left";
    ctx.fillText("color = posterior mean", sx, sy);
    ctx.fillText("opacity = confidence", sx, sy + 22);
    ctx.fillText("drag points to move observations", sx, sy + 44);
    for (let k = 0; k <= 10; k++) {
      ctx.fillStyle = heat(k / 5 - 1);
      ctx.fillRect(sx + k * 18, sy + 78, 18, 20);
    }
    readout.innerHTML =
      `<div class="row"><span class="lbl">2-D input space</span><span>same GP formula; k((x,y),(x′,y′)) uses squared distance in the plane</span></div>`;
  }
  function pointer(ev) {
    return pointerPoint(canvas, ev, w, h);
  }
  canvas.addEventListener("pointerdown", ev => {
    const [mx, my] = pointer(ev);
    drag = pts.findIndex(p => (box.x + p.x * box.w - mx) ** 2 + (box.y + (1 - p.y) * box.h - my) ** 2 < 160);
    if (drag >= 0) { canvas.setPointerCapture(ev.pointerId); ev.preventDefault(); }
  });
  canvas.addEventListener("pointermove", ev => {
    if (drag < 0) return;
    const [mx, my] = pointer(ev);
    pts[drag].x = clamp((mx - box.x) / box.w, 0, 1);
    pts[drag].y = clamp(1 - (my - box.y) / box.h, 0, 1);
    draw(); ev.preventDefault();
  });
  canvas.addEventListener("pointerup", ev => { drag = -1; if (canvas.hasPointerCapture(ev.pointerId)) canvas.releasePointerCapture(ev.pointerId); });
  canvas.addEventListener("pointercancel", () => { drag = -1; });
  draw();
})();

(function fig6() {
  const canvas = document.getElementById("fig6");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const readout = document.getElementById("fig6-readout");
  function draw() {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
    const pad = { l: 46, r: 16, t: 18, b: 34 };
    const plot = makePlot(canvas, ctx, w, h, pad);
    const xs = xGrid(220);
    const post = gpPosterior1(posteriorState.obs, xs, posteriorState.ell, posteriorState.noise);
    const bestY = Math.max(...posteriorState.obs.map(p => p.y));
    const eis = post.map(p => {
      const imp = p.mean - bestY;
      const z = p.sd > 1e-8 ? imp / p.sd : 0;
      return p.sd * (z * normalCdf(z) + normalPdf(z));
    });
    const maxEi = Math.max(...eis, 1e-9);
    let bestIdx = 0;
    for (let i = 1; i < eis.length; i++) if (eis[i] > eis[bestIdx]) bestIdx = i;
    drawPosterior(ctx, plot, post, posteriorState.obs, "expected improvement chooses a next query");
    const eiPts = eis.map((v, i) => [plot.x(xs[i]), pad.t + plot.plotH - (v / maxEi) * plot.plotH * 0.40]);
    line(ctx, eiPts, C.green, 2.2);
    const bx = plot.x(xs[bestIdx]);
    ctx.strokeStyle = C.red; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.moveTo(bx, pad.t); ctx.lineTo(bx, pad.t + plot.plotH); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = C.red; ctx.font = "700 11px -apple-system, sans-serif"; ctx.textAlign = "center"; ctx.fillText("next", bx, pad.t + 8);
    readout.innerHTML =
      `<div class="row"><span class="lbl">best observed y</span><span>${fmt(bestY, 3)}</span></div>` +
      `<div class="row"><span class="lbl">argmax expected improvement</span><span>x=${fmt(xs[bestIdx], 3)}, EI=${fmt(eis[bestIdx], 4)}</span></div>`;
  }
  onPosterior(draw); draw();
})();
