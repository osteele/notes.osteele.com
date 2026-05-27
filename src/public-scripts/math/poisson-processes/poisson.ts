const C = {
  bg: "#ffffff",
  grid: "#e3ddd0",
  axis: "#5a6577",
  text: "#1f2733",
  textDim: "#5a6577",
  red: "#b8412a",
  blue: "#1f4a8c",
  green: "#2d7a3e",
  orange: "#d4690a",
  purple: "#6b4592",
  gray: "#bfb9aa",
};

function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }
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
function seeded(seed) {
  let s = seed | 0;
  return () => {
    s = (1664525 * s + 1013904223) | 0;
    return (s >>> 0) / 4294967296;
  };
}
let seedCounter = 17;
function rng() { return seeded(++seedCounter * 9973); }
function expSample(rate, random) { return -Math.log(Math.max(1e-12, 1 - random())) / rate; }
function poissonPmf(k, mean) {
  let logFact = 0;
  for (let i = 2; i <= k; i++) logFact += Math.log(i);
  return Math.exp(k * Math.log(mean) - mean - logFact);
}
function simulateArrivals(rate, horizon, random) {
  const out = [];
  let t = 0;
  while (t < horizon) {
    t += expSample(rate, random);
    if (t <= horizon) out.push(t);
  }
  return out;
}
function simulateMany(rate, horizon, reps, random) {
  const waits = [];
  const counts = [];
  for (let r = 0; r < reps; r++) {
    const arrivals = simulateArrivals(rate, horizon, random);
    counts.push(arrivals.length);
    let prev = 0;
    for (const t of arrivals) {
      waits.push(t - prev);
      prev = t;
    }
  }
  return { waits, counts };
}
function clear(ctx, w, h) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);
}
function plotBox(ctx, x, y, w, h) {
  ctx.strokeStyle = C.axis;
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);
}
function label(ctx, text, x, y, color = C.textDim, align = "left") {
  ctx.fillStyle = color;
  ctx.font = "11px -apple-system, sans-serif";
  ctx.textAlign = align;
  ctx.textBaseline = "top";
  ctx.fillText(text, x, y);
}
function drawTimeline(ctx, arrivals, x, y, w, h, horizon, color = C.red) {
  plotBox(ctx, x, y, w, h);
  ctx.strokeStyle = C.grid;
  for (let i = 1; i < 5; i++) {
    const px = x + (i / 5) * w;
    ctx.beginPath(); ctx.moveTo(px, y); ctx.lineTo(px, y + h); ctx.stroke();
  }
  ctx.strokeStyle = C.axis;
  ctx.beginPath(); ctx.moveTo(x, y + h * 0.5); ctx.lineTo(x + w, y + h * 0.5); ctx.stroke();
  ctx.fillStyle = color;
  for (const t of arrivals) {
    const px = x + (t / horizon) * w;
    ctx.beginPath();
    ctx.moveTo(px, y + 8);
    ctx.lineTo(px - 4, y + 20);
    ctx.lineTo(px + 4, y + 20);
    ctx.closePath();
    ctx.fill();
  }
}
function drawHist(ctx, values, x, y, w, h, min, max, bins, color, pdfFn, labelText) {
  plotBox(ctx, x, y, w, h);
  const counts = new Array(bins).fill(0);
  for (const value of values) {
    const idx = Math.floor((value - min) / (max - min) * bins);
    if (idx >= 0 && idx < bins) counts[idx]++;
  }
  const binW = (max - min) / bins;
  const dens = counts.map(c => values.length ? c / (values.length * binW) : 0);
  let yMax = Math.max(1e-9, ...dens);
  if (pdfFn) {
    for (let i = 0; i <= 120; i++) {
      const xx = min + (i / 120) * (max - min);
      yMax = Math.max(yMax, pdfFn(xx));
    }
  }
  yMax *= 1.15;
  ctx.fillStyle = color;
  for (let i = 0; i < bins; i++) {
    const bh = dens[i] / yMax * h;
    ctx.fillRect(x + (i / bins) * w + 1, y + h - bh, Math.max(1, w / bins - 2), bh);
  }
  if (pdfFn) {
    ctx.strokeStyle = C.blue;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= 160; i++) {
      const xx = min + (i / 160) * (max - min);
      const px = x + (xx - min) / (max - min) * w;
      const py = y + h - pdfFn(xx) / yMax * h;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  label(ctx, labelText, x + 6, y + 5);
}
function drawCountHist(ctx, values, x, y, w, h, mean, labelText) {
  const maxK = Math.max(8, Math.max(...values, Math.ceil(mean + 4 * Math.sqrt(mean))));
  const counts = new Array(maxK + 1).fill(0);
  for (const value of values) if (value <= maxK) counts[value]++;
  const probs = counts.map(c => c / Math.max(1, values.length));
  let yMax = Math.max(...probs);
  for (let k = 0; k <= maxK; k++) yMax = Math.max(yMax, poissonPmf(k, mean));
  yMax *= 1.2;
  plotBox(ctx, x, y, w, h);
  const barW = w / (maxK + 1);
  ctx.fillStyle = "rgba(107,69,146,0.58)";
  for (let k = 0; k <= maxK; k++) {
    const bh = probs[k] / yMax * h;
    ctx.fillRect(x + k * barW + 1, y + h - bh, Math.max(1, barW - 2), bh);
  }
  ctx.fillStyle = "rgba(184,65,42,0.42)";
  for (let k = 0; k <= maxK; k++) {
    const bh = poissonPmf(k, mean) / yMax * h;
    ctx.fillRect(x + k * barW + barW * 0.35, y + h - bh, Math.max(1, barW * 0.3), bh);
  }
  label(ctx, labelText, x + 6, y + 5);
}
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}
function readout(id, rows) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = rows.map(([a, b]) => `<div class="row"><span class="lbl">${a}</span><span>${b}</span></div>`).join("");
}

