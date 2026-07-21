// Interactive figures for the Monte Carlo / sampling-methods explainer.

const C = {
  bg: "#ffffff",
  grid: "#e3ddd0",
  axis: "#5a6577",
  text: "#1f2733",
  textDim: "#5a6577",
  target: "#b8412a",
  targetFill: "rgba(184,65,42,0.28)",
  prop: "#1f4a8c",
  propFill: "rgba(31,74,140,0.18)",
  accept: "#2d7a3e",
  reject: "#bfb9aa",
  particle: "#6b4592",
  obs: "#d4690a",
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
function gaussianSample(mu, sigma) {
  const u = Math.random(), v = Math.random();
  return mu + sigma * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
function drawAxes(ctx, x, y, w, h, verticals = 8, horizontals = 4) {
  ctx.strokeStyle = C.grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= verticals; i++) {
    const px = x + (i / verticals) * w;
    ctx.beginPath();
    ctx.moveTo(px, y);
    ctx.lineTo(px, y + h);
    ctx.stroke();
  }
  for (let i = 0; i <= horizontals; i++) {
    const py = y + (i / horizontals) * h;
    ctx.beginPath();
    ctx.moveTo(x, py);
    ctx.lineTo(x + w, py);
    ctx.stroke();
  }
  ctx.strokeStyle = C.axis;
  ctx.strokeRect(x, y, w, h);
}

// ─────────── Shared Markov-chain renderer / animator ───────────
// Used by Figure 3 (variant lab) and Figure 8 (topology). Edges are drawn as
// quadratic Bezier curves whose control point lies a perpendicular distance
// `curveOffset` from the chord midpoint. The peak displacement of the curve
// from the chord is `|curveOffset| / 2`. dynamicCurveOffsetLine() computes an
// offset large enough that the curve clears intermediate nodes (each with its
// own radius) along a line layout.

function bezierPt(p0, p1, p2, t) {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
  };
}

function curveGeometry(ax, ay, bx, by, rA, rB, curveOffset) {
  const dx = bx - ax, dy = by - ay;
  const len = Math.hypot(dx, dy);
  if (len < 0.5) return null;
  const nx = -dy / len;
  const ny = dx / len;
  const cpx = (ax + bx) / 2 + nx * curveOffset;
  const cpy = (ay + by) / 2 + ny * curveOffset;
  const tax = cpx - ax, tay = cpy - ay;
  const tal = Math.hypot(tax, tay) || 1;
  const sx = ax + (tax / tal) * rA;
  const sy = ay + (tay / tal) * rA;
  const tbx = cpx - bx, tby = cpy - by;
  const tbl = Math.hypot(tbx, tby) || 1;
  const ex = bx + (tbx / tbl) * rB;
  const ey = by + (tby / tbl) * rB;
  return { sx, sy, cpx, cpy, ex, ey };
}

