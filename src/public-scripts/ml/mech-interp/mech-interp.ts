type Point = { x: number; y: number };

const colors = {
  text: "#1f2733",
  dim: "#5a6577",
  rule: "#d8d2c4",
  grid: "#e3ddd0",
  panel: "#f3f1ec",
  blue: "#1f4a8c",
  red: "#b8412a",
  green: "#2d7a3e",
  purple: "#6b4592",
  orange: "#d4690a",
};

function canvas(id: string): HTMLCanvasElement | null {
  const el = document.getElementById(id);
  return el instanceof HTMLCanvasElement ? el : null;
}

function input(id: string): HTMLInputElement | null {
  const el = document.getElementById(id);
  return el instanceof HTMLInputElement ? el : null;
}

function select(id: string): HTMLSelectElement | null {
  const el = document.getElementById(id);
  return el instanceof HTMLSelectElement ? el : null;
}

function readout(id: string, html: string) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

function setText(id: string, text: string) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function ctx2d(c: HTMLCanvasElement): CanvasRenderingContext2D {
  const logical = logicalSize(c);
  const rect = c.getBoundingClientRect();
  const cssWidth = rect.width || logical.width;
  const cssHeight = cssWidth * logical.height / logical.width;
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const backingWidth = Math.round(cssWidth * dpr);
  const backingHeight = Math.round(cssHeight * dpr);

  c.style.width = "100%";
  c.style.height = `${cssHeight}px`;
  if (c.width !== backingWidth || c.height !== backingHeight) {
    c.width = backingWidth;
    c.height = backingHeight;
  }

  const ctx = c.getContext("2d");
  if (!ctx) throw new Error(`2-D canvas context unavailable for #${c.id}`);
  ctx.setTransform(cssWidth / logical.width * dpr, 0, 0, cssHeight / logical.height * dpr, 0, 0);
  return ctx;
}

function logicalSize(c: HTMLCanvasElement): { width: number; height: number } {
  c.dataset.logicalWidth ??= c.getAttribute("width") ?? String(c.width);
  c.dataset.logicalHeight ??= c.getAttribute("height") ?? String(c.height);
  return {
    width: Number(c.dataset.logicalWidth) || 760,
    height: Number(c.dataset.logicalHeight) || 390,
  };
}

function clear(ctx: CanvasRenderingContext2D, c: HTMLCanvasElement) {
  const { width, height } = logicalSize(c);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, width, height);
}

function line(ctx: CanvasRenderingContext2D, a: Point, b: Point, color = colors.rule, width = 1) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
}

function arrow(ctx: CanvasRenderingContext2D, a: Point, b: Point, color = colors.blue, width = 2) {
  line(ctx, a, b, color, width);
  const angle = Math.atan2(b.y - a.y, b.x - a.x);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(b.x, b.y);
  ctx.lineTo(b.x - 9 * Math.cos(angle - 0.45), b.y - 9 * Math.sin(angle - 0.45));
  ctx.lineTo(b.x - 9 * Math.cos(angle + 0.45), b.y - 9 * Math.sin(angle + 0.45));
  ctx.closePath();
  ctx.fill();
}

function dot(ctx: CanvasRenderingContext2D, p: Point, r: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  ctx.fill();
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = colors.dim, size = 12, align: CanvasTextAlign = "left") {
  ctx.fillStyle = color;
  ctx.font = `${size}px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif`;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
}

function box(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill = colors.panel, stroke = colors.rule) {
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 7);
  ctx.fill();
  ctx.stroke();
}

function value(id: string, fallback: number): number {
  return Number(input(id)?.value ?? fallback);
}

function attach(ids: string[], draw: () => void) {
  ids.forEach((id) => {
    const el = document.getElementById(id);
    el?.addEventListener("input", draw);
    el?.addEventListener("change", draw);
  });
  window.addEventListener("resize", draw);
  draw();
}

function drawResidualStream() {
  const c = canvas("residual-stream-canvas");
  if (!c) return;
  const ctx = ctx2d(c);
  const layer = value("residual-layer", 4);
  const sparsity = value("residual-sparsity", 0.25);
  setText("residual-layer-v", layer.toFixed(0));
  setText("residual-sparsity-v", `${Math.round(sparsity * 100)}%`);
  clear(ctx, c);
  label(ctx, "one token's residual stream", 26, 28, colors.text, 14);
  const baseX = 58;
  const baseY = 76;
  const cellW = 34;
  const cellH = 22;
  for (let d = 0; d < 10; d++) {
    const v = Math.sin(d * 1.8 + layer * 0.7) * (0.35 + 0.55 * layer / 8);
    const alpha = Math.min(0.82, Math.abs(v));
    ctx.fillStyle = v >= 0 ? `rgba(31,74,140,${alpha})` : `rgba(184,65,42,${alpha})`;
    ctx.fillRect(baseX + d * cellW, baseY, cellW - 3, cellH);
    ctx.strokeStyle = colors.rule;
    ctx.strokeRect(baseX + d * cellW + 0.5, baseY + 0.5, cellW - 4, cellH - 1);
  }
  label(ctx, "running sum in residual coordinates", baseX, baseY + 44);
  const sources = [
    { name: "embed", x: 72, y: 178, color: colors.dim },
    { name: "head A", x: 192, y: 176, color: colors.blue },
    { name: "MLP", x: 312, y: 178, color: colors.green },
    { name: "head B", x: 432, y: 176, color: colors.purple },
    { name: "unembed", x: 552, y: 178, color: colors.red },
  ];
  sources.forEach((s, i) => {
    box(ctx, s.x - 34, s.y - 19, 68, 38, "#fff", s.color);
    label(ctx, s.name, s.x, s.y + 4, s.color, 12, "center");
    if (i < sources.length - 1) arrow(ctx, { x: s.x + 38, y: s.y }, { x: sources[i + 1].x - 40, y: sources[i + 1].y }, colors.rule, 2);
  });
  label(ctx, "superposition toy", 26, 268, colors.text, 14);
  const center = { x: 185, y: 347 };
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const active = (i / 12) < sparsity;
    const r = active ? 90 : 54;
    arrow(ctx, center, { x: center.x + Math.cos(angle) * r, y: center.y + Math.sin(angle) * r }, active ? colors.orange : "#cbd5df", active ? 2.4 : 1);
  }
  const interference = Math.max(0, (sparsity - 0.35) / 0.65);
  ctx.fillStyle = `rgba(184,65,42,${0.08 + interference * 0.32})`;
  ctx.beginPath();
  ctx.arc(center.x, center.y, 75, 0, Math.PI * 2);
  ctx.fill();
  label(ctx, "more active features -> more off-axis interference", 318, 330, colors.dim);
  label(ctx, "decodable direction", 318, 354, colors.blue);
  label(ctx, "polysemantic mixture", 318, 376, colors.red);
  readout("residual-stream-readout", `<div class="row"><span class="lbl">layer</span><span>${layer.toFixed(0)}</span></div><div class="row"><span class="lbl">feature activity</span><span>${Math.round(sparsity * 100)}% active</span></div>`);
}