(function timelineFigure() {
  const canvas = document.getElementById("fig-timeline");
  if (!canvas) return;
  const rateIn = document.getElementById("lambda");
  const winIn = document.getElementById("window");
  const repsIn = document.getElementById("reps");
  const reroll = document.getElementById("reroll");
  let random = rng();
  function draw() {
    const rate = +rateIn.value, horizon = +winIn.value, reps = +repsIn.value;
    setText("lambda-v", rate.toFixed(1)); setText("window-v", horizon.toFixed(1)); setText("reps-v", reps);
    const { ctx, w, h } = setupCanvas(canvas);
    clear(ctx, w, h);
    const arrivals = simulateArrivals(rate, horizon, random);
    drawTimeline(ctx, arrivals, 38, 32, w - 76, 72, horizon);
    label(ctx, `one realization: N(${horizon.toFixed(1)}) = ${arrivals.length}`, 44, 40, C.text);
    const sample = simulateMany(rate, horizon, reps, random);
    drawHist(ctx, sample.waits, 38, 150, (w - 92) / 2, 210, 0, Math.min(8 / rate, horizon), 26, "rgba(31,74,140,0.55)", x => rate * Math.exp(-rate * x), "interarrival times");
    drawCountHist(ctx, sample.counts, 54 + (w - 92) / 2, 150, (w - 92) / 2, 210, rate * horizon, `counts over T=${horizon.toFixed(1)}`);
    const mean = sample.counts.reduce((a, b) => a + b, 0) / sample.counts.length;
    const variance = sample.counts.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, sample.counts.length - 1);
    readout("timeline-readout", [
      ["theory", `interarrival Exp(${rate.toFixed(1)}), count Poisson(${(rate * horizon).toFixed(1)})`],
      ["sample count mean / dispersion", `${mean.toFixed(2)} / ${(variance / mean).toFixed(2)}`],
    ]);
  }
  [rateIn, winIn, repsIn].forEach(el => el.addEventListener("input", draw));
  reroll.addEventListener("click", () => { random = rng(); draw(); });
  draw();
})();