function drawCurvedEdge(ctx, ax, ay, bx, by, rA, rB, color, opts: { width?: number; opacity?: number; curveOffset?: number; arrow?: boolean; dashed?: boolean } = {}) {
  const { width = 1.4, opacity = 0.45, curveOffset = -18, arrow: drawArrow = false, dashed = false } = opts;
  const g = curveGeometry(ax, ay, bx, by, rA, rB, curveOffset);
  if (!g) return null;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.globalAlpha = opacity;
  ctx.lineCap = "round";
  if (dashed) ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(g.sx, g.sy);
  ctx.quadraticCurveTo(g.cpx, g.cpy, g.ex, g.ey);
  ctx.stroke();
  if (dashed) ctx.setLineDash([]);
  if (drawArrow) {
    const a = Math.atan2(g.ey - g.cpy, g.ex - g.cpx);
    ctx.beginPath();
    ctx.moveTo(g.ex, g.ey);
    ctx.lineTo(g.ex - 8 * Math.cos(a - 0.42), g.ey - 8 * Math.sin(a - 0.42));
    ctx.lineTo(g.ex - 8 * Math.cos(a + 0.42), g.ey - 8 * Math.sin(a + 0.42));
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  return g;
}

function selfLoopGeometry(x, y, r) {
  const startX = x + r * 0.55;
  const startY = y - r * 0.78;
  const endX = x - r * 0.55;
  const endY = y - r * 0.78;
  const cp1x = x + r * 2.2;
  const cp1y = y - r * 3.0;
  const cp2x = x - r * 2.2;
  const cp2y = y - r * 3.0;
  return { startX, startY, endX, endY, cp1x, cp1y, cp2x, cp2y };
}

function drawSelfLoop(ctx, x, y, r, color, opts: { width?: number; opacity?: number; arrow?: boolean; dashed?: boolean } = {}) {
  const { width = 2.2, opacity = 0.95, arrow: drawArrow = true, dashed = false } = opts;
  const g = selfLoopGeometry(x, y, r);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.globalAlpha = opacity;
  ctx.lineCap = "round";
  if (dashed) ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(g.startX, g.startY);
  ctx.bezierCurveTo(g.cp1x, g.cp1y, g.cp2x, g.cp2y, g.endX, g.endY);
  ctx.stroke();
  if (dashed) ctx.setLineDash([]);
  if (drawArrow) {
    const a = Math.atan2(g.endY - g.cp2y, g.endX - g.cp2x);
    ctx.beginPath();
    ctx.moveTo(g.endX, g.endY);
    ctx.lineTo(g.endX - 8 * Math.cos(a - 0.42), g.endY - 8 * Math.sin(a - 0.42));
    ctx.lineTo(g.endX - 8 * Math.cos(a + 0.42), g.endY - 8 * Math.sin(a + 0.42));
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  return g;
}

function selfLoopPoint(g, t) {
  const u = 1 - t;
  const x = u * u * u * g.startX + 3 * u * u * t * g.cp1x + 3 * u * t * t * g.cp2x + t * t * t * g.endX;
  const y = u * u * u * g.startY + 3 * u * u * t * g.cp1y + 3 * u * t * t * g.cp2y + t * t * t * g.endY;
  return { x, y };
}

// Compute a curveOffset that gives a wide enough berth around intermediate
// nodes on a line layout. `direction` is -1 for an arc above the chord, +1 below.
// `nodeRadiusFn(index)` returns the radius of each node along the chord.
function dynamicCurveOffsetLine(nodeRadiusFn, from, to, direction = -1, margin = 6) {
  const lo = Math.min(from, to);
  const hi = Math.max(from, to);
  const dist = hi - lo;
  if (dist <= 1) return direction * 22;
  // Find the intermediate that needs the most clearance.
  // At t along the chord, peak displacement is 2t(1-t)*curveOffset.
  // Each intermediate at integer offset k is at t = k / dist; required peak = r_k + margin.
  let needed = 22;
  for (let k = 1; k < dist; k++) {
    const r = nodeRadiusFn(lo + k);
    const t = k / dist;
    const factor = 2 * t * (1 - t);
    if (factor < 0.05) continue;
    needed = Math.max(needed, (r + margin) / factor);
  }
  return direction * (needed + 4);
}

// Compute a curveOffset large enough that a quadratic Bezier from node `from`
// to node `to` clears every node strictly between them, using the nodes' actual
// positions (so it works on wobbling / non-collinear layouts, not just a flat
// line). Each intermediate node is projected onto the chord; the curve's
// perpendicular displacement there — 2t(1-t)*offset — is required to clear the
// node radius plus `margin`, accounting for which side of the chord the node
// sits on. The result keeps the sign of `baseOffset` and never shrinks below it
// in magnitude, so callers can stagger arcs by span via `baseOffset` and still
// get collision-free clearance.
function dynamicCurveOffsetNodes(nodes, radiusFn, from, to, baseOffset, margin = 7) {
  const lo = Math.min(from, to);
  const hi = Math.max(from, to);
  if (hi - lo <= 1) return baseOffset;
  const p0 = nodes[from];
  const p2 = nodes[to];
  const dx = p2.x - p0.x, dy = p2.y - p0.y;
  const len2 = dx * dx + dy * dy;
  if (len2 < 0.25) return baseOffset;
  const len = Math.sqrt(len2);
  // Unit normal, matching curveGeometry's convention (nx=-dy/len, ny=dx/len).
  const nx = -dy / len, ny = dx / len;
  const sign = baseOffset < 0 ? -1 : 1;
  let mag = Math.abs(baseOffset);
  for (let k = lo + 1; k < hi; k++) {
    const node = nodes[k];
    const t = ((node.x - p0.x) * dx + (node.y - p0.y) * dy) / len2;
    if (t <= 0.02 || t >= 0.98) continue;
    const factor = 2 * t * (1 - t);
    if (factor < 0.05) continue;
    // Signed perpendicular distance of the node from the chord, along +n.
    const d = (node.x - p0.x) * nx + (node.y - p0.y) * ny;
    // Curve displacement at t is factor*sign*mag; require it past the node's
    // far edge on the arc side. A node on the opposite side yields a negative
    // requirement and so never forces a smaller arc.
    const required = (sign * d + radiusFn(k) + margin) / factor;
    if (required > mag) mag = required;
  }
  return sign * mag;
}

// ─────────── Figure 0: Map of sampling families ───────────
function initFig0() {
  const canvas = document.getElementById("fig0");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const tableRows = Array.from(document.querySelectorAll("#fig0-table tbody tr"));
  const readout = document.getElementById("fig0-readout");
  let mode = 0;
  let laneRects = [];

  const modes = [
    {
      label: "static target",
      title: "Direct / rejection",
      detail: "Draw candidates from a proposal; accepted samples are independent target draws.",
      active: [0],
    },
    {
      label: "weighted target",
      title: "Importance sampling",
      detail: "Draw from a proposal and move probability mass by weights, not accept/reject.",
      active: [1],
    },
    {
      label: "Markov target",
      title: "MCMC",
      detail: "A transition kernel moves local mass; long-run occupation should match the target.",
      active: [2],
    },
    {
      label: "state over time",
      title: "Sequential Monte Carlo",
      detail: "Particles carry mass forward through dynamics, observations, and resampling.",
      active: [3],
    },
  ];

  function drawCurve(x0, y0, ww, hh, color, dashed = false) {
    ctx.beginPath();
    for (let i = 0; i <= 120; i++) {
      const t = i / 120;
      const x = -3.2 + 6.4 * t;
      const d = 0.45 * gaussianPdf(x, -1.2, 0.55) + 0.55 * gaussianPdf(x, 1.1, 0.8);
      const px = x0 + t * ww;
      const py = y0 + hh - d * hh * 3.2;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    if (dashed) ctx.setLineDash([4, 4]);
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
    ctx.setLineDash([]);
  }

  function arrow(x1, y1, x2, y2, color, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    const a = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 7 * Math.cos(a - 0.45), y2 - 7 * Math.sin(a - 0.45));
    ctx.lineTo(x2 - 7 * Math.cos(a + 0.45), y2 - 7 * Math.sin(a + 0.45));
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function draw() {
    const selected = modes[mode];
    tableRows.forEach((row, index) => row.classList.toggle("active", index === mode));

    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
    const left = 34, top = 28, laneH = 54, laneGap = 12;
    const laneW = w - 68;
    const labels = ["candidate draws", "weighted proposal", "Markov kernel", "particle cloud"];
    laneRects = [];

    for (let lane = 0; lane < 4; lane++) {
      const y = top + lane * (laneH + laneGap);
      laneRects.push({ x: left, y, w: laneW, h: laneH });
      const on = selected.active.includes(lane);
      ctx.fillStyle = on ? "rgba(235,231,223,0.95)" : "rgba(235,231,223,0.38)";
      ctx.fillRect(left, y, laneW, laneH);
      ctx.strokeStyle = on ? C.axis : C.grid; ctx.strokeRect(left, y, laneW, laneH);
      ctx.fillStyle = on ? C.text : C.textDim;
      ctx.font = "600 12px -apple-system, sans-serif";
      ctx.textAlign = "left"; ctx.textBaseline = "top";
      ctx.fillText(labels[lane], left + 10, y + 8);

      const x0 = left + 160, y0 = y + 9, ww = laneW - 180, hh = laneH - 18;
      if (lane === 0) {
        drawCurve(x0, y0, ww, hh, C.target, false);
        drawCurve(x0, y0, ww, hh, C.prop, true);
        for (let i = 0; i < 20; i++) {
          const px = x0 + ww * ((i * 37) % 100) / 100;
          const py = y + laneH - 10 - (i % 5) * 5;
          ctx.fillStyle = i % 3 === 0 ? C.reject : C.accept;
          ctx.beginPath(); ctx.arc(px, py, i % 3 === 0 ? 2 : 3, 0, 2 * Math.PI); ctx.fill();
        }
      } else if (lane === 1) {
        drawCurve(x0, y0, ww, hh, C.prop, true);
        for (let i = 0; i < 24; i++) {
          const t = ((i * 29) % 100) / 100;
          const r = 1.5 + 5 * Math.abs(Math.sin(i * 1.7));
          ctx.fillStyle = `rgba(107,69,146,${0.22 + 0.5 * r / 6.5})`;
          ctx.beginPath(); ctx.arc(x0 + t * ww, y + 36 - (i % 4) * 4, r, 0, 2 * Math.PI); ctx.fill();
        }
      } else if (lane === 2) {
        const nodes = 9;
        for (let i = 0; i < nodes; i++) {
          const px = x0 + (i / (nodes - 1)) * ww;
          const py = y + 34 - 12 * Math.sin(i * 0.9);
          ctx.fillStyle = i === 4 ? C.target : "#fff";
          ctx.strokeStyle = C.prop;
          ctx.beginPath(); ctx.arc(px, py, i === 4 ? 7 : 5, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
          if (i > 0) arrow(x0 + ((i - 1) / (nodes - 1)) * ww + 7, y + 34 - 12 * Math.sin((i - 1) * 0.9), px - 7, py, C.prop, 0.45);
        }
      } else {
        for (let t = 0; t < 8; t++) {
          const px = x0 + (t / 7) * ww;
          arrow(px, y + 12, px + ww / 10, y + 42, C.prop, 0.25);
          for (let p = 0; p < 9; p++) {
            ctx.fillStyle = `rgba(107,69,146,${0.18 + 0.07 * p})`;
            ctx.beginPath(); ctx.arc(px, y + 16 + ((p * 13 + t * 5) % 28), 1.6 + (p % 3), 0, 2 * Math.PI); ctx.fill();
          }
        }
      }
    }

    readout.innerHTML =
      `<div class="row"><span class="lbl">${selected.title}</span><span>${selected.detail}</span></div>`;
  }

  function setMode(next) {
    mode = (next + modes.length) % modes.length;
    draw();
  }
  tableRows.forEach((row, index) => {
    row.addEventListener("click", () => setMode(index));
  });
  canvas.addEventListener("click", (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * w;
    const y = ((event.clientY - rect.top) / rect.height) * h;
    const index = laneRects.findIndex((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
    if (index >= 0) setMode(index);
  });
  draw();
}

initFig0();

// ─────────── Figure 2c: Trace and ACF diagnostics ───────────
(function fig2Diagnostics() {
  const canvas = document.getElementById("fig2diag");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const stepIn = document.getElementById("fig2diag-step");
  const stepV = document.getElementById("fig2diag-step-v");
  const readout = document.getElementById("fig2diag-readout");
  const runBtn = document.getElementById("fig2diag-runpause");
  let running = true, cur = { x: 0, y: 0 }, chain = [], total = 0, acc = 0;
  function logPi(x, y) {
    return -0.5 * (x * x / 4 + (y - 0.3 * x * x + 2) ** 2 / 0.5);
  }
  function reset() { cur = { x: 0, y: 0 }; chain = [{ ...cur }]; total = 0; acc = 0; draw(); }
  function step() {
    const s = +stepIn.value;
    const prop = { x: cur.x + gaussianSample(0, s), y: cur.y + gaussianSample(0, s) };
    if (Math.log(Math.random()) < logPi(prop.x, prop.y) - logPi(cur.x, cur.y)) { cur = prop; acc++; }
    total++; chain.push({ ...cur }); if (chain.length > 900) chain.shift();
  }
  function acfAt(xs, lag) {
    if (xs.length <= lag + 3) return 0;
    const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
    let num = 0, den = 0;
    for (let i = 0; i < xs.length - lag; i++) num += (xs[i] - mean) * (xs[i + lag] - mean);
    for (const x of xs) den += (x - mean) ** 2;
    return den ? num / den : 0;
  }
  function draw() {
    stepV.textContent = (+stepIn.value).toFixed(2);
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
    const xs = chain.map((p) => p.x);
    const panels: [number, number, number, number, string][] = [[44, 22, 690, 95, "trace x"], [44, 142, 690, 90, "ACF by lag"], [44, 258, 690, 58, "rolling acceptance"]];
    panels.forEach(([x, y, ww, hh, label]) => { drawAxes(ctx, x, y, ww, hh, 8, 3); ctx.fillStyle = C.textDim; ctx.font = "11px -apple-system, sans-serif"; ctx.fillText(label, x + 6, y + 14); });
    if (xs.length > 2) {
      const min = Math.min(-5, ...xs), max = Math.max(5, ...xs);
      const pts = xs.map((v, i) => [44 + i / (xs.length - 1) * 690, 22 + 95 - (v - min) / (max - min) * 95]);
      ctx.strokeStyle = C.prop; ctx.lineWidth = 1.4; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke();
      const acfs = Array.from({ length: 42 }, (_, lag) => acfAt(xs, lag));
      const acfPts = acfs.map((v, i) => [44 + i / 41 * 690, 142 + 45 - v * 42]);
      ctx.strokeStyle = C.target; ctx.lineWidth = 2; ctx.beginPath(); acfPts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke();
      const tau = 1 + 2 * acfs.slice(1).reduce((s, v) => s + Math.max(0, v), 0);
      const ess = xs.length / tau;
      ctx.fillStyle = C.particle; ctx.fillRect(46, 282, 680 * Math.min(1, ess / xs.length), 16);
      readout.innerHTML = `<div class="row"><span class="lbl">acceptance</span><span>${total ? (acc / total).toFixed(2) : "0.00"}</span></div><div class="row"><span class="lbl">ESS estimate</span><span>${ess.toFixed(0)} of ${xs.length}</span></div>`;
    }
  }
  function tick() {
    if (running) { for (let i = 0; i < 8; i++) step(); draw(); }
    requestAnimationFrame(tick);
  }
  runBtn.addEventListener("click", () => { running = !running; runBtn.textContent = running ? "Pause" : "Run"; });
  document.getElementById("fig2diag-reset").addEventListener("click", reset);
  stepIn.addEventListener("input", reset);
  reset(); tick();
})();

// ─────────── Figure 4: the acceptance ratio forces detailed balance ───────────
(function figMhBalance() {
  const canvas = document.getElementById("fig-mhbalance");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const piIn = document.getElementById("fig-mhbalance-pi");
  const qIn = document.getElementById("fig-mhbalance-q");
  const piV = document.getElementById("fig-mhbalance-pi-v");
  const qV = document.getElementById("fig-mhbalance-q-v");
  const readout = document.getElementById("fig-mhbalance-readout");
  const symBtn = document.getElementById("fig-mhbalance-sym");
  const hastingsBtn = document.getElementById("fig-mhbalance-hastings");
  const dots = 5;
  let phase = 0, lastTs = performance.now();

  // One horizontal stream of moving dots from (x0,y) to (x1,y); dot radius ∝ flow.
  function stream(x0, x1, y, value, ref, color, alpha) {
    ctx.strokeStyle = "rgba(90,101,119,0.16)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha;
    const r = 2 + 7 * Math.sqrt(clamp(value / ref, 0, 1));
    for (let k = 0; k < dots; k++) {
      const t = ((k + phase) / dots) % 1;
      ctx.beginPath();
      ctx.arc(x0 + (x1 - x0) * t, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    const sgn = x1 > x0 ? 1 : -1;
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x1 - sgn * 9, y - 5);
    ctx.lineTo(x1 - sgn * 9, y + 5);
    ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1;
  }

  function node(cx, cy, txt) {
    ctx.fillStyle = "#fff"; ctx.strokeStyle = C.axis; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, 23, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = C.text; ctx.font = "700 14px -apple-system, sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(txt, cx, cy);
  }

  // A two-node X↔X′ panel with a forward and a backward dot stream.
  function flowPanel(xL, xR, cy, fFwd, fBwd, ref, fwdColor, bwdColor) {
    node(xL, cy, "x");
    node(xR, cy, "x′");
    stream(xL + 25, xR - 25, cy - 17, fFwd, ref, fwdColor, 0.92);
    stream(xR - 25, xL + 25, cy + 17, fBwd, ref, bwdColor, 0.92);
  }

  function gauge(txt, a, gx, gw, gy) {
    ctx.fillStyle = C.textDim; ctx.font = "11px 'SF Mono', monospace";
    ctx.textAlign = "left"; ctx.textBaseline = "bottom";
    ctx.fillText(`${txt} = ${a.toFixed(2)}`, gx, gy - 6);
    ctx.fillStyle = "#eee5d3"; ctx.fillRect(gx, gy, gw, 15);
    ctx.fillStyle = C.accept; ctx.fillRect(gx, gy, gw * a, 15);
    ctx.strokeStyle = C.axis; ctx.lineWidth = 1; ctx.strokeRect(gx, gy, gw, 15);
  }

  function caption(txt, x, y, color, font) {
    ctx.fillStyle = color; ctx.font = font;
    ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.fillText(txt, x, y);
  }

  function render() {
    const tr = +piIn.value, qr = +qIn.value;
    piV.textContent = tr.toFixed(2);
    qV.textContent = qr.toFixed(2);
    // Reference scale: forward proposal flow π(x)q(x'|x) ≡ 1, backward = tr·qr.
    const F = 1, B = tr * qr;
    const aFwd = Math.min(1, B / F), aBwd = Math.min(1, F / B);
    const realized = Math.min(F, B), ref = Math.max(F, B);
    const overFwd = F > B + 1e-9, overBwd = B > F + 1e-9;

    // Layout derived from the rendered width so the three zones always fit.
    const m = 24, nodeR = 23, z = (w - 2 * m) / 3, cy = 140;
    const lN1 = m + nodeR + 6, lN2 = m + z - nodeR - 6;
    const gx = m + z + 15, gw = z - 30;
    const rN1 = m + 2 * z + nodeR + 6, rN2 = w - m - nodeR - 6;

    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
    caption("proposal flow", (lN1 + lN2) / 2, 32, C.textDim, "12px -apple-system, sans-serif");
    caption("× acceptance α", gx + gw / 2, 32, C.textDim, "12px -apple-system, sans-serif");
    caption("= realized flow", (rN1 + rN2) / 2, 32, C.textDim, "12px -apple-system, sans-serif");

    flowPanel(lN1, lN2, cy, F, B, ref,
      overFwd ? C.target : C.prop, overBwd ? C.target : C.prop);
    gauge("α(x→x′)", aFwd, gx, gw, 108);
    gauge("α(x′→x)", aBwd, gx, gw, 172);
    flowPanel(rN1, rN2, cy, realized, realized, ref, C.accept, C.accept);

    ctx.fillStyle = C.textDim; ctx.font = "300 26px -apple-system, sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("×", m + z, cy);
    ctx.fillText("=", m + 2 * z, cy);

    caption("π(x)T(x→x′) = π(x′)T(x′→x)  ✓", (rN1 + rN2) / 2, 232,
      C.accept, "600 11px -apple-system, sans-serif");

    readout.innerHTML =
      `<div class="row"><span class="lbl">proposal flow</span><span>forward π(x)q(x′|x) = ${F.toFixed(3)} · backward π(x′)q(x|x′) = ${B.toFixed(3)} — generally unequal</span></div>` +
      `<div class="row"><span class="lbl">acceptance α</span><span>α(x→x′) = ${aFwd.toFixed(3)} · α(x′→x) = ${aBwd.toFixed(3)} — the over-full direction is throttled, the other stays at 1</span></div>` +
      `<div class="row"><span class="lbl">realized flow</span><span>both directions = min(forward, backward) = ${realized.toFixed(3)}; π(x)T(x→x′) = π(x′)T(x′→x) holds for every setting</span></div>`;
  }

  function tick(now) {
    const dt = Math.min(0.05, (now - lastTs) / 1000);
    lastTs = now;
    phase = (phase + dt * 0.5) % 1;
    render();
    requestAnimationFrame(tick);
  }

  function setActive(symActive) {
    symBtn.classList.toggle("active", symActive);
    hastingsBtn.classList.toggle("active", !symActive);
  }
  symBtn.addEventListener("click", () => { qIn.value = "1"; setActive(true); });
  hastingsBtn.addEventListener("click", () => { qIn.value = "0.4"; setActive(false); });
  qIn.addEventListener("input", () => setActive(Math.abs(+qIn.value - 1) < 1e-9));
  requestAnimationFrame(tick);
})();

// ─────────── Figure 2d: HMC trajectory comparison ───────────
(function fig2Hmc() {
  const canvas = document.getElementById("fig2hmc");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const epsIn = document.getElementById("fig2hmc-eps");
  const lIn = document.getElementById("fig2hmc-l");
  const epsV = document.getElementById("fig2hmc-eps-v");
  const lV = document.getElementById("fig2hmc-l-v");
  const readout = document.getElementById("fig2hmc-readout");
  const bananaBtn = document.getElementById("fig2hmc-target-banana");
  const bnnBtn = document.getElementById("fig2hmc-target-bnn");
  // Banana target
  function Ubanana(x, y) { return 0.5 * (x * x / 4 + (y - 0.3 * x * x + 2) ** 2 / 0.5); }
  function gradUbanana(x, y) {
    const d = y - 0.3 * x * x + 2;
    return [x / 4 - 0.6 * x * d / 0.5, d / 0.5];
  }
  // BNN posterior target: f(x; w1, w2) = w1 * tanh(w2 * x). Fixed dataset & hyperparams matched
  // to the Bayesian-neural-networks page so the picture stays consistent across pages.
  const bnnAlpha = 0.55, bnnBeta = 6.0;
  const bnnData = [
    { x: -1.8, y: -1.13 }, { x: -1.1, y: -0.92 }, { x: -0.45, y: -0.5 }, { x: 0.15, y: 0.21 },
    { x: 0.7, y: 0.81 }, { x: 1.35, y: 1.08 }, { x: 1.9, y: 1.18 },
  ];
  function Ubnn(w1, w2) {
    let ed = 0;
    for (const d of bnnData) { const r = d.y - w1 * Math.tanh(w2 * d.x); ed += r * r; }
    return bnnBeta * 0.5 * ed + bnnAlpha * 0.5 * (w1 * w1 + w2 * w2);
  }
  function gradUbnn(w1, w2) {
    let g1 = 0, g2 = 0;
    for (const d of bnnData) {
      const t = Math.tanh(w2 * d.x);
      const r = d.y - w1 * t;
      g1 += -r * t;
      g2 += -r * w1 * (1 - t * t) * d.x;
    }
    return [bnnBeta * g1 + bnnAlpha * w1, bnnBeta * g2 + bnnAlpha * w2];
  }
  let target = "banana";
  let rw = { x: 0, y: 0 }, hmc = { x: 0, y: 0 }, traj = [];
  let rwTrail = [], hmcTrail = [];
  const TRAIL_MAX = 200;
  let rwAcc = 0, rwTot = 0, hmcAcc = 0, hmcTot = 0;
  let bbox = { xMin: -5, xMax: 5, yMin: -5, yMax: 3 };
  let proposalScale = 0.65;
  let running = false, rafId = null, lastTick = 0;
  function U(x, y) { return target === "banana" ? Ubanana(x, y) : Ubnn(x, y); }
  function gradU(x, y) { return target === "banana" ? gradUbanana(x, y) : gradUbnn(x, y); }
  function logPi(x, y) { return -U(x, y); }
  function setTarget(t) {
    target = t;
    if (bananaBtn) bananaBtn.classList.toggle("active", t === "banana");
    if (bnnBtn) bnnBtn.classList.toggle("active", t === "bnn");
    if (t === "banana") {
      bbox = { xMin: -5, xMax: 5, yMin: -5, yMax: 3 };
      proposalScale = 0.65;
      rw = { x: 0, y: 0 }; hmc = { x: 0, y: 0 };
    } else {
      bbox = { xMin: -2.4, xMax: 2.4, yMin: -2.4, yMax: 2.4 };
      proposalScale = 0.35;
      // Start near a mode so HMC has somewhere to go but RW-MH gets stuck if temperature is right.
      rw = { x: 0.5, y: 0.5 }; hmc = { x: 0.5, y: 0.5 };
    }
    traj = []; rwTrail = [{ ...rw }]; hmcTrail = [{ ...hmc }];
    rwAcc = 0; rwTot = 0; hmcAcc = 0; hmcTot = 0;
    draw();
  }
  const xS = (x) => 44 + ((x - bbox.xMin) / (bbox.xMax - bbox.xMin)) * 690;
  const yS = (y) => 24 + 292 - ((y - bbox.yMin) / (bbox.yMax - bbox.yMin)) * 292;
  function one() {
    const prop = { x: rw.x + gaussianSample(0, proposalScale), y: rw.y + gaussianSample(0, proposalScale) };
    rwTot++;
    if (Math.log(Math.random()) < logPi(prop.x, prop.y) - logPi(rw.x, rw.y)) { rw = prop; rwAcc++; }
    rwTrail.push({ ...rw }); if (rwTrail.length > TRAIL_MAX) rwTrail.shift();

    let x = hmc.x, y = hmc.y, px = gaussianSample(0, 1), py = gaussianSample(0, 1);
    const oldH = U(x, y) + 0.5 * (px * px + py * py);
    traj = [[x, y]];
    const eps = +epsIn.value, L = +lIn.value;
    let [gx, gy] = gradU(x, y); px -= 0.5 * eps * gx; py -= 0.5 * eps * gy;
    for (let i = 0; i < L; i++) {
      x += eps * px; y += eps * py;
      [gx, gy] = gradU(x, y);
      if (i !== L - 1) { px -= eps * gx; py -= eps * gy; }
      traj.push([x, y]);
    }
    px -= 0.5 * eps * gx; py -= 0.5 * eps * gy;
    const newH = U(x, y) + 0.5 * (px * px + py * py);
    hmcTot++;
    if (Math.log(Math.random()) < oldH - newH) { hmc = { x, y }; hmcAcc++; }
    hmcTrail.push({ ...hmc }); if (hmcTrail.length > TRAIL_MAX) hmcTrail.shift();
    draw();
  }
  function draw() {
    epsV.textContent = (+epsIn.value).toFixed(2); lV.textContent = lIn.value;
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
    drawAxes(ctx, 44, 24, 690, 292, 8, 6);
    // Compute density scale from a quick pass so the BNN heatmap is visible.
    let maxLog = -Infinity;
    for (let ix = 0; ix < 80; ix++) for (let iy = 0; iy < 50; iy++) {
      const x = bbox.xMin + ix / 79 * (bbox.xMax - bbox.xMin);
      const y = bbox.yMin + iy / 49 * (bbox.yMax - bbox.yMin);
      const lp = logPi(x, y); if (lp > maxLog) maxLog = lp;
    }
    for (let ix = 0; ix < 80; ix++) for (let iy = 0; iy < 50; iy++) {
      const x = bbox.xMin + ix / 79 * (bbox.xMax - bbox.xMin);
      const y = bbox.yMin + iy / 49 * (bbox.yMax - bbox.yMin);
      const rel = Math.exp(logPi(x, y) - maxLog);
      ctx.fillStyle = `rgba(184,65,42,${Math.min(0.32, rel * 0.4)})`;
      ctx.fillRect(xS(x), yS(y), 9, 8);
    }
    // Trails (fading dots)
    for (let i = 0; i < rwTrail.length; i++) {
      const a = 0.06 + 0.40 * (i / rwTrail.length);
      ctx.fillStyle = `rgba(31,74,140,${a})`;
      ctx.beginPath(); ctx.arc(xS(rwTrail[i].x), yS(rwTrail[i].y), 2.4, 0, 2 * Math.PI); ctx.fill();
    }
    for (let i = 0; i < hmcTrail.length; i++) {
      const a = 0.06 + 0.40 * (i / hmcTrail.length);
      ctx.fillStyle = `rgba(45,122,62,${a})`;
      ctx.beginPath(); ctx.arc(xS(hmcTrail[i].x), yS(hmcTrail[i].y), 2.4, 0, 2 * Math.PI); ctx.fill();
    }
    // Last leapfrog trajectory
    ctx.strokeStyle = C.target; ctx.lineWidth = 2;
    ctx.beginPath(); traj.forEach(([x, y], i) => i ? ctx.lineTo(xS(x), yS(y)) : ctx.moveTo(xS(x), yS(y))); ctx.stroke();
    // Current state markers
    ctx.fillStyle = C.prop; ctx.beginPath(); ctx.arc(xS(rw.x), yS(rw.y), 5.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = C.axis; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = C.accept; ctx.beginPath(); ctx.arc(xS(hmc.x), yS(hmc.y), 5.5, 0, Math.PI * 2); ctx.fill();
    ctx.stroke();

    const note = target === "banana"
      ? "HMC follows a contour-informed path; RW-MH jitters locally."
      : "Two basins (sign-symmetric). HMC can leap across; RW-MH usually stays in whichever basin it started.";
    const rwR = rwTot ? (100 * rwAcc / rwTot).toFixed(1) : "—";
    const hmR = hmcTot ? (100 * hmcAcc / hmcTot).toFixed(1) : "—";
    readout.innerHTML =
      `<div class="row"><span class="lbl">target</span><span>${target === "banana" ? "banana ridge" : "BNN posterior over (w₁, w₂)"}</span></div>` +
      `<div class="row"><span class="lbl">steps · accept rate</span><span>RW-MH: ${rwTot} · ${rwR}%   ·   HMC: ${hmcTot} · ${hmR}%</span></div>` +
      `<div class="row"><span class="lbl">comparison</span><span>${note}</span></div>`;
  }

  const speedIn = document.getElementById("fig2hmc-speed");
  const speedV = document.getElementById("fig2hmc-speed-v");
  const runBtn = document.getElementById("fig2hmc-runpause");
  function tick(t) {
    if (!running) { rafId = 0; return; }
    const interval = 1000 / Math.max(0.5, +speedIn.value);
    if (!lastTick || t - lastTick >= interval) { one(); lastTick = t; }
    rafId = requestAnimationFrame(tick);
  }
  if (runBtn) runBtn.addEventListener("click", () => {
    running = !running;
    runBtn.textContent = running ? "Pause" : "Run";
    if (running && !rafId) { lastTick = 0; rafId = requestAnimationFrame(tick); }
  });
  if (speedIn) speedIn.addEventListener("input", () => {
    speedV.textContent = (+speedIn.value).toFixed(1);
  });
  // Sync initial button text to running state (default paused)
  if (runBtn) runBtn.textContent = running ? "Pause" : "Run";
  if (speedIn && speedV) speedV.textContent = (+speedIn.value).toFixed(1);

  document.getElementById("fig2hmc-step").addEventListener("click", one);
  document.getElementById("fig2hmc-reset").addEventListener("click", () => { setTarget(target); });
  if (bananaBtn) bananaBtn.addEventListener("click", () => setTarget("banana"));
  if (bnnBtn) bnnBtn.addEventListener("click", () => setTarget("bnn"));
  [epsIn, lIn].forEach((input) => input.addEventListener("input", draw));
  // Initial trails for current state
  rwTrail = [{ ...rw }]; hmcTrail = [{ ...hmc }];
  draw();
})();

// ─────────── Figure 7: MALA drift and diffusion ───────────
(function figMala() {
  const canvas = document.getElementById("fig-mala");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const epsIn = document.getElementById("fig-mala-eps");
  const speedIn = document.getElementById("fig-mala-speed");
  const epsV = document.getElementById("fig-mala-eps-v");
  const speedV = document.getElementById("fig-mala-speed-v");
  const runBtn = document.getElementById("fig-mala-runpause");
  const readout = document.getElementById("fig-mala-readout");

  // Banana target — same parameters as Figure 6 (fig2hmc) so the picture matches.
  function Ubanana(x, y) { return 0.5 * (x * x / 4 + (y - 0.3 * x * x + 2) ** 2 / 0.5); }
  function gradUbanana(x, y) {
    const d = y - 0.3 * x * x + 2;
    return [x / 4 - 0.6 * x * d / 0.5, d / 0.5];
  }
  function logPi(x, y) { return -Ubanana(x, y); }
  function gradLogPi(x, y) { const [gx, gy] = gradUbanana(x, y); return [-gx, -gy]; }

  const bbox = { xMin: -5, xMax: 5, yMin: -5, yMax: 3 };
  // Virtual-coordinate plot box, matching fig2hmc's layout pattern.
  const PX = 44, PY = 24, PW = 690, PH = 292;
  const xS = (x) => PX + ((x - bbox.xMin) / (bbox.xMax - bbox.xMin)) * PW;
  const yS = (y) => PY + PH - ((y - bbox.yMin) / (bbox.yMax - bbox.yMin)) * PH;

  const TRAIL_MAX = 160;
  let cur = { x: 0, y: 0 };
  let trail = [];
  let accepted = 0, total = 0;
  let last = null; // { drift, diff, prop, accept }
  let running = false, rafId = 0, lastTick = 0;
  let corrected = true; // MALA (true) vs unadjusted Langevin / ULA (false)
  const NB = 48;        // x-marginal histogram bins over [bbox.xMin, bbox.xMax]
  let histBins = new Array(NB).fill(0);
  let histTotal = 0, histSumX = 0, histSumX2 = 0;

  function reset() {
    cur = { x: 0, y: 0 };
    trail = [{ ...cur }];
    accepted = 0; total = 0;
    histBins = new Array(NB).fill(0);
    histTotal = 0; histSumX = 0; histSumX2 = 0;
    last = null;
    draw();
  }

  // Log-density of N(b ; a + (eps^2/2) gradLogPi(a), eps^2 I), for the asymmetric correction.
  function logQ(bx, by, ax, ay, eps) {
    const [gx, gy] = gradLogPi(ax, ay);
    const mx = ax + 0.5 * eps * eps * gx;
    const my = ay + 0.5 * eps * eps * gy;
    const v = eps * eps;
    return -0.5 * ((bx - mx) ** 2 + (by - my) ** 2) / v - Math.log(2 * Math.PI * v);
  }

  function one() {
    const eps = +epsIn.value;
    const [gx, gy] = gradLogPi(cur.x, cur.y);
    const drift = [0.5 * eps * eps * gx, 0.5 * eps * eps * gy];
    const z = [gaussianSample(0, 1), gaussianSample(0, 1)];
    const diff = [eps * z[0], eps * z[1]];
    const prop = { x: cur.x + drift[0] + diff[0], y: cur.y + drift[1] + diff[1] };
    let accept;
    if (corrected) {
      const logAlpha =
        logPi(prop.x, prop.y) - logPi(cur.x, cur.y) +
        logQ(cur.x, cur.y, prop.x, prop.y, eps) - logQ(prop.x, prop.y, cur.x, cur.y, eps);
      accept = Math.log(Math.random()) < logAlpha;
    } else {
      accept = true; // ULA: no accept/reject — the Euler step is always taken
    }
    total++;
    last = { drift, diff, prop, accept };
    if (accept) { cur = { x: prop.x, y: prop.y }; accepted++; }
    trail.push({ ...cur });
    if (trail.length > TRAIL_MAX) trail.shift();
    // Accumulate the x-marginal histogram of the chain state.
    const bi = Math.max(0, Math.min(NB - 1, Math.floor((cur.x - bbox.xMin) / (bbox.xMax - bbox.xMin) * NB)));
    histBins[bi]++; histTotal++; histSumX += cur.x; histSumX2 += cur.x * cur.x;
    draw();
  }

  function arrow(ax, ay, bx, by, color, dashed) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2.4;
    if (dashed) ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
    ctx.setLineDash([]);
    const ang = Math.atan2(by - ay, bx - ax);
    const len = Math.hypot(bx - ax, by - ay);
    if (len > 4) {
      const hl = 8;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx - hl * Math.cos(ang - 0.4), by - hl * Math.sin(ang - 0.4));
      ctx.lineTo(bx - hl * Math.cos(ang + 0.4), by - hl * Math.sin(ang + 0.4));
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function verdict(rate) {
    if (rate < 0.45) return ["step ε too large", C.target];
    if (rate > 0.70) return ["step ε too small", C.prop];
    return ["well tuned", C.accept];
  }

  function draw() {
    epsV.textContent = (+epsIn.value).toFixed(2);
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
    drawAxes(ctx, PX, PY, PW, PH, 8, 6);

    // Faint filled density contours (same approach as fig2hmc).
    let maxLog = -Infinity;
    for (let ix = 0; ix < 80; ix++) for (let iy = 0; iy < 50; iy++) {
      const x = bbox.xMin + ix / 79 * (bbox.xMax - bbox.xMin);
      const y = bbox.yMin + iy / 49 * (bbox.yMax - bbox.yMin);
      const lp = logPi(x, y); if (lp > maxLog) maxLog = lp;
    }
    for (let ix = 0; ix < 80; ix++) for (let iy = 0; iy < 50; iy++) {
      const x = bbox.xMin + ix / 79 * (bbox.xMax - bbox.xMin);
      const y = bbox.yMin + iy / 49 * (bbox.yMax - bbox.yMin);
      const rel = Math.exp(logPi(x, y) - maxLog);
      ctx.fillStyle = `rgba(184,65,42,${Math.min(0.32, rel * 0.4)})`;
      ctx.fillRect(xS(x), yS(y), 9, 8);
    }

    // Fading trail of recent accepted points.
    for (let i = 0; i < trail.length; i++) {
      const a = 0.05 + 0.40 * (i / trail.length);
      ctx.fillStyle = `rgba(45,122,62,${a})`;
      ctx.beginPath(); ctx.arc(xS(trail[i].x), yS(trail[i].y), 2.4, 0, 2 * Math.PI); ctx.fill();
    }

    // Current step decomposition.
    if (last) {
      const x0 = last.accept ? last.prop.x - last.drift[0] - last.diff[0] : cur.x;
      const y0 = last.accept ? last.prop.y - last.drift[1] - last.diff[1] : cur.y;
      const px0 = xS(x0), py0 = yS(y0);
      const tipDx = xS(x0 + last.drift[0]), tipDy = yS(y0 + last.drift[1]);
      const pxp = xS(last.prop.x), pyp = yS(last.prop.y);
      // Drift arrow (solid green) from current point.
      arrow(px0, py0, tipDx, tipDy, C.accept, false);
      // Diffusion arrow (dashed blue) from the tip of the drift arrow.
      arrow(tipDx, tipDy, pxp, pyp, C.prop, true);
      // Proposal point / accept-reject marker.
      if (last.accept) {
        ctx.strokeStyle = C.accept; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(px0, py0); ctx.lineTo(pxp, pyp); ctx.stroke();
        ctx.fillStyle = C.accept;
        ctx.beginPath(); ctx.arc(pxp, pyp, 5.5, 0, 2 * Math.PI); ctx.fill();
      } else {
        ctx.strokeStyle = C.target; ctx.lineWidth = 2.4;
        const m = 5;
        ctx.beginPath();
        ctx.moveTo(pxp - m, pyp - m); ctx.lineTo(pxp + m, pyp + m);
        ctx.moveTo(pxp + m, pyp - m); ctx.lineTo(pxp - m, pyp + m);
        ctx.stroke();
      }
    }
    // Current chain point.
    ctx.fillStyle = C.accept;
    ctx.beginPath(); ctx.arc(xS(cur.x), yS(cur.y), 5.5, 0, 2 * Math.PI); ctx.fill();
    ctx.strokeStyle = C.axis; ctx.lineWidth = 1; ctx.stroke();

    // x-marginal histogram strip: the chain's empirical x-distribution against the
    // true marginal, which for this banana target is exactly N(0, 4).
    const hY = 330, hH = 58;
    ctx.strokeStyle = C.axis; ctx.lineWidth = 1; ctx.strokeRect(PX, hY, PW, hH);
    const binW = (bbox.xMax - bbox.xMin) / NB;
    const trueDens = (x) => Math.exp(-x * x / 8) / (2 * Math.sqrt(2 * Math.PI));
    const empDens = histBins.map((c) => (histTotal ? c / histTotal / binW : 0));
    const maxD = Math.max(trueDens(0), ...empDens, 1e-6) * 1.12;
    for (let b = 0; b < NB; b++) {
      const x0 = bbox.xMin + b * binW;
      const bh = (empDens[b] / maxD) * hH;
      ctx.fillStyle = corrected ? "rgba(45,122,62,0.5)" : "rgba(184,65,42,0.5)";
      ctx.fillRect(xS(x0), hY + hH - bh, Math.max(1, xS(x0 + binW) - xS(x0) - 1), bh);
    }
    ctx.strokeStyle = C.text; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= 120; i++) {
      const x = bbox.xMin + (bbox.xMax - bbox.xMin) * i / 120;
      const yy = hY + hH - (trueDens(x) / maxD) * hH;
      i ? ctx.lineTo(xS(x), yy) : ctx.moveTo(xS(x), yy);
    }
    ctx.stroke();
    ctx.fillStyle = C.textDim;
    ctx.font = "11px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("x-marginal: chain histogram vs true N(0, 4) (black curve)", PX, hY - 5);

    // Acceptance gauge (MALA) or a plain note (ULA, where every step is taken).
    const rate = total ? accepted / total : 0;
    const gx = PX, gy = 410, gw = PW, gh = 16;
    if (corrected) {
      ctx.fillStyle = "rgba(45,122,62,0.16)";
      ctx.fillRect(gx + 0.45 * gw, gy, (0.70 - 0.45) * gw, gh);
      ctx.strokeStyle = C.axis; ctx.lineWidth = 1;
      ctx.strokeRect(gx, gy, gw, gh);
      ctx.fillStyle = C.accept;
      ctx.fillRect(gx, gy, clamp(rate, 0, 1) * gw, gh);
      ctx.strokeStyle = C.text; ctx.lineWidth = 2;
      const tx = gx + 0.574 * gw;
      ctx.beginPath(); ctx.moveTo(tx, gy - 5); ctx.lineTo(tx, gy + gh + 5); ctx.stroke();
      ctx.fillStyle = C.text;
      ctx.font = "11px ui-sans-serif, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("optimal 0.574", tx, gy + gh + 16);
      ctx.textAlign = "left";
      ctx.fillStyle = C.textDim;
      ctx.fillText("acceptance rate", gx, gy - 7);
      const [vText, vColor] = verdict(rate);
      ctx.fillStyle = vColor;
      ctx.font = "12px ui-sans-serif, system-ui, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(total ? vText : "—", gx + gw, gy - 7);
      ctx.textAlign = "left";
    } else {
      ctx.fillStyle = C.textDim;
      ctx.font = "12px ui-sans-serif, system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("Unadjusted Langevin: no accept/reject, every step is taken.", gx, gy + 4);
      ctx.fillText("The Euler discretization is biased; the bias shows in the histogram above.", gx, gy + 22);
    }

    const empVar = histTotal ? histSumX2 / histTotal - (histSumX / histTotal) ** 2 : 0;
    const ratePct = total ? (100 * rate).toFixed(1) + "%" : "—";
    readout.innerHTML =
      `<div class="row"><span class="lbl">mode</span><span>${corrected ? "MALA (Metropolis-corrected)" : "unadjusted Langevin (ULA)"}</span></div>` +
      `<div class="row"><span class="lbl">step size ε</span><span>${(+epsIn.value).toFixed(2)}</span></div>` +
      (corrected
        ? `<div class="row"><span class="lbl">acceptance rate</span><span>${ratePct} (${accepted} / ${total})</span></div>`
        : `<div class="row"><span class="lbl">steps</span><span>${total} (all accepted)</span></div>`) +
      `<div class="row"><span class="lbl">x-marginal variance</span><span>${histTotal ? empVar.toFixed(2) : "—"} vs true 4.00</span></div>`;
  }

  function tick(t) {
    if (!running) { rafId = 0; return; }
    const interval = 1000 / Math.max(0.5, +speedIn.value);
    if (!lastTick || t - lastTick >= interval) { one(); lastTick = t; }
    rafId = requestAnimationFrame(tick);
  }
  if (runBtn) runBtn.addEventListener("click", () => {
    running = !running;
    runBtn.textContent = running ? "Pause" : "Run";
    if (running && !rafId) { lastTick = 0; rafId = requestAnimationFrame(tick); }
  });
  if (runBtn) runBtn.textContent = running ? "Pause" : "Run";
  if (speedIn && speedV) speedV.textContent = (+speedIn.value).toFixed(1);
  if (speedIn) speedIn.addEventListener("input", () => {
    speedV.textContent = (+speedIn.value).toFixed(1);
  });
  document.getElementById("fig-mala-step").addEventListener("click", one);
  document.getElementById("fig-mala-reset").addEventListener("click", reset);
  function updateModeButtons() {
    const cb = document.getElementById("fig-mala-corrected");
    const ub = document.getElementById("fig-mala-ula");
    if (cb) cb.classList.toggle("active", corrected);
    if (ub) ub.classList.toggle("active", !corrected);
  }
  const cBtn = document.getElementById("fig-mala-corrected");
  const uBtn = document.getElementById("fig-mala-ula");
  if (cBtn) cBtn.addEventListener("click", () => { corrected = true; updateModeButtons(); reset(); });
  if (uBtn) uBtn.addEventListener("click", () => { corrected = false; updateModeButtons(); reset(); });
  updateModeButtons();
  epsIn.addEventListener("input", draw);
  reset();
})();

// ─────────── Figure 3b: Particle genealogy ───────────
(function figGenealogy() {
  const canvas = document.getElementById("fig3genealogy");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const pressureIn = document.getElementById("fig3genealogy-resample");
  const pressureV = document.getElementById("fig3genealogy-resample-v");
  const readout = document.getElementById("fig3genealogy-readout");
  let lines = [];
  function rerun() {
    const pressure = +pressureIn.value;
    const n = 36, T = 18;
    let ancestors = Array.from({ length: n }, (_, i) => i);
    lines = Array.from({ length: n }, (_, i) => [[0, i, i]]);
    for (let t = 1; t <= T; t++) {
      const weights = ancestors.map((a, i) => Math.exp(-pressure * Math.abs(i - n * (0.5 + 0.25 * Math.sin(t * 0.55)))));
      const total = weights.reduce((a, b) => a + b, 0);
      const next = [];
      for (let i = 0; i < n; i++) {
        let u = Math.random() * total, j = 0;
        while (u > weights[j]) { u -= weights[j]; j++; }
        const a = ancestors[j]; next.push(a); lines[a].push([t, i, a]);
      }
      ancestors = next;
    }
    draw();
  }
  function draw() {
    pressureV.textContent = (+pressureIn.value).toFixed(2);
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
    const x0 = 42, y0 = 24, ww = 690, hh = 260;
    drawAxes(ctx, x0, y0, ww, hh, 6, 4);
    let alive = 0;
    lines.forEach((pts) => {
      if (pts.length < 2) return;
      const live = pts[pts.length - 1][0] === 18;
      if (live) alive++;
      ctx.strokeStyle = live ? C.particle : C.reject;
      ctx.globalAlpha = live ? 0.75 : 0.22;
      ctx.beginPath();
      pts.forEach(([t, row], i) => {
        const px = x0 + t / 18 * ww, py = y0 + row / 35 * hh;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
    readout.innerHTML = `<div class="row"><span class="lbl">surviving ancestors</span><span>${alive} of ${lines.length}</span></div><div class="row"><span class="lbl">sample impoverishment</span><span>resampling duplicates high-weight lineages and deletes the rest</span></div>`;
  }
  pressureIn.addEventListener("input", rerun);
  document.getElementById("fig3genealogy-rerun").addEventListener("click", rerun);
  rerun();
})();

// ─────────── Figure 1: Rejection vs Importance Sampling ───────────
(function fig1() {
  const canvas = document.getElementById("fig1");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);

  const targetIn = document.getElementById("fig1-target");
  const qFamilyIn = document.getElementById("fig1-qfamily");
  const muIn = document.getElementById("fig1-mu");
  const sqIn = document.getElementById("fig1-sq");
  const nuIn = document.getElementById("fig1-nu");
  const nIn = document.getElementById("fig1-n");
  const muV = document.getElementById("fig1-mu-v");
  const sqV = document.getElementById("fig1-sq-v");
  const nuV = document.getElementById("fig1-nu-v");
  const nV = document.getElementById("fig1-n-v");
  const resampleBtn = document.getElementById("fig1-resample");
  const readout = document.getElementById("fig1-readout");

  const presetButtons = {
    match: document.getElementById("fig1-preset-match"),
    narrow: document.getElementById("fig1-preset-narrow"),
    wide: document.getElementById("fig1-preset-wide"),
    heavy: document.getElementById("fig1-preset-heavy"),
    shifted: document.getElementById("fig1-preset-shifted"),
  };

  // ── Distribution helpers ──
  function gammaLn(z) {
    // Lanczos approximation
    const g = 7;
    const p = [
      0.99999999999980993, 676.5203681218851, -1259.1392167224028,
      771.32342877765313, -176.61502916214059, 12.507343278686905,
      -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
    ];
    if (z < 0.5) {
      return Math.log(Math.PI / Math.sin(Math.PI * z)) - gammaLn(1 - z);
    }
    z -= 1;
    let x = p[0];
    for (let i = 1; i < g + 2; i++) x += p[i] / (z + i);
    const t = z + g + 0.5;
    return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
  }
  function studentTPdf(x, nu, mu, sigma) {
    const z = (x - mu) / sigma;
    const c = gammaLn((nu + 1) / 2) - gammaLn(nu / 2)
      - 0.5 * Math.log(nu * Math.PI) - Math.log(sigma);
    return Math.exp(c) * Math.pow(1 + (z * z) / nu, -(nu + 1) / 2);
  }
  function chiSquaredSampleInt(nu) {
    let s = 0;
    for (let i = 0; i < nu; i++) {
      const z = gaussianSample(0, 1);
      s += z * z;
    }
    return s;
  }
  function studentTSample(nu, mu, sigma) {
    const z = gaussianSample(0, 1);
    const w = chiSquaredSampleInt(nu);
    return mu + sigma * z / Math.sqrt(w / nu);
  }
  function uniformPdf(x, mu, halfW) {
    return (x >= mu - halfW && x <= mu + halfW) ? 1 / (2 * halfW) : 0;
  }
  function uniformSample(mu, halfW) {
    return mu + (2 * Math.random() - 1) * halfW;
  }
  function laplacePdf(x, mu, b) {
    return Math.exp(-Math.abs(x - mu) / b) / (2 * b);
  }
  function laplaceSample(mu, b) {
    const u = Math.random() - 0.5;
    return mu - b * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
  }

  // σ in the slider is "scale". For each family we map to a parameter that gives
  // variance ≈ σ² (so the slider has comparable semantics across families).
  function proposalPdf(family, mu, sigma, nu, x) {
    if (family === "gaussian") return gaussianPdf(x, mu, sigma);
    if (family === "student") return studentTPdf(x, nu, mu, sigma);
    if (family === "uniform") return uniformPdf(x, mu, sigma * Math.sqrt(3));
    if (family === "laplace") return laplacePdf(x, mu, sigma / Math.sqrt(2));
    return 0;
  }
  function proposalSample(family, mu, sigma, nu) {
    if (family === "gaussian") return gaussianSample(mu, sigma);
    if (family === "student") return studentTSample(nu, mu, sigma);
    if (family === "uniform") return uniformSample(mu, sigma * Math.sqrt(3));
    if (family === "laplace") return laplaceSample(mu, sigma / Math.sqrt(2));
    return 0;
  }

  // ── Target presets ──
  const targets = {
    bimodal: {
      pdf: (x) => 0.4 * gaussianPdf(x, -2, 0.7) + 0.6 * gaussianPdf(x, 1.5, 1.0),
      label: "0.4·N(−2, 0.7) + 0.6·N(1.5, 1)",
    },
    unimodal: {
      pdf: (x) => gaussianPdf(x, 0, 1),
      label: "N(0, 1)",
    },
    narrow: {
      pdf: (x) => gaussianPdf(x, 0, 0.3),
      label: "N(0, 0.3)",
    },
    shifted: {
      pdf: (x) => gaussianPdf(x, 3, 0.6),
      label: "N(3, 0.6)",
    },
    heavyTail: {
      pdf: (x) => studentTPdf(x, 3, 0, 1),
      label: "t₃(0, 1)",
    },
  };

  const xMin = -7, xMax = 7;
  const N_GRID = 400;

  function getParams() {
    return {
      target: targetIn.value,
      family: qFamilyIn.value,
      mu: +muIn.value,
      sigma: +sqIn.value,
      nu: Math.max(1, Math.round(+nuIn.value)),
      N: +nIn.value,
    };
  }

  function findM(target, family, mu, sigma, nu) {
    let M = 0;
    for (let i = 0; i <= N_GRID; i++) {
      const x = xMin + (i / N_GRID) * (xMax - xMin);
      const q = proposalPdf(family, mu, sigma, nu, x);
      if (q < 1e-12) continue;
      const r = target.pdf(x) / q;
      if (r > M) M = r;
    }
    return M * 1.02;
  }

  let samples = [];
  let currentKey = "";
  function paramsKey(p) {
    return `${p.target}|${p.family}|${p.mu}|${p.sigma}|${p.nu}|${p.N}`;
  }
  function regenerate() {
    const p = getParams();
    samples = [];
    for (let i = 0; i < p.N; i++) {
      samples.push({
        x: proposalSample(p.family, p.mu, p.sigma, p.nu),
        u: Math.random(),
      });
    }
    currentKey = paramsKey(p);
  }
  function ensureSamples() {
    const p = getParams();
    if (paramsKey(p) !== currentKey || samples.length !== p.N) regenerate();
  }

  // ── Layout ──
  const padL = 36, padR = 12, gap = 24;
  const panelW = (w - padL - padR - gap) / 2;

  const topY0 = 14;
  const topH = 240;
  const topY1 = topY0 + topH;

  const essLabelY = 288;
  const essY0 = 298;
  const essBarH = 18;
  const essBarGap = 8;

  const empLabelY = 366;
  const empY0 = 382;
  const empH = 150;

  function drawTopPanel(x0, title, target, p, M, dMax, mode) {
    // yD does NOT clamp — callers that draw inside the panel must clip.
    const yD = (d) => topY0 + topH - (d / dMax) * topH * 0.88;
    const xS = (x) => x0 + ((x - xMin) / (xMax - xMin)) * panelW;

    ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
    for (let i = 0; i <= 7; i++) {
      const px = x0 + (i / 7) * panelW;
      ctx.beginPath(); ctx.moveTo(px, topY0); ctx.lineTo(px, topY1); ctx.stroke();
    }
    ctx.strokeStyle = C.axis; ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x0, topY0); ctx.lineTo(x0, topY1); ctx.lineTo(x0 + panelW, topY1);
    ctx.stroke();

    // Target fill + curve (target peak fits within dMax by construction)
    ctx.beginPath();
    for (let i = 0; i <= 200; i++) {
      const x = xMin + (i / 200) * (xMax - xMin);
      const px = xS(x), py = yD(target.pdf(x));
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.lineTo(xS(xMax), topY1);
    ctx.lineTo(xS(xMin), topY1);
    ctx.closePath();
    ctx.fillStyle = C.targetFill; ctx.fill();
    ctx.beginPath();
    for (let i = 0; i <= 200; i++) {
      const x = xMin + (i / 200) * (xMax - xMin);
      const px = xS(x), py = yD(target.pdf(x));
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = C.target; ctx.lineWidth = 1.8; ctx.stroke();

    // Clip proposal curve to panel rect so out-of-range portions disappear above the top
    // (instead of being flattened against the cap).
    ctx.save();
    ctx.beginPath();
    ctx.rect(x0, topY0, panelW, topH);
    ctx.clip();
    if (mode === "rej") {
      ctx.beginPath();
      for (let i = 0; i <= 200; i++) {
        const x = xMin + (i / 200) * (xMax - xMin);
        const py = yD(M * proposalPdf(p.family, p.mu, p.sigma, p.nu, x));
        const px = xS(x);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = C.prop; ctx.lineWidth = 1.5; ctx.stroke();
    } else {
      ctx.beginPath();
      for (let i = 0; i <= 200; i++) {
        const x = xMin + (i / 200) * (xMax - xMin);
        const py = yD(proposalPdf(p.family, p.mu, p.sigma, p.nu, x));
        const px = xS(x);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = C.prop; ctx.lineWidth = 1.3;
      ctx.setLineDash([3, 3]); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.restore();

    // Indicate off-scale regions: dashed line along the top edge between exit/entry crossings,
    // with a couple of ↑ markers so the reader sees the curve continues above the panel.
    const evalCurve = (x) => mode === "rej"
      ? M * proposalPdf(p.family, p.mu, p.sigma, p.nu, x)
      : proposalPdf(p.family, p.mu, p.sigma, p.nu, x);
    const NSTEP = 200;
    // Find contiguous off-scale segments in x.
    const segments = [];
    let segStart = null;
    for (let i = 0; i <= NSTEP; i++) {
      const x = xMin + (i / NSTEP) * (xMax - xMin);
      const above = evalCurve(x) > dMax;
      if (above && segStart === null) segStart = x;
      if (!above && segStart !== null) {
        segments.push([segStart, x]);
        segStart = null;
      }
    }
    if (segStart !== null) segments.push([segStart, xMax]);

    if (segments.length > 0) {
      ctx.save();
      ctx.strokeStyle = C.prop; ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      const yTop = topY0 + 2;
      for (const [a, b] of segments) {
        ctx.beginPath();
        ctx.moveTo(xS(a), yTop);
        ctx.lineTo(xS(b), yTop);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.restore();
      // ↑ markers near segment midpoints
      ctx.fillStyle = C.prop;
      ctx.font = "10px -apple-system, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "top";
      for (const [a, b] of segments) {
        const segLen = b - a;
        const nMarks = Math.max(1, Math.min(3, Math.round(segLen * (panelW / (xMax - xMin)) / 90)));
        for (let k = 0; k < nMarks; k++) {
          const cx = a + segLen * (k + 0.5) / nMarks;
          ctx.fillText("↑", xS(cx), topY0 - 10);
        }
      }
    }

    ctx.fillStyle = C.text;
    ctx.font = "600 12px -apple-system, sans-serif";
    ctx.textBaseline = "top"; ctx.textAlign = "left";
    ctx.fillText(title, x0 + 4, topY0 + 2);

    ctx.fillStyle = C.textDim; ctx.font = "10px -apple-system, sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    for (let v = -6; v <= 6; v += 2) {
      ctx.fillText(v.toString(), xS(v), topY1 + 3);
    }

    return { xS, yD };
  }

  function drawEssBar(x0, y0, barW, label, eff, N, color) {
    ctx.fillStyle = "#ece9e0";
    ctx.fillRect(x0, y0, barW, essBarH);
    const frac = Math.min(1, Math.max(0, eff / Math.max(1, N)));
    ctx.fillStyle = color;
    ctx.fillRect(x0, y0, barW * frac, essBarH);
    ctx.strokeStyle = C.axis; ctx.lineWidth = 1;
    ctx.strokeRect(x0 + 0.5, y0 + 0.5, barW - 1, essBarH - 1);

    ctx.font = "600 11px -apple-system, sans-serif";
    ctx.textAlign = "left"; ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff";
    if (frac > 0.25) ctx.fillText(label, x0 + 6, y0 + essBarH / 2);
    else { ctx.fillStyle = C.text; ctx.fillText(label, x0 + 6, y0 + essBarH / 2); }

    const pct = (100 * eff / Math.max(1, N)).toFixed(1);
    const stats = `${Math.round(eff)} / ${N}  (${pct}%)`;
    ctx.font = "11px -apple-system, sans-serif";
    ctx.textAlign = "right"; ctx.textBaseline = "middle";
    if (frac > 0.5) { ctx.fillStyle = "#fff"; ctx.fillText(stats, x0 + barW * frac - 6, y0 + essBarH / 2); }
    else { ctx.fillStyle = C.text; ctx.fillText(stats, x0 + barW - 6, y0 + essBarH / 2); }
  }

  function drawEmpStrip(x0, target, p, samples, M, mode) {
    const stripY1 = empY0 + empH;
    const xS = (x) => x0 + ((x - xMin) / (xMax - xMin)) * panelW;

    ctx.fillStyle = C.text;
    ctx.font = "600 11px -apple-system, sans-serif";
    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.fillText(mode === "rej" ? "Accepted samples vs target" : "Weighted samples vs target",
      x0 + 4, empLabelY);

    // Histogram
    const nBins = 32;
    const binW = (xMax - xMin) / nBins;
    const counts = new Array(nBins).fill(0);
    let totalCount = 0;

    if (mode === "rej") {
      for (const s of samples) {
        const q = proposalPdf(p.family, p.mu, p.sigma, p.nu, s.x);
        if (q < 1e-12) continue;
        if (!(s.u < target.pdf(s.x) / (M * q))) continue;
        if (s.x < xMin || s.x >= xMax) continue;
        counts[Math.floor((s.x - xMin) / binW)] += 1;
        totalCount += 1;
      }
    } else {
      let totalW = 0;
      const ws = new Array(samples.length);
      for (let i = 0; i < samples.length; i++) {
        const q = proposalPdf(p.family, p.mu, p.sigma, p.nu, samples[i].x);
        const ww = q < 1e-12 ? 0 : target.pdf(samples[i].x) / q;
        ws[i] = ww;
        totalW += ww;
      }
      if (totalW > 0) {
        for (let i = 0; i < samples.length; i++) {
          const x = samples[i].x;
          if (x < xMin || x >= xMax) continue;
          counts[Math.floor((x - xMin) / binW)] += ws[i] / totalW;
        }
      }
    }
    const densities = counts.map((c) => mode === "rej"
      ? (totalCount > 0 ? c / (totalCount * binW) : 0)
      : c / binW);

    let yMax = 0;
    for (let i = 0; i <= 200; i++) {
      const x = xMin + (i / 200) * (xMax - xMin);
      yMax = Math.max(yMax, target.pdf(x));
    }
    for (const d of densities) yMax = Math.max(yMax, d);
    yMax = Math.max(yMax * 1.15, 1e-3);

    const yD = (d) => stripY1 - (Math.min(d, yMax) / yMax) * (empH - 8);

    // Grid + axis
    ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
    for (let i = 0; i <= 7; i++) {
      const px = x0 + (i / 7) * panelW;
      ctx.beginPath(); ctx.moveTo(px, empY0 + 4); ctx.lineTo(px, stripY1); ctx.stroke();
    }
    ctx.strokeStyle = C.axis; ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x0, empY0 + 4); ctx.lineTo(x0, stripY1); ctx.lineTo(x0 + panelW, stripY1);
    ctx.stroke();

    const barFill = mode === "rej" ? "rgba(45,122,62,0.55)" : "rgba(107,69,146,0.55)";
    const barEdge = mode === "rej" ? "#2d7a3e" : "#6b4592";
    for (let b = 0; b < nBins; b++) {
      const x = xMin + b * binW;
      const px0 = xS(x), px1 = xS(x + binW);
      const py = yD(densities[b]);
      ctx.fillStyle = barFill;
      ctx.fillRect(px0, py, px1 - px0, stripY1 - py);
      ctx.strokeStyle = barEdge; ctx.lineWidth = 0.6;
      ctx.strokeRect(px0 + 0.5, py + 0.5, Math.max(0, px1 - px0 - 1), Math.max(0, stripY1 - py - 1));
    }

    // Target overlay
    ctx.beginPath();
    for (let i = 0; i <= 200; i++) {
      const x = xMin + (i / 200) * (xMax - xMin);
      const px = xS(x), py = yD(target.pdf(x));
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = C.target; ctx.lineWidth = 1.8; ctx.stroke();

    ctx.fillStyle = C.textDim; ctx.font = "10px -apple-system, sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    for (let v = -6; v <= 6; v += 2) {
      ctx.fillText(v.toString(), xS(v), stripY1 + 2);
    }

    if (mode === "rej" && totalCount === 0) {
      ctx.fillStyle = "#a04444";
      ctx.font = "italic 11px -apple-system, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("no accepted samples — increase σ_q or N",
        x0 + panelW / 2, empY0 + empH / 2);
    }
  }

  function draw() {
    const p = getParams();
    muV.textContent = p.mu.toFixed(1);
    sqV.textContent = p.sigma.toFixed(2);
    nuV.textContent = p.nu.toString();
    nV.textContent = p.N.toString();
    const nuRelevant = (p.target === "heavyTail") || (p.family === "student");
    nuIn.style.opacity = nuRelevant ? "1" : "0.4";

    ensureSamples();
    const target = targets[p.target];
    const M = findM(target, p.family, p.mu, p.sigma, p.nu);

    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, w, h);

    // y-scales: rejection panel caps envelope at 4× π peak so π stays visible
    let piMax = 0, mqMax = 0;
    for (let i = 0; i <= 200; i++) {
      const x = xMin + (i / 200) * (xMax - xMin);
      const pi = target.pdf(x);
      const mq = M * proposalPdf(p.family, p.mu, p.sigma, p.nu, x);
      if (pi > piMax) piMax = pi;
      if (mq > mqMax) mqMax = mq;
    }
    const dMaxRej = Math.min(mqMax * 1.08, piMax * 4);
    const dMaxIS = piMax * 1.4;

    const x0L = padL;
    const x0R = padL + panelW + gap;
    const rejGeom = drawTopPanel(x0L, "Rejection sampling", target, p, M, dMaxRej, "rej");
    const isGeom = drawTopPanel(x0R, "Importance sampling (weights as size)", target, p, M, dMaxIS, "is");

    // Rejection dots at (x, u·M·q(x))
    let accepted = 0;
    for (const s of samples) {
      const q = proposalPdf(p.family, p.mu, p.sigma, p.nu, s.x);
      if (q < 1e-12) continue;
      const accept = s.u < target.pdf(s.x) / (M * q);
      if (accept) accepted++;
      if (s.x < xMin || s.x > xMax) continue;
      const yVal = s.u * M * q;
      if (yVal > dMaxRej * 1.05) continue;
      const px = rejGeom.xS(s.x);
      const py = rejGeom.yD(yVal);
      ctx.fillStyle = accept ? "rgba(45,122,62,0.78)" : "rgba(160,160,160,0.55)";
      ctx.beginPath();
      ctx.arc(px, py, accept ? 2.6 : 1.8, 0, 2 * Math.PI);
      ctx.fill();
    }

    // IS weights
    const weights = new Array(samples.length);
    let totalW = 0;
    for (let i = 0; i < samples.length; i++) {
      const s = samples[i];
      const q = proposalPdf(p.family, p.mu, p.sigma, p.nu, s.x);
      const ww = q < 1e-12 ? 0 : target.pdf(s.x) / q;
      weights[i] = ww;
      totalW += ww;
    }
    const maxW = Math.max(...weights, 1e-9);
    for (let i = 0; i < samples.length; i++) {
      const s = samples[i];
      if (s.x < xMin || s.x > xMax) continue;
      const px = isGeom.xS(s.x);
      const py = topY1 - 8 - (i % 13) * 1.6;
      const wnorm = weights[i] / maxW;
      const r = 1.2 + 4.5 * Math.sqrt(wnorm);
      ctx.fillStyle = `rgba(107,69,146,${0.18 + 0.55 * wnorm})`;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, 2 * Math.PI);
      ctx.fill();
    }

    let ess = 0, maxNormW = 0;
    if (totalW > 0) {
      const norm = weights.map((wi) => wi / totalW);
      ess = 1 / norm.reduce((s, wi) => s + wi * wi, 0);
      maxNormW = Math.max(...norm);
    }
    const acceptRate = accepted / samples.length;

    // ESS bar section
    ctx.fillStyle = C.text;
    ctx.font = "600 11px -apple-system, sans-serif";
    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.fillText("Effective samples per N draws", padL, essLabelY);

    const fullBarW = w - padL - padR;
    drawEssBar(padL, essY0, fullBarW,
      `Rejection — accepted`, accepted, p.N, "rgba(45,122,62,0.85)");
    drawEssBar(padL, essY0 + essBarH + essBarGap, fullBarW,
      `Importance — ESS`, ess, p.N, "rgba(107,69,146,0.85)");

    // Empirical strips
    drawEmpStrip(x0L, target, p, samples, M, "rej");
    drawEmpStrip(x0R, target, p, samples, M, "is");

    // Scorecard readout
    const weightCV = ess > 0 ? Math.sqrt(p.N / ess - 1) : Infinity;
    const qLabel = p.family === "gaussian" ? `N(${p.mu.toFixed(1)}, ${p.sigma.toFixed(2)})`
      : p.family === "student" ? `t<sub>${p.nu}</sub>(${p.mu.toFixed(1)}, ${p.sigma.toFixed(2)})`
      : p.family === "uniform" ? `U[${(p.mu - p.sigma * Math.sqrt(3)).toFixed(2)}, ${(p.mu + p.sigma * Math.sqrt(3)).toFixed(2)}]`
      : `Laplace(${p.mu.toFixed(1)}, b=${(p.sigma / Math.sqrt(2)).toFixed(2)})`;

    const mDisplay = M > 1e3 ? M.toExponential(2) : M.toFixed(3);
    const theoryDisplay = M > 1e3 ? `≈ ${(100 / M).toExponential(1)}%` : `≈ ${(100 / M).toFixed(2)}%`;

    readout.innerHTML =
      `<div class="row"><span class="lbl">target / proposal</span><span>${target.label} &nbsp;vs&nbsp; ${qLabel}</span></div>` +
      `<div class="row"><span class="lbl">envelope constant M</span><span>${mDisplay} &nbsp; (theoretical accept ${theoryDisplay})</span></div>` +
      `<div class="row"><span class="lbl">rejection</span><span style="color:${C.accept};font-weight:600">${accepted} / ${p.N} accepted  (${(100 * acceptRate).toFixed(1)}%)</span></div>` +
      `<div class="row"><span class="lbl">importance sampling</span><span style="color:${C.particle};font-weight:600">ESS = ${ess.toFixed(0)} / ${p.N}  (${(100 * ess / p.N).toFixed(1)}%)</span></div>` +
      `<div class="row"><span class="lbl">IS weight diagnostics</span><span>max-weight share ${(100 * maxNormW).toFixed(1)}% &nbsp; · &nbsp; CV = ${isFinite(weightCV) ? weightCV.toFixed(2) : "∞"}</span></div>`;
  }

  // ── Presets ──
  // Each preset hits a distinct failure or success regime.
  const presets = {
    match:   { target: "unimodal",  family: "gaussian", mu: 0, sigma: 1.5, nu: 3 },
    narrow:  { target: "bimodal",   family: "gaussian", mu: 0, sigma: 0.6, nu: 3 },
    wide:    { target: "narrow",    family: "gaussian", mu: 0, sigma: 4.0, nu: 3 },
    heavy:   { target: "heavyTail", family: "student",  mu: 0, sigma: 1.5, nu: 30 },
    shifted: { target: "shifted",   family: "gaussian", mu: 0, sigma: 1.0, nu: 3 },
  };
  function clearPresetActive() {
    Object.values(presetButtons).forEach((b) => b && b.classList.remove("active"));
  }
  function applyPreset(key) {
    const opts = presets[key];
    targetIn.value = opts.target;
    qFamilyIn.value = opts.family;
    muIn.value = String(opts.mu);
    sqIn.value = String(opts.sigma);
    nuIn.value = String(opts.nu);
    clearPresetActive();
    presetButtons[key].classList.add("active");
    regenerate(); draw();
  }
  for (const key of Object.keys(presets)) {
    const btn = presetButtons[key];
    if (!btn) continue;
    btn.addEventListener("click", () => applyPreset(key));
  }

  function onUserChange() { clearPresetActive(); regenerate(); draw(); }
  targetIn.addEventListener("change", onUserChange);
  qFamilyIn.addEventListener("change", onUserChange);
  muIn.addEventListener("input", onUserChange);
  sqIn.addEventListener("input", onUserChange);
  nuIn.addEventListener("input", onUserChange);
  nIn.addEventListener("input", () => { regenerate(); draw(); });
  resampleBtn.addEventListener("click", () => { regenerate(); draw(); });

  regenerate(); draw();
})();

// ─────────── Figure 2: Metropolis-Hastings on a banana ───────────
(function fig2() {
  const canvas = document.getElementById("fig2");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);

  const stepIn = document.getElementById("fig2-step");
  const speedIn = document.getElementById("fig2-speed");
  const stepV = document.getElementById("fig2-step-v");
  const speedV = document.getElementById("fig2-speed-v");
  const runBtn = document.getElementById("fig2-runpause");
  const stepBtn = document.getElementById("fig2-step-btn");
  const resetBtn = document.getElementById("fig2-reset");
  const readout = document.getElementById("fig2-readout");

  // Banana target (Rosenbrock-like): π(x,y) ∝ exp(−0.5·((x²/4) + ((y − 0.3 x²+2)²)/0.5))
  // We'll write a log-density.
  function logPi(x, y) {
    const a = x * x / 4;
    const b = (y - 0.3 * x * x + 2) ** 2 / 0.5;
    return -0.5 * (a + b);
  }

  // Layout: left = contour + chain trace; right = histograms.
  const padL = 30, padR = 14, padT = 14, padB = 28;
  const plotW = (w - padL - padR) * 0.62;
  const histX = padL + plotW + 16;
  const histW = (w - padL - padR) - plotW - 16;
  const plotH = h - padT - padB;

  const xMin = -5, xMax = 5;
  const yMin = -5, yMax = 3;
  function xS(x) { return padL + ((x - xMin) / (xMax - xMin)) * plotW; }
  function yS(y) { return padT + plotH - ((y - yMin) / (yMax - yMin)) * plotH; }

  let chain = [];
  let cur = { x: 0, y: 0 };
  let accCount = 0, total = 0;
  let running = true;
  let rafId = null;
  let lastProposal = null;

  function resetChain() {
    chain = [];
    cur = { x: 0, y: 0 };
    chain.push({ ...cur });
    accCount = 0; total = 0;
    lastProposal = null;
  }

  function step() {
    const sigma = +stepIn.value;
    const from = { x: cur.x, y: cur.y };
    const xp = cur.x + gaussianSample(0, sigma);
    const yp = cur.y + gaussianSample(0, sigma);
    const lnA = logPi(xp, yp) - logPi(cur.x, cur.y);
    const accepted = Math.log(Math.random()) < lnA;
    if (accepted) {
      cur = { x: xp, y: yp };
      accCount++;
    }
    lastProposal = { from, to: { x: xp, y: yp }, accepted };
    total++;
    chain.push({ ...cur });
    if (chain.length > 5000) chain.shift();
  }

  // Pre-compute contour image once.
  let contourImg = null;
  function buildContour() {
    const off = document.createElement("canvas");
    off.width = Math.floor(plotW);
    off.height = Math.floor(plotH);
    const octx = off.getContext("2d");
    const img = octx.createImageData(off.width, off.height);
    let lmax = -Infinity, lmin = Infinity;
    const vals = new Float64Array(off.width * off.height);
    for (let j = 0; j < off.height; j++) {
      const y = yMin + ((off.height - 1 - j) / (off.height - 1)) * (yMax - yMin);
      for (let i = 0; i < off.width; i++) {
        const x = xMin + (i / (off.width - 1)) * (xMax - xMin);
        const v = logPi(x, y);
        vals[j * off.width + i] = v;
        if (v > lmax) lmax = v;
        if (v < lmin) lmin = v;
      }
    }
    // Map log-density to color (light → dark accent).
    for (let j = 0; j < off.height; j++) {
      for (let i = 0; i < off.width; i++) {
        const t = clamp((vals[j * off.width + i] - lmin) / (lmax - lmin), 0, 1);
        const rr = Math.round(255 - 70 * t);
        const gg = Math.round(248 - 175 * t);
        const bb = Math.round(238 - 195 * t);
        const idx = 4 * (j * off.width + i);
        img.data[idx] = rr;
        img.data[idx + 1] = gg;
        img.data[idx + 2] = bb;
        img.data[idx + 3] = 255;
      }
    }
    octx.putImageData(img, 0, 0);
    contourImg = off;
  }
  buildContour();

  function draw() {
    const sigma = +stepIn.value;
    stepV.textContent = sigma.toFixed(2);
    speedV.textContent = (+speedIn.value).toString();

    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);

    // Contour
    ctx.drawImage(contourImg, padL, padT, plotW, plotH);
    ctx.strokeStyle = C.axis; ctx.lineWidth = 1;
    ctx.strokeRect(padL, padT, plotW, plotH);

    // Chain trace — older steps fade out toward the burn-in tail.
    const start = Math.max(0, chain.length - 1500);
    const span = Math.max(1, chain.length - 1 - start);
    ctx.lineWidth = 1;
    for (let i = start + 1; i < chain.length; i++) {
      const a = chain[i - 1], b = chain[i];
      const t = (i - start) / span;
      ctx.strokeStyle = `rgba(31,74,140,${(0.06 + 0.5 * t).toFixed(3)})`;
      ctx.beginPath();
      ctx.moveTo(xS(a.x), yS(a.y));
      ctx.lineTo(xS(b.x), yS(b.y));
      ctx.stroke();
    }

    // Proposal overlay — shown while paused; use Step to advance one proposal.
    if (!running) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(padL, padT, plotW, plotH);
      ctx.clip();
      const sx = xS(cur.x), sy = yS(cur.y);
      const rx = sigma / (xMax - xMin) * plotW;
      const ry = sigma / (yMax - yMin) * plotH;
      ctx.beginPath();
      ctx.ellipse(sx, sy, rx, ry, 0, 0, 2 * Math.PI);
      ctx.fillStyle = C.propFill;
      ctx.fill();
      ctx.strokeStyle = C.textDim;
      ctx.setLineDash([2, 2]);
      ctx.stroke();
      ctx.setLineDash([]);
      if (lastProposal) {
        const col = lastProposal.accepted ? C.accept : C.textDim;
        const fx = xS(lastProposal.from.x), fy = yS(lastProposal.from.y);
        const tx = xS(lastProposal.to.x), ty = yS(lastProposal.to.y);
        ctx.strokeStyle = col;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.lineTo(tx, ty);
        ctx.stroke();
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(tx, ty, 4, 0, 2 * Math.PI);
        ctx.fill();
      }
      ctx.restore();
    }

    // Current state
    const px = xS(cur.x), py = yS(cur.y);
    ctx.fillStyle = "#000";
    ctx.beginPath(); ctx.arc(px, py, 4, 0, 2 * Math.PI); ctx.fill();
    window.__samplingFig2Current = { x: cur.x, y: cur.y };
    window.__samplingFig2NotifySurface?.();

    // Axis tick labels
    ctx.fillStyle = C.textDim; ctx.font = "10px -apple-system, sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    for (let v = -4; v <= 4; v += 2) ctx.fillText(v.toString(), xS(v), padT + plotH + 3);
    ctx.textAlign = "right"; ctx.textBaseline = "middle";
    for (let v = -4; v <= 2; v += 2) ctx.fillText(v.toString(), padL - 2, yS(v));

    // Marginal histograms on right side.
    // x-histogram on top (under header), y-histogram on bottom.
    const histH = (plotH - 12) / 2;
    function hist(samples, projectFn, vmin, vmax, x0, y0, hh, vertical, color) {
      const bins = 30;
      const counts = new Array(bins).fill(0);
      for (let i = Math.max(0, samples.length - 3000); i < samples.length; i++) {
        const v = projectFn(samples[i]);
        const b = clamp(Math.floor((v - vmin) / (vmax - vmin) * bins), 0, bins - 1);
        counts[b]++;
      }
      const cmax = Math.max(1, ...counts);
      ctx.strokeStyle = C.axis;
      ctx.strokeRect(x0, y0, histW, hh);
      for (let b = 0; b < bins; b++) {
        const frac = counts[b] / cmax;
        const bw = histW / bins;
        const x1 = x0 + b * bw;
        const bh = frac * (hh - 4);
        ctx.fillStyle = color;
        ctx.fillRect(x1, y0 + hh - bh, bw - 1, bh);
      }
      ctx.fillStyle = C.textDim; ctx.font = "10px -apple-system, sans-serif";
      ctx.textAlign = "left"; ctx.textBaseline = "top";
      ctx.fillText(vertical ? "y marginal" : "x marginal", x0 + 4, y0 + 2);
    }
    hist(chain, p => p.x, xMin, xMax, histX, padT, histH, false, "rgba(184,65,42,0.7)");
    hist(chain, p => p.y, yMin, yMax, histX, padT + histH + 12, histH, true, "rgba(184,65,42,0.7)");

    const accRate = total === 0 ? 0 : accCount / total;
    readout.innerHTML =
      `<div class="row"><span class="lbl">acceptance rate</span><span style="color:${accRate < 0.1 || accRate > 0.7 ? C.target : C.accept};font-weight:600">${(100 * accRate).toFixed(1)}%  &nbsp;(target ≈ 23% in high-d, 44% in 1-d)</span></div>` +
      `<div class="row"><span class="lbl">chain length</span><span>${chain.length}</span></div>` +
      `<div class="row"><span class="lbl">step size σ</span><span>${sigma.toFixed(2)}  ${sigma < 0.1 ? "  (very small — crawls)" : sigma > 1.5 ? "  (large — most proposals rejected)" : ""}</span></div>`;
  }

  function tick() {
    if (!running) { rafId = 0; return; }
    const sp = +speedIn.value;
    for (let i = 0; i < sp; i++) step();
    draw();
    rafId = requestAnimationFrame(tick);
  }

  runBtn.addEventListener("click", () => {
    running = !running;
    runBtn.textContent = running ? "Pause" : "Run";
    if (running && !rafId) rafId = requestAnimationFrame(tick);
  });
  resetBtn.addEventListener("click", () => { resetChain(); draw(); });
  stepBtn.addEventListener("click", () => {
    if (running) { running = false; runBtn.textContent = "Run"; }
    step();
    draw();
  });
  stepIn.addEventListener("input", () => { if (!running) draw(); });
  speedIn.addEventListener("input", () => { speedV.textContent = (+speedIn.value).toString(); });

  resetChain();
  draw();
  rafId = requestAnimationFrame(tick);
})();

// ─────────── Figure 2a: WebGL banana target surface ───────────
(function fig2surface() {
  const canvas = document.getElementById("fig2surface");
  if (!canvas) return;
  const readout = document.getElementById("fig2surface-readout");
  const gl = canvas.getContext("webgl", { antialias: true });
  if (!gl) {
    readout.innerHTML = `<div class="row"><span class="lbl">status</span><span>WebGL is not available in this browser.</span></div>`;
    return;
  }

  function logPi(x, y) {
    const a = x * x / 4;
    const b = (y - 0.3 * x * x + 2) ** 2 / 0.5;
    return -0.5 * (a + b);
  }
  function densityZ(x, y) {
    return 3.2 * Math.exp(logPi(x, y));
  }
  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
    return shader;
  }
  const program = gl.createProgram();
  gl.attachShader(program, compile(gl.VERTEX_SHADER, `
    attribute vec3 aPos;
    attribute vec3 aColor;
    uniform mat4 uMvp;
    varying vec3 vColor;
    void main() {
      gl_Position = uMvp * vec4(aPos, 1.0);
      gl_PointSize = 9.0;
      vColor = aColor;
    }
  `));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, `
    precision mediump float;
    varying vec3 vColor;
    void main() {
      gl_FragColor = vec4(vColor, 1.0);
    }
  `));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);
  const aPos = gl.getAttribLocation(program, "aPos");
  const aColor = gl.getAttribLocation(program, "aColor");
  const uMvp = gl.getUniformLocation(program, "uMvp");

  const vertices = [];
  const indices = [];
  const nx = 70, ny = 56;
  for (let j = 0; j < ny; j++) {
    const y = -5 + (8 * j) / (ny - 1);
    for (let i = 0; i < nx; i++) {
      const x = -5 + (10 * i) / (nx - 1);
      const z = densityZ(x, y);
      const t = clamp(z / 1.1, 0, 1);
      vertices.push(x / 4.2, z - 0.42, y / 4.2, 0.12 + 0.62 * t, 0.28 + 0.10 * t, 0.55 - 0.42 * t);
    }
  }
  for (let j = 0; j < ny - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
  const pointBuffer = gl.createBuffer();

  function mul(a, b) {
    const out = new Float32Array(16);
    for (let col = 0; col < 4; col++) {
      for (let row = 0; row < 4; row++) {
        out[col * 4 + row] =
          a[0 * 4 + row] * b[col * 4 + 0] +
          a[1 * 4 + row] * b[col * 4 + 1] +
          a[2 * 4 + row] * b[col * 4 + 2] +
          a[3 * 4 + row] * b[col * 4 + 3];
      }
    }
    return out;
  }
  function perspective(fovy, aspect, near, far) {
    const f = 1 / Math.tan(fovy / 2);
    const nf = 1 / (near - far);
    return new Float32Array([
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) * nf, -1,
      0, 0, 2 * far * near * nf, 0,
    ]);
  }
  function translate(z) {
    return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, -0.08, z, 1]);
  }
  function rotateX(a) {
    const c = Math.cos(a), s = Math.sin(a);
    return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]);
  }
  function rotateY(a) {
    const c = Math.cos(a), s = Math.sin(a);
    return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]);
  }

  // Default camera: looking down (pitch ≈ -55°) along world-y so the banana's
  // curvature in the (x,y) plane is visible. The previous default looked end-on
  // and made the banana read as a single peak with a tail.
  let yaw = 0, pitch = -0.95, dragging = false, dragX = 0, dragY = 0;

  // Event-driven redraws: the surface only repaints on camera drags, when the
  // Fig 4 MH state changes, or on window resize. scheduleRedraw coalesces
  // multiple triggers into one frame. (No unconditional rAF loop — that ran
  // 60 fps forever and was the page's main idle-memory cost.)
  let rafScheduled = false;
  function scheduleRedraw() {
    if (rafScheduled) return;
    rafScheduled = true;
    requestAnimationFrame(() => { rafScheduled = false; draw(); });
  }

  canvas.addEventListener("pointerdown", (event) => {
    dragging = true; dragX = event.clientX; dragY = event.clientY; canvas.setPointerCapture(event.pointerId);
    scheduleRedraw();
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    yaw += (event.clientX - dragX) * 0.01;
    pitch = clamp(pitch + (event.clientY - dragY) * 0.01, -1.35, -0.2);
    dragX = event.clientX; dragY = event.clientY;
    scheduleRedraw();
  });
  canvas.addEventListener("pointerup", () => { dragging = false; scheduleRedraw(); });
  canvas.addEventListener("pointercancel", () => { dragging = false; scheduleRedraw(); });
  window.addEventListener("resize", scheduleRedraw);
  window.__samplingFig2NotifySurface = scheduleRedraw;

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const cw = Math.max(1, Math.floor(rect.width * ratio));
    const ch = Math.max(1, Math.floor(rect.width * 360 / 780 * ratio));
    if (canvas.width === cw && canvas.height === ch) return;
    canvas.width = cw;
    canvas.height = ch;
    canvas.style.height = `${rect.width * 360 / 780}px`;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  function setPointers(buffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 24, 0);
    gl.enableVertexAttribArray(aColor);
    gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 24, 12);
  }
  function draw() {
    resize();
    const aspect = canvas.width / canvas.height;
    const mvp = mul(perspective(Math.PI / 4, aspect, 0.1, 12), mul(translate(-4.2), mul(rotateX(pitch), rotateY(yaw))));
    gl.uniformMatrix4fv(uMvp, false, mvp);
    gl.clearColor(1, 1, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    setPointers(vertexBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

    const cur = window.__samplingFig2Current || { x: 0, y: 0 };
    const point = new Float32Array([cur.x / 4.2, densityZ(cur.x, cur.y) - 0.34, cur.y / 4.2, 0, 0, 0]);
    gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, point, gl.DYNAMIC_DRAW);
    setPointers(pointBuffer);
    gl.disable(gl.CULL_FACE);
    gl.drawArrays(gl.POINTS, 0, 1);

    readout.innerHTML =
      `<div class="row"><span class="lbl">surface</span><span>height = unnormalized target density; drag to rotate</span></div>` +
      `<div class="row"><span class="lbl">current MH state</span><span>x=${cur.x.toFixed(2)}, y=${cur.y.toFixed(2)}</span></div>`;
  }
  scheduleRedraw();
})();