function drawQkOv() {
  const c = canvas("qk-ov-canvas");
  if (!c) return;
  const ctx = ctx2d(c);
  const focus = Math.max(0, Math.min(5, Math.round(value("qk-token", 3))));
  const qkScale = value("qk-scale", 1);
  setText("qk-token-v", String(focus));
  setText("qk-scale-v", qkScale.toFixed(2));
  clear(ctx, c);
  const tokens = ["The", "key", "unlocked", "the", "door", "."];
  const scores = tokens.map((_, i) => {
    if (i > focus) return -3.2;
    const target = Math.max(0, focus - 1);
    return 2.35 - Math.abs(i - target) * 0.95 - (i === focus ? 0.65 : 0);
  });
  const scaledScores = scores.map((s) => s * qkScale);
  const maxScore = Math.max(...scaledScores);
  const expScores = scaledScores.map((s, i) => (i <= focus ? Math.exp(s - maxScore) : 0));
  const normalizer = expScores.reduce((a, b) => a + b, 0);
  const weights = expScores.map((s) => s / normalizer);
  const topSource = weights.reduce((best, w, i) => (w > weights[best] ? i : best), 0);
  const tokenX = (i: number) => 72 + i * 88;
  label(ctx, "QK: score source positions, then softmax", 30, 28, colors.text, 14);
  tokens.forEach((t, i) => {
    const x = tokenX(i);
    const masked = i > focus;
    const fill = i === focus ? "#fee2d5" : masked ? "#f8f7f4" : colors.panel;
    const stroke = i === focus ? colors.red : masked ? "#e7e1d5" : colors.rule;
    box(ctx, x - 34, 54, 68, 32, fill, stroke);
    label(ctx, t, x, 75, masked ? "#9aa1ac" : i === focus ? colors.red : colors.text, 12, "center");
    if (masked) label(ctx, "masked", x, 102, "#9aa1ac", 9, "center");
  });
  for (let i = 0; i < tokens.length; i++) {
    if (i > focus) continue;
    const srcX = tokenX(i);
    const dstX = tokenX(focus);
    const strength = weights[i];
    ctx.strokeStyle = `rgba(31,74,140,${0.12 + strength * 1.15})`;
    ctx.lineWidth = 1 + strength * 8;
    ctx.beginPath();
    ctx.moveTo(dstX, 94);
    ctx.quadraticCurveTo((srcX + dstX) / 2, 142 - Math.abs(i - focus) * 7, srcX, 94);
    ctx.stroke();
  }
  const scoreBase = 178;
  const weightBase = 242;
  label(ctx, "scores s_ti", 30, 146, colors.dim, 11);
  label(ctx, "weights a_ti", 30, 210, colors.dim, 11);
  tokens.forEach((t, i) => {
    const x = tokenX(i);
    const scoreHeight = Math.max(4, (scores[i] + 3.4) * 9);
    ctx.fillStyle = i > focus ? "#d8d2c4" : colors.blue;
    ctx.fillRect(x - 13, scoreBase - scoreHeight, 26, scoreHeight);
    label(ctx, t, x, scoreBase + 16, colors.dim, 9, "center");
    const weightHeight = Math.max(2, weights[i] * 86);
    ctx.fillStyle = i === topSource ? colors.red : `rgba(184,65,42,${0.25 + weights[i] * 1.2})`;
    ctx.fillRect(x - 13, weightBase - weightHeight, 26, weightHeight);
    label(ctx, `${Math.round(weights[i] * 100)}%`, x, weightBase + 16, colors.dim, 9, "center");
  });
  label(ctx, `softmax scale ${qkScale.toFixed(2)} changes routing sharpness`, 508, 210, colors.dim, 11);
  label(ctx, "OV: map weighted values to the residual stream", 30, 292, colors.text, 14);
  tokens.forEach((t, i) => {
    const x = 54 + i * 58;
    const alpha = Math.max(0.08, weights[i]);
    box(ctx, x - 23, 325, 46, 42, `rgba(31,74,140,${alpha})`, i === topSource ? colors.red : colors.rule);
    label(ctx, `v${i}`, x, 348, i === topSource ? "#fff" : colors.blue, 12, "center");
    label(ctx, t, x, 382, colors.dim, 9, "center");
  });
  const mix = { x: 465, y: 346 };
  const wo = { x: 585, y: 346 };
  const write = { x: 704, y: 346 };
  arrow(ctx, { x: 374, y: 346 }, { x: mix.x - 72, y: mix.y }, colors.blue, 3);
  box(ctx, mix.x - 66, mix.y - 28, 132, 56, "#fff", colors.blue);
  label(ctx, "weighted value", mix.x, mix.y - 4, colors.blue, 12, "center");
  label(ctx, "z_t = sum a_ti v_i", mix.x, mix.y + 16, colors.blue, 12, "center");
  arrow(ctx, { x: mix.x + 72, y: mix.y }, { x: wo.x - 34, y: wo.y }, colors.orange, 3);
  box(ctx, wo.x - 28, wo.y - 24, 56, 48, "#fff", colors.orange);
  label(ctx, "W_O", wo.x, wo.y + 5, colors.orange, 14, "center");
  arrow(ctx, { x: wo.x + 34, y: wo.y }, { x: write.x - 62, y: write.y }, colors.orange, 3);
  box(ctx, write.x - 56, write.y - 30, 112, 60, "#fff", colors.red);
  label(ctx, "residual write", write.x, write.y - 6, colors.red, 12, "center");
  label(ctx, "Delta x_t", write.x, write.y + 16, colors.red, 13, "center");
  ["door", "lock", "open", "key"].forEach((word, i) => {
    const h = [38, 52, 28, 62][i] * (0.45 + weights[topSource]);
    ctx.fillStyle = [colors.blue, colors.green, colors.orange, colors.purple][i];
    ctx.fillRect(528 + i * 38, 424 - h, 18, h);
    label(ctx, word, 537 + i * 38, 418, colors.dim, 8, "center");
  });
  readout("qk-ov-readout", `<div class="row"><span class="lbl">destination token</span><span>${tokens[focus]}</span></div><div class="row"><span class="lbl">QK scale</span><span>${qkScale.toFixed(2)} (${qkScale > 1 ? "sharper" : qkScale < 1 ? "flatter" : "baseline"} softmax)</span></div><div class="row"><span class="lbl">largest QK weight</span><span>${tokens[topSource]} (${Math.round(weights[topSource] * 100)}%)</span></div><div class="row"><span class="lbl">OV step</span><span>weighted values -> output matrix -> residual update</span></div>`);
}

function drawProbeValidity() {
  const c = canvas("probe-validity-canvas");
  if (!c) return;
  const ctx = ctx2d(c);
  const capacity = value("probe-capacity", 0.35);
  const control = input("probe-control")?.checked ?? false;
  setText("probe-capacity-v", `${Math.round(capacity * 100)}%`);
  clear(ctx, c);
  label(ctx, "schematic representation space", 30, 30, colors.text, 14);
  for (let i = 0; i < 56; i++) {
    const cls = i % 2;
    const x = 92 + (i % 14) * 28 + Math.sin(i * 2.1) * 8;
    const y = 85 + Math.floor(i / 14) * 46 + (cls ? 18 : -8) + Math.cos(i * 1.7) * 8;
    dot(ctx, { x, y }, 4, control ? (i % 3 === 0 ? colors.red : colors.blue) : (cls ? colors.red : colors.blue));
  }
  const wiggle = capacity * 22;
  ctx.strokeStyle = control ? colors.orange : colors.green;
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let t = 0; t <= 1; t += 0.02) {
    const x = 70 + t * 390;
    const y = 190 + Math.sin(t * Math.PI * 4) * wiggle + (control ? Math.sin(t * Math.PI * 13) * capacity * 18 : 0);
    t ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.stroke();
  const raw = control ? 0.52 + capacity * 0.42 : 0.74 + capacity * 0.18;
  const selectivity = control ? Math.max(0.02, 0.88 - raw) : 0.62 + (1 - capacity) * 0.18;
  const bars = [
    ["raw score", raw, colors.blue],
    ["selectivity", selectivity, colors.green],
    ["control score", control ? raw - 0.02 : 0.12 + capacity * 0.25, colors.red],
  ] as const;
  bars.forEach(([name, v, color], i) => {
    const x = 534 + i * 72;
    ctx.fillStyle = color;
    ctx.fillRect(x, 266 - v * 190, 42, v * 190);
    label(ctx, `${Math.round(v * 100)}%`, x + 21, 256 - v * 190, color, 12, "center");
    label(ctx, name, x + 21, 285, colors.dim, 10, "center");
  });
  readout("probe-validity-readout", `<div class="row"><span class="lbl">probe capacity</span><span>${Math.round(capacity * 100)}%</span></div><div class="row"><span class="lbl">control</span><span>${control ? "word-type labels expose memorization" : "linguistic task only"}</span></div>`);
}

function drawMdlEvidence() {
  const c = canvas("mdl-evidence-canvas");
  if (!c) return;
  const ctx = ctx2d(c);
  const k = value("mdl-complexity", 0.45);
  setText("mdl-complexity-v", `${Math.round(k * 100)}%`);
  clear(ctx, c);
  const ox = 62;
  const oy = 310;
  const w = 610;
  const h = 240;
  line(ctx, { x: ox, y: oy }, { x: ox + w, y: oy }, colors.rule);
  line(ctx, { x: ox, y: oy }, { x: ox, y: oy - h }, colors.rule);
  const curve = (fn: (x: number) => number, color: string, width = 2) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    for (let i = 0; i <= 160; i++) {
      const t = i / 160;
      const x = ox + t * w;
      const y = oy - fn(t) * h;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
  };
  const fit = (x: number) => 0.12 + 0.82 * (1 - Math.exp(-4.5 * x));
  const penalty = (x: number) => 0.05 + 0.72 * x ** 1.25;
  const evidence = (x: number) => 0.18 + 0.78 * Math.exp(-(((x - 0.46) / 0.24) ** 2));
  curve(fit, colors.blue);
  curve(penalty, colors.red);
  curve(evidence, colors.green, 3);
  const xk = ox + k * w;
  line(ctx, { x: xk, y: oy + 8 }, { x: xk, y: oy - h - 8 }, colors.orange, 2);
  label(ctx, "raw fit", ox + 420, oy - fit(0.78) * h - 8, colors.blue);
  label(ctx, "Occam penalty", ox + 430, oy - penalty(0.78) * h + 20, colors.red);
  label(ctx, "evidence", ox + 288, oy - evidence(0.46) * h - 12, colors.green);
  const modelBits = 24 + k * 150;
  const residualBits = 165 - fit(k) * 112;
  ctx.fillStyle = colors.red;
  ctx.fillRect(90, 362, modelBits, 18);
  ctx.fillStyle = colors.blue;
  ctx.fillRect(90 + modelBits, 362, residualBits, 18);
  label(ctx, "MDL code length = model bits + residual bits", 90, 350, colors.dim);
  readout("mdl-evidence-readout", `<div class="row"><span class="lbl">complexity</span><span>${Math.round(k * 100)}%</span></div><div class="row"><span class="lbl">effect</span><span>accuracy can rise past the evidence peak</span></div>`);
}

