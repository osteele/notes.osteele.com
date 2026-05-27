
import { bindEditablePoints } from "../../_shared/editable-points";

type DataPoint = [number, number];

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
  greenFill: "rgba(45,122,62,0.14)",
  purple: "#6b4592",
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

function drawAxes(ctx, x, y, w, h, nx = 5, ny = 5) {
  ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
  for (let i = 0; i <= nx; i++) {
    const px = x + i * w / nx;
    ctx.beginPath(); ctx.moveTo(px, y); ctx.lineTo(px, y + h); ctx.stroke();
  }
  for (let i = 0; i <= ny; i++) {
    const py = y + i * h / ny;
    ctx.beginPath(); ctx.moveTo(x, py); ctx.lineTo(x + w, py); ctx.stroke();
  }
  ctx.strokeStyle = C.axis;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + h); ctx.lineTo(x + w, y + h); ctx.stroke();
}

const state: { data: DataPoint[]; qMean: number[]; qVar: number[]; elboTrace: number[] } = {
  data: [
    [-0.82, -0.48], [-0.68, -0.35], [-0.54, -0.22], [-0.42, -0.06],
    [-0.22, 0.10], [0.05, 0.21], [0.34, 0.50], [0.72, 0.71],
  ],
  qMean: [0, 0],
  qVar: [1.2, 1.2],
  elboTrace: [],
};

function inputs() {
  return {
    noise: Number(document.getElementById("mf-noise").value),
    prior: Number(document.getElementById("mf-prior").value),
  };
}

function matInv2(a, b, c, d) {
  const det = a * d - b * c;
  return [d / det, -b / det, -c / det, a / det];
}

function posterior() {
  const { noise, prior } = inputs();
  const tau = 1 / (noise * noise);
  const priorPrec = 1 / (prior * prior);
  let p00 = priorPrec, p01 = 0, p11 = priorPrec;
  let h0 = 0, h1 = 0;
  for (const [x, y] of state.data) {
    p00 += tau;
    p01 += tau * x;
    p11 += tau * x * x;
    h0 += tau * y;
    h1 += tau * x * y;
  }
  const [s00, s01, s10, s11] = matInv2(p00, p01, p01, p11);
  const mean = [s00 * h0 + s01 * h1, s10 * h0 + s11 * h1];
  return { mean, cov: [s00, s01, s10, s11], precision: [p00, p01, p01, p11] };
}

function mfOptimum() {
  const post = posterior();
  return { mean: post.mean, variances: [1 / post.precision[0], 1 / post.precision[3]] };
}

function resetQ() {
  const post = posterior();
  state.qMean = [post.mean[0] - 0.55, post.mean[1] + 0.55];
  state.qVar = [1.1, 1.1];
  state.elboTrace = [elbo()];
}

function klToExact() {
  const post = posterior();
  const [s00, s01, s10, s11] = post.cov;
  const [p00, p01, p10, p11] = post.precision;
  const v0 = state.qVar[0], v1 = state.qVar[1];
  const dm0 = state.qMean[0] - post.mean[0], dm1 = state.qMean[1] - post.mean[1];
  const trace = p00 * v0 + p11 * v1;
  const quad = p00 * dm0 * dm0 + (p01 + p10) * dm0 * dm1 + p11 * dm1 * dm1;
  const detPost = s00 * s11 - s01 * s10;
  const detQ = v0 * v1;
  return 0.5 * (trace + quad - 2 + Math.log(detPost / detQ));
}

function elbo() {
  return -klToExact();
}

function updateFactor(index) {
  const opt = mfOptimum();
  state.qMean[index] += 0.85 * (opt.mean[index] - state.qMean[index]);
  state.qVar[index] += 0.85 * (opt.variances[index] - state.qVar[index]);
  state.elboTrace.push(elbo());
}

function ellipseParams(cov) {
  const [a, b, , d] = cov;
  const tr = a + d;
  const diff = a - d;
  const root = Math.sqrt(diff * diff + 4 * b * b);
  const l1 = Math.max(1e-6, (tr + root) / 2);
  const l2 = Math.max(1e-6, (tr - root) / 2);
  const angle = 0.5 * Math.atan2(2 * b, diff);
  return { l1, l2, angle };
}

function drawEllipse(ctx, map, mean, cov, color, fill, scale = 2) {
  const e = ellipseParams(cov);
  const center = map(mean[0], mean[1]);
  const rx = Math.sqrt(e.l1) * scale;
  const ry = Math.sqrt(e.l2) * scale;
  const sx = Math.abs(map(1, 0).x - map(0, 0).x);
  const sy = Math.abs(map(0, 1).y - map(0, 0).y);
  ctx.save();
  ctx.translate(center.x, center.y);
  ctx.rotate(-e.angle);
  ctx.scale(rx * sx, ry * sy);
  ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI * 2);
  ctx.restore();
  ctx.fillStyle = fill; ctx.strokeStyle = color; ctx.lineWidth = 2;
  ctx.fill(); ctx.stroke();
}