// ─────────── Figure 2e: MCMC variant lab ───────────
(function fig2variants() {
  const canvas = document.getElementById("fig2variants");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const vw = 780, vh = 520;
  const HISTORY_MAX = 80;
  const tabs = Array.from(document.querySelectorAll("#fig2variants-tabs button"));
  const knobIn = document.getElementById("fig2variants-knob");
  const speedIn = document.getElementById("fig2variants-speed");
  const knobV = document.getElementById("fig2variants-knob-v");
  const speedV = document.getElementById("fig2variants-speed-v");
  const runBtn = document.getElementById("fig2variants-runpause");
  const resetBtn = document.getElementById("fig2variants-reset");
  const readout = document.getElementById("fig2variants-readout");
  const diffLines = Array.from(document.querySelectorAll("#fig2variants-diff .variant-line")) as HTMLElement[];

  const variants = {
    metropolis: {
      title: "Metropolis",
      knob: "step radius",
      added: "Symmetric local proposal plus a reject/hold step.",
      panelTitle: "Rejection mechanism",
      panelSub: "uniform u vs α — the only knob",
    },
    mh: {
      title: "Metropolis-Hastings",
      knob: "right proposal bias",
      added: "Corrects an asymmetric proposal with the q ratio.",
      panelTitle: "Asymmetric q correction",
      panelSub: "forward / reverse proposal ratio",
    },
    gibbs: {
      title: "Gibbs",
      knob: "posterior correlation",
      added: "Draws one coordinate from its exact conditional distribution.",
      panelTitle: "Full conditional draw",
      panelSub: "axis cycle, always accepted",
    },
    rj: {
      title: "RJMCMC",
      knob: "birth proposal bias",
      added: "Reversible birth/death moves between model dimensions.",
      panelTitle: "Dimension jumps",
      panelSub: "birth / death across model order k",
    },
    hmc: {
      title: "Hamiltonian MC",
      knob: "trajectory length",
      added: "Gradient-guided long proposals plus an MH correction.",
      panelTitle: "Leapfrog energy",
      panelSub: "ΔH along the trajectory",
    },
  };

  let variant = "metropolis";
  let current = 2;
  let visits = [];
  let proposed = [];
  let acceptedTo = [];
  let accepted = 0;
  let total = 0;
  let axis = 0;
  let running = true;
  let rafId = null;
  let lastStepTime = 0;
  let moveProgress = 1;
  let last = null;
  let history = [];
  function pushHistory(entry) {
    history.push(entry);
    if (history.length > HISTORY_MAX) history.shift();
  }

  function discreteMass(n = 7, temp = 1) {
    const arr = Array.from({ length: n }, (_, i) => {
      const x = -2.4 + (4.8 * i) / (n - 1);
      const m = 0.52 * Math.exp(-0.5 * ((x + 1.15) / 0.55) ** 2) + 0.48 * Math.exp(-0.5 * ((x - 1.05) / 0.75) ** 2);
      return Math.pow(m, 1 / temp);
    });
    const z = arr.reduce((a, b) => a + b, 0);
    return arr.map(v => v / z);
  }
  function rjMass() {
    const birthPressure = +knobIn.value;
    const penalty = 0.42 + birthPressure * 0.58;
    const arr = [1, 2, 3, 4, 5].map(k => Math.exp(1.08 * k - penalty * k * k / 2));
    const z = arr.reduce((a, b) => a + b, 0);
    return arr.map(v => v / z);
  }
  function gibbsMass() {
    const rho = 0.18 + 0.76 * +knobIn.value;
    const vals = [-1, 0, 1];
    const scores = [];
    for (const y of vals) {
      for (const x of vals) {
        const q = (x * x - 2 * rho * x * y + y * y) / Math.max(0.04, 1 - rho * rho);
        scores.push(Math.exp(-0.72 * q));
      }
    }
    const z = scores.reduce((a, b) => a + b, 0);
    return scores.map(v => v / z);
  }
  function stateCount() {
    return variant === "rj" ? 5 : variant === "gibbs" || variant === "hmc" ? 9 : 7;
  }
  function masses() {
    if (variant === "rj") return rjMass();
    if (variant === "gibbs") return gibbsMass();
    if (variant === "hmc") return discreteMass(9, 0.85);
    return discreteMass(7, 1);
  }
  function reset() {
    const n = stateCount();
    current = variant === "gibbs" || variant === "hmc" ? 4 : variant === "rj" ? 1 : 2;
    visits = new Array(n).fill(0);
    proposed = new Array(n).fill(0);
    acceptedTo = new Array(n).fill(0);
    visits[current] = 1;
    accepted = 0;
    total = 0;
    axis = 0;
    last = null;
    history = [];
    moveProgress = 1;
  }
  function updateDiffLines() {
    diffLines.forEach((line) => {
      const methods = (line.dataset.variants ?? "").split(/\s+/);
      line.classList.toggle("active", methods.includes(variant));
    });
  }
  function chooseWeighted(options) {
    const sum = options.reduce((s, item) => s + item.weight, 0);
    let r = Math.random() * sum;
    for (const item of options) {
      r -= item.weight;
      if (r <= 0) return item.value;
    }
    return options[options.length - 1]?.value ?? current;
  }
  function mhProposal(i, rightProb) {
    if (i === 0) return 1;
    if (i === 6) return 5;
    return Math.random() < rightProb ? i + 1 : i - 1;
  }
  function qMh(from, to, rightProb) {
    if (from === 0) return to === 1 ? 1 : 0;
    if (from === 6) return to === 5 ? 1 : 0;
    if (to === from + 1) return rightProb;
    if (to === from - 1) return 1 - rightProb;
    return 0;
  }
  function step(showLabel = true) {
    const pi = masses();
    let next = current;
    let alpha = 1;
    let ok = true;
    let kind = "move";
    let path = [current];
    let extras: any = {};

    if (variant === "metropolis") {
      const radius = 1 + Math.round(+knobIn.value * 3);
      const choices = [];
      for (let d = -radius; d <= radius; d++) {
        if (d !== 0 && current + d >= 0 && current + d < 7) choices.push(current + d);
      }
      next = choices[Math.floor(Math.random() * choices.length)] ?? current;
      const piRatio = pi[next] / pi[current];
      alpha = Math.min(1, piRatio);
      const u = Math.random();
      ok = u < alpha;
      extras = { u, piRatio };
    } else if (variant === "mh") {
      const rightProb = 0.2 + 0.7 * +knobIn.value;
      next = mhProposal(current, rightProb);
      const qForward = qMh(current, next, rightProb);
      const qBack = qMh(next, current, rightProb);
      const num = pi[next] * qBack;
      const den = Math.max(1e-9, pi[current] * qForward);
      alpha = Math.min(1, num / den);
      const u = Math.random();
      ok = u < alpha;
      kind = next > current ? "right-biased proposal" : "left correction";
      extras = { u, qForward, qBack, num, den, rightProb };
    } else if (variant === "gibbs") {
      const rho = 0.18 + 0.76 * +knobIn.value;
      const x = current % 3 - 1;
      const y = Math.floor(current / 3) - 1;
      const vals = [-1, 0, 1];
      const usedAxis = axis;
      let condProbs = [];
      if (axis === 0) {
        const options = vals.map((vx, idx) => ({ value: (y + 1) * 3 + idx, weight: Math.exp(-0.5 * ((vx - rho * y) / Math.sqrt(1 - rho * rho)) ** 2) }));
        const wSum = options.reduce((s, o) => s + o.weight, 0);
        condProbs = options.map(o => o.weight / wSum);
        next = chooseWeighted(options);
        kind = "sample x | y";
      } else {
        const options = vals.map((vy, idx) => ({ value: idx * 3 + (x + 1), weight: Math.exp(-0.5 * ((vy - rho * x) / Math.sqrt(1 - rho * rho)) ** 2) }));
        const wSum = options.reduce((s, o) => s + o.weight, 0);
        condProbs = options.map(o => o.weight / wSum);
        next = chooseWeighted(options);
        kind = "sample y | x";
      }
      extras = { axisIdx: usedAxis, condProbs, fixedCoord: usedAxis === 0 ? y : x };
      axis = 1 - axis;
      alpha = 1;
      ok = true;
    } else if (variant === "rj") {
      const birthProb = 0.2 + 0.7 * +knobIn.value;
      let dir = Math.random() < birthProb ? 1 : -1;
      next = current + dir;
      if (next < 0 || next >= 5) {
        dir = -dir;
        next = current + dir;
      }
      const qForward = dir > 0 ? birthProb : 1 - birthProb;
      const qBack = dir > 0 ? 1 - birthProb : birthProb;
      const jacobian = dir > 0 ? 1.12 : 1 / 1.12;
      const num = pi[next] * qBack * jacobian;
      const den = Math.max(1e-9, pi[current] * qForward);
      alpha = Math.min(1, num / den);
      const u = Math.random();
      ok = u < alpha;
      kind = dir > 0 ? "birth move" : "death move";
      extras = { u, dir, jacobian, qForward, qBack, num, den };
    } else if (variant === "hmc") {
      const trajectory = 1 + Math.round(+knobIn.value * 5);
      let p = current;
      const energyTraj = [-Math.log(Math.max(1e-9, pi[p]))];
      for (let s = 0; s < trajectory; s++) {
        const left = pi[Math.max(0, p - 1)];
        const right = pi[Math.min(8, p + 1)];
        const grad = right - left;
        const drift = grad >= 0 ? 1 : -1;
        const noise = Math.random() < 0.22 ? -drift : drift;
        p = clamp(p + noise, 0, 8);
        path.push(p);
        energyTraj.push(-Math.log(Math.max(1e-9, pi[p])));
      }
      next = p;
      const dH = energyTraj[energyTraj.length - 1] - energyTraj[0];
      alpha = Math.min(1, Math.exp(-dH));
      const u = Math.random();
      ok = u < alpha;
      kind = "leapfrog path";
      extras = { u, energyTraj, dH };
    }

    if (showLabel) last = { from: current, to: next, alpha, ok, kind, path, ...extras };

    if (next >= 0 && next < proposed.length) proposed[next]++;
    if (ok && next !== current && next >= 0 && next < acceptedTo.length) acceptedTo[next]++;

    let cellColor = C.reject;
    if (variant === "metropolis") cellColor = ok ? C.accept : C.reject;
    else if (variant === "mh") cellColor = ok ? (next > current ? C.accept : C.prop) : C.reject;
    else if (variant === "gibbs") cellColor = extras.axisIdx === 0 ? C.prop : C.particle;
    else if (variant === "rj") cellColor = ok ? (extras.dir > 0 ? "#2d7a3e" : "#b8412a") : C.reject;
    else if (variant === "hmc") cellColor = ok ? C.prop : C.reject;
    pushHistory({ color: cellColor, ok });

    if (ok) {
      current = next;
      accepted++;
    }
    visits[current]++;
    total++;
    moveProgress = 0;
  }
  function layout() {
    if (variant === "gibbs") {
      const left = 78, top = 96, gap = 58;
      return Array.from({ length: 9 }, (_, i) => ({ x: left + (i % 3) * gap, y: top + Math.floor(i / 3) * gap, label: `${i % 3 - 1},${Math.floor(i / 3) - 1}` }));
    }
    const n = stateCount();
    const left = variant === "hmc" ? 46 : 58;
    const right = variant === "hmc" ? 388 : 352;
    return Array.from({ length: n }, (_, i) => ({
      x: left + (i / Math.max(1, n - 1)) * (right - left),
      y: 145 + 20 * Math.sin(i * 0.9),
      label: variant === "rj" ? `k=${i + 1}` : String(i - Math.floor(n / 2)),
    }));
  }
  function stateLabel(idx) {
    if (variant === "rj") return `k=${idx + 1}`;
    if (variant === "gibbs") return `(${idx % 3 - 1},${Math.floor(idx / 3) - 1})`;
    return String(idx - Math.floor(stateCount() / 2));
  }
  function arrow(x1, y1, x2, y2, color, width = 2, alpha = 1, dashed = false) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;
    if (dashed) ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);
    const a = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 7 * Math.cos(a - 0.45), y2 - 7 * Math.sin(a - 0.45));
    ctx.lineTo(x2 - 7 * Math.cos(a + 0.45), y2 - 7 * Math.sin(a + 0.45));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  function wrapText(text, x, y, maxW, lineH) {
    const words = text.split(" ");
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, x, y);
        y += lineH;
        line = word;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, x, y);
    return y + lineH;
  }

  // Curved-edge convention shared with chord-progressions.astro (curvedEdgePath).
  // Both pages use a quadratic Bézier with control point perpendicular to the chord,
  // endpoints trimmed to node radius, and width/opacity encoding transition weight.
  // Markov-chain renderer helpers live at module scope so Figure 8 can share them.
  // See the block before fig0; signatures are (ctx, ...) for drawing functions.
  function curvedEdge(ax, ay, bx, by, rA, rB, color, opts) { return drawCurvedEdge(ctx, ax, ay, bx, by, rA, rB, color, opts); }
  function selfLoop(x, y, r, color, opts) { return drawSelfLoop(ctx, x, y, r, color, opts); }
  function nodeRadius(piVal) { return 8 + 24 * Math.sqrt(Math.max(0, piVal)); }
  function drawNode(node, i, pi, isCurrent, halo) {
    const r = nodeRadius(pi[i]);
    if (halo > 0 && isCurrent) {
      ctx.save();
      ctx.globalAlpha = 0.55 * halo;
      ctx.fillStyle = C.accept;
      ctx.beginPath();
      ctx.arc(node.x, node.y, r + 6 + 8 * (1 - halo), 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = isCurrent ? C.target : "#fff";
    ctx.strokeStyle = isCurrent ? C.target : C.axis;
    ctx.lineWidth = isCurrent ? 2.4 : 1.1;
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = isCurrent ? "#fff" : C.text;
    ctx.font = "700 11px -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(node.label, node.x, node.y);
  }
  function panelFrame(title, subtitle) {
    const x = 450, y = 60, pw = vw - x - 25, ph = 340;
    ctx.fillStyle = "rgba(245,242,235,0.55)";
    ctx.strokeStyle = C.grid;
    ctx.lineWidth = 1;
    ctx.fillRect(x, y, pw, ph);
    ctx.strokeRect(x, y, pw, ph);
    ctx.fillStyle = C.text;
    ctx.font = "700 13px -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(title, x + 14, y + 12);
    if (subtitle) {
      ctx.fillStyle = C.textDim;
      ctx.font = "11px -apple-system, sans-serif";
      ctx.fillText(subtitle, x + 14, y + 30);
    }
    return { x: x + 14, y: y + 50, w: pw - 28, h: ph - 64 };
  }
  function barHorizontal(x, y, bw, frac, color, fillBg) {
    ctx.fillStyle = fillBg || "rgba(0,0,0,0.04)";
    ctx.fillRect(x, y, bw, 14);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, bw * clamp(frac, 0, 1), 14);
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 0.5;
    ctx.strokeRect(x, y, bw, 14);
  }
  function decisionBar(x, y, bw, ok, label) {
    ctx.fillStyle = ok ? C.accept : C.reject;
    ctx.fillRect(x, y, bw, 32);
    ctx.fillStyle = ok ? "#fff" : "#3a3a3a";
    ctx.font = "700 12px -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x + bw / 2, y + 16);
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
  }
  function placeholder(rect, msg) {
    ctx.fillStyle = C.textDim;
    ctx.font = "11px -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(msg, rect.x, rect.y);
  }
  function drawMechanismMetropolis(rect) {
    if (!last) return placeholder(rect, "(awaiting first proposal)");
    const { x, y, w: pw } = rect;
    const ratio = last.piRatio ?? 0;
    const u = last.u ?? 0;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = C.target;
    ctx.font = "600 11px -apple-system, sans-serif";
    ctx.fillText("π(new) / π(old)", x, y);
    ctx.fillStyle = C.text;
    ctx.font = "12px -apple-system, sans-serif";
    ctx.fillText(ratio.toFixed(2), x + 130, y);
    barHorizontal(x, y + 18, pw, Math.min(1, ratio), C.target, "rgba(184,65,42,0.08)");
    if (ratio > 1) {
      ctx.fillStyle = C.target;
      ctx.font = "10px -apple-system, sans-serif";
      ctx.fillText("uphill: α capped at 1", x, y + 36);
    }
    ctx.fillStyle = C.prop;
    ctx.font = "600 11px -apple-system, sans-serif";
    ctx.fillText("u ~ U[0,1]", x, y + 60);
    ctx.fillStyle = C.text;
    ctx.font = "12px -apple-system, sans-serif";
    ctx.fillText(u.toFixed(3), x + 130, y + 60);
    barHorizontal(x, y + 78, pw, 1, "rgba(31,74,140,0.05)", "rgba(31,74,140,0.04)");
    const tickX = x + u * pw;
    ctx.strokeStyle = C.prop;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tickX, y + 74);
    ctx.lineTo(tickX, y + 98);
    ctx.stroke();
    const alphaX = x + Math.min(1, ratio) * pw;
    ctx.strokeStyle = C.target;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(alphaX, y + 74);
    ctx.lineTo(alphaX, y + 102);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = C.target;
    ctx.font = "10px -apple-system, sans-serif";
    ctx.fillText("α", alphaX - 4, y + 104);
    decisionBar(x, y + 134, pw, last.ok, last.ok ? "u < α  →  ACCEPT" : "u ≥ α  →  REJECT (self-loop)");
    const accRate = total ? accepted / total : 0;
    ctx.fillStyle = C.textDim;
    ctx.font = "11px -apple-system, sans-serif";
    ctx.fillText(`overall acceptance: ${(100 * accRate).toFixed(1)}%`, x, y + 184);
    barHorizontal(x, y + 200, pw, accRate, C.accept, "rgba(45,122,62,0.08)");
    ctx.fillStyle = C.textDim;
    ctx.font = "10px -apple-system, sans-serif";
    wrapText("Symmetric q cancels; only the π ratio decides.", x, y + 226, pw, 13);
  }
  function drawMechanismMH(rect) {
    if (!last) return placeholder(rect, "(awaiting first proposal)");
    const { x, y, w: pw } = rect;
    const { qForward = 0, qBack = 0, num = 0, den = 1, u = 0 } = last;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = C.prop;
    ctx.font = "600 11px -apple-system, sans-serif";
    ctx.fillText("q(new | old)", x, y);
    ctx.fillStyle = C.text;
    ctx.font = "12px -apple-system, sans-serif";
    ctx.fillText(qForward.toFixed(2), x + 130, y);
    barHorizontal(x, y + 18, pw, qForward, C.prop, "rgba(31,74,140,0.06)");
    ctx.fillStyle = C.prop;
    ctx.font = "600 11px -apple-system, sans-serif";
    ctx.fillText("q(old | new)", x, y + 42);
    ctx.fillStyle = C.text;
    ctx.font = "12px -apple-system, sans-serif";
    ctx.fillText(qBack.toFixed(2), x + 130, y + 42);
    barHorizontal(x, y + 60, pw, qBack, C.prop, "rgba(31,74,140,0.06)");
    const maxND = Math.max(num, den, 1e-9);
    ctx.fillStyle = C.target;
    ctx.font = "600 11px -apple-system, sans-serif";
    ctx.fillText("π(new)·q(old|new)", x, y + 96);
    ctx.fillStyle = C.text;
    ctx.font = "12px -apple-system, sans-serif";
    ctx.fillText(num.toFixed(3), x + 150, y + 96);
    barHorizontal(x, y + 114, pw, num / maxND, C.target, "rgba(184,65,42,0.08)");
    ctx.fillStyle = C.textDim;
    ctx.font = "600 11px -apple-system, sans-serif";
    ctx.fillText("π(old)·q(new|old)", x, y + 138);
    ctx.fillStyle = C.text;
    ctx.font = "12px -apple-system, sans-serif";
    ctx.fillText(den.toFixed(3), x + 150, y + 138);
    barHorizontal(x, y + 156, pw, den / maxND, C.textDim, "rgba(90,101,119,0.08)");
    decisionBar(x, y + 186, pw, last.ok, `α = min(1, ${(num / Math.max(1e-9, den)).toFixed(2)}) → ${last.ok ? "ACCEPT" : "REJECT"}`);
    ctx.fillStyle = C.textDim;
    ctx.font = "10px -apple-system, sans-serif";
    wrapText("Without q correction the chain biases toward the proposal, not π.", x, y + 232, pw, 13);
  }
  function drawMechanismGibbs(rect) {
    if (!last) return placeholder(rect, "(awaiting first conditional)");
    const { x, y, w: pw } = rect;
    const usedAxis = last.axisIdx ?? 0;
    const condProbs = last.condProbs ?? [0, 0, 0];
    const fixedCoord = last.fixedCoord ?? 0;
    const axisName = usedAxis === 0 ? "x" : "y";
    const fixedName = usedAxis === 0 ? "y" : "x";
    ctx.fillStyle = C.text;
    ctx.font = "600 12px -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(`drew  ${axisName} | ${fixedName}=${fixedCoord}`, x, y);

    const vals = [-1, 0, 1];
    const barW = (pw - 40) / 3 - 6;
    const baseY = y + 130;
    vals.forEach((v, i) => {
      const bx = x + 20 + i * (barW + 6);
      const bh = condProbs[i] * 80;
      const pickIdx = usedAxis === 0 ? (last.to % 3) : Math.floor(last.to / 3);
      const isPicked = pickIdx === i;
      ctx.fillStyle = isPicked ? C.particle : "rgba(107,69,146,0.35)";
      ctx.fillRect(bx, baseY - bh, barW, bh);
      ctx.fillStyle = C.text;
      ctx.font = "600 10px -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(condProbs[i].toFixed(2), bx + barW / 2, baseY - bh - 14);
      ctx.font = "10px -apple-system, sans-serif";
      ctx.fillStyle = C.textDim;
      ctx.fillText(`${axisName}=${v}`, bx + barW / 2, baseY + 4);
    });
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 14, baseY);
    ctx.lineTo(x + pw - 14, baseY);
    ctx.stroke();
    ctx.fillStyle = C.textDim;
    ctx.font = "10px -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`p(${axisName} | ${fixedName}=${fixedCoord})`, x, y + 26);

    ctx.fillStyle = C.text;
    ctx.font = "600 11px -apple-system, sans-serif";
    ctx.fillText("axis cycle:", x, y + 162);
    ["x", "y"].forEach((a, i) => {
      const cx = x + 90 + i * 56;
      const isCurr = i === usedAxis;
      ctx.fillStyle = isCurr ? C.accept : "rgba(0,0,0,0.04)";
      ctx.fillRect(cx, y + 158, 42, 22);
      ctx.strokeStyle = C.axis;
      ctx.strokeRect(cx, y + 158, 42, 22);
      ctx.fillStyle = isCurr ? "#fff" : C.text;
      ctx.font = "700 11px -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`step ${a}`, cx + 21, y + 169);
    });
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    decisionBar(x, y + 198, pw, true, "α = 1   full conditional, always accepted");
    ctx.fillStyle = C.textDim;
    ctx.font = "10px -apple-system, sans-serif";
    wrapText("No reject step. Strong correlation makes axis moves short.", x, y + 244, pw, 13);
  }
  function drawMechanismRJ(rect) {
    if (!last) return placeholder(rect, "(awaiting first jump)");
    const { x, y, w: pw } = rect;
    const pi = masses();
    ctx.fillStyle = C.text;
    ctx.font = "600 11px -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("posterior model mass", x, y);

    const ladderH = 118;
    const ladderTop = y + 22;
    const rowH = ladderH / 5;
    const ladderW = pw - 56;
    [4, 3, 2, 1, 0].forEach((k, row) => {
      const ry = ladderTop + row * rowH;
      if (k === current) {
        ctx.fillStyle = "rgba(45,122,62,0.14)";
        ctx.fillRect(x, ry, ladderW + 50, rowH - 2);
      }
      ctx.fillStyle = k === current ? C.accept : C.target;
      ctx.fillRect(x + 30, ry + 3, (ladderW - 38) * pi[k], rowH - 8);
      ctx.fillStyle = C.text;
      ctx.font = "600 11px -apple-system, sans-serif";
      ctx.textBaseline = "middle";
      ctx.fillText(`k=${k + 1}`, x, ry + rowH / 2);
      ctx.font = "10px -apple-system, sans-serif";
      ctx.fillStyle = C.textDim;
      ctx.fillText(pi[k].toFixed(2), x + ladderW - 26, ry + rowH / 2);
    });
    ctx.textBaseline = "top";
    if (last.dir !== undefined && last.from !== last.to) {
      const fromRow = 4 - last.from;
      const toRow = 4 - last.to;
      const ax = x + ladderW + 16;
      const fromY = ladderTop + fromRow * rowH + rowH / 2;
      const toY = ladderTop + toRow * rowH + rowH / 2;
      const color = last.dir > 0 ? "#2d7a3e" : "#b8412a";
      ctx.globalAlpha = last.ok ? 1 : 0.4;
      arrow(ax, fromY, ax, toY, color, 2.6, 1);
      ctx.fillStyle = color;
      ctx.font = "700 10px -apple-system, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(last.dir > 0 ? "birth" : "death", ax + 6, (fromY + toY) / 2 - 6);
      ctx.globalAlpha = 1;
    }

    const yF = y + 150;
    ctx.fillStyle = C.text;
    ctx.font = "600 11px -apple-system, sans-serif";
    ctx.fillText("acceptance factors", x, yF);
    const piRatio = pi[last.to] / Math.max(1e-9, pi[last.from]);
    const qRatio = (last.qBack ?? 0) / Math.max(1e-9, last.qForward ?? 1);
    const jac = last.jacobian ?? 1;
    const rows = [
      ["π ratio", piRatio.toFixed(2), C.target],
      ["q ratio", qRatio.toFixed(2), C.prop],
      ["|J| (dim match)", jac.toFixed(2), "#b8412a"],
    ];
    rows.forEach(([lab, val, color], i) => {
      const fy = yF + 22 + i * 18;
      ctx.fillStyle = color;
      ctx.font = "600 10px -apple-system, sans-serif";
      ctx.fillText(lab, x, fy);
      ctx.fillStyle = C.text;
      ctx.font = "11px -apple-system, sans-serif";
      ctx.fillText(val, x + 100, fy);
    });
    decisionBar(x, y + 236, pw, last.ok, `α = ${last.alpha.toFixed(2)} → ${last.ok ? (last.dir > 0 ? "BIRTH" : "DEATH") + " accepted" : "REJECT"}`);
  }
  function drawMechanismHMC(rect) {
    if (!last) return placeholder(rect, "(awaiting first leapfrog)");
    const { x, y, w: pw } = rect;
    const energyTraj = last.energyTraj ?? [0];
    const dH = last.dH ?? 0;
    ctx.fillStyle = C.text;
    ctx.font = "600 11px -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("H(q,p) along leapfrog", x, y);

    const plotX = x, plotY = y + 22, plotW = pw, plotH = 110;
    ctx.fillStyle = "rgba(0,0,0,0.03)";
    ctx.fillRect(plotX, plotY, plotW, plotH);
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 1;
    ctx.strokeRect(plotX, plotY, plotW, plotH);
    const minE = Math.min(...energyTraj);
    const maxE = Math.max(...energyTraj);
    const range = Math.max(0.001, maxE - minE);
    const px = (i) => plotX + 8 + (energyTraj.length === 1 ? plotW / 2 - 8 : (plotW - 16) * i / (energyTraj.length - 1));
    const py = (e) => plotY + plotH - 8 - (plotH - 16) * (e - minE) / range;
    ctx.strokeStyle = C.prop;
    ctx.lineWidth = 2;
    ctx.beginPath();
    energyTraj.forEach((e, i) => {
      if (i === 0) ctx.moveTo(px(i), py(e)); else ctx.lineTo(px(i), py(e));
    });
    ctx.stroke();
    ctx.fillStyle = C.text;
    ctx.beginPath();
    ctx.arc(px(0), py(energyTraj[0]), 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = last.ok ? C.accept : C.target;
    ctx.beginPath();
    ctx.arc(px(energyTraj.length - 1), py(energyTraj[energyTraj.length - 1]), 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = C.textDim;
    ctx.font = "10px -apple-system, sans-serif";
    ctx.fillText(`H₀ = ${energyTraj[0].toFixed(2)}`, plotX + 4, plotY + plotH + 4);
    ctx.textAlign = "right";
    ctx.fillText(`H_L = ${energyTraj[energyTraj.length - 1].toFixed(2)}`, plotX + plotW - 4, plotY + plotH + 4);
    ctx.textAlign = "left";

    const yD = y + 162;
    ctx.fillStyle = C.text;
    ctx.font = "600 11px -apple-system, sans-serif";
    ctx.fillText(`ΔH = ${dH.toFixed(2)}`, x, yD);
    ctx.fillStyle = C.textDim;
    ctx.font = "10px -apple-system, sans-serif";
    ctx.fillText(`α = min(1, exp(-ΔH)) = ${last.alpha.toFixed(2)}`, x, yD + 16);
    ctx.fillText(`u = ${(last.u ?? 0).toFixed(3)}`, x, yD + 32);
    decisionBar(x, y + 222, pw, last.ok, last.ok ? "endpoint ACCEPTED" : "endpoint REJECTED");
    ctx.fillStyle = C.textDim;
    ctx.font = "10px -apple-system, sans-serif";
    wrapText("Reversible leapfrog conserves H in the limit; discrete error is what rejects.", x, y + 264, pw, 13);
  }
  function drawMechanism() {
    const info = variants[variant];
    const rect = panelFrame(info.panelTitle, info.panelSub);
    if (variant === "metropolis") drawMechanismMetropolis(rect);
    else if (variant === "mh") drawMechanismMH(rect);
    else if (variant === "gibbs") drawMechanismGibbs(rect);
    else if (variant === "rj") drawMechanismRJ(rect);
    else if (variant === "hmc") drawMechanismHMC(rect);
  }
  function drawTraceStrip() {
    const tx = 30, ty = 416, tw = vw - 60, th = 58;
    ctx.fillStyle = C.text;
    ctx.font = "600 11px -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(`Last ${HISTORY_MAX} steps`, tx, ty - 16);
    const legend = variant === "gibbs"
      ? "■ step x   ■ step y"
      : variant === "rj"
      ? "■ birth   ■ death   ✕ rejected"
      : "■ accepted   ✕ rejected / self-loop";
    ctx.fillStyle = C.textDim;
    ctx.font = "10px -apple-system, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(legend, tx + tw, ty - 14);
    ctx.textAlign = "left";

    ctx.fillStyle = "rgba(0,0,0,0.03)";
    ctx.fillRect(tx, ty, tw, th);
    ctx.strokeStyle = C.grid;
    ctx.lineWidth = 1;
    ctx.strokeRect(tx, ty, tw, th);

    const cellW = tw / HISTORY_MAX;
    history.forEach((cell, i) => {
      const cx = tx + i * cellW;
      ctx.globalAlpha = cell.ok ? 0.92 : 0.36;
      ctx.fillStyle = cell.color;
      ctx.fillRect(cx + 0.5, ty + 4, Math.max(1, cellW - 1), th - 8);
      ctx.globalAlpha = 1;
      if (!cell.ok) {
        ctx.strokeStyle = "rgba(0,0,0,0.42)";
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(cx + 1.5, ty + 6);
        ctx.lineTo(cx + cellW - 1, ty + th - 6);
        ctx.moveTo(cx + cellW - 1, ty + 6);
        ctx.lineTo(cx + 1.5, ty + th - 6);
        ctx.stroke();
      }
    });
    ctx.fillStyle = C.textDim;
    ctx.font = "10px -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("older →", tx, ty + th + 4);
    ctx.textAlign = "right";
    ctx.fillText("→ newest", tx + tw, ty + th + 4);
  }
  function draw() {
    const info = variants[variant];
    updateDiffLines();
    const knob = +knobIn.value;
    knobV.textContent = variant === "metropolis" ? String(1 + Math.round(knob * 3)) : knob.toFixed(2);
    speedV.textContent = (+speedIn.value).toFixed(1);

    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.scale(w / vw, h / vh);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, vw, vh);
    const pi = masses();
    const visitSum = visits.reduce((a, b) => a + b, 0);
    const emp = visits.map(v => v / Math.max(1, visitSum));
    const accRate = total ? accepted / total : 0;
    const nodes = layout();

    ctx.fillStyle = C.text;
    ctx.font = "700 15px -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(info.title, 30, 18);
    ctx.fillStyle = C.textDim;
    ctx.font = "11px -apple-system, sans-serif";
    ctx.fillText("edge width ∝ q · curve direction = forward/back · ↑ bars = π,π̂ · ↓ bars = proposed,accepted", 30, 38);

    drawChainSkeleton(nodes, pi);
    drawActiveTransition(nodes, pi);
    nodes.forEach((node, i) => drawNode(node, i, pi, i === current, i === current ? Math.max(0, 1 - moveProgress) : 0));
    if (last) {
      ctx.fillStyle = last.ok ? C.accept : C.target;
      ctx.font = "12px -apple-system, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`${last.kind}: ${stateLabel(last.from)} → ${stateLabel(last.to)}, α=${last.alpha.toFixed(2)} ${last.ok ? "accepted" : "rejected"}`, 30, 360);
    }

    drawDualHistogram(nodes, pi, emp);

    drawMechanism();
    drawTraceStrip();
    ctx.restore();

    const err = emp.reduce((s, v, i) => s + Math.abs(v - pi[i]), 0);
    readout.innerHTML =
      `<div class="row"><span class="lbl">selected variant</span><span>${info.title}: ${info.added}</span></div>` +
      `<div class="row"><span class="lbl">samples / acceptance</span><span>${total} / ${(100 * accRate).toFixed(1)}%</span></div>` +
      `<div class="row"><span class="lbl">occupation L1 error</span><span>${err.toFixed(3)}</span></div>` +
      `<div class="row"><span class="lbl">${info.knob}</span><span>${knobV.textContent}</span></div>`;
  }
  function qWeight(from, to) {
    if (variant === "metropolis") {
      const radius = 1 + Math.round(+knobIn.value * 3);
      const d = Math.abs(to - from);
      const allowedFrom = Math.min(6, from + radius) - Math.max(0, from - radius);
      return d === 0 || d > radius ? 0 : 1 / Math.max(1, allowedFrom);
    }
    if (variant === "mh") {
      const rightProb = 0.2 + 0.7 * +knobIn.value;
      return qMh(from, to, rightProb);
    }
    if (variant === "rj") {
      const birthProb = 0.2 + 0.7 * +knobIn.value;
      if (to === from + 1) return birthProb;
      if (to === from - 1) return 1 - birthProb;
      return 0;
    }
    if (variant === "hmc") {
      const d = Math.abs(to - from);
      return d === 1 ? 0.5 : 0;
    }
    return 0;
  }
  function drawChainSkeleton(nodes, pi) {
    if (variant === "gibbs") {
      ctx.strokeStyle = C.grid;
      ctx.lineWidth = 1.1;
      ctx.globalAlpha = 0.55;
      for (let i = 0; i < 3; i++) {
        const a = nodes[i], b = nodes[i + 6];
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        const c = nodes[i * 3], d = nodes[i * 3 + 2];
        ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      return;
    }
    for (let i = 0; i < nodes.length - 1; i++) {
      const a = nodes[i], b = nodes[i + 1];
      const rA = nodeRadius(pi[i]) + 1;
      const rB = nodeRadius(pi[i + 1]) + 1;
      const qFwd = qWeight(i, i + 1);
      const qBack = qWeight(i + 1, i);
      const wFwd = 0.7 + 3.0 * qFwd;
      const wBack = 0.7 + 3.0 * qBack;
      if (qFwd > 0) curvedEdge(a.x, a.y, b.x, b.y, rA, rB, C.prop, { width: wFwd, opacity: 0.42, curveOffset: -16, arrow: true });
      if (qBack > 0) curvedEdge(b.x, b.y, a.x, a.y, rB, rA, C.prop, { width: wBack, opacity: 0.42, curveOffset: -16, arrow: true });
    }
    if (variant === "metropolis") {
      const radius = 1 + Math.round(+knobIn.value * 3);
      for (let i = 0; i < nodes.length; i++) {
        for (let d = 2; d <= radius; d++) {
          const j = i + d;
          if (j >= nodes.length) continue;
          const a = nodes[i], b = nodes[j];
          const rA = nodeRadius(pi[i]) + 1;
          const rB = nodeRadius(pi[j]) + 1;
          const qFwd = qWeight(i, j);
          if (qFwd > 0) {
            // Arc each multi-hop edge wide enough to clear the nodes it spans.
            // baseOff staggers edges by span so different spans stay distinct;
            // forward and backward arcs bow opposite ways and clear separately.
            const baseOff = -16 - 8 * (d - 1);
            const rOf = (k) => nodeRadius(pi[k]);
            const offFwd = dynamicCurveOffsetNodes(nodes, rOf, i, j, baseOff);
            const offBack = dynamicCurveOffsetNodes(nodes, rOf, j, i, baseOff);
            curvedEdge(a.x, a.y, b.x, b.y, rA, rB, C.prop, { width: 0.8 + 2 * qFwd, opacity: 0.22, curveOffset: offFwd, arrow: true });
            curvedEdge(b.x, b.y, a.x, a.y, rB, rA, C.prop, { width: 0.8 + 2 * qFwd, opacity: 0.22, curveOffset: offBack, arrow: true });
          }
        }
      }
    }
  }
  function drawActiveTransition(nodes, pi) {
    if (!last) return;
    const fromNode = nodes[last.from];
    const toNode = nodes[last.to];
    if (!fromNode) return;
    const fadeIn = clamp(moveProgress * 2.0, 0, 1);
    const fadeOut = clamp(1 - (moveProgress - 0.6) / 0.4, 0, 1);
    const edgeOpacity = 0.30 + 0.65 * fadeIn * (last.ok ? 1 : 0.7);

    if (variant === "hmc" && last.path && last.path.length > 1) {
      for (let i = 0; i < last.path.length - 1; i++) {
        const a = nodes[last.path[i]];
        const b = nodes[last.path[i + 1]];
        if (!a || !b || last.path[i] === last.path[i + 1]) continue;
        const rA = nodeRadius(pi[last.path[i]]) + 2;
        const rB = nodeRadius(pi[last.path[i + 1]]) + 2;
        const segProgress = clamp((moveProgress * last.path.length) - i, 0, 1);
        curvedEdge(a.x, a.y, b.x, b.y, rA, rB, C.prop,
          { width: 2.4, opacity: 0.55 * segProgress, curveOffset: -22 - i * 4, arrow: i === last.path.length - 2, dashed: true });
      }
      if (last.ok && toNode && fromNode !== toNode) {
        const hmcOffset = dynamicCurveOffsetNodes(nodes, (k) => nodeRadius(pi[k]), last.from, last.to, -34);
        const g = curveGeometry(fromNode.x, fromNode.y, toNode.x, toNode.y,
          nodeRadius(pi[last.from]) + 2, nodeRadius(pi[last.to]) + 2, hmcOffset);
        if (g) {
          curvedEdge(fromNode.x, fromNode.y, toNode.x, toNode.y,
            nodeRadius(pi[last.from]) + 2, nodeRadius(pi[last.to]) + 2, C.accept,
            { width: 3.2, opacity: edgeOpacity, curveOffset: hmcOffset, arrow: true });
          if (moveProgress < 1) {
            const t = clamp(moveProgress * 1.2, 0, 1);
            const p = bezierPt({ x: g.sx, y: g.sy }, { x: g.cpx, y: g.cpy }, { x: g.ex, y: g.ey }, t);
            ctx.save();
            ctx.fillStyle = C.accept;
            ctx.globalAlpha = 0.95;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4.5, 0, 2 * Math.PI);
            ctx.fill();
            ctx.restore();
          }
        }
      }
      return;
    }

    if (last.ok && toNode && last.from !== last.to) {
      const rA = nodeRadius(pi[last.from]) + 2;
      const rB = nodeRadius(pi[last.to]) + 2;
      // Negative offset bows the arc above the chord; curveGeometry flips the
      // normal when the direction reverses, so backward arcs render below. Size
      // it to clear any nodes a multi-hop accepted move passes over.
      const offset = dynamicCurveOffsetNodes(nodes, (k) => nodeRadius(pi[k]), last.from, last.to, -22);
      const g = curveGeometry(fromNode.x, fromNode.y, toNode.x, toNode.y, rA, rB, offset);
      curvedEdge(fromNode.x, fromNode.y, toNode.x, toNode.y, rA, rB, C.accept,
        { width: 3.2, opacity: edgeOpacity, curveOffset: offset, arrow: true });
      if (moveProgress < 1 && g) {
        const t = clamp(moveProgress * 1.15, 0, 1);
        const p = bezierPt({ x: g.sx, y: g.sy }, { x: g.cpx, y: g.cpy }, { x: g.ex, y: g.ey }, t);
        ctx.save();
        ctx.fillStyle = C.accept;
        ctx.globalAlpha = 0.92;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4.5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
      }
    } else if (!last.ok) {
      const r = nodeRadius(pi[last.from]);
      const g = selfLoop(fromNode.x, fromNode.y, r, C.reject,
        { width: 2.4, opacity: 0.45 + 0.5 * fadeOut, arrow: true });
      if (moveProgress < 1 && g) {
        const t = clamp(moveProgress * 1.15, 0, 1);
        const p = selfLoopPoint(g, t);
        ctx.save();
        ctx.fillStyle = C.reject;
        ctx.globalAlpha = 0.95;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4.5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
      }
    } else if (last.ok && last.from === last.to) {
      const r = nodeRadius(pi[last.from]);
      selfLoop(fromNode.x, fromNode.y, r, C.accept, { width: 2.4, opacity: edgeOpacity, arrow: true });
    }
  }
  function drawDualHistogram(nodes, pi, emp) {
    const baseY = 290;
    const upH = 90;
    const dnH = 56;
    const barW = variant === "gibbs" || variant === "hmc" ? 24 : 32;

    const propSum = proposed.reduce((s, v) => s + v, 0);
    const acceptSum = acceptedTo.reduce((s, v) => s + v, 0);
    const propFrac = proposed.map(v => v / Math.max(1, propSum));
    const acceptFrac = acceptedTo.map(v => v / Math.max(1, acceptSum));
    const maxDown = Math.max(0.001, ...propFrac, ...acceptFrac);

    nodes.forEach((node, i) => {
      ctx.fillStyle = "rgba(184,65,42,0.42)";
      ctx.fillRect(node.x - barW / 2, baseY - pi[i] * upH, barW, pi[i] * upH);
      ctx.fillStyle = "rgba(107,69,146,0.72)";
      ctx.fillRect(node.x - barW / 4, baseY - emp[i] * upH, barW / 2, emp[i] * upH);
    });

    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(28, baseY);
    ctx.lineTo(424, baseY);
    ctx.stroke();

    nodes.forEach((node, i) => {
      const pHt = (propFrac[i] / maxDown) * dnH;
      const aHt = (acceptFrac[i] / maxDown) * dnH;
      ctx.fillStyle = "rgba(31,74,140,0.22)";
      ctx.fillRect(node.x - barW / 2, baseY, barW, pHt);
      ctx.strokeStyle = "rgba(31,74,140,0.6)";
      ctx.lineWidth = 1;
      ctx.strokeRect(node.x - barW / 2, baseY, barW, pHt);
      ctx.fillStyle = "rgba(45,122,62,0.78)";
      ctx.fillRect(node.x - barW / 4, baseY, barW / 2, aHt);
    });

    ctx.fillStyle = C.textDim;
    ctx.font = "10px -apple-system, sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.fillText("↑ π (red) · π̂ visited (purple)", 422, baseY - upH - 14);
    ctx.fillText("↓ proposed (blue outline) · accepted (green)", 422, baseY + dnH + 4);
    ctx.textAlign = "left";
  }
  function tick(t) {
    if (!running) { rafId = 0; return; }
    const interval = 1000 / Math.max(0.5, +speedIn.value);
    if (!lastStepTime || t - lastStepTime >= interval) {
      step(true);
      lastStepTime = t;
    }
    moveProgress = clamp((t - lastStepTime) / interval, 0, 1);
    draw();
    rafId = requestAnimationFrame(tick);
  }

  tabs.forEach((button) => {
    button.addEventListener("click", () => {
      variant = button.dataset.variant;
      tabs.forEach(tab => tab.setAttribute("aria-selected", String(tab === button)));
      const info = variants[variant];
      const label = knobIn.closest(".control")?.querySelector("label span:first-child");
      if (label) label.textContent = info.knob;
      reset();
      draw();
    });
  });
  runBtn.addEventListener("click", () => {
    running = !running;
    runBtn.textContent = running ? "Pause" : "Run";
    if (running && !rafId) {
      lastStepTime = 0;
      rafId = requestAnimationFrame(tick);
    }
  });
  resetBtn.addEventListener("click", () => { reset(); draw(); });
  knobIn.addEventListener("input", () => { reset(); draw(); });
  speedIn.addEventListener("input", draw);
  const firstLabel = knobIn.closest(".control")?.querySelector("label span:first-child");
  if (firstLabel) firstLabel.textContent = variants[variant].knob;
  reset();
  draw();
  rafId = requestAnimationFrame(tick);
})();