(function memorylessFigure() {
  const canvas = document.getElementById("fig-memoryless");
  if (!canvas) return;
  const rateIn = document.getElementById("mem-lambda");
  const sIn = document.getElementById("mem-s");
  function draw() {
    const rate = +rateIn.value, waited = +sIn.value;
    setText("mem-lambda-v", rate.toFixed(1)); setText("mem-s-v", waited.toFixed(1));
    const { ctx, w, h } = setupCanvas(canvas);
    clear(ctx, w, h);
    const x0 = 42, y0 = 28, plotW = w - 78, plotH = h - 70;
    plotBox(ctx, x0, y0, plotW, plotH);
    const maxX = Math.max(5 / rate, waited + 5 / rate);
    const yMax = rate * 1.1;
    const X = x => x0 + x / maxX * plotW;
    const Y = y => y0 + plotH - y / yMax * plotH;
    function path(offset, color, dash = []) {
      ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.setLineDash(dash); ctx.beginPath();
      for (let i = 0; i <= 180; i++) {
        const x = i / 180 * (maxX - offset);
        const px = X(offset + x), py = Y(rate * Math.exp(-rate * x));
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke(); ctx.setLineDash([]);
    }
    path(0, C.blue, [4, 4]);
    path(waited, C.red);
    ctx.strokeStyle = C.axis; ctx.beginPath(); ctx.moveTo(X(waited), y0); ctx.lineTo(X(waited), y0 + plotH); ctx.stroke();
    label(ctx, "fresh wait density", x0 + 8, y0 + 8, C.blue);
    label(ctx, "residual wait after s, shifted to start at s", X(waited) + 6, y0 + 26, C.red);
    readout("memoryless-readout", [["identity", `P(T > s + t | T > s) = exp(-lambda t), same as fresh survival`]]);
  }
  [rateIn, sIn].forEach(el => el.addEventListener("input", draw));
  draw();
})();

(function definitionsFigure() {
  const canvas = document.getElementById("fig-definitions");
  if (!canvas) return;
  const rateIn = document.getElementById("def-lambda");
  const hIn = document.getElementById("def-h");
  const reroll = document.getElementById("def-reroll");
  let random = rng();
  function draw() {
    const rate = +rateIn.value, step = +hIn.value, horizon = 6;
    setText("def-lambda-v", rate.toFixed(1)); setText("def-h-v", step.toFixed(2));
    const { ctx, w, h } = setupCanvas(canvas);
    clear(ctx, w, h);
    const arrivals = simulateArrivals(rate, horizon, random);
    drawTimeline(ctx, arrivals, 44, 42, w - 88, 56, horizon);
    label(ctx, `Axiomatic: N(${horizon}) = ${arrivals.length}; N(t) has Poisson(lambda t) margins`, 50, 50, C.text);
    const gx = 44, gy = 142, gw = w - 88, gh = 70, cells = Math.floor(horizon / step);
    plotBox(ctx, gx, gy, gw, gh);
    ctx.fillStyle = "rgba(31,74,140,0.28)";
    for (let i = 0; i < cells; i++) {
      const a = i * step, b = a + step;
      const hit = arrivals.some(t => t >= a && t < b);
      const x = gx + i / cells * gw, cw = gw / cells;
      if (hit) ctx.fillRect(x, gy + 8, Math.max(1, cw - 1), gh - 16);
    }
    label(ctx, `Infinitesimal grid: each small cell has event probability about lambda h = ${(rate * step).toFixed(2)}`, gx + 6, gy + 6, C.text);
    const sy = 258;
    plotBox(ctx, 44, sy, w - 88, 56);
    let prev = 0;
    ctx.fillStyle = C.purple;
    for (const t of arrivals) {
      const wait = t - prev;
      const x1 = 44 + prev / horizon * (w - 88), x2 = 44 + t / horizon * (w - 88);
      ctx.fillRect(x1, sy + 24, Math.max(1, x2 - x1), 10);
      ctx.fillStyle = C.red;
      ctx.beginPath(); ctx.arc(x2, sy + 29, 4, 0, 2 * Math.PI); ctx.fill();
      ctx.fillStyle = C.purple;
      prev = t;
      if (wait < 0) break;
    }
    label(ctx, "Time-centric: iid exponential waits laid end-to-end as arrival times S_i", 50, sy + 6, C.text);
    readout("definitions-readout", [["same realization", `${arrivals.length} arrivals, ${cells} Bernoulli grid cells, ${arrivals.length} exponential waits`]]);
  }
  [rateIn, hIn].forEach(el => el.addEventListener("input", draw));
  reroll.addEventListener("click", () => { random = rng(); draw(); });
  draw();
})();

(function operationsFigure() {
  const canvas = document.getElementById("fig-operations");
  if (!canvas) return;
  const l1In = document.getElementById("op-l1");
  const l2In = document.getElementById("op-l2");
  const pIn = document.getElementById("op-p");
  const reroll = document.getElementById("op-reroll");
  let random = rng();
  function draw() {
    const l1 = +l1In.value, l2 = +l2In.value, keep = +pIn.value, horizon = 6;
    setText("op-l1-v", l1.toFixed(1)); setText("op-l2-v", l2.toFixed(1)); setText("op-p-v", keep.toFixed(2));
    const { ctx, w, h } = setupCanvas(canvas);
    clear(ctx, w, h);
    const a = simulateArrivals(l1, horizon, random).map(t => ({ t, color: C.blue, kind: "a" }));
    const b = simulateArrivals(l2, horizon, random).map(t => ({ t, color: C.purple, kind: "b" }));
    const merged = [...a, ...b].sort((x, y) => x.t - y.t);
    const thinned = merged.filter(() => random() < keep);
    const catA = [], catB = [];
    for (const ev of merged) (random() < keep ? catA : catB).push(ev);
    const rows: [string, any[], string, string][] = [
      ["stream 1", a, C.blue, `rate ${l1.toFixed(1)}`],
      ["stream 2", b, C.purple, `rate ${l2.toFixed(1)}`],
      ["superposition", merged, C.red, `rate ${(l1 + l2).toFixed(1)}`],
      ["thinning", thinned, C.green, `rate ${(keep * (l1 + l2)).toFixed(1)}`],
      ["splitting", catA.map(e => ({ ...e, color: C.orange })).concat(catB.map(e => ({ ...e, color: C.gray }))), C.orange, `rates ${(keep * (l1 + l2)).toFixed(1)} and ${((1 - keep) * (l1 + l2)).toFixed(1)}`],
    ];
    rows.forEach((row, i) => {
      const y = 30 + i * 64;
      label(ctx, `${row[0]} (${row[3]})`, 42, y - 16, C.text);
      drawTimeline(ctx, row[1].map(e => e.t), 42, y, w - 84, 42, horizon, row[2]);
      if (row[0] === "splitting") {
        for (const ev of row[1]) {
          ctx.fillStyle = ev.color;
          const x = 42 + ev.t / horizon * (w - 84);
          ctx.beginPath(); ctx.arc(x, y + 21, 4, 0, 2 * Math.PI); ctx.fill();
        }
      }
    });
    readout("operations-readout", [
      ["superposition", `independent rates add: ${l1.toFixed(1)} + ${l2.toFixed(1)} = ${(l1 + l2).toFixed(1)}`],
      ["thinning / splitting", `keep probability p scales rates; category streams are independent Poisson processes`],
    ]);
  }
  [l1In, l2In, pIn].forEach(el => el.addEventListener("input", draw));
  reroll.addEventListener("click", () => { random = rng(); draw(); });
  draw();
})();

(function diagnosticsFigure() {
  const canvas = document.getElementById("fig-diagnostics");
  if (!canvas) return;
  const scenarioIn = document.getElementById("diag-scenario");
  const rateIn = document.getElementById("diag-lambda");
  const reroll = document.getElementById("diag-reroll");
  let random = rng();
  function waitsForScenario(rate, scenario, n, random) {
    const waits = [];
    for (let i = 0; i < n; i++) {
      if (scenario === "poisson") waits.push(expSample(rate, random));
      else if (scenario === "bursty") waits.push(expSample(random() < 0.72 ? rate * 4 : rate * 0.25, random));
      else waits.push(Math.max(0.001, 1 / rate + (random() - 0.5) * 0.35 / rate));
    }
    return waits;
  }
  function draw() {
    const rate = +rateIn.value, scenario = scenarioIn.value;
    setText("diag-lambda-v", rate.toFixed(1));
    setText("diag-scenario-v", scenarioIn.options[scenarioIn.selectedIndex].text);
    const { ctx, w, h } = setupCanvas(canvas);
    clear(ctx, w, h);
    const waits = waitsForScenario(rate, scenario, 650, random).sort((a, b) => a - b);
    const maxQ = Math.min(Math.max(...waits), 6 / rate);
    const qx = 46, qy = 34, qw = (w - 110) / 2, qh = 260;
    plotBox(ctx, qx, qy, qw, qh);
    ctx.strokeStyle = C.grid;
    for (let i = 1; i < 5; i++) {
      ctx.beginPath(); ctx.moveTo(qx, qy + i / 5 * qh); ctx.lineTo(qx + qw, qy + i / 5 * qh); ctx.stroke();
    }
    ctx.strokeStyle = C.axis; ctx.beginPath(); ctx.moveTo(qx, qy + qh); ctx.lineTo(qx + qw, qy); ctx.stroke();
    ctx.fillStyle = C.red;
    waits.forEach((wait, i) => {
      if (i % 4 !== 0) return;
      const p = (i + 0.5) / waits.length;
      const theory = -Math.log(1 - p) / rate;
      const px = qx + theory / maxQ * qw, py = qy + qh - wait / maxQ * qh;
      ctx.beginPath(); ctx.arc(px, py, 1.5, 0, 2 * Math.PI); ctx.fill();
    });
    label(ctx, "Q-Q: exponential theory vs observed waits", qx + 6, qy + 6, C.text);

    const horizon = 1, windows = [];
    let t = 0, count = 0;
    for (const wait of waits) {
      t += wait;
      while (t > (windows.length + 1) * horizon) {
        windows.push(count);
        count = 0;
      }
      count++;
    }
    while (windows.length < 120) windows.push(0);
    const mean = windows.reduce((a, b) => a + b, 0) / windows.length;
    const variance = windows.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, windows.length - 1);
    drawCountHist(ctx, windows, qx + qw + 32, qy, qw, qh, Math.max(0.1, mean), "unit-window counts");
    const dispersion = variance / Math.max(1e-9, mean);
    const verdict = Math.abs(dispersion - 1) < 0.25 ? "near Poisson" : dispersion > 1 ? "overdispersed / clustered" : "underdispersed / too regular";
    readout("diagnostics-readout", [
      ["dispersion index Var/Mean", `${dispersion.toFixed(2)} (${verdict})`],
      ["Q-Q reading", `Poisson waits should sit near the diagonal; curvature flags non-exponential waits`],
    ]);
  }
  [scenarioIn, rateIn].forEach(el => {
    el.addEventListener("input", draw);
    el.addEventListener("change", draw);
  });
  reroll.addEventListener("click", () => { random = rng(); draw(); });
  draw();
})();

