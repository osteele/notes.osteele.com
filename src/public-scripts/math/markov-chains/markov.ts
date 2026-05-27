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
  purpleFill: "rgba(107,69,146,0.45)",
  orange: "#d4690a",
  orangeFill: "rgba(212,105,10,0.22)",
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

function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }
function fmt(x, d = 3) { return Number.isFinite(x) ? x.toFixed(d) : "∞"; }
function sum(xs) { return xs.reduce((a, b) => a + b, 0); }
function normalize(xs) {
  const s = sum(xs);
  return s > 0 ? xs.map(x => x / s) : xs.map(() => 1 / xs.length);
}
function matMul(A, B) {
  const n = A.length, m = B[0].length, kN = B.length;
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: m }, (_, j) => {
      let s = 0;
      for (let k = 0; k < kN; k++) s += A[i][k] * B[k][j];
      return s;
    }));
}
function vecMul(v, P) {
  return P[0].map((_, j) => v.reduce((s, vi, i) => s + vi * P[i][j], 0));
}
function matPow(P, power) {
  let result = P.map((row, i) => row.map((_, j) => i === j ? 1 : 0));
  let base = P.map(row => row.slice());
  let p = power;
  while (p > 0) {
    if (p % 2 === 1) result = matMul(result, base);
    base = matMul(base, base);
    p = Math.floor(p / 2);
  }
  return result;
}
function stationary(P) {
  let v = Array(P.length).fill(1 / P.length);
  for (let t = 0; t < 800; t++) v = vecMul(v, P);
  return v;
}
function tvDistance(a, b) {
  return 0.5 * a.reduce((s, x, i) => s + Math.abs(x - b[i]), 0);
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
function drawLine(ctx, pts, color, width = 2) {
  ctx.beginPath();
  pts.forEach((p, i) => i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]));
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}
function heatColor(v) {
  const t = clamp(v, 0, 1);
  const r = Math.round(245 - 61 * t);
  const g = Math.round(241 - 176 * t);
  const b = Math.round(236 - 194 * t);
  return `rgb(${r},${g},${b})`;
}
function sampleRow(row) {
  const u = Math.random();
  let c = 0;
  for (let i = 0; i < row.length; i++) {
    c += row[i];
    if (u <= c) return i;
  }
  return row.length - 1;
}

const MC = {
  labels: ["A", "B", "C"],
  P: [[0.60, 0.30, 0.10], [0.15, 0.50, 0.35], [0.45, 0.15, 0.40]],
  listeners: [],
};
function notify() { MC.listeners.forEach(fn => fn()); }
function onMatrixChange(fn) { MC.listeners.push(fn); }
// Build P from the six independent off-diagonal probabilities. Each row's
// diagonal is the complement of its off-diagonal sum; if the off-diagonals
// already exceed 1 they are renormalized so the row still sums to 1.
function setEdges(ab, ac, ba, bc, ca, cb) {
  const rows = [
    [0, Math.max(0, ab), Math.max(0, ac)],
    [Math.max(0, ba), 0, Math.max(0, bc)],
    [Math.max(0, ca), Math.max(0, cb), 0],
  ];
  for (let i = 0; i < 3; i++) {
    const off = rows[i][0] + rows[i][1] + rows[i][2];
    if (off > 1) {
      const scale = 1 / off;
      for (let j = 0; j < 3; j++) rows[i][j] *= scale;
    }
    rows[i][i] = 1 - (rows[i][0] + rows[i][1] + rows[i][2]);
    if (rows[i][i] < 0) rows[i][i] = 0;
  }
  MC.P = rows;
  notify();
}
// Modulus of the second-largest eigenvalue of a 3x3 row-stochastic matrix.
// Uses the closed-form for a cubic with one known root at 1: the remaining
// two satisfy s = λ2 + λ3 = trace(P) − 1, p = λ2·λ3 = det(P).
function secondEigModulus(P) {
  const tr = P[0][0] + P[1][1] + P[2][2];
  const det =
      P[0][0] * (P[1][1] * P[2][2] - P[1][2] * P[2][1])
    - P[0][1] * (P[1][0] * P[2][2] - P[1][2] * P[2][0])
    + P[0][2] * (P[1][0] * P[2][1] - P[1][1] * P[2][0]);
  const s = tr - 1;
  const disc = s * s - 4 * det;
  if (disc >= 0) {
    const root = Math.sqrt(disc);
    return Math.max(Math.abs((s + root) / 2), Math.abs((s - root) / 2));
  }
  return Math.sqrt(Math.max(0, det));
}