// ─────────── Figure 2b: Discrete Markov topology and mass ───────────
(function fig2b() {
  const canvas = document.getElementById("fig2b");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const radiusIn = document.getElementById("fig2b-radius");
  const tempIn = document.getElementById("fig2b-temp");
  const speedIn = document.getElementById("fig2b-speed");
  const batchIn = document.getElementById("fig2b-batch");
  const radiusV = document.getElementById("fig2b-radius-v");
  const tempV = document.getElementById("fig2b-temp-v");
  const speedV = document.getElementById("fig2b-speed-v");
  const batchV = document.getElementById("fig2b-batch-v");
  const runBtn = document.getElementById("fig2b-runpause");
  const resetBtn = document.getElementById("fig2b-reset");
  const readout = document.getElementById("fig2b-readout");
  const modeButtons = {
    line: document.getElementById("fig2b-mode-line"),
    grid: document.getElementById("fig2b-mode-grid"),
    ring: document.getElementById("fig2b-mode-ring"),
  };

  // ── Layout definitions ──
  const layouts = {
    line: {
      n: 19,
      describe: "1-D bimodal line",
      showBars: true,
      positions(plotW, plotH, padL, padR) {
        const x0 = padL, x1 = plotW + padL;
        const arr = [];
        for (let i = 0; i < 19; i++) arr.push({ x: x0 + (i / 18) * (x1 - x0), y: 120 });
        return arr;
      },
      labelFor(i) { return String(i - 9); },
      rawMass(i, temp) {
        const x = (i - 9) / 2.6;
        const m = 0.58 * Math.exp(-0.5 * ((x + 1.25) / 0.55) ** 2)
                + 0.42 * Math.exp(-0.5 * ((x - 1.15) / 0.75) ** 2);
        return Math.pow(m, 1 / temp);
      },
      neighbors(i, radius) {
        const out = [];
        for (let d = -radius; d <= radius; d++) {
          if (d === 0) continue;
          const j = i + d;
          if (j >= 0 && j < 19) out.push(j);
        }
        return out;
      },
    },
    grid: {
      n: 25,
      describe: "5×5 grid · two diagonal modes",
      showBars: false,
      positions(plotW, plotH) {
        const cx = plotW / 2 + 38, cy = plotH / 2 + 6;
        const spacing = Math.min(plotW * 0.78, plotH * 0.78) / 4;
        const arr = [];
        for (let row = 0; row < 5; row++) {
          for (let col = 0; col < 5; col++) {
            arr.push({ x: cx + (col - 2) * spacing, y: cy + (row - 2) * spacing });
          }
        }
        return arr;
      },
      labelFor(i) { return ""; },
      rawMass(i, temp) {
        const col = i % 5, row = Math.floor(i / 5);
        const g = (cc, rr, s) => Math.exp(-0.5 * (((col - cc) / s) ** 2 + ((row - rr) / s) ** 2));
        const m = 0.55 * g(1, 3, 0.85) + 0.45 * g(3, 1, 0.85);
        return Math.pow(m, 1 / temp);
      },
      neighbors(i, radius) {
        const col = i % 5, row = Math.floor(i / 5);
        const out = [];
        for (let dr = -radius; dr <= radius; dr++) {
          for (let dc = -radius; dc <= radius; dc++) {
            if (dr === 0 && dc === 0) continue;
            const r2 = row + dr, c2 = col + dc;
            if (r2 < 0 || r2 > 4 || c2 < 0 || c2 > 4) continue;
            out.push(r2 * 5 + c2);
          }
        }
        return out;
      },
    },
    ring: {
      n: 16,
      describe: "Ring · two clusters separated by low-mass barriers",
      showBars: false,
      positions(plotW, plotH) {
        const cx = plotW / 2 + 38, cy = plotH / 2 + 6;
        const radius = Math.min(plotW * 0.42, plotH * 0.42);
        const arr = [];
        for (let i = 0; i < 16; i++) {
          const ang = (i / 16) * 2 * Math.PI - Math.PI / 2;
          arr.push({ x: cx + radius * Math.cos(ang), y: cy + radius * Math.sin(ang) });
        }
        return arr;
      },
      labelFor(i) { return String(i); },
      rawMass(i, temp) {
        const c1 = 2, c2 = 10;
        const cyclicDist = (a, b) => {
          const d = Math.abs(a - b); return Math.min(d, 16 - d);
        };
        const m = 0.55 * Math.exp(-0.5 * (cyclicDist(i, c1) / 1.4) ** 2)
                + 0.45 * Math.exp(-0.5 * (cyclicDist(i, c2) / 1.4) ** 2);
        return Math.pow(m, 1 / temp);
      },
      neighbors(i, radius) {
        const out = [];
        for (let d = -radius; d <= radius; d++) {
          if (d === 0) continue;
          out.push(((i + d) % 16 + 16) % 16);
        }
        return out;
      },
    },
  };

  let layoutName = "line";
  let L = layouts[layoutName];
  let n = L.n;
  let current = Math.floor(n / 2);
  // The background sampler runs its own chain so its steps fill the occupation
  // histogram without teleporting the animated walker across un-drawn hops.
  let bgCurrent = current;
  let visits = new Array(n).fill(0);
  let accepted = 0, total = 0, running = true, rafId = null;
  let lastProposal = null;
  let lastTick = 0;
  let moveAnimFrom = -1, moveAnimTo = -1, moveAnimStart = 0, moveAnimOk = true;
  const MOVE_ANIM_MS = 240;

  function targetMass() {
    const temp = +tempIn.value;
    const arr = Array.from({ length: n }, (_, i) => L.rawMass(i, temp));
    const z = arr.reduce((a, b) => a + b, 0);
    return arr.map((v) => v / z);
  }
  function reset() {
    current = Math.floor(n / 2);
    bgCurrent = current;
    visits = new Array(n).fill(0); visits[current] = 1;
    accepted = 0; total = 0; lastProposal = null;
    moveAnimFrom = -1; moveAnimTo = -1;
  }
  function setLayout(name) {
    layoutName = name; L = layouts[name]; n = L.n;
    reset();
    Object.entries(modeButtons).forEach(([k, b]) => {
      if (!b) return;
      if (k === name) b.classList.add("active"); else b.classList.remove("active");
    });
    draw();
  }
  // One Metropolis step from state `from`: propose a within-radius neighbor,
  // accept with the MH ratio, record the visit, and return the outcome. The
  // animated walker and the background sampler share this kernel.
  function metropolisStep(from) {
    const radius = +radiusIn.value;
    const pi = targetMass();
    const choices = L.neighbors(from, radius);
    const next = choices.length ? choices[Math.floor(Math.random() * choices.length)] : from;
    const alpha = Math.min(1, pi[next] / pi[from]);
    const ok = Math.random() < alpha;
    const landed = ok ? next : from;
    if (ok) accepted++;
    total++;
    visits[landed]++;
    return { next, alpha, ok, landed };
  }
  // Foreground walker: the single step per frame the topology pane animates.
  function step() {
    const r = metropolisStep(current);
    lastProposal = { from: current, to: r.next, alpha: r.alpha, ok: r.ok };
    if (r.ok && current !== r.next) {
      moveAnimFrom = current;
      moveAnimTo = r.next;
      moveAnimStart = performance.now();
      moveAnimOk = true;
    }
    current = r.landed;
  }
  // Background sampler: extra MCMC steps that fill the occupation histogram
  // without moving — or teleporting — the on-screen walker.
  function bgStep() {
    bgCurrent = metropolisStep(bgCurrent).landed;
  }

  // Layout-aware max node radius so nodes never overlap their neighbors.
  function computeMaxR(plotW, nodeAreaH) {
    if (layoutName === "line") {
      return Math.min(16, (plotW / Math.max(1, n - 1)) * 0.42);
    }
    if (layoutName === "grid") {
      const spacing = Math.min(plotW * 0.78, nodeAreaH * 0.78) / 4;
      return Math.min(22, spacing * 0.42);
    }
    // ring
    const ringR = Math.min(plotW * 0.42, nodeAreaH * 0.42);
    const arcLen = (2 * Math.PI * ringR) / 16;
    return Math.min(22, arcLen * 0.45);
  }

  // Curve offset for an edge from `from` to `to`. For line mode, computed
  // dynamically so the curve clears intermediate nodes; for grid / ring,
  // a small offset keeps the curve visually distinct from a straight line
  // but doesn't need clearance because edges go between nearby positions
  // with no intermediate node on the chord.
  function edgeOffset(from, to, nodeRadiusFn, direction = -1) {
    if (layoutName === "line") {
      return dynamicCurveOffsetLine((idx) => nodeRadiusFn(idx) + 4, from, to, direction, 8);
    }
    return direction * 6;
  }

  function draw() {
    const radius = +radiusIn.value;
    const temp = +tempIn.value;
    radiusV.textContent = radius.toString();
    tempV.textContent = temp.toFixed(1);
    speedV.textContent = (+speedIn.value).toFixed(1);
    batchV.textContent = (+batchIn.value).toString();
    const pi = targetMass();
    const visitSum = visits.reduce((a, b) => a + b, 0);
    const emp = visits.map((v) => v / Math.max(1, visitSum));
    const piMax = Math.max(...pi, 1e-9);
    const empMax = Math.max(...emp, 1e-9);
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);

    const padL = 38, padR = 22;
    const plotW = w - padL - padR;
    const nodeAreaH = L.showBars ? 180 : h - 36;
    const positions = L.positions(plotW, nodeAreaH, padL, padR);
    const maxR = computeMaxR(plotW, nodeAreaH);
    const nodeRadiusFn = (i) => Math.max(4, 4 + (maxR - 4) * Math.sqrt(pi[i] / piMax));

    // Background grid (lines only in line mode)
    if (L.showBars) {
      const massY = nodeAreaH + 8, massH = h - massY - 14;
      ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
      for (let i = 0; i < n; i++) {
        const x = positions[i].x;
        ctx.beginPath(); ctx.moveTo(x, massY); ctx.lineTo(x, massY + massH); ctx.stroke();
      }
    }

    // Animation progress for the most recent accepted move
    const now = performance.now();
    const animActive = moveAnimFrom >= 0 && (now - moveAnimStart) < MOVE_ANIM_MS;
    const animT = animActive ? (now - moveAnimStart) / MOVE_ANIM_MS : 1;

    // Neighbor edges from current state (skeleton), weighted by acceptance ratio α.
    // Uses dynamic curve offset on line layout so the arc clears intermediate
    // nodes; flat / minimal offset elsewhere.
    const nbrs = L.neighbors(current, radius);
    for (const j of nbrs) {
      const alpha = Math.min(1, pi[j] / pi[current]);
      const a = positions[current], b = positions[j];
      const rA = nodeRadiusFn(current) + 2;
      const rB = nodeRadiusFn(j) + 2;
      const off = edgeOffset(current, j, nodeRadiusFn, -1);
      drawCurvedEdge(ctx, a.x, a.y, b.x, b.y, rA, rB, C.prop, {
        width: 0.7 + 2.5 * alpha,
        opacity: 0.18 + 0.55 * alpha,
        curveOffset: off,
        arrow: true,
      });
    }

    // Nodes (static, sized by π)
    for (let i = 0; i < n; i++) {
      const p = positions[i];
      const rOuter = nodeRadiusFn(i);
      // In non-line modes, draw inner empirical disk
      if (!L.showBars) {
        const rInner = maxR * Math.sqrt(emp[i] / Math.max(piMax, empMax));
        ctx.fillStyle = "rgba(107,69,146,0.55)";
        ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(1.5, rInner), 0, 2 * Math.PI); ctx.fill();
      }
      // Suppress the static "current" fill during animation; the moving ball below carries it.
      const isCurrentResting = i === current && !animActive;
      ctx.fillStyle = isCurrentResting ? C.target : (L.showBars ? "#fff" : "rgba(255,255,255,0.35)");
      ctx.strokeStyle = C.axis; ctx.lineWidth = isCurrentResting ? 2 : 1;
      ctx.beginPath(); ctx.arc(p.x, p.y, rOuter, 0, 2 * Math.PI);
      if (isCurrentResting) ctx.fill();
      ctx.stroke();
      const lbl = L.labelFor(i);
      if (lbl) {
        ctx.fillStyle = C.textDim;
        ctx.font = "10px -apple-system, sans-serif";
        ctx.textAlign = "center"; ctx.textBaseline = "top";
        ctx.fillText(lbl, p.x, p.y + rOuter + 4);
      }
    }

    // Active transition (accepted move): highlight the move arc and travel a ball along it.
    if (lastProposal && lastProposal.ok && lastProposal.from !== lastProposal.to) {
      const { from, to } = lastProposal;
      const a = positions[from], b = positions[to];
      const rA = nodeRadiusFn(from) + 2;
      const rB = nodeRadiusFn(to) + 2;
      const off = edgeOffset(from, to, nodeRadiusFn, -1);
      const fadeOut = 1 - Math.max(0, animT - 0.6) / 0.4;
      const g = curveGeometry(a.x, a.y, b.x, b.y, rA, rB, off);
      drawCurvedEdge(ctx, a.x, a.y, b.x, b.y, rA, rB, C.accept, {
        width: 3.0,
        opacity: 0.45 + 0.45 * fadeOut,
        curveOffset: off,
        arrow: true,
      });
      if (animActive && g) {
        const t = Math.min(1, animT * 1.1);
        const p = bezierPt({ x: g.sx, y: g.sy }, { x: g.cpx, y: g.cpy }, { x: g.ex, y: g.ey }, t);
        const r = Math.max(nodeRadiusFn(from), nodeRadiusFn(to));
        ctx.fillStyle = C.target;
        ctx.strokeStyle = C.axis; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
      }
    } else if (lastProposal && !lastProposal.ok && lastProposal.from !== lastProposal.to) {
      // Rejected move: self-loop on current state + a faded arc to the rejected target with ✕.
      const { to } = lastProposal;
      const cp = positions[current];
      drawSelfLoop(ctx, cp.x, cp.y, nodeRadiusFn(current), "#a04444", {
        width: 2.4,
        opacity: 0.6,
        arrow: true,
      });
      // Faded arc to the rejected target so the reader sees what was proposed.
      const a = positions[current], b = positions[to];
      const rA = nodeRadiusFn(current) + 2;
      const rB = nodeRadiusFn(to) + 2;
      const off = edgeOffset(current, to, nodeRadiusFn, -1);
      drawCurvedEdge(ctx, a.x, a.y, b.x, b.y, rA, rB, "#a04444", {
        width: 1.8,
        opacity: 0.35,
        curveOffset: off,
        dashed: true,
      });
      // ✕ at the rejected node.
      const p = positions[to];
      const rN = nodeRadiusFn(to);
      const s = rN * 0.55;
      ctx.strokeStyle = "#a04444"; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p.x - s, p.y - s); ctx.lineTo(p.x + s, p.y + s);
      ctx.moveTo(p.x + s, p.y - s); ctx.lineTo(p.x - s, p.y + s);
      ctx.stroke();
    }

    // Bars (line mode only) — drawn after edges/nodes so the bar chart stays below.
    if (L.showBars) {
      const massY = nodeAreaH + 8, massH = h - massY - 14;
      const cellW = plotW / n;
      const bw = Math.max(4, cellW - 4);
      for (let i = 0; i < n; i++) {
        const x = positions[i].x;
        const piH = pi[i] * massH * 5.2;
        const empH = emp[i] * massH * 5.2;
        ctx.fillStyle = "rgba(184,65,42,0.55)";
        ctx.fillRect(x - bw / 2, massY + massH - piH, bw, piH);
        ctx.fillStyle = "rgba(107,69,146,0.62)";
        ctx.fillRect(x - bw / 2 + bw * 0.3, massY + massH - empH, bw * 0.4, empH);
      }
      ctx.strokeStyle = C.axis; ctx.strokeRect(padL, massY, plotW, massH);
    }

    const l1 = emp.reduce((s, v, i) => s + Math.abs(v - pi[i]), 0);
    const accRate = total ? accepted / total : 0;
    readout.innerHTML =
      `<div class="row"><span class="lbl">layout</span><span>${L.describe} (${n} states)</span></div>` +
      `<div class="row"><span class="lbl">transition view</span><span>edge thickness = acceptance probability from the current state</span></div>` +
      `<div class="row"><span class="lbl">samples / acceptance rate</span><span>${total} / ${(100 * accRate).toFixed(1)}%</span></div>` +
      `<div class="row"><span class="lbl">occupation error vs target</span><span>${l1.toFixed(3)} L1</span></div>`;
  }

  function tick(t) {
    const now = performance.now();
    const animActive = moveAnimFrom >= 0 && (now - moveAnimStart) < MOVE_ANIM_MS;
    if (!running && !animActive) { rafId = 0; return; }
    if (running) {
      const interval = 1000 / Math.max(0.5, +speedIn.value);
      if (!lastTick || t - lastTick >= interval) {
        for (let i = 0; i < +batchIn.value; i++) bgStep();
        step();
        lastTick = t;
      }
    }
    draw();
    rafId = requestAnimationFrame(tick);
  }
  runBtn.addEventListener("click", () => {
    running = !running; runBtn.textContent = running ? "Pause" : "Run";
    if ((running || moveAnimFrom >= 0) && !rafId) { lastTick = 0; rafId = requestAnimationFrame(tick); }
  });
  resetBtn.addEventListener("click", () => { reset(); draw(); });
  radiusIn.addEventListener("input", draw);
  tempIn.addEventListener("input", () => { reset(); draw(); });
  speedIn.addEventListener("input", draw);
  batchIn.addEventListener("input", draw);
  for (const name of Object.keys(modeButtons)) {
    const btn = modeButtons[name];
    if (!btn) continue;
    btn.addEventListener("click", () => setLayout(name));
  }
  reset(); draw(); rafId = requestAnimationFrame(tick);
})();

