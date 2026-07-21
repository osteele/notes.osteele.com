// Interactive figures for the measure theory explainer.
// Each figure is self-contained; they share only utility code.

import { drawClippedLine } from "../../_shared/charts";
import { bindEditablePoints } from "../../_shared/editable-points";

// ─────────── Utility ───────────
const COLORS = {
  mu: "#1f4a8c",
  muFill: "rgba(31,74,140,0.30)",
  nu: "#b8412a",
  nuFill: "rgba(184,65,42,0.40)",
  rn: "#6b4592",
  grid: "#e3ddd0",
  axis: "#5a6577",
  text: "#1f2733",
  textDim: "#5a6577",
  bg: "#ffffff",
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

function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }

function gaussian(x, mu, sigma) {
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
}

function gaussianSample(mu, sigma) {
  // Box–Muller
  const u = Math.random(), v = Math.random();
  return mu + sigma * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function drawSimpleAxes(ctx, x, y, w, h, verticals = 6, horizontals = 4) {
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= verticals; i++) {
    const px = x + (i / verticals) * w;
    ctx.beginPath(); ctx.moveTo(px, y); ctx.lineTo(px, y + h); ctx.stroke();
  }
  for (let i = 0; i <= horizontals; i++) {
    const py = y + (i / horizontals) * h;
    ctx.beginPath(); ctx.moveTo(x, py); ctx.lineTo(x + w, py); ctx.stroke();
  }
  ctx.strokeStyle = COLORS.axis;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + h); ctx.lineTo(x + w, y + h); ctx.stroke();
}

// ─────────── Figure 1: Events in a probability space ───────────
(function fig1() {
  const canvas = document.getElementById("fig1");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);

  // Layout: left half is Ω (unit square); right half is a bar chart.
  const pad = 14;
  const squareSize = Math.min(h - 2 * pad, w * 0.5 - 2 * pad);
  const sx = pad, sy = pad + (h - 2 * pad - squareSize) / 2;
  const chartX = sx + squareSize + 30;
  const chartW = w - chartX - pad;
  let viewMode = "measure";

  // Events: 4 colored discs.
  const events = [
    { name: "A", cx: 0.30, cy: 0.40, r: 0.18, color: "#3b7dd8", fill: "rgba(59,125,216,0.30)" },
    { name: "B", cx: 0.60, cy: 0.50, r: 0.18, color: "#b8412a", fill: "rgba(184,65,42,0.30)" },
    { name: "C", cx: 0.45, cy: 0.75, r: 0.14, color: "#2d7a3e", fill: "rgba(45,122,62,0.30)" },
    { name: "D", cx: 0.75, cy: 0.30, r: 0.12, color: "#6b4592", fill: "rgba(107,69,146,0.30)" },
  ];

  function toScreen(cx, cy) {
    return [sx + cx * squareSize, sy + cy * squareSize];
  }
  function eventScreen(e) {
    const [x, y] = toScreen(e.cx, e.cy);
    return { x, y, r: e.r * squareSize };
  }
  function containsEvent(e, x, y) {
    const dx = x - e.cx, dy = y - e.cy;
    return dx * dx + dy * dy < e.r * e.r;
  }

  function measure(e) {
    return Math.PI * e.r * e.r;
  }

  function intersectMeasure(e1, e2) {
    const dx = e2.cx - e1.cx;
    const dy = e2.cy - e1.cy;
    const d = Math.hypot(dx, dy);
    const r1 = e1.r;
    const r2 = e2.r;
    if (d >= r1 + r2) return 0;
    if (d <= Math.abs(r1 - r2)) {
      const r = Math.min(r1, r2);
      return Math.PI * r * r;
    }
    const a1 = Math.acos(clamp((d * d + r1 * r1 - r2 * r2) / (2 * d * r1), -1, 1));
    const a2 = Math.acos(clamp((d * d + r2 * r2 - r1 * r1) / (2 * d * r2), -1, 1));
    const lens = 0.5 * Math.sqrt(Math.max(0, (-d + r1 + r2) * (d + r1 - r2) * (d - r1 + r2) * (d + r1 + r2)));
    return r1 * r1 * a1 + r2 * r2 * a2 - lens;
  }
  function unionMeasure(e1, e2) {
    return measure(e1) + measure(e2) - intersectMeasure(e1, e2);
  }

  function relationAB() {
    const [a, b] = events;
    const d = Math.hypot(a.cx - b.cx, a.cy - b.cy);
    const eps = 1e-6;
    if (d >= a.r + b.r - eps) return "disjoint";
    if (d + Math.min(a.r, b.r) <= Math.max(a.r, b.r) + eps) return "nested";
    return "overlap";
  }

  function updatePresetButtons() {
    const relation = relationAB();
    document.querySelectorAll("[data-fig1-preset]").forEach((button) => {
      button.classList.toggle("active", button.dataset.fig1Preset === relation);
    });
  }

  function drawMeasureBar({ label, value, color, y, maxBar, barW, barH, labelW = 18 }) {
    ctx.fillStyle = color;
    ctx.font = "600 13px -apple-system, sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillText(label, chartX, y + barH / 2);
    const x = chartX + labelW;
    const width = chartW - labelW - 60;
    ctx.fillStyle = "#eee5d3";
    ctx.fillRect(x, y, width, barH);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.7;
    ctx.fillRect(x, y, width * clamp(value / maxBar, 0, 1), barH);
    ctx.globalAlpha = 1;
    ctx.fillStyle = COLORS.text;
    ctx.font = "12px 'SF Mono', monospace";
    ctx.textBaseline = "middle";
    ctx.fillText(value.toFixed(3), x + width + 6, y + barH / 2);
  }

  function draw() {
    updatePresetButtons();
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, w, h);

    // Sample space frame.
    ctx.strokeStyle = COLORS.axis;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(sx, sy, squareSize, squareSize);

    ctx.font = "italic 13px Georgia, serif";
    ctx.fillStyle = COLORS.text;
    ctx.textBaseline = "alphabetic";
    ctx.fillText("Ω", sx + 4, sy + 16);

    // Events, filled.
    for (const e of events) {
      const { x, y, r } = eventScreen(e);
      ctx.fillStyle = e.fill;
      ctx.strokeStyle = e.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = e.color;
      ctx.font = "600 13px -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(e.name, x, y);
    }
    ctx.textAlign = "left";

    if (viewMode === "complement") {
      const a = events[0];
      const { x, y, r } = eventScreen(a);
      ctx.save();
      ctx.beginPath();
      ctx.rect(sx, sy, squareSize, squareSize);
      ctx.arc(x, y, r, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(45,122,62,0.16)";
      ctx.fill("evenodd");
      ctx.strokeStyle = "#2d7a3e";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(sx + 2, sy + 2, squareSize - 4, squareSize - 4);
      ctx.setLineDash([]);
      ctx.fillStyle = "#2d7a3e";
      ctx.font = "600 12px -apple-system, sans-serif";
      ctx.fillText("Aᶜ = Ω \\ A", sx + 10, sy + squareSize - 12);
      ctx.restore();
    } else if (viewMode === "intersection") {
      const a = eventScreen(events[0]);
      const b = eventScreen(events[1]);
      ctx.save();
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, 2 * Math.PI);
      ctx.clip();
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(107,69,146,0.46)";
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = COLORS.rn;
      ctx.font = "600 12px -apple-system, sans-serif";
      ctx.fillText("A∩B", Math.max(sx + 8, Math.min(a.x, b.x)), Math.max(sy + 18, Math.min(a.y, b.y)));
    } else if (viewMode === "closure") {
      const a = eventScreen(events[0]);
      const b = eventScreen(events[1]);
      ctx.save();
      ctx.beginPath();
      ctx.rect(sx, sy, squareSize, squareSize);
      ctx.arc(a.x, a.y, a.r, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(45,122,62,0.10)";
      ctx.fill("evenodd");
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, 2 * Math.PI);
      ctx.arc(b.x, b.y, b.r, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(212,105,10,0.18)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, 2 * Math.PI);
      ctx.clip();
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(107,69,146,0.46)";
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = COLORS.text;
      ctx.font = "600 11px -apple-system, sans-serif";
      ctx.fillText("closure lights up: Aᶜ, A∪B, A∩B", sx + 10, sy + squareSize - 12);
    }

    // Bar chart of measures.
    const measures = events.map(e => ({ name: e.name, color: e.color, m: measure(e) }));
    const maxBar = 0.5;
    const barH = 28, gap = 8;
    const chartY = sy + 6;
    const bx = chartX + 18;
    const bw = chartW - 18 - 60;
    ctx.font = "11px -apple-system, sans-serif";
    ctx.fillStyle = COLORS.textDim;
    ctx.textBaseline = "bottom";
    ctx.fillText("ℙ(event)", chartX, chartY - 4);

    for (let i = 0; i < measures.length; i++) {
      const y = chartY + i * (barH + gap);
      const m = measures[i];
      drawMeasureBar({ label: m.name, value: m.m, color: m.color, y, maxBar, barW: bw, barH });
    }
    const pa = measure(events[0]), pb = measure(events[1]);
    const pab = intersectMeasure(events[0], events[1]);
    const pUnion = unionMeasure(events[0], events[1]);
    const pComp = 1 - pa;
    const yU = chartY + measures.length * (barH + gap) + 6;
    if (viewMode === "complement") {
      const miniBarH = 16;
      drawMeasureBar({ label: "Ω", value: 1, color: COLORS.axis, y: yU, maxBar: 1, barW: bw, barH: miniBarH, labelW: 52 });
      drawMeasureBar({ label: "A", value: pa, color: events[0].color, y: yU + 22, maxBar: 1, barW: bw, barH: miniBarH, labelW: 52 });
      drawMeasureBar({ label: "Aᶜ", value: pComp, color: "#2d7a3e", y: yU + 44, maxBar: 1, barW: bw, barH: miniBarH, labelW: 52 });
    } else if (viewMode === "intersection") {
      const miniBarH = 16;
      drawMeasureBar({ label: "A∪B", value: pUnion, color: "#d4690a", y: yU, maxBar, barW: bw, barH: miniBarH, labelW: 52 });
      drawMeasureBar({ label: "A+B", value: pa + pb, color: COLORS.axis, y: yU + 22, maxBar, barW: bw, barH: miniBarH, labelW: 52 });
      drawMeasureBar({ label: "A∩B", value: pab, color: COLORS.rn, y: yU + 44, maxBar, barW: bw, barH: miniBarH, labelW: 52 });
    } else if (viewMode === "closure") {
      ctx.font = "12px 'SF Mono', monospace";
      ctx.fillStyle = COLORS.text;
      ctx.textBaseline = "top";
      ctx.fillText(`A ∈ 𝓕 ⇒ Aᶜ ∈ 𝓕`, chartX, yU);
      ctx.fillText(`A,B ∈ 𝓕 ⇒ A∪B ∈ 𝓕`, chartX, yU + 18);
      ctx.fillText(`A∩B = (Aᶜ∪Bᶜ)ᶜ ∈ 𝓕`, chartX, yU + 36);
    } else {
      const miniBarH = 16;
      drawMeasureBar({ label: "A+B", value: pa + pb, color: COLORS.axis, y: yU, maxBar, barW: bw, barH: miniBarH, labelW: 52 });
      drawMeasureBar({ label: "A∪B", value: pUnion, color: "#d4690a", y: yU + 22, maxBar, barW: bw, barH: miniBarH, labelW: 52 });
      drawMeasureBar({ label: "A∩B", value: pab, color: COLORS.rn, y: yU + 44, maxBar, barW: bw, barH: miniBarH, labelW: 52 });
    }

    // Readout below figure (optional readouts area)
    const readout = document.getElementById("fig1-readout");
    if (readout) {
      const relation = relationAB();
      let text = relation === "disjoint" ? "yes — additivity holds exactly" : `no — ${relation} with overlap ${pab.toFixed(3)}`;
      if (viewMode === "complement") {
        text = `ℙ(Aᶜ) = 1 - ℙ(A) = ${pComp.toFixed(3)}`;
      } else if (viewMode === "intersection") {
        text = `ℙ(A∪B) = ℙ(A)+ℙ(B)-ℙ(A∩B) = ${pUnion.toFixed(3)}`;
      } else if (viewMode === "closure") {
        text = "σ-algebras include complements, countable unions, and therefore intersections";
      }
      readout.innerHTML =
        `<div class="row"><span class="lbl">${viewMode === "measure" ? "disjoint?" : "identity"}</span><span>${text}</span></div>`;
    }
  }

  // Drag interaction.
  let dragIdx = -1;
  let dragOff = [0, 0];
  function eventAt(mx, my) {
    for (let i = events.length - 1; i >= 0; i--) {
      const e = events[i];
      const { x, y, r } = eventScreen(e);
      const dx = mx - x, dy = my - y;
      if (dx * dx + dy * dy < r * r) return i;
    }
    return -1;
  }
  function getPointer(ev) {
    const rect = canvas.getBoundingClientRect();
    return [ev.clientX - rect.left, ev.clientY - rect.top];
  }
  canvas.addEventListener("pointerdown", ev => {
    const [mx, my] = getPointer(ev);
    const i = eventAt(mx, my);
    if (i >= 0) {
      dragIdx = i;
      canvas.setPointerCapture(ev.pointerId);
      const { x, y } = eventScreen(events[i]);
      dragOff = [mx - x, my - y];
      ev.preventDefault();
    }
  });
  canvas.addEventListener("pointermove", ev => {
    if (dragIdx < 0) return;
    const [mx, my] = getPointer(ev);
    const e = events[dragIdx];
    const r = e.r * squareSize;
    const x = clamp(mx - dragOff[0], sx + r, sx + squareSize - r);
    const y = clamp(my - dragOff[1], sy + r, sy + squareSize - r);
    e.cx = (x - sx) / squareSize;
    e.cy = (y - sy) / squareSize;
    draw();
    ev.preventDefault();
  });
  canvas.addEventListener("pointerup", ev => {
    dragIdx = -1;
    if (canvas.hasPointerCapture(ev.pointerId)) canvas.releasePointerCapture(ev.pointerId);
  });
  canvas.addEventListener("pointercancel", () => { dragIdx = -1; });
  canvas.style.cursor = "grab";
  canvas.style.touchAction = "none";

  // Presets
  function applyPreset(name) {
    if (name === "disjoint") {
      events[0].cx = 0.20; events[0].cy = 0.30; events[0].r = 0.13;
      events[1].cx = 0.55; events[1].cy = 0.30; events[1].r = 0.13;
      events[2].cx = 0.30; events[2].cy = 0.75; events[2].r = 0.13;
      events[3].cx = 0.80; events[3].cy = 0.70; events[3].r = 0.13;
    } else if (name === "overlap") {
      events[0].cx = 0.40; events[0].cy = 0.45; events[0].r = 0.20;
      events[1].cx = 0.58; events[1].cy = 0.55; events[1].r = 0.20;
      events[2].cx = 0.50; events[2].cy = 0.30; events[2].r = 0.16;
      events[3].cx = 0.65; events[3].cy = 0.70; events[3].r = 0.12;
    } else if (name === "nested") {
      events[0].cx = 0.50; events[0].cy = 0.50; events[0].r = 0.30;
      events[1].cx = 0.50; events[1].cy = 0.50; events[1].r = 0.20;
      events[2].cx = 0.50; events[2].cy = 0.50; events[2].r = 0.12;
      events[3].cx = 0.50; events[3].cy = 0.50; events[3].r = 0.06;
    }
    draw();
  }
  document.querySelectorAll("[data-fig1-preset]").forEach(b => {
    b.addEventListener("click", () => applyPreset(b.dataset.fig1Preset));
  });
  document.querySelectorAll("[data-fig1-view]").forEach(b => {
    b.addEventListener("click", () => {
      viewMode = b.dataset.fig1View;
      document.querySelectorAll("[data-fig1-view]").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      draw();
    });
  });

  draw();
})();