(function fig1() {
  const canvas = document.getElementById("fig1");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const edgeKeys = ["ab", "ac", "ba", "bc", "ca", "cb"];
  const inputs = Object.fromEntries(edgeKeys.map(k => [k, document.getElementById(`fig1-${k}`)]));
  inputs.speed = document.getElementById("fig1-speed");
  const values = Object.fromEntries(edgeKeys.map(k => [k, document.getElementById(`fig1-${k}-v`)]));
  values.speed = document.getElementById("fig1-speed-v");
  const readout = document.getElementById("fig1-readout");
  const nodes = [{ x: 160, y: 105 }, { x: 340, y: 105 }, { x: 250, y: 260 }];
  let state = 0, counts = [1, 0, 0], steps = 1, last = performance.now();
  // (i, j) → which perpendicular side to offset on; bidirectional pairs split.
  function edgeSide(i, j) { return i < j ? 1 : -1; }

  function syncMatrix() {
    for (const k of edgeKeys) values[k].textContent = (+inputs[k].value).toFixed(2);
    values.speed.textContent = (+inputs.speed.value).toFixed(0);
    setEdges(+inputs.ab.value, +inputs.ac.value, +inputs.ba.value, +inputs.bc.value, +inputs.ca.value, +inputs.cb.value);
  }
  function resetPath() {
    state = 0; counts = [1, 0, 0]; steps = 1; last = performance.now(); draw();
  }
  function step() {
    state = sampleRow(MC.P[state]);
    counts[state]++;
    steps++;
  }
  function drawSelfLoop(i, p) {
    if (p < 0.02) return;
    const n = nodes[i];
    // Self-loops perched on the side of the node opposite the centroid of
    // the other two nodes so they don't collide with the inter-node edges.
    const others = nodes.filter((_, k) => k !== i);
    const cx = (others[0].x + others[1].x) / 2;
    const cy = (others[0].y + others[1].y) / 2;
    const dx = n.x - cx, dy = n.y - cy;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;
    const loopR = 18;
    const cxL = n.x + ux * 36, cyL = n.y + uy * 36;
    ctx.strokeStyle = i === state ? C.red : C.blue;
    ctx.globalAlpha = 0.30 + 0.70 * p;
    ctx.lineWidth = 1 + 7 * p;
    ctx.beginPath();
    ctx.arc(cxL, cyL, loopR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = i === state ? C.red : C.blue;
    ctx.font = "10px 'SF Mono', monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(fmt(p, 2), cxL, cyL);
    ctx.globalAlpha = 1;
  }
  function drawEdge(i, j, p) {
    if (p < 0.02) return;
    const a = nodes[i], b = nodes[j];
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    const ux = dx / len, uy = dy / len;
    const nx = -uy, ny = ux;          // perpendicular unit
    const side = edgeSide(i, j);       // +1 / -1
    const off = 13;
    const ox = nx * off * side, oy = ny * off * side;
    const sx = a.x + ux * 26 + ox, sy = a.y + uy * 26 + oy;
    const ex = b.x - ux * 30 + ox, ey = b.y - uy * 30 + oy;
    ctx.strokeStyle = C.blue;
    ctx.globalAlpha = 0.25 + 0.75 * p;
    ctx.lineWidth = 1 + 7 * p;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
    ctx.fillStyle = C.blue;
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex - ux * 10 - uy * 5, ey - uy * 10 + ux * 5);
    ctx.lineTo(ex - ux * 10 + uy * 5, ey - uy * 10 - ux * 5);
    ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = C.text;
    ctx.font = "10px 'SF Mono', monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const mx = (sx + ex) / 2 + nx * 9 * side, my = (sy + ey) / 2 + ny * 9 * side;
    ctx.fillText(fmt(p, 2), mx, my);
  }
  function draw() {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
      if (i === j) drawSelfLoop(i, MC.P[i][j]);
      else drawEdge(i, j, MC.P[i][j]);
    }
    for (let i = 0; i < 3; i++) {
      const n = nodes[i];
      ctx.fillStyle = i === state ? C.redFill : "#fff";
      ctx.strokeStyle = i === state ? C.red : C.axis;
      ctx.lineWidth = i === state ? 3 : 1.5;
      ctx.beginPath(); ctx.arc(n.x, n.y, 24, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = i === state ? C.red : C.text;
      ctx.font = "700 15px -apple-system, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(MC.labels[i], n.x, n.y);
    }
    const histX = 470, histY = 70, barW = 180, barH = 34, gap = 20;
    const pi = stationary(MC.P);
    const occ = counts.map(c => c / steps);
    ctx.font = "11px -apple-system, sans-serif"; ctx.textAlign = "left"; ctx.textBaseline = "bottom";
    ctx.fillStyle = C.textDim; ctx.fillText("visit histogram vs stationary π", histX, histY - 12);
    for (let i = 0; i < 3; i++) {
      const y = histY + i * (barH + gap);
      ctx.fillStyle = C.text; ctx.fillText(MC.labels[i], histX - 20, y + barH * 0.65);
      ctx.fillStyle = "#eee5d3"; ctx.fillRect(histX, y, barW, barH);
      ctx.fillStyle = C.greenFill; ctx.fillRect(histX, y, barW * occ[i], barH);
      ctx.strokeStyle = C.green; ctx.strokeRect(histX, y, barW * occ[i], barH);
      ctx.strokeStyle = C.red; ctx.lineWidth = 2;
      const px = histX + barW * pi[i];
      ctx.beginPath(); ctx.moveTo(px, y - 3); ctx.lineTo(px, y + barH + 3); ctx.stroke();
      ctx.fillStyle = C.textDim; ctx.fillText(`${fmt(occ[i])} / π ${fmt(pi[i])}`, histX + barW + 12, y + barH * 0.65);
    }
    readout.innerHTML =
      `<div class="row"><span class="lbl">steps</span><span>${steps}</span></div>` +
      `<div class="row"><span class="lbl">current row</span><span>${MC.labels[state]} → [${MC.P[state].map(x => fmt(x, 2)).join(", ")}]</span></div>` +
      `<div class="row"><span class="lbl">π</span><span>[${pi.map(x => fmt(x, 3)).join(", ")}]</span></div>`;
  }
  function tick(now) {
    const interval = 1000 / +inputs.speed.value;
    while (now - last > interval) { step(); last += interval; }
    draw();
    requestAnimationFrame(tick);
  }
  for (const input of Object.values(inputs)) input.addEventListener("input", () => { syncMatrix(); resetPath(); });
  document.getElementById("fig1-reset").addEventListener("click", resetPath);
  const presets = {
    mixing:    { ab: 0.30, ac: 0.10, ba: 0.15, bc: 0.35, ca: 0.45, cb: 0.15 },
    sticky:    { ab: 0.05, ac: 0.03, ba: 0.04, bc: 0.05, ca: 0.05, cb: 0.04 },
    directed:  { ab: 0.85, ac: 0.05, ba: 0.05, bc: 0.85, ca: 0.85, cb: 0.05 },
    reducible: { ab: 0.05, ac: 0.45, ba: 0.45, bc: 0.05, ca: 0.05, cb: 0.05 },
  };
  document.querySelectorAll("[data-fig1-preset]").forEach(button => {
    button.addEventListener("click", () => {
      const p = presets[button.dataset.fig1Preset];
      if (!p) return;
      for (const k of edgeKeys) inputs[k].value = p[k];
      syncMatrix(); resetPath();
    });
  });
  syncMatrix(); resetPath(); requestAnimationFrame(tick);
})();