// ─────────── Figure 4: Gibbs vs random-walk MH ───────────
(function fig4() {
  const canvas = document.getElementById("fig4");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const rhoIn = document.getElementById("fig4-rho");
  const stepIn = document.getElementById("fig4-step");
  const rhoV = document.getElementById("fig4-rho-v");
  const stepV = document.getElementById("fig4-step-v");
  const runBtn = document.getElementById("fig4-runpause");
  const resetBtn = document.getElementById("fig4-reset");
  const readout = document.getElementById("fig4-readout");

  let gibbs = [], mh = [], gCur = { x: -2.2, y: 2.2 }, mCur = { x: -2.2, y: 2.2 };
  let gAxis = 0, mhAcc = 0, mhTotal = 0, running = true, rafId = null;
  function logPi(p, rho) {
    const q = (p.x * p.x - 2 * rho * p.x * p.y + p.y * p.y) / (1 - rho * rho);
    return -0.5 * q;
  }
  function reset() {
    gCur = { x: -2.2, y: 2.2 }; mCur = { x: -2.2, y: 2.2 };
    gibbs = [{ ...gCur }]; mh = [{ ...mCur }]; gAxis = 0; mhAcc = 0; mhTotal = 0;
  }
  function step() {
    const rho = +rhoIn.value;
    const sd = Math.sqrt(1 - rho * rho);
    if (gAxis === 0) gCur.x = rho * gCur.y + gaussianSample(0, sd);
    else gCur.y = rho * gCur.x + gaussianSample(0, sd);
    gAxis = 1 - gAxis;
    gibbs.push({ ...gCur });

    const stepSize = +stepIn.value;
    const prop = { x: mCur.x + gaussianSample(0, stepSize), y: mCur.y + gaussianSample(0, stepSize) };
    if (Math.log(Math.random()) < logPi(prop, rho) - logPi(mCur, rho)) {
      mCur = prop; mhAcc++;
    }
    mhTotal++;
    mh.push({ ...mCur });
    if (gibbs.length > 900) gibbs.shift();
    if (mh.length > 900) mh.shift();
  }
  function lag1(samples) {
    if (samples.length < 10) return 0;
    const xs = samples.map(p => p.x);
    const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
    let num = 0, den = 0;
    for (let i = 1; i < xs.length; i++) num += (xs[i - 1] - mean) * (xs[i] - mean);
    for (const x of xs) den += (x - mean) * (x - mean);
    return den ? num / den : 0;
  }
  function drawPanel(x0, ww, title, path, color) {
    const y0 = 24, hh = h - 58;
    const scale = 3.2;
    const xS = x => x0 + ww / 2 + (x / scale) * ww / 2;
    const yS = y => y0 + hh / 2 - (y / scale) * hh / 2;
    ctx.strokeStyle = C.axis; ctx.strokeRect(x0, y0, ww, hh);
    const rho = +rhoIn.value;
    for (const level of [0.5, 1.2, 2.0, 3.0]) {
      ctx.strokeStyle = `rgba(184,65,42,${0.18 + level * 0.08})`; ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i <= 160; i++) {
        const a = i / 160 * 2 * Math.PI;
        const u = Math.sqrt(level) * Math.cos(a), v = Math.sqrt(level) * Math.sin(a);
        const x = Math.sqrt(1 + rho) * u / Math.SQRT2 + Math.sqrt(1 - rho) * v / Math.SQRT2;
        const y = Math.sqrt(1 + rho) * u / Math.SQRT2 - Math.sqrt(1 - rho) * v / Math.SQRT2;
        if (i === 0) ctx.moveTo(xS(x), yS(y)); else ctx.lineTo(xS(x), yS(y));
      }
      ctx.stroke();
    }
    ctx.strokeStyle = color; ctx.lineWidth = 1.2; ctx.beginPath();
    const start = Math.max(0, path.length - 300);
    for (let i = start; i < path.length; i++) {
      const p = path[i];
      if (i === start) ctx.moveTo(xS(p.x), yS(p.y)); else ctx.lineTo(xS(p.x), yS(p.y));
    }
    ctx.stroke();
    const cur = path[path.length - 1];
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(xS(cur.x), yS(cur.y), 4, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = C.text; ctx.font = "600 12px -apple-system, sans-serif"; ctx.textAlign = "left"; ctx.textBaseline = "top";
    ctx.fillText(title, x0 + 8, y0 + 8);
  }
  function draw() {
    rhoV.textContent = (+rhoIn.value).toFixed(2);
    stepV.textContent = (+stepIn.value).toFixed(2);
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
    const gap = 24, ww = (w - 72 - gap) / 2;
    drawPanel(36, ww, "Gibbs: exact axis conditionals", gibbs, C.accept);
    drawPanel(36 + ww + gap, ww, "Random-walk MH", mh, C.prop);
    const gLag = lag1(gibbs), mLag = lag1(mh), acc = mhTotal ? mhAcc / mhTotal : 0;
    readout.innerHTML =
      `<div class="row"><span class="lbl">Gibbs lag-1 autocorrelation</span><span>${gLag.toFixed(3)} ${gLag > 0.85 ? "(sticky under high correlation)" : ""}</span></div>` +
      `<div class="row"><span class="lbl">MH lag-1 autocorrelation / acceptance</span><span>${mLag.toFixed(3)} / ${(100 * acc).toFixed(1)}%</span></div>`;
  }
  function tick() {
    if (!running) { rafId = 0; return; }
    for (let i = 0; i < 5; i++) step();
    draw(); rafId = requestAnimationFrame(tick);
  }
  runBtn.addEventListener("click", () => {
    running = !running; runBtn.textContent = running ? "Pause" : "Run";
    if (running && !rafId) rafId = requestAnimationFrame(tick);
  });
  resetBtn.addEventListener("click", () => { reset(); draw(); });
  rhoIn.addEventListener("input", () => { reset(); draw(); });
  stepIn.addEventListener("input", draw);
  reset(); draw(); rafId = requestAnimationFrame(tick);
})();

