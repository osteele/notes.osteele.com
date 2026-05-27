// Interactive figures for the KL / Free Energy / Variational Inference explainer.

function attachHorizontalDrag(opts) {
  const { canvas, input, xToValue, hitTest, onStart, cursor = "ew-resize" } = opts;
  canvas.style.touchAction = "none";
  const min = parseFloat(input.min), max = parseFloat(input.max);
  const step = parseFloat(input.step) || 0;
  const clientToLocal = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const apply = (x, y) => {
    let v = xToValue(x, y);
    v = Math.max(min, Math.min(max, v));
    if (step > 0) v = Math.round((v - min) / step) * step + min;
    const s = step > 0 ? v.toFixed(Math.max(0, -Math.floor(Math.log10(step)))) : String(v);
    if (input.value !== s) {
      input.value = s;
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
  };
  let dragging = false;
  canvas.addEventListener("pointerdown", (e) => {
    const { x, y } = clientToLocal(e);
    if (hitTest && !hitTest(x, y)) return;
    dragging = true;
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = cursor;
    if (onStart) onStart();
    apply(x, y);
    e.preventDefault();
  });
  canvas.addEventListener("pointermove", (e) => {
    const { x, y } = clientToLocal(e);
    if (dragging) { apply(x, y); return; }
    canvas.style.cursor = (!hitTest || hitTest(x, y)) ? cursor : "";
  });
  const end = (e) => {
    if (!dragging) return;
    dragging = false;
    try { canvas.releasePointerCapture(e.pointerId); } catch {}
  };
  canvas.addEventListener("pointerup", end);
  canvas.addEventListener("pointercancel", end);
  canvas.addEventListener("pointerleave", () => { if (!dragging) canvas.style.cursor = ""; });
}

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
  prior: "#2d7a3e",
  priorFill: "rgba(45,122,62,0.22)",
  lik: "#d4690a",
  likFill: "rgba(212,105,10,0.22)",
  post: "#1f4a8c",
  postFill: "rgba(31,74,140,0.30)",
  klBand: "rgba(184,65,42,0.55)",
  fBand: "rgba(31,74,140,0.55)",
  integrand: "rgba(107,69,146,0.40)",
  integrandLine: "#6b4592",
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
function drawAxes(ctx, x, y, w, h, verticals = 8, horizontals = 4) {
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

function gaussianPdf(x, mu, sigma) {
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
}

// Closed-form KL between two 1-D Gaussians.
function klGauss(mq, sq, mp, sp) {
  return Math.log(sp / sq) + (sq * sq + (mq - mp) * (mq - mp)) / (2 * sp * sp) - 0.5;
}

// Entropy of N(μ, σ²)
function entropyGauss(sigma) {
  return 0.5 * Math.log(2 * Math.PI * Math.E * sigma * sigma);
}

const viModel = { mu0: 0, sigma0: 1.5, y: 2, sl: 1 };

function posteriorParams(y = viModel.y, sl = viModel.sl) {
  const tau0 = 1 / (viModel.sigma0 * viModel.sigma0);
  const tauL = 1 / (sl * sl);
  const tauP = tau0 + tauL;
  return [(tau0 * viModel.mu0 + tauL * y) / tauP, Math.sqrt(1 / tauP)];
}

function logEvidenceValue(y = viModel.y, sl = viModel.sl) {
  const sigma = Math.sqrt(viModel.sigma0 * viModel.sigma0 + sl * sl);
  return Math.log(gaussianPdf(y, viModel.mu0, sigma));
}

function freeEnergyValue(y, sl, mq, sq) {
  const ePrior = -0.5 * Math.log(2 * Math.PI * viModel.sigma0 * viModel.sigma0) -
                 (sq * sq + (mq - viModel.mu0) ** 2) / (2 * viModel.sigma0 * viModel.sigma0);
  const eLik = -0.5 * Math.log(2 * Math.PI * sl * sl) -
               (sq * sq + (y - mq) ** 2) / (2 * sl * sl);
  return ePrior + eLik + entropyGauss(sq);
}

// ─────────── Figure 1b: Variational identity derivation ───────────
(function figIdentity() {
  const canvas = document.getElementById("fig-identity");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const stepIn = document.getElementById("fig-identity-step");
  const mqIn = document.getElementById("fig-identity-mq");
  const sqIn = document.getElementById("fig-identity-sq");
  const stepV = document.getElementById("fig-identity-step-v");
  const mqV = document.getElementById("fig-identity-mq-v");
  const sqV = document.getElementById("fig-identity-sq-v");
  const readout = document.getElementById("fig-identity-readout");
  const xMin = -5, xMax = 5;
  const padL = 42, padR = 20, padT = 20, padB = 28;
  const plotW = (w - padL - padR) * 0.58;
  const plotH = h - padT - padB;
  const barX = padL + plotW + 34;
  const barW = w - barX - padR;

  function drawBar(x, top, height, lnPy, F, kl) {
    const low = Math.min(F, lnPy) - 0.5;
    const high = lnPy + 0.45;
    const yS = (v) => top + height - ((v - low) / (high - low)) * height;
    const railX = x + barW * 0.18;
    const railW = 56;
    ctx.fillStyle = "#f3f1ec";
    ctx.fillRect(railX, top, railW, height);
    ctx.strokeStyle = C.axis;
    ctx.strokeRect(railX, top, railW, height);
    const yF = yS(F), yL = yS(lnPy);
    ctx.fillStyle = C.fBand;
    ctx.fillRect(railX, yF, railW, top + height - yF);
    ctx.fillStyle = C.klBand;
    ctx.fillRect(railX, yL, railW, yF - yL);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(railX - 8, yL);
    ctx.lineTo(railX + railW + 8, yL);
    ctx.stroke();
    ctx.fillStyle = C.text;
    ctx.font = "11px -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`ln p(y) ${lnPy.toFixed(2)}`, railX + railW + 14, yL);
    ctx.fillText(`F ${F.toFixed(2)}`, railX + railW + 14, yF);
    ctx.fillText(`KL ${kl.toFixed(2)}`, railX + railW + 14, (yL + yF) / 2);
  }

  function draw() {
    const step = +stepIn.value;
    const mq = +mqIn.value;
    const sq = +sqIn.value;
    stepV.textContent = String(step + 1);
    mqV.textContent = mq.toFixed(2);
    sqV.textContent = sq.toFixed(2);
    document.querySelectorAll("[data-vi-step]").forEach((el) => {
      el.classList.toggle("is-active", Number(el.dataset.viStep) === step);
    });
    const [mp, sp] = posteriorParams();
    const lnPy = logEvidenceValue();
    const F = freeEnergyValue(viModel.y, viModel.sl, mq, sq);
    const kl = klGauss(mq, sq, mp, sp);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = C.grid;
    for (let i = 0; i <= 10; i++) {
      const x = padL + (i / 10) * plotW;
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, padT + plotH);
      ctx.stroke();
    }
    const xS = (x) => padL + ((x - xMin) / (xMax - xMin)) * plotW;
    const xs = [], qv = [], pv = [];
    let maxD = 0;
    for (let i = 0; i <= 220; i++) {
      const x = xMin + (i / 220) * (xMax - xMin);
      const q = gaussianPdf(x, mq, sq);
      const p = gaussianPdf(x, mp, sp);
      xs.push(x); qv.push(q); pv.push(p); maxD = Math.max(maxD, q, p);
    }
    const yS = (d) => padT + plotH - (d / (maxD * 1.15)) * plotH;
    function curve(values, color, fill) {
      ctx.beginPath();
      values.forEach((v, i) => i ? ctx.lineTo(xS(xs[i]), yS(v)) : ctx.moveTo(xS(xs[i]), yS(v)));
      if (fill) {
        ctx.lineTo(xS(xMax), padT + plotH);
        ctx.lineTo(xS(xMin), padT + plotH);
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
      }
      ctx.beginPath();
      values.forEach((v, i) => i ? ctx.lineTo(xS(xs[i]), yS(v)) : ctx.moveTo(xS(xs[i]), yS(v)));
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    curve(pv, C.post, C.postFill);
    curve(qv, C.q, C.qFill);
    const trickX = padL + plotW * 0.12;
    const trickY = padT + 12;
    const qLen = 28 + 48 * Math.min(1, sq / 3);
    ctx.fillStyle = "rgba(255,255,255,0.86)";
    ctx.fillRect(trickX - 8, trickY - 8, 172, 54);
    ctx.fillStyle = C.text;
    ctx.font = "12px -apple-system, sans-serif";
    ctx.fillText(step < 2 ? "q weights the integral" : "multiply by q / q", trickX, trickY);
    ctx.fillStyle = C.q;
    ctx.fillRect(trickX, trickY + 18, qLen, 7);
    ctx.fillRect(trickX, trickY + 32, qLen, 7);
    ctx.fillStyle = C.textDim;
    ctx.fillText("q", trickX + qLen + 7, trickY + 20);
    ctx.fillText("q", trickX + qLen + 7, trickY + 34);
    drawBar(barX, padT + 18, plotH - 36, lnPy, F, kl);
    readout.innerHTML =
      `<div class="row"><span class="lbl">highlighted derivation line</span><span>${step + 1} of 5</span></div>` +
      `<div class="row"><span class="lbl">identity check</span><span>F + KL = ${(F + kl).toFixed(4)}; ln p(y) = ${lnPy.toFixed(4)}</span></div>`;
  }
  [stepIn, mqIn, sqIn].forEach((el) => el.addEventListener("input", draw));
  draw();
  attachHorizontalDrag({
    canvas, input: mqIn,
    hitTest: (x, y) => x >= padL && x <= padL + plotW && y >= padT && y <= padT + plotH,
    xToValue: (x) => xMin + ((x - padL) / plotW) * (xMax - xMin),
  });
})();

// ─────────── Figure 1a: Bimodal target and KL direction ───────────
(function figMixtureKl() {
  const canvas = document.getElementById("fig-mixture-kl");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const mqIn = document.getElementById("fig-mixture-mq");
  const sqIn = document.getElementById("fig-mixture-sq");
  const mqV = document.getElementById("fig-mixture-mq-v");
  const sqV = document.getElementById("fig-mixture-sq-v");
  const readout = document.getElementById("fig-mixture-kl-readout");
  const buttons = Array.from(document.querySelectorAll("[data-mixture-objective]"));
  let objective = "reverse";
  let path = [];
  const target = (x) => 0.48 * gaussianPdf(x, -2.0, 0.55) + 0.52 * gaussianPdf(x, 1.75, 0.75);
  const xMin = -5, xMax = 5;
  const pad = { l: 44, r: 20, t: 18, b: 32 };
  const plotW = w - pad.l - pad.r;
  const plotH = h - pad.t - pad.b;
  const xs = Array.from({ length: 320 }, (_, i) => xMin + (i / 319) * (xMax - xMin));
  const dx = (xMax - xMin) / (xs.length - 1);
  const xS = (x) => pad.l + ((x - xMin) / (xMax - xMin)) * plotW;

  function loss(m, s) {
    s = Math.max(0.22, s);
    let total = 0;
    for (const x of xs) {
      const q = gaussianPdf(x, m, s);
      const p = Math.max(1e-12, target(x));
      total += objective === "reverse" ? q * Math.log(q / p) : p * Math.log(p / Math.max(1e-12, q));
    }
    return total * dx;
  }
  function step() {
    let m = +mqIn.value, s = +sqIn.value;
    const e = 0.025;
    const gm = (loss(m + e, s) - loss(m - e, s)) / (2 * e);
    const gs = (loss(m, s + e) - loss(m, s - e)) / (2 * e);
    m = clamp(m - 0.18 * gm, -4, 4);
    s = clamp(s - 0.10 * gs, 0.25, 4);
    mqIn.value = m.toFixed(3);
    sqIn.value = s.toFixed(3);
    path.push([m, s]);
  }
  function draw() {
    const mq = +mqIn.value, sq = +sqIn.value;
    mqV.textContent = mq.toFixed(2);
    sqV.textContent = sq.toFixed(2);
    const pVals = xs.map(target);
    const qVals = xs.map((x) => gaussianPdf(x, mq, sq));
    const maxD = Math.max(...pVals, ...qVals) * 1.15;
    const yS = (v) => pad.t + plotH - (v / maxD) * plotH;
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
    drawAxes(ctx, pad.l, pad.t, plotW, plotH, 10, 4);
    function curve(vals, color, fill) {
      ctx.beginPath();
      vals.forEach((v, i) => i ? ctx.lineTo(xS(xs[i]), yS(v)) : ctx.moveTo(xS(xs[i]), yS(v)));
      if (fill) {
        ctx.lineTo(xS(xMax), pad.t + plotH);
        ctx.lineTo(xS(xMin), pad.t + plotH);
        ctx.closePath();
        ctx.fillStyle = fill; ctx.fill();
      }
      ctx.beginPath();
      vals.forEach((v, i) => i ? ctx.lineTo(xS(xs[i]), yS(v)) : ctx.moveTo(xS(xs[i]), yS(v)));
      ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
    }
    curve(pVals, C.p, C.pFill);
    curve(qVals, C.q, C.qFill);
    ctx.strokeStyle = C.integrandLine;
    ctx.lineWidth = 1.4;
    path.forEach(([m, s], i) => {
      if (i === 0) return;
      ctx.globalAlpha = 0.25 + 0.65 * i / Math.max(1, path.length - 1);
      ctx.beginPath();
      ctx.moveTo(xS(path[i - 1][0]), yS(gaussianPdf(path[i - 1][0], path[i - 1][0], path[i - 1][1])));
      ctx.lineTo(xS(m), yS(gaussianPdf(m, m, s)));
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
    const value = loss(mq, sq);
    readout.innerHTML =
      `<div class="row"><span class="lbl">objective</span><span>${objective === "reverse" ? "KL[q || p]: mode-seeking" : "KL[p || q]: mass-covering"}</span></div>` +
      `<div class="row"><span class="lbl">current value</span><span>${value.toFixed(3)} nats</span></div>`;
  }
  buttons.forEach((button) => button.addEventListener("click", () => {
    objective = button.dataset.mixtureObjective;
    buttons.forEach((b) => b.classList.toggle("active", b === button));
    path = [[+mqIn.value, +sqIn.value]];
    draw();
  }));
  let optTimer = null;
  document.getElementById("fig-mixture-optimize").addEventListener("click", () => {
    if (!path.length) path = [[+mqIn.value, +sqIn.value]];
    if (optTimer) clearInterval(optTimer);
    let n = 0;
    optTimer = setInterval(() => {
      step(); draw(); n++;
      if (n >= 80) { clearInterval(optTimer); optTimer = null; }
    }, 20);
  });
  document.getElementById("fig-mixture-reset").addEventListener("click", () => {
    if (optTimer) { clearInterval(optTimer); optTimer = null; }
    mqIn.value = "0"; sqIn.value = "1.4"; path = []; draw();
  });
  draw();
  attachHorizontalDrag({
    canvas, input: mqIn,
    hitTest: (x, y) => x >= pad.l && x <= pad.l + plotW && y >= pad.t && y <= pad.t + plotH,
    xToValue: (x) => xMin + ((x - pad.l) / plotW) * (xMax - xMin),
    onStart: () => { if (optTimer) { clearInterval(optTimer); optTimer = null; } },
  });
  [mqIn, sqIn].forEach((input) => input.addEventListener("input", () => { path = []; draw(); }));
})();

// ─────────── Figure 4: Mean-field variance loss ───────────
(function figMeanfield() {
  const canvas = document.getElementById("fig-meanfield");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const rhoIn = document.getElementById("fig-meanfield-rho");
  const rhoV = document.getElementById("fig-meanfield-rho-v");
  const readout = document.getElementById("fig-meanfield-readout");
  function ellipse(cx, cy, sx, sy, rho, color, fill, label) {
    const angle = Math.PI / 4;
    const major = Math.sqrt(1 + rho), minor = Math.sqrt(1 - rho);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.scale(sx * major, sy * minor);
    ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI * 2);
    ctx.restore();
    ctx.fillStyle = fill; ctx.strokeStyle = color; ctx.lineWidth = 2;
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = color; ctx.font = "600 12px -apple-system, sans-serif"; ctx.fillText(label, cx - 40, cy - sy * major - 10);
  }
  function draw() {
    const rho = +rhoIn.value;
    rhoV.textContent = rho.toFixed(2);
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
    drawAxes(ctx, 60, 28, 390, 285, 6, 6);
    const cx = 255, cy = 170;
    ellipse(cx, cy, 95, 95, rho, C.p, C.pFill, "true posterior");
    const mfSd = Math.sqrt(Math.max(0.03, 1 - rho * rho));
    ctx.strokeStyle = C.q; ctx.fillStyle = C.qFill; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(cx, cy, 95 * mfSd, 95 * mfSd, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = C.text; ctx.font = "13px -apple-system, sans-serif";
    ctx.fillText("reverse-KL mean-field optimum", 484, 80);
    ctx.fillStyle = C.qFill; ctx.fillRect(486, 105, 170 * mfSd, 26);
    ctx.strokeStyle = C.q; ctx.strokeRect(486, 105, 170, 26);
    ctx.fillStyle = C.textDim; ctx.fillText(`keeps ${(mfSd * 100).toFixed(0)}% of marginal SD`, 486, 150);
    readout.innerHTML =
      `<div class="row"><span class="lbl">factorized q</span><span>cannot rotate, so reverse KL shrinks variance as correlation grows</span></div>` +
      `<div class="row"><span class="lbl">mean-field variance</span><span>σ² = 1 − ρ² = ${(1 - rho * rho).toFixed(3)}</span></div>`;
  }
  rhoIn.addEventListener("input", draw);
  document.querySelectorAll("[data-meanfield-rho]").forEach((button) => {
    button.addEventListener("click", () => { rhoIn.value = button.dataset.meanfieldRho; draw(); });
  });

  // Drag horizontally in the plot to scrub ρ from 0 to 0.98.
  const plotBox = { x: 60, y: 28, w: 390, h: 285 };
  attachHorizontalDrag({
    canvas, input: rhoIn,
    hitTest: (x, y) => x >= plotBox.x && x <= plotBox.x + plotBox.w && y >= plotBox.y && y <= plotBox.y + plotBox.h,
    xToValue: (x) => ((x - plotBox.x) / plotBox.w) * 0.98,
  });

  draw();
})();

// ─────────── Figure 5: ELBO landscape ───────────
(function figElboLandscape() {
  const canvas = document.getElementById("fig-elbo-landscape");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const readout = document.getElementById("fig-elbo-landscape-readout");
  let path = [[-2.7, 2.6]];
  let runTimer = null;

  // Optional y / σ_lik inputs scoped to this figure; fall back to viModel if absent.
  const yIn = document.getElementById("fig-elbo-y");
  const slIn = document.getElementById("fig-elbo-sl");
  function getYSl() {
    const y = yIn ? parseFloat(yIn.value) : viModel.y;
    const sl = slIn ? parseFloat(slIn.value) : viModel.sl;
    return [y, sl];
  }

  // Layout: heatmap on the left, q-vs-posterior inset on the right.
  const x0 = 52, y0 = 22, ww = 380, hh = 285;
  const ix0 = x0 + ww + 56, iy0 = 32, iww = 220, ihh = 245;

  const xS = (m) => x0 + ((m + 4) / 8) * ww;
  const yS = (s) => y0 + hh - ((s - 0.25) / 3.0) * hh;
  const pxToMu = (px) => -4 + ((px - x0) / ww) * 8;
  const pxToSigma = (py) => 0.25 + ((y0 + hh - py) / hh) * 3.0;
  const inLandscape = (px, py) => px >= x0 && px <= x0 + ww && py >= y0 && py <= y0 + hh;

  function draw() {
    const [y, sl] = getYSl();
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);

    // Heatmap of F over (μq, σq).
    let minV = Infinity, maxV = -Infinity;
    const vals = [];
    for (let iy = 0; iy < 55; iy++) {
      vals[iy] = [];
      const sq = 0.25 + iy / 54 * 3.0;
      for (let ix = 0; ix < 90; ix++) {
        const mq = -4 + ix / 89 * 8;
        const v = freeEnergyValue(y, sl, mq, sq);
        vals[iy][ix] = v; minV = Math.min(minV, v); maxV = Math.max(maxV, v);
      }
    }
    for (let iy = 0; iy < vals.length; iy++) for (let ix = 0; ix < vals[iy].length; ix++) {
      const t = (vals[iy][ix] - minV) / (maxV - minV);
      const r = Math.round(245 - 210 * t), g = Math.round(241 - 145 * t), b = Math.round(236 - 96 * t);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x0 + ix * ww / 90, y0 + hh - (iy + 1) * hh / 55, ww / 90 + 1, hh / 55 + 1);
    }
    drawAxes(ctx, x0, y0, ww, hh, 8, 5);

    // Mark the true posterior's (μ*, σ*) as a target.
    const [mStar, sStar] = posteriorParams(y, sl);
    if (mStar >= -4 && mStar <= 4 && sStar >= 0.25 && sStar <= 3.25) {
      ctx.strokeStyle = C.post; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(xS(mStar), yS(sStar), 8, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(xS(mStar) - 12, yS(sStar)); ctx.lineTo(xS(mStar) + 12, yS(sStar)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(xS(mStar), yS(sStar) - 12); ctx.lineTo(xS(mStar), yS(sStar) + 12); ctx.stroke();
    }

    // Trajectory + current q point.
    ctx.strokeStyle = C.q; ctx.lineWidth = 2;
    ctx.beginPath();
    path.forEach(([m, s], i) => i ? ctx.lineTo(xS(m), yS(s)) : ctx.moveTo(xS(m), yS(s)));
    ctx.stroke();
    const [m, s] = path[path.length - 1];

    // Gradient arrow at the current point.
    const e = 0.02;
    const gm = (freeEnergyValue(y, sl, m + e, s) - freeEnergyValue(y, sl, m - e, s)) / (2 * e);
    const gs = (freeEnergyValue(y, sl, m, s + e) - freeEnergyValue(y, sl, m, s - e)) / (2 * e);
    const gnorm = Math.hypot(gm, gs);
    if (gnorm > 1e-3) {
      const scale = 28 / gnorm;
      const fromX = xS(m), fromY = yS(s);
      // Note σ axis is inverted (yS subtracts), so flip dy.
      const dx = gm * scale, dy = -gs * scale;
      ctx.strokeStyle = C.text; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(fromX, fromY); ctx.lineTo(fromX + dx, fromY + dy); ctx.stroke();
      const ang = Math.atan2(dy, dx);
      ctx.beginPath();
      ctx.moveTo(fromX + dx, fromY + dy);
      ctx.lineTo(fromX + dx - 7 * Math.cos(ang - 0.4), fromY + dy - 7 * Math.sin(ang - 0.4));
      ctx.lineTo(fromX + dx - 7 * Math.cos(ang + 0.4), fromY + dy - 7 * Math.sin(ang + 0.4));
      ctx.closePath();
      ctx.fillStyle = C.text; ctx.fill();
    }

    ctx.fillStyle = C.q;
    ctx.beginPath(); ctx.arc(xS(m), yS(s), 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.textDim; ctx.font = "11px -apple-system, sans-serif";
    ctx.fillText("μq", x0 + ww / 2, y0 + hh + 28);
    ctx.fillText("σq", x0 - 34, y0 + 12);
    ctx.fillStyle = C.text;
    ctx.fillText("click landscape to place q", x0, y0 - 6);

    // Inset: current q vs. true posterior on the θ axis.
    ctx.fillStyle = "#fafaf6"; ctx.fillRect(ix0, iy0, iww, ihh);
    ctx.strokeStyle = C.grid; ctx.lineWidth = 1; ctx.strokeRect(ix0, iy0, iww, ihh);
    const tMin = -5, tMax = 5;
    const tx = (t) => ix0 + ((t - tMin) / (tMax - tMin)) * iww;
    const samples = 160;
    const qVals = [], pVals = [];
    let pkMax = 0;
    for (let i = 0; i <= samples; i++) {
      const t = tMin + (i / samples) * (tMax - tMin);
      const qv = gaussianPdf(t, m, s);
      const pv = gaussianPdf(t, mStar, sStar);
      qVals.push([t, qv]); pVals.push([t, pv]);
      pkMax = Math.max(pkMax, qv, pv);
    }
    const ty = (v) => iy0 + ihh - 16 - (v / (pkMax * 1.1)) * (ihh - 28);
    ctx.strokeStyle = C.post; ctx.lineWidth = 2;
    ctx.beginPath(); pVals.forEach(([t, v], i) => i ? ctx.lineTo(tx(t), ty(v)) : ctx.moveTo(tx(t), ty(v))); ctx.stroke();
    ctx.strokeStyle = C.q; ctx.lineWidth = 2;
    ctx.beginPath(); qVals.forEach(([t, v], i) => i ? ctx.lineTo(tx(t), ty(v)) : ctx.moveTo(tx(t), ty(v))); ctx.stroke();
    ctx.fillStyle = C.textDim; ctx.font = "11px -apple-system, sans-serif";
    ctx.fillText("θ", ix0 + iww / 2 - 3, iy0 + ihh - 2);
    ctx.fillText("q (red) vs posterior (blue)", ix0, iy0 - 6);

    const F = freeEnergyValue(y, sl, m, s);
    const logEv = logEvidenceValue(y, sl);
    const kl = logEv - F;
    readout.innerHTML =
      `<div class="row"><span class="lbl">current q</span><span>μ=${m.toFixed(2)}, σ=${s.toFixed(2)}</span></div>` +
      `<div class="row"><span class="lbl">F (lower bound)</span><span>${F.toFixed(3)}</span></div>` +
      `<div class="row"><span class="lbl">ln p(y) (ceiling)</span><span>${logEv.toFixed(3)}</span></div>` +
      `<div class="row"><span class="lbl">KL gap = ln p(y) − F</span><span>${kl.toFixed(3)}</span></div>` +
      `<div class="row"><span class="lbl">∥∇F∥ at current q</span><span>${gnorm.toFixed(3)}</span></div>`;
  }

  function optimizeStep() {
    const [y, sl] = getYSl();
    let [m, s] = path[path.length - 1];
    const e = 0.02;
    const gm = (freeEnergyValue(y, sl, m + e, s) - freeEnergyValue(y, sl, m - e, s)) / (2 * e);
    const gs = (freeEnergyValue(y, sl, m, s + e) - freeEnergyValue(y, sl, m, s - e)) / (2 * e);
    m = clamp(m + 0.10 * gm, -4, 4);
    s = clamp(s + 0.08 * gs, 0.25, 3.25);
    path.push([m, s]);
  }

  canvas.addEventListener("click", (e) => {
    const r = canvas.getBoundingClientRect();
    const px = e.clientX - r.left, py = e.clientY - r.top;
    if (!inLandscape(px, py)) return;
    if (runTimer) { clearInterval(runTimer); runTimer = null; }
    const mu = clamp(pxToMu(px), -4, 4);
    const sigma = clamp(pxToSigma(py), 0.25, 3.25);
    path = [[mu, sigma]];
    draw();
  });

  document.getElementById("fig-elbo-run").addEventListener("click", () => {
    if (runTimer) clearInterval(runTimer);
    let n = 0;
    runTimer = setInterval(() => {
      optimizeStep(); draw(); n++;
      if (n >= 90) { clearInterval(runTimer); runTimer = null; }
    }, 18);
  });
  document.getElementById("fig-elbo-reset").addEventListener("click", () => {
    if (runTimer) { clearInterval(runTimer); runTimer = null; }
    path = [[-2.7, 2.6]];
    draw();
  });

  if (yIn) yIn.addEventListener("input", draw);
  if (slIn) slIn.addEventListener("input", draw);

  draw();
})();

// ─────────── Figure 1: KL divergence ───────────
(function fig1() {
  const canvas = document.getElementById("fig1");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);

  const ids = ["mq", "sq", "mp", "sp"];
  const inputs = Object.fromEntries(ids.map(k => [k, document.getElementById("fig1-" + k)]));
  const valLabels = Object.fromEntries(ids.map(k => [k, document.getElementById("fig1-" + k + "-v")]));

  let swapped = false;

  const padL = 42, padR = 14, padT = 14, padB = 34;
  const halfH = (h - padT - padB - 14) / 2;
  const plotW = w - padL - padR;
  const topY = padT, botY = padT + halfH + 14;
  const xMin = -6, xMax = 6;
  function xS(x) { return padL + ((x - xMin) / (xMax - xMin)) * plotW; }

  function draw() {
    const mq = +inputs.mq.value, sq = +inputs.sq.value;
    const mp = +inputs.mp.value, sp = +inputs.sp.value;
    valLabels.mq.textContent = mq.toFixed(2);
    valLabels.sq.textContent = sq.toFixed(2);
    valLabels.mp.textContent = mp.toFixed(2);
    valLabels.sp.textContent = sp.toFixed(2);

    const Q = (x) => gaussianPdf(x, mq, sq);
    const P = (x) => gaussianPdf(x, mp, sp);
    const left = swapped ? P : Q;
    const right = swapped ? Q : P;
    const leftLabel = swapped ? "p" : "q";
    const rightLabel = swapped ? "q" : "p";
    const leftColor = swapped ? C.p : C.q;
    const leftFill = swapped ? C.pFill : C.qFill;
    const rightColor = swapped ? C.q : C.p;
    const rightFill = swapped ? C.qFill : C.pFill;

    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, w, h);

    // ── Top panel: q(θ) and p(θ) ──
    const yTopAxis = topY + halfH;
    ctx.strokeStyle = C.grid;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 12; i++) {
      const px = padL + (i / 12) * plotW;
      ctx.beginPath(); ctx.moveTo(px, topY); ctx.lineTo(px, yTopAxis); ctx.stroke();
    }
    ctx.strokeStyle = C.axis; ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(padL, topY); ctx.lineTo(padL, yTopAxis); ctx.lineTo(padL + plotW, yTopAxis);
    ctx.stroke();

    const N = 240;
    const xs = []; const qs = []; const ps = [];
    let dmax = 0;
    for (let i = 0; i <= N; i++) {
      const x = xMin + (i / N) * (xMax - xMin);
      xs.push(x);
      const qv = left(x), pv = right(x);
      qs.push(qv); ps.push(pv);
      if (qv > dmax) dmax = qv;
      if (pv > dmax) dmax = pv;
    }
    dmax *= 1.15;
    function yTop(d) { return yTopAxis - (d / dmax) * halfH; }

    function fillCurve(arr, fill, stroke) {
      ctx.beginPath();
      for (let i = 0; i < arr.length; i++) {
        const px = xS(xs[i]);
        const py = yTop(arr[i]);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.lineTo(xS(xMax), yTopAxis);
      ctx.lineTo(xS(xMin), yTopAxis);
      ctx.closePath();
      ctx.fillStyle = fill; ctx.fill();
      ctx.beginPath();
      for (let i = 0; i < arr.length; i++) {
        const px = xS(xs[i]);
        const py = yTop(arr[i]);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = stroke; ctx.lineWidth = 1.8; ctx.stroke();
    }
    fillCurve(qs, leftFill, leftColor);
    fillCurve(ps, rightFill, rightColor);

    ctx.fillStyle = C.textDim;
    ctx.font = "11px -apple-system, sans-serif";
    ctx.textBaseline = "top"; ctx.textAlign = "left";
    ctx.fillText(`densities of ${leftLabel} (filled) and ${rightLabel} (outlined)`, padL, topY + 2);

    // ── Bottom panel: integrand q(θ)·ln(q/p) ──
    const yBotAxis = botY + halfH;
    const zeroY = botY + halfH * 0.55;

    ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
    for (let i = 0; i <= 12; i++) {
      const px = padL + (i / 12) * plotW;
      ctx.beginPath(); ctx.moveTo(px, botY); ctx.lineTo(px, yBotAxis); ctx.stroke();
    }
    // Zero baseline
    ctx.strokeStyle = C.axis; ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(padL, botY); ctx.lineTo(padL, yBotAxis);
    ctx.moveTo(padL, zeroY); ctx.lineTo(padL + plotW, zeroY);
    ctx.stroke();

    const integrand = [];
    let maxAbs = 1e-9;
    for (let i = 0; i <= N; i++) {
      const qv = left(xs[i]);
      const pv = right(xs[i]);
      // Integrand q·log(q/p). When q is tiny it kills the log, so just compute
      // the product honestly. Only treat as a (large) cap when p has truly
      // underflowed to 0 while q has not — that is the actual KL = ∞ case.
      let v;
      if (qv <= 0) v = 0;
      else if (pv <= 0) v = qv * 50; // proportional to qv so the spike sits where q has mass
      else v = qv * Math.log(qv / pv);
      integrand.push(v);
      if (Math.abs(v) > maxAbs) maxAbs = Math.abs(v);
    }
    const klExact = klGauss(mq, sq, mp, sp);
    const klSwapped = klGauss(mp, sp, mq, sq);

    const scale = Math.min(halfH * 0.45 / maxAbs, halfH * 0.45);
    function yBot(v) { return zeroY - v * scale; }

    // Fill integrand (positive above zero, negative below)
    ctx.beginPath();
    for (let i = 0; i < integrand.length; i++) {
      const px = xS(xs[i]);
      const py = yBot(clamp(integrand[i], -maxAbs, maxAbs));
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.lineTo(xS(xMax), zeroY);
    ctx.lineTo(xS(xMin), zeroY);
    ctx.closePath();
    ctx.fillStyle = C.integrand;
    ctx.fill();
    // Line on top
    ctx.beginPath();
    for (let i = 0; i < integrand.length; i++) {
      const px = xS(xs[i]);
      const py = yBot(clamp(integrand[i], -maxAbs, maxAbs));
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = C.integrandLine; ctx.lineWidth = 1.5; ctx.stroke();

    // x ticks
    ctx.fillStyle = C.textDim;
    ctx.font = "11px -apple-system, sans-serif";
    ctx.textBaseline = "top"; ctx.textAlign = "center";
    for (let v = -6; v <= 6; v += 2) {
      ctx.fillText(v.toString(), xS(v), yBotAxis + 4);
    }
    ctx.textAlign = "right";
    ctx.fillText("integrand " + leftLabel + "·ln(" + leftLabel + "/" + rightLabel + ")", padL + plotW, botY + 2);

    // Readout
    const readout = document.getElementById("fig1-readout");
    const klLabel = swapped ? `KL[p ‖ q]` : `KL[q ‖ p]`;
    const klOther = swapped ? `KL[q ‖ p]` : `KL[p ‖ q]`;
    readout.innerHTML =
      `<div class="row"><span class="lbl">${klLabel}</span><span style="font-weight:600;color:${C.q}">${(swapped ? klSwapped : klExact).toFixed(4)} nats</span></div>` +
      `<div class="row"><span class="lbl">${klOther}</span><span>${(swapped ? klExact : klSwapped).toFixed(4)} nats — different!</span></div>` +
      `<div class="row"><span class="lbl">at q = p</span><span>both would be zero</span></div>`;
  }

  ids.forEach(k => inputs[k].addEventListener("input", draw));
  document.querySelectorAll("[data-fig1-preset]").forEach(b => {
    b.addEventListener("click", () => {
      const k = b.dataset.fig1Preset;
      if (k === "shift") {
        inputs.mq.value = 0; inputs.sq.value = 1; inputs.mp.value = 2; inputs.sp.value = 1; swapped = false;
      } else if (k === "wider") {
        inputs.mq.value = 0; inputs.sq.value = 0.5; inputs.mp.value = 0; inputs.sp.value = 2; swapped = false;
      } else if (k === "narrower") {
        inputs.mq.value = 0; inputs.sq.value = 2; inputs.mp.value = 0; inputs.sp.value = 0.5; swapped = false;
      } else if (k === "swap") {
        swapped = !swapped;
      }
      draw();
    });
  });

  draw();
  // Drag the top (density) panel to move μ_q (or μ_p when swapped — drag the filled curve).
  attachHorizontalDrag({
    canvas, input: inputs.mq,
    hitTest: (x, y) => x >= padL && x <= padL + plotW && y >= topY && y <= topY + halfH,
    xToValue: (x) => xMin + ((x - padL) / plotW) * (xMax - xMin),
  });
})();

// ─────────── Figure 2: The decomposition ───────────
(function fig2() {
  const canvas = document.getElementById("fig2");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);

  const yIn = document.getElementById("fig2-y");
  const slIn = document.getElementById("fig2-sl");
  const mqIn = document.getElementById("fig2-mq");
  const sqIn = document.getElementById("fig2-sq");
  const yV = document.getElementById("fig2-y-v");
  const slV = document.getElementById("fig2-sl-v");
  const mqV = document.getElementById("fig2-mq-v");
  const sqV = document.getElementById("fig2-sq-v");
  const optBtn = document.getElementById("fig2-optimize");
  const resetBtn = document.getElementById("fig2-reset");

  // Fixed prior:
  const mu0 = 0, sigma0 = 1.5;

  // Layout: left = density plot, right = bar decomposition.
  const padL = 42, padR = 16, padT = 18, padB = 30;
  const plotW = (w - padL - padR) * 0.62;
  const barW = (w - padL - padR) - plotW - 24;
  const plotH = h - padT - padB;
  const plotX = padL, plotY = padT;
  const barX = plotX + plotW + 24;

  const xMin = -5, xMax = 5;
  function xS(x) { return plotX + ((x - xMin) / (xMax - xMin)) * plotW; }

  // Posterior given y, sigma_lik (conjugate update).
  function posterior(y, sl) {
    const tau0 = 1 / (sigma0 * sigma0);
    const tauL = 1 / (sl * sl);
    const tauP = tau0 + tauL;
    const sigP = Math.sqrt(1 / tauP);
    const muP = (tau0 * mu0 + tauL * y) / tauP;
    return [muP, sigP];
  }

  // log evidence p(y) under the model: ∫ N(y|θ, σ²_lik) N(θ|μ0, σ0²) dθ
  //   = N(y | μ0, σ0² + σ²_lik)
  function logEvidence(y, sl) {
    const sigma = Math.sqrt(sigma0 * sigma0 + sl * sl);
    return Math.log(gaussianPdf(y, mu0, sigma));
  }

  // F(q, y) for q = N(μ_q, σ_q²) in conjugate Gaussian model.
  // F = E_q[ln p(y,θ)] + H[q]
  // ln p(y, θ) = ln N(θ | μ0, σ0²) + ln N(y | θ, σ²_lik)
  // E_q[ln N(θ|μ0,σ0²)] = -0.5*ln(2πσ0²) - (σ_q² + (μ_q-μ0)²)/(2σ0²)
  // E_q[ln N(y|θ,σ²_lik)] = -0.5*ln(2πσ²_lik) - (σ_q² + (y-μ_q)²)/(2σ²_lik)
  // H[q] = 0.5 ln(2πe σ_q²)
  function freeEnergyParts(y, sl, mq, sq) {
    const ePrior = -0.5 * Math.log(2 * Math.PI * sigma0 * sigma0) -
                   (sq * sq + (mq - mu0) ** 2) / (2 * sigma0 * sigma0);
    const eLik = -0.5 * Math.log(2 * Math.PI * sl * sl) -
                 (sq * sq + (y - mq) ** 2) / (2 * sl * sl);
    const Hq = 0.5 * Math.log(2 * Math.PI * Math.E * sq * sq);
    return { eLogJoint: ePrior + eLik, ePrior, eLik, Hq, F: ePrior + eLik + Hq };
  }

  let animating = false;
  let rafId = null;

  function draw() {
    const y = +yIn.value;
    const sl = +slIn.value;
    const mq = +mqIn.value;
    const sq = +sqIn.value;
    yV.textContent = y.toFixed(2);
    slV.textContent = sl.toFixed(2);
    mqV.textContent = mq.toFixed(2);
    sqV.textContent = sq.toFixed(2);

    const [muP, sigP] = posterior(y, sl);
    const lnPy = logEvidence(y, sl);
    const kl = klGauss(mq, sq, muP, sigP);
    const parts = freeEnergyParts(y, sl, mq, sq);
    const F = parts.F;

    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, w, h);

    // ── Left: densities ──
    ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const px = plotX + (i / 10) * plotW;
      ctx.beginPath(); ctx.moveTo(px, plotY); ctx.lineTo(px, plotY + plotH); ctx.stroke();
    }
    ctx.strokeStyle = C.axis; ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(plotX, plotY); ctx.lineTo(plotX, plotY + plotH); ctx.lineTo(plotX + plotW, plotY + plotH);
    ctx.stroke();

    const N = 240;
    const xs = [];
    const prior = [], lik = [], post = [], qv = [];
    let dmax = 0;
    for (let i = 0; i <= N; i++) {
      const x = xMin + (i / N) * (xMax - xMin);
      xs.push(x);
      const pr = gaussianPdf(x, mu0, sigma0);
      const li = gaussianPdf(y, x, sl); // likelihood as a function of θ
      const po = gaussianPdf(x, muP, sigP);
      const q = gaussianPdf(x, mq, sq);
      prior.push(pr); lik.push(li); post.push(po); qv.push(q);
      dmax = Math.max(dmax, pr, li, po, q);
    }
    dmax *= 1.15;
    function yLeft(d) { return plotY + plotH - (d / dmax) * plotH; }

    function curve(arr, stroke, fill) {
      ctx.beginPath();
      for (let i = 0; i < arr.length; i++) {
        const px = xS(xs[i]);
        const py = yLeft(arr[i]);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      if (fill) {
        ctx.lineTo(xS(xMax), plotY + plotH);
        ctx.lineTo(xS(xMin), plotY + plotH);
        ctx.closePath();
        ctx.fillStyle = fill; ctx.fill();
      }
      ctx.beginPath();
      for (let i = 0; i < arr.length; i++) {
        const px = xS(xs[i]);
        const py = yLeft(arr[i]);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = stroke; ctx.lineWidth = 1.8; ctx.stroke();
    }

    curve(prior, C.prior, null);
    curve(lik, C.lik, null);
    curve(post, C.post, C.postFill);
    curve(qv, C.q, C.qFill);

    // Observation marker
    const yx = xS(y);
    ctx.strokeStyle = C.lik; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(yx, plotY); ctx.lineTo(yx, plotY + plotH);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = C.lik; ctx.font = "10px -apple-system, sans-serif";
    ctx.textBaseline = "top"; ctx.textAlign = "center";
    ctx.fillText("y", yx, plotY + 2);

    // x ticks
    ctx.fillStyle = C.textDim;
    ctx.textBaseline = "top"; ctx.textAlign = "center";
    for (let v = -4; v <= 4; v += 2) {
      ctx.fillText(v.toString(), xS(v), plotY + plotH + 4);
    }
    ctx.textAlign = "left";
    ctx.fillText("θ", plotX + plotW - 8, plotY + plotH + 16);

    // ── Right: bar decomposition ──
    // Stack: bottom is some negative anchor, top is ln p(y). Show F as a blue band
    // from bottom up to F, then KL as a red band from F to ln p(y).
    // Need to handle that F can be very negative.
    const anchorLow = Math.min(F, lnPy) - 0.5;
    const anchorHigh = lnPy + 0.5;
    const barTop = plotY + 20;
    const barBot = plotY + plotH - 20;
    const range = anchorHigh - anchorLow;
    function yBar(v) { return barBot - ((v - anchorLow) / range) * (barBot - barTop); }

    // Background rail
    ctx.fillStyle = "#f3f1ec";
    ctx.fillRect(barX + barW / 2 - 28, barTop, 56, barBot - barTop);
    ctx.strokeStyle = C.axis; ctx.lineWidth = 1;
    ctx.strokeRect(barX + barW / 2 - 28, barTop, 56, barBot - barTop);

    // F band: from anchorLow to F
    const fBandTop = yBar(F);
    ctx.fillStyle = C.fBand;
    ctx.fillRect(barX + barW / 2 - 28, fBandTop, 56, barBot - fBandTop);

    // KL band: from F to lnPy
    const klTop = yBar(lnPy);
    ctx.fillStyle = C.klBand;
    ctx.fillRect(barX + barW / 2 - 28, klTop, 56, fBandTop - klTop);

    // Ceiling line (ln p(y))
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(barX + barW / 2 - 36, klTop); ctx.lineTo(barX + barW / 2 + 36, klTop);
    ctx.stroke();

    // Divider between F and KL
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(barX + barW / 2 - 28, fBandTop); ctx.lineTo(barX + barW / 2 + 28, fBandTop);
    ctx.stroke();

    // Labels
    ctx.fillStyle = C.text;
    ctx.font = "11px -apple-system, sans-serif";
    ctx.textBaseline = "middle"; ctx.textAlign = "left";
    ctx.fillText(`ln p(y) = ${lnPy.toFixed(3)}`, barX + barW / 2 + 38, klTop);

    ctx.fillStyle = "#fff";
    ctx.font = "600 11px -apple-system, sans-serif";
    ctx.textAlign = "center";
    if (fBandTop - klTop > 14) {
      ctx.fillText("KL", barX + barW / 2, (klTop + fBandTop) / 2);
    }
    if (barBot - fBandTop > 14) {
      ctx.fillText("F", barX + barW / 2, (fBandTop + barBot) / 2);
    }

    ctx.fillStyle = C.text;
    ctx.font = "11px -apple-system, sans-serif";
    ctx.textBaseline = "middle"; ctx.textAlign = "left";
    ctx.fillText(`F = ${F.toFixed(3)}`, barX + barW / 2 + 38, fBandTop);
    ctx.fillText(`KL = ${kl.toFixed(3)}`, barX + barW / 2 + 38, (klTop + fBandTop) / 2 - 10);

    ctx.font = "11px -apple-system, sans-serif";
    ctx.textBaseline = "top"; ctx.textAlign = "center";
    ctx.fillText("decomposition", barX + barW / 2, plotY + 2);

    // Readout
    const readout = document.getElementById("fig2-readout");
    readout.innerHTML =
      `<div class="row"><span class="lbl">true posterior</span><span>𝒩(${muP.toFixed(3)}, ${(sigP * sigP).toFixed(3)})</span></div>` +
      `<div class="row"><span class="lbl">ln p(y)  (constant in q)</span><span>${lnPy.toFixed(4)}</span></div>` +
      `<div class="row"><span class="lbl">F(q, y)  (to maximize)</span><span style="color:${C.p};font-weight:600">${F.toFixed(4)}</span></div>` +
      `<div class="row"><span class="lbl">KL[q ‖ p(·|y)]  (to minimize)</span><span style="color:${C.q};font-weight:600">${kl.toFixed(4)}</span></div>` +
      `<div class="row"><span class="lbl">check  F + KL  ≈  ln p(y)</span><span>${(F + kl).toFixed(4)} ✓</span></div>`;
  }

  function step() {
    if (!animating) return;
    const y = +yIn.value, sl = +slIn.value;
    const [muP, sigP] = posterior(y, sl);
    const mq = +mqIn.value, sq = +sqIn.value;
    const lr = 0.18;
    const newMq = mq + lr * (muP - mq);
    const newSq = sq + lr * (sigP - sq);
    mqIn.value = newMq;
    sqIn.value = newSq;
    draw();
    if (Math.abs(newMq - muP) > 0.005 || Math.abs(newSq - sigP) > 0.005) {
      rafId = requestAnimationFrame(step);
    } else {
      animating = false;
    }
  }

  optBtn.addEventListener("click", () => {
    if (animating) { animating = false; cancelAnimationFrame(rafId); return; }
    animating = true;
    step();
  });
  resetBtn.addEventListener("click", () => {
    animating = false; cancelAnimationFrame(rafId);
    mqIn.value = -2; sqIn.value = 2.5;
    draw();
  });

  [yIn, slIn, mqIn, sqIn].forEach(el => el.addEventListener("input", () => {
    animating = false; cancelAnimationFrame(rafId);
    draw();
  }));

  draw();
  // Drag the density panel to move μ_q. (The "y" observation marker also lives here;
  // dragging always controls μ_q so the gesture is consistent.)
  attachHorizontalDrag({
    canvas, input: mqIn,
    hitTest: (x, y) => x >= plotX && x <= plotX + plotW && y >= plotY && y <= plotY + plotH,
    xToValue: (x) => xMin + ((x - plotX) / plotW) * (xMax - xMin),
  });
})();

// ─────────── Figure 3: F = expected log-joint + entropy ───────────
(function fig3() {
  const canvas = document.getElementById("fig3");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);

  const mqIn = document.getElementById("fig3-mq");
  const sqIn = document.getElementById("fig3-sq");
  const yIn = document.getElementById("fig3-y");
  const mqV = document.getElementById("fig3-mq-v");
  const sqV = document.getElementById("fig3-sq-v");
  const yV = document.getElementById("fig3-y-v");
  const optBtn = document.getElementById("fig3-optimize");

  const mu0 = 0, sigma0 = 1.5, sl = 1.0;

  // Layout: left = q overlaid on the surface ln p(y, θ); right = bar showing the two terms.
  const padL = 44, padR = 16, padT = 18, padB = 30;
  const plotW = (w - padL - padR) * 0.62;
  const barX = padL + plotW + 24;
  const barW = (w - padL - padR) - plotW - 24;
  const plotH = h - padT - padB;

  const xMin = -5, xMax = 5;
  function xS(x) { return padL + ((x - xMin) / (xMax - xMin)) * plotW; }

  function logJoint(x, y) {
    return Math.log(gaussianPdf(x, mu0, sigma0)) + Math.log(gaussianPdf(y, x, sl));
  }

  function parts(y, mq, sq) {
    // E_q[ln p(y,θ)] analytically:
    const ePrior = -0.5 * Math.log(2 * Math.PI * sigma0 * sigma0) -
                   (sq * sq + (mq - mu0) ** 2) / (2 * sigma0 * sigma0);
    const eLik = -0.5 * Math.log(2 * Math.PI * sl * sl) -
                 (sq * sq + (y - mq) ** 2) / (2 * sl * sl);
    const eLogJoint = ePrior + eLik;
    const Hq = 0.5 * Math.log(2 * Math.PI * Math.E * sq * sq);
    return { eLogJoint, Hq, F: eLogJoint + Hq };
  }

  let animating = false, rafId = null;

  function draw() {
    const mq = +mqIn.value, sq = +sqIn.value, y = +yIn.value;
    mqV.textContent = mq.toFixed(2);
    sqV.textContent = sq.toFixed(2);
    yV.textContent = y.toFixed(2);

    const { eLogJoint, Hq, F } = parts(y, mq, sq);

    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, w, h);

    // ── Left: log-joint as a "landscape" curve + q overlay ──
    ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const px = padL + (i / 10) * plotW;
      ctx.beginPath(); ctx.moveTo(px, padT); ctx.lineTo(px, padT + plotH); ctx.stroke();
    }
    ctx.strokeStyle = C.axis; ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + plotH); ctx.lineTo(padL + plotW, padT + plotH);
    ctx.stroke();

    const N = 240;
    const xs = [], lj = [], qv = [];
    let ljMin = Infinity, ljMax = -Infinity, qMax = 0;
    for (let i = 0; i <= N; i++) {
      const x = xMin + (i / N) * (xMax - xMin);
      const v = logJoint(x, y);
      const q = gaussianPdf(x, mq, sq);
      xs.push(x); lj.push(v); qv.push(q);
      if (v < ljMin) ljMin = v;
      if (v > ljMax) ljMax = v;
      if (q > qMax) qMax = q;
    }
    // Render log-joint into upper 60%, q into lower 40%.
    const upperH = plotH * 0.62, lowerH = plotH * 0.32;
    const upperBase = padT + upperH;
    const lowerBase = padT + plotH;
    const ljPad = (ljMax - ljMin) * 0.10;
    const ljLo = ljMin - ljPad, ljHi = ljMax + ljPad;

    function yLJ(v) { return padT + 6 + upperH - 12 - ((v - ljLo) / (ljHi - ljLo)) * (upperH - 18); }
    function yQ(d) { return lowerBase - (d / (qMax * 1.15)) * lowerH; }

    // Log-joint area
    ctx.beginPath();
    for (let i = 0; i < lj.length; i++) {
      const px = xS(xs[i]);
      const py = yLJ(lj[i]);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.lineTo(xS(xMax), upperBase);
    ctx.lineTo(xS(xMin), upperBase);
    ctx.closePath();
    ctx.fillStyle = "rgba(212,105,10,0.18)";
    ctx.fill();
    ctx.beginPath();
    for (let i = 0; i < lj.length; i++) {
      const px = xS(xs[i]);
      const py = yLJ(lj[i]);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = C.lik; ctx.lineWidth = 1.8; ctx.stroke();

    // q curve in lower band
    ctx.beginPath();
    for (let i = 0; i < qv.length; i++) {
      const px = xS(xs[i]);
      const py = yQ(qv[i]);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.lineTo(xS(xMax), lowerBase);
    ctx.lineTo(xS(xMin), lowerBase);
    ctx.closePath();
    ctx.fillStyle = C.qFill;
    ctx.fill();
    ctx.beginPath();
    for (let i = 0; i < qv.length; i++) {
      const px = xS(xs[i]);
      const py = yQ(qv[i]);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = C.q; ctx.lineWidth = 1.8; ctx.stroke();

    // Mid-divider
    ctx.strokeStyle = C.grid; ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.moveTo(padL, upperBase); ctx.lineTo(padL + plotW, upperBase);
    ctx.stroke();
    ctx.setLineDash([]);

    // Labels
    ctx.fillStyle = C.textDim; ctx.font = "11px -apple-system, sans-serif";
    ctx.textBaseline = "top"; ctx.textAlign = "left";
    ctx.fillText("ln p(y, θ)  — the landscape", padL + 4, padT + 4);
    ctx.fillText("q(θ)  — your guess", padL + 4, upperBase + 4);

    ctx.textAlign = "center";
    for (let v = -4; v <= 4; v += 2) {
      ctx.fillText(v.toString(), xS(v), padT + plotH + 4);
    }
    ctx.textAlign = "left";
    ctx.fillText("θ", padL + plotW - 8, padT + plotH + 16);

    // ── Right: bar showing the two contributions to F ──
    // E_q[ln p(y,θ)] is typically negative (its absolute value can be big); H[q] is
    // positive for σ_q > 1/√(2πe) ≈ 0.242. Plot them stacked from a zero axis with
    // their actual values, and show F as their sum on top.

    const lo = Math.min(eLogJoint, 0) - 0.5;
    const hi = Math.max(F, 0, Hq + 0.5);
    const range = hi - lo;
    const bTop = padT + 28, bBot = padT + plotH - 30;
    function yB(v) { return bBot - ((v - lo) / range) * (bBot - bTop); }
    const zero = yB(0);

    // axis
    ctx.strokeStyle = C.axis; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(barX, bTop); ctx.lineTo(barX, bBot);
    ctx.moveTo(barX, zero); ctx.lineTo(barX + barW, zero);
    ctx.stroke();
    ctx.fillStyle = C.textDim; ctx.font = "10px -apple-system, sans-serif";
    ctx.textBaseline = "middle"; ctx.textAlign = "right";
    ctx.fillText("0", barX - 4, zero);

    const colW = (barW - 16) / 3;
    function bar(idx, value, color, label) {
      const cx = barX + 8 + idx * colW;
      const yTop = yB(Math.max(0, value));
      const yBot = yB(Math.min(0, value));
      ctx.fillStyle = color;
      ctx.fillRect(cx, yTop, colW - 8, yBot - yTop);
      ctx.fillStyle = C.text;
      ctx.font = "10px -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(label, cx + (colW - 8) / 2, bTop - 4);
      ctx.textBaseline = "top";
      ctx.fillText(value.toFixed(3), cx + (colW - 8) / 2,
        value >= 0 ? yTop - 14 : yBot + 2);
    }
    bar(0, eLogJoint, "rgba(212,105,10,0.75)", "E_q[ln p(y,θ)]");
    bar(1, Hq, "rgba(107,69,146,0.75)", "H[q]");
    bar(2, F, "rgba(31,74,140,0.85)", "F = sum");

    // Readout
    const readout = document.getElementById("fig3-readout");
    readout.innerHTML =
      `<div class="row"><span class="lbl">expected log-joint  E_q[ln p(y,θ)]</span><span style="color:${C.lik};font-weight:600">${eLogJoint.toFixed(4)}</span></div>` +
      `<div class="row"><span class="lbl">Shannon entropy  H[q]</span><span style="color:${C.integrandLine};font-weight:600">${Hq.toFixed(4)}</span></div>` +
      `<div class="row"><span class="lbl">F(q, y)  =  sum</span><span style="color:${C.p};font-weight:700">${F.toFixed(4)}</span></div>`;
  }

  function step() {
    if (!animating) return;
    // Numerical gradient ascent on F w.r.t. (μ_q, σ_q).
    const y = +yIn.value;
    const eps = 1e-3, lr = 0.25;
    const mq = +mqIn.value, sq = +sqIn.value;
    const f0 = parts(y, mq, sq).F;
    const fM = parts(y, mq + eps, sq).F;
    const fS = parts(y, mq, sq + eps).F;
    const gM = (fM - f0) / eps;
    const gS = (fS - f0) / eps;
    const newMq = clamp(mq + lr * gM, -4, 4);
    const newSq = clamp(sq + lr * gS, 0.2, 3);
    mqIn.value = newMq;
    sqIn.value = newSq;
    draw();
    if (Math.abs(gM) > 0.01 || Math.abs(gS) > 0.01) {
      rafId = requestAnimationFrame(step);
    } else {
      animating = false;
    }
  }

  optBtn.addEventListener("click", () => {
    if (animating) { animating = false; cancelAnimationFrame(rafId); return; }
    animating = true; step();
  });

  [mqIn, sqIn, yIn].forEach(el => el.addEventListener("input", () => {
    animating = false; cancelAnimationFrame(rafId);
    draw();
  }));

  attachHorizontalDrag({
    canvas, input: mqIn,
    hitTest: (x, y) => x >= padL && x <= padL + plotW && y >= padT && y <= padT + plotH,
    xToValue: (x) => xMin + ((x - padL) / plotW) * (xMax - xMin),
    onStart: () => { animating = false; cancelAnimationFrame(rafId); },
  });

  draw();
})();
