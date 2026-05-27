const C = {
  bg: "#ffffff",
  grid: "#e3ddd0",
  axis: "#5a6577",
  text: "#1f2733",
  textDim: "#5a6577",
  r: "#b8412a",
  s: "#1f4a8c",
  sFill: "rgba(31,74,140,0.22)",
  h: "#2d7a3e",
  out: "#b8412a",
  purple: "#6b4592",
  orange: "#d4690a",
};

const state = {
  preset: "lowpass",
  width: 0.55,
  center: 0,
  phases: [],
  periodSeed: 1,
  wssVariant: 0,
};

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

function mulberry32(seed) {
  let t = seed >>> 0;
  return function next() {
    t += 0x6D2B79F5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(x, mu, sigma) {
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z);
}

function psdAt(w, preset = state.preset, width = state.width, center = state.center) {
  const aw = Math.abs(w);
  if (preset === "white") return 1;
  if (preset === "ou") return 1 / (1 + (aw / Math.max(0.12, width)) ** 2);
  if (preset === "tone") return 0.08 + gaussian(aw, Math.max(0.25, center || 1.45), Math.max(0.06, width * 0.16));
  if (preset === "bandpass") return 0.04 + gaussian(aw, Math.max(0.25, center || 1.35), Math.max(0.08, width * 0.30));
  return Math.exp(-0.5 * (aw / Math.max(0.12, width)) ** 2);
}

function normalizedSpectrum(n = 160, preset = state.preset, width = state.width, center = state.center) {
  const ws = [];
  const ss = [];
  let max = 0;
  for (let i = 0; i < n; i++) {
    const w = Math.PI * i / (n - 1);
    const s = psdAt(w, preset, width, center);
    ws.push(w);
    ss.push(s);
    max = Math.max(max, s);
  }
  return { ws, ss: ss.map((s) => s / max), raw: ss };
}

function autocorrFromSpectrum(maxLag = 80) {
  const { ws, ss } = normalizedSpectrum(220);
  const dW = Math.PI / (ws.length - 1);
  const r = [];
  for (let lag = -maxLag; lag <= maxLag; lag++) {
    let sum = 0;
    for (let i = 0; i < ws.length; i++) {
      const weight = i === 0 || i === ws.length - 1 ? 0.5 : 1;
      sum += weight * ss[i] * Math.cos(ws[i] * lag) * dW;
    }
    r.push(sum / Math.PI);
  }
  const r0 = r[maxLag] || 1;
  return r.map((v) => v / r0);
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

function path(ctx, xs, ys, stroke, fill, baseY) {
  ctx.beginPath();
  ys.forEach((v, i) => {
    if (i === 0) ctx.moveTo(xs[i], v); else ctx.lineTo(xs[i], v);
  });
  if (fill) {
    ctx.lineTo(xs[xs.length - 1], baseY);
    ctx.lineTo(xs[0], baseY);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  }
  ctx.beginPath();
  ys.forEach((v, i) => {
    if (i === 0) ctx.moveTo(xs[i], v); else ctx.lineTo(xs[i], v);
  });
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.8;
  ctx.stroke();
}

function randn(rand) {
  const u1 = Math.max(1e-9, rand());
  const u2 = rand();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function normalize(xs) {
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  const sd = Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / xs.length) || 1;
  return xs.map((x) => (x - mean) / sd);
}

function runningSummaries(xs, window = 44) {
  const means = [];
  const lagCorr = [];
  for (let i = 0; i <= xs.length - window; i++) {
    const chunk = xs.slice(i, i + window);
    const mean = chunk.reduce((a, b) => a + b, 0) / chunk.length;
    means.push(mean);
    let num = 0;
    let den = 0;
    for (let j = 0; j < chunk.length - 4; j++) num += (chunk[j] - mean) * (chunk[j + 4] - mean);
    for (const x of chunk) den += (x - mean) ** 2;
    lagCorr.push(num / (den || 1));
  }
  return { means, lagCorr };
}

function wssProcesses(n = 220) {
  const rand = mulberry32(8080 + state.periodSeed * 17 + state.wssVariant * 101);
  const wss = [];
  let x = 0;
  for (let i = 0; i < n; i++) {
    x = 0.82 * x + randn(rand) * 0.65;
    wss.push(x);
  }
  const non = [];
  const phase = rand() * Math.PI * 2;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const noise = randn(rand);
    if (state.wssVariant % 3 === 0) non.push(1.8 * (t - 0.5) + noise * 0.65);
    else if (state.wssVariant % 3 === 1) non.push(noise * (0.25 + 1.75 * t));
    else non.push(Math.sin(2 * Math.PI * 7 * t + phase) + 1.4 * (t - 0.5) + 0.25 * noise);
  }
  return { wss: normalize(wss), non: normalize(non) };
}

function drawMiniSeries(ctx, values, x, y, w, h, color, label, fixedScale = 1) {
  drawAxes(ctx, x, y, w, h, 4, false);
  const maxAbs = Math.max(fixedScale, ...values.map((v) => Math.abs(v)));
  const xs = [], ys = [];
  values.forEach((v, i) => {
    xs.push(x + (i / (values.length - 1)) * w);
    ys.push(y + h * 0.5 - (v / maxAbs) * h * 0.38);
  });
  ctx.strokeStyle = C.axis;
  ctx.beginPath();
  ctx.moveTo(x, y + h * 0.5);
  ctx.lineTo(x + w, y + h * 0.5);
  ctx.stroke();
  path(ctx, xs, ys, color, null, y + h * 0.5);
  ctx.fillStyle = C.textDim;
  ctx.font = "10px -apple-system, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(label, x + 4, y + 3);
}

function drawFigure0() {
  const canvas = document.getElementById("fig0");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const { wss, non } = wssProcesses();
  const wssStats = runningSummaries(wss);
  const nonStats = runningSummaries(non);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);
  const padL = 40, padR = 16, padT = 28, padB = 28, gap = 26;
  const colW = (w - padL - padR - gap) / 2;
  const rowH = (h - padT - padB - 28) / 3;
  const rows = [
    ["sample path", wss, non, 1],
    ["running mean", wssStats.means, nonStats.means, 1.1],
    ["running lag-4 autocorr", wssStats.lagCorr, nonStats.lagCorr, 0.65],
  ];
  ctx.fillStyle = C.text;
  ctx.font = "600 12px -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("W.S.S.: summaries stay level", padL + colW / 2, 12);
  ctx.fillText("not W.S.S.: summaries drift or swell", padL + colW + gap + colW / 2, 12);
  for (let r = 0; r < rows.length; r++) {
    const y = padT + r * (rowH + 14);
    drawMiniSeries(ctx, rows[r][1], padL, y, colW, rowH, r === 0 ? C.s : C.purple, rows[r][0], rows[r][3]);
    drawMiniSeries(ctx, rows[r][2], padL + colW + gap, y, colW, rowH, r === 0 ? C.r : C.purple, rows[r][0], rows[r][3]);
  }
  const variant = ["linear drift", "time-varying variance", "tone on a ramp"][state.wssVariant % 3];
  const meanRange = Math.max(...nonStats.means) - Math.min(...nonStats.means);
  const corrRange = Math.max(...nonStats.lagCorr) - Math.min(...nonStats.lagCorr);
  document.getElementById("fig0-readout").innerHTML =
    `<div class="row"><span class="lbl">non-W.S.S. example</span><span>${variant}</span></div>` +
    `<div class="row"><span class="lbl">running mean range</span><span>${meanRange.toFixed(3)}</span></div>` +
    `<div class="row"><span class="lbl">running autocorrelation range</span><span>${corrRange.toFixed(3)}</span></div>`;
}

