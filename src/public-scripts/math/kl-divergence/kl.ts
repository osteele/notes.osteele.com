import { drawClippedLine } from "../../_shared/charts";

const C = {
  bg: "#ffffff",
  grid: "#e3ddd0",
  axis: "#5a6577",
  text: "#1f2733",
  textDim: "#5a6577",
  q: "#b8412a",
  qFill: "rgba(184,65,42,0.30)",
  p: "#1f4a8c",
  pFill: "rgba(31,74,140,0.28)",
  purple: "#6b4592",
  purpleFill: "rgba(107,69,146,0.55)",
  orange: "#d4690a",
  green: "#2d7a3e",
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

function gaussianPdf(x, mu, sigma) {
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
}

function klGauss(mq, sq, mp, sp) {
  return Math.log(sp / sq) + (sq * sq + (mq - mp) * (mq - mp)) / (2 * sp * sp) - 0.5;
}

function drawAxes(ctx, x, y, w, h, verticals = 10, _horizontals = 4) {
  ctx.strokeStyle = C.grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= verticals; i++) {
    const px = x + (i / verticals) * w;
    ctx.beginPath();
    ctx.moveTo(px, y);
    ctx.lineTo(px, y + h);
    ctx.stroke();
  }
  ctx.strokeStyle = C.axis;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x + w, y + h);
  ctx.stroke();
}

function fmt(x) {
  if (!Number.isFinite(x)) return "infinity";
  return x.toFixed(4);
}

