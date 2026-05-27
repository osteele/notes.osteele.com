const C = {
  bg: "#ffffff",
  grid: "#e3ddd0",
  axis: "#5a6577",
  text: "#1f2733",
  textDim: "#5a6577",
  input: "#1f4a8c",
  inputFill: "rgba(31,74,140,0.20)",
  system: "#2d7a3e",
  systemFill: "rgba(45,122,62,0.20)",
  output: "#b8412a",
  outputFill: "rgba(184,65,42,0.22)",
  purple: "#6b4592",
  orange: "#d4690a",
};

let seed = 1;
let dualFilter = "low";
let stationarityMode = "linear";
let corrImpulse = [0.08, 0.18, 0.45, 0.18, 0.08];
let corrDragIndex = -1;

function setupCanvas(canvas) {
  const ratio = window.devicePixelRatio || 1;
  const intrinsicW = parseInt(canvas.getAttribute("width"), 10);
  const intrinsicH = parseInt(canvas.getAttribute("height"), 10);
  canvas.style.width = "100%";
  canvas.style.height = `${canvas.getBoundingClientRect().width * intrinsicH / intrinsicW}px`;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * ratio;
  canvas.height = rect.height * ratio;
  const ctx = canvas.getContext("2d");
  ctx.scale(ratio, ratio);
  return { ctx, w: rect.width, h: rect.height };
}

function mulberry32(s) {
  let t = s >>> 0;
  return function next() {
    t += 0x6D2B79F5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function randn(rand) {
  const u1 = Math.max(1e-9, rand());
  const u2 = rand();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function gaussian(x, mu, sigma) {
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z);
}

function normalize(xs) {
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  const sd = Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / xs.length) || 1;
  return xs.map((x) => (x - mean) / sd);
}

function generateInput(kind, n, s = seed) {
  const rand = mulberry32(1000 + s * 31);
  const xs = [];
  if (kind === "ar") {
    let x = 0;
    for (let i = 0; i < n; i++) {
      x = 0.92 * x + randn(rand);
      xs.push(x);
    }
    return normalize(xs);
  }
  if (kind === "tone") {
    for (let i = 0; i < n; i++) xs.push(Math.sin(2 * Math.PI * i / 28) + 0.45 * randn(rand));
    return normalize(xs);
  }
  if (kind === "walk") {
    let x = 0;
    for (let i = 0; i < n; i++) {
      x += randn(rand) * 0.22;
      xs.push(x);
    }
    return normalize(xs);
  }
  for (let i = 0; i < n; i++) xs.push(randn(rand));
  return normalize(xs);
}

function impulseResponse(kind) {
  if (kind === "impulse") return [1];
  if (kind === "box") return Array.from({ length: 13 }, () => 1 / 13);
  if (kind === "lowpass") {
    const m = 15;
    const fc = 0.16;
    const h = [];
    for (let n = -m; n <= m; n++) {
      const sinc = n === 0 ? 2 * fc : Math.sin(2 * Math.PI * fc * n) / (Math.PI * n);
      const win = 0.54 + 0.46 * Math.cos(Math.PI * n / m);
      h.push(sinc * win);
    }
    const sum = h.reduce((a, b) => a + b, 0);
    return h.map((v) => v / sum);
  }
  const h = [];
  for (let i = 0; i < 28; i++) h.push(Math.exp(-i / 6));
  const sum = h.reduce((a, b) => a + b, 0);
  return h.map((v) => v / sum);
}

function convolveSame(x, h) {
  const y = new Array(x.length).fill(0);
  const center = Math.floor(h.length / 2);
  for (let i = 0; i < x.length; i++) {
    let sum = 0;
    for (let k = 0; k < h.length; k++) {
      const j = i - k + center;
      if (j >= 0 && j < x.length) sum += x[j] * h[k];
    }
    y[i] = sum;
  }
  return y;
}

function fullConvolve(a, b) {
  const out = new Array(a.length + b.length - 1).fill(0);
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) out[i + j] += a[i] * b[j];
  }
  return out;
}