function drawCausalInterventions() {
  const c = canvas("causal-intervention-canvas");
  if (!c) return;
  const ctx = ctx2d(c);
  const mode = select("causal-mode")?.value ?? "ablate";
  setText("causal-mode-v", select("causal-mode")?.selectedOptions[0]?.textContent ?? mode);
  clear(ctx, c);
  label(ctx, "compare runs under the same behavior metric", 28, 28, colors.text, 14);

  const bars = [
    { name: "clean", value: 0.84, color: colors.green },
    { name: mode === "ablate" ? "ablated" : "corrupt", value: 0.30, color: colors.red },
    {
      name: mode === "patch" ? "patched" : mode === "hydra" ? "self-repair" : "ablated",
      value: mode === "patch" ? 0.76 : mode === "hydra" ? 0.58 : 0.30,
      color: mode === "patch" ? colors.green : mode === "hydra" ? colors.orange : colors.red,
    },
  ];
  bars.forEach((b, i) => {
    const x = 84 + i * 118;
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(x, 92, 72, 170);
    ctx.strokeStyle = colors.rule;
    ctx.strokeRect(x + 0.5, 92.5, 71, 169);
    ctx.fillStyle = b.color;
    ctx.fillRect(x + 16, 246 - b.value * 138, 40, b.value * 138);
    label(ctx, b.name, x + 36, 282, colors.dim, 12, "center");
    label(ctx, b.value.toFixed(2), x + 36, 236 - b.value * 138, b.color, 13, "center");
  });

  const site = { x: 520, y: 116 };
  const output = { x: 650, y: 116 };
  box(ctx, site.x - 48, site.y - 28, 96, 56, mode === "ablate" ? "#f8d7cb" : mode === "patch" ? "#dff2e6" : "#fff7df", mode === "hydra" ? colors.orange : mode === "patch" ? colors.green : colors.red);
  label(ctx, mode === "patch" ? "clean activation" : mode === "hydra" ? "head B grows" : "head A removed", site.x, site.y + 4, mode === "hydra" ? colors.orange : mode === "patch" ? colors.green : colors.red, 12, "center");
  arrow(ctx, { x: site.x + 54, y: site.y }, { x: output.x - 54, y: output.y }, mode === "hydra" ? colors.orange : colors.green, 3);
  box(ctx, output.x - 48, output.y - 28, 96, 56, "#fff", colors.blue);
  label(ctx, "behavior", output.x, output.y + 4, colors.blue, 12, "center");

  const note = mode === "ablate"
    ? "ablation tests necessity-style evidence, but compensation can hide effects"
    : mode === "patch"
      ? "patching asks whether a clean activation restores behavior under this metric"
      : "self-repair: another component grows after the first is removed";
  label(ctx, note, 438, 214, colors.dim);
  readout("causal-intervention-readout", `<div class="row"><span class="lbl">mode</span><span>${mode}</span></div><div class="row"><span class="lbl">scope</span><span>patching evidence depends on metric and corruption</span></div>`);
}

function drawLens() {
  const c = canvas("lens-canvas");
  if (!c) return;
  const ctx = ctx2d(c);
  const layer = value("lens-layer", 5);
  const tuned = input("lens-tuned")?.checked ?? false;
  setText("lens-layer-v", layer.toFixed(0));
  clear(ctx, c);
  const tokens = ["red", "blue", "Paris", "dog", "bridge"];
  label(ctx, "decoded next-token distribution by layer", 30, 28, colors.text, 14);
  tokens.forEach((tok, i) => {
    const base = i === 2 ? layer / 10 : (1 - layer / 10) * (0.6 - i * 0.07);
    const clean = tuned && layer < 5 ? base * (i === 2 ? 1.2 : 0.65) : base;
    const v = Math.max(0.04, Math.min(0.92, clean));
    ctx.fillStyle = i === 2 ? colors.green : colors.blue;
    ctx.fillRect(180, 72 + i * 42, v * 430, 24);
    label(ctx, tok, 150, 90 + i * 42, colors.text, 12, "right");
    label(ctx, `${Math.round(v * 100)}%`, 190 + v * 430, 90 + i * 42, colors.dim, 11);
  });
  const xs = Array.from({ length: 11 }, (_, i) => 74 + i * 58);
  line(ctx, { x: xs[0], y: 326 }, { x: xs[10], y: 326 }, colors.rule);
  xs.forEach((x, i) => {
    dot(ctx, { x, y: 326 - (i / 10) * 84 + (tuned ? 0 : Math.sin(i) * 12) }, i === layer ? 6 : 3, i === layer ? colors.red : colors.dim);
    label(ctx, String(i), x, 350, colors.dim, 10, "center");
  });
  label(ctx, "layer", 38, 350, colors.dim);
  readout("lens-readout", `<div class="row"><span class="lbl">layer</span><span>${layer}</span></div><div class="row"><span class="lbl">decoder</span><span>${tuned ? "tuned lens" : "logit lens"}</span></div>`);
}

function drawStructuralProbe() {
  const c = canvas("structural-probe-canvas");
  if (!c) return;
  const ctx = ctx2d(c);
  const layer = value("structural-layer", 6);
  const step = value("structural-step", 5);
  setText("structural-layer-v", layer.toFixed(0));
  setText("structural-step-v", step.toFixed(0));
  clear(ctx, c);
  const words = ["The", "cat", "sat", "on", "the", "mat"];
  const pts = [
    { x: 72, y: 146 },
    { x: 178, y: 92 },
    { x: 284, y: 146 },
    { x: 390, y: 92 },
    { x: 496, y: 146 },
    { x: 602, y: 92 },
  ];
  const goldEdges = [[2, 1], [1, 0], [2, 3], [3, 5], [5, 4]];
  const goldKey = (a: number, b: number) => [Math.min(a, b), Math.max(a, b)].join("-");
  const goldSet = new Set(goldEdges.map(([a, b]) => goldKey(a, b)));
  const adjacency = Array.from({ length: words.length }, () => [] as number[]);
  goldEdges.forEach(([a, b]) => { adjacency[a].push(b); adjacency[b].push(a); });
  const treeDistance = (start: number, end: number) => {
    const queue: Array<[number, number]> = [[start, 0]];
    const seen = new Set([start]);
    for (const [node, dist] of queue) {
      if (node === end) return dist;
      adjacency[node].forEach((next) => {
        if (!seen.has(next)) {
          seen.add(next);
          queue.push([next, dist + 1]);
        }
      });
    }
    return 0;
  };
  const layerError = Math.abs(layer - 6) / 6;
  const noise = (i: number, j: number) => 0.55 * layerError * (Math.sin((i + 1) * 2.1 + (j + 1) * 1.3) + Math.cos((i + j + 2) * 1.7));
  const predictedDistance = (i: number, j: number) => Math.max(0.15, treeDistance(i, j) + noise(i, j));
  const candidates: Array<[number, number, number]> = [];
  for (let i = 0; i < words.length; i++) {
    for (let j = i + 1; j < words.length; j++) candidates.push([i, j, predictedDistance(i, j)]);
  }
  candidates.sort((a, b) => a[2] - b[2]);
  const parent = Array.from({ length: words.length }, (_, i) => i);
  const find = (x: number): number => parent[x] === x ? x : (parent[x] = find(parent[x]));
  const mst: Array<[number, number, number]> = [];
  for (const [a, b, d] of candidates) {
    const ra = find(a), rb = find(b);
    if (ra === rb) continue;
    parent[ra] = rb;
    mst.push([a, b, d]);
    if (mst.length === words.length - 1) break;
  }
  label(ctx, "probe distances → Kruskal MST → UUAS", 28, 28, colors.text, 14);
  goldEdges.forEach(([a, b]) => line(ctx, pts[a], pts[b], colors.rule, 1.2));
  const shown = mst.slice(0, step);
  shown.forEach(([a, b]) => {
    const correct = goldSet.has(goldKey(a, b));
    line(ctx, pts[a], pts[b], correct ? colors.green : colors.red, 3.4);
  });
  pts.forEach((p, i) => {
    box(ctx, p.x - 38, p.y + 18, 76, 30, "#fff", colors.rule);
    label(ctx, words[i], p.x, p.y + 38, colors.text, 12, "center");
    dot(ctx, p, 5, colors.blue);
  });
  const mx = 130;
  const my = 252;
  const cell = 34;
  label(ctx, "predicted tree-distance matrix", mx, my - 18, colors.dim);
  for (let r = 0; r < words.length; r++) {
    for (let col = 0; col < words.length; col++) {
      const dist = r === col ? 0 : predictedDistance(r, col);
      const alpha = Math.max(0.08, Math.min(0.82, 1 - dist / 5.2));
      ctx.fillStyle = `rgba(31,74,140,${alpha})`;
      ctx.fillRect(mx + col * cell, my + r * cell, cell - 2, cell - 2);
    }
  }
  const recovered = shown.filter(([a, b]) => goldSet.has(goldKey(a, b))).length;
  const quality = shown.length === 0 ? 0 : recovered / goldEdges.length;
  ctx.fillStyle = colors.green;
  ctx.fillRect(430, 392 - quality * 130, 58, quality * 130);
  label(ctx, "UUAS", 459, 410, colors.dim, 11, "center");
  label(ctx, `${Math.round(quality * 100)}%`, 459, 382 - quality * 130, colors.green, 12, "center");
  const next = candidates.find(([a, b]) => !shown.some(([x, y]) => goldKey(x, y) === goldKey(a, b)));
  readout("structural-probe-readout", `<div class="row"><span class="lbl">layer</span><span>${layer}</span></div><div class="row"><span class="lbl">MST edges shown</span><span>${shown.length} / ${goldEdges.length}</span></div><div class="row"><span class="lbl">UUAS</span><span>${recovered}/${goldEdges.length}</span></div><div class="row"><span class="lbl">next closest pair</span><span>${next ? `${words[next[0]]}–${words[next[1]]}` : "tree complete"}</span></div>`);
}