// ─────────── Figure 10: RJMCMC dimension-matching split/merge ───────────
(function fig5() {
  const canvas = document.getElementById("fig5");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const muIn = document.getElementById("fig5-mu");
  const uIn = document.getElementById("fig5-u");
  const muV = document.getElementById("fig5-mu-v");
  const uV = document.getElementById("fig5-u-v");
  const splitBtn = document.getElementById("fig5-split");
  const mergeBtn = document.getElementById("fig5-merge");
  const resetBtn = document.getElementById("fig5-reset");
  const readout = document.getElementById("fig5-readout");

  const xMin = -4, xMax = 4;
  let animDir = 0; // 0: idle, 1: split (k=1 → k=2), -1: merge (k=2 → k=1)
  let animStart = 0;
  const ANIM_MS = 900;
  let raf = null;

  function xS(x, padL, plotW) {
    return padL + ((x - xMin) / (xMax - xMin)) * plotW;
  }
  function drawArrow(x1, y1, x2, y2, headSize = 8) {
    ctx.beginPath();
    ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    const a = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headSize * Math.cos(a - 0.42), y2 - headSize * Math.sin(a - 0.42));
    ctx.lineTo(x2 - headSize * Math.cos(a + 0.42), y2 - headSize * Math.sin(a + 0.42));
    ctx.closePath(); ctx.fill();
  }

  function draw() {
    const mu = +muIn.value;
    const u = +uIn.value;
    muV.textContent = mu.toFixed(2);
    uV.textContent = u.toFixed(2);

    const padL = 60, padR = 40;
    const plotW = w - padL - padR;
    const topY = 76;
    const botY = 220;

    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, w, h);

    // Section labels
    ctx.fillStyle = C.text;
    ctx.font = "600 13px -apple-system, sans-serif";
    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.fillText("k = 1   (one parameter: θ = μ)", padL, topY - 26);
    ctx.fillText("k = 2   (two parameters: (μ₁, μ₂) = (μ + u, μ − u))", padL, botY - 26);

    function numberLine(y) {
      ctx.strokeStyle = C.axis; ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke();
      ctx.fillStyle = C.textDim;
      ctx.font = "10px -apple-system, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "top";
      for (let v = -3; v <= 3; v++) {
        const px = xS(v, padL, plotW);
        ctx.beginPath();
        ctx.moveTo(px, y - 4); ctx.lineTo(px, y + 4);
        ctx.strokeStyle = C.axis;
        ctx.stroke();
        ctx.fillText(String(v), px, y + 6);
      }
    }
    numberLine(topY);
    numberLine(botY);

    // k=1: μ dot
    const muX = xS(mu, padL, plotW);
    ctx.fillStyle = C.target;
    ctx.beginPath(); ctx.arc(muX, topY, 9, 0, 2 * Math.PI); ctx.fill();
    ctx.strokeStyle = C.axis; ctx.lineWidth = 1.3; ctx.stroke();
    ctx.fillStyle = C.text;
    ctx.font = "600 13px -apple-system, sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.fillText("μ", muX, topY - 14);

    // k=2 reference: faint μ (where the merge sends back to)
    const mu1 = mu + u, mu2 = mu - u;
    const mu1X = xS(mu1, padL, plotW);
    const mu2X = xS(mu2, padL, plotW);
    ctx.fillStyle = "rgba(120,120,120,0.30)";
    ctx.beginPath(); ctx.arc(muX, botY, 5, 0, 2 * Math.PI); ctx.fill();
    ctx.font = "10px -apple-system, sans-serif";
    ctx.fillStyle = C.textDim;
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    ctx.fillText("(μ)", muX, botY + 22);

    // +u, −u offset arrows
    ctx.strokeStyle = C.prop; ctx.fillStyle = C.prop; ctx.lineWidth = 1.6;
    drawArrow(muX, botY - 18, mu1X, botY - 18);
    drawArrow(muX, botY + 38, mu2X, botY + 38);
    ctx.fillStyle = C.prop;
    ctx.font = "italic 12px -apple-system, sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.fillText("+u", (muX + mu1X) / 2, botY - 22);
    ctx.fillText("−u", (muX + mu2X) / 2, botY + 52);

    // μ_1, μ_2 dots
    ctx.fillStyle = C.particle;
    ctx.beginPath(); ctx.arc(mu1X, botY, 9, 0, 2 * Math.PI); ctx.fill();
    ctx.strokeStyle = C.axis; ctx.lineWidth = 1.3; ctx.stroke();
    ctx.fillStyle = C.particle;
    ctx.beginPath(); ctx.arc(mu2X, botY, 9, 0, 2 * Math.PI); ctx.fill();
    ctx.stroke();
    ctx.fillStyle = C.text;
    ctx.font = "600 13px -apple-system, sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.fillText("μ₁", mu1X, botY - 14);
    ctx.fillText("μ₂", mu2X, botY - 14);

    // Vertical map arrows between the two halves
    const t = animDir === 0 ? 0 : Math.min(1, (performance.now() - animStart) / ANIM_MS);
    const splitActive = animDir === 1;
    const mergeActive = animDir === -1;
    const splitAlpha = splitActive ? (1 - Math.abs(t - 0.5) * 0.6) : 0.32;
    const mergeAlpha = mergeActive ? (1 - Math.abs(t - 0.5) * 0.6) : 0.32;

    const splitArrowX = padL + 10;
    const mergeArrowX = padL + plotW - 10;

    ctx.save();
    ctx.globalAlpha = splitAlpha;
    ctx.strokeStyle = "#2d7a3e"; ctx.fillStyle = "#2d7a3e"; ctx.lineWidth = 2;
    drawArrow(splitArrowX, topY + 18, splitArrowX, botY - 18, 9);
    ctx.font = "600 11px -apple-system, sans-serif";
    ctx.textAlign = "left"; ctx.textBaseline = "middle";
    ctx.fillStyle = "#2d7a3e";
    ctx.fillText("Split:  T(μ, u) = (μ+u, μ−u)", splitArrowX + 8, (topY + botY) / 2);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = mergeAlpha;
    ctx.strokeStyle = "#1f4a8c"; ctx.fillStyle = "#1f4a8c"; ctx.lineWidth = 2;
    drawArrow(mergeArrowX, botY - 18, mergeArrowX, topY + 18, 9);
    ctx.font = "600 11px -apple-system, sans-serif";
    ctx.textAlign = "right"; ctx.textBaseline = "middle";
    ctx.fillStyle = "#1f4a8c";
    ctx.fillText("Merge:  T⁻¹(μ₁, μ₂) = ((μ₁+μ₂)/2, (μ₁−μ₂)/2)", mergeArrowX - 8, (topY + botY) / 2);
    ctx.restore();

    // Animated traveling dot during split/merge
    if (animDir !== 0) {
      const tt = t;
      ctx.save();
      if (animDir === 1) {
        // dot travels from μ (top) down, then splits to (μ₁, μ₂)
        if (tt < 0.5) {
          const yPos = topY + (botY - topY) * (tt / 0.5);
          ctx.fillStyle = C.target;
          ctx.beginPath(); ctx.arc(muX, yPos, 8, 0, 2 * Math.PI); ctx.fill();
        } else {
          const s = (tt - 0.5) / 0.5;
          const x1 = muX + (mu1X - muX) * s;
          const x2 = muX + (mu2X - muX) * s;
          ctx.fillStyle = C.particle;
          ctx.beginPath(); ctx.arc(x1, botY, 8, 0, 2 * Math.PI); ctx.fill();
          ctx.beginPath(); ctx.arc(x2, botY, 8, 0, 2 * Math.PI); ctx.fill();
        }
      } else {
        // dots merge to (μ, midpoint) then rise
        if (tt < 0.5) {
          const s = tt / 0.5;
          const x1 = mu1X + (muX - mu1X) * s;
          const x2 = mu2X + (muX - mu2X) * s;
          ctx.fillStyle = C.particle;
          ctx.beginPath(); ctx.arc(x1, botY, 8, 0, 2 * Math.PI); ctx.fill();
          ctx.beginPath(); ctx.arc(x2, botY, 8, 0, 2 * Math.PI); ctx.fill();
        } else {
          const yPos = botY + (topY - botY) * ((tt - 0.5) / 0.5);
          ctx.fillStyle = C.target;
          ctx.beginPath(); ctx.arc(muX, yPos, 8, 0, 2 * Math.PI); ctx.fill();
        }
      }
      ctx.restore();
      if (t >= 1) animDir = 0;
    }

    readout.innerHTML =
      `<div class="row"><span class="lbl">map T</span><span>(μ, u) ↦ (μ + u, μ − u) = (${mu1.toFixed(2)}, ${mu2.toFixed(2)})</span></div>` +
      `<div class="row"><span class="lbl">inverse T⁻¹</span><span>(μ₁, μ₂) ↦ ((μ₁ + μ₂)/2, (μ₁ − μ₂)/2)</span></div>` +
      `<div class="row"><span class="lbl">Jacobian |∂(μ₁, μ₂) / ∂(μ, u)|</span><span>= |det([[1, 1],[1, −1]])| = 2 &nbsp;(appears in the RJ accept ratio)</span></div>`;
  }

  function loop() {
    if (animDir !== 0) {
      draw();
      raf = requestAnimationFrame(loop);
    } else {
      raf = null;
      draw();
    }
  }
  function startAnim(dir) {
    animDir = dir;
    animStart = performance.now();
    if (!raf) raf = requestAnimationFrame(loop);
  }

  muIn.addEventListener("input", draw);
  uIn.addEventListener("input", draw);
  splitBtn.addEventListener("click", () => startAnim(1));
  mergeBtn.addEventListener("click", () => startAnim(-1));
  resetBtn.addEventListener("click", () => {
    muIn.value = "0.5"; uIn.value = "1.2"; animDir = 0; draw();
  });

  draw();
})();