(function processGallery() {
  const canvas = document.getElementById("fig-gallery");
  if (!canvas) return;
  const button = document.getElementById("gallery-reroll");
  let random = rng();
  function draw() {
    const rate = +(document.getElementById("lambda")?.value || 2);
    const horizon = +(document.getElementById("window")?.value || 5);
    const { ctx, w, h } = setupCanvas(canvas);
    clear(ctx, w, h);
    const padL = 34, padR = 16, padT = 16, rowH = (h - 32) / 5;
    for (let row = 0; row < 5; row++) {
      const y = padT + row * rowH + rowH * 0.5;
      ctx.strokeStyle = C.grid;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(w - padR, y);
      ctx.stroke();
      const arrivals = simulateArrivals(rate, horizon, random);
      ctx.fillStyle = C.red;
      for (const t of arrivals) {
        const x = padL + (t / horizon) * (w - padL - padR);
        ctx.beginPath();
        ctx.arc(x, y, 3.2, 0, 2 * Math.PI);
        ctx.fill();
      }
      label(ctx, `path ${row + 1}`, 6, y - 7, C.textDim);
    }
    readout("gallery-readout", [
      ["ensemble cue", "same rate, five independent realizations"],
      ["rate × window", `${(rate * horizon).toFixed(1)} expected events per row`],
    ]);
  }
  button?.addEventListener("click", () => { random = rng(); draw(); });
  document.getElementById("lambda")?.addEventListener("input", draw);
  document.getElementById("window")?.addEventListener("input", draw);
  draw();
})();