function drawSemanticComposition() {
  const c = canvas("semantic-composition-canvas");
  if (!c) return;
  const ctx = ctx2d(c);
  const form = select("composition-form")?.value ?? "add";
  const phraseCase = select("composition-case")?.value ?? "intersective";
  const interaction = value("composition-interaction", 0.65);
  setText("composition-form-v", select("composition-form")?.selectedOptions[0]?.textContent ?? form);
  setText("composition-case-v", select("composition-case")?.selectedOptions[0]?.textContent ?? phraseCase);
  setText("composition-interaction-v", interaction.toFixed(2));
  clear(ctx, c);
  type Vec = { x: number; y: number };
  const cases: Record<string, { title: string; head: string; dependent: string; headVec: Vec; depVec: Vec; interaction: Vec; targetExtra: Vec; note: string }> = {
    intersective: {
      title: "red car",
      head: "car",
      dependent: "red",
      headVec: { x: 82, y: 4 },
      depVec: { x: -6, y: 62 },
      interaction: { x: 8, y: 4 },
      targetExtra: { x: 2, y: 3 },
      note: "close to additive",
    },
    subsective: {
      title: "skillful surgeon",
      head: "surgeon",
      dependent: "skillful",
      headVec: { x: 76, y: 8 },
      depVec: { x: -20, y: 58 },
      interaction: { x: 42, y: 22 },
      targetExtra: { x: 34, y: 18 },
      note: "head-dependent modifier",
    },
    privative: {
      title: "fake gun",
      head: "gun",
      dependent: "fake",
      headVec: { x: 88, y: 2 },
      depVec: { x: -16, y: 50 },
      interaction: { x: -118, y: 26 },
      targetExtra: { x: -96, y: 26 },
      note: "leaves head category",
    },
  };
  const selected = cases[phraseCase] ?? cases.intersective;
  const addVec = { x: selected.headVec.x + selected.depVec.x, y: selected.headVec.y + selected.depVec.y };
  const bilinearVec = {
    x: addVec.x + interaction * selected.interaction.x,
    y: addVec.y + interaction * selected.interaction.y,
  };
  const nonlinearVec = {
    x: selected.headVec.x + selected.depVec.x + selected.targetExtra.x,
    y: selected.headVec.y + selected.depVec.y + selected.targetExtra.y,
  };
  const targetVec = {
    x: selected.headVec.x + selected.depVec.x + selected.targetExtra.x,
    y: selected.headVec.y + selected.depVec.y + selected.targetExtra.y,
  };
  const predicted = form === "bilinear" ? bilinearVec : form === "nonlinear" ? nonlinearVec : addVec;
  const origin = { x: 238, y: 282 };
  const scale = 1.32;
  const toScreen = (v: Vec): Point => ({ x: origin.x + v.x * scale, y: origin.y - v.y * scale });
  label(ctx, "semantic composition sandbox", 30, 28, colors.text, 14);
  label(ctx, selected.title, 30, 48, colors.dim, 12);
  for (let gx = -120; gx <= 150; gx += 30) {
    line(ctx, toScreen({ x: gx, y: -70 }), toScreen({ x: gx, y: 120 }), colors.grid, 0.7);
  }
  for (let gy = -60; gy <= 120; gy += 30) {
    line(ctx, toScreen({ x: -120, y: gy }), toScreen({ x: 150, y: gy }), colors.grid, 0.7);
  }
  line(ctx, toScreen({ x: -120, y: 0 }), toScreen({ x: 150, y: 0 }), colors.rule, 1.1);
  line(ctx, toScreen({ x: 0, y: -70 }), toScreen({ x: 0, y: 120 }), colors.rule, 1.1);
  arrow(ctx, origin, toScreen(selected.headVec), colors.blue, 4);
  arrow(ctx, origin, toScreen(selected.depVec), colors.red, 4);
  arrow(ctx, origin, toScreen(addVec), "rgba(90,101,119,0.58)", 2);
  arrow(ctx, origin, toScreen(bilinearVec), colors.purple, form === "bilinear" ? 4 : 2);
  arrow(ctx, origin, toScreen(predicted), colors.orange, 5);
  dot(ctx, toScreen(targetVec), 7, colors.green);
  dot(ctx, toScreen(predicted), 7, colors.orange);
  label(ctx, selected.head, toScreen(selected.headVec).x + 8, toScreen(selected.headVec).y - 6, colors.blue);
  label(ctx, selected.dependent, toScreen(selected.depVec).x + 8, toScreen(selected.depVec).y + 14, colors.red);
  label(ctx, "add", toScreen(addVec).x + 8, toScreen(addVec).y, colors.dim);
  label(ctx, "bilinear", toScreen(bilinearVec).x + 8, toScreen(bilinearVec).y - 8, colors.purple);
  label(ctx, "target phrase", toScreen(targetVec).x + 10, toScreen(targetVec).y + 4, colors.green);
  label(ctx, "selected prediction", toScreen(predicted).x + 10, toScreen(predicted).y + 18, colors.orange);
  line(ctx, toScreen(predicted), toScreen(targetVec), colors.red, 2);

  const panelX = 520;
  box(ctx, panelX, 76, 188, 198, "#fff", colors.rule);
  label(ctx, "probe hypothesis", panelX + 94, 102, colors.text, 15, "center");
  const rows = [
    ["add", "A h + B d", form === "add"],
    ["bilinear", "A h + B d + h^T W d", form === "bilinear"],
    ["nonlinear", "MLP(h,d,rel)", form === "nonlinear"],
  ];
  rows.forEach(([name, formula, active], i) => {
    const y = 130 + i * 44;
    box(ctx, panelX + 16, y - 20, 156, 30, active ? "rgba(212,105,10,0.1)" : colors.panel, active ? colors.orange : colors.rule);
    label(ctx, `${name}: ${formula}`, panelX + 94, y, active ? colors.text : colors.dim, 11, "center");
  });
  label(ctx, selected.note, panelX + 18, 258, colors.dim, 11);
  const err = Math.hypot(predicted.x - targetVec.x, predicted.y - targetVec.y);
  readout("semantic-composition-readout", `<div class="row"><span class="lbl">phrase</span><span>${selected.title}</span></div><div class="row"><span class="lbl">selected form</span><span>${form}</span></div><div class="row"><span class="lbl">prediction error</span><span>${err.toFixed(1)} vector units</span></div><div class="row"><span class="lbl">interpretation</span><span>${selected.note}</span></div>`);
}