// ─────────── Figure 2b: Generated sigma-field ───────────
(function generatedSigmaField() {
  const canvas = document.getElementById("sigma-generated");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const maskIn = document.getElementById("sigma-generated-mask");
  const maskV = document.getElementById("sigma-generated-mask-v");
  const readout = document.getElementById("sigma-generated-readout");
  const outcomes = ["HH", "HT", "TH", "TT"];
  let kind = "first";
  function values() {
    if (kind === "first") return [1, 1, 0, 0];
    if (kind === "parity") return [0, 1, 1, 0];
    return [2, 1, 1, 0];
  }
  function atoms(vals) {
    const groups = new Map();
    vals.forEach((v, i) => { if (!groups.has(v)) groups.set(v, []); groups.get(v).push(i); });
    return Array.from(groups.entries());
  }
  function draw() {
    const vals = values();
    const ats = atoms(vals);
    maskIn.max = String((1 << ats.length) - 1);
    const mask = Math.min(+maskIn.value, (1 << ats.length) - 1);
    maskIn.value = String(mask);
    maskV.textContent = mask.toString(2).padStart(ats.length, "0");
    ctx.fillStyle = COLORS.bg; ctx.fillRect(0, 0, w, h);
    const colors = ["rgba(31,74,140,0.22)", "rgba(184,65,42,0.22)", "rgba(45,122,62,0.22)", "rgba(107,69,146,0.22)"];
    outcomes.forEach((o, i) => {
      const x = 70 + i * 145, y = 58;
      const atomIndex = ats.findIndex(([, members]) => members.includes(i));
      ctx.fillStyle = colors[atomIndex];
      ctx.strokeStyle = (mask & (1 << atomIndex)) ? "#d89a1f" : COLORS.axis;
      ctx.lineWidth = (mask & (1 << atomIndex)) ? 4 : 1.5;
      ctx.fillRect(x, y, 96, 64); ctx.strokeRect(x, y, 96, 64);
      ctx.fillStyle = COLORS.text; ctx.font = "700 18px -apple-system, sans-serif"; ctx.textAlign = "center"; ctx.fillText(o, x + 48, y + 38);
      ctx.font = "12px -apple-system, sans-serif"; ctx.fillStyle = COLORS.textDim; ctx.fillText(`X=${vals[i]}`, x + 48, y + 84);
    });
    ctx.fillStyle = COLORS.text; ctx.font = "700 13px -apple-system, sans-serif"; ctx.textAlign = "left"; ctx.fillText("Atoms of σ(X)", 70, 28);
    ats.forEach(([v, members], i) => {
      const x = 86 + i * 190, y = 190;
      ctx.fillStyle = colors[i]; ctx.strokeStyle = COLORS.axis; ctx.lineWidth = 1.5;
      ctx.fillRect(x, y, 150, 54); ctx.strokeRect(x, y, 150, 54);
      ctx.fillStyle = COLORS.text; ctx.font = "12px -apple-system, sans-serif"; ctx.textAlign = "center";
      ctx.fillText(`X = ${v}`, x + 75, y + 20);
      ctx.fillText(members.map((m) => outcomes[m]).join(", "), x + 75, y + 40);
    });
    const selected = ats.filter((_, i) => mask & (1 << i)).flatMap(([, members]) => members).map((i) => outcomes[i]);
    readout.innerHTML = `<div class="row"><span class="lbl">generated event</span><span>${selected.length ? selected.join(", ") : "∅"}</span></div><div class="row"><span class="lbl">σ(X)</span><span>all unions of the level-set atoms of X</span></div>`;
  }
  document.querySelectorAll("[data-generated-x]").forEach((button) => button.addEventListener("click", () => {
    kind = button.dataset.generatedX;
    document.querySelectorAll("[data-generated-x]").forEach((b) => b.classList.toggle("active", b === button));
    maskIn.value = "1"; draw();
  }));
  maskIn.addEventListener("input", draw);
  draw();
})();

// ─────────── Figure 5b: Shrinking-ball RN derivative ───────────
(function rnBall() {
  const canvas = document.getElementById("fig-rn-ball");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const xIn = document.getElementById("fig-rn-ball-x");
  const rIn = document.getElementById("fig-rn-ball-r");
  const xV = document.getElementById("fig-rn-ball-x-v");
  const rV = document.getElementById("fig-rn-ball-r-v");
  const readout = document.getElementById("fig-rn-ball-readout");
  const mu = (x) => gaussian(x, 0, 1.25);
  const nu = (x) => 0.65 * gaussian(x, 0.9, 0.75) + 0.35 * gaussian(x, -1.4, 0.45);
  function mass(fn, a, b) {
    let s = 0, n = 160, dx = (b - a) / n;
    for (let i = 0; i <= n; i++) s += fn(a + i * dx) * (i === 0 || i === n ? 0.5 : 1);
    return s * dx;
  }
  function draw() {
    const x0 = +xIn.value, r = +rIn.value;
    xV.textContent = x0.toFixed(2); rV.textContent = r.toFixed(2);
    ctx.fillStyle = COLORS.bg; ctx.fillRect(0, 0, w, h);
    const px = 50, py = 28, ww = 620, hh = 210, xMin = -4, xMax = 4;
    drawSimpleAxes(ctx, px, py, ww, hh, 8, 4);
    const xs = Array.from({ length: 260 }, (_, i) => xMin + i / 259 * (xMax - xMin));
    const maxD = Math.max(...xs.map((x) => Math.max(mu(x), nu(x)))) * 1.15;
    const xS = (x) => px + ((x - xMin) / (xMax - xMin)) * ww;
    const yS = (v) => py + hh - (v / maxD) * hh;
    for (const [fn, color] of [[mu, COLORS.mu], [nu, COLORS.nu]] as [(x: number) => number, string][]) {
      ctx.beginPath();
      xs.forEach((x, i) => i ? ctx.lineTo(xS(x), yS(fn(x))) : ctx.moveTo(xS(x), yS(fn(x))));
      ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
    }
    ctx.fillStyle = "rgba(107,69,146,0.16)";
    ctx.fillRect(xS(x0 - r), py, xS(x0 + r) - xS(x0 - r), hh);
    const m = mass(mu, x0 - r, x0 + r), n = mass(nu, x0 - r, x0 + r);
    const ratio = n / m;
    const pointRatio = nu(x0) / mu(x0);
    readout.innerHTML = `<div class="row"><span class="lbl">ball ratio</span><span>ν(Bᵣ)/μ(Bᵣ) = ${ratio.toFixed(3)}</span></div><div class="row"><span class="lbl">point density ratio</span><span>dν/dμ at x ≈ ${pointRatio.toFixed(3)}</span></div>`;
  }
  [xIn, rIn].forEach((input) => input.addEventListener("input", draw));
  draw();
})();

// ─────────── Figure 3b: Bayes area diagram ───────────
(function bayesArea() {
  const canvas = document.getElementById("fig-bayes-area");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const priorIn = document.getElementById("fig-bayes-prior");
  const hitIn = document.getElementById("fig-bayes-hit");
  const falseIn = document.getElementById("fig-bayes-false");
  const priorV = document.getElementById("fig-bayes-prior-v");
  const hitV = document.getElementById("fig-bayes-hit-v");
  const falseV = document.getElementById("fig-bayes-false-v");
  const readout = document.getElementById("fig-bayes-area-readout");
  function draw() {
    const prior = +priorIn.value, hit = +hitIn.value, fp = +falseIn.value;
    priorV.textContent = prior.toFixed(2);
    hitV.textContent = hit.toFixed(2);
    falseV.textContent = fp.toFixed(2);
    const evidence = prior * hit + (1 - prior) * fp;
    const posterior = prior * hit / evidence;
    ctx.fillStyle = COLORS.bg; ctx.fillRect(0, 0, w, h);
    const x0 = 58, y0 = 32, ww = 390, hh = 260;
    ctx.strokeStyle = COLORS.axis; ctx.lineWidth = 2; ctx.strokeRect(x0, y0, ww, hh);
    const hW = prior * ww;
    const eH = evidence * hh;
    const hAndE = prior * hit / evidence * ww;
    ctx.fillStyle = "rgba(31,74,140,0.18)"; ctx.fillRect(x0, y0, hW, hh);
    ctx.fillStyle = "rgba(184,65,42,0.18)"; ctx.fillRect(x0, y0 + hh - eH, ww, eH);
    ctx.fillStyle = "rgba(107,69,146,0.48)"; ctx.fillRect(x0, y0 + hh - eH, hAndE, eH);
    ctx.strokeStyle = COLORS.mu; ctx.beginPath(); ctx.moveTo(x0 + hW, y0); ctx.lineTo(x0 + hW, y0 + hh); ctx.stroke();
    ctx.strokeStyle = COLORS.nu; ctx.beginPath(); ctx.moveTo(x0, y0 + hh - eH); ctx.lineTo(x0 + ww, y0 + hh - eH); ctx.stroke();
    ctx.fillStyle = COLORS.text; ctx.font = "13px -apple-system, sans-serif";
    ctx.fillText("unit square = probability 1", x0, y0 - 10);
    ctx.fillText("posterior is the fraction of the evidence band that lies in H", x0, y0 + hh + 24);
    const bx = 500, by = 62;
    ctx.font = "15px -apple-system, sans-serif";
    ctx.fillText("Bayes' theorem", bx, by);
    ctx.font = "13px 'SF Mono', monospace";
    ctx.fillText("P(H|E) = P(H∩E) / P(E)", bx, by + 34);
    ctx.fillText(`= ${(prior * hit).toFixed(3)} / ${evidence.toFixed(3)}`, bx, by + 62);
    ctx.fillText(`= ${posterior.toFixed(3)}`, bx, by + 90);
    readout.innerHTML =
      `<div class="row"><span class="lbl">evidence area P(E)</span><span>${evidence.toFixed(3)}</span></div>` +
      `<div class="row"><span class="lbl">posterior P(H|E)</span><span>${posterior.toFixed(3)}</span></div>`;
  }
  [priorIn, hitIn, falseIn].forEach((input) => input.addEventListener("input", draw));
  draw();
})();

