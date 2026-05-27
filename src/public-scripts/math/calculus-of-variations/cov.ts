
const C = {
  bg: "#ffffff",
  grid: "#e3ddd0",
  axis: "#5a6577",
  text: "#1f2733",
  dim: "#5a6577",
  blue: "#1f4a8c",
  blueFill: "rgba(31,74,140,0.20)",
  red: "#b8412a",
  redFill: "rgba(184,65,42,0.22)",
  green: "#2d7a3e",
  purple: "#6b4592",
  pale: "#f7f3ea",
};

function setupCanvas(canvas) {
  const ratio = window.devicePixelRatio || 1;
  const iw = Number(canvas.getAttribute("width"));
  const ih = Number(canvas.getAttribute("height"));
  canvas.style.width = "100%";
  canvas.style.height = `${canvas.getBoundingClientRect().width * ih / iw}px`;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * ratio;
  canvas.height = rect.height * ratio;
  const ctx = canvas.getContext("2d");
  ctx.scale(ratio, ratio);
  return { ctx, w: rect.width, h: rect.height };
}

function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }

function drawAxes(ctx, x, y, w, h, nx = 6, ny = 4) {
  ctx.strokeStyle = C.grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= nx; i++) {
    const px = x + i * w / nx;
    ctx.beginPath(); ctx.moveTo(px, y); ctx.lineTo(px, y + h); ctx.stroke();
  }
  for (let i = 0; i <= ny; i++) {
    const py = y + i * h / ny;
    ctx.beginPath(); ctx.moveTo(x, py); ctx.lineTo(x + w, py); ctx.stroke();
  }
  ctx.strokeStyle = C.axis;
  ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + h); ctx.lineTo(x + w, y + h); ctx.stroke();
}

const fvState = { c1: 0.25, c2: 0.42, c3: -0.25 };
let residualState = { ...fvState };
const nGrid = 180;
const xs = Array.from({ length: nGrid + 1 }, (_, i) => i / nGrid);

function coeffCurve(coeffs, x) {
  return coeffs.c1 * Math.sin(Math.PI * x) +
    coeffs.c2 * Math.sin(2 * Math.PI * x) +
    coeffs.c3 * Math.sin(3 * Math.PI * x);
}

function coeffCurvePrime(coeffs, x) {
  return Math.PI * coeffs.c1 * Math.cos(Math.PI * x) +
    2 * Math.PI * coeffs.c2 * Math.cos(2 * Math.PI * x) +
    3 * Math.PI * coeffs.c3 * Math.cos(3 * Math.PI * x);
}

function coeffCurveSecond(coeffs, x) {
  return -(Math.PI ** 2) * coeffs.c1 * Math.sin(Math.PI * x) -
    (2 * Math.PI) ** 2 * coeffs.c2 * Math.sin(2 * Math.PI * x) -
    (3 * Math.PI) ** 2 * coeffs.c3 * Math.sin(3 * Math.PI * x);
}

function stationary(x) {
  return 2 * x * (1 - x);
}

function eta(mode, x) {
  return Math.sin(mode * Math.PI * x);
}

function etaPrime(mode, x) {
  return mode * Math.PI * Math.cos(mode * Math.PI * x);
}

function functional(coeffs, eps = 0, mode = 2) {
  let total = 0;
  for (let i = 0; i < xs.length - 1; i++) {
    const x0 = xs[i], x1 = xs[i + 1], xm = (x0 + x1) / 2;
    const dx = x1 - x0;
    const y = coeffCurve(coeffs, xm) + eps * eta(mode, xm);
    const yp = coeffCurvePrime(coeffs, xm) + eps * etaPrime(mode, xm);
    total += (0.5 * yp * yp - 4 * y) * dx;
  }
  return total;
}

function residual(coeffs, x) {
  return -4 - coeffCurveSecond(coeffs, x);
}