function synthPath(n = 256, seed = 1, spectrumScale = (w) => psdAt(w)) {
  const rand = mulberry32(seed);
  const modes = 80;
  const phases = Array.from({ length: modes }, () => rand() * 2 * Math.PI);
  const samples = [];
  for (let t = 0; t < n; t++) {
    let x = 0;
    for (let k = 1; k <= modes; k++) {
      const w = Math.PI * k / modes;
      const amp = Math.sqrt(Math.max(0, spectrumScale(w))) / Math.sqrt(modes);
      x += amp * Math.cos(w * t + phases[k - 1]);
    }
    samples.push(x);
  }
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
  const sd = Math.sqrt(samples.reduce((a, b) => a + (b - mean) ** 2, 0) / samples.length) || 1;
  return samples.map((v) => (v - mean) / sd);
}

function setPreset(name) {
  state.preset = name;
  if (name === "white") { state.width = 1.8; state.center = 0; }
  if (name === "lowpass") { state.width = 0.55; state.center = 0; }
  if (name === "ou") { state.width = 0.45; state.center = 0; }
  if (name === "tone") { state.width = 0.35; state.center = 1.45; }
  if (name === "bandpass") { state.width = 0.70; state.center = 1.35; }
  document.getElementById("fig1-width").value = state.width;
  document.getElementById("fig1-center").value = state.center;
  redrawAll();
}

