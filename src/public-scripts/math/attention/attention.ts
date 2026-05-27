// Interactive figures for the Attention explainer.

// Horizontal drag helper: drags inside a canvas region to update a range input.
// Coexists with the slider — keyboard / focus / aria semantics are unchanged.
function attachHorizontalDrag(opts) {
  const { canvas, input, xToValue, hitTest, cursor = "ew-resize" } = opts;
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
  canvas.addEventListener("pointerleave", (e) => { if (!dragging) canvas.style.cursor = ""; });
}

// ===== Figure 1 =====
(() => {
  const canvas = document.getElementById("fig-nw");
  const qIn = document.getElementById("nw-q");
  const tIn = document.getElementById("nw-logtau");
  const qV = document.getElementById("nw-q-v");
  const tV = document.getElementById("nw-logtau-v");
  const readout = document.getElementById("nw-readout");

  // generate data
  const N = 18;
  const xs = [], ys = [];
  let seed = 11;
  function rng() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
  function randn() { const u = Math.max(rng(), 1e-12), v = rng(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); }
  function f(x) { return 0.55 + 0.32 * Math.sin(2 * Math.PI * x) + 0.12 * Math.sin(6 * Math.PI * x + 1.2); }
  for (let i = 0; i < N; i++) {
    const x = (i + 0.5 + rng() * 0.5 - 0.25) / N;
    xs.push(Math.max(0.02, Math.min(0.98, x)));
    ys.push(f(x) + randn() * 0.06);
  }

  function setup(c) {
    const ratio = window.devicePixelRatio || 1;
    const iw = +c.getAttribute("width"), ih = +c.getAttribute("height");
    c.style.width = "100%"; c.style.height = `${c.getBoundingClientRect().width * ih / iw}px`;
    const r = c.getBoundingClientRect();
    c.width = r.width * ratio; c.height = r.height * ratio;
    const ctx = c.getContext("2d"); ctx.scale(ratio, ratio);
    return { ctx, w: r.width, h: r.height };
  }

  const layout = { padL: 0, padT: 0, plotW: 0, plotH: 0 };

  function draw() {
    const { ctx, w, h } = setup(canvas);
    const q = +qIn.value;
    const logtau = +tIn.value;
    const tau = Math.pow(2, logtau);
    qV.textContent = q.toFixed(3);
    tV.textContent = logtau.toFixed(2);

    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h);
    const padL = 50, padR = 22, padT = 26, padB = 26;
    const split = 0.62; // top fraction for scatter+kernel, bottom for bars
    const plotH = (h - padT - padB) * split - 8;
    const barsH = (h - padT - padB) * (1 - split) - 8;
    const plotW = w - padL - padR;
    const topY = padT;
    const botY = padT + plotH + 16;
    layout.padL = padL; layout.padT = padT; layout.plotW = plotW; layout.plotH = plotH;

    // shared x scale
    const xS = (x) => padL + x * plotW;

    // ---- top: scatter + curve + kernel
    ctx.strokeStyle = "#e3ddd0"; ctx.strokeRect(padL, topY, plotW, plotH);
    // gridlines + ticks
    ctx.strokeStyle = "#f1ede2"; ctx.lineWidth = 1;
    for (let k = 1; k < 10; k++) {
      const px = padL + (k / 10) * plotW;
      ctx.beginPath(); ctx.moveTo(px, topY); ctx.lineTo(px, topY + plotH); ctx.stroke();
    }
    // y bounds from data
    const yMin = -0.05, yMax = 1.15;
    const yS = (y) => topY + plotH - ((y - yMin) / (yMax - yMin)) * plotH;

    // weights (Gaussian softmax of squared distance ≡ RBF kernel, normalized)
    const weights = xs.map((xi) => Math.exp(-((q - xi) * (q - xi)) / (2 * tau)));
    const wSum = weights.reduce((a, b) => a + b, 0);
    const alphas = weights.map(wi => wi / wSum);

    // predicted curve
    ctx.strokeStyle = "#6b4592"; ctx.lineWidth = 2.2;
    ctx.beginPath();
    for (let i = 0; i <= 200; i++) {
      const xq = i / 200;
      let num = 0, den = 0;
      for (let j = 0; j < N; j++) {
        const w = Math.exp(-((xq - xs[j]) * (xq - xs[j])) / (2 * tau));
        num += w * ys[j]; den += w;
      }
      const yq = den > 0 ? num / den : 0;
      const px = xS(xq), py = yS(yq);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // kernel bump at query (shape only — area normalized to a fraction of plot height)
    ctx.fillStyle = "rgba(45,122,62,0.18)";
    ctx.strokeStyle = "#2d7a3e"; ctx.lineWidth = 1.8;
    ctx.beginPath();
    const bumpScale = 0.18 * plotH; // height
    for (let i = 0; i <= 200; i++) {
      const xq = i / 200;
      const k = Math.exp(-((xq - q) * (xq - q)) / (2 * tau));
      const px = xS(xq);
      const py = topY + plotH - k * bumpScale - 4;
      if (i === 0) ctx.moveTo(px, topY + plotH); else ctx.lineTo(px, py);
      if (i === 200) { ctx.lineTo(px, topY + plotH); ctx.closePath(); }
    }
    ctx.fill();
    ctx.beginPath();
    for (let i = 0; i <= 200; i++) {
      const xq = i / 200;
      const k = Math.exp(-((xq - q) * (xq - q)) / (2 * tau));
      const px = xS(xq);
      const py = topY + plotH - k * bumpScale - 4;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // scatter
    xs.forEach((xi, i) => {
      const px = xS(xi), py = yS(ys[i]);
      ctx.fillStyle = "rgba(31,74,140,0.85)";
      ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fill();
    });

    // query vertical
    const qx = xS(q);
    ctx.strokeStyle = "#b8412a"; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(qx, topY); ctx.lineTo(qx, topY + plotH); ctx.stroke();
    ctx.setLineDash([]);

    // predicted value at q
    let predNum = 0, predDen = 0;
    for (let i = 0; i < N; i++) {
      predNum += alphas[i] * ys[i]; predDen += alphas[i];
    }
    const yhat = predNum / predDen;
    ctx.fillStyle = "#6b4592";
    ctx.beginPath(); ctx.arc(qx, yS(yhat), 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(qx, yS(yhat), 2.5, 0, Math.PI * 2); ctx.fill();

    // labels
    ctx.fillStyle = "#475569"; ctx.font = "11px -apple-system, sans-serif"; ctx.textAlign = "right";
    ctx.fillText("y", padL - 6, topY + 10);
    ctx.fillText(`q = ${q.toFixed(2)}`, qx - 6, topY + 12);

    // y ticks
    ctx.fillStyle = "#8892a3"; ctx.font = "10px -apple-system, sans-serif"; ctx.textAlign = "right";
    [0, 0.25, 0.5, 0.75, 1.0].forEach(t => {
      const py = yS(t);
      ctx.fillText(t.toFixed(2), padL - 4, py + 3);
    });

    // ---- bottom: attention weights bars (aligned)
    ctx.strokeStyle = "#e3ddd0"; ctx.strokeRect(padL, botY, plotW, barsH);
    // bars
    const maxA = Math.max(...alphas, 0.05);
    xs.forEach((xi, i) => {
      const bx = xS(xi);
      const bw = Math.min(plotW / N * 0.7, 16);
      const bh = (alphas[i] / maxA) * (barsH - 12);
      ctx.fillStyle = "#b8412a";
      ctx.fillRect(bx - bw / 2, botY + barsH - bh - 2, bw, bh);
    });
    // entropy display
    let H = 0; for (const a of alphas) if (a > 0) H -= a * Math.log(a);
    const Hmax = Math.log(N);
    ctx.fillStyle = "#475569"; ctx.font = "10px -apple-system, sans-serif"; ctx.textAlign = "left";
    ctx.fillText(`attention weights αᵢ (sum = 1)`, padL + 6, botY + 12);
    ctx.textAlign = "right";
    ctx.fillText(`H(α) = ${H.toFixed(2)} of max ${Hmax.toFixed(2)}`, padL + plotW - 6, botY + 12);

    // x-axis ticks (shared)
    ctx.fillStyle = "#8892a3"; ctx.textAlign = "center"; ctx.font = "10px -apple-system, sans-serif";
    for (let k = 0; k <= 5; k++) {
      const t = k / 5;
      ctx.fillText(t.toFixed(2), xS(t), botY + barsH + 14);
    }
    ctx.fillStyle = "#475569"; ctx.font = "11px -apple-system, sans-serif";
    ctx.fillText("position x (= key value k)", padL + plotW / 2, botY + barsH + 24);

    readout.innerHTML =
      `<div class="row"><span class="lbl">kernel bandwidth $h$ = $\\sqrt{\\tau}$</span><span>${Math.sqrt(tau).toFixed(4)}</span></div>` +
      `<div class="row"><span class="lbl">predicted value $\\hat f(q)$</span><span>${yhat.toFixed(3)}</span></div>` +
      `<div class="row"><span class="lbl">attention entropy / log N</span><span>${(H / Hmax).toFixed(3)} (1 = uniform, 0 = argmax)</span></div>`;
  }

  [qIn, tIn].forEach(i => i.addEventListener("input", draw));
  document.querySelectorAll("[data-nw-preset]").forEach(b => b.addEventListener("click", () => {
    const p = b.dataset.nwPreset;
    if (p === "sharp") tIn.value = "-8";
    if (p === "medium") tIn.value = "-5";
    if (p === "diffuse") tIn.value = "-1";
    draw();
  }));
  window.addEventListener("resize", draw);
  draw();
  attachHorizontalDrag({
    canvas, input: qIn,
    hitTest: (x, y) =>
      x >= layout.padL && x <= layout.padL + layout.plotW &&
      y >= layout.padT && y <= layout.padT + layout.plotH,
    xToValue: (x) => (x - layout.padL) / layout.plotW,
  });
})();

// ===== Figure 2 =====
(() => {
  const canvas = document.getElementById("fig-maxent");
  const tIn = document.getElementById("me-logtau");
  const patternIn = document.getElementById("me-pattern");
  const tV = document.getElementById("me-logtau-v");
  const patternV = document.getElementById("me-pattern-v");
  const readout = document.getElementById("maxent-readout");
  const energyBtn = document.getElementById("me-energy");
  let energyView = false;

  const PATTERNS = {
    peaked: [-1.5, -0.8, 0.0, 1.0, 1.9, 1.3, 0.4, -0.5],
    two:    [-0.5, 1.6, 0.8, -0.6, -0.4, 0.7, 1.5, -0.3],
    ramp:   [-1.8, -1.2, -0.6, 0.0, 0.6, 1.2, 1.8, 2.4],
    noisy:  [0.2, -0.3, 0.5, -0.1, 0.4, -0.2, 0.3, 0.0],
    tail:   [2.5, 0.6, -0.2, -0.5, -0.7, -0.8, -0.9, -1.0],
  };

  function setup(c) {
    const ratio = window.devicePixelRatio || 1;
    const iw = +c.getAttribute("width"), ih = +c.getAttribute("height");
    c.style.width = "100%"; c.style.height = `${c.getBoundingClientRect().width * ih / iw}px`;
    const r = c.getBoundingClientRect();
    c.width = r.width * ratio; c.height = r.height * ratio;
    const ctx = c.getContext("2d"); ctx.scale(ratio, ratio);
    return { ctx, w: r.width, h: r.height };
  }

  function draw() {
    const { ctx, w, h } = setup(canvas);
    const logtau = +tIn.value, tau = Math.pow(2, logtau);
    tV.textContent = logtau.toFixed(2);
    patternV.textContent = patternIn.options[patternIn.selectedIndex].text;
    let scores = PATTERNS[patternIn.value].slice();
    if (energyView) {
      // visually relabel: scores become energies (negated)
    }
    const N = scores.length;
    // softmax with temperature
    const ws = scores.map(s => s / tau);
    const mx = Math.max(...ws);
    const exps = ws.map(x => Math.exp(x - mx));
    const Z = exps.reduce((a, b) => a + b, 0);
    const alphas = exps.map(e => e / Z);

    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h);
    const padL = 50, padR = 220, padT = 26, padB = 30;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;
    const rows = 3, rowGap = 14;
    const rowH = (plotH - (rows - 1) * rowGap) / rows;
    const colW = plotW / N;
    const barW = colW * 0.66;

    // labels
    ctx.fillStyle = "#475569"; ctx.font = "11px -apple-system, sans-serif"; ctx.textAlign = "left";
    const rowLabels = [
      energyView ? "energies Eᵢ = −sᵢ" : "scores sᵢ",
      "retrieval distribution aᵢ",
      "contributions aᵢ · sᵢ",
    ];
    const rowColors = ["#475569", "#b8412a", "#6b4592"];

    // row 1: scores
    const sMin = Math.min(...scores, 0), sMax = Math.max(...scores, 0);
    const sRange = Math.max(sMax - sMin, 0.5);
    const r1y0 = padT, r1y1 = padT + rowH;
    const r1zero = r1y1 - ((0 - sMin) / sRange) * rowH;
    ctx.strokeStyle = "#cbd5e1"; ctx.setLineDash([2, 3]);
    ctx.beginPath(); ctx.moveTo(padL, r1zero); ctx.lineTo(padL + plotW, r1zero); ctx.stroke();
    ctx.setLineDash([]);
    for (let i = 0; i < N; i++) {
      const cx = padL + (i + 0.5) * colW;
      const s = energyView ? -scores[i] : scores[i];
      const eSrc = energyView ? [-Math.max(0, -scores[i]), -Math.min(0, -scores[i])] : null;
      const y0 = r1y1 - ((0 - sMin) / sRange) * rowH;
      const yV = r1y1 - ((s - sMin) / sRange) * rowH;
      const top = Math.min(y0, yV), bh = Math.abs(y0 - yV);
      ctx.fillStyle = energyView ? "#0f172a" : (scores[i] >= 0 ? "#475569" : "#94a3b8");
      ctx.fillRect(cx - barW / 2, top, barW, bh);
      ctx.fillStyle = "#0f172a"; ctx.font = "10px -apple-system, sans-serif"; ctx.textAlign = "center";
      ctx.fillText(s.toFixed(1), cx, top - 3);
    }
    ctx.fillStyle = rowColors[0]; ctx.font = "11px -apple-system, sans-serif"; ctx.textAlign = "left";
    ctx.fillText(rowLabels[0], padL + 4, r1y0 + 12);

    // row 2: attention distribution
    const r2y0 = r1y1 + rowGap, r2y1 = r2y0 + rowH;
    const aMx = Math.max(...alphas);
    for (let i = 0; i < N; i++) {
      const cx = padL + (i + 0.5) * colW;
      const bh = (alphas[i] / Math.max(aMx, 1e-9)) * (rowH - 14);
      ctx.fillStyle = "#b8412a";
      ctx.fillRect(cx - barW / 2, r2y1 - bh, barW, bh);
      ctx.fillStyle = "#0f172a"; ctx.font = "10px -apple-system, sans-serif"; ctx.textAlign = "center";
      ctx.fillText((alphas[i] * 100).toFixed(0) + "%", cx, r2y1 - bh - 3);
    }
    ctx.fillStyle = rowColors[1]; ctx.font = "11px -apple-system, sans-serif"; ctx.textAlign = "left";
    ctx.fillText(rowLabels[1], padL + 4, r2y0 + 12);

    // row 3: contributions a_i s_i
    const contribs = alphas.map((a, i) => a * scores[i]);
    const cMin = Math.min(...contribs, 0), cMax = Math.max(...contribs, 0);
    const cRange = Math.max(cMax - cMin, 0.05);
    const r3y0 = r2y1 + rowGap, r3y1 = r3y0 + rowH;
    const r3zero = r3y1 - ((0 - cMin) / cRange) * rowH;
    ctx.strokeStyle = "#cbd5e1"; ctx.setLineDash([2, 3]);
    ctx.beginPath(); ctx.moveTo(padL, r3zero); ctx.lineTo(padL + plotW, r3zero); ctx.stroke();
    ctx.setLineDash([]);
    for (let i = 0; i < N; i++) {
      const cx = padL + (i + 0.5) * colW;
      const v = contribs[i];
      const y0 = r3y1 - ((0 - cMin) / cRange) * rowH;
      const yV = r3y1 - ((v - cMin) / cRange) * rowH;
      const top = Math.min(y0, yV), bh = Math.abs(y0 - yV);
      ctx.fillStyle = v >= 0 ? "#6b4592" : "#94a3b8";
      ctx.fillRect(cx - barW / 2, top, barW, bh);
    }
    ctx.fillStyle = rowColors[2]; ctx.font = "11px -apple-system, sans-serif"; ctx.textAlign = "left";
    ctx.fillText(rowLabels[2], padL + 4, r3y0 + 12);

    // x-axis labels
    ctx.fillStyle = "#8892a3"; ctx.font = "10px -apple-system, sans-serif"; ctx.textAlign = "center";
    for (let i = 0; i < N; i++) {
      const cx = padL + (i + 0.5) * colW;
      ctx.fillText(`item ${i + 1}`, cx, r3y1 + 14);
    }

    // right side: objective decomposition
    const px0 = padL + plotW + 18;
    let expRel = 0; for (let i = 0; i < N; i++) expRel += alphas[i] * scores[i];
    let H = 0; for (const a of alphas) if (a > 0) H -= a * Math.log(a);
    const Hmax = Math.log(N);
    const entropyBonus = tau * H;
    const total = expRel + entropyBonus;
    ctx.fillStyle = "#1f2733"; ctx.font = "bold 11px -apple-system, sans-serif"; ctx.textAlign = "left";
    ctx.fillText("Objective", px0, padT + 14);
    ctx.font = "11px -apple-system, sans-serif"; ctx.fillStyle = "#475569";
    let yc = padT + 36;
    function meter(label, val, maxV, color) {
      ctx.fillStyle = "#475569"; ctx.font = "10px -apple-system, sans-serif"; ctx.textAlign = "left";
      ctx.fillText(label, px0, yc);
      ctx.font = "bold 11px 'SF Mono', monospace";
      ctx.fillText(val.toFixed(3), px0 + 130, yc);
      ctx.fillStyle = "#f1ede2"; ctx.fillRect(px0, yc + 4, 160, 8);
      const ww = Math.max(-160, Math.min(160, (val / maxV) * 80));
      ctx.fillStyle = color;
      if (ww >= 0) ctx.fillRect(px0 + 80, yc + 4, ww, 8);
      else ctx.fillRect(px0 + 80 + ww, yc + 4, -ww, 8);
      ctx.strokeStyle = "#cbd5e1"; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(px0 + 80, yc + 4); ctx.lineTo(px0 + 80, yc + 12); ctx.stroke();
      yc += 32;
    }
    meter("⟨s⟩ = Σ aᵢsᵢ", expRel, Math.max(Math.abs(sMax), Math.abs(sMin)), "#6b4592");
    meter("τ · H(a)", entropyBonus, Hmax * 4, "#2d7a3e");
    meter("total = ⟨s⟩ + τH", total, Math.max(Math.abs(sMax), Math.abs(sMin)) + Hmax * 4, "#b8412a");

    yc += 4;
    ctx.fillStyle = "#1f2733"; ctx.font = "bold 11px -apple-system, sans-serif";
    ctx.fillText("Diagnostics", px0, yc); yc += 18;
    ctx.fillStyle = "#475569"; ctx.font = "10px -apple-system, sans-serif";
    ctx.fillText(`τ = ${tau.toFixed(3)}`, px0, yc); yc += 14;
    ctx.fillText(`H(a) / log N = ${(H / Hmax).toFixed(3)}`, px0, yc); yc += 14;
    ctx.fillText(`max αᵢ = ${aMx.toFixed(3)}`, px0, yc); yc += 14;
    ctx.fillText(`effective k ≈ ${Math.exp(H).toFixed(2)}`, px0, yc); yc += 14;

    if (energyView) {
      ctx.fillStyle = "#d4690a"; ctx.font = "italic 10px -apple-system, sans-serif";
      ctx.fillText("Boltzmann form: aᵢ ∝ exp(−Eᵢ/τ)", px0, yc + 10);
    }

    readout.innerHTML =
      `<div class="row"><span class="lbl">retrieval entropy / log N</span><span>${(H / Hmax).toFixed(3)} (0 = argmax, 1 = uniform)</span></div>` +
      `<div class="row"><span class="lbl">objective = ⟨s⟩ + τ·H(a)</span><span>${total.toFixed(3)}</span></div>` +
      `<div class="row"><span class="lbl">effective number of items retrieved</span><span>${Math.exp(H).toFixed(2)} of ${N}</span></div>`;
  }

  [tIn, patternIn].forEach(i => i.addEventListener("input", draw));
  document.querySelectorAll("[data-me-preset]").forEach(b => b.addEventListener("click", () => {
    const p = b.dataset.mePreset;
    if (p === "argmax") tIn.value = "-3";
    if (p === "balanced") tIn.value = "0";
    if (p === "uniform") tIn.value = "4";
    draw();
  }));
  energyBtn.addEventListener("click", () => {
    energyView = !energyView;
    energyBtn.classList.toggle("active", energyView);
    energyBtn.textContent = energyView ? "score view" : "energy view";
    draw();
  });
  window.addEventListener("resize", draw);
  draw();
})();

// ===== Figure 3 =====
(() => {
  const canvas = document.getElementById("fig-kernels");
  const bwIn = document.getElementById("kz-bw");
  const bwV = document.getElementById("kz-bw-v");
  const readout = document.getElementById("kernels-readout");

  function setup(c) {
    const ratio = window.devicePixelRatio || 1;
    const iw = +c.getAttribute("width"), ih = +c.getAttribute("height");
    c.style.width = "100%"; c.style.height = `${c.getBoundingClientRect().width * ih / iw}px`;
    const r = c.getBoundingClientRect();
    c.width = r.width * ratio; c.height = r.height * ratio;
    const ctx = c.getContext("2d"); ctx.scale(ratio, ratio);
    return { ctx, w: r.width, h: r.height };
  }

  function draw() {
    const { ctx, w, h } = setup(canvas);
    const bw = +bwIn.value;
    bwV.textContent = bw.toFixed(2);

    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h);
    const padL = 50, padR = 22, padT = 28, padB = 40;
    const plotW = w - padL - padR, plotH = h - padT - padB;
    ctx.strokeStyle = "#e3ddd0"; ctx.strokeRect(padL, padT, plotW, plotH);

    // x: distance from query, -1.5 to 1.5; y: kernel value 0..1
    const xMin = -1.5, xMax = 1.5;
    const xS = (x) => padL + ((x - xMin) / (xMax - xMin)) * plotW;
    const yS = (y) => padT + plotH - 6 - y * (plotH - 18);

    // gridlines
    ctx.strokeStyle = "#f1ede2";
    for (let k = 0; k <= 6; k++) {
      const v = xMin + k / 6 * (xMax - xMin);
      ctx.beginPath(); ctx.moveTo(xS(v), padT); ctx.lineTo(xS(v), padT + plotH); ctx.stroke();
    }
    ctx.strokeStyle = "#0f172a"; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(xS(0), padT); ctx.lineTo(xS(0), padT + plotH); ctx.stroke();
    ctx.setLineDash([]);

    function plot(fn, color, dash = null) {
      ctx.strokeStyle = color; ctx.lineWidth = 2.2;
      if (dash) ctx.setLineDash(dash);
      ctx.beginPath();
      for (let i = 0; i <= 200; i++) {
        const x = xMin + i / 200 * (xMax - xMin);
        const y = Math.max(0, Math.min(1, fn(x)));
        const px = xS(x), py = yS(y);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }
    // standard softmax (Gaussian RBF)
    plot((x) => Math.exp(-x * x / (2 * bw * bw)), "#1f4a8c");
    // linear attention with random Gaussian features (smoothed positive kernel)
    plot((x) => Math.max(0, 1 - Math.abs(x) / (bw * 3.5)) ** 2, "#2d7a3e");
    // local window
    plot((x) => Math.abs(x) <= bw ? 1 : 0, "#b8412a");
    // ALiBi-style linear bias
    plot((x) => Math.max(0, 1 - Math.abs(x) / (bw * 4)), "#6b4592", [5, 4]);

    // axes
    ctx.fillStyle = "#8892a3"; ctx.font = "10px -apple-system, sans-serif"; ctx.textAlign = "center";
    [-1.5, -1, -0.5, 0, 0.5, 1, 1.5].forEach(v => {
      ctx.fillText(v.toFixed(1), xS(v), padT + plotH + 14);
    });
    ctx.fillStyle = "#475569"; ctx.font = "11px -apple-system, sans-serif";
    ctx.fillText("distance from query (in embedding or position space)", padL + plotW / 2, padT + plotH + 28);
    ctx.save(); ctx.translate(padL - 36, padT + plotH / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillText("kernel weight (unnormalized)", 0, 0); ctx.restore();

    ctx.fillStyle = "#0f172a"; ctx.font = "10px -apple-system, sans-serif"; ctx.textAlign = "left";
    ctx.fillText("query", xS(0) + 6, padT + 12);

    readout.innerHTML =
      `<div class="row"><span class="lbl">standard softmax</span><span>$O(N^2)$ cost, smooth global retrieval</span></div>` +
      `<div class="row"><span class="lbl">linear attention</span><span>$O(N)$ cost via $\\phi(q)^\\top \\sum \\phi(k_i) v_i^\\top$ factorization</span></div>` +
      `<div class="row"><span class="lbl">local-window</span><span>sliding-window transformers, $O(Nw)$ cost</span></div>` +
      `<div class="row"><span class="lbl">positional bias (ALiBi, T5)</span><span>linear/log decay added to logits before softmax</span></div>`;
  }

  bwIn.addEventListener("input", draw);
  window.addEventListener("resize", draw);
  draw();
})();

// ===== Figure 4 =====
(() => {
  const canvas = document.getElementById("fig-mh");
  const sentIn = document.getElementById("mh-sent");
  const modeIn = document.getElementById("mh-mode");
  const headIn = document.getElementById("mh-head");
  const sentV = document.getElementById("mh-sent-v");
  const modeV = document.getElementById("mh-mode-v");
  const headV = document.getElementById("mh-head-v");
  const readout = document.getElementById("mh-readout");

  const SENTS = [
    ["the", "cat", "sat", "on", "the", "mat"],
    ["she", "gave", "him", "a", "book"],
    ["birds", "fly", "over", "tall", "trees"],
  ];
  // subject pointers per sentence: each verb/preposition points to its subject
  // structure: for each sentence, array of "structural" pointers, where pointer[i] = j means
  // token i has a syntactic attachment to token j; -1 means self
  const STRUCT = [
    [-1, -1, 1, 2, -1, 3],   // the cat sat[->cat] on[->sat] the mat[->on]
    [-1, 0, 1, -1, 1],        // she gave[->she] him[->gave] a book[->gave]
    [-1, 0, 1, 4, -1],        // birds fly[->birds] over[->fly] tall[->trees] trees
  ];
  // determiner / modifier pointers: which tokens are modifiers and where they point
  const MOD = [
    [1, -1, -1, -1, 5, -1],  // the->cat, the->mat
    [-1, -1, -1, 4, -1],      // a->book
    [-1, -1, -1, 4, -1],      // tall->trees
  ];

  const HEAD_NAMES = [
    "previous-token (induction-style)",
    "subject / governor pointer",
    "positional decay (recency)",
    "modifier → noun (determiner)",
  ];

  function softmaxRow(scores) {
    const m = Math.max(...scores);
    const ex = scores.map(s => Math.exp(s - m));
    const Z = ex.reduce((a, b) => a + b, 0);
    return ex.map(e => e / Z);
  }

  function buildHead(headIdx, sentIdx) {
    const tokens = SENTS[sentIdx];
    const n = tokens.length;
    const struct = STRUCT[sentIdx];
    const mod = MOD[sentIdx];
    const A = Array.from({ length: n }, () => new Array(n).fill(0));
    for (let i = 0; i < n; i++) {
      const scores = new Array(n).fill(-1e9);
      for (let j = 0; j <= i; j++) scores[j] = -2.0; // baseline with mask
      if (headIdx === 0) {
        // previous token: peak at i-1 (i=0 attends to self)
        if (i === 0) scores[0] = 4;
        else { scores[i - 1] = 4; scores[i] = 0; }
      } else if (headIdx === 1) {
        // subject/governor pointer
        const tgt = struct[i] >= 0 && struct[i] <= i ? struct[i] : i;
        scores[tgt] = 4;
        scores[i] = 0.5; // weak self
      } else if (headIdx === 2) {
        // positional decay
        for (let j = 0; j <= i; j++) scores[j] = -1.2 * (i - j);
      } else if (headIdx === 3) {
        // modifier → noun (only if it's a modifier looking ahead, but causal masked => attends to nearest right neighbor that's in cache)
        // for left-to-right causal model, this becomes "noun ← modifier" so non-modifier tokens attend to the modifier
        // Easier: each token attends to a modifier-marked predecessor if present, else self
        let tgt = i;
        for (let j = i - 1; j >= 0; j--) { if (mod[j] >= 0) { tgt = j; break; } }
        scores[tgt] = 4;
        scores[i] = 0.5;
      }
      A[i] = softmaxRow(scores);
    }
    return A;
  }

  function setup(c) {
    const ratio = window.devicePixelRatio || 1;
    const iw = +c.getAttribute("width"), ih = +c.getAttribute("height");
    c.style.width = "100%"; c.style.height = `${c.getBoundingClientRect().width * ih / iw}px`;
    const r = c.getBoundingClientRect();
    c.width = r.width * ratio; c.height = r.height * ratio;
    const ctx = c.getContext("2d"); ctx.scale(ratio, ratio);
    return { ctx, w: r.width, h: r.height };
  }

  function drawHeatmap(ctx, x0, y0, sz, A, tokens, title) {
    const n = tokens.length;
    const cellW = (sz - 60) / n;
    const cellH = (sz - 60) / n;
    // labels top (key tokens)
    ctx.fillStyle = "#475569"; ctx.font = "10px -apple-system, sans-serif"; ctx.textAlign = "center";
    for (let j = 0; j < n; j++) {
      const cx = x0 + 60 + (j + 0.5) * cellW;
      ctx.save(); ctx.translate(cx, y0 + 22); ctx.rotate(-Math.PI / 4);
      ctx.textAlign = "right"; ctx.fillText(tokens[j], 0, 0); ctx.restore();
    }
    // labels left (query tokens)
    ctx.textAlign = "right"; ctx.fillStyle = "#475569"; ctx.font = "10px -apple-system, sans-serif";
    for (let i = 0; i < n; i++) {
      const cy = y0 + 28 + (i + 0.5) * cellH;
      ctx.fillText(tokens[i], x0 + 56, cy + 3);
    }
    // cells
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const cx = x0 + 60 + j * cellW;
        const cy = y0 + 28 + i * cellH;
        if (j > i) {
          ctx.fillStyle = "#f1f5f9";
          ctx.fillRect(cx, cy, cellW, cellH);
        } else {
          const v = A[i][j];
          const alpha = Math.min(1, v * 1.2);
          ctx.fillStyle = `rgba(31,74,140,${0.05 + alpha * 0.9})`;
          ctx.fillRect(cx, cy, cellW, cellH);
        }
        ctx.strokeStyle = "rgba(255,255,255,0.6)"; ctx.lineWidth = 0.5;
        ctx.strokeRect(cx, cy, cellW, cellH);
      }
    }
    // border
    ctx.strokeStyle = "#cbd5e1"; ctx.lineWidth = 1;
    ctx.strokeRect(x0 + 60, y0 + 28, cellW * n, cellH * n);
    // title
    ctx.fillStyle = "#0f172a"; ctx.font = "bold 10px -apple-system, sans-serif"; ctx.textAlign = "left";
    ctx.fillText(title, x0 + 4, y0 + 12);
  }

  function draw() {
    const { ctx, w, h } = setup(canvas);
    const sentIdx = +sentIn.value;
    const mode = modeIn.value;
    const headIdx = +headIn.value;
    sentV.textContent = sentIn.options[sentIn.selectedIndex].text;
    modeV.textContent = modeIn.options[modeIn.selectedIndex].text;
    headV.textContent = HEAD_NAMES[headIdx];

    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h);
    const tokens = SENTS[sentIdx];

    if (mode === "all") {
      const cellSz = Math.min((w - 40) / 2 - 10, (h - 40) / 2 - 10);
      for (let k = 0; k < 4; k++) {
        const col = k % 2, row = Math.floor(k / 2);
        const x0 = 20 + col * (cellSz + 10);
        const y0 = 20 + row * (cellSz + 10);
        const A = buildHead(k, sentIdx);
        drawHeatmap(ctx, x0, y0, cellSz, A, tokens, `H${k + 1}: ${HEAD_NAMES[k]}`);
      }
    } else {
      const sz = Math.min(w - 40, h - 40);
      const A = buildHead(headIdx, sentIdx);
      drawHeatmap(ctx, (w - sz) / 2, 20, sz, A, tokens, `H${headIdx + 1}: ${HEAD_NAMES[headIdx]}`);
    }

    readout.innerHTML =
      `<div class="row"><span class="lbl">sentence</span><span>"${tokens.join(" ")}"</span></div>` +
      `<div class="row"><span class="lbl">interpretation</span><span>each row = one query token; brighter cell = larger attention weight; future-position cells are masked</span></div>` +
      `<div class="row"><span class="lbl">note</span><span>stylized patterns inspired by real heads in trained transformers — not measured outputs</span></div>`;
  }

  [sentIn, modeIn, headIn].forEach(i => i.addEventListener("input", draw));
  window.addEventListener("resize", draw);
  draw();
})();