function autocorr(xs, maxLag) {
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  const denom = xs.reduce((a, b) => a + (b - mean) ** 2, 0) || 1;
  const r = [];
  for (let lag = -maxLag; lag <= maxLag; lag++) {
    let sum = 0;
    for (let i = 0; i < xs.length; i++) {
      const j = i + lag;
      if (j >= 0 && j < xs.length) sum += (xs[i] - mean) * (xs[j] - mean);
    }
    r.push(sum / denom);
  }
  return r;
}

function dftPower(xs, bins = 96) {
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  const centered = xs.map((x) => x - mean);
  const out = [];
  for (let k = 0; k < bins; k++) {
    let re = 0, im = 0;
    for (let n = 0; n < centered.length; n++) {
      const a = -Math.PI * k * n / bins;
      re += centered[n] * Math.cos(a);
      im += centered[n] * Math.sin(a);
    }
    out.push((re * re + im * im) / centered.length);
  }
  const max = Math.max(1e-9, ...out);
  return out.map((v) => v / max);
}

function gain(kind, w, strength) {
  const aw = Math.abs(w);
  if (kind === "high") return 1 - Math.exp(-0.5 * (aw / Math.max(0.08, strength)) ** 2);
  if (kind === "band") return gaussian(aw, 1.45, Math.max(0.08, strength * 0.35));
  return Math.exp(-0.5 * (aw / Math.max(0.08, strength)) ** 2);
}

function inputPsd(w) {
  return 0.12 + 1 / (1 + (Math.abs(w) / 0.55) ** 2);
}

function psdToCorr(psdFn, maxLag = 48) {
  const n = 240;
  const dw = Math.PI / (n - 1);
  const r = [];
  for (let lag = -maxLag; lag <= maxLag; lag++) {
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const w = Math.PI * i / (n - 1);
      const weight = i === 0 || i === n - 1 ? 0.5 : 1;
      sum += weight * psdFn(w) * Math.cos(w * lag) * dw;
    }
    r.push(sum / Math.PI);
  }
  const r0 = Math.max(1e-9, Math.abs(r[maxLag]));
  return r.map((x) => x / r0);
}

function drawAxes(ctx, x, y, w, h, verticals = 8, horizontal = true) {
  ctx.strokeStyle = C.grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= verticals; i++) {
    const px = x + (i / verticals) * w;
    ctx.beginPath();
    ctx.moveTo(px, y);
    ctx.lineTo(px, y + h);
    ctx.stroke();
  }
  if (horizontal) {
    for (let i = 0; i <= 4; i++) {
      const py = y + (i / 4) * h;
      ctx.beginPath();
      ctx.moveTo(x, py);
      ctx.lineTo(x + w, py);
      ctx.stroke();
    }
  }
  ctx.strokeStyle = C.axis;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x + w, y + h);
  ctx.stroke();
}