window.addEventListener("resize", () => {
  document.querySelectorAll("input, select").forEach(el => el.dispatchEvent(new Event("input")));
});

function drawPoissonAxes(ctx, x, y, w, h, verticals = 8, horizontals = 4) {
  ctx.strokeStyle = C.grid;
  for (let i = 0; i <= verticals; i++) {
    const px = x + i / verticals * w;
    ctx.beginPath(); ctx.moveTo(px, y); ctx.lineTo(px, y + h); ctx.stroke();
  }
  for (let i = 0; i <= horizontals; i++) {
    const py = y + i / horizontals * h;
    ctx.beginPath(); ctx.moveTo(x, py); ctx.lineTo(x + w, py); ctx.stroke();
  }
  ctx.strokeStyle = C.axis; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + h); ctx.lineTo(x + w, y + h); ctx.stroke();
}

(function figNhpp() {
  const canvas = document.getElementById("fig-nhpp");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const aIn = document.getElementById("nhpp-a"), bIn = document.getElementById("nhpp-b"), cIn = document.getElementById("nhpp-c");
  const aV = document.getElementById("nhpp-a-v"), bV = document.getElementById("nhpp-b-v"), cV = document.getElementById("nhpp-c-v");
  let random = rng();
  const rateAt = (t) => t < 1 / 3 ? +aIn.value : t < 2 / 3 ? +bIn.value : +cIn.value;
  function simulate() {
    const maxRate = Math.max(+aIn.value, +bIn.value, +cIn.value);
    const events = [];
    let t = 0;
    while (t < 1) {
      t += expSample(maxRate, random);
      if (t <= 1 && random() < rateAt(t) / maxRate) events.push(t);
    }
    return events;
  }
  function draw() {
    aV.textContent = (+aIn.value).toFixed(1); bV.textContent = (+bIn.value).toFixed(1); cV.textContent = (+cIn.value).toFixed(1);
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
    const x0 = 46, y0 = 28, ww = w - 90, hh = 210;
    drawPoissonAxes(ctx, x0, y0, ww, hh, 9, 4);
    const maxRate = Math.max(+aIn.value, +bIn.value, +cIn.value, 1);
    const rates = [0, 1 / 3, 1 / 3, 2 / 3, 2 / 3, 1].map((t) => [x0 + t * ww, y0 + hh - rateAt(Math.min(t, 0.999)) / maxRate * hh * 0.85]);
    ctx.strokeStyle = C.blue; ctx.lineWidth = 3; ctx.beginPath(); rates.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke();
    let cum = 0;
    const cumPts = [];
    for (let i = 0; i <= 120; i++) {
      const t = i / 120;
      cum = (+aIn.value) * Math.min(t, 1 / 3) + (+bIn.value) * Math.max(0, Math.min(t, 2 / 3) - 1 / 3) + (+cIn.value) * Math.max(0, t - 2 / 3);
      const total = (+aIn.value + +bIn.value + +cIn.value) / 3;
      cumPts.push([x0 + t * ww, y0 + hh - cum / total * hh * 0.65]);
    }
    ctx.strokeStyle = C.purple; ctx.lineWidth = 2; ctx.beginPath(); cumPts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke();
    const events = simulate();
    ctx.fillStyle = C.red;
    events.forEach((t) => { ctx.beginPath(); ctx.arc(x0 + t * ww, y0 + hh + 28, 4, 0, Math.PI * 2); ctx.fill(); });
    readout("nhpp-readout", [["expected count", `${((+aIn.value + +bIn.value + +cIn.value) / 3).toFixed(2)} over the unit window`], ["observed count", String(events.length)]]);
  }
  [aIn, bIn, cIn].forEach((input) => input.addEventListener("input", draw));
  document.getElementById("nhpp-reroll").addEventListener("click", () => { random = rng(); draw(); });
  draw();
})();