function drawHeadTypes() {
  const c = canvas("head-types-canvas");
  if (!c) return;
  const ctx = ctx2d(c);
  const nullStrength = value("head-null", 0);
  setText("head-null-v", `${Math.round(nullStrength * 100)}%`);
  clear(ctx, c);
  label(ctx, "head embeddings: clean-looking clusters need controls", 30, 28, colors.text, 14);
  const centers = [
    { x: 170, y: 138, color: colors.blue, name: "positional" },
    { x: 310, y: 184, color: colors.green, name: "induction" },
    { x: 214, y: 290, color: colors.red, name: "syntactic" },
  ];
  for (let i = 0; i < 90; i++) {
    const g = i % 3;
    const layerShift = nullStrength * (Math.floor(i / 9) - 5) * 15;
    const wash = nullStrength * 0.55;
    const p = centers[g];
    const x = p.x + Math.sin(i * 1.7) * (28 + nullStrength * 18) + layerShift;
    const y = p.y + Math.cos(i * 1.2) * (24 + nullStrength * 18);
    dot(ctx, { x, y }, 4, wash > 0.45 ? colors.dim : p.color);
  }
  centers.forEach((p) => label(ctx, p.name, p.x + 34, p.y, p.color, 11));
  const silhouette = 0.71 - nullStrength * 0.47;
  ctx.fillStyle = silhouette > 0.5 ? colors.green : colors.orange;
  ctx.fillRect(540, 288 - silhouette * 180, 58, silhouette * 180);
  label(ctx, "silhouette", 569, 308, colors.dim, 11, "center");
  label(ctx, silhouette.toFixed(2), 569, 278 - silhouette * 180, colors.text, 14, "center");
  readout("head-types-readout", `<div class="row"><span class="lbl">within-layer control</span><span>${Math.round(nullStrength * 100)}%</span></div><div class="row"><span class="lbl">diagnostic</span><span>${nullStrength < 0.35 ? "raw clusters dominate" : nullStrength < 0.75 ? "layer effects compete with labels" : "clusters largely dissolve"}</span></div><div class="row"><span class="lbl">scope</span><span>cluster shape and causal role are separate questions</span></div>`);
}

function drawHeadPatterns() {
  const c = canvas("head-patterns-canvas");
  if (!c) return;
  const ctx = ctx2d(c);
  const kind = select("head-pattern-kind")?.value ?? "positional";
  const dest = Math.max(1, Math.min(8, value("head-pattern-dest", 7)));
  setText("head-pattern-kind-v", select("head-pattern-kind")?.selectedOptions[0]?.textContent ?? kind);
  setText("head-pattern-dest-v", String(dest));
  clear(ctx, c);
  const toks = ["When", "John", "and", "Mary", "John", "gave", "drink", "to", "?"];
  const n = toks.length;
  const depHead = [5, 5, 3, 5, 5, 5, 5, 5, 7];
  const specs: Record<string, { title: string; sign: number; target: string; note: string; w: (d: number, s: number) => number }> = {
    positional: {
      title: "positional head",
      sign: 0.2,
      target: "copies local context",
      note: "same attention offset can be used by many circuits",
      w: (d, s) => (s === d - 1 ? 1 : s === d ? 0.15 : 0),
    },
    induction: {
      title: "induction head",
      sign: 0.75,
      target: "promotes token after match",
      note: "pattern finds a previous occurrence, OV copies the following token",
      w: (d, s) => (d >= 4 && s === 2 ? 1 : s === d - 1 ? 0.25 : 0),
    },
    syntactic: {
      title: "syntactic head",
      sign: 0.35,
      target: "routes dependent to head",
      note: "dependency-like attention is a pattern, not by itself a causal role",
      w: (d, s) => (depHead[d] === s ? 1 : s === d ? 0.18 : 0),
    },
    "name-mover": {
      title: "name mover",
      sign: 0.9,
      target: "promotes Mary",
      note: "attending to a name matters because OV writes that name toward logits",
      w: (_d, s) => (s === 3 ? 1 : s === 1 || s === 4 ? 0.18 : 0),
    },
    "copy-suppression": {
      title: "copy-suppression head",
      sign: -0.75,
      target: "suppresses copied name",
      note: "same name attention can write against the attended token",
      w: (_d, s) => (s === 3 ? 1 : s === 1 || s === 4 ? 0.22 : 0),
    },
    retrieval: {
      title: "retrieval head",
      sign: 0.65,
      target: "retrieves bound value",
      note: "query token dereferences an earlier address-like state",
      w: (d, s) => (d >= 7 && s === 3 ? 1 : s === d - 2 ? 0.25 : 0),
    },
  };
  const spec = specs[kind] ?? specs.positional;
  label(ctx, spec.title, 30, 28, colors.text, 14);
  const gx = 74;
  const gy = 58;
  const cell = 26;
  const weightsFor = (d: number) => {
    const raw = toks.map((_, s) => s <= d ? Math.max(0, spec.w(d, s)) : 0);
    const total = raw.reduce((a, b) => a + b, 0) || 1;
    return raw.map((v) => v / total);
  };
  for (let d = 0; d < n; d++) {
    const row = weightsFor(d);
    for (let s = 0; s < n; s++) {
      const allowed = s <= d;
      const wv = allowed ? row[s] : 0;
      ctx.fillStyle = allowed ? `rgba(31,74,140,${0.05 + wv * 0.83})` : "#f3f1ec";
      ctx.fillRect(gx + s * cell, gy + d * cell, cell - 2, cell - 2);
    }
    label(ctx, toks[d], gx - 7, gy + d * cell + cell - 8, d === dest ? colors.red : colors.dim, 9.5, "right");
  }
  for (let s = 0; s < n; s++) {
    label(ctx, toks[s], gx + s * cell + (cell - 2) / 2, gy + n * cell + 12, colors.dim, 9.5, "center");
  }
  label(ctx, "source position →", gx, gy + n * cell + 28, colors.dim, 9.5);

  const yTok = 346;
  const xs = toks.map((_, i) => 52 + i * 76);
  toks.forEach((tok, i) => {
    box(ctx, xs[i] - 28, yTok - 17, 56, 34, i === dest ? "#fee2d5" : "#fff", i === dest ? colors.red : colors.rule);
    label(ctx, tok, xs[i], yTok + 4, i === dest ? colors.red : colors.text, 10.5, "center");
  });
  const destPoint = { x: xs[dest], y: yTok - 24 };
  const row = weightsFor(dest);
  row.forEach((wv, s) => {
    if (wv < 0.16 || s === dest) return;
    arrow(ctx, destPoint, { x: xs[s], y: yTok - 24 }, colors.blue, 1.5 + wv * 3);
  });

  const barX = 620;
  const barY = 104;
  label(ctx, "OV write", barX, barY - 22, colors.text, 12, "center");
  line(ctx, { x: barX - 72, y: barY }, { x: barX + 72, y: barY }, colors.rule, 7);
  const signColor = spec.sign >= 0 ? colors.green : colors.red;
  line(ctx, { x: barX, y: barY }, { x: barX + spec.sign * 72, y: barY }, signColor, 9);
  label(ctx, spec.sign >= 0 ? "+" : "−", barX + spec.sign * 72, barY - 12, signColor, 16, "center");
  box(ctx, 522, 144, 196, 74, "#fff", colors.rule);
  label(ctx, spec.target, 620, 174, signColor, 13, "center");
  label(ctx, spec.note, 620, 198, colors.dim, 10.5, "center");
  readout("head-patterns-readout", `<div class="row"><span class="lbl">label</span><span>${spec.title}</span></div><div class="row"><span class="lbl">destination</span><span>${toks[dest]}</span></div><div class="row"><span class="lbl">OV sign</span><span>${spec.sign >= 0 ? "promotes" : "suppresses"}: ${spec.target}</span></div>`);
}

function drawInduction() {
  const c = canvas("induction-canvas");
  if (!c) return;
  const ctx = ctx2d(c);
  const step = value("induction-step", 3);
  setText("induction-step-v", step.toFixed(0));
  clear(ctx, c);
  const toks = ["A", "B", "x", "y", "A", "?"];
  toks.forEach((t, i) => {
    const x = 88 + i * 94;
    box(ctx, x - 28, 74, 56, 42, i === 4 || (step >= 4 && i === 1) ? "#fee2d5" : "#fff", i === 4 || i === 1 ? colors.red : colors.rule);
    label(ctx, t, x, 101, i === 5 && step >= 5 ? colors.green : colors.text, 18, "center");
  });
  if (step >= 2) {
    arrow(ctx, { x: 88 + 4 * 94, y: 128 }, { x: 88, y: 128 }, colors.blue, 3);
    label(ctx, "match previous A", 270, 152, colors.blue, 12, "center");
  }
  if (step >= 4) {
    arrow(ctx, { x: 88 + 4 * 94, y: 164 }, { x: 88 + 1 * 94, y: 164 }, colors.orange, 4);
    label(ctx, "attend to token after first A", 316, 190, colors.orange, 12, "center");
  }
  if (step >= 5) {
    arrow(ctx, { x: 88 + 1 * 94, y: 216 }, { x: 88 + 5 * 94, y: 216 }, colors.green, 4);
    label(ctx, "OV copies B to the prediction", 410, 244, colors.green, 12, "center");
  }
  const phase = Math.min(1, step / 5);
  ctx.strokeStyle = colors.rule;
  ctx.strokeRect(108, 314, 540, 42);
  ctx.fillStyle = colors.green;
  ctx.fillRect(108, 314, 540 * phase, 42);
  label(ctx, "in-context learning signal after induction forms", 118, 340, "#fff", 12);
  readout("induction-readout", `<div class="row"><span class="lbl">step</span><span>${step}</span></div><div class="row"><span class="lbl">mechanism</span><span>prefix match points to the next-token copy source</span></div>`);
}