function drawPath(ctx, xs, ys, color, fill, baseY) {
  ctx.beginPath();
  ys.forEach((y, i) => {
    if (i === 0) ctx.moveTo(xs[i], y); else ctx.lineTo(xs[i], y);
  });
  if (fill) {
    ctx.lineTo(xs[xs.length - 1], baseY);
    ctx.lineTo(xs[0], baseY);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  }
  ctx.beginPath();
  ys.forEach((y, i) => {
    if (i === 0) ctx.moveTo(xs[i], y); else ctx.lineTo(xs[i], y);
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8;
  ctx.stroke();
}

function plotSeries(ctx, values, x, y, w, h, color, label) {
  drawAxes(ctx, x, y, w, h, 8, false);
  const maxAbs = Math.max(1e-9, ...values.map((v) => Math.abs(v)));
  const xs = [], ys = [];
  values.forEach((v, i) => {
    xs.push(x + (i / (values.length - 1)) * w);
    ys.push(y + h * 0.5 - (v / maxAbs) * h * 0.42);
  });
  ctx.strokeStyle = C.axis;
  ctx.beginPath();
  ctx.moveTo(x, y + h * 0.5);
  ctx.lineTo(x + w, y + h * 0.5);
  ctx.stroke();
  drawPath(ctx, xs, ys, color, null, y + h * 0.5);
  ctx.fillStyle = C.textDim;
  ctx.font = "11px -apple-system, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(label, x + 4, y + 3);
}

function plotPositive(ctx, values, x, y, w, h, color, fill, label) {
  drawAxes(ctx, x, y, w, h, 4);
  const max = Math.max(1e-9, ...values);
  const xs = [], ys = [];
  values.forEach((v, i) => {
    xs.push(x + (i / (values.length - 1)) * w);
    ys.push(y + h - (v / max) * h * 0.82);
  });
  drawPath(ctx, xs, ys, color, fill, y + h);
  ctx.fillStyle = C.textDim;
  ctx.font = "11px -apple-system, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(label, x + 4, y + 3);
}

function normalizeArea(xs) {
  const s = xs.reduce((a, b) => a + Math.abs(b), 0) || 1;
  return xs.map((x) => x / s);
}

function scaleByMaxAbs(xs) {
  const m = Math.max(1e-9, ...xs.map((x) => Math.abs(x)));
  return xs.map((x) => x / m);
}

function drawCorrPropagation() {
  const canvas = document.getElementById("fig-corr");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);
  const padL = 44, padR = 18, padT = 18, padB = 30, gap = 18;
  const plotW = w - padL - padR;
  const plotH = (h - padT - padB - 2 * gap) / 3;
  const rxx = psdToCorr(inputPsd, 42);
  const hNorm = normalizeArea(corrImpulse);
  const hRev = hNorm.slice().reverse();
  const hh = scaleByMaxAbs(fullConvolve(hNorm, hRev));
  const ryy = scaleByMaxAbs(fullConvolve(rxx, hh));
  plotSeries(ctx, rxx, padL, padT, plotW, plotH, C.input, "input autocorrelation Rxx");
  plotSeries(ctx, hh, padL, padT + plotH + gap, plotW, plotH, C.system, "filter autocorrelation h * h-reversed");
  plotSeries(ctx, ryy, padL, padT + 2 * (plotH + gap), plotW, plotH, C.output, "output autocorrelation Ryy");

  const midY = padT + plotH + gap;
  const centerX = padL + plotW * 0.5;
  const step = Math.min(56, plotW / 8);
  ctx.fillStyle = C.systemFill;
  ctx.strokeStyle = C.system;
  ctx.lineWidth = 1.5;
  hNorm.forEach((v, i) => {
    const x = centerX + (i - (hNorm.length - 1) / 2) * step;
    const y0 = midY + plotH * 0.5;
    const y1 = y0 - v * plotH * 1.8;
    ctx.beginPath();
    ctx.moveTo(x, y0);
    ctx.lineTo(x, y1);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y1, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });
  document.getElementById("fig-corr-readout").innerHTML =
    `<div class="row"><span class="lbl">impulse response taps</span><span>[${hNorm.map((x) => x.toFixed(2)).join(", ")}]</span></div>` +
    `<div class="row"><span class="lbl">time-domain rule</span><span>Ryy = Rxx * h * h-reversed</span></div>`;
}

function drawFig1() {
  const canvas = document.getElementById("fig1");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const inputKind = document.getElementById("fig1-input").value;
  const filterKind = document.getElementById("fig1-filter").value;
  const x = generateInput(inputKind, 260);
  const hResp = impulseResponse(filterKind);
  const y = normalize(convolveSame(x, hResp));
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);
  const padL = 42, padR = 16, padT = 18, padB = 26, gap = 18;
  const plotW = w - padL - padR;
  const plotH = (h - padT - padB - 2 * gap) / 3;
  plotSeries(ctx, x, padL, padT, plotW, plotH, C.input, "input realization x[n]");
  plotSeries(ctx, hResp, padL, padT + plotH + gap, plotW, plotH, C.system, "impulse response h[n]");
  plotSeries(ctx, y, padL, padT + 2 * (plotH + gap), plotW, plotH, C.output, "output realization y[n] = x*h");
  document.getElementById("fig1-readout").innerHTML =
    `<div class="row"><span class="lbl">operation</span><span>same deterministic convolution applied to a random realization</span></div>` +
    `<div class="row"><span class="lbl">filter taps</span><span>${hResp.length}</span></div>`;
}