(function figRn() {
  const canvas = document.getElementById("fig-rn");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const mqIn = document.getElementById("fig-rn-mq");
  const sqIn = document.getElementById("fig-rn-sq");
  const mqV = document.getElementById("fig-rn-mq-v");
  const sqV = document.getElementById("fig-rn-sq-v");
  const readout = document.getElementById("fig-rn-readout");

  const mp = 0, sp = 1.25;
  const xMin = -6, xMax = 6;
  const padL = 44, padR = 16, padT = 16, padB = 32;
  const gap = 12;
  const panelH = (h - padT - padB - 2 * gap) / 3;
  const plotW = w - padL - padR;
  const xS = (x) => padL + ((x - xMin) / (xMax - xMin)) * plotW;

  function drawPanelAxes(y, label) {
    drawAxes(ctx, padL, y, plotW, panelH, 12);
    ctx.fillStyle = C.textDim;
    ctx.font = "11px -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(label, padL + 4, y + 3);
  }

  function path(xs, arr, yS, stroke, fill, baseY) {
    ctx.beginPath();
    arr.forEach((v, i) => {
      const px = xS(xs[i]);
      const py = yS(v);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    if (fill) {
      ctx.lineTo(xS(xMax), baseY);
      ctx.lineTo(xS(xMin), baseY);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
    }
    ctx.beginPath();
    arr.forEach((v, i) => {
      const px = xS(xs[i]);
      const py = yS(v);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.8;
    ctx.stroke();
  }

  function draw() {
    const mq = +mqIn.value;
    const sq = +sqIn.value;
    mqV.textContent = mq.toFixed(2);
    sqV.textContent = sq.toFixed(2);

    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, w, h);

    const N = 320;
    const xs = [], q = [], p = [], rn = [], integrand = [];
    let dMax = 0, rnMax = 0, iMax = 1e-9, iMin = 0;
    for (let i = 0; i <= N; i++) {
      const x = xMin + (i / N) * (xMax - xMin);
      const qv = gaussianPdf(x, mq, sq);
      const pv = gaussianPdf(x, mp, sp);
      const rv = qv / pv;
      const iv = qv * Math.log(rv);
      xs.push(x);
      q.push(qv);
      p.push(pv);
      rn.push(rv);
      integrand.push(iv);
      dMax = Math.max(dMax, qv, pv);
      rnMax = Math.max(rnMax, rv);
      iMax = Math.max(iMax, iv);
      iMin = Math.min(iMin, iv);
    }
    dMax *= 1.15;
    const rnDisplayMax = rnMax > 8 ? 8 : Math.max(1, rnMax * 1.10);
    const iRange = Math.max(0.4, iMax - iMin);

    const y0 = padT;
    const y1 = padT + panelH + gap;
    const y2 = padT + 2 * (panelH + gap);
    const base0 = y0 + panelH;
    const base1 = y1 + panelH;
    const zero2 = y2 + panelH - ((0 - iMin) / iRange) * panelH;

    drawPanelAxes(y0, "probability densities");
    const yD = (v) => base0 - (v / dMax) * panelH;
    path(xs, p, yD, C.p, C.pFill, base0);
    path(xs, q, yD, C.q, C.qFill, base0);

    drawPanelAxes(y1, "Radon-Nikodym derivative dQ/dP = q/p");
    const yR = (v) => base1 - (v / rnDisplayMax) * panelH;
    drawClippedLine(ctx, xs, rn, 0, rnDisplayMax, xS, y1, panelH, C.green, { width: 2 });
    ctx.strokeStyle = C.axis;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padL, yR(1));
    ctx.lineTo(padL + plotW, yR(1));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = C.textDim;
    ctx.font = "10px -apple-system, sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText("1", padL - 5, yR(1));

    drawPanelAxes(y2, "KL integrand q log(q/p)");
    ctx.strokeStyle = C.axis;
    ctx.beginPath();
    ctx.moveTo(padL, zero2);
    ctx.lineTo(padL + plotW, zero2);
    ctx.stroke();
    const yI = (v) => y2 + panelH - ((v - iMin) / iRange) * panelH;
    path(xs, integrand, yI, C.purple, C.purpleFill, zero2);

    ctx.fillStyle = C.textDim;
    ctx.font = "11px -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let v = -6; v <= 6; v += 2) ctx.fillText(v.toString(), xS(v), y2 + panelH + 5);

    const kl = klGauss(mq, sq, mp, sp);
    readout.innerHTML =
      `<div class="row"><span class="lbl">measure form</span><span>KL[Q || P] = E_Q[log(dQ/dP)]</span></div>` +
      `<div class="row"><span class="lbl">density form here</span><span>dQ/dP = q/p because both use Lebesgue density</span></div>` +
      `<div class="row"><span class="lbl">KL[Q || P]</span><span style="font-weight:600;color:${C.q}">${fmt(kl)} nats</span></div>`;
  }

  [mqIn, sqIn].forEach((input) => input.addEventListener("input", draw));
  document.querySelectorAll("[data-fig-rn-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      const preset = button.dataset.figRnPreset;
      if (preset === "match") {
        mqIn.value = 0; sqIn.value = 1.25;
      } else if (preset === "shift") {
        mqIn.value = 1.2; sqIn.value = 1.1;
      } else if (preset === "wide") {
        mqIn.value = 0; sqIn.value = 2.1;
      } else if (preset === "narrow") {
        mqIn.value = 0; sqIn.value = 0.55;
      }
      draw();
    });
  });
  draw();
})();