function updatePresetButtons() {
  document.querySelectorAll("[data-fig1-preset]").forEach((button) => {
    button.classList.toggle("active", button.dataset.fig1Preset === state.preset);
  });
}

function drawFigure1() {
  const canvas = document.getElementById("fig1");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const widthV = document.getElementById("fig1-width-v");
  const centerV = document.getElementById("fig1-center-v");
  widthV.textContent = state.width.toFixed(2);
  centerV.textContent = state.center.toFixed(2);
  updatePresetButtons();

  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);
  const padL = 44, padR = 16, padT = 18, padB = 32, gap = 24;
  const plotW = w - padL - padR;
  const plotH = (h - padT - padB - gap) / 2;
  const topY = padT, botY = padT + plotH + gap;
  drawAxes(ctx, padL, topY, plotW, plotH, 8);
  drawAxes(ctx, padL, botY, plotW, plotH, 8);

  const r = autocorrFromSpectrum(80);
  const rXs = [], rYs = [];
  r.forEach((v, i) => {
    const x = padL + (i / (r.length - 1)) * plotW;
    const y = topY + plotH * 0.50 - v * plotH * 0.42;
    rXs.push(x); rYs.push(y);
  });
  ctx.strokeStyle = C.axis;
  ctx.beginPath();
  ctx.moveTo(padL, topY + plotH * 0.50);
  ctx.lineTo(padL + plotW, topY + plotH * 0.50);
  ctx.stroke();
  path(ctx, rXs, rYs, C.r, null, topY + plotH * 0.50);

  const { ws, ss } = normalizedSpectrum(180);
  const sXs = [], sYs = [];
  ws.forEach((omega, i) => {
    const x = padL + (omega / Math.PI) * plotW;
    const y = botY + plotH - ss[i] * plotH * 0.86;
    sXs.push(x); sYs.push(y);
  });
  path(ctx, sXs, sYs, C.s, C.sFill, botY + plotH);

  ctx.fillStyle = C.textDim;
  ctx.font = "11px -apple-system, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("autocorrelation R(tau)", padL + 4, topY + 3);
  ctx.fillText("power spectral density S(omega)", padL + 4, botY + 3);
  ctx.textAlign = "center";
  ctx.fillText("-lag", padL + 18, topY + plotH + 5);
  ctx.fillText("+lag", padL + plotW - 18, topY + plotH + 5);
  ctx.fillText("0", padL, botY + plotH + 5);
  ctx.fillText("pi", padL + plotW, botY + plotH + 5);

  const r0 = r[Math.floor(r.length / 2)];
  const corr10 = r[Math.floor(r.length / 2) + 10];
  document.getElementById("fig1-readout").innerHTML =
    `<div class="row"><span class="lbl">preset</span><span>${state.preset}</span></div>` +
    `<div class="row"><span class="lbl">total power R(0)</span><span>${r0.toFixed(3)} after normalization</span></div>` +
    `<div class="row"><span class="lbl">lag-10 correlation</span><span>${corr10.toFixed(3)}</span></div>`;
}