// ─────────── Figure 2: Random variable & pushforward ───────────
(function fig2() {
  const canvas = document.getElementById("fig2");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);

  // Layout:
  //   Left band: vertical "Ω" axis (drawn at bottom as ω∈[0,1]).
  //   Center: the function X(ω) plotted.
  //   Right: histogram of X-values.
  const padL = 50, padR = 12, padT = 18, padB = 36;
  const plotW = (w - padL - padR) * 0.62;
  const histW = (w - padL - padR) - plotW - 18;
  const plotX = padL, plotY = padT;
  const plotH = h - padT - padB;
  const histX = plotX + plotW + 18;
  const bandColor = "#d89a1f";
  const bandFill = "rgba(216,154,31,0.24)";
  const bandStrongFill = "rgba(216,154,31,0.46)";
  const stackColor = "#168f86";
  const stackFill = "rgba(22,143,134,0.16)";

  // X represented by spline control points.
  let xPts: { o: number; x: number }[] = [
    { o: 0.00, x: 0.20 },
    { o: 0.25, x: 0.40 },
    { o: 0.50, x: 0.55 },
    { o: 0.75, x: 0.70 },
    { o: 1.00, x: 0.90 },
  ];
  let omegaBand = { a: 0.16, delta: 0.09 };
  let targetBand = { lo: 0.34, hi: 0.56 };
  let hoverX = null;

  function xOfOmega(o) {
    if (o <= xPts[0].o) return xPts[0].x;
    if (o >= xPts[xPts.length - 1].o) return xPts[xPts.length - 1].x;
    for (let i = 0; i < xPts.length - 1; i++) {
      if (o >= xPts[i].o && o <= xPts[i+1].o) {
        const p0 = xPts[i];
        const p1 = xPts[i + 1];
        if (Math.abs(p1.x - p0.x) < 1e-6) return p0.x;
        const dt = p1.o - p0.o;
        const t = (o - p0.o) / dt;
        const t2 = t * t;
        const t3 = t2 * t;
        const m0 = slopeAt(i);
        const m1 = slopeAt(i + 1);
        const h00 = 2 * t3 - 3 * t2 + 1;
        const h10 = t3 - 2 * t2 + t;
        const h01 = -2 * t3 + 3 * t2;
        const h11 = t3 - t2;
        return clamp(h00 * p0.x + h10 * dt * m0 + h01 * p1.x + h11 * dt * m1, 0, 1);
      }
    }
    return xPts[xPts.length - 1].x;
  }

  function slopeAt(i) {
    if (i === 0) return (xPts[1].x - xPts[0].x) / (xPts[1].o - xPts[0].o);
    if (i === xPts.length - 1) {
      const last = xPts.length - 1;
      return (xPts[last].x - xPts[last - 1].x) / (xPts[last].o - xPts[last - 1].o);
    }
    return (xPts[i + 1].x - xPts[i - 1].x) / (xPts[i + 1].o - xPts[i - 1].o);
  }

  function omegaToScreen(o) { return plotX + o * plotW; }
  function xToScreen(x) { return plotY + plotH - x * plotH; }
  function screenToOmega(px) { return clamp((px - plotX) / plotW, 0, 1); }
  function screenToX(py) { return clamp(1 - (py - plotY) / plotH, 0, 1); }

  function bandImage() {
    const steps = 80;
    let lo = Infinity;
    let hi = -Infinity;
    for (let i = 0; i <= steps; i++) {
      const o = omegaBand.a + omegaBand.delta * i / steps;
      const x = xOfOmega(o);
      lo = Math.min(lo, x);
      hi = Math.max(hi, x);
    }
    return { lo, hi };
  }

  function findPreimages(y) {
    const roots = [];
    const flats = [];
    const samples = 520;
    let prevO = 0;
    let prevV = xOfOmega(prevO) - y;
    for (let i = 1; i <= samples; i++) {
      const o = i / samples;
      const v = xOfOmega(o) - y;
      if (Math.abs(prevV) < 0.003 && Math.abs(v) < 0.003) {
        const start = prevO;
        let end = o;
        while (i < samples) {
          const nextO = (i + 1) / samples;
          const nextV = xOfOmega(nextO) - y;
          if (Math.abs(nextV) >= 0.003) break;
          i++;
          end = nextO;
        }
        if (end - start > 0.012) flats.push({ a: start, b: end });
        prevO = end;
        prevV = xOfOmega(end) - y;
        continue;
      }
      if (Math.abs(v) < 0.0015) {
        roots.push(o);
      } else if (prevV === 0 || v === 0 || prevV * v < 0) {
        let lo = prevO, hi = o;
        let vlo = prevV;
        for (let k = 0; k < 18; k++) {
          const mid = (lo + hi) / 2;
          const vmid = xOfOmega(mid) - y;
          if (vlo * vmid <= 0) {
            hi = mid;
          } else {
            lo = mid;
            vlo = vmid;
          }
        }
        roots.push((lo + hi) / 2);
      }
      prevO = o;
      prevV = v;
    }
    const flatContains = o => flats.some(f => o >= f.a - 0.006 && o <= f.b + 0.006);
    const deduped = [];
    for (const o of roots) {
      if (flatContains(o)) continue;
      if (!deduped.some(r => Math.abs(r - o) < 0.01)) deduped.push(o);
    }
    return { roots: deduped, flats };
  }
  function preimageIntervals(lo, hi) {
    const intervals = [];
    const samples = 700;
    let start = null;
    for (let i = 0; i <= samples; i++) {
      const o = i / samples;
      const x = xOfOmega(o);
      const inside = x >= lo && x <= hi;
      if (inside && start === null) {
        start = o;
      } else if (!inside && start !== null) {
        intervals.push({ a: start, b: (i - 1) / samples });
        start = null;
      }
    }
    if (start !== null) intervals.push({ a: start, b: 1 });
    return intervals.filter(interval => interval.b - interval.a > 0.001);
  }

  function pushforwardHistogram(bins) {
    const N = 4000;
    const counts = new Array(bins).fill(0);
    for (let i = 0; i < N; i++) {
      const o = Math.random();
      const x = xOfOmega(o);
      const b = clamp(Math.floor(x * bins), 0, bins - 1);
      counts[b]++;
    }
    return counts.map(c => c / N * bins); // density (per unit x)
  }

  function draw() {
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, w, h);

    // Grid.
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const px = plotX + (i / 5) * plotW;
      ctx.beginPath(); ctx.moveTo(px, plotY); ctx.lineTo(px, plotY + plotH); ctx.stroke();
      const py = plotY + (i / 5) * plotH;
      ctx.beginPath(); ctx.moveTo(plotX, py); ctx.lineTo(plotX + plotW, py); ctx.stroke();
    }
    // Axes.
    ctx.strokeStyle = COLORS.axis;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(plotX, plotY); ctx.lineTo(plotX, plotY + plotH); ctx.lineTo(plotX + plotW, plotY + plotH);
    ctx.stroke();

    ctx.fillStyle = COLORS.textDim;
    ctx.font = "italic 12px Georgia, serif";
    ctx.textBaseline = "top";
    ctx.textAlign = "center";
    ctx.fillText("ω  (sample space Ω = [0,1])", plotX + plotW / 2, plotY + plotH + 14);
    ctx.save();
    ctx.translate(plotX - 32, plotY + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("X(ω)", 0, 0);
    ctx.restore();
    ctx.textAlign = "left";

    const preimages = preimageIntervals(targetBand.lo, targetBand.hi);
    ctx.fillStyle = stackFill;
    ctx.strokeStyle = stackColor;
    ctx.lineWidth = 1.1;
    for (const interval of preimages) {
      const x1 = omegaToScreen(interval.a);
      const x2 = omegaToScreen(interval.b);
      ctx.fillRect(x1, plotY, x2 - x1, plotH);
      ctx.strokeRect(x1, plotY, x2 - x1, plotH);
    }

    // A selected interval [a, a+δ] in Ω whose mass is transported by X.
    const bandLeft = omegaToScreen(omegaBand.a);
    const bandRight = omegaToScreen(omegaBand.a + omegaBand.delta);
    const sourceBandH = 28;
    const sourceBandY = plotY + plotH - sourceBandH;
    ctx.fillStyle = bandFill;
    ctx.fillRect(bandLeft, plotY, bandRight - bandLeft, plotH);
    ctx.strokeStyle = bandColor;
    ctx.lineWidth = 1.3;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(bandLeft, plotY);
    ctx.lineTo(bandLeft, plotY + plotH);
    ctx.moveTo(bandRight, plotY);
    ctx.lineTo(bandRight, plotY + plotH);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = bandStrongFill;
    ctx.strokeStyle = bandColor;
    ctx.lineWidth = 1.5;
    ctx.fillRect(bandLeft, sourceBandY, bandRight - bandLeft, sourceBandH);
    ctx.strokeRect(bandLeft, sourceBandY, bandRight - bandLeft, sourceBandH);
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc((bandLeft + bandRight) / 2, sourceBandY + sourceBandH / 2, 4, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = bandColor;
    ctx.font = "11px 'SF Mono', monospace";
    ctx.textBaseline = "top";
    ctx.fillText(`[a,a+δ]`, bandLeft + 4, plotY + 6);

    // Draw X curve.
    ctx.strokeStyle = COLORS.mu;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    const curveSteps = 180;
    for (let i = 0; i <= curveSteps; i++) {
      const o = i / curveSteps;
      const px = omegaToScreen(o);
      const py = xToScreen(xOfOmega(o));
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    // Control points.
    for (let i = 0; i < xPts.length; i++) {
      const px = omegaToScreen(xPts[i].o);
      const py = xToScreen(xPts[i].x);
      ctx.fillStyle = "#fff";
      ctx.strokeStyle = COLORS.mu;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, 2 * Math.PI);
      ctx.fill(); ctx.stroke();
    }

    // Histogram of pushforward, drawn horizontally on the right.
    const bins = 30;
    const dens = pushforwardHistogram(bins);
    const maxD = Math.max(1, Math.max(...dens));
    for (let b = 0; b < bins; b++) {
      const y1 = xToScreen((b + 1) / bins);
      const y2 = xToScreen(b / bins);
      const bw = (dens[b] / maxD) * (histW - 6);
      ctx.fillStyle = COLORS.nuFill;
      ctx.strokeStyle = COLORS.nu;
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.rect(histX, y1, bw, y2 - y1);
      ctx.fill(); ctx.stroke();
    }

    const targetTop = xToScreen(targetBand.hi);
    const targetBottom = xToScreen(targetBand.lo);
    ctx.fillStyle = "rgba(22,143,134,0.20)";
    ctx.strokeStyle = stackColor;
    ctx.lineWidth = 1.5;
    ctx.fillRect(histX, targetTop, histW - 6, targetBottom - targetTop);
    ctx.strokeRect(histX, targetTop, histW - 6, targetBottom - targetTop);
    ctx.fillStyle = stackColor;
    ctx.font = "11px 'SF Mono', monospace";
    ctx.textBaseline = "top";
    ctx.fillText("B", histX + 6, targetTop + 5);
    ctx.strokeStyle = stackColor;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.55;
    for (const interval of preimages) {
      const mid = omegaToScreen((interval.a + interval.b) / 2);
      ctx.beginPath();
      ctx.moveTo(mid, xToScreen(xOfOmega((interval.a + interval.b) / 2)));
      ctx.lineTo(histX, (targetTop + targetBottom) / 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    const image = bandImage();
    const imageTop = xToScreen(image.hi);
    const imageBottom = xToScreen(image.lo);
    const imageH = Math.max(6, imageBottom - imageTop);
    const transportedArea = (bandRight - bandLeft) * sourceBandH;
    const imageW = clamp(transportedArea / imageH, 8, histW - 6);
    const imageY = (imageTop + imageBottom - imageH) / 2;
    ctx.fillStyle = bandStrongFill;
    ctx.strokeStyle = bandColor;
    ctx.lineWidth = 1.4;
    ctx.fillRect(histX, imageY, imageW, imageH);
    ctx.strokeRect(histX, imageY, imageW, imageH);
    ctx.strokeStyle = bandColor;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.65;
    ctx.beginPath();
    ctx.moveTo(bandLeft, xToScreen(xOfOmega(omegaBand.a)));
    ctx.lineTo(histX, imageBottom);
    ctx.moveTo(bandRight, xToScreen(xOfOmega(omegaBand.a + omegaBand.delta)));
    ctx.lineTo(histX, imageTop);
    ctx.stroke();
    ctx.globalAlpha = 1;

    if (hoverX !== null) {
      const { roots, flats } = findPreimages(hoverX);
      const y = xToScreen(hoverX);
      ctx.strokeStyle = stackColor;
      ctx.lineWidth = 1.4;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(plotX, y);
      ctx.lineTo(histX + histW, y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = stackFill;
      for (const f of flats) {
        const x1 = omegaToScreen(f.a);
        const x2 = omegaToScreen(f.b);
        ctx.fillRect(x1, plotY, x2 - x1, plotH);
        ctx.strokeStyle = stackColor;
        ctx.strokeRect(x1, plotY, x2 - x1, plotH);
      }
      for (const o of roots) {
        const px = omegaToScreen(o);
        const py = xToScreen(xOfOmega(o));
        ctx.strokeStyle = stackColor;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px, plotY + plotH);
        ctx.stroke();
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      }
      ctx.fillStyle = stackColor;
      ctx.font = "11px -apple-system, sans-serif";
      ctx.textBaseline = "bottom";
      const stackParts = [];
      if (roots.length) stackParts.push(`${roots.length} point${roots.length === 1 ? "" : "s"}`);
      if (flats.length) stackParts.push(`${flats.length} interval${flats.length === 1 ? "" : "s"}`);
      ctx.fillText(`X⁻¹({${hoverX.toFixed(2)}}): ${stackParts.join(" + ") || "empty stack"}`,
                   histX, y - 5);
    }

    // Histogram axis.
    ctx.strokeStyle = COLORS.axis;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(histX, plotY); ctx.lineTo(histX, plotY + plotH);
    ctx.stroke();
    ctx.fillStyle = COLORS.textDim;
    ctx.font = "11px -apple-system, sans-serif";
    ctx.textBaseline = "bottom";
    ctx.fillText("density of ℙ_X on ℝ", histX, plotY - 4);

    const readout = document.getElementById("fig2-readout");
    if (readout) {
      const preimageMass = preimages.reduce((sum, interval) => sum + interval.b - interval.a, 0);
      readout.innerHTML =
        `<div class="row"><span class="lbl">target set</span><span>B = [${targetBand.lo.toFixed(2)}, ${targetBand.hi.toFixed(2)}]</span></div>` +
        `<div class="row"><span class="lbl">preimage event</span><span>X⁻¹(B) has ℙ-measure ${preimageMass.toFixed(3)}</span></div>` +
        `<div class="row"><span class="lbl">pushforward</span><span>ℙ_X(B) = ℙ(X⁻¹(B))</span></div>`;
    }
  }

  // Drag control points and bands.
  let dragBand = false;
  let dragTargetBand = false;
  let dragTargetOffset = 0;
  let dragBandOffset = 0;
  function ptAt(mx, my) {
    for (let i = 0; i < xPts.length; i++) {
      const px = omegaToScreen(xPts[i].o);
      const py = xToScreen(xPts[i].x);
      const dx = mx - px, dy = my - py;
      if (dx * dx + dy * dy < 100) return i;
    }
    return -1;
  }
  function inPlot(mx, my) {
    return mx >= plotX && mx <= plotX + plotW && my >= plotY && my <= plotY + plotH;
  }
  function inBand(mx, my) {
    if (!inPlot(mx, my)) return false;
    const o = screenToOmega(mx);
    return o >= omegaBand.a && o <= omegaBand.a + omegaBand.delta;
  }
  function overDensityAxis(mx, my) {
    return mx >= histX - 10 && mx <= histX + histW && my >= plotY && my <= plotY + plotH;
  }
  function inTargetBand(mx, my) {
    if (!overDensityAxis(mx, my)) return false;
    const x = screenToX(my);
    return x >= targetBand.lo && x <= targetBand.hi;
  }
  function getPointer(ev) {
    const r = canvas.getBoundingClientRect();
    return [ev.clientX - r.left, ev.clientY - r.top];
  }
  let lastPointer = null;
  function updateCursor(ev) {
    if (typeof ev.clientX === "number") {
      lastPointer = getPointer(ev);
    }
    if (!lastPointer) return;
    if (dragBand) {
      canvas.style.cursor = "ew-resize";
      return;
    }
    if (dragTargetBand) {
      canvas.style.cursor = "ns-resize";
      return;
    }
    const [mx, my] = lastPointer;
    const i = ptAt(mx, my);
    if (i >= 0) return;
    if (inBand(mx, my)) canvas.style.cursor = "ew-resize";
    else if (inTargetBand(mx, my)) canvas.style.cursor = "ns-resize";
    else if (overDensityAxis(mx, my)) canvas.style.cursor = "crosshair";
    else canvas.style.cursor = "default";
  }
  bindEditablePoints({
    canvas: canvas as HTMLCanvasElement,
    getPoints: () => xPts,
    setPoints: points => { xPts = points; },
    screenToData: point => inPlot(point.x, point.y) ? { o: screenToOmega(point.x), x: screenToX(point.y) } : null,
    dataToScreen: point => ({ x: omegaToScreen(point.o), y: xToScreen(point.x) }),
    inBounds: (_point, screenPoint) => inPlot(screenPoint.x, screenPoint.y),
    hitRadius: 10,
    addGesture: "alt",
    removeGesture: "alt",
    canAddPoint: (point, points) => !points.some(p => Math.abs(p.o - point.o) < 0.025),
    canRemovePoint: (index, points) => index > 0 && index < points.length - 1,
    constrainPoint: (point, index, points) => ({
      o: index > 0 && index < points.length - 1
        ? clamp(point.o, points[index - 1].o + 0.02, points[index + 1].o - 0.02)
        : points[index].o,
      x: point.x,
    }),
    afterAddPoint: points => points.sort((a, b) => a.o - b.o),
    onChange: draw,
  });
  canvas.addEventListener("pointerdown", ev => {
    const [mx, my] = getPointer(ev);
    if (ptAt(mx, my) >= 0) return;
    if (inBand(mx, my)) {
      dragBand = true;
      dragBandOffset = screenToOmega(mx) - omegaBand.a;
      canvas.setPointerCapture(ev.pointerId);
      updateCursor(ev);
      ev.preventDefault();
      return;
    }
    if (inTargetBand(mx, my)) {
      dragTargetBand = true;
      dragTargetOffset = screenToX(my) - targetBand.lo;
      canvas.setPointerCapture(ev.pointerId);
      updateCursor(ev);
      ev.preventDefault();
    }
  });
  canvas.addEventListener("pointermove", ev => {
    const [mx, my] = getPointer(ev);
    if (dragBand) {
      omegaBand.a = clamp(screenToOmega(mx) - dragBandOffset, 0, 1 - omegaBand.delta);
      draw();
      updateCursor(ev);
      ev.preventDefault();
      return;
    }
    if (dragTargetBand) {
      const width = targetBand.hi - targetBand.lo;
      targetBand.lo = clamp(screenToX(my) - dragTargetOffset, 0, 1 - width);
      targetBand.hi = targetBand.lo + width;
      draw();
      updateCursor(ev);
      ev.preventDefault();
      return;
    }
    const nextHoverX = overDensityAxis(mx, my) ? screenToX(my) : null;
    if (nextHoverX !== hoverX) {
      hoverX = nextHoverX;
      draw();
    }
    updateCursor(ev);
  });
  canvas.addEventListener("pointerup", ev => {
    dragBand = false;
    dragTargetBand = false;
    if (canvas.hasPointerCapture(ev.pointerId)) canvas.releasePointerCapture(ev.pointerId);
    updateCursor(ev);
  });
  canvas.addEventListener("pointercancel", ev => { dragBand = false; dragTargetBand = false; updateCursor(ev); });
  canvas.addEventListener("pointerleave", () => {
    lastPointer = null;
    hoverX = null;
    draw();
    canvas.style.cursor = "default";
  });
  window.addEventListener("keyup", ev => updateCursor(ev));
  window.addEventListener("keydown", ev => updateCursor(ev));
  canvas.style.cursor = "default";
  canvas.style.touchAction = "none";

  function applyPreset(name) {
    if (name === "identity") {
      xPts = [{ o: 0, x: 0 }, { o: 0.25, x: 0.25 }, { o: 0.5, x: 0.5 }, { o: 0.75, x: 0.75 }, { o: 1, x: 1 }];
    } else if (name === "square") {
      xPts = [{ o: 0, x: 0 }, { o: 0.25, x: 0.0625 }, { o: 0.5, x: 0.25 }, { o: 0.75, x: 0.5625 }, { o: 1, x: 1 }];
    } else if (name === "tent") {
      xPts = [{ o: 0, x: 0 }, { o: 0.25, x: 0.5 }, { o: 0.5, x: 1 }, { o: 0.75, x: 0.5 }, { o: 1, x: 0 }];
    } else if (name === "step") {
      xPts = [{ o: 0, x: 0.10 }, { o: 0.25, x: 0.10 }, { o: 0.5, x: 0.50 }, { o: 0.75, x: 0.90 }, { o: 1, x: 0.90 }];
    }
    draw();
  }
  document.querySelectorAll("[data-fig2-preset]").forEach(b => {
    b.addEventListener("click", () => applyPreset(b.dataset.fig2Preset));
  });

  draw();
})();

// ─────────── Figure 3: Absolute continuity ───────────
(function fig3() {
  const canvas = document.getElementById("fig3");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);

  const padL = 40, padR = 14, padT = 18, padB = 30;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;
  const plotX = padL, plotY = padT;

  const ids = ["muc", "muw", "nuc", "nuw"];
  const inputs = Object.fromEntries(ids.map(k => [k, document.getElementById("fig3-" + k)]));
  const vals = Object.fromEntries(ids.map(k => [k, document.getElementById("fig3-" + k + "-v")]));
  let holeCenter = 0.43;
  let holeWidth = 0.10;
  let holeMode = "fail";
  let draggingHole = false;

  // We use truncated-uniform distributions on [0,1]. μ has support [muc-muw/2, muc+muw/2].
  function support(c, wd) { return [Math.max(0, c - wd / 2), Math.min(1, c + wd / 2)]; }
  function density(c, wd, x) {
    const [a, b] = support(c, wd);
    if (x < a || x > b) return 0;
    return 1 / (b - a);
  }
  function hole() {
    return [clamp(holeCenter - holeWidth / 2, 0, 1), clamp(holeCenter + holeWidth / 2, 0, 1)];
  }

  function draw() {
    const muc = +inputs.muc.value, muw = +inputs.muw.value;
    const nuc = +inputs.nuc.value, nuw = +inputs.nuw.value;
    vals.muc.textContent = muc.toFixed(2);
    vals.muw.textContent = muw.toFixed(2);
    vals.nuc.textContent = nuc.toFixed(2);
    vals.nuw.textContent = nuw.toFixed(2);

    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, w, h);

    // Axes
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const px = plotX + (i / 10) * plotW;
      ctx.beginPath(); ctx.moveTo(px, plotY); ctx.lineTo(px, plotY + plotH); ctx.stroke();
    }
    ctx.strokeStyle = COLORS.axis;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(plotX, plotY); ctx.lineTo(plotX, plotY + plotH); ctx.lineTo(plotX + plotW, plotY + plotH);
    ctx.stroke();
    ctx.fillStyle = COLORS.textDim;
    ctx.font = "11px -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let i = 0; i <= 5; i++) {
      const x = i / 5;
      ctx.fillText(x.toFixed(1), plotX + x * plotW, plotY + plotH + 4);
    }
    ctx.textAlign = "left";
    ctx.fillText("x", plotX + plotW - 8, plotY + plotH + 16);

    const dMax = Math.max(1 / Math.max(0.04, muw), 1 / Math.max(0.04, nuw)) * 1.05;
    function yForDensity(d) { return plotY + plotH - (d / dMax) * plotH; }

    const [holeA, holeB] = hole();
    // μ
    const [muA, muB] = support(muc, muw);
    ctx.fillStyle = COLORS.muFill;
    ctx.strokeStyle = COLORS.mu;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(plotX + muA * plotW, plotY + plotH);
    ctx.lineTo(plotX + muA * plotW, yForDensity(1 / (muB - muA)));
    ctx.lineTo(plotX + muB * plotW, yForDensity(1 / (muB - muA)));
    ctx.lineTo(plotX + muB * plotW, plotY + plotH);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    const holeOverlapA = Math.max(muA, holeA);
    const holeOverlapB = Math.min(muB, holeB);
    if (holeOverlapB > holeOverlapA) {
      ctx.fillStyle = "rgba(184,65,42,0.22)";
      ctx.fillRect(plotX + holeOverlapA * plotW, plotY, (holeOverlapB - holeOverlapA) * plotW, plotH);
      ctx.strokeStyle = COLORS.nu;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(plotX + holeOverlapA * plotW, plotY + 4, (holeOverlapB - holeOverlapA) * plotW, plotH - 8);
      ctx.setLineDash([]);
    }

    // ν
    const [nuA, nuB] = support(nuc, nuw);
    const nuTouchesHole = Math.max(nuA, holeOverlapA) < Math.min(nuB, holeOverlapB);
    ctx.fillStyle = holeMode === "fail" && nuTouchesHole ? "rgba(184,65,42,0.42)" : COLORS.nuFill;
    ctx.strokeStyle = holeMode === "fail" && nuTouchesHole ? COLORS.nu : COLORS.nu;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(plotX + nuA * plotW, plotY + plotH);
    ctx.lineTo(plotX + nuA * plotW, yForDensity(1 / (nuB - nuA)));
    ctx.lineTo(plotX + nuB * plotW, yForDensity(1 / (nuB - nuA)));
    ctx.lineTo(plotX + nuB * plotW, plotY + plotH);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Test absolute continuity: does ν have mass where μ has none?
    // Equivalent here: supp(ν) ⊆ supp(μ), except that μ has a draggable hole.
    const outsideSupport = nuA < muA - 1e-9 || nuB > muB + 1e-9;
    const violatesHole = holeMode === "fail" && nuTouchesHole;
    const isAC = !outsideSupport && !violatesHole;

    // Highlight singular region(s)
    if (!isAC) {
      ctx.fillStyle = "rgba(184,65,42,0.18)";
      // Region where ν is positive but μ is not.
      const r1a = Math.max(0, nuA), r1b = Math.min(muA, nuB);
      if (r1b > r1a) ctx.fillRect(plotX + r1a * plotW, plotY, (r1b - r1a) * plotW, plotH);
      const r2a = Math.max(nuA, muB), r2b = Math.min(1, nuB);
      if (r2b > r2a) ctx.fillRect(plotX + r2a * plotW, plotY, (r2b - r2a) * plotW, plotH);
      // Hatched diagonal stripe so it's distinguishable.
      ctx.save();
      ctx.strokeStyle = "rgba(184,65,42,0.5)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (const [a, b] of [[r1a, r1b], [r2a, r2b]]) {
        if (b > a) {
          for (let xs = a * plotW; xs < b * plotW + plotH; xs += 8) {
            const x1 = plotX + xs;
            const y1 = plotY;
            const x2 = plotX + xs - plotH;
            const y2 = plotY + plotH;
            ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
          }
        }
      }
      ctx.stroke();
      ctx.restore();
    }

    // Badge
    ctx.font = "600 12px -apple-system, sans-serif";
    ctx.textBaseline = "top";
    ctx.textAlign = "right";
    const badgeText = isAC ? "ν ≪ μ  ✓" : "ν ⊄ μ  (singular region)";
    const badgeColor = isAC ? COLORS.mu : COLORS.nu;
    const tw = ctx.measureText(badgeText).width;
    ctx.fillStyle = badgeColor;
    ctx.fillRect(plotX + plotW - tw - 16, plotY + 4, tw + 12, 22);
    ctx.fillStyle = "#fff";
    ctx.fillText(badgeText, plotX + plotW - 10, plotY + 9);
    ctx.textAlign = "left";

    const readout = document.getElementById("fig3-readout");
    if (readout) {
      readout.innerHTML =
        `<div class="row"><span class="lbl">supp(μ)</span><span>[${muA.toFixed(2)}, ${muB.toFixed(2)}] minus hole [${holeOverlapA.toFixed(2)}, ${holeOverlapB.toFixed(2)}]</span></div>` +
        `<div class="row"><span class="lbl">supp(ν)</span><span>[${nuA.toFixed(2)}, ${nuB.toFixed(2)}]</span></div>` +
        `<div class="row"><span class="lbl">absolute continuity</span><span style="color:${isAC ? COLORS.mu : COLORS.nu};font-weight:600">${isAC ? "ν ≪ μ  ✓" : "fails — ν gives mass where μ does not"}</span></div>`;
    }
  }

  ids.forEach(k => inputs[k].addEventListener("input", draw));
  document.querySelectorAll("[data-fig3-hole]").forEach((button) => {
    button.addEventListener("click", () => {
      holeMode = button.dataset.fig3Hole;
      document.querySelectorAll("[data-fig3-hole]").forEach((b) => b.classList.toggle("active", b === button));
      if (holeMode === "pass") {
        inputs.nuc.value = "0.70";
        inputs.nuw.value = "0.12";
      } else {
        inputs.nuc.value = holeCenter.toFixed(2);
        inputs.nuw.value = "0.16";
      }
      draw();
    });
  });
  canvas.addEventListener("pointerdown", (ev) => {
    const rect = canvas.getBoundingClientRect();
    const x = (ev.clientX - rect.left - plotX) / plotW;
    const [a, b] = hole();
    if (x >= a - 0.03 && x <= b + 0.03) {
      draggingHole = true;
      canvas.setPointerCapture(ev.pointerId);
    }
  });
  canvas.addEventListener("pointermove", (ev) => {
    if (!draggingHole) return;
    const rect = canvas.getBoundingClientRect();
    holeCenter = clamp((ev.clientX - rect.left - plotX) / plotW, 0.08, 0.92);
    if (holeMode === "fail") inputs.nuc.value = holeCenter.toFixed(2);
    draw();
  });
  canvas.addEventListener("pointerup", (ev) => {
    draggingHole = false;
    if (canvas.hasPointerCapture(ev.pointerId)) canvas.releasePointerCapture(ev.pointerId);
  });
  canvas.addEventListener("pointercancel", () => { draggingHole = false; });
  draw();
})();