async function playFig1Audio(kind) {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  const ac = new AudioCtx();
  const duration = 1.4;
  const n = Math.floor(ac.sampleRate * duration);
  const inputKind = document.getElementById("fig1-input").value;
  const filterKind = document.getElementById("fig1-filter").value;
  const x = generateInput(inputKind, n, seed + Date.now() % 1000);
  const hResp = impulseResponse(filterKind);
  const y = normalize(convolveSame(x, hResp));
  const data = kind === "out" ? y : x;
  const buffer = ac.createBuffer(1, n, ac.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let i = 0; i < n; i++) {
    const fade = Math.min(1, i / 1200, (n - i) / 1200);
    channel[i] = 0.16 * fade * data[i];
  }
  const source = ac.createBufferSource();
  source.buffer = buffer;
  source.connect(ac.destination);
  source.start();
}

function drawFig2() {
  const canvas = document.getElementById("fig2");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const strength = +document.getElementById("fig2-strength").value;
  document.getElementById("fig2-strength-v").textContent = strength.toFixed(2);
  document.querySelectorAll("[data-fig2-filter]").forEach((button) => {
    button.classList.toggle("active", button.dataset.fig2Filter === dualFilter);
  });
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);
  const padL = 42, padR = 16, padT = 18, padB = 30, colGap = 20, rowGap = 26;
  const plotW = (w - padL - padR - 2 * colGap) / 3;
  const plotH = (h - padT - padB - rowGap) / 2;
  const n = 120;
  const sIn = [], h2 = [], sOut = [];
  for (let i = 0; i < n; i++) {
    const omega = Math.PI * i / (n - 1);
    const sx = inputPsd(omega);
    const g = gain(dualFilter, omega, strength);
    sIn.push(sx);
    h2.push(g);
    sOut.push(sx * g);
  }
  const rIn = psdToCorr(inputPsd, 48);
  const hh = psdToCorr((omega) => gain(dualFilter, omega, strength), 48);
  const rOut = psdToCorr((omega) => inputPsd(omega) * gain(dualFilter, omega, strength), 48);
  const top = [sIn, h2, sOut];
  const bot = [rIn, hh, rOut];
  const labelsTop = ["input Sxx", "filter |H|^2", "output Syy"];
  const labelsBot = ["input Rxx", "filter h*h-reversed", "output Ryy"];
  const colors = [C.input, C.system, C.output];
  const fills = [C.inputFill, C.systemFill, C.outputFill];
  for (let col = 0; col < 3; col++) {
    const x0 = padL + col * (plotW + colGap);
    plotPositive(ctx, top[col], x0, padT, plotW, plotH, colors[col], fills[col], labelsTop[col]);
    plotSeries(ctx, bot[col], x0, padT + plotH + rowGap, plotW, plotH, colors[col], labelsBot[col]);
  }
  const inPower = sIn.reduce((a, b) => a + b, 0) / sIn.length;
  const outPower = sOut.reduce((a, b) => a + b, 0) / sOut.length;
  document.getElementById("fig2-readout").innerHTML =
    `<div class="row"><span class="lbl">frequency rule</span><span>Syy = |H|^2 Sxx</span></div>` +
    `<div class="row"><span class="lbl">time rule</span><span>Ryy = Rxx * h * h-reversed</span></div>` +
    `<div class="row"><span class="lbl">relative power</span><span>${(outPower / inPower).toFixed(3)}</span></div>`;
}