function drawInductionBump() {
  const c = canvas("induction-bump-canvas");
  if (!c) return;
  const ctx = ctx2d(c);
  const t = value("induction-bump-step", 50) / 100;
  setText("induction-bump-step-v", `${Math.round(t * 100)}%`);
  clear(ctx, c);
  const ox = 64;
  const oy = 322;
  const w = 600;
  const h = 250;
  // formation window where induction heads appear
  const win = [0.30, 0.46];
  ctx.fillStyle = "#f3f1ec";
  ctx.fillRect(ox + win[0] * w, oy - h, (win[1] - win[0]) * w, h);
  line(ctx, { x: ox, y: oy }, { x: ox + w, y: oy }, colors.rule);
  line(ctx, { x: ox, y: oy }, { x: ox, y: oy - h }, colors.rule);
  const curve = (fn: (x: number) => number, color: string, width = 2) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    for (let i = 0; i <= 200; i++) {
      const u = i / 200;
      const x = ox + u * w;
      const y = oy - Math.max(0, Math.min(1, fn(u))) * h;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
  };
  // overall loss: smooth decay with a faster drop (bump in the derivative) in the window
  const loss = (x: number) => 0.22 + 0.66 * Math.exp(-2.6 * x) - 0.07 * Math.exp(-(((x - 0.38) / 0.085) ** 2));
  // in-context score: improvement forms abruptly across the window
  const icl = (x: number) => 0.14 + 0.62 / (1 + Math.exp(-18 * (x - 0.38)));
  curve(loss, colors.blue, 2);
  curve(icl, colors.red, 3);
  const xt = ox + t * w;
  line(ctx, { x: xt, y: oy + 8 }, { x: xt, y: oy - h - 8 }, colors.orange, 2);
  label(ctx, "training tokens →", ox + w - 8, oy + 22, colors.dim, 12, "right");
  label(ctx, "loss", ox + w + 2, oy - loss(1) * h + 4, colors.blue, 12, "left");
  label(ctx, "in-context score", ox + w * 0.52, oy - icl(0.7) * h - 10, colors.red, 12, "left");
  label(ctx, "induction heads form", ox + win[0] * w + 4, oy - h + 16, colors.dim, 11, "left");
  const phase = t < win[0] ? "before the bump: no induction heads; in-context score flat"
    : t <= win[1] ? "during the bump: induction heads forming; in-context score climbs"
    : "after the bump: induction heads present; prompt-local copying available";
  readout("induction-bump-readout", `<div class="row"><span class="lbl">progress</span><span>${Math.round(t * 100)}%</span></div><div class="row"><span class="lbl">phase</span><span>${phase}</span></div>`);
}

function drawRepresentedExpressed() {
  const c = canvas("represented-expressed-canvas");
  if (!c) return;
  const ctx = ctx2d(c);
  const divergence = value("knowledge-divergence", 0.7);
  setText("knowledge-divergence-v", `${Math.round(divergence * 100)}%`);
  clear(ctx, c);
  const toks = ["The", "capital", "of", "France", "is", "Paris"];
  toks.forEach((t, i) => {
    const x = 56 + i * 96;
    box(ctx, x - 34, 70, 68, 32, "#fff", colors.rule);
    label(ctx, t, x, 91, colors.text, 12, "center");
    const surprisal = i === 5 ? 0.2 + (1 - divergence) * 0.55 : 0.16 + (i % 3) * 0.11;
    ctx.fillStyle = colors.red;
    ctx.fillRect(x - 28, 120, 56, surprisal * 70);
  });
  function gauge(cx: number, cy: number, v: number, title: string, color: string) {
    ctx.strokeStyle = colors.rule;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(cx, cy, 64, Math.PI, 0);
    ctx.stroke();
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, 64, Math.PI, Math.PI + Math.PI * v);
    ctx.stroke();
    const angle = Math.PI + Math.PI * v;
    line(ctx, { x: cx, y: cy }, { x: cx + Math.cos(angle) * 54, y: cy + Math.sin(angle) * 54 }, color, 3);
    label(ctx, title, cx, cy + 32, colors.dim, 12, "center");
    label(ctx, `${Math.round(v * 100)}%`, cx, cy + 52, color, 13, "center");
  }
  gauge(238, 322, 0.25 + divergence * 0.7, "internal margin", colors.green);
  gauge(512, 322, 0.78 - divergence * 0.5, "output margin", colors.red);
  readout("represented-expressed-readout", `<div class="row"><span class="lbl">gap</span><span>${Math.round(divergence * 100)}%</span></div><div class="row"><span class="lbl">relation</span><span>decodable internal state and emitted behavior can disagree</span></div>`);
}

function drawBinding() {
  const c = canvas("binding-canvas");
  if (!c) return;
  const ctx = ctx2d(c);
  clear(ctx, c);

  const numberSel = select("binding-number");
  const strategySel = select("binding-strategy");
  const subjectPlural = (numberSel?.value ?? "sg") === "pl";
  const followProximity = (strategySel?.value ?? "structure") === "proximity";
  setText("binding-number-v", numberSel?.selectedOptions[0]?.textContent ?? "");
  setText("binding-strategy-v", strategySel?.selectedOptions[0]?.textContent ?? "");

  const subjectWord = subjectPlural ? "keys" : "key";
  // "cabinets" is always plural, so a proximity-follower always reads "are".
  const verbPlural = followProximity ? true : subjectPlural;
  const verbWord = verbPlural ? "are" : "is";
  const correct = verbPlural === subjectPlural; // agreement is with the subject

  label(ctx, "Does the verb agree with the subject or the nearest noun?", 40, 32, colors.text, 15);

  const toks = [
    { t: "The", role: "" },
    { t: subjectWord, role: "subject" },
    { t: "to", role: "" },
    { t: "the", role: "" },
    { t: "cabinets", role: "distractor" },
    { t: verbWord, role: "verb" },
    { t: "rusty.", role: "" },
  ];

  const yTok = 152;
  const h = 36;
  const padX = 13;
  const gap = 9;
  ctx.font = "16px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.textAlign = "left";
  let x = 40;
  const placed = toks.map((tk) => {
    const w = ctx.measureText(tk.t).width + padX * 2;
    const p = { ...tk, x, w, cx: x + w / 2 };
    x += w + gap;
    return p;
  });

  const accentFor = (role: string) =>
    role === "subject" ? colors.blue
      : role === "distractor" ? colors.orange
      : role === "verb" ? (correct ? colors.green : colors.red)
      : colors.rule;

  placed.forEach((p) => {
    const active = p.role !== "";
    const accent = accentFor(p.role);
    box(ctx, p.x, yTok, p.w, h, active ? "#fff" : colors.panel, active ? accent : colors.rule);
    label(ctx, p.t, p.cx, yTok + 24, active ? colors.text : colors.dim, 16, "center");
    if (p.role === "subject") label(ctx, "subject", p.cx, yTok - 10, colors.blue, 11, "center");
    if (p.role === "distractor") label(ctx, "nearest noun", p.cx, yTok - 10, colors.orange, 11, "center");
  });

  const verbBox = placed[5];
  const targetBox = followProximity ? placed[4] : placed[1];
  const arcColor = correct ? colors.green : colors.red;
  const sx = verbBox.cx;
  const ex = targetBox.cx;
  const topY = yTok - 14;
  ctx.strokeStyle = arcColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(sx, topY);
  ctx.quadraticCurveTo((sx + ex) / 2, topY - 50, ex, topY);
  ctx.stroke();
  ctx.fillStyle = arcColor;
  ctx.beginPath();
  ctx.moveTo(ex, topY + 2);
  ctx.lineTo(ex - 5, topY - 8);
  ctx.lineTo(ex + 5, topY - 8);
  ctx.closePath();
  ctx.fill();
  label(ctx, "agrees with", (sx + ex) / 2, topY - 54, arcColor, 12, "center");

  const verdict = correct ? "correct: agrees with the subject" : "proximity error: copied “cabinets”";
  ctx.font = "600 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  const pillW = ctx.measureText(verdict).width + 34;
  box(ctx, 40, 238, pillW, 30, correct ? "#e9f6ec" : "#fbe7e2", arcColor);
  label(ctx, verdict, 40 + pillW / 2, 258, arcColor, 13, "center");

  label(
    ctx,
    followProximity
      ? "Only “the key” (singular) exposes a proximity shortcut; “the keys” would hide it."
      : "A structure-follower gets both members of the minimal pair right.",
    40, 302, colors.dim, 13, "left",
  );

  readout(
    "binding-readout",
    `<div class="row"><span class="lbl">reads</span><span>"the ${subjectWord} … ${verbWord} rusty"</span></div><div class="row"><span class="lbl">verdict</span><span>${correct ? "agrees with the subject" : "agrees with the nearer plural, not the subject"}</span></div>`,
  );
}