(function figUniformity() {
  const canvas = document.getElementById("fig-uniformity");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const nIn = document.getElementById("uniformity-n"), repsIn = document.getElementById("uniformity-reps");
  const nV = document.getElementById("uniformity-n-v"), repsV = document.getElementById("uniformity-reps-v");
  let random = rng();
  function draw() {
    const n = +nIn.value, reps = +repsIn.value;
    nV.textContent = String(n); repsV.textContent = String(reps);
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
    const x0 = 52, y0 = 32, ww = w - 104, hh = 210;
    drawPoissonAxes(ctx, x0, y0, ww, hh, 10, 4);
    const bins = Array(n).fill(0).map(() => Array(20).fill(0));
    for (let r = 0; r < reps; r++) {
      const xs = Array.from({ length: n }, () => random()).sort((a, b) => a - b);
      xs.forEach((x, k) => bins[k][Math.min(19, Math.floor(x * 20))]++);
    }
    const max = Math.max(...bins.flat(), 1);
    for (let k = 0; k < n; k++) for (let b = 0; b < 20; b++) {
      ctx.fillStyle = `rgba(184,65,42,${0.08 + 0.75 * bins[k][b] / max})`;
      ctx.fillRect(x0 + b / 20 * ww, y0 + k / n * hh, ww / 20, hh / n);
    }
    for (let k = 1; k <= n; k++) {
      const mean = k / (n + 1);
      ctx.strokeStyle = C.blue; ctx.beginPath(); ctx.moveTo(x0 + mean * ww, y0 + (k - 1) / n * hh); ctx.lineTo(x0 + mean * ww, y0 + k / n * hh); ctx.stroke();
    }
    readout("uniformity-readout", [["conditional law", "given N(T)=n, event times are sorted Uniform(0,T) draws"], ["reference mean", "kth order statistic has mean k/(n+1)"]]);
  }
  [nIn, repsIn].forEach((input) => input.addEventListener("input", draw));
  document.getElementById("uniformity-reroll").addEventListener("click", () => { random = rng(); draw(); });
  draw();
})();