function drawFig3() {
  const canvas = document.getElementById("fig3");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const a = +document.getElementById("fig3-a").value;
  document.getElementById("fig3-a-v").textContent = a.toFixed(2);
  const rand = mulberry32(3000 + seed);
  const xs = [];
  let x = 0;
  for (let i = 0; i < 260; i++) {
    x = a * x + randn(rand);
    xs.push(x);
  }
  const r = [];
  for (let lag = -60; lag <= 60; lag++) r.push(Math.pow(Math.abs(a), Math.abs(lag)) * (a < 0 && Math.abs(lag) % 2 ? -1 : 1));
  const psd = [];
  for (let i = 0; i < 120; i++) {
    const omega = Math.PI * i / 119;
    psd.push(1 / (1 + a * a - 2 * a * Math.cos(omega)));
  }
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);
  const padL = 42, padR = 16, padT = 18, padB = 28, gap = 20;
  const plotW = (w - padL - padR - 2 * gap) / 3;
  const plotH = h - padT - padB;
  plotSeries(ctx, normalize(xs), padL, padT, plotW, plotH, C.input, "sample path");
  plotSeries(ctx, r, padL + plotW + gap, padT, plotW, plotH, C.output, "Rxx[k] = proportional to a^|k|");
  plotPositive(ctx, psd, padL + 2 * (plotW + gap), padT, plotW, plotH, C.purple, "rgba(107,69,146,0.22)", "PSD");
  document.getElementById("fig3-readout").innerHTML =
    `<div class="row"><span class="lbl">model</span><span>X[n] = ${a.toFixed(2)} X[n-1] + W[n]</span></div>` +
    `<div class="row"><span class="lbl">behavior</span><span>${a > 0.55 ? "persistent / low-frequency heavy" : a < -0.35 ? "alternating / high-frequency heavy" : "short memory / nearly white"}</span></div>`;
}

function runningStats(xs, window = 48) {
  const means = [], lag1 = [];
  for (let i = 0; i <= xs.length - window; i++) {
    const chunk = xs.slice(i, i + window);
    const mean = chunk.reduce((a, b) => a + b, 0) / chunk.length;
    means.push(mean);
    let num = 0, den = 0;
    for (let j = 0; j < chunk.length - 1; j++) num += (chunk[j] - mean) * (chunk[j + 1] - mean);
    for (let j = 0; j < chunk.length; j++) den += (chunk[j] - mean) ** 2;
    lag1.push(num / (den || 1));
  }
  return { means, lag1 };
}

function drawFig4() {
  const canvas = document.getElementById("fig4");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  document.querySelectorAll("[data-fig4-mode]").forEach((button) => {
    button.classList.toggle("active", button.dataset.fig4Mode === stationarityMode);
  });
  const x = generateInput("ar", 360, seed + 900);
  const yLin = normalize(convolveSame(x, impulseResponse("box")));
  const y = stationarityMode === "tanh" ? yLin.map((v) => Math.tanh(1.4 * v)) :
    stationarityMode === "square" ? normalize(yLin.map((v) => v * v)) : yLin;
  const stats = runningStats(y);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);
  const padL = 42, padR = 16, padT = 18, padB = 28, gap = 18;
  const plotW = w - padL - padR;
  const plotH = (h - padT - padB - 2 * gap) / 3;
  plotSeries(ctx, y, padL, padT, plotW, plotH, C.output, "output realization");
  plotSeries(ctx, stats.means, padL, padT + plotH + gap, plotW, plotH, C.input, "running mean");
  plotSeries(ctx, stats.lag1, padL, padT + 2 * (plotH + gap), plotW, plotH, C.purple, "running lag-1 autocorrelation");
  const meanRange = Math.max(...stats.means) - Math.min(...stats.means);
  const lagRange = Math.max(...stats.lag1) - Math.min(...stats.lag1);
  document.getElementById("fig4-readout").innerHTML =
    `<div class="row"><span class="lbl">mode</span><span>${stationarityMode}</span></div>` +
    `<div class="row"><span class="lbl">running mean range</span><span>${meanRange.toFixed(3)}</span></div>` +
    `<div class="row"><span class="lbl">running lag-1 range</span><span>${lagRange.toFixed(3)}</span></div>`;
}