function drawFigure2() {
  const canvas = document.getElementById("fig2");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);
  const padL = 36, padR = 16, padT = 18, padB = 22;
  const plotW = w - padL - padR;
  const rowH = (h - padT - padB) / 5;
  drawAxes(ctx, padL, padT, plotW, h - padT - padB, 8, false);
  for (let j = 0; j < 5; j++) {
    const series = synthPath(260, 1000 + state.periodSeed * 17 + j * 41);
    const base = padT + rowH * (j + 0.5);
    const xs = [], ys = [];
    series.forEach((v, i) => {
      xs.push(padL + (i / (series.length - 1)) * plotW);
      ys.push(base - v * rowH * 0.25);
    });
    path(ctx, xs, ys, j === 0 ? C.r : C.s, null, base);
    ctx.strokeStyle = C.grid;
    ctx.beginPath();
    ctx.moveTo(padL, base);
    ctx.lineTo(padL + plotW, base);
    ctx.stroke();
  }
  ctx.fillStyle = C.textDim;
  ctx.font = "11px -apple-system, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("five independent realizations with the same PSD", padL + 4, padT + 3);
  document.getElementById("fig2-readout").innerHTML =
    `<div class="row"><span class="lbl">shared spectrum</span><span>${state.preset}</span></div>` +
    `<div class="row"><span class="lbl">texture</span><span>${state.preset === "white" ? "rough at every scale" : state.center > 0.4 ? "oscillatory / narrow-band" : "slowly varying / colored"}</span></div>`;
}

let filterKind = "low";

function filterGain(w) {
  const c = +document.getElementById("fig3-center").value;
  const bw = +document.getElementById("fig3-width").value;
  const aw = Math.abs(w);
  if (filterKind === "high") return 1 - Math.exp(-0.5 * (aw / Math.max(0.08, bw)) ** 2);
  if (filterKind === "band") return gaussian(aw, Math.max(0.12, c), Math.max(0.08, bw * 0.35));
  if (filterKind === "notch") return 1 - 0.92 * gaussian(aw, Math.max(0.12, c), Math.max(0.08, bw * 0.25));
  return Math.exp(-0.5 * (aw / Math.max(0.08, bw)) ** 2);
}

function drawFigure3() {
  const canvas = document.getElementById("fig3");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const c = +document.getElementById("fig3-center").value;
  const bw = +document.getElementById("fig3-width").value;
  document.getElementById("fig3-center-v").textContent = c.toFixed(2);
  document.getElementById("fig3-width-v").textContent = bw.toFixed(2);
  // Low-pass and high-pass gains depend only on bandwidth, not center.
  document.getElementById("fig3-center").disabled = filterKind === "low" || filterKind === "high";
  document.querySelectorAll("[data-fig3-filter]").forEach((button) => {
    button.classList.toggle("active", button.dataset.fig3Filter === filterKind);
  });

  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);
  const padL = 42, padR = 16, padT = 18, padB = 32, gap = 20;
  const plotW = (w - padL - padR - 2 * gap) / 3;
  const plotH = h - padT - padB;
  const labels = ["input Sxx", "filter |H|^2", "output Syy"];
  const colors = [C.s, C.h, C.out];
  const fills = [C.sFill, "rgba(45,122,62,0.20)", "rgba(184,65,42,0.22)"];
  const { ws, ss } = normalizedSpectrum(180);
  const curves = [
    ss,
    ws.map((omega) => filterGain(omega)),
    ws.map((omega, i) => ss[i] * filterGain(omega)),
  ];
  const outPower = curves[2].reduce((a, b) => a + b, 0) / curves[2].length;
  curves.forEach((curve, panel) => {
    const x0 = padL + panel * (plotW + gap);
    drawAxes(ctx, x0, padT, plotW, plotH, 4);
    const max = Math.max(1e-6, ...curve);
    const xs = [], ys = [];
    curve.forEach((v, i) => {
      xs.push(x0 + (i / (curve.length - 1)) * plotW);
      ys.push(padT + plotH - (v / max) * plotH * 0.84);
    });
    path(ctx, xs, ys, colors[panel], fills[panel], padT + plotH);
    ctx.fillStyle = C.textDim;
    ctx.font = "11px -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(labels[panel], x0 + 4, padT + 3);
  });
  document.getElementById("fig3-readout").innerHTML =
    `<div class="row"><span class="lbl">filter</span><span>${filterKind}</span></div>` +
    `<div class="row"><span class="lbl">rule</span><span>Syy(omega) = |H(omega)|^2 Sxx(omega)</span></div>` +
    `<div class="row"><span class="lbl">relative output power</span><span>${outPower.toFixed(3)}</span></div>`;
}

function dftPower(samples, bins = 64) {
  const out = [];
  for (let k = 0; k < bins; k++) {
    let re = 0, im = 0;
    for (let n = 0; n < samples.length; n++) {
      const a = -2 * Math.PI * k * n / samples.length;
      re += samples[n] * Math.cos(a);
      im += samples[n] * Math.sin(a);
    }
    out.push((re * re + im * im) / samples.length);
  }
  const max = Math.max(1e-6, ...out);
  return out.map((v) => v / max);
}