// ─────────── Figure 4b: Animated KL optimization ───────────
(function figBimodalOptimize() {
  const canvas = document.getElementById("fig3-opt");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const startIn = document.getElementById("fig3-opt-start");
  const startV = document.getElementById("fig3-opt-start-v");
  const readout = document.getElementById("fig3-opt-readout");
  const target = (x) => 0.5 * gaussianPdf(x, -2, 0.6) + 0.5 * gaussianPdf(x, 2, 0.6);
  const xMin = -5, xMax = 5;
  const xs = Array.from({ length: 360 }, (_, i) => xMin + (i / 359) * (xMax - xMin));
  const dx = (xMax - xMin) / (xs.length - 1);
  let reverse = { m: -0.2, s: 1, path: [] };
  let forward = { m: -0.2, s: 1, path: [] };

  function loss(kind, m, s) {
    s = Math.max(0.22, s);
    let total = 0;
    for (const x of xs) {
      const p = Math.max(1e-12, target(x));
      const q = Math.max(1e-12, gaussianPdf(x, m, s));
      total += kind === "reverse" ? q * Math.log(q / p) : p * Math.log(p / q);
    }
    return total * dx;
  }
  function grad(kind, m, s) {
    const e = 0.025;
    return [
      (loss(kind, m + e, s) - loss(kind, m - e, s)) / (2 * e),
      (loss(kind, m, s + e) - loss(kind, m, s - e)) / (2 * e),
    ];
  }
  function reset() {
    const s = +startIn.value;
    reverse = { m: -1.15, s, path: [[-1.15, s]] };
    forward = { m: -1.15, s, path: [[-1.15, s]] };
    draw();
  }
  function oneStep() {
    for (const [kind, obj, lrM, lrS] of [["reverse", reverse, 0.16, 0.08], ["forward", forward, 0.16, 0.08]] as [string, { m: number; s: number; path: number[][] }, number, number][]) {
      const [gm, gs] = grad(kind, obj.m, obj.s);
      obj.m = clamp(obj.m - lrM * gm, -4, 4);
      obj.s = clamp(obj.s - lrS * gs, 0.25, 4);
      obj.path.push([obj.m, obj.s]);
    }
  }
  function drawCurve(vals, xS, yS, color, fill) {
    ctx.beginPath();
    vals.forEach((v, i) => i ? ctx.lineTo(xS(xs[i]), yS(v)) : ctx.moveTo(xS(xs[i]), yS(v)));
    if (fill) {
      ctx.lineTo(xS(xMax), yS(0)); ctx.lineTo(xS(xMin), yS(0)); ctx.closePath();
      ctx.fillStyle = fill; ctx.fill();
    }
    ctx.beginPath();
    vals.forEach((v, i) => i ? ctx.lineTo(xS(xs[i]), yS(v)) : ctx.moveTo(xS(xs[i]), yS(v)));
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
  }
  function drawPanel(x0, y0, ww, hh, obj, label, color) {
    const pVals = xs.map(target);
    const qVals = xs.map((x) => gaussianPdf(x, obj.m, obj.s));
    const maxD = Math.max(...pVals, ...qVals) * 1.15;
    const xS = (x) => x0 + ((x - xMin) / (xMax - xMin)) * ww;
    const yS = (v) => y0 + hh - (v / maxD) * hh;
    drawAxes(ctx, x0, y0, ww, hh, 8, 4);
    drawCurve(pVals, xS, yS, C.p, C.pFill);
    drawCurve(qVals, xS, yS, color, color === C.q ? C.qFill : "rgba(45,122,62,0.24)");
    ctx.strokeStyle = color; ctx.lineWidth = 1.5;
    ctx.beginPath();
    obj.path.forEach(([m, s], i) => {
      const px = xS(m);
      const py = yS(gaussianPdf(m, m, s));
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    ctx.stroke();
    ctx.fillStyle = C.text; ctx.font = "700 12px -apple-system, sans-serif"; ctx.fillText(label, x0 + 8, y0 + 18);
  }
  function draw() {
    startV.textContent = (+startIn.value).toFixed(2);
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
    const gap = 26, x0 = 44, y0 = 24, ww = (w - 88 - gap) / 2, hh = h - 62;
    drawPanel(x0, y0, ww, hh, reverse, "reverse KL: mode-seeking", C.q);
    drawPanel(x0 + ww + gap, y0, ww, hh, forward, "forward KL: mass-covering", C.green);
    readout.innerHTML =
      `<div class="row"><span class="lbl">reverse endpoint</span><span>μ=${reverse.m.toFixed(2)}, σ=${reverse.s.toFixed(2)}</span></div>` +
      `<div class="row"><span class="lbl">forward endpoint</span><span>μ=${forward.m.toFixed(2)}, σ=${forward.s.toFixed(2)}</span></div>`;
  }
  document.getElementById("fig3-opt-run").addEventListener("click", () => {
    let n = 0;
    const timer = setInterval(() => { oneStep(); draw(); n++; if (n >= 90) clearInterval(timer); }, 18);
  });
  document.getElementById("fig3-opt-reset").addEventListener("click", reset);
  startIn.addEventListener("input", reset);
  reset();
  for (let i = 0; i < 90; i++) oneStep();
  draw();
})();

(function fig1() {
  const canvas = document.getElementById("fig1");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const ids = ["mq", "sq", "mp", "sp"];
  const inputs = Object.fromEntries(ids.map((k) => [k, document.getElementById(`fig1-${k}`)]));
  const labels = Object.fromEntries(ids.map((k) => [k, document.getElementById(`fig1-${k}-v`)]));
  let swapped = false;

  const padL = 42, padR = 14, padT = 14, padB = 34;
  const halfH = (h - padT - padB - 14) / 2;
  const plotW = w - padL - padR;
  const xMin = -6, xMax = 6;
  const xS = (x) => padL + ((x - xMin) / (xMax - xMin)) * plotW;

  function drawCurve(xs, arr, yS, stroke, fill, baseY) {
    ctx.beginPath();
    arr.forEach((v, i) => {
      const px = xS(xs[i]), py = yS(v);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    if (fill) {
      ctx.lineTo(xS(xMax), baseY);
      ctx.lineTo(xS(xMin), baseY);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
    }
    ctx.beginPath();
    arr.forEach((v, i) => {
      const px = xS(xs[i]), py = yS(v);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.8;
    ctx.stroke();
  }

  function draw() {
    const mq = +inputs.mq.value, sq = +inputs.sq.value;
    const mp = +inputs.mp.value, sp = +inputs.sp.value;
    ids.forEach((k) => { labels[k].textContent = (+inputs[k].value).toFixed(2); });

    const Q = (x) => gaussianPdf(x, mq, sq);
    const P = (x) => gaussianPdf(x, mp, sp);
    const left = swapped ? P : Q;
    const right = swapped ? Q : P;
    const leftLabel = swapped ? "p" : "q";
    const rightLabel = swapped ? "q" : "p";
    const leftColor = swapped ? C.p : C.q;
    const rightColor = swapped ? C.q : C.p;
    const leftFill = swapped ? C.pFill : C.qFill;
    const rightFill = swapped ? C.qFill : C.pFill;

    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, w, h);

    const topY = padT, botY = padT + halfH + 14;
    const yTopAxis = topY + halfH, yBotAxis = botY + halfH;
    drawAxes(ctx, padL, topY, plotW, halfH, 12);

    const N = 260;
    const xs = [], qv = [], pv = [];
    let dmax = 0;
    for (let i = 0; i <= N; i++) {
      const x = xMin + (i / N) * (xMax - xMin);
      const q = left(x), p = right(x);
      xs.push(x); qv.push(q); pv.push(p);
      dmax = Math.max(dmax, q, p);
    }
    dmax *= 1.15;
    const yD = (d) => yTopAxis - (d / dmax) * halfH;
    drawCurve(xs, qv, yD, leftColor, leftFill, yTopAxis);
    drawCurve(xs, pv, yD, rightColor, rightFill, yTopAxis);

    ctx.fillStyle = C.textDim;
    ctx.font = "11px -apple-system, sans-serif";
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    ctx.fillText(`${leftLabel} supplies samples; ${rightLabel} supplies the reference probabilities`, padL, topY + 2);

    const zeroY = botY + halfH * 0.55;
    drawAxes(ctx, padL, botY, plotW, halfH, 12);
    ctx.strokeStyle = C.axis;
    ctx.beginPath();
    ctx.moveTo(padL, zeroY);
    ctx.lineTo(padL + plotW, zeroY);
    ctx.stroke();

    const integ = [];
    let maxAbs = 1e-9;
    xs.forEach((x) => {
      const q = left(x), p = right(x);
      const v = q <= 0 ? 0 : p <= 0 ? q * 50 : q * Math.log(q / p);
      integ.push(v);
      maxAbs = Math.max(maxAbs, Math.abs(v));
    });
    const scale = Math.min(halfH * 0.45 / maxAbs, halfH * 0.45);
    const yI = (v) => zeroY - v * scale;
    drawCurve(xs, integ.map((v) => clamp(v, -maxAbs, maxAbs)), yI, C.purple, C.purpleFill, zeroY);

    ctx.fillStyle = C.textDim;
    ctx.textAlign = "center";
    for (let v = -6; v <= 6; v += 2) ctx.fillText(v.toString(), xS(v), yBotAxis + 4);
    ctx.textAlign = "right";
    ctx.fillText(`${leftLabel}(x) log(${leftLabel}(x) / ${rightLabel}(x))`, padL + plotW, botY + 2);

    const klQP = klGauss(mq, sq, mp, sp);
    const klPQ = klGauss(mp, sp, mq, sq);
    document.getElementById("fig1-readout").innerHTML =
      `<div class="row"><span class="lbl">${swapped ? "KL[p || q]" : "KL[q || p]"}</span><span style="font-weight:600;color:${C.q}">${fmt(swapped ? klPQ : klQP)} nats</span></div>` +
      `<div class="row"><span class="lbl">${swapped ? "KL[q || p]" : "KL[p || q]"}</span><span>${fmt(swapped ? klQP : klPQ)} nats</span></div>` +
      `<div class="row"><span class="lbl">direction</span><span>${leftLabel} decides where the mismatch is measured</span></div>`;
  }

  ids.forEach((k) => inputs[k].addEventListener("input", draw));
  document.querySelectorAll("[data-fig1-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      const p = button.dataset.fig1Preset;
      if (p === "match") {
        inputs.mq.value = 0; inputs.sq.value = 1; inputs.mp.value = 0; inputs.sp.value = 1; swapped = false;
      } else if (p === "shift") {
        inputs.mq.value = 0; inputs.sq.value = 1; inputs.mp.value = 2; inputs.sp.value = 1; swapped = false;
      } else if (p === "wide") {
        inputs.mq.value = 0; inputs.sq.value = 0.55; inputs.mp.value = 0; inputs.sp.value = 2.2; swapped = false;
      } else if (p === "narrow") {
        inputs.mq.value = 0; inputs.sq.value = 2.2; inputs.mp.value = 0; inputs.sp.value = 0.55; swapped = false;
      }
      draw();
    });
  });
  document.getElementById("fig1-swap")?.addEventListener("click", () => {
    swapped = !swapped;
    draw();
  });
  draw();
})();

(function fig2() {
  const canvas = document.getElementById("fig2");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const qInputs = [document.getElementById("fig2-q0"), document.getElementById("fig2-q1")];
  const pInputs = [document.getElementById("fig2-p0"), document.getElementById("fig2-p1")];
  const qLabels = [document.getElementById("fig2-q0-v"), document.getElementById("fig2-q1-v")];
  const pLabels = [document.getElementById("fig2-p0-v"), document.getElementById("fig2-p1-v")];

  function dist(inputs) {
    const a = +inputs[0].value, b = +inputs[1].value;
    const c = Math.max(0, 1 - a - b);
    const sum = a + b + c;
    return [a / sum, b / sum, c / sum];
  }

  function contribution(q, p) {
    if (q === 0) return 0;
    if (p === 0) return Infinity;
    return q * Math.log(q / p);
  }

  function draw() {
    const q = dist(qInputs);
    const p = dist(pInputs);
    qLabels[0].textContent = q[0].toFixed(2);
    qLabels[1].textContent = q[1].toFixed(2);
    pLabels[0].textContent = p[0].toFixed(2);
    pLabels[1].textContent = p[1].toFixed(2);
    const parts = q.map((v, i) => contribution(v, p[i]));
    const finiteParts = parts.filter(Number.isFinite);
    const total = parts.some((v) => !Number.isFinite(v)) ? Infinity : parts.reduce((a, b) => a + b, 0);

    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, w, h);
    const padL = 44, padR = 18, padT = 20, padB = 34;
    const plotW = w - padL - padR, plotH = h - padT - padB;
    drawAxes(ctx, padL, padT, plotW, plotH, 3);

    const maxProb = Math.max(1, ...q, ...p);
    const maxContrib = Math.max(0.35, ...finiteParts.map(Math.abs));
    const probScale = plotH * 0.42 / maxProb;
    const contribScale = plotH * 0.35 / maxContrib;
    const zeroY = padT + plotH * 0.58;
    ctx.strokeStyle = C.axis;
    ctx.beginPath();
    ctx.moveTo(padL, zeroY);
    ctx.lineTo(padL + plotW, zeroY);
    ctx.stroke();

    const slot = plotW / 3;
    for (let i = 0; i < 3; i++) {
      const cx = padL + slot * i + slot / 2;
      const bw = Math.min(34, slot * 0.16);
      const qH = q[i] * probScale;
      const pH = p[i] * probScale;
      ctx.fillStyle = C.q;
      ctx.fillRect(cx - bw - 4, zeroY - qH, bw, qH);
      ctx.fillStyle = C.p;
      ctx.fillRect(cx + 4, zeroY - pH, bw, pH);

      const value = parts[i];
      const barW = Math.min(46, slot * 0.24);
      if (Number.isFinite(value)) {
        const yTop = zeroY - Math.max(0, value) * contribScale;
        const yBot = zeroY - Math.min(0, value) * contribScale;
        ctx.fillStyle = C.purpleFill;
        ctx.fillRect(cx - barW / 2, yTop, barW, yBot - yTop);
      } else {
        ctx.fillStyle = C.purple;
        ctx.fillRect(cx - barW / 2, padT + 8, barW, zeroY - padT - 8);
        ctx.fillStyle = "#fff";
        ctx.font = "600 12px -apple-system, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("infinity", cx, padT + 24);
      }

      ctx.fillStyle = C.textDim;
      ctx.font = "11px -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(`outcome ${i + 1}`, cx, padT + plotH + 6);
      ctx.fillText(Number.isFinite(value) ? value.toFixed(3) : "infinity", cx, zeroY + 7);
    }
    const barX = padL + plotW - 76;
    const barY = padT + 8;
    ctx.fillStyle = "#f3f1ec";
    ctx.fillRect(barX, barY, 44, 74);
    ctx.strokeStyle = C.axis;
    ctx.strokeRect(barX, barY, 44, 74);
    const klHeight = Number.isFinite(total) ? Math.min(68, 14 + total * 34) : 68;
    ctx.fillStyle = C.pFill;
    ctx.fillRect(barX, barY + 74 - 18, 44, 18);
    ctx.fillStyle = C.qFill;
    ctx.fillRect(barX, barY + 74 - 18 - klHeight, 44, klHeight);
    ctx.fillStyle = C.textDim;
    ctx.font = "10px -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("gap bar", barX + 22, barY + 78);

    document.getElementById("fig2-readout").innerHTML =
      `<div class="row"><span class="lbl">q</span><span>[${q.map((v) => v.toFixed(2)).join(", ")}]</span></div>` +
      `<div class="row"><span class="lbl">p</span><span>[${p.map((v) => v.toFixed(2)).join(", ")}]</span></div>` +
      `<div class="row"><span class="lbl">KL[q || p]</span><span style="font-weight:600;color:${C.q}">${fmt(total)} nats</span></div>`;
  }

  [...qInputs, ...pInputs].forEach((input) => input.addEventListener("input", draw));
  document.getElementById("fig2-zero-p-one")?.addEventListener("click", () => {
    qInputs[0].value = 0.45;
    qInputs[1].value = 0.35;
    pInputs[0].value = 0;
    pInputs[1].value = 0.55;
    draw();
  });
  document.querySelectorAll("[data-fig2-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      const preset = button.dataset.fig2Preset;
      if (preset === "match") {
        qInputs[0].value = 0.45; qInputs[1].value = 0.35; pInputs[0].value = 0.45; pInputs[1].value = 0.35;
      } else if (preset === "surprise") {
        qInputs[0].value = 0.70; qInputs[1].value = 0.20; pInputs[0].value = 0.05; pInputs[1].value = 0.20;
      } else if (preset === "zero-q") {
        qInputs[0].value = 0; qInputs[1].value = 0.60; pInputs[0].value = 0.35; pInputs[1].value = 0.45;
      } else if (preset === "zero-p") {
        qInputs[0].value = 0.35; qInputs[1].value = 0.45; pInputs[0].value = 0; pInputs[1].value = 0.45;
      }
      draw();
    });
  });
  document.getElementById("fig2-swap")?.addEventListener("click", () => {
    const q0 = qInputs[0].value, q1 = qInputs[1].value;
    qInputs[0].value = pInputs[0].value;
    qInputs[1].value = pInputs[1].value;
    pInputs[0].value = q0;
    pInputs[1].value = q1;
    draw();
  });
  draw();
})();