function drawRegression(canvasId, caviOnly = false) {
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
  if (!canvas) return () => {};
  const { ctx, w, h } = setupCanvas(canvas);
  const readout = document.getElementById(`${canvasId}-readout`);
  const dataPlot = { x: 42, y: 24, w: 310, h: caviOnly ? 0 : 270 };
  const paramPlot = caviOnly ? { x: 52, y: 28, w: 360, h: 270 } : { x: 410, y: 24, w: 300, h: 270 };
  const elboPlot = caviOnly ? { x: 465, y: 38, w: 230, h: 236 } : { x: 88, y: 330, w: 570, h: 54 };

  function dataMap(x, y) {
    return { x: dataPlot.x + ((x + 1) / 2) * dataPlot.w, y: dataPlot.y + dataPlot.h - ((y + 1.4) / 2.8) * dataPlot.h };
  }
  function paramMap(a, b) {
    return { x: paramPlot.x + ((a + 2.2) / 4.4) * paramPlot.w, y: paramPlot.y + paramPlot.h - ((b + 2.2) / 4.4) * paramPlot.h };
  }

  function drawData(post) {
    if (caviOnly) return;
    drawAxes(ctx, dataPlot.x, dataPlot.y, dataPlot.w, dataPlot.h, 4, 4);
    const [a, b] = post.mean;
    ctx.strokeStyle = C.green; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= 120; i++) {
      const x = -1 + i / 60;
      const p = dataMap(x, a + b * x);
      i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y);
    }
    ctx.stroke();
    ctx.fillStyle = C.text; ctx.font = "12px -apple-system, sans-serif"; ctx.fillText("click to add · drag to move · alt-click to remove", dataPlot.x, dataPlot.y + dataPlot.h + 24);
    for (const [x, y] of state.data) {
      const p = dataMap(x, y);
      ctx.fillStyle = C.text; ctx.beginPath(); ctx.arc(p.x, p.y, 4.2, 0, Math.PI * 2); ctx.fill();
    }
  }

  function drawElbo() {
    drawAxes(ctx, elboPlot.x, elboPlot.y, elboPlot.w, elboPlot.h, 5, 2);
    if (state.elboTrace.length < 2) return;
    const min = Math.min(...state.elboTrace), max = Math.max(...state.elboTrace);
    const span = Math.max(0.01, max - min);
    ctx.strokeStyle = C.purple; ctx.lineWidth = 2; ctx.beginPath();
    state.elboTrace.forEach((v, i) => {
      const x = elboPlot.x + i / Math.max(1, state.elboTrace.length - 1) * elboPlot.w;
      const y = elboPlot.y + elboPlot.h - ((v - min) / span) * elboPlot.h;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    });
    ctx.stroke();
    ctx.fillStyle = C.dim; ctx.font = "11px -apple-system, sans-serif"; ctx.fillText("ELBO trace", elboPlot.x, elboPlot.y - 8);
  }

  function draw() {
    const { noise, prior } = inputs();
    document.getElementById("mf-noise-v").textContent = noise.toFixed(2);
    document.getElementById("mf-prior-v").textContent = prior.toFixed(2);
    const post = posterior();
    const opt = mfOptimum();
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
    drawData(post);
    drawAxes(ctx, paramPlot.x, paramPlot.y, paramPlot.w, paramPlot.h, 5, 5);
    drawEllipse(ctx, paramMap, post.mean, post.cov, C.blue, C.blueFill, 2);
    drawEllipse(ctx, paramMap, state.qMean, [state.qVar[0], 0, 0, state.qVar[1]], C.red, C.redFill, 2);
    ctx.fillStyle = C.text; ctx.font = "12px -apple-system, sans-serif";
    ctx.fillText("intercept α", paramPlot.x + paramPlot.w / 2 - 28, paramPlot.y + paramPlot.h + 24);
    ctx.save(); ctx.translate(paramPlot.x - 30, paramPlot.y + paramPlot.h / 2 + 20); ctx.rotate(-Math.PI / 2); ctx.fillText("slope β", 0, 0); ctx.restore();
    if (caviOnly) {
      ctx.fillStyle = C.dim; ctx.font = "11px -apple-system, sans-serif";
      ctx.fillText("click or drag in (α, β) to place q", paramPlot.x, paramPlot.y - 6);
    }
    drawElbo();
    const rho = post.cov[1] / Math.sqrt(post.cov[0] * post.cov[3]);
    const varRatioA = opt.variances[0] / post.cov[0];
    const varRatioB = opt.variances[1] / post.cov[3];
    readout.innerHTML =
      `<div class="row"><span class="lbl">posterior correlation</span><span>ρ = ${rho.toFixed(3)}</span></div>` +
      `<div class="row"><span class="lbl">mean-field variance kept</span><span>α ${(100 * varRatioA).toFixed(0)}%, β ${(100 * varRatioB).toFixed(0)}%</span></div>`;
  }

  if (!caviOnly) {
    const screenToData = ({ x, y }): DataPoint => [
      (x - dataPlot.x) / dataPlot.w * 2 - 1,
      (1 - (y - dataPlot.y) / dataPlot.h) * 2.8 - 1.4,
    ];
    const inPlot = ([x, y]: DataPoint) => x >= -1 && x <= 1 && y >= -1.4 && y <= 1.4;
    bindEditablePoints({
      canvas,
      getPoints: () => state.data,
      setPoints: points => { state.data = points; },
      screenToData,
      dataToScreen: point => dataMap(point[0], point[1]),
      inBounds: point => inPlot(point),
      hitRadius: 8,
      addGesture: "plain",
      removeGesture: "alt",
      constrainPoint: point => [clamp(point[0], -1, 1), clamp(point[1], -1.4, 1.4)] as DataPoint,
      onChange: () => {
        resetQ();
        drawAll();
      },
    });
  }

  if (caviOnly) {
    canvas.style.touchAction = "none";
    let dragging = false;
    const pxToParam = (px, py) => {
      const r = canvas.getBoundingClientRect();
      const a = (px - r.left - paramPlot.x) / paramPlot.w * 4.4 - 2.2;
      const b = (1 - (py - r.top - paramPlot.y) / paramPlot.h) * 4.4 - 2.2;
      return [a, b];
    };
    const inParam = (a, b) => a >= -2.2 && a <= 2.2 && b >= -2.2 && b <= 2.2;
    const place = (px, py) => {
      const [a, b] = pxToParam(px, py);
      if (!inParam(a, b)) return false;
      state.qMean = [a, b];
      state.elboTrace = [elbo()];
      drawAll();
      return true;
    };
    canvas.addEventListener("pointerdown", (e) => {
      if (place(e.clientX, e.clientY)) {
        dragging = true;
        canvas.setPointerCapture(e.pointerId);
        canvas.style.cursor = "grabbing";
        e.preventDefault();
      }
    });
    canvas.addEventListener("pointermove", (e) => {
      if (dragging) { place(e.clientX, e.clientY); return; }
      const [a, b] = pxToParam(e.clientX, e.clientY);
      canvas.style.cursor = inParam(a, b) ? "crosshair" : "";
    });
    const end = (e) => {
      if (!dragging) return;
      dragging = false;
      try { canvas.releasePointerCapture(e.pointerId); } catch {}
      canvas.style.cursor = "";
    };
    canvas.addEventListener("pointerup", end);
    canvas.addEventListener("pointercancel", end);
  }

  return draw;
}