// ─────────── Figure 3b: spectral gap envelope ───────────
(function figGap() {
  const canvas = document.getElementById("fig3-gap");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const readout = document.getElementById("fig3-gap-readout");
  function draw() {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
    const x0 = 52, y0 = 28, ww = 650, hh = 240;
    drawAxes(ctx, x0, y0, ww, hh, 8, 4);
    const pi = stationary(MC.P);
    const lambda = secondEigModulus(MC.P);
    let mu = [1, 0, 0];
    const tv = [];
    for (let n = 0; n <= 64; n++) {
      tv.push(tvDistance(mu, pi));
      mu = vecMul(mu, MC.P);
    }
    const maxV = Math.max(...tv, 1e-6);
    const pts = tv.map((v, i) => [x0 + i / 64 * ww, y0 + hh - v / maxV * hh * 0.9]);
    drawLine(ctx, pts, C.blue, 2.2);
    const env = tv.map((_, i) => Math.min(maxV, maxV * lambda ** i));
    drawLine(ctx, env.map((v, i) => [x0 + i / 64 * ww, y0 + hh - v / maxV * hh * 0.9]), C.red, 2);
    readout.innerHTML = `<div class="row"><span class="lbl">|λ₂|</span><span>${fmt(lambda, 3)}</span></div><div class="row"><span class="lbl">spectral gap</span><span>${fmt(1 - lambda, 3)}; larger gap means faster mixing</span></div>`;
  }
  onMatrixChange(draw);
  draw();
})();