function drawLookback() {
  const c = canvas("lookback-canvas");
  if (!c) return;
  const ctx = ctx2d(c);
  const step = Math.max(0, Math.min(3, Math.round(value("lookback-step", 0))));
  const names = ["bind", "pointer", "dereference", "emit"];
  setText("lookback-step-v", names[step]);
  clear(ctx, c);

  const toks = ["Alice", "took", "box", ".", "Bob", "took", "cup", ".", "Alice", "took", "?"];
  const w = 56;
  const gap = 8;
  const x0 = 26;
  const yTok = 86;
  const yLane = yTok + 38;
  const laneH = 50;
  const pos = toks.map((_, i) => x0 + i * (w + gap));
  const mid = (i: number) => pos[i] + w / 2;
  const entIdx = 0;
  const stateIdx = 2;
  const queryIdx = toks.length - 1;
  const ADDR = colors.blue;
  const PTR = colors.purple;

  // binding group outline around the first character-object-state run
  ctx.strokeStyle = colors.orange;
  ctx.lineWidth = 2;
  ctx.strokeRect(pos[entIdx] - 4, yTok - 4, pos[stateIdx] + w - pos[entIdx] + 8, 38);
  label(ctx, "binding group", pos[entIdx], yTok - 12, colors.orange, 12, "left");

  toks.forEach((t, i) => {
    const x = pos[i];
    const isQuery = i === queryIdx;
    box(ctx, x, yTok, w, 30, isQuery ? "#fee2d5" : "#fff", isQuery ? colors.red : colors.rule);
    label(ctx, t, x + w / 2, yTok + 19, isQuery ? colors.red : colors.text, 12, "center");
    box(ctx, x, yLane, w, laneH, colors.panel, colors.rule);
  });
  label(ctx, "residual stream", x0, yLane + laneH + 18, colors.dim, 12, "left");

  // address written into the recalled (state) token's residual stream
  box(ctx, pos[stateIdx] + 6, yLane + 12, w - 12, 26, "#e7eefc", ADDR);
  label(ctx, "addr #1", mid(stateIdx), yLane + 29, ADDR, 11, "center");

  // pointer formed at the query token
  if (step >= 1) {
    box(ctx, pos[queryIdx] + 6, yLane + 12, w - 12, 26, "#efe7f7", PTR);
    label(ctx, "ptr #1", mid(queryIdx), yLane + 29, PTR, 11, "center");
  }

  // dereference: retrieval head attends from the pointer back to the address
  if (step >= 2) {
    const sx = mid(queryIdx);
    const ex = mid(stateIdx);
    ctx.strokeStyle = PTR;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx, yTok - 6);
    ctx.quadraticCurveTo((sx + ex) / 2, yTok - 58, ex, yTok - 6);
    ctx.stroke();
    const head = { x: ex, y: yTok - 6 };
    ctx.fillStyle = PTR;
    ctx.beginPath();
    ctx.moveTo(head.x, head.y);
    ctx.lineTo(head.x - 6, head.y - 9);
    ctx.lineTo(head.x + 6, head.y - 9);
    ctx.closePath();
    ctx.fill();
    label(ctx, "look back", (sx + ex) / 2, yTok - 44, PTR, 12, "center");
  }

  // emit: the bound payload is copied to the output
  if (step >= 3) {
    box(ctx, pos[queryIdx] - 2, yLane + laneH + 8, w + 4, 26, "#e9f6ec", colors.green);
    label(ctx, "box", mid(queryIdx), yLane + laneH + 25, colors.green, 12, "center");
    arrow(ctx, { x: mid(queryIdx), y: yLane + laneH + 8 }, { x: mid(queryIdx), y: yLane + laneH }, colors.green, 2);
  }

  const detail = [
    "co-locate Alice-took-box; store an abstract id (addr #1) on the state token",
    "the query forms a matching pointer (ptr #1) to Alice's id",
    "a retrieval head attends from ptr #1 back to the matching address",
    "the bound payload (box) is copied to the output, beating the nearer 'cup'",
  ];
  readout("lookback-readout", `<div class="row"><span class="lbl">step</span><span>${names[step]}</span></div><div class="row"><span class="lbl">action</span><span>${detail[step]}</span></div>`);
}

function drawRetrievalMask() {
  const c = canvas("retrieval-mask-canvas");
  if (!c) return;
  const ctx = ctx2d(c);
  clear(ctx, c);
  const mask = Math.max(0, Math.min(100, value("retrieval-mask", 0)));
  setText("retrieval-mask-v", `${mask}%`);
  const frac = mask / 100;
  const total = 5;
  const maskedCount = Math.round(frac * total);

  label(ctx, "A few heads carry most recall; masking them removes the answer, not the fluency", 40, 30, colors.text, 14);

  const cols = 12;
  const rows = 8;
  const cw = 26;
  const chH = 15;
  const gx = 40;
  const gy = 60;
  const retrieval = [10, 27, 44, 61, 83];
  for (let i = 0; i < cols * rows; i++) {
    const cx = gx + (i % cols) * cw;
    const cy = gy + Math.floor(i / cols) * chH;
    const rank = retrieval.indexOf(i);
    if (rank === -1) {
      box(ctx, cx, cy, cw - 4, chH - 4, colors.panel, colors.grid);
    } else if (rank < maskedCount) {
      box(ctx, cx, cy, cw - 4, chH - 4, "#e7e2d6", colors.dim);
      ctx.strokeStyle = colors.dim;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(cx + 3, cy + 3);
      ctx.lineTo(cx + cw - 7, cy + chH - 7);
      ctx.moveTo(cx + cw - 7, cy + 3);
      ctx.lineTo(cx + 3, cy + chH - 7);
      ctx.stroke();
    } else {
      box(ctx, cx, cy, cw - 4, chH - 4, "#fbe1d8", colors.red);
    }
  }
  label(ctx, `retrieval heads (${total} of ${cols * rows} ≈ 5%)`, gx, gy + rows * chH + 22, colors.dim, 12);
  label(ctx, `${maskedCount} masked`, gx, gy + rows * chH + 40, colors.red, 12);

  let stage: string;
  let answer: string;
  let col: string;
  let note: string;
  if (mask === 0) {
    stage = "complete recall";
    answer = "box";
    col = colors.green;
    note = "the bound answer is copied";
  } else if (frac <= 0.6) {
    stage = "partial recall";
    answer = "box ?";
    col = colors.orange;
    note = "some answers start to drop";
  } else {
    stage = "fluent but unsupported";
    answer = "cup";
    col = colors.red;
    note = "still answers, now unfaithful; the nearer token wins";
  }
  const px = 470;
  const py = 66;
  const pw = 250;
  const ph = 128;
  box(ctx, px, py, pw, ph, "#fff", colors.rule);
  label(ctx, "output for “Alice took … ?”", px + pw / 2, py + 26, colors.dim, 12, "center");
  label(ctx, answer, px + pw / 2, py + 74, col, 30, "center");
  label(ctx, stage, px + pw / 2, py + 108, col, 13, "center");

  const mx = px;
  const my = py + ph + 22;
  const mw = pw;
  const mh = 14;
  box(ctx, mx, my, mw, mh, colors.panel, colors.rule);
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.roundRect(mx, my, Math.max(2, mw * (1 - frac)), mh, 5);
  ctx.fill();
  label(ctx, "recall fidelity", mx, my + mh + 16, colors.dim, 11);

  readout("retrieval-mask-readout", `<div class="row"><span class="lbl">masked</span><span>${maskedCount} of ${total} retrieval heads (${mask}%)</span></div><div class="row"><span class="lbl">output</span><span>${stage}: ${note}</span></div>`);
}