// ─────────── Figure 4: Radon–Nikodym derivative ───────────
(function fig4() {
  const canvas = document.getElementById("fig4");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);

  const padL = 46, padR = 14, padT = 16, padB = 30;
  const halfH = (h - padT - padB - 14) / 2;
  const plotW = w - padL - padR;
  const topY = padT;
  const botY = padT + halfH + 14;

  let preset = "shift";
  const pInput = document.getElementById("fig4-p");
  const pVal = document.getElementById("fig4-p-v");

  // x range [-4, 4]
  const xMin = -4, xMax = 4;
  function xToScreen(x) { return padL + ((x - xMin) / (xMax - xMin)) * plotW; }

  function densities(p) {
    // p ∈ [0,1] mapped to preset-specific parameter.
    if (preset === "shift") {
      const mu = (x) => gaussian(x, 0, 1);
      const dx = (p - 0.5) * 4; // -2 .. 2
      const nu = (x) => gaussian(x, dx, 1);
      return { mu, nu, param: `shift Δ = ${dx.toFixed(2)}` };
    } else if (preset === "scale") {
      const mu = (x) => gaussian(x, 0, 1);
      const sigma = 0.3 + p * 1.7; // 0.3 .. 2
      const nu = (x) => gaussian(x, 0, sigma);
      return { mu, nu, param: `σ_ν = ${sigma.toFixed(2)}` };
    } else if (preset === "skew") {
      const mu = (x) => gaussian(x, 0, 1);
      // ν ∝ μ(x) · exp(θ x)  (exponential tilt)
      const theta = (p - 0.5) * 3; // -1.5 .. 1.5
      // Normalizing constant: ∫ μ(x) e^{θx} dx = e^{θ²/2}
      const Z = Math.exp(theta * theta / 2);
      const nu = (x) => mu(x) * Math.exp(theta * x) / Z;
      return { mu, nu, param: `tilt θ = ${theta.toFixed(2)}` };
    } else {
      // "break": ν has a piece outside μ's effective support.
      const mu = (x) => gaussian(x, 0, 0.8);
      const m = p * 4; // 0 .. 4
      const nu = (x) => 0.5 * gaussian(x, 0, 0.8) + 0.5 * gaussian(x, m, 0.3);
      return { mu, nu, param: `secondary mode at x = ${m.toFixed(2)}` };
    }
  }

  function draw() {
    const p = +pInput.value;
    pVal.textContent = p.toFixed(2);
    const { mu, nu, param } = densities(p);

    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, w, h);

    // ── Top panel: μ and ν densities ──
    const yTopAxis = topY + halfH;
    // Grid
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 8; i++) {
      const px = padL + (i / 8) * plotW;
      ctx.beginPath(); ctx.moveTo(px, topY); ctx.lineTo(px, yTopAxis); ctx.stroke();
    }
    ctx.strokeStyle = COLORS.axis;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(padL, topY); ctx.lineTo(padL, yTopAxis); ctx.lineTo(padL + plotW, yTopAxis);
    ctx.stroke();

    // sample densities
    const N = 240;
    const muSamples = [], nuSamples = [];
    let dMax = 0;
    for (let i = 0; i <= N; i++) {
      const x = xMin + (i / N) * (xMax - xMin);
      const m = mu(x), n = nu(x);
      muSamples.push([x, m]); nuSamples.push([x, n]);
      if (m > dMax) dMax = m;
      if (n > dMax) dMax = n;
    }
    dMax *= 1.1;
    function topYFor(d) { return yTopAxis - (d / dMax) * halfH; }

    // μ
    ctx.beginPath();
    for (let i = 0; i < muSamples.length; i++) {
      const px = xToScreen(muSamples[i][0]);
      const py = topYFor(muSamples[i][1]);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.lineTo(xToScreen(xMax), yTopAxis);
    ctx.lineTo(xToScreen(xMin), yTopAxis);
    ctx.closePath();
    ctx.fillStyle = COLORS.muFill;
    ctx.fill();
    ctx.beginPath();
    for (let i = 0; i < muSamples.length; i++) {
      const px = xToScreen(muSamples[i][0]);
      const py = topYFor(muSamples[i][1]);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = COLORS.mu;
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // ν
    ctx.beginPath();
    for (let i = 0; i < nuSamples.length; i++) {
      const px = xToScreen(nuSamples[i][0]);
      const py = topYFor(nuSamples[i][1]);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.lineTo(xToScreen(xMax), yTopAxis);
    ctx.lineTo(xToScreen(xMin), yTopAxis);
    ctx.closePath();
    ctx.fillStyle = COLORS.nuFill;
    ctx.fill();
    ctx.beginPath();
    for (let i = 0; i < nuSamples.length; i++) {
      const px = xToScreen(nuSamples[i][0]);
      const py = topYFor(nuSamples[i][1]);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = COLORS.nu;
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Label
    ctx.font = "11px -apple-system, sans-serif";
    ctx.fillStyle = COLORS.textDim;
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    ctx.fillText("densities (top)   ratio  dν/dμ  (bottom)", padL, topY + 2);
    ctx.textAlign = "right";
    ctx.fillText(param, padL + plotW, topY + 2);
    ctx.textAlign = "left";

    // ── Bottom panel: ratio f = dν/dμ ──
    const yBotAxis = botY + halfH;
    // Grid
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 8; i++) {
      const px = padL + (i / 8) * plotW;
      ctx.beginPath(); ctx.moveTo(px, botY); ctx.lineTo(px, yBotAxis); ctx.stroke();
    }
    ctx.strokeStyle = COLORS.axis;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(padL, botY); ctx.lineTo(padL, yBotAxis); ctx.lineTo(padL + plotW, yBotAxis);
    ctx.stroke();
    // Reference 1
    const yOne = yBotAxis - 0.25 * halfH;
    ctx.strokeStyle = "#bfb9aa";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padL, yOne); ctx.lineTo(padL + plotW, yOne);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = COLORS.textDim;
    ctx.textBaseline = "middle";
    ctx.textAlign = "right";
    ctx.fillText("1", padL - 4, yOne);
    ctx.fillText("0", padL - 4, yBotAxis);
    ctx.textAlign = "left";

    // Plot ratio. The display caps at ratioCap; values beyond it would
    // otherwise render as a flat line clamped to the panel top. NaN marks
    // singular points (μ=0, ν>0) so the polyline breaks and gets a spike
    // marker drawn separately below.
    const ratioCap = 4;
    const xData: number[] = [];
    const rData: number[] = [];
    for (let i = 0; i < muSamples.length; i++) {
      const x = muSamples[i][0];
      const m = mu(x), n = nu(x);
      const eps = 1e-6;
      xData.push(x);
      if (m < eps && n > eps) rData.push(NaN);
      else rData.push(m < eps ? 0 : n / m);
    }
    drawClippedLine(
      ctx,
      xData,
      rData,
      0,
      ratioCap,
      xToScreen,
      yBotAxis - halfH,
      halfH,
      COLORS.rn,
      { width: 2 },
    );

    // Spike markers where ratio is large/undefined.
    for (let i = 0; i < muSamples.length; i++) {
      const x = muSamples[i][0];
      const m = mu(x), n = nu(x);
      const eps = 1e-4;
      if (m < eps && n > eps) {
        const px = xToScreen(x);
        ctx.strokeStyle = COLORS.rn;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(px, botY); ctx.lineTo(px, yBotAxis);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // x ticks bottom
    ctx.fillStyle = COLORS.textDim;
    ctx.font = "11px -apple-system, sans-serif";
    ctx.textBaseline = "top";
    ctx.textAlign = "center";
    for (let v = xMin; v <= xMax; v++) {
      ctx.fillText(v.toString(), xToScreen(v), yBotAxis + 4);
    }
    ctx.textAlign = "left";
    ctx.fillText("x", padL + plotW - 8, yBotAxis + 16);
  }

  pInput.addEventListener("input", draw);
  document.querySelectorAll("[data-fig4-preset]").forEach(b => {
    b.addEventListener("click", () => {
      preset = b.dataset.fig4Preset;
      document.querySelectorAll("[data-fig4-preset]").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      draw();
    });
  });
  // Mark first as active
  const firstBtn = document.querySelector("[data-fig4-preset]");
  if (firstBtn) firstBtn.classList.add("active");

  draw();
})();

// ─────────── Figure 5: Importance sampling ───────────
(function fig5() {
  const canvas = document.getElementById("fig5");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);

  const shiftIn = document.getElementById("fig5-shift");
  const shiftV = document.getElementById("fig5-shift-v");
  const nIn = document.getElementById("fig5-n");
  const nV = document.getElementById("fig5-n-v");
  const btn = document.getElementById("fig5-resample");
  const readout = document.getElementById("fig5-readout");

  // μ = N(0,1), ν = N(Δ,1). g(x) = x^2 (or pick something simple).
  // Truth: E_ν[X^2] = 1 + Δ^2.
  let samplesMu = [];
  let samplesNu = [];
  function regenerate() {
    const N = +nIn.value;
    samplesMu = []; samplesNu = [];
    for (let i = 0; i < N; i++) {
      samplesMu.push(gaussianSample(0, 1));
      samplesNu.push(gaussianSample(+shiftIn.value, 1));
    }
  }

  function draw() {
    const N = +nIn.value;
    const Delta = +shiftIn.value;
    shiftV.textContent = Delta.toFixed(2);
    nV.textContent = N.toString();

    if (samplesMu.length !== N) regenerate();

    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, w, h);

    const padL = 50, padR = 14, padT = 18, padB = 30;
    const colW = (w - padL - padR - 24) / 2;
    const plotH = h - padT - padB;

    const xMin = -4, xMax = 5;
    function xS(x, x0) { return x0 + ((x - xMin) / (xMax - xMin)) * colW; }

    function drawPanel(x0, title, points, weights, distFn) {
      // Background frame
      ctx.strokeStyle = COLORS.grid;
      ctx.lineWidth = 1;
      for (let i = 0; i <= 9; i++) {
        const px = x0 + (i / 9) * colW;
        ctx.beginPath(); ctx.moveTo(px, padT); ctx.lineTo(px, padT + plotH); ctx.stroke();
      }
      ctx.strokeStyle = COLORS.axis;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x0, padT); ctx.lineTo(x0, padT + plotH); ctx.lineTo(x0 + colW, padT + plotH);
      ctx.stroke();

      // Density curve
      ctx.beginPath();
      const samples = 200;
      let dMax = 0;
      const arr = [];
      for (let i = 0; i <= samples; i++) {
        const x = xMin + (i / samples) * (xMax - xMin);
        const d = distFn(x);
        arr.push([x, d]);
        if (d > dMax) dMax = d;
      }
      dMax *= 1.2;
      const baseAx = padT + plotH;
      function yD(d) { return baseAx - (d / dMax) * plotH * 0.7; }
      for (let i = 0; i < arr.length; i++) {
        const px = xS(arr[i][0], x0);
        const py = yD(arr[i][1]);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = title.indexOf("ν") >= 0 ? COLORS.nu : COLORS.mu;
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Sample dots with weights as opacity / size
      const maxW = weights ? Math.max(...weights, 1e-9) : 1;
      for (let i = 0; i < points.length; i++) {
        const x = points[i];
        if (x < xMin || x > xMax) continue;
        const px = xS(x, x0);
        const w0 = weights ? weights[i] / maxW : 1;
        const r = weights ? 1.5 + 5 * Math.sqrt(w0) : 2.5;
        ctx.fillStyle = weights ? `rgba(107,69,146,${0.15 + 0.6 * w0})` : "rgba(184,65,42,0.35)";
        ctx.beginPath();
        // jitter y for visibility
        const jy = baseAx - 8 - (i % 17) * 1.4;
        ctx.arc(px, jy, r, 0, 2 * Math.PI);
        ctx.fill();
      }

      // Title
      ctx.fillStyle = COLORS.text;
      ctx.font = "600 12px -apple-system, sans-serif";
      ctx.textBaseline = "top";
      ctx.textAlign = "left";
      ctx.fillText(title, x0, padT + 4);

      // x ticks
      ctx.fillStyle = COLORS.textDim;
      ctx.font = "11px -apple-system, sans-serif";
      ctx.textBaseline = "top";
      ctx.textAlign = "center";
      for (let v = -4; v <= 5; v++) {
        ctx.fillText(v.toString(), xS(v, x0), padT + plotH + 4);
      }
    }

    // Left: sample directly from ν.
    const muDist = (x) => gaussian(x, 0, 1);
    const nuDist = (x) => gaussian(x, Delta, 1);
    const directEst = samplesNu.reduce((s, x) => s + x * x, 0) / N;
    const directVar = samplesNu.reduce((s, x) => s + (x * x - directEst) ** 2, 0) / N;

    drawPanel(padL, "Direct  X ~ ν,   E_ν[X²]", samplesNu, null, nuDist);

    // Right: importance sampling from μ.
    const weights = samplesMu.map(x => nuDist(x) / muDist(x));
    const isEst = samplesMu.reduce((s, x, i) => s + x * x * weights[i], 0) / N;
    const isVar = samplesMu.reduce((s, x, i) => s + (x * x * weights[i] - isEst) ** 2, 0) / N;

    drawPanel(padL + colW + 24, "Importance  X ~ μ, weighted by dν/dμ", samplesMu, weights, muDist);

    const truth = 1 + Delta * Delta;
    if (readout) {
      readout.innerHTML =
        `<div class="row"><span class="lbl">true E_ν[X²]</span><span>${truth.toFixed(4)}</span></div>` +
        `<div class="row"><span class="lbl">direct estimate (N=${N})</span><span>${directEst.toFixed(4)} &nbsp;·&nbsp; sd ≈ ${Math.sqrt(directVar / N).toFixed(4)}</span></div>` +
        `<div class="row"><span class="lbl">importance estimate</span><span>${isEst.toFixed(4)} &nbsp;·&nbsp; sd ≈ ${Math.sqrt(isVar / N).toFixed(4)}</span></div>` +
        `<div class="row"><span class="lbl">max weight</span><span>${Math.max(...weights).toFixed(2)} &nbsp;(large = heavy-tailed reweighting)</span></div>`;
    }
  }

  shiftIn.addEventListener("input", () => { regenerate(); draw(); });
  nIn.addEventListener("input", () => { regenerate(); draw(); });
  btn.addEventListener("click", () => { regenerate(); draw(); });

  regenerate();
  draw();
})();