// ─────────── Figure 11: RJMCMC as two coupled chains ───────────
(function fig5b() {
  const canvas = document.getElementById("fig5b");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const prjIn = document.getElementById("fig5b-prj");
  const speedIn = document.getElementById("fig5b-speed");
  const prjV = document.getElementById("fig5b-prj-v");
  const speedV = document.getElementById("fig5b-speed-v");
  const runBtn = document.getElementById("fig5b-runpause");
  const stepBtn = document.getElementById("fig5b-step");
  const resetBtn = document.getElementById("fig5b-reset");
  const readout = document.getElementById("fig5b-readout");

  // Model priors and targets.
  // π(k=1, μ) = p1 · N(μ; 0, 1)
  // π(k=2, μ₁, μ₂) = p2 · N(μ₁; -1.5, 0.6) · N(μ₂; 1.5, 0.6)
  const p1Prior = 0.4, p2Prior = 0.6;
  const U_MAX = 3.0;
  const SIGMA_W1 = 0.5; // within-k1 MH proposal sd
  const SIGMA_W2 = 0.3; // within-k2 MH proposal sd
  const TRAIL_LEN = 80;

  function pi1(mu) { return p1Prior * gaussianPdf(mu, 0, 1.0); }
  function pi2(m1, m2) {
    return p2Prior * gaussianPdf(m1, -1.5, 0.6) * gaussianPdf(m2, 1.5, 0.6);
  }

  let k = 1;
  let mu = 0;
  let mu1 = -1.5, mu2 = 1.5;
  let trail1 = []; // recent μ values when in k=1
  let trail2 = []; // recent (μ₁, μ₂) when in k=2
  let visits1 = 0, visits2 = 0;
  let acc1 = 0, prop1 = 0; // within-k1 accept counts
  let acc2 = 0, prop2 = 0;
  let accB = 0, propB = 0; // births proposed/accepted
  let accD = 0, propD = 0; // deaths proposed/accepted
  let last = null;          // info about last move (any kind)
  let lastRj = null;        // info about last RJ move (birth/death) — persists across within-model steps
  let lastRjAt = 0;         // step at which lastRj happened (for fade-out)
  let totalSteps = 0;
  let running = true;
  let rafId = null;
  let lastTick = 0;

  function reset() {
    k = 1; mu = 0; mu1 = -1.5; mu2 = 1.5;
    trail1 = []; trail2 = [];
    visits1 = 0; visits2 = 0;
    acc1 = 0; prop1 = 0; acc2 = 0; prop2 = 0;
    accB = 0; propB = 0; accD = 0; propD = 0;
    last = null; lastRj = null; lastRjAt = 0; totalSteps = 0;
  }

  function step() {
    const pRj = +prjIn.value;
    const useRj = Math.random() < pRj;
    if (!useRj) {
      // Within-model MH
      if (k === 1) {
        const muNew = mu + gaussianSample(0, SIGMA_W1);
        const alpha = Math.min(1, pi1(muNew) / Math.max(1e-300, pi1(mu)));
        const ok = Math.random() < alpha;
        prop1++;
        if (ok) { mu = muNew; acc1++; }
        last = { kind: "within-k1", from: { mu }, to: { mu: muNew }, alpha, ok };
      } else {
        const m1n = mu1 + gaussianSample(0, SIGMA_W2);
        const m2n = mu2 + gaussianSample(0, SIGMA_W2);
        const alpha = Math.min(1, pi2(m1n, m2n) / Math.max(1e-300, pi2(mu1, mu2)));
        const ok = Math.random() < alpha;
        prop2++;
        if (ok) { mu1 = m1n; mu2 = m2n; acc2++; }
        last = { kind: "within-k2", from: { mu1, mu2 }, to: { mu1: m1n, mu2: m2n }, alpha, ok };
      }
    } else {
      // Between-model (RJ)
      if (k === 1) {
        // Birth: μ ↦ (μ+u, μ-u), u ~ U[0, U_MAX], so g(u) = 1/U_MAX. Jacobian = 2.
        const u = U_MAX * Math.random();
        const nm1 = mu + u, nm2 = mu - u;
        // α = (π₂(nm1, nm2) / π₁(μ)) · (1 / g(u)) · |J|
        //   = (π₂ / π₁) · U_MAX · 2
        const alpha = Math.min(1, (pi2(nm1, nm2) / Math.max(1e-300, pi1(mu))) * U_MAX * 2);
        const ok = Math.random() < alpha;
        propB++;
        if (ok) {
          k = 2; mu1 = nm1; mu2 = nm2; accB++;
        }
        last = { kind: "birth", from: { mu }, to: { mu1: nm1, mu2: nm2 }, u, alpha, ok };
      } else {
        // Death: (μ₁, μ₂) ↦ μ = (μ₁+μ₂)/2, u = (μ₁-μ₂)/2 (need u > 0 and u < U_MAX)
        const newMu = (mu1 + mu2) / 2;
        const u = (mu1 - mu2) / 2;
        const validBack = u > 0 && u < U_MAX;
        // α = (π₁(newMu) / π₂(μ₁, μ₂)) · g(u) · (1/|J|)
        //   = (π₁ / π₂) · (1/U_MAX) · 0.5
        const alpha = validBack
          ? Math.min(1, (pi1(newMu) / Math.max(1e-300, pi2(mu1, mu2))) * (1 / U_MAX) * 0.5)
          : 0;
        const ok = Math.random() < alpha;
        propD++;
        if (ok) {
          k = 1; mu = newMu; accD++;
        }
        last = { kind: "death", from: { mu1, mu2 }, to: { mu: newMu }, u, alpha, ok };
      }
    }

    // Record visit + trail
    if (k === 1) {
      visits1++;
      trail1.push(mu);
      if (trail1.length > TRAIL_LEN) trail1.shift();
    } else {
      visits2++;
      trail2.push({ mu1, mu2 });
      if (trail2.length > TRAIL_LEN) trail2.shift();
    }
    totalSteps++;
    if (last && (last.kind === "birth" || last.kind === "death")) {
      lastRj = last;
      lastRjAt = totalSteps;
    }
  }

  // Layout
  const titleY = 16;
  const panelY0 = 40, panelH = 220;
  const panelGap = 24;
  const padL = 30, padR = 30;
  const panelW = (w - padL - padR - panelGap) / 2;
  const barY = 296, barH = 22;
  const rjBandY0 = 332, rjBandH = 36;

  const xMinP = -4, xMaxP = 4;
  function xS(x, x0) { return x0 + ((x - xMinP) / (xMaxP - xMinP)) * panelW; }

  function drawK1Panel(x0) {
    // x-axis is μ ∈ [xMin, xMax]; y shows N(μ; 0, 1) density.
    const yMax = gaussianPdf(0, 0, 1) * 1.25;
    const yPlotTop = panelY0 + 28;
    const yPlotBot = panelY0 + panelH - 14;
    const yD = (d) => yPlotBot - (d / yMax) * (yPlotBot - yPlotTop);

    // Panel frame
    ctx.fillStyle = k === 1 ? "rgba(255,255,255,1)" : "rgba(230,228,220,0.55)";
    ctx.fillRect(x0, panelY0, panelW, panelH);
    ctx.strokeStyle = k === 1 ? C.axis : C.textDim;
    ctx.lineWidth = k === 1 ? 1.5 : 1;
    ctx.strokeRect(x0, panelY0, panelW, panelH);

    // Title
    ctx.fillStyle = k === 1 ? C.text : C.textDim;
    ctx.font = "600 12px -apple-system, sans-serif";
    ctx.textAlign = "left"; ctx.textBaseline = "top";
    ctx.fillText(`k = 1   N(μ; 0, 1)  ·  prior ${p1Prior.toFixed(1)}`, x0 + 8, panelY0 + 6);

    // Target density curve
    ctx.beginPath();
    for (let i = 0; i <= 200; i++) {
      const x = xMinP + (i / 200) * (xMaxP - xMinP);
      const px = xS(x, x0), py = yD(gaussianPdf(x, 0, 1));
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.lineTo(xS(xMaxP, x0), yPlotBot);
    ctx.lineTo(xS(xMinP, x0), yPlotBot);
    ctx.closePath();
    ctx.fillStyle = "rgba(184,65,42,0.18)"; ctx.fill();
    ctx.beginPath();
    for (let i = 0; i <= 200; i++) {
      const x = xMinP + (i / 200) * (xMaxP - xMinP);
      const px = xS(x, x0), py = yD(gaussianPdf(x, 0, 1));
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = C.target; ctx.lineWidth = 1.6; ctx.stroke();

    // x ticks
    ctx.fillStyle = C.textDim; ctx.font = "10px -apple-system, sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    for (let v = -3; v <= 3; v++) {
      ctx.fillText(String(v), xS(v, x0), yPlotBot + 3);
    }

    // Trail
    for (let i = 0; i < trail1.length; i++) {
      const m = trail1[i];
      const alpha = 0.08 + 0.45 * (i / trail1.length);
      ctx.fillStyle = `rgba(107,69,146,${alpha})`;
      ctx.beginPath(); ctx.arc(xS(m, x0), yD(gaussianPdf(m, 0, 1)), 3, 0, 2 * Math.PI); ctx.fill();
    }

    // Current state (only fully solid when chain is in k=1)
    const cx = xS(mu, x0);
    const cy = yD(gaussianPdf(mu, 0, 1));
    if (k === 1) {
      ctx.fillStyle = C.accept;
      ctx.beginPath(); ctx.arc(cx, cy, 7, 0, 2 * Math.PI); ctx.fill();
      ctx.strokeStyle = C.axis; ctx.lineWidth = 1.3; ctx.stroke();
      ctx.fillStyle = C.text; ctx.font = "11px -apple-system, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "bottom";
      ctx.fillText(`μ = ${mu.toFixed(2)}`, cx, cy - 10);
    } else {
      ctx.fillStyle = "rgba(120,120,120,0.45)";
      ctx.beginPath(); ctx.arc(cx, cy, 4, 0, 2 * Math.PI); ctx.fill();
    }

    return { x0, yD, cx, cy };
  }

  function drawK2Panel(x0) {
    // 2D scatter: μ₁ on x, μ₂ on y. Target: N(μ₁; -1.5, 0.6) · N(μ₂; 1.5, 0.6).
    const yPlotTop = panelY0 + 28;
    const yPlotBot = panelY0 + panelH - 14;
    const yS = (yy) => yPlotBot - ((yy - xMinP) / (xMaxP - xMinP)) * (yPlotBot - yPlotTop);

    ctx.fillStyle = k === 2 ? "rgba(255,255,255,1)" : "rgba(230,228,220,0.55)";
    ctx.fillRect(x0, panelY0, panelW, panelH);
    ctx.strokeStyle = k === 2 ? C.axis : C.textDim;
    ctx.lineWidth = k === 2 ? 1.5 : 1;
    ctx.strokeRect(x0, panelY0, panelW, panelH);

    ctx.fillStyle = k === 2 ? C.text : C.textDim;
    ctx.font = "600 12px -apple-system, sans-serif";
    ctx.textAlign = "left"; ctx.textBaseline = "top";
    ctx.fillText(`k = 2   N(μ₁; -1.5, 0.6) · N(μ₂; 1.5, 0.6)  ·  prior ${p2Prior.toFixed(1)}`, x0 + 8, panelY0 + 6);

    // Density contours: draw shaded ellipses at a few levels
    const cx0 = xS(-1.5, x0), cy0 = yS(1.5);
    const sxPx = (0.6 / (xMaxP - xMinP)) * panelW;
    const syPx = (0.6 / (xMaxP - xMinP)) * (yPlotBot - yPlotTop);
    for (const r of [3, 2, 1.2, 0.5]) {
      ctx.fillStyle = `rgba(184,65,42,${0.07 + (3 - r) * 0.06})`;
      ctx.beginPath();
      ctx.ellipse(cx0, cy0, sxPx * r, syPx * r, 0, 0, 2 * Math.PI);
      ctx.fill();
    }
    // Diagonal μ₁ = μ₂ reference (collapse line of the split/merge map)
    ctx.strokeStyle = "rgba(120,120,120,0.35)"; ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(xS(xMinP, x0), yS(xMinP));
    ctx.lineTo(xS(xMaxP, x0), yS(xMaxP));
    ctx.stroke();
    ctx.setLineDash([]);

    // x and y ticks
    ctx.fillStyle = C.textDim; ctx.font = "10px -apple-system, sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    for (let v = -3; v <= 3; v++) ctx.fillText(String(v), xS(v, x0), yPlotBot + 3);
    ctx.textAlign = "right"; ctx.textBaseline = "middle";
    for (let v = -3; v <= 3; v++) ctx.fillText(String(v), x0 - 4, yS(v));
    // Axis labels
    ctx.fillStyle = C.textDim; ctx.font = "italic 11px -apple-system, sans-serif";
    ctx.textAlign = "right"; ctx.textBaseline = "alphabetic";
    ctx.fillText("μ₁ →", x0 + panelW - 4, yPlotBot + 16);
    ctx.save();
    ctx.translate(x0 - 22, (yPlotTop + yPlotBot) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.fillText("μ₂ →", 0, 0);
    ctx.restore();

    // Trail
    for (let i = 0; i < trail2.length; i++) {
      const p = trail2[i];
      const alpha = 0.08 + 0.45 * (i / trail2.length);
      ctx.fillStyle = `rgba(107,69,146,${alpha})`;
      ctx.beginPath(); ctx.arc(xS(p.mu1, x0), yS(p.mu2), 3, 0, 2 * Math.PI); ctx.fill();
    }

    // Current dot
    const cx = xS(mu1, x0), cy = yS(mu2);
    if (k === 2) {
      ctx.fillStyle = C.accept;
      ctx.beginPath(); ctx.arc(cx, cy, 7, 0, 2 * Math.PI); ctx.fill();
      ctx.strokeStyle = C.axis; ctx.lineWidth = 1.3; ctx.stroke();
      ctx.fillStyle = C.text; ctx.font = "11px -apple-system, sans-serif";
      ctx.textAlign = "left"; ctx.textBaseline = "bottom";
      ctx.fillText(`(${mu1.toFixed(2)}, ${mu2.toFixed(2)})`, cx + 10, cy - 4);
    } else {
      ctx.fillStyle = "rgba(120,120,120,0.45)";
      ctx.beginPath(); ctx.arc(cx, cy, 4, 0, 2 * Math.PI); ctx.fill();
    }

    return { x0, yS, cx, cy };
  }

  function drawRjIndicator(g1, g2) {
    // Show last RJ move type, arrow between the panel centers, accept/reject result.
    const cy = rjBandY0 + rjBandH / 2;
    ctx.fillStyle = C.text;
    ctx.font = "11px -apple-system, sans-serif";
    ctx.textAlign = "left"; ctx.textBaseline = "middle";
    let summary = "";
    if (!last) summary = "(no step yet)";
    else if (last.kind === "within-k1") summary = `within k=1 step: μ → ${last.to.mu.toFixed(2)}, α = ${last.alpha.toFixed(2)} ${last.ok ? "✓" : "✗"}`;
    else if (last.kind === "within-k2") summary = `within k=2 step: (μ₁, μ₂) → (${last.to.mu1.toFixed(2)}, ${last.to.mu2.toFixed(2)}), α = ${last.alpha.toFixed(2)} ${last.ok ? "✓" : "✗"}`;
    else if (last.kind === "birth") summary = `BIRTH (k=1 → k=2): u = ${last.u.toFixed(2)}, α = ${last.alpha.toFixed(2)} ${last.ok ? "✓ accepted" : "✗ rejected"}`;
    else if (last.kind === "death") summary = `DEATH (k=2 → k=1): u = ${last.u.toFixed(2)}, α = ${last.alpha.toFixed(2)} ${last.ok ? "✓ accepted" : "✗ rejected"}`;
    ctx.fillStyle = last && (last.kind === "birth" || last.kind === "death")
      ? (last.ok ? C.accept : "#a04444") : C.textDim;
    ctx.fillText(summary, padL, cy);

    // Arrow between panel centers — driven by lastRj so it persists across within-model steps.
    // Fades out gradually as more within-model steps elapse since the last RJ.
    if (lastRj) {
      const stepsSince = totalSteps - lastRjAt;
      const fade = Math.max(0, 1 - stepsSince / 40); // fully visible right after RJ, fades over ~40 within-model steps
      if (fade > 0.05) {
        const fromX = lastRj.kind === "birth" ? g1.cx : g2.cx;
        const fromY = lastRj.kind === "birth" ? g1.cy : g2.cy;
        const toX   = lastRj.kind === "birth" ? g2.cx : g1.cx;
        const toY   = lastRj.kind === "birth" ? g2.cy : g1.cy;
        ctx.save();
        ctx.globalAlpha = 0.75 * fade;
        ctx.strokeStyle = lastRj.ok ? C.accept : "#a04444";
        ctx.fillStyle = ctx.strokeStyle;
        ctx.lineWidth = 1.8;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(fromX, fromY); ctx.lineTo(toX, toY);
        ctx.stroke();
        ctx.setLineDash([]);
        const a = Math.atan2(toY - fromY, toX - fromX);
        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(toX - 9 * Math.cos(a - 0.42), toY - 9 * Math.sin(a - 0.42));
        ctx.lineTo(toX - 9 * Math.cos(a + 0.42), toY - 9 * Math.sin(a + 0.42));
        ctx.closePath(); ctx.fill();
        ctx.restore();
      }
    }
  }

  function drawModelBar() {
    const total = Math.max(1, visits1 + visits2);
    const frac1 = visits1 / total;
    const frac2 = visits2 / total;
    const barX = padL, barW = w - padL - padR;
    // Background
    ctx.fillStyle = "#ece9e0";
    ctx.fillRect(barX, barY, barW, barH);
    // Empirical fractions
    ctx.fillStyle = "rgba(107,69,146,0.85)";
    ctx.fillRect(barX, barY, barW * frac1, barH);
    ctx.fillStyle = "rgba(45,122,62,0.85)";
    ctx.fillRect(barX + barW * frac1, barY, barW * frac2, barH);
    // Reference: priors (small marks)
    ctx.strokeStyle = C.target; ctx.lineWidth = 2;
    const refX = barX + barW * p1Prior;
    ctx.beginPath();
    ctx.moveTo(refX, barY - 4); ctx.lineTo(refX, barY + barH + 4);
    ctx.stroke();
    ctx.strokeStyle = C.axis; ctx.lineWidth = 1;
    ctx.strokeRect(barX + 0.5, barY + 0.5, barW - 1, barH - 1);

    // Label
    ctx.fillStyle = "#fff";
    ctx.font = "600 11px -apple-system, sans-serif";
    ctx.textAlign = "left"; ctx.textBaseline = "middle";
    ctx.fillText(`k=1: ${visits1} (${(100*frac1).toFixed(1)}%)`, barX + 6, barY + barH / 2);
    ctx.textAlign = "right";
    ctx.fillText(`k=2: ${visits2} (${(100*frac2).toFixed(1)}%)`, barX + barW - 6, barY + barH / 2);
    // Title above bar
    ctx.fillStyle = C.text;
    ctx.font = "600 11px -apple-system, sans-serif";
    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.fillText("Model-order marginal  (red tick = prior p₁)", barX, barY - 4);
  }

  function draw() {
    prjV.textContent = (+prjIn.value).toFixed(2);
    speedV.textContent = (+speedIn.value).toFixed(0);
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);

    // Header
    ctx.fillStyle = C.text;
    ctx.font = "11px -apple-system, sans-serif";
    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.fillText("Two coupled MH chains; with probability p_rj the step is a between-model proposal instead.", padL, titleY);

    const g1 = drawK1Panel(padL);
    const g2 = drawK2Panel(padL + panelW + panelGap);
    drawRjIndicator(g1, g2);
    drawModelBar();

    // Readout
    const total = visits1 + visits2;
    const a1 = prop1 ? acc1 / prop1 : 0;
    const a2 = prop2 ? acc2 / prop2 : 0;
    const aB = propB ? accB / propB : 0;
    const aD = propD ? accD / propD : 0;
    readout.innerHTML =
      `<div class="row"><span class="lbl">total steps  ·  k=1 / k=2</span><span>${total}  ·  ${visits1} / ${visits2}</span></div>` +
      `<div class="row"><span class="lbl">within-model acceptance</span><span>k=1: ${(100*a1).toFixed(1)}%   ·   k=2: ${(100*a2).toFixed(1)}%</span></div>` +
      `<div class="row"><span class="lbl">between-model acceptance</span><span>birth: ${accB}/${propB} (${(100*aB).toFixed(1)}%)   ·   death: ${accD}/${propD} (${(100*aD).toFixed(1)}%)</span></div>` +
      `<div class="row"><span class="lbl">marginal occupation π(k)</span><span>visits give p̂₁ ≈ ${total ? (visits1/total).toFixed(3) : "—"}, p̂₂ ≈ ${total ? (visits2/total).toFixed(3) : "—"}  (prior p₁ = ${p1Prior})</span></div>`;
  }

  function tick(t) {
    if (!running) { rafId = 0; return; }
    const interval = 1000 / Math.max(1, +speedIn.value);
    if (!lastTick || t - lastTick >= interval) {
      step();
      draw();
      lastTick = t;
    }
    rafId = requestAnimationFrame(tick);
  }

  runBtn.addEventListener("click", () => {
    running = !running;
    runBtn.textContent = running ? "Pause" : "Run";
    if (running && !rafId) { lastTick = 0; rafId = requestAnimationFrame(tick); }
  });
  stepBtn.addEventListener("click", () => { step(); draw(); });
  resetBtn.addEventListener("click", () => { reset(); draw(); });
  prjIn.addEventListener("input", draw);
  speedIn.addEventListener("input", draw);

  reset(); draw();
  rafId = requestAnimationFrame(tick);
})();

// ─────────── State-space relaxation ladder ───────────
(function figFilterLadder() {
  const canvas = document.getElementById("fig-filter-ladder") as HTMLCanvasElement | null;
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const methodIn = document.getElementById("fig-filter-ladder-method") as HTMLSelectElement;
  const methodV = document.getElementById("fig-filter-ladder-method-v") as HTMLElement;
  const nonlinIn = document.getElementById("fig-filter-ladder-nonlinearity") as HTMLInputElement;
  const nonlinV = document.getElementById("fig-filter-ladder-nonlinearity-v") as HTMLElement;
  const readout = document.getElementById("fig-filter-ladder-readout") as HTMLElement;
  const lines = Array.from(document.querySelectorAll("#fig-filter-ladder-steps .algo-line")) as HTMLElement[];

  const labels = {
    kalman: "Kalman",
    ekf: "EKF",
    ukf: "UKF",
    pf: "Particle filter",
  };

  function seeded(seed) {
    let s = seed >>> 0;
    return () => {
      s = (1664525 * s + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }
  function normalFrom(rng) {
    const u = Math.max(1e-9, rng());
    const v = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  function dynamics(x, t, a) {
    return 0.82 * x + a * (0.72 * Math.sin(1.12 * x) + 0.42 * Math.cos(0.36 * t));
  }
  function dynamicsPrime(x, a) {
    return 0.82 + a * 0.8064 * Math.cos(1.12 * x);
  }
  function observe(x, a) {
    return x + a * 0.18 * x * x;
  }
  function observePrime(x, a) {
    return 1 + a * 0.36 * x;
  }
  function simulateData(a) {
    const rng = seeded(8821);
    const T = 46;
    const q = 0.18;
    const r = 0.42;
    let x = -1.2;
    const trueXs = [];
    const ys = [];
    for (let t = 0; t < T; t++) {
      x = dynamics(x, t, a) + Math.sqrt(q) * normalFrom(rng);
      trueXs.push(x);
      ys.push(observe(x, a) + Math.sqrt(r) * normalFrom(rng));
    }
    return { trueXs, ys, q, r };
  }
  function momentsFromSigma(points, weights) {
    const mean = points.reduce((s, x, i) => s + weights[i] * x, 0);
    const variance = points.reduce((s, x, i) => s + weights[i] * (x - mean) ** 2, 0);
    return { mean, variance };
  }
  function runFilter(method, a) {
    const data = simulateData(a);
    const estimates = [];
    const variances = [];
    const essTrace = [];
    let finalParticles = [];
    let finalWeights = [];

    if (method === "pf") {
      const rng = seeded(60493);
      const N = 180;
      let particles = Array.from({ length: N }, () => -0.8 + normalFrom(rng) * 1.4);
      let weights = new Array(N).fill(1 / N);
      for (let t = 0; t < data.ys.length; t++) {
        for (let i = 0; i < N; i++) particles[i] = dynamics(particles[i], t, a) + Math.sqrt(data.q) * normalFrom(rng);
        let totalW = 0;
        for (let i = 0; i < N; i++) {
          const e = data.ys[t] - observe(particles[i], a);
          weights[i] *= Math.exp(-0.5 * e * e / data.r);
          totalW += weights[i];
        }
        if (totalW < 1e-200) {
          weights.fill(1 / N);
        } else {
          for (let i = 0; i < N; i++) weights[i] /= totalW;
        }
        const ess = 1 / weights.reduce((s, wt) => s + wt * wt, 0);
        essTrace.push(ess / N);
        let mean = 0;
        for (let i = 0; i < N; i++) mean += weights[i] * particles[i];
        let variance = 0;
        for (let i = 0; i < N; i++) variance += weights[i] * (particles[i] - mean) ** 2;
        estimates.push(mean);
        variances.push(variance);
        if (ess < N * 0.55) {
          const cum = new Array(N);
          cum[0] = weights[0];
          for (let i = 1; i < N; i++) cum[i] = cum[i - 1] + weights[i];
          const u0 = rng() / N;
          const next = new Array(N);
          let j = 0;
          for (let i = 0; i < N; i++) {
            const u = u0 + i / N;
            while (j < N - 1 && cum[j] < u) j++;
            next[i] = particles[j] + 0.02 * normalFrom(rng);
          }
          particles = next;
          weights = new Array(N).fill(1 / N);
        }
      }
      finalParticles = particles;
      finalWeights = weights;
      return { ...data, estimates, variances, essTrace, finalParticles, finalWeights };
    }

    let m = -0.8;
    let P = 1.2;
    for (let t = 0; t < data.ys.length; t++) {
      let mp = m;
      let Pp = P;
      if (method === "kalman") {
        const F = 0.82;
        mp = F * m;
        Pp = F * P * F + data.q;
        const H = 1;
        const S = H * Pp * H + data.r;
        const K = Pp * H / S;
        m = mp + K * (data.ys[t] - H * mp);
        P = Math.max(0.02, (1 - K * H) * Pp);
      } else if (method === "ekf") {
        const F = dynamicsPrime(m, a);
        mp = dynamics(m, t, a);
        Pp = F * P * F + data.q;
        const H = observePrime(mp, a);
        const S = H * Pp * H + data.r;
        const K = Pp * H / S;
        m = mp + K * (data.ys[t] - observe(mp, a));
        P = Math.max(0.02, (1 - K * H) * Pp);
      } else {
        const spread = Math.sqrt(Math.max(0.001, P));
        const weights = [0.5, 0.25, 0.25];
        const sigma = [m, m + spread, m - spread];
        const pred = sigma.map(x => dynamics(x, t, a));
        const predMom = momentsFromSigma(pred, weights);
        mp = predMom.mean;
        Pp = predMom.variance + data.q;
        const spread2 = Math.sqrt(Math.max(0.001, Pp));
        const sigma2 = [mp, mp + spread2, mp - spread2];
        const obsPts = sigma2.map(x => observe(x, a));
        const obsMom = momentsFromSigma(obsPts, weights);
        const S = obsMom.variance + data.r;
        const Cxy = sigma2.reduce((s, x, i) => s + weights[i] * (x - mp) * (obsPts[i] - obsMom.mean), 0);
        const K = Cxy / S;
        m = mp + K * (data.ys[t] - obsMom.mean);
        P = Math.max(0.02, Pp - K * S * K);
      }
      estimates.push(m);
      variances.push(P);
      essTrace.push(1);
    }
    return { ...data, estimates, variances, essTrace, finalParticles, finalWeights };
  }
  function drawTrace(xs, yMap, xMap, color, width = 2, dash: number[] = []) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.setLineDash(dash);
    ctx.beginPath();
    xs.forEach((v, i) => {
      const x = xMap(i);
      const y = yMap(v);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.restore();
  }
  function draw() {
    const method = methodIn.value;
    const a = +nonlinIn.value;
    methodV.textContent = labels[method] ?? method;
    nonlinV.textContent = a.toFixed(2);
    lines.forEach((line) => {
      const methods = (line.dataset.methods ?? "").split(/\s+/);
      line.classList.toggle("active", methods.includes(method));
    });

    const result = runFilter(method, a);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, w, h);
    const padL = 44, padR = 20, topY = 18, topH = 255;
    const botY = 302, botH = 90;
    const plotW = w - padL - padR;
    const values = [...result.trueXs, ...result.estimates, ...result.ys];
    let yMin = Math.min(...values) - 0.8;
    let yMax = Math.max(...values) + 0.8;
    if (yMax - yMin < 2) { yMin -= 1; yMax += 1; }
    const xMap = (i) => padL + (i / Math.max(1, result.trueXs.length - 1)) * plotW;
    const yMap = (v) => topY + topH - ((v - yMin) / (yMax - yMin)) * topH;
    drawAxes(ctx, padL, topY, plotW, topH, 8, 5);
    ctx.fillStyle = C.textDim;
    ctx.font = "10px -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("shared nonlinear SSM: x_k=f(x_{k-1})+w,  y_k=h(x_k)+v", padL + 5, topY + 13);

    for (let i = 0; i < result.ys.length; i++) {
      ctx.fillStyle = "rgba(212,105,10,0.45)";
      ctx.beginPath();
      ctx.arc(xMap(i), yMap(result.ys[i]), 2.2, 0, 2 * Math.PI);
      ctx.fill();
    }
    ctx.fillStyle = "rgba(107,69,146,0.14)";
    ctx.beginPath();
    result.estimates.forEach((m, i) => {
      const y = yMap(m + 1.65 * Math.sqrt(Math.max(0.001, result.variances[i])));
      if (i === 0) ctx.moveTo(xMap(i), y); else ctx.lineTo(xMap(i), y);
    });
    for (let i = result.estimates.length - 1; i >= 0; i--) {
      const y = yMap(result.estimates[i] - 1.65 * Math.sqrt(Math.max(0.001, result.variances[i])));
      ctx.lineTo(xMap(i), y);
    }
    ctx.closePath();
    ctx.fill();
    drawTrace(result.trueXs, yMap, xMap, C.prop, 2.1);
    drawTrace(result.estimates, yMap, xMap, C.target, 2.2);

    drawAxes(ctx, padL, botY, plotW, botH, 8, 2);
    ctx.fillStyle = C.textDim;
    ctx.font = "10px -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(method === "pf" ? "ESS/N over time; final particles below" : "posterior uncertainty over time", padL + 5, botY + 13);
    if (method === "pf") {
      drawTrace(result.essTrace, v => botY + botH - v * botH, xMap, C.particle, 2);
      const finalT = result.trueXs.length - 1;
      for (let i = 0; i < result.finalParticles.length; i++) {
        const px = xMap(finalT) - 52 + 104 * ((i * 37) % result.finalParticles.length) / result.finalParticles.length;
        const py = yMap(result.finalParticles[i]);
        if (py < topY || py > topY + topH) continue;
        ctx.fillStyle = "rgba(107,69,146,0.22)";
        ctx.beginPath();
        ctx.arc(px, py, 1.8, 0, 2 * Math.PI);
        ctx.fill();
      }
    } else {
      const sdTrace = result.variances.map(v => Math.sqrt(v));
      const maxSd = Math.max(0.2, ...sdTrace);
      drawTrace(sdTrace.map(v => v / maxSd), v => botY + botH - v * botH, xMap, C.particle, 2);
    }
    const rmse = Math.sqrt(result.trueXs.reduce((s, x, i) => s + (x - result.estimates[i]) ** 2, 0) / result.trueXs.length);
    const finalSd = Math.sqrt(result.variances[result.variances.length - 1]);
    const finalEss = result.essTrace[result.essTrace.length - 1];
    readout.innerHTML =
      `<div class="row"><span class="lbl">selected filter</span><span>${labels[method]}</span></div>` +
      `<div class="row"><span class="lbl">relaxed assumption</span><span>${method === "kalman" ? "none: linear-Gaussian approximation" : method === "ekf" ? "nonlinear f,h via Jacobians" : method === "ukf" ? "Jacobian-free nonlinear transform" : "non-Gaussian posterior via samples"}</span></div>` +
      `<div class="row"><span class="lbl">tracking RMSE</span><span>${rmse.toFixed(3)}</span></div>` +
      `<div class="row"><span class="lbl">${method === "pf" ? "final ESS/N" : "final posterior sd"}</span><span>${method === "pf" ? finalEss.toFixed(2) : finalSd.toFixed(2)}</span></div>`;
  }
  methodIn.addEventListener("input", draw);
  nonlinIn.addEventListener("input", draw);
  draw();
})();

// ─────────── Figure 6: EKF and UKF Gaussian approximation ───────────
(function fig6() {
  const canvas = document.getElementById("fig6");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const yIn = document.getElementById("fig6-y");
  const noiseIn = document.getElementById("fig6-noise");
  const spreadIn = document.getElementById("fig6-spread");
  const yV = document.getElementById("fig6-y-v");
  const noiseV = document.getElementById("fig6-noise-v");
  const spreadV = document.getElementById("fig6-spread-v");
  const readout = document.getElementById("fig6-readout");

  function posteriorGrid(yObs, sigmaY, sigmaX) {
    const xs = [], ps = [];
    let z = 0;
    for (let i = 0; i <= 360; i++) {
      const x = -4 + (8 * i) / 360;
      const prior = gaussianPdf(x, 0.35, sigmaX);
      const likelihood = gaussianPdf(yObs, x * x / 4, sigmaY);
      const p = prior * likelihood;
      xs.push(x); ps.push(p); z += p;
    }
    return { xs, ps: ps.map(p => p / z) };
  }
  function moments(grid) {
    let m = 0, v = 0, z = grid.ps.reduce((a, b) => a + b, 0);
    for (let i = 0; i < grid.xs.length; i++) m += grid.xs[i] * grid.ps[i] / z;
    for (let i = 0; i < grid.xs.length; i++) v += (grid.xs[i] - m) ** 2 * grid.ps[i] / z;
    return { m, v };
  }
  function drawGaussian(xS, yS, m, s, color, dash = []) {
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.setLineDash(dash);
    ctx.beginPath();
    for (let i = 0; i <= 240; i++) {
      const x = -4 + 8 * i / 240;
      const p = gaussianPdf(x, m, s);
      const px = xS(x), py = yS(p);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke(); ctx.setLineDash([]);
  }
  function draw() {
    const yObs = +yIn.value, sigmaY = +noiseIn.value, sigmaX = +spreadIn.value;
    yV.textContent = yObs.toFixed(2); noiseV.textContent = sigmaY.toFixed(2); spreadV.textContent = sigmaX.toFixed(2);
    const grid = posteriorGrid(yObs, sigmaY, sigmaX);
    const truth = moments(grid);
    const priorMean = 0.35, priorVar = sigmaX * sigmaX;
    const hPrime = priorMean / 2;
    const hMean = priorMean * priorMean / 4;
    const ekfVar = 1 / (1 / priorVar + (hPrime * hPrime) / (sigmaY * sigmaY));
    const ekfMean = priorMean + ekfVar * hPrime * (yObs - hMean) / (sigmaY * sigmaY);
    const sigmaPts = [priorMean, priorMean + sigmaX, priorMean - sigmaX];
    const ys = sigmaPts.map(x => x * x / 4);
    const yBar = (ys[0] + ys[1] + ys[2]) / 3;
    let py = sigmaY * sigmaY, pxy = 0;
    for (let i = 0; i < 3; i++) {
      py += (ys[i] - yBar) ** 2 / 3;
      pxy += (sigmaPts[i] - priorMean) * (ys[i] - yBar) / 3;
    }
    const gain = pxy / py;
    const ukfMean = priorMean + gain * (yObs - yBar);
    const ukfVar = Math.max(0.04, priorVar - gain * py * gain);

    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
    const padL = 42, padR = 18, padT = 18, padB = 34;
    const plotW = w - padL - padR, plotH = h - padT - padB;
    const maxP = Math.max(...grid.ps) * 1.15;
    const xS = x => padL + ((x + 4) / 8) * plotW;
    const yS = p => padT + plotH - (p / maxP) * plotH;
    ctx.strokeStyle = C.axis; ctx.strokeRect(padL, padT, plotW, plotH);
    ctx.beginPath();
    for (let i = 0; i < grid.xs.length; i++) {
      const px = xS(grid.xs[i]), py2 = yS(grid.ps[i]);
      if (i === 0) ctx.moveTo(px, py2); else ctx.lineTo(px, py2);
    }
    ctx.strokeStyle = C.target; ctx.lineWidth = 2.4; ctx.stroke();
    drawGaussian(xS, yS, ekfMean, Math.sqrt(ekfVar), C.prop, [5, 4]);
    drawGaussian(xS, yS, ukfMean, Math.sqrt(ukfVar), C.particle, [2, 3]);
    ctx.fillStyle = C.textDim; ctx.font = "10px -apple-system, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "top";
    for (let x = -4; x <= 4; x += 2) ctx.fillText(x.toString(), xS(x), padT + plotH + 4);
    for (const x of sigmaPts) {
      ctx.fillStyle = "rgba(107,69,146,0.55)";
      ctx.beginPath(); ctx.arc(xS(x), yS(0) - 8, 4, 0, 2 * Math.PI); ctx.fill();
    }
    readout.innerHTML =
      `<div class="row"><span class="lbl">true posterior mean / sd</span><span>${truth.m.toFixed(2)} / ${Math.sqrt(truth.v).toFixed(2)}</span></div>` +
      `<div class="row"><span class="lbl">EKF mean / sd</span><span>${ekfMean.toFixed(2)} / ${Math.sqrt(ekfVar).toFixed(2)}</span></div>` +
      `<div class="row"><span class="lbl">UKF mean / sd</span><span>${ukfMean.toFixed(2)} / ${Math.sqrt(ukfVar).toFixed(2)}</span></div>`;
  }
  yIn.addEventListener("input", draw);
  noiseIn.addEventListener("input", draw);
  spreadIn.addEventListener("input", draw);
  draw();
})();

// ─────────── Figure 3: Bootstrap particle filter ───────────
(function fig3() {
  const canvas = document.getElementById("fig3");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);

  const nIn = document.getElementById("fig3-n");
  const svIn = document.getElementById("fig3-sv");
  const essIn = document.getElementById("fig3-ess");
  const nV = document.getElementById("fig3-n-v");
  const svV = document.getElementById("fig3-sv-v");
  const essV = document.getElementById("fig3-ess-v");
  const sisBtn = document.getElementById("fig3-sis");
  const pfBtn = document.getElementById("fig3-pf");
  const runBtn = document.getElementById("fig3-runpause");
  const resetBtn = document.getElementById("fig3-reset");
  const readout = document.getElementById("fig3-readout");

  // Classic nonlinear SSM (Gordon, Salmond, Smith 1993):
  // x_k = 0.5 x_{k-1} + 25 x_{k-1}/(1 + x_{k-1}²) + 8 cos(1.2 k) + w_k,  w_k ~ N(0, σ_w²)
  // y_k = x_k²/20 + v_k,                                                   v_k ~ N(0, σ_v²)
  // The observation y is symmetric in x — both ±|x| produce the same y. Bootstrap
  // particle filter handles this multimodality fine; an EKF would fail badly.
  const sigma_w = Math.sqrt(10);
  function fDyn(x, k) { return 0.5 * x + 25 * x / (1 + x * x) + 8 * Math.cos(1.2 * k); }
  function hObs(x) { return x * x / 20; }

  // State across the animation.
  let k = 0;
  let trueX = 0.1;
  let history = []; // {k, trueX, y, mean, particles: [...]}
  let particles = [];
  let weights = [];
  let running = true;
  let resampleCount = 0;
  let rafId = null;
  let useResampling = true;

  function initParticles() {
    const N = +nIn.value;
    particles = new Array(N);
    weights = new Array(N).fill(1 / N);
    for (let i = 0; i < N; i++) particles[i] = gaussianSample(0, 4);
  }

  function reset() {
    k = 0;
    trueX = 0.1;
    history = [];
    initParticles();
    resampleCount = 0;
  }

  function step() {
    k++;
    // Advance true state.
    trueX = fDyn(trueX, k) + gaussianSample(0, sigma_w);
    const sigma_v = +svIn.value;
    const y = hObs(trueX) + gaussianSample(0, sigma_v);

    // Propagate particles through dynamics.
    const N = particles.length;
    for (let i = 0; i < N; i++) {
      particles[i] = fDyn(particles[i], k) + gaussianSample(0, sigma_w);
    }
    // Reweight by likelihood.
    let totalW = 0;
    for (let i = 0; i < N; i++) {
      const err = y - hObs(particles[i]);
      weights[i] = weights[i] * Math.exp(-0.5 * (err / sigma_v) ** 2);
      totalW += weights[i];
    }
    if (totalW < 1e-300) {
      // Underflow — reinitialize (rare for reasonable σ_v).
      for (let i = 0; i < N; i++) weights[i] = 1 / N;
      totalW = 1;
    }
    for (let i = 0; i < N; i++) weights[i] /= totalW;

    // ESS-based resampling.
    let ess = 0;
    for (let i = 0; i < N; i++) ess += weights[i] * weights[i];
    ess = 1 / ess;
    let didResample = false;
    if (useResampling && ess < (+essIn.value) * N) {
      // Systematic resampling.
      const cum = new Array(N);
      cum[0] = weights[0];
      for (let i = 1; i < N; i++) cum[i] = cum[i - 1] + weights[i];
      const u0 = Math.random() / N;
      const newP = new Array(N);
      let j = 0;
      for (let i = 0; i < N; i++) {
        const u = u0 + i / N;
        while (j < N - 1 && cum[j] < u) j++;
        newP[i] = particles[j];
      }
      particles = newP;
      for (let i = 0; i < N; i++) weights[i] = 1 / N;
      didResample = true;
      resampleCount++;
    }

    // Posterior mean.
    let mean = 0;
    for (let i = 0; i < N; i++) mean += weights[i] * particles[i];

    let maxW = 1e-9;
    for (let i = 0; i < N; i++) if (weights[i] > maxW) maxW = weights[i];
    history.push({ k, trueX, y, mean, particles: particles.slice(), weights: weights.slice(), maxW, resampled: didResample, ess });
    if (history.length > 80) history.shift();
  }

  // Layout: top = state trace; bottom = particle scatter.
  const padL = 38, padR = 14, padT = 16, padB = 30;
  const topH = (h - padT - padB - 12) * 0.55;
  const botH = (h - padT - padB - 12) * 0.45;
  const plotW = w - padL - padR;
  const topY = padT;
  const botY = padT + topH + 12;

  const xRange = 80; // last 80 time steps
  function tS(t, tStart) { return padL + ((t - tStart) / xRange) * plotW; }

  function draw() {
    nV.textContent = (+nIn.value).toString();
    svV.textContent = (+svIn.value).toFixed(2);
    essV.textContent = (+essIn.value).toFixed(2);
    sisBtn.classList.toggle("active", !useResampling);
    pfBtn.classList.toggle("active", useResampling);

    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);

    // Determine y-range (state) from history.
    let yMin = -25, yMax = 25;
    if (history.length > 0) {
      for (const h of history) {
        if (h.trueX < yMin) yMin = h.trueX;
        if (h.trueX > yMax) yMax = h.trueX;
        for (const p of h.particles) {
          if (p < yMin) yMin = p;
          if (p > yMax) yMax = p;
        }
      }
      yMin -= 2; yMax += 2;
    }
    function yS_state(v) { return topY + topH - ((v - yMin) / (yMax - yMin)) * topH; }

    // Grid for state trace
    ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
    for (let i = 0; i <= 6; i++) {
      const py = topY + (i / 6) * topH;
      ctx.beginPath(); ctx.moveTo(padL, py); ctx.lineTo(padL + plotW, py); ctx.stroke();
    }
    ctx.strokeStyle = C.axis; ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(padL, topY); ctx.lineTo(padL, topY + topH); ctx.lineTo(padL + plotW, topY + topH);
    ctx.stroke();

    const tStart = history.length > 0 ? Math.max(0, history[history.length - 1].k - xRange + 1) : 0;

    // Particle cloud as dots
    for (let i = 0; i < history.length; i++) {
      const ent = history[i];
      const px = tS(ent.k, tStart);
      if (px < padL || px > padL + plotW) continue;
      const maxW = ent.maxW;
      for (let p = 0; p < ent.particles.length; p++) {
        const py = yS_state(ent.particles[p]);
        const w = ent.weights[p] / maxW;
        ctx.fillStyle = `rgba(107,69,146,${0.10 + 0.4 * Math.sqrt(w)})`;
        ctx.beginPath(); ctx.arc(px, py, 1.4, 0, 2 * Math.PI); ctx.fill();
      }
    }

    // True state line
    ctx.strokeStyle = C.prop; ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let i = 0; i < history.length; i++) {
      const e = history[i];
      const px = tS(e.k, tStart), py = yS_state(e.trueX);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    // Posterior mean
    ctx.strokeStyle = C.target; ctx.lineWidth = 1.5; ctx.setLineDash([2, 3]);
    ctx.beginPath();
    for (let i = 0; i < history.length; i++) {
      const e = history[i];
      const px = tS(e.k, tStart), py = yS_state(e.mean);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Axis labels
    ctx.fillStyle = C.textDim; ctx.font = "10px -apple-system, sans-serif";
    ctx.textBaseline = "top"; ctx.textAlign = "left";
    ctx.fillText("state x(k)  (particles in purple, true in blue, posterior mean dashed)", padL + 4, topY + 3);

    // Bottom plot: observations and likelihood at current step.
    const cur = history[history.length - 1];
    if (cur) {
      // ESS over time
      ctx.strokeStyle = C.axis; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padL, botY); ctx.lineTo(padL, botY + botH); ctx.lineTo(padL + plotW, botY + botH);
      ctx.stroke();
      const N = +nIn.value;
      // Resample threshold line
      const thresh = (+essIn.value) * N;
      const yT = botY + botH - (thresh / N) * botH;
      ctx.strokeStyle = "rgba(184,65,42,0.6)"; ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(padL, yT); ctx.lineTo(padL + plotW, yT); ctx.stroke();
      ctx.setLineDash([]);
      // ESS bars
      for (let i = 0; i < history.length; i++) {
        const e = history[i];
        const px = tS(e.k, tStart);
        const eh = (e.ess / N) * botH;
        ctx.fillStyle = e.resampled ? "rgba(184,65,42,0.7)" : "rgba(107,69,146,0.55)";
        ctx.fillRect(px - 2, botY + botH - eh, 4, eh);
      }
      ctx.fillStyle = C.textDim; ctx.font = "10px -apple-system, sans-serif";
      ctx.textBaseline = "top"; ctx.textAlign = "left";
      ctx.fillText(useResampling ? `ESS / N   (red bar = resampled this step, dashed = threshold)` : `ESS / N   (SIS: no resampling, so weights can collapse)`, padL + 4, botY + 3);

      // y-axis ticks
      ctx.textAlign = "right"; ctx.textBaseline = "middle";
      ctx.fillText("0", padL - 2, botY + botH);
      ctx.fillText("1", padL - 2, botY);

      readout.innerHTML =
        `<div class="row"><span class="lbl">step k</span><span>${cur.k}</span></div>` +
        `<div class="row"><span class="lbl">true x(k)</span><span>${cur.trueX.toFixed(3)}</span></div>` +
        `<div class="row"><span class="lbl">observation y(k)  =  x²/20 + noise</span><span>${cur.y.toFixed(3)}</span></div>` +
        `<div class="row"><span class="lbl">posterior mean</span><span style="color:${C.target};font-weight:600">${cur.mean.toFixed(3)}</span></div>` +
        `<div class="row"><span class="lbl">ESS / N</span><span>${(cur.ess / N).toFixed(2)}</span></div>` +
        `<div class="row"><span class="lbl">mode / resamplings so far</span><span>${useResampling ? "particle filter" : "SIS"} / ${resampleCount}</span></div>`;
    } else {
      readout.innerHTML = `<div class="row"><span class="lbl">status</span><span>initialized</span></div>`;
    }
  }

  let last = 0;
  function tick(t) {
    if (!running) { rafId = 0; return; }
    if (t - last > 200) {
      step();
      draw();
      last = t;
    }
    rafId = requestAnimationFrame(tick);
  }

  runBtn.addEventListener("click", () => {
    running = !running;
    runBtn.textContent = running ? "Pause" : "Run";
    if (running && !rafId) { last = 0; rafId = requestAnimationFrame(tick); }
  });
  sisBtn.addEventListener("click", () => { useResampling = false; reset(); draw(); });
  pfBtn.addEventListener("click", () => { useResampling = true; reset(); draw(); });
  resetBtn.addEventListener("click", () => { reset(); draw(); });
  nIn.addEventListener("input", () => { reset(); draw(); });
  svIn.addEventListener("input", () => { draw(); });
  essIn.addEventListener("input", () => { draw(); });

  reset();
  draw();
  rafId = requestAnimationFrame(tick);
})();

// ─────────── Figure 13b: Simulated annealing on a triple-well potential ───────────
(function figSA() {
  const canvas = document.getElementById("fig-sa") as HTMLCanvasElement | null;
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const t0In = document.getElementById("fig-sa-t0") as HTMLInputElement;
  const t0V = document.getElementById("fig-sa-t0-v") as HTMLElement;
  const alphaIn = document.getElementById("fig-sa-alpha") as HTMLInputElement;
  const alphaV = document.getElementById("fig-sa-alpha-v") as HTMLElement;
  const speedIn = document.getElementById("fig-sa-speed") as HTMLInputElement;
  const speedV = document.getElementById("fig-sa-speed-v") as HTMLElement;
  const runBtn = document.getElementById("fig-sa-runpause") as HTMLButtonElement;
  const stepBtn = document.getElementById("fig-sa-step") as HTMLButtonElement;
  const resetBtn = document.getElementById("fig-sa-reset") as HTMLButtonElement;
  const readout = document.getElementById("fig-sa-readout") as HTMLElement;

  // Triple-well potential: -log of a 3-component Gaussian mixture.
  // Wells (left → right): shallow at -2.5, medium at 0, deepest at 2.8.
  const wells = [
    { mu: -2.5, sigma: 0.7, weight: 0.35 },
    { mu: 0.0, sigma: 0.6, weight: 0.20 },
    { mu: 2.8, sigma: 0.7, weight: 1.00 },
  ];
  function mix(x) {
    return wells.reduce((s, c) => s + c.weight * Math.exp(-0.5 * ((x - c.mu) / c.sigma) ** 2) / (c.sigma * Math.sqrt(2 * Math.PI)), 0);
  }
  function U(x) { return -Math.log(mix(x)); }

  const xMin = -5, xMax = 5;
  const proposalSigma = 0.55;
  // Sample U on a grid for plotting.
  const N = 220;
  const xs = Array.from({ length: N }, (_, i) => xMin + (i / (N - 1)) * (xMax - xMin));
  const Us = xs.map(U);
  const uMin = Math.min(...Us), uMax = Math.max(...Us);
  const uRange = uMax - uMin;

  // State.
  let mh = { x: 0, accept: 0, total: 0, hist: new Array<number>(60).fill(0), trail: [] as number[] };
  let sa = { x: 0, accept: 0, total: 0, T: 3, trail: [] as number[], traceT: [] as number[] };
  let running = true, rafId = 0;

  function resetAll() {
    mh = { x: 0, accept: 0, total: 0, hist: new Array<number>(60).fill(0), trail: [] };
    sa = { x: 0, accept: 0, total: 0, T: +t0In.value, trail: [], traceT: [] };
    draw();
  }

  function stepOnce() {
    // MH at fixed T=1 (samples π).
    {
      const prop = mh.x + gaussianSample(0, proposalSigma);
      const logR = -(U(prop) - U(mh.x));
      if (Math.log(Math.random()) < logR) { mh.x = prop; mh.accept++; }
      mh.total++;
      mh.trail.push(mh.x);
      if (mh.trail.length > 380) mh.trail.shift();
      if (mh.x >= xMin && mh.x <= xMax) {
        const bin = Math.floor((mh.x - xMin) / (xMax - xMin) * mh.hist.length);
        mh.hist[Math.max(0, Math.min(mh.hist.length - 1, bin))]++;
      }
    }
    // SA at current T.
    {
      const prop = sa.x + gaussianSample(0, proposalSigma);
      const logR = -(U(prop) - U(sa.x)) / Math.max(sa.T, 1e-4);
      if (Math.log(Math.random()) < logR) { sa.x = prop; sa.accept++; }
      sa.total++;
      sa.trail.push(sa.x);
      sa.traceT.push(sa.T);
      if (sa.trail.length > 380) { sa.trail.shift(); sa.traceT.shift(); }
      const alpha = +alphaIn.value;
      sa.T = Math.max(1e-3, sa.T * alpha);
    }
  }

  // Layout: top potential panel (full width), then two trace panels side by side.
  const pad = { l: 38, r: 14, t: 14, b: 24 };
  const topH = 160;
  const traceY = pad.t + topH + 26;
  const traceH = h - traceY - pad.b;
  const traceMidX = w / 2;
  const traceLeftX = pad.l, traceLeftW = traceMidX - pad.l - 8;
  const traceRightX = traceMidX + 8, traceRightW = w - pad.r - traceRightX;

  function mapX(x, x0, x1, vMin, vMax) {
    return x0 + (x - vMin) / (vMax - vMin) * (x1 - x0);
  }

  function draw() {
    t0V.textContent = (+t0In.value).toFixed(1);
    alphaV.textContent = (+alphaIn.value).toFixed(3);
    speedV.textContent = (+speedIn.value).toFixed(0);
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);

    // ── Top: U(x) curve.
    const px0 = pad.l, px1 = w - pad.r, py0 = pad.t, py1 = pad.t + topH;
    drawAxes(ctx, px0, py0, px1 - px0, py1 - py0, 10, 4);
    ctx.fillStyle = C.textDim;
    ctx.font = "11px -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("U(x)", px0 + 4, py0 + 12);
    ctx.textAlign = "right";
    ctx.fillText("x", px1 - 4, py1 - 4);
    // U curve.
    ctx.strokeStyle = C.text; ctx.lineWidth = 1.4;
    ctx.beginPath();
    xs.forEach((x, i) => {
      const X = mapX(x, px0, px1, xMin, xMax);
      const Y = py1 - (Us[i] - uMin) / uRange * (py1 - py0 - 14) - 7;
      i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
    });
    ctx.stroke();
    // MH histogram (normalized so peak ≈ topH/3).
    const maxBin = Math.max(1, ...mh.hist);
    const bw = (px1 - px0) / mh.hist.length;
    ctx.fillStyle = "rgba(31,74,140,0.20)";
    mh.hist.forEach((c, i) => {
      const X = px0 + i * bw;
      const ht = c / maxBin * 36;
      ctx.fillRect(X, py1 - ht, bw - 1, ht);
    });
    // Markers for both walkers' current positions.
    function marker(x, color, label) {
      const X = mapX(x, px0, px1, xMin, xMax);
      const Y = py1 - (U(x) - uMin) / uRange * (py1 - py0 - 14) - 7;
      ctx.fillStyle = color; ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(X, Y, 5.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = color;
      ctx.font = "600 11px -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(label, X, Y - 10);
    }
    marker(mh.x, C.prop, "MH");
    marker(sa.x, C.target, "SA");

    // ── Bottom-left: MH trace.
    drawAxes(ctx, traceLeftX, traceY, traceLeftW, traceH, 6, 3);
    ctx.fillStyle = C.textDim; ctx.textAlign = "left";
    ctx.fillText(`MH at T=1 (samples π)`, traceLeftX + 4, traceY + 12);
    if (mh.trail.length > 1) {
      ctx.strokeStyle = C.prop; ctx.lineWidth = 1.1;
      ctx.beginPath();
      mh.trail.forEach((v, i) => {
        const X = traceLeftX + (i / (mh.trail.length - 1 || 1)) * traceLeftW;
        const Y = traceY + traceH - (v - xMin) / (xMax - xMin) * traceH;
        i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
      });
      ctx.stroke();
    }
    // Bottom-right: SA trace + T overlay.
    drawAxes(ctx, traceRightX, traceY, traceRightW, traceH, 6, 3);
    ctx.fillStyle = C.textDim; ctx.textAlign = "left";
    ctx.fillText(`SA (cooling, finds peak)`, traceRightX + 4, traceY + 12);
    if (sa.trail.length > 1) {
      ctx.strokeStyle = C.target; ctx.lineWidth = 1.1;
      ctx.beginPath();
      sa.trail.forEach((v, i) => {
        const X = traceRightX + (i / (sa.trail.length - 1 || 1)) * traceRightW;
        const Y = traceY + traceH - (v - xMin) / (xMax - xMin) * traceH;
        i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
      });
      ctx.stroke();
      // T overlay (log scale).
      const t0 = +t0In.value;
      const logTMin = Math.log(1e-3), logTMax = Math.log(Math.max(t0, 5));
      ctx.strokeStyle = C.particle; ctx.lineWidth = 1.0; ctx.setLineDash([4, 3]);
      ctx.beginPath();
      sa.traceT.forEach((T, i) => {
        const X = traceRightX + (i / (sa.traceT.length - 1 || 1)) * traceRightW;
        const lt = Math.log(Math.max(T, 1e-4));
        const Y = traceY + traceH - (lt - logTMin) / (logTMax - logTMin) * traceH;
        i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.particle; ctx.font = "10px -apple-system, sans-serif"; ctx.textAlign = "right";
      ctx.fillText(`T (log)`, traceRightX + traceRightW - 4, traceY + 22);
    }

    const mhRate = mh.total ? mh.accept / mh.total : 0;
    const saRate = sa.total ? sa.accept / sa.total : 0;
    readout.innerHTML = `
      <div class="row"><span class="lbl">SA temperature T</span><span>${sa.T.toFixed(3)}</span></div>
      <div class="row"><span class="lbl">MH acceptance</span><span>${(mhRate * 100).toFixed(0)}%</span></div>
      <div class="row"><span class="lbl">SA acceptance</span><span>${(saRate * 100).toFixed(0)}%</span></div>
      <div class="row"><span class="lbl">SA position</span><span>${sa.x.toFixed(2)}</span></div>
      <div class="row"><span class="lbl">global min at</span><span>x ≈ ${wells[2].mu.toFixed(1)}</span></div>
    `;
  }

  function tick() {
    if (running) {
      const sps = +speedIn.value;
      const stepsPerFrame = Math.max(1, Math.round(sps / 30));
      for (let i = 0; i < stepsPerFrame; i++) stepOnce();
      draw();
    }
    rafId = requestAnimationFrame(tick);
  }

  runBtn.addEventListener("click", () => {
    running = !running;
    runBtn.textContent = running ? "Pause" : "Run";
  });
  stepBtn.addEventListener("click", () => { stepOnce(); draw(); });
  resetBtn.addEventListener("click", resetAll);
  t0In.addEventListener("input", () => { t0V.textContent = (+t0In.value).toFixed(1); resetAll(); });
  alphaIn.addEventListener("input", () => { alphaV.textContent = (+alphaIn.value).toFixed(3); });
  speedIn.addEventListener("input", () => { speedV.textContent = (+speedIn.value).toFixed(0); });

  resetAll();
  tick();
})();