function redrawAll() {
  drawFig1();
  drawCorrPropagation();
  drawFig2();
  drawFig3();
  drawFig4();
}

document.getElementById("fig1-input")?.addEventListener("change", drawFig1);
document.getElementById("fig1-filter")?.addEventListener("change", drawFig1);
document.getElementById("fig1-resample")?.addEventListener("click", () => { seed += 1; redrawAll(); });
document.getElementById("fig1-audio-in")?.addEventListener("click", () => playFig1Audio("in"));
document.getElementById("fig1-audio-out")?.addEventListener("click", () => playFig1Audio("out"));
document.querySelectorAll("[data-fig-corr-preset]").forEach((button) => {
  button.addEventListener("click", () => {
    const preset = button.dataset.figCorrPreset;
    if (preset === "narrow") corrImpulse = [0.02, 0.10, 0.76, 0.10, 0.02];
    else if (preset === "two-lobe") corrImpulse = [0.28, -0.10, 0.46, -0.10, 0.28];
    else corrImpulse = [0.10, 0.22, 0.36, 0.22, 0.10];
    drawCorrPropagation();
  });
});
document.getElementById("fig-corr")?.addEventListener("pointerdown", (event) => {
  const canvas = event.currentTarget;
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const padL = 44, padR = 18, padT = 18, padB = 30, gap = 18;
  const plotW = rect.width - padL - padR;
  const plotH = (rect.height - padT - padB - 2 * gap) / 3;
  const midY = padT + plotH + gap;
  const centerX = padL + plotW * 0.5;
  const step = Math.min(56, plotW / 8);
  corrDragIndex = corrImpulse.findIndex((_, i) => {
    const hx = centerX + (i - (corrImpulse.length - 1) / 2) * step;
    return Math.abs(x - hx) < 16 && y >= midY && y <= midY + plotH;
  });
  if (corrDragIndex >= 0) canvas.setPointerCapture(event.pointerId);
});
document.getElementById("fig-corr")?.addEventListener("pointermove", (event) => {
  if (corrDragIndex < 0) return;
  const rect = event.currentTarget.getBoundingClientRect();
  const y = event.clientY - rect.top;
  const padT = 18, padB = 30, gap = 18;
  const plotH = (rect.height - padT - padB - 2 * gap) / 3;
  const midY = padT + plotH + gap;
  const y0 = midY + plotH * 0.5;
  corrImpulse[corrDragIndex] = Math.max(-0.35, Math.min(0.9, (y0 - y) / (plotH * 1.8)));
  drawCorrPropagation();
});
document.getElementById("fig-corr")?.addEventListener("pointerup", () => { corrDragIndex = -1; });
document.getElementById("fig-corr")?.addEventListener("pointercancel", () => { corrDragIndex = -1; });
document.getElementById("fig2-strength")?.addEventListener("input", drawFig2);
document.querySelectorAll("[data-fig2-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    dualFilter = button.dataset.fig2Filter;
    drawFig2();
  });
});
document.getElementById("fig3-a")?.addEventListener("input", drawFig3);
document.querySelectorAll("[data-fig3-a]").forEach((button) => {
  button.addEventListener("click", () => {
    document.getElementById("fig3-a").value = button.dataset.fig3A;
    drawFig3();
  });
});
document.querySelectorAll("[data-fig4-mode]").forEach((button) => {
  button.addEventListener("click", () => {
    stationarityMode = button.dataset.fig4Mode;
    drawFig4();
  });
});
document.getElementById("fig4-resample")?.addEventListener("click", () => { seed += 1; drawFig4(); });
window.addEventListener("resize", redrawAll);