// ─────────── Figure 2: σ-field pre-image check ───────────
(function sigmaFig() {
  const canvas = document.getElementById("sigma-fig");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);

  // Four outcomes laid out in a 2×2 grid (1st coin = row, 2nd coin = column).
  // HH HT
  // TH TT
  const OUTCOMES = ["HH", "HT", "TH", "TT"];
  const X_TABLES = {
    first:  { HH: 1, HT: 1, TH: 0, TT: 0 }, // 1st coin is heads
    second: { HH: 1, HT: 0, TH: 1, TT: 0 }, // 2nd coin is heads
    count:  { HH: 2, HT: 1, TH: 1, TT: 0 }, // # heads
  };
  const X_MAX = { first: 1, second: 1, count: 2 };
  const X_LABEL = {
    first:  "X_a(ω) = 1 if 1st coin is heads",
    second: "X_b(ω) = 1 if 2nd coin is heads",
    count:  "X_c(ω) = # of heads",
  };
  // σ-field cells: each cell is a set of outcomes (an atom of the partition).
  function cellsOf(field) {
    if (field === "first")  return [["HH", "HT"], ["TH", "TT"]];
    if (field === "second") return [["HH", "TH"], ["HT", "TT"]];
    return [["HH"], ["HT"], ["TH"], ["TT"]];
  }
  function cellLabel(field, cellIdx) {
    if (field === "first")  return cellIdx === 0 ? "1st = H" : "1st = T";
    if (field === "second") return cellIdx === 0 ? "2nd = H" : "2nd = T";
    return OUTCOMES[cellIdx];
  }

  // State.
  let sigmaField = "first";
  let xChoice = "first";
  // B is a real-interval [lo, hi]; we snap endpoints to half-integers so it
  // unambiguously contains integer values.
  let bRange = { lo: 0.5, hi: 1.5 }; // selects {1}
  let dragging = false;
  let dragStartCenter = null;

  // Layout.
  const padL = 18, padR = 18, padT = 22, padB = 60;
  const omegaW = (w - padL - padR) * 0.45 - 12;
  const omegaH = h - padT - padB;
  const omegaX = padL;
  const omegaY = padT;
  const rlineX = omegaX + omegaW + 36;
  const rlineW = w - rlineX - padR;
  const rlineAxisY = omegaY + omegaH * 0.55;
  const verdictY = h - 26;

  // Disk geometry — 2×2 grid inside the Ω panel, with breathing room on the
  // sides to allow the σ-field cell rectangles to enclose rows/columns.
  const diskR = Math.min(omegaW, omegaH) * 0.10;
  const cellMargin = 14;
  const innerW = omegaW - cellMargin * 2;
  const innerH = omegaH - cellMargin * 2;
  const colX = [omegaX + cellMargin + innerW * 0.30, omegaX + cellMargin + innerW * 0.70];
  const rowY = [omegaY + cellMargin + innerH * 0.30, omegaY + cellMargin + innerH * 0.70];
  function diskPos(name) {
    // Row = 1st coin (H top, T bottom). Col = 2nd coin (H left, T right).
    const ix = (name === "HH" || name === "TH") ? 0 : 1;
    const iy = (name === "HH" || name === "HT") ? 0 : 1;
    return { x: colX[ix], y: rowY[iy] };
  }

  function valueToX(v) {
    const maxV = X_MAX[xChoice];
    const rangeLo = -0.5, rangeHi = maxV + 0.5;
    return rlineX + ((v - rangeLo) / (rangeHi - rangeLo)) * rlineW;
  }
  function xToValue(px) {
    const maxV = X_MAX[xChoice];
    const rangeLo = -0.5, rangeHi = maxV + 0.5;
    const t = (px - rlineX) / rlineW;
    return rangeLo + clamp(t, 0, 1) * (rangeHi - rangeLo);
  }
  function snapCenter(v) {
    // Snap a real value to the nearest integer in [0, X_MAX], so the brush
    // [center - 0.5, center + 0.5] always captures exactly that integer.
    return clamp(Math.round(v), 0, X_MAX[xChoice]);
  }

  function preimage() {
    const X = X_TABLES[xChoice];
    return OUTCOMES.filter(o => X[o] >= bRange.lo && X[o] <= bRange.hi);
  }
  function isUnionOfCells(set, cells) {
    const setEl = new Set(set);
    for (const cell of cells) {
      const inAll  = cell.every(o => setEl.has(o));
      const inNone = cell.every(o => !setEl.has(o));
      if (!inAll && !inNone) return { ok: false, splitCell: cell };
    }
    return { ok: true };
  }

  function roundedRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function drawSigmaCells() {
    const cells = cellsOf(sigmaField);
    ctx.lineWidth = 1;
    cells.forEach((cell, i) => {
      const positions = cell.map(diskPos);
      const minX = Math.min(...positions.map(p => p.x)) - diskR - 10;
      const maxX = Math.max(...positions.map(p => p.x)) + diskR + 10;
      const minY = Math.min(...positions.map(p => p.y)) - diskR - 10;
      const maxY = Math.max(...positions.map(p => p.y)) + diskR + 10;
      ctx.fillStyle = "rgba(31,74,140,0.10)";
      ctx.strokeStyle = "rgba(31,74,140,0.40)";
      roundedRect(minX, minY, maxX - minX, maxY - minY, 10);
      ctx.fill();
      ctx.stroke();
      // Cell label
      ctx.fillStyle = "rgba(31,74,140,0.78)";
      ctx.font = "10px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(cellLabel(sigmaField, i), (minX + maxX) / 2, minY - 4);
    });
  }

  function drawOmega(preimageSet) {
    // Panel frame
    ctx.strokeStyle = COLORS.axis;
    ctx.lineWidth = 1;
    ctx.strokeRect(omegaX, omegaY, omegaW, omegaH);
    // Header
    ctx.fillStyle = COLORS.text;
    ctx.font = "italic 13px Georgia, serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("Ω, ℱ", omegaX + 6, omegaY - 6);

    drawSigmaCells();

    // Disks
    const preimageEl = new Set(preimageSet);
    for (const name of OUTCOMES) {
      const { x, y } = diskPos(name);
      const inPre = preimageEl.has(name);
      ctx.beginPath();
      ctx.arc(x, y, diskR, 0, Math.PI * 2);
      ctx.fillStyle = inPre ? "rgba(216,154,31,0.30)" : "#ffffff";
      ctx.fill();
      ctx.lineWidth = inPre ? 2.4 : 1.4;
      ctx.strokeStyle = inPre ? "#d89a1f" : "#1f4a8c";
      ctx.stroke();
      ctx.fillStyle = inPre ? "#7a5712" : "#1f4a8c";
      ctx.font = "600 11px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(name, x, y);
      // X(ω) value below the disk
      ctx.fillStyle = COLORS.textDim;
      ctx.font = "10px -apple-system, sans-serif";
      ctx.fillText("X=" + X_TABLES[xChoice][name], x, y + diskR + 11);
    }
  }

  function drawNumberLine() {
    // Header
    ctx.fillStyle = COLORS.text;
    ctx.font = "italic 13px Georgia, serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("ℝ, 𝓑", rlineX, omegaY - 6);

    // Axis
    ctx.strokeStyle = COLORS.axis;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(rlineX, rlineAxisY);
    ctx.lineTo(rlineX + rlineW, rlineAxisY);
    ctx.stroke();

    // Brushed B band — draw BEFORE ticks so they sit on top.
    const bLoX = valueToX(bRange.lo);
    const bHiX = valueToX(bRange.hi);
    const bandH = 30;
    ctx.fillStyle = "rgba(22,143,134,0.22)";
    ctx.fillRect(bLoX, rlineAxisY - bandH / 2, Math.max(2, bHiX - bLoX), bandH);
    ctx.strokeStyle = "#168f86";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(bLoX, rlineAxisY - bandH / 2, Math.max(2, bHiX - bLoX), bandH);

    // Ticks
    const maxV = X_MAX[xChoice];
    ctx.fillStyle = COLORS.text;
    ctx.font = "11px -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let v = 0; v <= maxV; v++) {
      const tx = valueToX(v);
      ctx.strokeStyle = COLORS.axis;
      ctx.beginPath();
      ctx.moveTo(tx, rlineAxisY - 5);
      ctx.lineTo(tx, rlineAxisY + 5);
      ctx.stroke();
      ctx.fillText(String(v), tx, rlineAxisY + 10);
    }

    // Brush hint / label
    ctx.fillStyle = "#168f86";
    ctx.font = "600 11px -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    const bMidX = (bLoX + bHiX) / 2;
    ctx.fillText("B", bMidX, rlineAxisY - bandH / 2 - 4);

    // X label
    ctx.fillStyle = COLORS.textDim;
    ctx.font = "10px -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(X_LABEL[xChoice], rlineX, rlineAxisY + 38);
  }

  function drawArrow() {
    // Pre-image arrow from B to Ω
    const ax = omegaX + omegaW + 4;
    const bx = rlineX - 8;
    const ay = (omegaY + omegaY + omegaH) / 2;
    ctx.strokeStyle = COLORS.textDim;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(bx, ay);
    ctx.lineTo(ax + 6, ay);
    ctx.stroke();
    ctx.setLineDash([]);
    // Arrow head
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax + 8, ay - 4);
    ctx.lineTo(ax + 8, ay + 4);
    ctx.closePath();
    ctx.fillStyle = COLORS.textDim;
    ctx.fill();
    // Label
    ctx.fillStyle = COLORS.textDim;
    ctx.font = "italic 11px Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText("X⁻¹", (ax + bx) / 2, ay - 6);
  }

  function drawVerdict(preimageSet, verdict) {
    const cx = w / 2;
    const ok = verdict.ok;
    const badgeText = ok
      ? "✓  X⁻¹(B) ∈ ℱ"
      : "✗  X⁻¹(B) ∉ ℱ";
    ctx.font = "600 14px -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = ok ? "rgba(45,122,62,0.14)" : "rgba(184,65,42,0.14)";
    const metrics = ctx.measureText(badgeText);
    const bw = metrics.width + 22;
    const bh = 26;
    roundedRect(cx - bw / 2, verdictY - bh / 2, bw, bh, 6);
    ctx.fill();
    ctx.strokeStyle = ok ? "#2d7a3e" : "#b8412a";
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.fillStyle = ok ? "#2d7a3e" : "#b8412a";
    ctx.fillText(badgeText, cx, verdictY);
  }

  function updateReadout(preimageSet, verdict) {
    const readout = document.getElementById("sigma-readout");
    if (!readout) return;
    const preStr = preimageSet.length
      ? "{" + preimageSet.join(", ") + "}"
      : "∅";
    const prob = preimageSet.length / 4;
    if (verdict.ok) {
      readout.innerHTML =
        `<div class="row"><span class="lbl">X⁻¹(B)</span><span>${preStr}</span></div>` +
        `<div class="row"><span class="lbl">P(X ∈ B)</span><span>P(X⁻¹(B)) = ${preimageSet.length}/4 = ${prob.toFixed(2)}</span></div>`;
    } else {
      const splitCell = verdict.splitCell || [];
      const cellStr = "{" + splitCell.join(", ") + "}";
      readout.innerHTML =
        `<div class="row"><span class="lbl">X⁻¹(B)</span><span>${preStr} — not in ℱ</span></div>` +
        `<div class="row"><span class="lbl">P(X ∈ B)</span><span style="color:#b8412a">undefined — the pre-image splits cell ${cellStr}, which ℱ cannot resolve</span></div>`;
    }
  }

  function draw() {
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, w, h);

    const preimageSet = preimage();
    drawOmega(preimageSet);
    drawArrow();
    drawNumberLine();

    const verdict = isUnionOfCells(preimageSet, cellsOf(sigmaField));
    drawVerdict(preimageSet, verdict);
    updateReadout(preimageSet, verdict);
  }

  function localPointer(event) {
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / (rect.width * (window.devicePixelRatio || 1));
    return {
      x: (event.clientX - rect.left),
      y: (event.clientY - rect.top),
    };
  }

  canvas.addEventListener("pointerdown", (event) => {
    const { x, y } = localPointer(event);
    // Only initiate brushing if click is on the number-line half.
    if (x < rlineX - 6) return;
    if (y < rlineAxisY - 30 || y > rlineAxisY + 30) return;
    canvas.setPointerCapture(event.pointerId);
    dragging = true;
    dragStartCenter = snapCenter(xToValue(x));
    bRange = { lo: dragStartCenter - 0.5, hi: dragStartCenter + 0.5 };
    draw();
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const { x } = localPointer(event);
    const curCenter = snapCenter(xToValue(x));
    const lo = Math.min(dragStartCenter, curCenter);
    const hi = Math.max(dragStartCenter, curCenter);
    bRange = { lo: lo - 0.5, hi: hi + 0.5 };
    draw();
  });
  function endDrag() {
    if (!dragging) return;
    dragging = false;
  }
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  document.querySelectorAll("[data-sigma-field]").forEach(b => {
    b.addEventListener("click", () => {
      sigmaField = b.dataset.sigmaField;
      document.querySelectorAll("[data-sigma-field]").forEach(x => x.classList.toggle("active", x === b));
      draw();
    });
  });
  document.querySelectorAll("[data-sigma-x]").forEach(b => {
    b.addEventListener("click", () => {
      xChoice = b.dataset.sigmaX;
      document.querySelectorAll("[data-sigma-x]").forEach(x => x.classList.toggle("active", x === b));
      // Clamp brush to new value range
      const maxV = X_MAX[xChoice];
      if (bRange.hi > maxV + 0.5) bRange.hi = maxV + 0.5;
      if (bRange.lo > maxV + 0.5) bRange.lo = maxV - 0.5;
      draw();
    });
  });

  draw();
})();