// ── Binding-ID swap (binding.astro) ────────────────────────────────────────
// Two entities each bound to an attribute by a binding ID (a low-rank tag).
// Swap the IDs and the model reports the swapped attribute — the signature of a
// variable-like binding rather than a positional cue.
function drawBindingSwap() {
  const c = canvas("binding-swap-canvas");
  if (!c) return;
  const ctx = ctx2d(c);
  clear(ctx, c);
  const swapped = (select("binding-swap")?.value ?? "original") === "swapped";
  setText("binding-swap-v", swapped ? "swapped" : "original");
  const idColor = [colors.blue, colors.orange];
  const ents = [{ name: "Alice", y: 84 }, { name: "Bob", y: 208 }];
  const attrs = [{ name: "box", y: 84 }, { name: "cup", y: 208 }];
  const ex = 70, ew = 150, ax = 540, aw = 150, h = 54;
  const entId = swapped ? [1, 0] : [0, 1]; // which binding ID sits on each entity
  const attrId = [0, 1]; // attributes keep fixed IDs (box=0, cup=1)
  label(ctx, "a binding ID (a low-rank tag) links each entity to its attribute", ex, 44, colors.dim, 12);
  const report: string[] = [];
  ents.forEach((e, i) => {
    const aIdx = attrId.indexOf(entId[i]);
    const a = attrs[aIdx];
    arrow(ctx, { x: ex + ew - 4, y: e.y + h / 2 }, { x: ax + 4, y: a.y + h / 2 }, idColor[entId[i]], 2.2);
    report.push(`${e.name} → ${a.name}`);
  });
  ents.forEach((e, i) => {
    box(ctx, ex, e.y, ew, h, "#fff", colors.rule);
    label(ctx, e.name, ex + 14, e.y + 25, colors.text, 15);
    label(ctx, "entity", ex + 14, e.y + 43, colors.dim, 11);
    dot(ctx, { x: ex + ew - 18, y: e.y + h / 2 }, 8, idColor[entId[i]]);
  });
  attrs.forEach((a, i) => {
    box(ctx, ax, a.y, aw, h, "#fff", colors.rule);
    label(ctx, a.name, ax + 30, a.y + 25, colors.text, 15);
    label(ctx, "attribute", ax + 30, a.y + 43, colors.dim, 11);
    dot(ctx, { x: ax + 18, y: a.y + h / 2 }, 8, idColor[attrId[i]]);
  });
  readout("binding-swap-readout", `<div class="row"><span class="lbl">binding IDs</span><span>${swapped ? "swapped" : "original"}</span></div><div class="row"><span class="lbl">model reports</span><span>${report.join(", ")}</span></div>`);
}

// ── Belief value slot + router (false-belief-tasks.astro) ───────────────────
// The slot holds both frame values; a router at the query position selects
// which one the answer reads. Belief-vs-reality lives in the routing, not the
// value. Illustrates papers.osteele.com/mental-spaces-belief-26.
function drawBeliefSlot() {
  const c = canvas("belief-slot-canvas");
  if (!c) return;
  const ctx = ctx2d(c);
  clear(ctx, c);
  const frame = (select("belief-query")?.value ?? "belief") === "reality" ? "reality" : "belief";
  setText("belief-query-v", frame === "belief" ? "Anna thinks…" : "In fact…");
  const blue = colors.blue, red = colors.red;
  const sx = 300, sy = 56, sw = 150, sh = 112;
  const chips = [
    { frame: "belief", label: "blue", color: blue, y: sy + 36 },
    { frame: "reality", label: "red", color: red, y: sy + 72 },
  ];
  box(ctx, 30, 62, 214, 44, "#fff", colors.rule);
  label(ctx, "Anna believes cup = blue", 42, 88, colors.text, 12);
  box(ctx, 30, 126, 214, 44, "#fff", colors.rule);
  label(ctx, "in reality cup = red", 42, 152, colors.text, 12);
  arrow(ctx, { x: 244, y: 84 }, { x: sx, y: sy + 50 }, colors.rule, 1.5);
  arrow(ctx, { x: 244, y: 148 }, { x: sx, y: sy + 86 }, colors.rule, 1.5);
  box(ctx, sx, sy, sw, sh, colors.panel, colors.rule);
  label(ctx, "value slot", sx + sw / 2, sy + 22, colors.dim, 12, "center");
  chips.forEach((ch) => {
    const on = ch.frame === frame;
    if (!on) ctx.globalAlpha = 0.4;
    box(ctx, sx + 12, ch.y, sw - 24, 28, ch.color, ch.color);
    label(ctx, ch.frame, sx + 20, ch.y + 19, "#fff", 11);
    label(ctx, ch.label, sx + sw - 20, ch.y + 19, "#fff", 12, "right");
    ctx.globalAlpha = 1;
  });
  const rx = 500, ry = 76, rw = 112, rh = 66;
  box(ctx, rx, ry, rw, rh, "#f0edfa", "#c4b5fd");
  label(ctx, "router", rx + rw / 2, ry + 24, colors.purple, 12, "center");
  label(ctx, `selects: ${frame}`, rx + rw / 2, ry + 45, colors.dim, 11, "center");
  box(ctx, 300, 214, 210, 40, "#fff", colors.rule);
  label(ctx, frame === "belief" ? "Anna thinks the cup is …?" : "In fact the cup is …?", 312, 238, colors.text, 12);
  arrow(ctx, { x: 405, y: 214 }, { x: rx + rw / 2, y: ry + rh }, colors.purple, 1.6);
  const sel = chips.find((ch) => ch.frame === frame)!;
  arrow(ctx, { x: sx + sw, y: sel.y + 14 }, { x: rx, y: ry + rh / 2 }, sel.color, 2.4);
  const ansX = 660, ansY = 84;
  box(ctx, ansX, ansY, 74, 50, sel.color, sel.color);
  label(ctx, sel.label, ansX + 37, ansY + 31, "#fff", 16, "center");
  label(ctx, "answer", ansX + 37, ansY + 64, colors.dim, 11, "center");
  arrow(ctx, { x: rx + rw, y: ry + rh / 2 }, { x: ansX, y: ansY + 25 }, sel.color, 2);
  readout("belief-slot-readout", `<div class="row"><span class="lbl">query</span><span>${frame === "belief" ? "Anna thinks…" : "In fact…"}</span></div><div class="row"><span class="lbl">router selects</span><span>${frame} frame → ${sel.label}</span></div>`);
}

// ── Reader-triggered "play" ────────────────────────────────────────────────
// Ease a range control from one end to the other, dispatching input events so
// the figure's existing draw re-runs each frame. A [data-play-target="<id>"]
// button drives the range with id <id>. Honors prefers-reduced-motion (snaps
// to the end state). This turns a scrubbable figure into one that also plays a
// process (e.g. the four lookback states, or the accumulating residual stream).
const activePlays = new Map<string, number>();
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
function playScrub(rangeId: string, opts: { from?: number; to?: number; duration?: number; onDone?: () => void } = {}) {
  const el = input(rangeId);
  if (!el) { opts.onDone?.(); return; }
  const lo = Number(el.min || 0);
  const hi = Number(el.max || 100);
  const step = Number(el.step || 1);
  const from = opts.from ?? lo;
  const to = opts.to ?? hi;
  const reduce = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const duration = reduce ? 0 : (opts.duration ?? 1600);
  const prev = activePlays.get(rangeId);
  if (prev) cancelAnimationFrame(prev);
  const set = (v: number) => {
    el.value = String(step >= 1 ? Math.round(v) : v);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  };
  if (duration === 0) { set(to); activePlays.delete(rangeId); opts.onDone?.(); return; }
  const start = performance.now();
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    set(from + (to - from) * easeInOutCubic(t));
    if (t < 1) {
      activePlays.set(rangeId, requestAnimationFrame(tick));
    } else {
      activePlays.delete(rangeId);
      opts.onDone?.();
    }
  };
  activePlays.set(rangeId, requestAnimationFrame(tick));
}
function numOrUndef(s: string | undefined): number | undefined {
  return s == null ? undefined : Number(s);
}
function wirePlayButtons() {
  document.querySelectorAll("[data-play-target]").forEach((el) => {
    const btn = el as HTMLElement;
    if (btn.dataset.playWired) return;
    btn.dataset.playWired = "1";
    btn.addEventListener("click", () => {
      const target = btn.dataset.playTarget;
      if (!target) return;
      btn.setAttribute("aria-busy", "true");
      playScrub(target, {
        from: numOrUndef(btn.dataset.playFrom),
        to: numOrUndef(btn.dataset.playTo),
        duration: numOrUndef(btn.dataset.playDuration),
        onDone: () => btn.removeAttribute("aria-busy"),
      });
    });
  });
}

function init() {
  attach(["residual-layer", "residual-sparsity"], drawResidualStream);
  attach(["qk-token", "qk-scale"], drawQkOv);
  attach(["probe-capacity", "probe-control"], drawProbeValidity);
  attach(["mdl-complexity"], drawMdlEvidence);
  attach(["causal-mode"], drawCausalInterventions);
  attach(["lens-layer", "lens-tuned"], drawLens);
  attach(["structural-layer", "structural-step"], drawStructuralProbe);
  attach(["composition-form", "composition-case", "composition-interaction"], drawSemanticComposition);
  attach(["head-null"], drawHeadTypes);
  attach(["head-pattern-kind", "head-pattern-dest"], drawHeadPatterns);
  attach(["induction-step"], drawInduction);
  attach(["induction-bump-step"], drawInductionBump);
  attach(["knowledge-divergence"], drawRepresentedExpressed);
  attach(["binding-number", "binding-strategy"], drawBinding);
  attach(["lookback-step"], drawLookback);
  attach(["retrieval-mask"], drawRetrievalMask);
  attach(["binding-swap"], drawBindingSwap);
  attach(["belief-query"], drawBeliefSlot);
  wirePlayButtons();
}

init();