redrawAll();

// ─────────── Figure 4b: running summaries for W.S.S. checks ───────────
(function figWssSummaries() {
  const canvas = document.getElementById("fig4-wss");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const readout = document.getElementById("fig4-wss-readout");
  let mode = "linear";
  function series() {
    const rand = mulberry32(8800 + seed * 19);
    const x = [];
    let a = 0;
    for (let i = 0; i < 260; i++) { a = 0.8 * a + randn(rand) * 0.65; x.push(a); }
    const lin = convolveSame(x, [0.12, 0.22, 0.32, 0.22, 0.12]);
    const non = mode === "square" ? lin.map((v) => v * v) : mode === "threshold" ? lin.map((v) => v > 0 ? 1 : -1) : lin;
    return { lin: normalize(lin), non: normalize(non) };
  }
  function running(xs, win = 42) {
    const means = [], vars = [];
    for (let i = 0; i <= xs.length - win; i++) {
      const chunk = xs.slice(i, i + win);
      const m = chunk.reduce((a, b) => a + b, 0) / win;
      means.push(m);
      vars.push(chunk.reduce((a, b) => a + (b - m) ** 2, 0) / win);
    }
    return { means, vars };
  }
  function drawLineLocal(vals, x0, y0, ww, hh, color, maxAbs = 1) {
    ctx.beginPath();
    vals.forEach((v, i) => {
      const x = x0 + i / (vals.length - 1) * ww;
      const y = y0 + hh / 2 - v / maxAbs * hh * 0.42;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color; ctx.lineWidth = 1.8; ctx.stroke();
  }
  function draw() {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
    const { lin, non } = series();
    const a = running(lin), b = running(non);
    const panels: [number, number, number, number, string][] = [[50, 30, w - 100, 115, "running mean"], [50, 185, w - 100, 115, "running variance"]];
    panels.forEach(([x, y, ww, hh, label]) => { drawAxes(ctx, x, y, ww, hh, 8, true); ctx.fillStyle = C.textDim; ctx.font = "11px -apple-system, sans-serif"; ctx.fillText(label, x + 8, y + 14); });
    drawLineLocal(a.means, panels[0][0], panels[0][1], panels[0][2], panels[0][3], C.input, 1.2);
    drawLineLocal(b.means, panels[0][0], panels[0][1], panels[0][2], panels[0][3], C.output, 1.2);
    drawLineLocal(a.vars.map((v) => v - 1), panels[1][0], panels[1][1], panels[1][2], panels[1][3], C.input, 1.2);
    drawLineLocal(b.vars.map((v) => v - 1), panels[1][0], panels[1][1], panels[1][2], panels[1][3], C.output, 1.2);
    const drift = Math.max(...b.means) - Math.min(...b.means);
    readout.innerHTML = `<div class="row"><span class="lbl">selected output</span><span>${mode}</span></div><div class="row"><span class="lbl">running-mean drift</span><span>${drift.toFixed(3)} over local windows</span></div>`;
  }
  document.querySelectorAll("[data-fig4-wss-mode]").forEach((button) => button.addEventListener("click", () => {
    mode = button.dataset.fig4WssMode;
    document.querySelectorAll("[data-fig4-wss-mode]").forEach((b) => b.classList.toggle("active", b === button));
    draw();
  }));
  document.getElementById("fig4-wss-resample").addEventListener("click", () => { seed++; draw(); });
  draw();
})();