// ─────────── Figure 6 · Lebesgue decomposition (spike-and-slab) ───────────
(function figLebesgue() {
  const canvas = document.getElementById("fig-lebesgue");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const alphaIn = document.getElementById("fig-lebesgue-alpha");
  const sigmaIn = document.getElementById("fig-lebesgue-sigma");
  const alphaV = document.getElementById("fig-lebesgue-alpha-v");
  const sigmaV = document.getElementById("fig-lebesgue-sigma-v");
  const readout = document.getElementById("fig-lebesgue-readout");
  function draw() {
    const alpha = +alphaIn.value;
    const sigma = +sigmaIn.value;
    alphaV.textContent = alpha.toFixed(2);
    sigmaV.textContent = sigma.toFixed(2);
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, w, h);
    const padL = 50, padT = 22, padR = 18, gap = 18;
    const panelW = (w - padL - padR - gap) / 2;
    const panelH = h - padT - 60;
    const xMin = -3, xMax = 3;
    const xS1 = (x) => padL + (x - xMin) / (xMax - xMin) * panelW;
    const xS2 = (x) => padL + panelW + gap + (x - xMin) / (xMax - xMin) * panelW;
    const pdfPanel = padT;
    const slabPdf = (x) => gaussian(x, 0, sigma);
    const slabPeak = slabPdf(0);
    const maxY = Math.max(alpha, (1 - alpha) * slabPeak) * 1.25 + 0.05;
    const yS = (v, base) => base + panelH - v / maxY * panelH;
    drawSimpleAxes(ctx, padL, pdfPanel, panelW, panelH, 6, 4);
    ctx.fillStyle = "rgba(31,74,140,0.30)";
    ctx.beginPath();
    ctx.moveTo(xS1(xMin), yS(0, pdfPanel));
    const N = 200;
    for (let i = 0; i <= N; i++) {
      const x = xMin + i / N * (xMax - xMin);
      ctx.lineTo(xS1(x), yS((1 - alpha) * slabPdf(x), pdfPanel));
    }
    ctx.lineTo(xS1(xMax), yS(0, pdfPanel));
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = COLORS.mu;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      const x = xMin + i / N * (xMax - xMin);
      const y = yS((1 - alpha) * slabPdf(x), pdfPanel);
      i ? ctx.lineTo(xS1(x), y) : ctx.moveTo(xS1(x), y);
    }
    ctx.stroke();
    if (alpha > 1e-4) {
      ctx.strokeStyle = COLORS.nu;
      ctx.fillStyle = COLORS.nu;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(xS1(0), yS(0, pdfPanel));
      ctx.lineTo(xS1(0), yS(alpha, pdfPanel));
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(xS1(0), yS(alpha, pdfPanel), 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = COLORS.text;
    ctx.font = "12px -apple-system, sans-serif";
    ctx.fillText("density + atom", padL, pdfPanel - 6);

    // Y-axis tick labels (left panel): numeric values along the density
    // scale. Both panels share the same yS, so a single set of ticks works
    // for both with separate labels on each panel's left edge.
    const yTickFracs = [0, 0.25, 0.5, 0.75, 1];
    ctx.fillStyle = COLORS.textDim;
    ctx.font = "11px -apple-system, sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (const t of yTickFracs) {
      const v = t * maxY;
      const y = yS(v, pdfPanel);
      ctx.fillText(v.toFixed(2), padL - 4, y);
    }
    // Vertical y-axis title (rotated).
    ctx.save();
    ctx.translate(padL - 36, pdfPanel + panelH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "italic 11px -apple-system, sans-serif";
    ctx.fillStyle = COLORS.textDim;
    ctx.fillText("density / mass", 0, 0);
    ctx.restore();
    // X-axis tick labels (both panels).
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.font = "11px -apple-system, sans-serif";
    ctx.fillStyle = COLORS.textDim;
    for (const xv of [-3, -2, -1, 0, 1, 2, 3]) {
      ctx.fillText(String(xv), xS1(xv), pdfPanel + panelH + 4);
    }
    // X-axis title (left panel).
    ctx.font = "italic 11px -apple-system, sans-serif";
    ctx.fillText("x", padL + panelW / 2, pdfPanel + panelH + 22);

    drawSimpleAxes(ctx, padL + panelW + gap, pdfPanel, panelW, panelH, 6, 4);
    let cdf = 0;
    const ys = [];
    const dx = (xMax - xMin) / N;
    for (let i = 0; i <= N; i++) {
      const x = xMin + i * dx;
      cdf += (1 - alpha) * slabPdf(x) * dx;
      ys.push({ x, cdf: Math.min(cdf, 1) });
    }
    ctx.strokeStyle = COLORS.rn;
    ctx.lineWidth = 2;
    ctx.beginPath();
    let lastX = -Infinity;
    for (let i = 0; i < ys.length; i++) {
      const { x, cdf: F } = ys[i];
      let val = F;
      if (x >= 0) val = Math.min(F + alpha, 1);
      const px = xS2(x), py = yS(val, pdfPanel);
      if (i === 0) ctx.moveTo(px, py);
      else {
        if (lastX < 0 && x >= 0 && alpha > 1e-4) {
          const jumpY = yS(ys[i - 1].cdf, pdfPanel);
          ctx.lineTo(xS2(0), jumpY);
          ctx.moveTo(xS2(0), yS(ys[i - 1].cdf + alpha, pdfPanel));
        }
        ctx.lineTo(px, py);
      }
      lastX = x;
    }
    ctx.stroke();
    ctx.fillStyle = COLORS.text;
    ctx.font = "12px -apple-system, sans-serif";
    ctx.fillText("CDF F(x)", padL + panelW + gap, pdfPanel - 6);

    // Y-axis tick labels (right panel). The CDF lives in [0, 1], so tick
    // labels at 0, 0.25, ..., 1 (scaled into the shared maxY-pixel space).
    const panel2Left = padL + panelW + gap;
    ctx.fillStyle = COLORS.textDim;
    ctx.font = "11px -apple-system, sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (const v of [0, 0.25, 0.5, 0.75, 1]) {
      if (v > maxY + 1e-9) continue;
      const y = yS(v, pdfPanel);
      ctx.fillText(v.toFixed(2), panel2Left - 4, y);
    }
    ctx.save();
    ctx.translate(panel2Left - 36, pdfPanel + panelH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "italic 11px -apple-system, sans-serif";
    ctx.fillStyle = COLORS.textDim;
    ctx.fillText("F(x)", 0, 0);
    ctx.restore();
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.font = "11px -apple-system, sans-serif";
    ctx.fillStyle = COLORS.textDim;
    for (const xv of [-3, -2, -1, 0, 1, 2, 3]) {
      ctx.fillText(String(xv), xS2(xv), pdfPanel + panelH + 4);
    }
    ctx.font = "italic 11px -apple-system, sans-serif";
    ctx.fillText("x", panel2Left + panelW / 2, pdfPanel + panelH + 22);
    let kind = "absolutely continuous (slab only)";
    if (alpha > 0.999) kind = "purely atomic (point mass at 0)";
    else if (alpha > 0.001) kind = "mixed: atomic + absolutely continuous";
    readout.innerHTML = `<div class="row"><span class="lbl">type</span><span>${kind}</span></div><div class="row"><span class="lbl">atomic part</span><span>${alpha.toFixed(2)} at x = 0</span></div><div class="row"><span class="lbl">continuous part</span><span>${(1 - alpha).toFixed(2)} as N(0, ${sigma.toFixed(2)}²)</span></div>`;
  }
  [alphaIn, sigmaIn].forEach((input) => input.addEventListener("input", draw));
  document.querySelectorAll("[data-fig-lebesgue-preset]").forEach((b) => {
    b.addEventListener("click", () => {
      const p = b.dataset.figLebesguePreset;
      if (p === "continuous") { alphaIn.value = 0; sigmaIn.value = 0.8; }
      else if (p === "atomic") { alphaIn.value = 1; sigmaIn.value = 0.8; }
      else if (p === "mix") { alphaIn.value = 0.5; sigmaIn.value = 0.8; }
      draw();
    });
  });
  draw();
})();