function drawFigure4() {
  const canvas = document.getElementById("fig4");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);
  const padL = 42, padR = 16, padT = 18, padB = 32, gap = 18;
  const plotW = (w - padL - padR - 2 * gap) / 3;
  const plotH = h - padT - padB;
  const lengths = [64, 256, 1024];
  const labels = ["N = 64", "N = 256", "N = 1024"];
  lengths.forEach((n, panel) => {
    const x0 = padL + panel * (plotW + gap);
    drawAxes(ctx, x0, padT, plotW, plotH, 4);
    const samples = synthPath(n, 5000 + state.periodSeed * 101);
    const pg = dftPower(samples, 64);
    const xs = [], ys = [];
    pg.forEach((v, i) => {
      xs.push(x0 + (i / (pg.length - 1)) * plotW);
      ys.push(padT + plotH - v * plotH * 0.72);
    });
    path(ctx, xs, ys, C.orange, "rgba(212,105,10,0.20)", padT + plotH);
    const trueSpec = normalizedSpectrum(64).ss;
    const tx = [], ty = [];
    trueSpec.forEach((v, i) => {
      tx.push(x0 + (i / (trueSpec.length - 1)) * plotW);
      ty.push(padT + plotH - v * plotH * 0.72);
    });
    path(ctx, tx, ty, C.s, null, padT + plotH);
    ctx.fillStyle = C.textDim;
    ctx.font = "11px -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(labels[panel], x0 + 4, padT + 3);
  });
  document.getElementById("fig4-readout").innerHTML =
    `<div class="row"><span class="lbl">blue</span><span>true PSD shape</span></div>` +
    `<div class="row"><span class="lbl">orange</span><span>periodogram from one finite realization</span></div>`;
}

function redrawAll() {
  drawFigure0();
  drawFigure1();
  drawFigure2();
  drawFigure3();
  drawFigure4();
}

async function playTexture() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  const ac = new AudioCtx();
  const duration = 1.5;
  const n = Math.floor(ac.sampleRate * duration);
  const data = synthPath(n, Date.now() % 100000, (w) => psdAt(w));
  const buffer = ac.createBuffer(1, n, ac.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let i = 0; i < n; i++) {
    const fade = Math.min(1, i / 1200, (n - i) / 1200);
    channel[i] = 0.18 * fade * data[i];
  }
  const source = ac.createBufferSource();
  source.buffer = buffer;
  source.connect(ac.destination);
  source.start();
}

document.getElementById("fig1-width")?.addEventListener("input", (event) => {
  state.width = +event.target.value;
  if (state.preset === "white") state.preset = "lowpass";
  redrawAll();
});
document.getElementById("fig1-center")?.addEventListener("input", (event) => {
  state.center = +event.target.value;
  if (state.center > 0.2 && state.preset !== "tone" && state.preset !== "bandpass") state.preset = "bandpass";
  redrawAll();
});
document.querySelectorAll("[data-fig1-preset]").forEach((button) => {
  button.addEventListener("click", () => setPreset(button.dataset.fig1Preset));
});
document.getElementById("fig0-swap")?.addEventListener("click", () => {
  state.wssVariant += 1;
  drawFigure0();
});
document.getElementById("fig0-resample")?.addEventListener("click", () => {
  state.periodSeed += 1;
  drawFigure0();
});
document.getElementById("fig2-resample")?.addEventListener("click", () => {
  state.periodSeed += 1;
  drawFigure0();
  drawFigure2();
  drawFigure4();
});
document.getElementById("fig2-audio")?.addEventListener("click", playTexture);
document.getElementById("fig3-center")?.addEventListener("input", drawFigure3);
document.getElementById("fig3-width")?.addEventListener("input", drawFigure3);
document.querySelectorAll("[data-fig3-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    filterKind = button.dataset.fig3Filter;
    if (filterKind === "low") {
      document.getElementById("fig3-center").value = 0;
      document.getElementById("fig3-width").value = 1;
    } else if (filterKind === "high") {
      document.getElementById("fig3-center").value = 0;
      document.getElementById("fig3-width").value = 0.9;
    } else if (filterKind === "band") {
      document.getElementById("fig3-center").value = 1.25;
      document.getElementById("fig3-width").value = 0.75;
    } else if (filterKind === "notch") {
      document.getElementById("fig3-center").value = 1.25;
      document.getElementById("fig3-width").value = 0.65;
    }
    drawFigure3();
  });
});
document.getElementById("fig4-resample")?.addEventListener("click", () => {
  state.periodSeed += 1;
  drawFigure4();
});
(function fig4Scrub() {
  const canvas = document.getElementById("fig4");
  if (!canvas) return;
  canvas.style.cursor = "ew-resize";
  let dragging = false, startX = 0, startSeed = 0;
  canvas.addEventListener("pointerdown", (e) => {
    dragging = true;
    startX = e.clientX;
    startSeed = state.periodSeed;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const next = Math.max(0, startSeed + Math.round((e.clientX - startX) / 6));
    if (next !== state.periodSeed) {
      state.periodSeed = next;
      drawFigure4();
    }
  });
  canvas.addEventListener("pointerup", () => { dragging = false; });
})();
window.addEventListener("resize", redrawAll);