function setInput(id, value) {
  const input = document.getElementById(id);
  if (!input) return;
  input.value = String(value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function readFvInputs() {
  fvState.c1 = Number(document.getElementById("fv-c1").value);
  fvState.c2 = Number(document.getElementById("fv-c2").value);
  fvState.c3 = Number(document.getElementById("fv-c3").value);
  return {
    coeffs: { ...fvState },
    eps: Number(document.getElementById("fv-eps").value),
    mode: Number(document.getElementById("fv-eta").value),
  };
}

function drawCurve(ctx, values, map, color, width = 2, heat = null) {
  if (!heat) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    values.forEach(([x, y], i) => {
      const p = map(x, y);
      i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y);
    });
    ctx.stroke();
    return;
  }
  ctx.lineWidth = width;
  for (let i = 0; i < values.length - 1; i++) {
    const a = values[i], b = values[i + 1];
    const pa = map(a[0], a[1]), pb = map(b[0], b[1]);
    ctx.strokeStyle = heat((a[2] + b[2]) / 2);
    ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
  }
}

(function firstVariation() {
  const canvas = document.getElementById("fig-first-variation");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const readout = document.getElementById("fig-first-variation-readout");
  const inputs = ["fv-c1", "fv-c2", "fv-c3", "fv-eps", "fv-eta"].map((id) => document.getElementById(id));
  const labels = {
    c1: document.getElementById("fv-c1-v"),
    c2: document.getElementById("fv-c2-v"),
    c3: document.getElementById("fv-c3-v"),
    eps: document.getElementById("fv-eps-v"),
    eta: document.getElementById("fv-eta-v"),
  };

  function draw() {
    const { coeffs, eps, mode } = readFvInputs();
    labels.c1.textContent = coeffs.c1.toFixed(2);
    labels.c2.textContent = coeffs.c2.toFixed(2);
    labels.c3.textContent = coeffs.c3.toFixed(2);
    labels.eps.textContent = eps.toFixed(2);
    labels.eta.textContent = String(mode);

    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
    const left = { x: 44, y: 20, w: w * 0.55, h: h - 54 };
    const right = { x: left.x + left.w + 48, y: 28, w: w - left.x - left.w - 74, h: h - 82 };
    drawAxes(ctx, left.x, left.y, left.w, left.h, 8, 6);
    const yMin = -1.3, yMax = 1.3;
    const map = (x, y) => ({ x: left.x + x * left.w, y: left.y + left.h - ((y - yMin) / (yMax - yMin)) * left.h });
    drawCurve(ctx, xs.map((x) => [x, stationary(x)]), map, C.green, 2.5);
    drawCurve(ctx, xs.map((x) => [x, coeffCurve(coeffs, x)]), map, C.blue, 2.5);
    drawCurve(ctx, xs.map((x) => [x, coeffCurve(coeffs, x) + eps * eta(mode, x)]), map, C.red, 2);

    const epsVals = Array.from({ length: 121 }, (_, i) => -1.2 + i * 2.4 / 120);
    const jVals = epsVals.map((e) => functional(coeffs, e, mode));
    const jMin = Math.min(...jVals), jMax = Math.max(...jVals);
    const jPad = Math.max(0.1, (jMax - jMin) * 0.12);
    const xS = (e) => right.x + ((e + 1.2) / 2.4) * right.w;
    const yS = (j) => right.y + right.h - ((j - jMin + jPad) / (jMax - jMin + 2 * jPad)) * right.h;
    drawAxes(ctx, right.x, right.y, right.w, right.h, 4, 4);
    ctx.strokeStyle = C.purple; ctx.lineWidth = 2;
    ctx.beginPath();
    epsVals.forEach((e, i) => i ? ctx.lineTo(xS(e), yS(jVals[i])) : ctx.moveTo(xS(e), yS(jVals[i])));
    ctx.stroke();
    const j0 = functional(coeffs, 0, mode);
    const slope = (functional(coeffs, 0.001, mode) - functional(coeffs, -0.001, mode)) / 0.002;
    ctx.strokeStyle = C.red; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(xS(-0.35), yS(j0 - 0.35 * slope)); ctx.lineTo(xS(0.35), yS(j0 + 0.35 * slope)); ctx.stroke();
    ctx.fillStyle = C.red; ctx.beginPath(); ctx.arc(xS(0), yS(j0), 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.text; ctx.font = "12px -apple-system, sans-serif";
    ctx.fillText("curve space", left.x, left.y + left.h + 28);
    ctx.fillText("J[y + εη]", right.x, right.y - 8);
    const allSlopes = [1, 2, 3, 4].map((m) =>
      (functional(coeffs, 0.001, m) - functional(coeffs, -0.001, m)) / 0.002
    );
    const slopesStr = allSlopes.map((s, i) => `η${i + 1}: ${s.toFixed(3)}`).join("  ");
    const maxAbs = Math.max(...allSlopes.map(Math.abs));
    const stationaryTag = maxAbs < 0.05 ? "≈ stationary" : "not stationary";
    readout.innerHTML =
      `<div class="row"><span class="lbl">current functional</span><span>J[y] = ${j0.toFixed(4)}</span></div>` +
      `<div class="row"><span class="lbl">first variation in selected direction</span><span>dJ/dε|₀ = ${slope.toFixed(4)}</span></div>` +
      `<div class="row"><span class="lbl">slopes in all four directions</span><span>${slopesStr}</span></div>` +
      `<div class="row"><span class="lbl">max |slope| (stationarity check)</span><span>${maxAbs.toFixed(4)} &nbsp; ${stationaryTag}</span></div>`;
  }

  inputs.forEach((input) => input.addEventListener("input", draw));

  // Match the layout in draw().
  const left = { x: 44, y: 20, w: w * 0.55, h: h - 54 };
  const right = { x: left.x + left.w + 48, y: 28, w: w - left.x - left.w - 74, h: h - 82 };
  const yMin = -1.3, yMax = 1.3;

  canvas.style.touchAction = "none";
  let drag = null; // "eps" | "curve" | null

  function localPos(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  function inRight(px, py) {
    return px >= right.x && px <= right.x + right.w && py >= right.y && py <= right.y + right.h;
  }
  function inLeft(px, py) {
    return px >= left.x && px <= left.x + left.w && py >= left.y && py <= left.y + left.h;
  }
  function applyEpsAt(px) {
    const e = clamp(-1.2 + ((px - right.x) / right.w) * 2.4, -1.2, 1.2);
    setInput("fv-eps", e.toFixed(3));
  }
  function applyCurveAt(px, py) {
    // Drag a point on the curve: figure out the user's chosen (x, yTarget) and
    // adjust the basis coefficient with the largest sine weight at x.
    const x = clamp((px - left.x) / left.w, 0.02, 0.98);
    const yTarget = clamp(yMin + (1 - (py - left.y) / left.h) * (yMax - yMin), yMin, yMax);
    const yNow = coeffCurve(fvState, x);
    const delta = yTarget - yNow;
    const weights = [Math.sin(Math.PI * x), Math.sin(2 * Math.PI * x), Math.sin(3 * Math.PI * x)];
    let best = 0;
    for (let i = 1; i < 3; i++) if (Math.abs(weights[i]) > Math.abs(weights[best])) best = i;
    if (Math.abs(weights[best]) < 0.18) return; // near a node of every basis mode
    const key = ["c1", "c2", "c3"][best];
    const newVal = clamp(fvState[key] + delta / weights[best], -2, 2);
    setInput(`fv-${key}`, newVal.toFixed(4));
  }

  canvas.addEventListener("pointermove", (e) => {
    if (drag) return;
    const { x, y } = localPos(e);
    canvas.style.cursor = inRight(x, y) ? "ew-resize" : (inLeft(x, y) ? "grab" : "");
  });
  canvas.addEventListener("pointerdown", (e) => {
    const { x, y } = localPos(e);
    if (inRight(x, y)) {
      drag = "eps";
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = "ew-resize";
      applyEpsAt(x);
      e.preventDefault();
    } else if (inLeft(x, y)) {
      drag = "curve";
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = "grabbing";
      applyCurveAt(x, y);
      e.preventDefault();
    }
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const { x, y } = localPos(e);
    if (drag === "eps") applyEpsAt(x);
    else if (drag === "curve") applyCurveAt(x, y);
  });
  const endDrag = (e) => {
    if (!drag) return;
    drag = null;
    try { canvas.releasePointerCapture(e.pointerId); } catch {}
    canvas.style.cursor = "";
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  document.getElementById("fv-reset").addEventListener("click", () => {
    setInput("fv-c1", 0.25); setInput("fv-c2", 0.42); setInput("fv-c3", -0.25); setInput("fv-eps", 0.45); setInput("fv-eta", 2);
  });
  document.getElementById("fv-stationary").addEventListener("click", () => {
    // Best three-mode sine approximation of 2x(1-x).
    setInput("fv-c1", 0.516); setInput("fv-c2", 0); setInput("fv-c3", 0.019);
  });
  document.getElementById("fv-relax").addEventListener("click", () => {
    let n = 0;
    const timer = setInterval(() => {
      const target = { c1: 16 / Math.PI ** 3, c2: 0, c3: 16 / (27 * Math.PI ** 3) };
      for (const key of ["c1", "c2", "c3"]) fvState[key] += 0.08 * (target[key] - fvState[key]);
      setInput("fv-c1", fvState.c1.toFixed(4)); setInput("fv-c2", fvState.c2.toFixed(4)); setInput("fv-c3", fvState.c3.toFixed(4));
      if (++n > 70) clearInterval(timer);
    }, 24);
  });
  draw();
})();

(function elResidual() {
  const canvas = document.getElementById("fig-el-residual");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const readout = document.getElementById("fig-el-residual-readout");
  let timer = null;

  function draw() {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
    const plot = { x: 54, y: 22, w: w - 92, h: h - 66 };
    drawAxes(ctx, plot.x, plot.y, plot.w, plot.h, 10, 6);
    const yMin = -1.3, yMax = 1.3;
    const map = (x, y) => ({ x: plot.x + x * plot.w, y: plot.y + plot.h - ((y - yMin) / (yMax - yMin)) * plot.h });
    drawCurve(ctx, xs.map((x) => [x, stationary(x)]), map, C.green, 2.2);
    const vals = xs.map((x) => [x, coeffCurve(residualState, x), Math.abs(residual(residualState, x))]);
    const rms = Math.sqrt(vals.reduce((s, v) => s + v[2] * v[2], 0) / vals.length);
    drawCurve(ctx, vals, map, C.red, 5, (r) => {
      const t = clamp(r / 18, 0, 1);
      const rr = Math.round(247 - 63 * t);
      const gg = Math.round(243 - 178 * t);
      const bb = Math.round(234 - 192 * t);
      return `rgb(${rr},${gg},${bb})`;
    });
    readout.innerHTML =
      `<div class="row"><span class="lbl">RMS Euler-Lagrange residual</span><span>${rms.toFixed(3)}</span></div>` +
      `<div class="row"><span class="lbl">target equation</span><span>y″ = -4</span></div>`;
  }

  function step() {
    const target = { c1: 16 / Math.PI ** 3, c2: 0, c3: 16 / (27 * Math.PI ** 3) };
    for (const key of ["c1", "c2", "c3"]) residualState[key] += 0.055 * (target[key] - residualState[key]);
  }

  document.getElementById("el-load-from-fv").addEventListener("click", () => { residualState = { ...fvState }; draw(); });
  document.getElementById("el-relax").addEventListener("click", () => {
    if (timer) clearInterval(timer);
    timer = setInterval(() => { step(); draw(); }, 28);
  });
  document.getElementById("el-stop").addEventListener("click", () => { if (timer) clearInterval(timer); timer = null; });

  // Drag a point on the curve to deform it. Match the layout used in draw().
  const plot = { x: 54, y: 22, w: w - 92, h: h - 66 };
  const yMin = -1.3, yMax = 1.3;
  canvas.style.touchAction = "none";
  let dragging = false;
  function localPos(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  function inPlot(px, py) {
    return px >= plot.x && px <= plot.x + plot.w && py >= plot.y && py <= plot.y + plot.h;
  }
  function deformAt(px, py) {
    const x = clamp((px - plot.x) / plot.w, 0.02, 0.98);
    const yTarget = clamp(yMin + (1 - (py - plot.y) / plot.h) * (yMax - yMin), yMin, yMax);
    const yNow = coeffCurve(residualState, x);
    const delta = yTarget - yNow;
    const weights = [Math.sin(Math.PI * x), Math.sin(2 * Math.PI * x), Math.sin(3 * Math.PI * x)];
    let best = 0;
    for (let i = 1; i < 3; i++) if (Math.abs(weights[i]) > Math.abs(weights[best])) best = i;
    if (Math.abs(weights[best]) < 0.18) return;
    const key = ["c1", "c2", "c3"][best];
    residualState[key] = clamp(residualState[key] + delta / weights[best], -2, 2);
  }
  canvas.addEventListener("pointermove", (e) => {
    if (dragging) return;
    const { x, y } = localPos(e);
    canvas.style.cursor = inPlot(x, y) ? "grab" : "";
  });
  canvas.addEventListener("pointerdown", (e) => {
    const { x, y } = localPos(e);
    if (!inPlot(x, y)) return;
    if (timer) { clearInterval(timer); timer = null; }
    dragging = true;
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = "grabbing";
    deformAt(x, y);
    draw();
    e.preventDefault();
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const { x, y } = localPos(e);
    deformAt(x, y);
    draw();
  });
  const endDrag = (e) => {
    if (!dragging) return;
    dragging = false;
    try { canvas.releasePointerCapture(e.pointerId); } catch {}
    canvas.style.cursor = "";
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  draw();
})();

(function brachistochrone() {
  const canvas = document.getElementById("fig-brachistochrone");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const readout = document.getElementById("fig-brachistochrone-readout");
  const start = { x: 0, y: 0 };
  const end = { x: 1, y: 0.62 };
  let p1 = { x: 0.18, y: 0.70 };
  let p2 = { x: 0.70, y: 0.50 };
  let tries = [];
  let raceT = 0;
  let racing = false;
  let drag = null;
  const plot = { x: 48, y: 24, w: w - 96, h: h - 120 };
  const hist = { x: 88, y: h - 72, w: w - 176, h: 42 };
  const g = 9.8;

  function bezier(t) {
    const u = 1 - t;
    return {
      x: u ** 3 * start.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t ** 3 * end.x,
      y: u ** 3 * start.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t ** 3 * end.y,
    };
  }

  function cycloidPoint(theta, thetaMax, a) {
    return { x: a * (theta - Math.sin(theta)), y: a * (1 - Math.cos(theta)) };
  }

  function solveCycloid() {
    const ratio = end.x / end.y;
    let lo = 0.05, hi = Math.PI * 1.99;
    for (let i = 0; i < 80; i++) {
      const mid = (lo + hi) / 2;
      const value = (mid - Math.sin(mid)) / (1 - Math.cos(mid));
      if (value < ratio) lo = mid; else hi = mid;
    }
    const thetaMax = (lo + hi) / 2;
    const a = end.y / (1 - Math.cos(thetaMax));
    return { thetaMax, a };
  }

  const cycloid = solveCycloid();
  const cycloidTime = Math.sqrt(cycloid.a / g) * cycloid.thetaMax;

  function pathTime(sample) {
    let total = 0;
    let prev = sample(0);
    for (let i = 1; i <= 500; i++) {
      const cur = sample(i / 500);
      const ds = Math.hypot(cur.x - prev.x, cur.y - prev.y);
      const y = Math.max(0.0008, (cur.y + prev.y) / 2);
      total += ds / Math.sqrt(2 * g * y);
      prev = cur;
    }
    return total;
  }

  function userTime() {
    return pathTime(bezier);
  }

  function map(pt) {
    return { x: plot.x + pt.x * plot.w, y: plot.y + pt.y * plot.h };
  }

  function drawPath(sample, color, width) {
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath();
    for (let i = 0; i <= 220; i++) {
      const p = map(sample(i / 220));
      i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y);
    }
    ctx.stroke();
  }

  function pointAtTime(sample, totalTime, t) {
    const target = clamp(t / totalTime, 0, 1);
    return sample(target);
  }

  function draw() {
    const tUser = userTime();
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
    for (let i = 0; i <= 6; i++) {
      const y = plot.y + i * plot.h / 6;
      ctx.beginPath(); ctx.moveTo(plot.x, y); ctx.lineTo(plot.x + plot.w, y); ctx.stroke();
    }
    drawPath((t) => {
      const p = cycloidPoint(t * cycloid.thetaMax, cycloid.thetaMax, cycloid.a);
      return { x: p.x, y: p.y };
    }, C.blue, 2.5);
    drawPath(bezier, C.red, 2.5);
    for (const p of [p1, p2]) {
      const q = map(p);
      ctx.fillStyle = C.red; ctx.beginPath(); ctx.arc(q.x, q.y, 7, 0, Math.PI * 2); ctx.fill();
    }
    const userBead = map(pointAtTime(bezier, tUser, raceT));
    const cycBead = map(pointAtTime((t) => {
      const p = cycloidPoint(t * cycloid.thetaMax, cycloid.thetaMax, cycloid.a);
      return { x: p.x, y: p.y };
    }, cycloidTime, raceT));
    ctx.fillStyle = C.red; ctx.beginPath(); ctx.arc(userBead.x, userBead.y, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.blue; ctx.beginPath(); ctx.arc(cycBead.x, cycBead.y, 6, 0, Math.PI * 2); ctx.fill();

    ctx.strokeStyle = C.axis; ctx.strokeRect(hist.x, hist.y, hist.w, hist.h);
    const maxT = Math.max(0.65, ...tries, tUser) * 1.05;
    tries.forEach((time) => {
      const x = hist.x + (time / maxT) * hist.w;
      ctx.strokeStyle = C.purple; ctx.beginPath(); ctx.moveTo(x, hist.y + 5); ctx.lineTo(x, hist.y + hist.h - 5); ctx.stroke();
    });
    const cx = hist.x + (cycloidTime / maxT) * hist.w;
    ctx.strokeStyle = C.blue; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, hist.y); ctx.lineTo(cx, hist.y + hist.h); ctx.stroke();
    ctx.fillStyle = C.text; ctx.font = "12px -apple-system, sans-serif";
    ctx.fillText("arrival-time history", hist.x, hist.y - 8);
    readout.innerHTML =
      `<div class="row"><span class="lbl">your curve time</span><span>${tUser.toFixed(3)} s</span></div>` +
      `<div class="row"><span class="lbl">cycloid time</span><span>${cycloidTime.toFixed(3)} s</span></div>`;
  }

  function animate() {
    if (!racing) return;
    raceT += 0.012;
    if (raceT > Math.max(userTime(), cycloidTime) * 1.08) racing = false;
    draw();
    requestAnimationFrame(animate);
  }

  canvas.addEventListener("pointerdown", (event) => {
    const r = canvas.getBoundingClientRect();
    const local = { x: event.clientX - r.left, y: event.clientY - r.top };
    const hit = [p1, p2].find((p) => {
      const q = map(p);
      return Math.hypot(local.x - q.x, local.y - q.y) < 16;
    });
    if (!hit) return;
    drag = hit;
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!drag) return;
    const r = canvas.getBoundingClientRect();
    drag.x = clamp((event.clientX - r.left - plot.x) / plot.w, 0.02, 0.98);
    drag.y = clamp((event.clientY - r.top - plot.y) / plot.h, 0.05, 1.05);
    racing = false;
    draw();
  });
  canvas.addEventListener("pointerup", (event) => {
    if (drag) tries.push(userTime());
    drag = null;
    try { canvas.releasePointerCapture(event.pointerId); } catch {}
    draw();
  });

  document.getElementById("br-race").addEventListener("click", () => {
    tries.push(userTime());
    raceT = 0;
    racing = true;
    animate();
  });
  document.getElementById("br-cycloidish").addEventListener("click", () => { p1 = { x: 0.14, y: 0.84 }; p2 = { x: 0.58, y: 0.70 }; tries.push(userTime()); draw(); });
  document.getElementById("br-line").addEventListener("click", () => { p1 = { x: 0.33, y: 0.21 }; p2 = { x: 0.66, y: 0.41 }; tries.push(userTime()); draw(); });
  document.getElementById("br-clear").addEventListener("click", () => { tries = []; draw(); });
  draw();
})();