// ─────────── Figure 7 · Same P, different reference measures ───────────
(function figBaseMeasure() {
  const canvas = document.getElementById("fig-basemeasure");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const readout = document.getElementById("fig-basemeasure-readout");
  let targetKind = "normal";
  let refKind = "lebesgue";
  const atoms = [-2, -1.3, -0.5, 0.2, 0.9, 1.5, 2.2];
  const atomMass = 1 / atoms.length;
  function targetPdf(x) {
    if (targetKind === "normal") return gaussian(x, 0, 1);
    if (targetKind === "mixture") return 0.65 * gaussian(x, 0.2, 0.7);
    return 0;
  }
  function targetAtoms() {
    if (targetKind === "discrete") return atoms.map((a) => ({ x: a, mass: atomMass }));
    if (targetKind === "mixture") return [{ x: -1.5, mass: 0.35 }];
    return [];
  }
  function refPdf(x) {
    if (refKind === "lebesgue") return 1;
    if (refKind === "gaussian") return gaussian(x, 0, 1.4);
    return 0;
  }
  function refIsCounting() { return refKind === "counting"; }
  function refAtoms() {
    if (refKind === "counting") {
      const out = [];
      for (let k = -3; k <= 3; k++) out.push(k);
      return out;
    }
    return [];
  }
  function compatible() {
    const tAtoms = targetAtoms();
    if (refIsCounting()) {
      if (targetKind === "normal") return false;
      if (targetKind === "mixture") return false;
      const grid = new Set(refAtoms());
      return tAtoms.every((a) => grid.has(Math.round(a.x)));
    }
    if (tAtoms.length > 0) return false;
    return true;
  }
  function draw() {
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, w, h);
    const padL = 50, padR = 18, padT = 22, gap = 14;
    const panelW = w - padL - padR;
    const panelH = (h - padT - 60 - gap) / 2;
    const xMin = -3.2, xMax = 3.2;
    const xS = (x) => padL + (x - xMin) / (xMax - xMin) * panelW;
    const topY = padT;
    const botY = padT + panelH + gap;
    drawSimpleAxes(ctx, padL, topY, panelW, panelH, 8, 3);
    const tAtoms = targetAtoms();
    const tPeak = Math.max(targetPdf(0), ...tAtoms.map((a) => a.mass), 0.05);
    const yT = (v) => topY + panelH - v / (tPeak * 1.2) * panelH;
    if (targetKind === "normal" || targetKind === "mixture") {
      ctx.fillStyle = "rgba(184,65,42,0.22)";
      ctx.beginPath();
      ctx.moveTo(xS(xMin), yT(0));
      const N = 200;
      for (let i = 0; i <= N; i++) {
        const x = xMin + i / N * (xMax - xMin);
        ctx.lineTo(xS(x), yT(targetPdf(x)));
      }
      ctx.lineTo(xS(xMax), yT(0));
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = COLORS.nu;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        const x = xMin + i / N * (xMax - xMin);
        const y = yT(targetPdf(x));
        i ? ctx.lineTo(xS(x), y) : ctx.moveTo(xS(x), y);
      }
      ctx.stroke();
    }
    ctx.strokeStyle = COLORS.nu;
    ctx.fillStyle = COLORS.nu;
    for (const a of tAtoms) {
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(xS(a.x), yT(0));
      ctx.lineTo(xS(a.x), yT(a.mass));
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(xS(a.x), yT(a.mass), 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = COLORS.text;
    ctx.font = "12px -apple-system, sans-serif";
    ctx.fillText("target P and reference μ", padL, topY - 6);
    const refMax = refKind === "lebesgue" ? 1.2 : (refKind === "gaussian" ? gaussian(0, 0, 1.4) * 1.3 : 1.2);
    const yR = (v) => topY + panelH - v / refMax * panelH;
    if (refKind === "lebesgue") {
      ctx.strokeStyle = COLORS.mu;
      ctx.setLineDash([6, 4]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(xS(xMin), yR(1));
      ctx.lineTo(xS(xMax), yR(1));
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (refKind === "gaussian") {
      ctx.strokeStyle = COLORS.mu;
      ctx.setLineDash([6, 4]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const N = 200;
      for (let i = 0; i <= N; i++) {
        const x = xMin + i / N * (xMax - xMin);
        const y = yR(gaussian(x, 0, 1.4));
        i ? ctx.lineTo(xS(x), y) : ctx.moveTo(xS(x), y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (refKind === "counting") {
      ctx.strokeStyle = COLORS.mu;
      ctx.fillStyle = COLORS.mu;
      for (const a of refAtoms()) {
        if (a < xMin || a > xMax) continue;
        ctx.setLineDash([3, 3]);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(xS(a), yR(0));
        ctx.lineTo(xS(a), yR(0.85));
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(xS(a), yR(0.85), 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    drawSimpleAxes(ctx, padL, botY, panelW, panelH, 8, 3);
    ctx.fillStyle = COLORS.text;
    ctx.font = "12px -apple-system, sans-serif";
    const ok = compatible();
    if (!ok) {
      ctx.fillStyle = "rgba(184,65,42,0.08)";
      ctx.fillRect(padL, botY, panelW, panelH);
      ctx.fillStyle = COLORS.nu;
      ctx.font = "13px -apple-system, sans-serif";
      ctx.fillText("P is not absolutely continuous w.r.t. μ — no Radon-Nikodym derivative exists.", padL + 10, botY + panelH / 2);
      ctx.font = "11px -apple-system, sans-serif";
      ctx.fillStyle = COLORS.textDim;
      ctx.fillText("(The target puts mass where the reference assigns none.)", padL + 10, botY + panelH / 2 + 18);
    } else if (refKind === "counting") {
      const yR2 = (v) => botY + panelH - v / 0.3 * panelH;
      ctx.strokeStyle = COLORS.rn;
      ctx.fillStyle = COLORS.rn;
      for (const a of tAtoms) {
        const v = a.mass;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(xS(a.x), yR2(0));
        ctx.lineTo(xS(a.x), yR2(v));
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(xS(a.x), yR2(v), 4, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      const ratioMax = (function () {
        let m = 0;
        const N = 200;
        for (let i = 0; i <= N; i++) {
          const x = xMin + i / N * (xMax - xMin);
          const r = targetPdf(x) / Math.max(refPdf(x), 1e-9);
          if (r > m) m = r;
        }
        return Math.max(m * 1.2, 0.5);
      })();
      const yRr = (v) => botY + panelH - v / ratioMax * panelH;
      ctx.strokeStyle = COLORS.rn;
      ctx.lineWidth = 2;
      ctx.beginPath();
      const N = 240;
      for (let i = 0; i <= N; i++) {
        const x = xMin + i / N * (xMax - xMin);
        const r = targetPdf(x) / Math.max(refPdf(x), 1e-9);
        const y = yRr(r);
        i ? ctx.lineTo(xS(x), y) : ctx.moveTo(xS(x), y);
      }
      ctx.stroke();
    }
    ctx.fillStyle = COLORS.text;
    ctx.font = "12px -apple-system, sans-serif";
    ctx.fillText("dP/dμ (density in this coordinate)", padL, botY - 6);
    let msg;
    if (!ok) msg = `${targetKind} target is not absolutely continuous w.r.t. ${refKind} reference`;
    else if (refKind === "lebesgue") msg = "density = ordinary PDF";
    else if (refKind === "counting") msg = "density = PMF (mass at each integer)";
    else msg = "density rescaled by a Gaussian reference — same measure, new coordinate";
    readout.innerHTML = `<div class="row"><span class="lbl">P</span><span>${targetKind}</span></div><div class="row"><span class="lbl">μ</span><span>${refKind}</span></div><div class="row"><span class="lbl">verdict</span><span>${msg}</span></div>`;
  }
  document.querySelectorAll("[data-fig-basemeasure-target]").forEach((b) => {
    b.addEventListener("click", () => {
      targetKind = b.dataset.figBasemeasureTarget;
      document.querySelectorAll("[data-fig-basemeasure-target]").forEach((x) => x.classList.toggle("active", x === b));
      draw();
    });
  });
  document.querySelectorAll("[data-fig-basemeasure-ref]").forEach((b) => {
    b.addEventListener("click", () => {
      refKind = b.dataset.figBasemeasureRef;
      document.querySelectorAll("[data-fig-basemeasure-ref]").forEach((x) => x.classList.toggle("active", x === b));
      draw();
    });
  });
  draw();
})();