let drawAll = () => {};

(function main() {
  const first = document.getElementById("fig-mf-regression");
  if (!first) return;
  resetQ();
  const draw1 = drawRegression("fig-mf-regression", false);
  const draw2 = drawRegression("fig-mf-cavi", true);
  drawAll = () => { draw1(); draw2(); };

  document.getElementById("mf-noise").addEventListener("input", () => { resetQ(); drawAll(); });
  document.getElementById("mf-prior").addEventListener("input", () => { resetQ(); drawAll(); });
  document.getElementById("mf-collinear").addEventListener("click", () => {
    state.data = [[-0.85, -0.54], [-0.76, -0.43], [-0.69, -0.34], [-0.61, -0.25], [-0.50, -0.14], [-0.42, -0.06]];
    resetQ(); drawAll();
  });
  document.getElementById("mf-balanced").addEventListener("click", () => {
    state.data = [[-0.9, -0.55], [-0.62, -0.31], [-0.26, 0.02], [0.05, 0.21], [0.34, 0.50], [0.72, 0.71], [0.92, 0.92]];
    resetQ(); drawAll();
  });
  document.getElementById("mf-sparse").addEventListener("click", () => {
    state.data = [[-0.7, -0.42], [0.12, 0.24], [0.72, 0.76]];
    resetQ(); drawAll();
  });
  document.getElementById("mf-clear").addEventListener("click", () => { state.data = []; resetQ(); drawAll(); });
  document.getElementById("mf-reset-q").addEventListener("click", () => { resetQ(); drawAll(); });
  document.getElementById("mf-step-alpha").addEventListener("click", () => { updateFactor(0); drawAll(); });
  document.getElementById("mf-step-beta").addEventListener("click", () => { updateFactor(1); drawAll(); });
  document.getElementById("mf-run-cavi").addEventListener("click", () => {
    let n = 0;
    const timer = setInterval(() => {
      updateFactor(n % 2);
      drawAll();
      if (++n >= 24) clearInterval(timer);
    }, 90);
  });
  drawAll();
})();