(function fig3() {
  const canvas = document.getElementById("fig3");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const mqIn = document.getElementById("fig3-mq");
  const sqIn = document.getElementById("fig3-sq");
  const mqV = document.getElementById("fig3-mq-v");
  const sqV = document.getElementById("fig3-sq-v");
  const xMin = -6, xMax = 6;

  function target(x) {
    return 0.5 * gaussianPdf(x, -2, 0.55) + 0.5 * gaussianPdf(x, 2, 0.55);
  }

  function integrate(fn) {
    const N = 900;
    let total = 0;
    const dx = (xMax - xMin) / N;
    for (let i = 0; i <= N; i++) {
      const x = xMin + i * dx;
      const weight = i === 0 || i === N ? 0.5 : 1;
      total += weight * fn(x) * dx;
    }
    return total;
  }

  function draw() {
    const mq = +mqIn.value, sq = +sqIn.value;
    mqV.textContent = mq.toFixed(2);
    sqV.textContent = sq.toFixed(2);
    const q = (x) => gaussianPdf(x, mq, sq);
    const reverse = integrate((x) => {
      const qv = q(x), pv = target(x);
      return qv <= 0 ? 0 : qv * Math.log(qv / Math.max(pv, 1e-12));
    });
    const forward = integrate((x) => {
      const pv = target(x), qv = q(x);
      return pv <= 0 ? 0 : pv * Math.log(pv / Math.max(qv, 1e-12));
    });

    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, w, h);
    const padL = 42, padR = 16, padT = 18, padB = 34;
    const plotW = w - padL - padR, plotH = h - padT - padB;
    const xS = (x) => padL + ((x - xMin) / (xMax - xMin)) * plotW;
    drawAxes(ctx, padL, padT, plotW, plotH, 12);

    const N = 360;
    const xs = [], ps = [], qs = [], obj = [];
    let dmax = 0, omax = 1e-9;
    for (let i = 0; i <= N; i++) {
      const x = xMin + (i / N) * (xMax - xMin);
      const pv = target(x), qv = q(x);
      const ov = qv * Math.log(qv / Math.max(pv, 1e-12));
      xs.push(x); ps.push(pv); qs.push(qv); obj.push(Math.max(0, ov));
      dmax = Math.max(dmax, pv, qv);
      omax = Math.max(omax, Math.abs(ov));
    }
    dmax *= 1.15;
    const yD = (v) => padT + plotH - (v / dmax) * plotH;

    function curve(arr, stroke, fill) {
      ctx.beginPath();
      arr.forEach((v, i) => {
        const px = xS(xs[i]), py = yD(v);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      if (fill) {
        ctx.lineTo(xS(xMax), padT + plotH);
        ctx.lineTo(xS(xMin), padT + plotH);
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
      }
      ctx.beginPath();
      arr.forEach((v, i) => {
        const px = xS(xs[i]), py = yD(v);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1.8;
      ctx.stroke();
    }
    curve(ps, C.p, C.pFill);
    curve(qs, C.q, C.qFill);

    const oScale = plotH * 0.18 / omax;
    ctx.beginPath();
    obj.forEach((v, i) => {
      const px = xS(xs[i]), py = padT + plotH - v * oScale;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    ctx.lineTo(xS(xMax), padT + plotH);
    ctx.lineTo(xS(xMin), padT + plotH);
    ctx.closePath();
    ctx.fillStyle = C.purpleFill;
    ctx.fill();

    ctx.fillStyle = C.textDim;
    ctx.font = "11px -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let v = -6; v <= 6; v += 2) ctx.fillText(v.toString(), xS(v), padT + plotH + 5);

    const closer = reverse < forward ? "reverse KL is lower here" : "forward KL is lower here";
    document.getElementById("fig3-readout").innerHTML =
      `<div class="row"><span class="lbl">KL[q || p] reverse, mode-seeking</span><span style="font-weight:600;color:${C.q}">${fmt(reverse)} nats</span></div>` +
      `<div class="row"><span class="lbl">KL[p || q] forward, mass-covering</span><span style="font-weight:600;color:${C.p}">${fmt(forward)} nats</span></div>` +
      `<div class="row"><span class="lbl">current fit</span><span>${closer}</span></div>`;
  }

  [mqIn, sqIn].forEach((input) => input.addEventListener("input", draw));
  document.querySelectorAll("[data-fig3-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      const preset = button.dataset.fig3Preset;
      if (preset === "reverse-left") {
        mqIn.value = -2; sqIn.value = 0.55;
      } else if (preset === "reverse-right") {
        mqIn.value = 2; sqIn.value = 0.55;
      } else if (preset === "forward") {
        mqIn.value = 0; sqIn.value = 2.1;
      } else if (preset === "bad") {
        mqIn.value = 0; sqIn.value = 0.45;
      }
      draw();
    });
  });
  draw();
})();

(function figLocalQuad() {
  const canvas = document.getElementById("fig-local-quad");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const thetaIn = document.getElementById("fig-local-quad-theta");
  const rangeIn = document.getElementById("fig-local-quad-range");
  const thetaV = document.getElementById("fig-local-quad-theta-v");
  const rangeV = document.getElementById("fig-local-quad-range-v");
  const readout = document.getElementById("fig-local-quad-readout");

  const EPS = 1e-3;

  // KL[ Ber(a) || Ber(b) ], with 0 log 0 = 0.
  function klBer(a, b) {
    let s = 0;
    if (a > 0) s += a * Math.log(a / b);
    if (a < 1) s += (1 - a) * Math.log((1 - a) / (1 - b));
    return s;
  }

  function draw() {
    const theta = +thetaIn.value;
    const range = +rangeIn.value;
    thetaV.textContent = theta.toFixed(2);
    rangeV.textContent = range.toFixed(2);

    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, w, h);

    const padL = 50, padR = 18, padT = 18, padB = 36;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    const fisher = 1 / (theta * (1 - theta));
    // Scale so the quadratic fills ~42% of the panel height at the range edge.
    const ymax = 1.2 * fisher * range * range;

    drawAxes(ctx, padL, padT, plotW, plotH, 8);

    const xS = (dx) => padL + ((dx + range) / (2 * range)) * plotW;

    // Δθ = 0 reference line
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(xS(0), padT);
    ctx.lineTo(xS(0), padT + plotH);
    ctx.stroke();
    ctx.setLineDash([]);

    const N = 240;
    const xs = [], fwd = [], rev = [], quad = [];
    for (let i = 0; i <= N; i++) {
      const dx = -range + 2 * range * (i / N);
      const tp = theta + dx;
      xs.push(dx);
      quad.push(0.5 * fisher * dx * dx);
      if (tp > EPS && tp < 1 - EPS) {
        fwd.push(klBer(theta, tp));
        rev.push(klBer(tp, theta));
      } else {
        fwd.push(NaN);
        rev.push(NaN);
      }
    }

    ctx.setLineDash([5, 4]);
    drawClippedLine(ctx, xs, quad, 0, ymax, xS, padT, plotH, C.purple, { width: 2 });
    ctx.setLineDash([]);
    drawClippedLine(ctx, xs, fwd, 0, ymax, xS, padT, plotH, C.p, { width: 2.2 });
    drawClippedLine(ctx, xs, rev, 0, ymax, xS, padT, plotH, C.q, { width: 2.2 });

    ctx.fillStyle = C.textDim;
    ctx.font = "11px -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("Δθ = 0", xS(0), padT + plotH + 6);
    ctx.textAlign = "left";
    ctx.fillText(`−${range.toFixed(2)}`, padL, padT + plotH + 6);
    ctx.textAlign = "right";
    ctx.fillText(`+${range.toFixed(2)}`, padL + plotW, padT + plotH + 6);
    ctx.save();
    ctx.translate(padL - 36, padT + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("divergence", 0, 0);
    ctx.restore();

    const hiDomain = Math.min(range, 1 - EPS - theta);
    const dRef = 0.9 * hiDomain;
    const fRef = klBer(theta, theta + dRef);
    const qRef = 0.5 * fisher * dRef * dRef;
    const err = fRef > 1e-9 ? (100 * (fRef - qRef) / fRef) : 0;
    readout.innerHTML =
      `<div class="row"><span class="lbl">Fisher information I(θ)</span><span>${fisher.toFixed(3)}</span></div>` +
      `<div class="row"><span class="lbl">at Δθ = ${dRef.toFixed(3)}</span><span>KL ${fRef.toFixed(4)} vs quadratic ${qRef.toFixed(4)} — off by ${err.toFixed(1)}%</span></div>`;
  }

  [thetaIn, rangeIn].forEach((el) => el.addEventListener("input", draw));
  draw();
})();