setPreset("lowpass");

// ─────────── Figure 4b: Welch averaging and windows ───────────
(function figWelch() {
  const canvas = document.getElementById("fig4-welch");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const segIn = document.getElementById("fig4-welch-segments");
  const winIn = document.getElementById("fig4-welch-window");
  const segV = document.getElementById("fig4-welch-segments-v");
  const readout = document.getElementById("fig4-welch-readout");
  let seed = 90;
  function windowValue(i, n) {
    if (winIn.value === "hann") return 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (n - 1));
    if (winIn.value === "hamming") return 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (n - 1));
    return 1;
  }
  function sample(n) {
    const rand = mulberry32(seed);
    const xs = [];
    let a = 0, b = 0;
    for (let i = 0; i < n; i++) {
      a = 0.86 * a + randn(rand) * 0.45;
      b = 0.72 * b + randn(rand) * 0.55;
      xs.push(a + 0.65 * Math.sin(0.48 * i) + 0.5 * b);
    }
    return normalize(xs);
  }
  function dftPower(xs, bins = 96) {
    const n = xs.length;
    const out = [];
    let winPow = 0;
    for (let i = 0; i < n; i++) winPow += windowValue(i, n) ** 2;
    for (let k = 0; k < bins; k++) {
      let re = 0, im = 0;
      for (let i = 0; i < n; i++) {
        const win = windowValue(i, n);
        const a = -2 * Math.PI * k * i / n;
        re += xs[i] * win * Math.cos(a);
        im += xs[i] * win * Math.sin(a);
      }
      out.push((re * re + im * im) / Math.max(1, winPow));
    }
    const max = Math.max(...out, 1e-9);
    return out.map((v) => v / max);
  }
  function drawCurve(arr, x0, y0, ww, hh, color, width = 2) {
    ctx.beginPath();
    arr.forEach((v, i) => {
      const x = x0 + i / (arr.length - 1) * ww;
      const y = y0 + hh - v * hh;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
  }
  function draw() {
    const segments = +segIn.value;
    segV.textContent = String(segments);
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
    const x0 = 48, y0 = 26, ww = w - 90, hh = h - 70;
    drawAxes(ctx, x0, y0, ww, hh, 8, true);
    const xs = sample(768);
    const raw = dftPower(xs, 128);
    const segLen = Math.floor(xs.length / segments);
    const specs = [];
    for (let s = 0; s < segments; s++) specs.push(dftPower(xs.slice(s * segLen, s * segLen + segLen), 128));
    const welch = raw.map((_, i) => specs.reduce((sum, spec) => sum + spec[i], 0) / specs.length);
    const trueSpecRaw = raw.map((_, i) => {
      const f = i / raw.length * Math.PI;
      return 0.22 / (0.08 + f * f) + 0.75 * Math.exp(-0.5 * ((f - 0.48) / 0.08) ** 2);
    });
    const trueMax = Math.max(...trueSpecRaw, 1e-9);
    const trueSpec = trueSpecRaw.map((v) => v / trueMax);
    drawCurve(raw, x0, y0, ww, hh, C.s, 1.1);
    drawCurve(welch, x0, y0, ww, hh, C.h, 2.4);
    drawCurve(trueSpec, x0, y0, ww, hh, C.r, 2);
    const roughRaw = raw.slice(1).reduce((s, v, i) => s + Math.abs(v - raw[i]), 0) / raw.length;
    const roughWelch = welch.slice(1).reduce((s, v, i) => s + Math.abs(v - welch[i]), 0) / welch.length;
    readout.innerHTML = `<div class="row"><span class="lbl">variance tradeoff</span><span>Welch roughness ${roughWelch.toFixed(3)} vs raw ${roughRaw.toFixed(3)}</span></div><div class="row"><span class="lbl">window</span><span>${winIn.value} changes leakage before averaging</span></div>`;
  }
  [segIn, winIn].forEach((input) => input.addEventListener("input", draw));
  document.getElementById("fig4-welch-resample").addEventListener("click", () => { seed++; draw(); });
  draw();
})();