// ─────────── Figure 3c: probability flow, detailed balance, circulation ───────────
(function figBalance() {
  const canvas = document.getElementById("fig3-balance");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const readout = document.getElementById("fig3-balance-readout");
  const nodes = [{ x: 205, y: 118 }, { x: 515, y: 118 }, { x: 360, y: 262 }];
  const nodeR = 30;
  const dotsPerStream = 4;
  // Cyclic order A→B→C→A. At stationarity the net flow π_iP_ij − π_jP_ji is
  // forced to the same constant J on all three edges, so one number decides
  // whether the chain is reversible (J = 0) or circulating (J ≠ 0).
  const cyc = [[0, 1], [1, 2], [2, 0]];
  let pi = stationary(MC.P);
  let phase = 0;
  let lastTs = performance.now();

  function flow(i, j) { return pi[i] * MC.P[i][j]; }

  // One directed stream i→j: moving dots sized by the flow, plus an arrowhead.
  function drawStream(i, j, f, fref, color, alpha) {
    const a = nodes[i], b = nodes[j];
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;
    const nx = -uy, ny = ux;
    const side = i < j ? 1 : -1;          // opposing streams ride opposite lanes
    const ox = nx * 10 * side, oy = ny * 10 * side;
    const sx = a.x + ux * nodeR + ox, sy = a.y + uy * nodeR + oy;
    const ex = b.x - ux * nodeR + ox, ey = b.y - uy * nodeR + oy;
    ctx.strokeStyle = "rgba(90,101,119,0.16)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha;
    const r = 1.4 + 6 * Math.sqrt(clamp(f / fref, 0, 1));
    for (let k = 0; k < dotsPerStream; k++) {
      const t = ((k + phase) / dotsPerStream) % 1;
      ctx.beginPath();
      ctx.arc(sx + (ex - sx) * t, sy + (ey - sy) * t, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex - ux * 9 - uy * 5, ey - uy * 9 + ux * 5);
    ctx.lineTo(ex - ux * 9 + uy * 5, ey - uy * 9 - ux * 5);
    ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1;
  }

  // A rotating arc through the triangle centre whose direction is the cycle
  // sense and whose weight grows with |J|. Vanishes when the chain is reversible.
  function drawCirculation(J) {
    const mag = Math.min(1, Math.abs(J) / 0.18);
    if (mag < 0.05) return;
    const cx = (nodes[0].x + nodes[1].x + nodes[2].x) / 3;
    const cy = (nodes[0].y + nodes[1].y + nodes[2].y) / 3;
    const R = 36, dir = J > 0 ? 1 : -1;
    const start = phase * 2 * Math.PI * dir;
    const end = start + dir * Math.PI * 1.5;
    ctx.strokeStyle = C.red;
    ctx.globalAlpha = 0.22 + 0.6 * mag;
    ctx.lineWidth = 3 + 4 * mag;
    ctx.beginPath();
    ctx.arc(cx, cy, R, start, end, dir < 0);
    ctx.stroke();
    const hx = cx + R * Math.cos(end), hy = cy + R * Math.sin(end);
    const tx = dir * -Math.sin(end), ty = dir * Math.cos(end);
    const px = -ty, py = tx;
    ctx.fillStyle = C.red;
    ctx.beginPath();
    ctx.moveTo(hx + tx * 11, hy + ty * 11);
    ctx.lineTo(hx - tx * 3 + px * 7, hy - ty * 3 + py * 7);
    ctx.lineTo(hx - tx * 3 - px * 7, hy - ty * 3 - py * 7);
    ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1;
  }

  function render() {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
    const flows = [];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (i !== j) flows.push(flow(i, j));
    const fref = Math.max(...flows, 0.04);
    const J = flow(0, 1) - flow(1, 0);
    const circulating = Math.abs(J) > 0.005;
    const fwdWins = J > 0;

    for (const [i, j] of cyc) {
      drawStream(i, j, flow(i, j), fref,
        circulating && fwdWins ? C.red : C.blue,
        circulating ? (fwdWins ? 0.95 : 0.3) : 0.7);
      drawStream(j, i, flow(j, i), fref,
        circulating && !fwdWins ? C.red : C.blue,
        circulating ? (!fwdWins ? 0.95 : 0.3) : 0.7);
    }
    drawCirculation(J);
    for (let i = 0; i < 3; i++) {
      const n = nodes[i];
      ctx.fillStyle = "#fff"; ctx.strokeStyle = C.axis; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(n.x, n.y, nodeR, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = C.greenFill;
      ctx.beginPath(); ctx.arc(n.x, n.y, 7 + 32 * pi[i], 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = C.text; ctx.font = "700 15px -apple-system, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(MC.labels[i], n.x, n.y);
      ctx.fillStyle = C.textDim; ctx.font = "11px 'SF Mono', monospace";
      ctx.fillText(`π=${fmt(pi[i], 2)}`, n.x, n.y + nodeR + 13);
    }

    const io = [0, 1, 2].map((i) => {
      let inn = 0, out = 0;
      for (let j = 0; j < 3; j++) if (j !== i) { inn += flow(j, i); out += flow(i, j); }
      return `${MC.labels[i]} ${fmt(inn, 3)}=${fmt(out, 3)}`;
    });
    const story = !circulating
      ? "detailed balance — every pairwise exchange cancels"
      : `probability circulates ${fwdWins ? "A→B→C→A" : "A→C→B→A"}`;
    readout.innerHTML =
      `<div class="row"><span class="lbl">circulation J</span><span>${fmt(J, 4)} — ${story}</span></div>` +
      `<div class="row"><span class="lbl">per-node flow</span><span>${io.join(" · ")} — inflow = outflow everywhere (global balance always holds at π)</span></div>` +
      `<div class="row"><span class="lbl">detailed balance</span><span>π_iP_ij = π_jP_ji on every edge ⟺ J = 0 ⟺ reversible; MCMC builds T to force it</span></div>`;
  }

  function tick(now) {
    const dt = Math.min(0.05, (now - lastTs) / 1000);
    lastTs = now;
    phase = (phase + dt * 0.5) % 1;
    render();
    requestAnimationFrame(tick);
  }

  document.getElementById("fig3-balance-sym").addEventListener("click", () => {
    // Replace each pair of flows by their average — forces detailed balance
    // while leaving π and the self-loops untouched.
    const p = stationary(MC.P);
    const S = MC.P.map((row, i) => row.map((v, j) => 0.5 * (p[i] * v + p[j] * MC.P[j][i])));
    MC.P = S.map((row, i) => row.map((v) => v / p[i]));
    notify();
  });
  document.getElementById("fig3-balance-cycle").addEventListener("click", () => {
    MC.P = [[0.08, 0.82, 0.10], [0.10, 0.08, 0.82], [0.82, 0.10, 0.08]];
    notify();
  });
  onMatrixChange(() => { pi = stationary(MC.P); });
  requestAnimationFrame(tick);
})();

(function fig2() {
  const canvas = document.getElementById("fig2");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const readout = document.getElementById("fig2-readout");
  const nIn = document.getElementById("fig2-n");
  const nV = document.getElementById("fig2-n-v");
  function drawHeat(M, x, y, title) {
    const s = 48;
    ctx.fillStyle = C.textDim;
    ctx.font = "11px -apple-system, sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "bottom";
    ctx.fillText(title, x + 1.5 * s, y - 8);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
      ctx.fillStyle = heatColor(M[i][j]);
      ctx.fillRect(x + j * s, y + i * s, s, s);
      ctx.strokeStyle = "#fff"; ctx.strokeRect(x + j * s, y + i * s, s, s);
      ctx.fillStyle = M[i][j] > 0.55 ? "#fff" : C.text;
      ctx.font = "11px 'SF Mono', monospace";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(fmt(M[i][j], 2), x + j * s + s / 2, y + i * s + s / 2);
    }
  }
  function draw() {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
    const selectedN = nIn ? +nIn.value : 16;
    if (nV) nV.textContent = String(selectedN);
    const powers = [1, 2, 4, 8];
    powers.forEach((p, idx) => drawHeat(matPow(MC.P, p), 18 + idx * 132, 46, `P${p === 1 ? "" : "^" + p}`));
    drawHeat(matPow(MC.P, selectedN), w - 164, 46, `scrub P^${selectedN}`);
    const pn = matPow(MC.P, selectedN);
    const rowSpread = Math.max(...pn[0].map((_, j) => Math.max(...pn.map(r => r[j])) - Math.min(...pn.map(r => r[j]))));
    const pi = stationary(MC.P);
    const lam2 = secondEigModulus(MC.P);
    const gap = 1 - lam2;
    // Mixing-time scale: number of steps for |λ₂|ⁿ to fall to 1/e.
    const tMix = lam2 > 1e-6 && lam2 < 1 ? 1 / Math.log(1 / lam2) : (lam2 < 1e-6 ? 0 : Infinity);
    readout.innerHTML =
      `<div class="row"><span class="lbl">stationary π</span><span>[${pi.map(x => fmt(x, 3)).join(", ")}]</span></div>` +
      `<div class="row"><span class="lbl">|λ₂|</span><span>${fmt(lam2, 4)} (spectral gap ${fmt(gap, 4)})</span></div>` +
      `<div class="row"><span class="lbl">geometric rate</span><span>row spread shrinks like |λ₂|ⁿ; reaches 1/e in ≈ ${Number.isFinite(tMix) ? fmt(tMix, 2) : "∞"} steps</span></div>` +
      `<div class="row"><span class="lbl">row spread in P^${selectedN}</span><span>${fmt(rowSpread, 4)}</span></div>`;
  }
  nIn?.addEventListener("input", draw);
  onMatrixChange(draw); draw();
})();

(function fig3() {
  const canvas = document.getElementById("fig3");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const readout = document.getElementById("fig3-readout");
  const padL = 50, padR = 18, padT = 18, padB = 34;
  const plotW = w - padL - padR, plotH = h - padT - padB;
  function draw() {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
    drawAxes(ctx, padL, padT, plotW, plotH, 16, 5);
    const pi = stationary(MC.P);
    const starts = [[1, 0, 0], [0, 1, 0], [1/3, 1/3, 1/3]];
    const colors = [C.red, C.blue, C.green];
    const maxN = 40;
    starts.forEach((start, si) => {
      let v = start.slice();
      const pts = [];
      for (let n = 0; n <= maxN; n++) {
        const tv = Math.max(1e-4, tvDistance(v, pi));
        const x = padL + (n / maxN) * plotW;
        const y = padT + plotH - ((Math.log10(tv) + 4) / 4) * plotH;
        pts.push([x, y]);
        v = vecMul(v, MC.P);
      }
      drawLine(ctx, pts, colors[si], 2.2);
    });
    ctx.fillStyle = C.textDim; ctx.font = "11px -apple-system, sans-serif"; ctx.textAlign = "left"; ctx.textBaseline = "top";
    ctx.fillText("log10 total variation distance to π", padL + 5, padT + 5);
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    for (let n = 0; n <= maxN; n += 10) ctx.fillText(n.toString(), padL + (n / maxN) * plotW, padT + plotH + 7);
    const after20 = starts.map(s => {
      let v = s;
      for (let i = 0; i < 20; i++) v = vecMul(v, MC.P);
      return tvDistance(v, pi);
    });
    readout.innerHTML =
      `<div class="row"><span class="lbl">distance after 20 steps</span><span>${after20.map(x => fmt(x, 4)).join(" / ")}</span></div>` +
      `<div class="row"><span class="lbl">mixing cue</span><span>flatter curves mean slower loss of initial condition</span></div>`;
  }
  onMatrixChange(draw); draw();
})();

(function fig4() {
  const canvas = document.getElementById("fig4");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const pIn = document.getElementById("fig4-p");
  const startIn = document.getElementById("fig4-start");
  const stepsIn = document.getElementById("fig4-steps");
  const pV = document.getElementById("fig4-p-v");
  const startV = document.getElementById("fig4-start-v");
  const stepsV = document.getElementById("fig4-steps-v");
  const readout = document.getElementById("fig4-readout");
  const N = 10;
  function evolve(p, start, steps) {
    let v = Array(N + 1).fill(0); v[start] = 1;
    for (let t = 0; t < steps; t++) {
      const next = Array(N + 1).fill(0);
      next[0] += v[0]; next[N] += v[N];
      for (let i = 1; i < N; i++) {
        next[i + 1] += v[i] * p;
        next[i - 1] += v[i] * (1 - p);
      }
      v = next;
    }
    return v;
  }
  function ruinProb(p, i) {
    if (Math.abs(p - 0.5) < 1e-9) return i / N;
    const r = (1 - p) / p;
    return (1 - r ** i) / (1 - r ** N);
  }
  function draw() {
    const p = +pIn.value, start = +startIn.value, steps = +stepsIn.value;
    pV.textContent = p.toFixed(2); startV.textContent = start.toFixed(0); stepsV.textContent = steps.toFixed(0);
    const dist = evolve(p, start, steps);
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
    const x0 = 48, y0 = 48, barW = (w - 100) / (N + 1), maxH = 190;
    for (let i = 0; i <= N; i++) {
      const hBar = dist[i] * maxH * 1.2;
      ctx.fillStyle = (i === 0 || i === N) ? C.redFill : C.blueFill;
      ctx.fillRect(x0 + i * barW + 4, y0 + maxH - hBar, barW - 8, hBar);
      ctx.strokeStyle = (i === 0 || i === N) ? C.red : C.blue;
      ctx.strokeRect(x0 + i * barW + 4, y0 + maxH - hBar, barW - 8, hBar);
      ctx.fillStyle = C.textDim; ctx.font = "10px -apple-system, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "top";
      ctx.fillText(i.toString(), x0 + i * barW + barW / 2, y0 + maxH + 8);
    }
    ctx.fillStyle = C.textDim; ctx.font = "11px -apple-system, sans-serif"; ctx.textAlign = "left";
    ctx.fillText("fortune", x0, y0 + maxH + 25);
    readout.innerHTML =
      `<div class="row"><span class="lbl">absorbed at 0</span><span>${fmt(dist[0])}</span></div>` +
      `<div class="row"><span class="lbl">absorbed at ${N}</span><span>${fmt(dist[N])} (eventual probability ${fmt(ruinProb(p, start))})</span></div>` +
      `<div class="row"><span class="lbl">transient mass remaining</span><span>${fmt(1 - dist[0] - dist[N])}</span></div>`;
  }
  [pIn, startIn, stepsIn].forEach(input => input.addEventListener("input", draw));
  draw();
})();

(function fig5() {
  const canvas = document.getElementById("fig5");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const epsIn = document.getElementById("fig5-eps");
  const epsV = document.getElementById("fig5-eps-v");
  const readout = document.getElementById("fig5-readout");
  const padL = 50, padR = 18, padT = 18, padB = 34;
  const plotW = w - padL - padR, plotH = h - padT - padB;
  function draw() {
    const eps = +epsIn.value; epsV.textContent = eps.toFixed(2);
    const P = [[eps, 1 - eps], [1 - eps, eps]];
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
    drawAxes(ctx, padL, padT, plotW, plotH, 16, 4);
    let v = [1, 0], avg = [0, 0];
    const pts = [], avgPts = [], maxN = 40;
    for (let n = 0; n <= maxN; n++) {
      avg = [(avg[0] * n + v[0]) / (n + 1), (avg[1] * n + v[1]) / (n + 1)];
      pts.push([padL + (n / maxN) * plotW, padT + plotH - v[0] * plotH]);
      avgPts.push([padL + (n / maxN) * plotW, padT + plotH - avg[0] * plotH]);
      v = vecMul(v, P);
    }
    drawLine(ctx, pts, C.red, 2.2);
    drawLine(ctx, avgPts, C.green, 2.2);
    ctx.strokeStyle = C.axis; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(padL, padT + plotH / 2); ctx.lineTo(padL + plotW, padT + plotH / 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = C.textDim; ctx.font = "11px -apple-system, sans-serif"; ctx.textAlign = "left";
    ctx.fillText("probability of state A after n steps", padL + 5, padT + 5);
    readout.innerHTML =
      `<div class="row"><span class="lbl">periodicity</span><span>${eps === 0 ? "period 2: no ordinary convergence" : "lazy self-loop breaks the period"}</span></div>` +
      `<div class="row"><span class="lbl">stationary distribution</span><span>[0.5, 0.5]</span></div>`;
  }
  epsIn.addEventListener("input", draw); draw();
})();

(function fig6() {
  const canvas = document.getElementById("fig6");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const ins = {
    ra: document.getElementById("fig6-ra"),
    rb: document.getElementById("fig6-rb"),
    rc: document.getElementById("fig6-rc"),
  };
  const vals = {
    ra: document.getElementById("fig6-ra-v"),
    rb: document.getElementById("fig6-rb-v"),
    rc: document.getElementById("fig6-rc-v"),
  };
  const readout = document.getElementById("fig6-readout");
  function draw() {
    const rates = [+ins.ra.value, +ins.rb.value, +ins.rc.value];
    vals.ra.textContent = rates[0].toFixed(2); vals.rb.textContent = rates[1].toFixed(2); vals.rc.textContent = rates[2].toFixed(2);
    const embedded = [[0, 0.7, 0.3], [0.35, 0, 0.65], [0.75, 0.25, 0]];
    const Q = embedded.map((row, i) => row.map((p, j) => i === j ? -rates[i] : p * rates[i]));
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
    const cell = 54, qX = 45, qY = 48;
    ctx.fillStyle = C.textDim; ctx.font = "12px -apple-system, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "bottom";
    ctx.fillText("rate matrix Q", qX + cell * 1.5, qY - 12);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
      ctx.fillStyle = i === j ? "rgba(184,65,42,0.16)" : heatColor(Math.min(Q[i][j] / 3, 1));
      ctx.fillRect(qX + j * cell, qY + i * cell, cell, cell);
      ctx.strokeStyle = "#fff"; ctx.strokeRect(qX + j * cell, qY + i * cell, cell, cell);
      ctx.fillStyle = C.text; ctx.font = "11px 'SF Mono', monospace"; ctx.textBaseline = "middle";
      ctx.fillText(fmt(Q[i][j], 2), qX + j * cell + cell / 2, qY + i * cell + cell / 2);
    }
    const eX = 280, eY = 48;
    ctx.fillStyle = C.textDim; ctx.font = "12px -apple-system, sans-serif"; ctx.fillText("embedded jump chain", eX + cell * 1.5, eY - 12);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
      ctx.fillStyle = i === j ? "#f8f6f1" : heatColor(embedded[i][j]);
      ctx.fillRect(eX + j * cell, eY + i * cell, cell, cell);
      ctx.strokeStyle = "#fff"; ctx.strokeRect(eX + j * cell, eY + i * cell, cell, cell);
      ctx.fillStyle = C.text; ctx.font = "11px 'SF Mono', monospace"; ctx.textBaseline = "middle";
      ctx.fillText(fmt(embedded[i][j], 2), eX + j * cell + cell / 2, eY + i * cell + cell / 2);
    }
    const hX = 525, hY = 48, hW = 190, hH = 165;
    drawAxes(ctx, hX, hY, hW, hH, 5, 4);
    const colors = [C.red, C.blue, C.green];
    rates.forEach((r, idx) => {
      const pts = [];
      for (let i = 0; i <= 120; i++) {
        const t = i / 30;
        const y = r * Math.exp(-r * t);
        pts.push([hX + (t / 4) * hW, hY + hH - Math.min(y / 4, 1) * hH]);
      }
      drawLine(ctx, pts, colors[idx], 2);
    });
    ctx.fillStyle = C.textDim; ctx.font = "11px -apple-system, sans-serif"; ctx.textAlign = "left"; ctx.textBaseline = "top";
    ctx.fillText("holding-time densities", hX + 5, hY + 5);
    readout.innerHTML =
      `<div class="row"><span class="lbl">row-sum rule</span><span>Q_ii = -Σ_{j≠i} Q_ij</span></div>` +
      `<div class="row"><span class="lbl">mean holding times</span><span>A ${fmt(1/rates[0], 2)}, B ${fmt(1/rates[1], 2)}, C ${fmt(1/rates[2], 2)}</span></div>` +
      `<div class="row"><span class="lbl">embedded probabilities</span><span>Q_ij / -Q_ii</span></div>`;
  }
  Object.values(ins).forEach(input => input.addEventListener("input", draw));
  draw();
})();