// ===== Figure 5 =====
(() => {
  const canvas = document.getElementById("fig-kv");
  const tIn = document.getElementById("kv-t");
  const tauIn = document.getElementById("kv-tau");
  const patIn = document.getElementById("kv-pattern");
  const tV = document.getElementById("kv-t-v");
  const tauV = document.getElementById("kv-tau-v");
  const patV = document.getElementById("kv-pattern-v");
  const readout = document.getElementById("kv-readout");

  const TOKENS = ["the", "cat", "sat", "on", "the", "mat"];
  // synthetic key vectors (2D) and value scalars
  const KEYS = [[0.8, 0.1], [0.1, 0.9], [-0.6, 0.4], [-0.3, -0.6], [0.8, 0.1], [-0.1, 0.95]];
  const VALS = [0.2, 0.9, 0.6, 0.3, 0.2, 0.85];

  function setup(c) {
    const ratio = window.devicePixelRatio || 1;
    const iw = +c.getAttribute("width"), ih = +c.getAttribute("height");
    c.style.width = "100%"; c.style.height = `${c.getBoundingClientRect().width * ih / iw}px`;
    const r = c.getBoundingClientRect();
    c.width = r.width * ratio; c.height = r.height * ratio;
    const ctx = c.getContext("2d"); ctx.scale(ratio, ratio);
    return { ctx, w: r.width, h: r.height };
  }

  function softmax(scores) {
    const m = Math.max(...scores);
    const ex = scores.map(s => Math.exp(s - m));
    const Z = ex.reduce((a, b) => a + b, 0);
    return ex.map(e => e / Z);
  }

  function query(t, pattern) {
    // produce a query vector that targets a specific kind of token at step t
    if (pattern === "subject") {
      // verb-like tokens (sat, fly, ...) query for the subject
      // simulate: at step t we ask "what came before that matched the noun template"
      return [0.05, 0.95]; // matches "cat"-like keys
    } else if (pattern === "previous") {
      // query keys at step t-1
      return KEYS[t - 1];
    } else {
      return [0, 0]; // uniform
    }
  }

  function draw() {
    const { ctx, w, h } = setup(canvas);
    const t = Math.min(+tIn.value, TOKENS.length);
    const tau = +tauIn.value;
    const pattern = patIn.value;
    tV.textContent = t.toString();
    tauV.textContent = tau.toFixed(2);
    patV.textContent = patIn.options[patIn.selectedIndex].text;

    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h);

    const q = query(t, pattern);
    // compute attention weights over keys 0..t-1
    const scores = [];
    for (let i = 0; i < t; i++) {
      if (pattern === "uniform") scores.push(0);
      else scores.push((q[0] * KEYS[i][0] + q[1] * KEYS[i][1]) / tau);
    }
    const alphas = softmax(scores);
    const output = alphas.reduce((acc, a, i) => acc + a * VALS[i], 0);

    // layout
    const padL = 30, padR = 30, padT = 40, padB = 20;
    const cellW = (w - padL - padR) / TOKENS.length;

    // row 1: token sequence
    const y1 = padT;
    ctx.fillStyle = "#0f172a"; ctx.font = "11px -apple-system, sans-serif"; ctx.textAlign = "left";
    ctx.fillText("Token sequence", padL, y1 - 16);
    for (let i = 0; i < TOKENS.length; i++) {
      const x = padL + i * cellW + cellW * 0.1;
      const inCache = i < t;
      ctx.fillStyle = inCache ? "#e0e7ff" : "#f1f5f9";
      ctx.strokeStyle = inCache ? "#1f4a8c" : "#cbd5e1";
      ctx.lineWidth = i === t - 1 ? 2.4 : 1;
      ctx.fillRect(x, y1, cellW * 0.8, 30);
      ctx.strokeRect(x, y1, cellW * 0.8, 30);
      ctx.fillStyle = inCache ? "#0f172a" : "#94a3b8";
      ctx.font = "bold 12px -apple-system, sans-serif"; ctx.textAlign = "center";
      ctx.fillText(TOKENS[i], x + cellW * 0.4, y1 + 19);
      ctx.fillStyle = "#475569"; ctx.font = "9px -apple-system, sans-serif";
      ctx.fillText(`t=${i + 1}`, x + cellW * 0.4, y1 + 42);
    }

    // current step marker arrow
    if (t > 0) {
      const cx = padL + (t - 1) * cellW + cellW * 0.5;
      ctx.fillStyle = "#b8412a"; ctx.font = "bold 11px -apple-system, sans-serif"; ctx.textAlign = "center";
      ctx.fillText("query qₜ ↓", cx, y1 - 4);
    }

    // row 2: KV cache as table
    const y2 = y1 + 70;
    ctx.fillStyle = "#0f172a"; ctx.font = "11px -apple-system, sans-serif"; ctx.textAlign = "left";
    ctx.fillText(`KV cache (size ${t})`, padL, y2 - 6);
    ctx.fillStyle = "#475569"; ctx.font = "10px -apple-system, sans-serif"; ctx.textAlign = "left";
    ctx.fillText("kᵢ:", padL + 30, y2 + 12);
    ctx.fillText("vᵢ:", padL + 30, y2 + 30);
    for (let i = 0; i < TOKENS.length; i++) {
      const x = padL + i * cellW + cellW * 0.1;
      const inCache = i < t;
      const op = inCache ? 1 : 0.15;
      ctx.globalAlpha = op;
      ctx.fillStyle = "#f1ede2"; ctx.strokeStyle = "#cbd5e1";
      ctx.fillRect(x, y2 + 2, cellW * 0.8, 18);
      ctx.strokeRect(x, y2 + 2, cellW * 0.8, 18);
      ctx.fillRect(x, y2 + 22, cellW * 0.8, 18);
      ctx.strokeRect(x, y2 + 22, cellW * 0.8, 18);
      ctx.fillStyle = "#1f4a8c"; ctx.font = "10px 'SF Mono', monospace"; ctx.textAlign = "center";
      ctx.fillText(`[${KEYS[i][0].toFixed(1)},${KEYS[i][1].toFixed(1)}]`, x + cellW * 0.4, y2 + 15);
      ctx.fillStyle = "#6b4592";
      ctx.fillText(VALS[i].toFixed(2), x + cellW * 0.4, y2 + 35);
      ctx.globalAlpha = 1;
    }

    // row 3: attention weights as bars over the cache
    const y3 = y2 + 70;
    ctx.fillStyle = "#0f172a"; ctx.font = "11px -apple-system, sans-serif"; ctx.textAlign = "left";
    ctx.fillText(`Attention weights αᵢ = softmax(q · kᵢ / τ)`, padL, y3 - 6);
    const mxA = Math.max(...alphas, 0.01);
    for (let i = 0; i < TOKENS.length; i++) {
      const x = padL + i * cellW + cellW * 0.1;
      const bw = cellW * 0.8;
      if (i < t) {
        const bh = (alphas[i] / mxA) * 60;
        ctx.fillStyle = "#b8412a";
        ctx.fillRect(x, y3 + 60 - bh, bw, bh);
        ctx.fillStyle = "#0f172a"; ctx.font = "10px -apple-system, sans-serif"; ctx.textAlign = "center";
        ctx.fillText((alphas[i] * 100).toFixed(0) + "%", x + cellW * 0.4, y3 + 60 - bh - 3);
      } else {
        ctx.fillStyle = "#f1ede2";
        ctx.fillRect(x, y3 + 60 - 2, bw, 2);
      }
    }

    // output bar
    const yOut = y3 + 80;
    ctx.fillStyle = "#0f172a"; ctx.font = "11px -apple-system, sans-serif"; ctx.textAlign = "left";
    ctx.fillText(`Output: Σᵢ αᵢ vᵢ = ${output.toFixed(3)}`, padL, yOut - 4);
    ctx.fillStyle = "#f1ede2"; ctx.fillRect(padL, yOut, w - padL - padR, 14);
    ctx.fillStyle = "#2d7a3e"; ctx.fillRect(padL, yOut, output * (w - padL - padR), 14);

    const focusIdx = alphas.indexOf(Math.max(...alphas));
    readout.innerHTML =
      `<div class="row"><span class="lbl">cache size at step $t$</span><span>${t} rows of (kᵢ, vᵢ)</span></div>` +
      `<div class="row"><span class="lbl">peak attention</span><span>token ${focusIdx + 1} (${TOKENS[focusIdx]}) at ${(alphas[focusIdx] * 100).toFixed(0)}%</span></div>` +
      `<div class="row"><span class="lbl">output value</span><span>${output.toFixed(3)} — weighted sum of cached vᵢ</span></div>` +
      `<div class="row"><span class="lbl">why not collapse the cache</span><span>each future query qₜ' reweights the same kᵢ differently — the summary is query-dependent, so raw kᵢ must be retained</span></div>`;
  }

  [tIn, tauIn, patIn].forEach(i => i.addEventListener("input", draw));
  window.addEventListener("resize", draw);
  draw();
})();