// ─────────── Figure 2b: Spectrogram lens ───────────
(function figSpectrogram() {
  const canvas = document.getElementById("fig-spectrogram");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const chirpIn = document.getElementById("spectrogram-chirp");
  const winIn = document.getElementById("spectrogram-window");
  const chirpV = document.getElementById("spectrogram-chirp-v");
  const winV = document.getElementById("spectrogram-window-v");
  const readout = document.getElementById("spectrogram-readout");
  let seedLocal = 250;
  function signal(n = 280) {
    const rand = mulberry32(seedLocal);
    const chirp = +chirpIn.value;
    const xs = [];
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const phase = 2 * Math.PI * (6 * t + 18 * chirp * t * t);
      xs.push(Math.sin(phase) + 0.35 * randn(rand));
    }
    return normalize(xs);
  }
  function draw() {
    const win = +winIn.value;
    chirpV.textContent = (+chirpIn.value).toFixed(2);
    winV.textContent = String(win);
    const xs = signal();
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
    const tx = 48, ty = 24, tw = w - 90, th = 82;
    drawAxes(ctx, tx, ty, tw, th, 8, false);
    drawMiniSeries(ctx, xs, tx, ty, tw, th, C.s, "sample path", 2.8);
    const sx = 48, sy = 130, sw = w - 90, sh = 190;
    ctx.strokeStyle = C.axis; ctx.strokeRect(sx, sy, sw, sh);
    const cols = 58, rows = 42;
    let maxP = 1e-9;
    const powers = [];
    for (let c = 0; c < cols; c++) {
      const center = Math.floor(c / (cols - 1) * (xs.length - 1));
      const start = Math.max(0, Math.min(xs.length - win, center - Math.floor(win / 2)));
      const chunk = xs.slice(start, start + win);
      powers[c] = [];
      for (let k = 1; k <= rows; k++) {
        let re = 0, im = 0;
        for (let i = 0; i < chunk.length; i++) {
          const hann = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (chunk.length - 1));
          const a = -2 * Math.PI * k * i / chunk.length;
          re += chunk[i] * hann * Math.cos(a);
          im += chunk[i] * hann * Math.sin(a);
        }
        const p = re * re + im * im;
        powers[c][k - 1] = p;
        maxP = Math.max(maxP, p);
      }
    }
    for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
      const t = Math.sqrt(powers[c][r] / maxP);
      const red = Math.round(248 - 64 * (1 - t));
      const green = Math.round(244 - 160 * t);
      const blue = Math.round(236 - 190 * t);
      ctx.fillStyle = `rgb(${red},${green},${blue})`;
      ctx.fillRect(sx + c / cols * sw, sy + sh - (r + 1) / rows * sh, sw / cols + 1, sh / rows + 1);
    }
    ctx.fillStyle = C.textDim; ctx.font = "11px -apple-system, sans-serif";
    ctx.fillText("time", sx + sw / 2, sy + sh + 22);
    ctx.save(); ctx.translate(sx - 28, sy + sh / 2); ctx.rotate(-Math.PI / 2); ctx.fillText("frequency", 0, 0); ctx.restore();
    readout.innerHTML = `<div class="row"><span class="lbl">third lens</span><span>PSD averages over time; spectrogram shows where frequency power occurs locally</span></div>`;
  }
  [chirpIn, winIn].forEach((input) => input.addEventListener("input", draw));
  document.getElementById("spectrogram-resample").addEventListener("click", () => { seedLocal++; draw(); });
  draw();
})();
