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
  setText("qk-token-v", String(focus));
  clear(ctx, c);
  const tokens = ["The", "key", "unlocked", "the", "door", "."];
  const scores = tokens.map((_, i) => {
    if (i > focus) return -3.2;
    const target = Math.max(0, focus - 1);
    return 2.35 - Math.abs(i - target) * 0.95 - (i === focus ? 0.65 : 0);
  });
  const maxScore = Math.max(...scores);
  const expScores = scores.map((s, i) => (i <= focus ? Math.exp(s - maxScore) : 0));
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
  label(ctx, "softmax turns scores into the weights used below", 520, 210, colors.dim, 11);
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
  readout("qk-ov-readout", `<div class="row"><span class="lbl">destination token</span><span>${tokens[focus]}</span></div><div class="row"><span class="lbl">largest QK weight</span><span>${tokens[topSource]} (${Math.round(weights[topSource] * 100)}%)</span></div><div class="row"><span class="lbl">OV step</span><span>weighted values -> output matrix -> residual update</span></div>`);
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
  setText("structural-layer-v", layer.toFixed(0));
  clear(ctx, c);
  const words = ["The", "student", "solved", "the", "problem"];
  const pts = [
    { x: 80, y: 138 },
    { x: 205, y: 80 },
    { x: 330, y: 138 },
    { x: 455, y: 82 },
    { x: 580, y: 138 },
  ];
  const edges = [[2, 1], [1, 0], [2, 4], [4, 3]];
  label(ctx, "gold dependency tree and probe-recovered MST", 28, 28, colors.text, 14);
  edges.forEach(([a, b], i) => {
    const correct = layer > 3 && layer < 9 || i < 2;
    line(ctx, pts[a], pts[b], correct ? colors.green : colors.red, 3);
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
      const dist = Math.abs(r - col) + Math.abs(layer - 6) * 0.25;
      const alpha = Math.max(0.08, Math.min(0.82, 1 - dist / 5.2));
      ctx.fillStyle = `rgba(31,74,140,${alpha})`;
      ctx.fillRect(mx + col * cell, my + r * cell, cell - 2, cell - 2);
    }
  }
  const quality = Math.max(0.15, 1 - Math.abs(layer - 6) / 7);
  ctx.fillStyle = colors.green;
  ctx.fillRect(430, 392 - quality * 130, 58, quality * 130);
  label(ctx, "UUAS-like score", 459, 410, colors.dim, 11, "center");
  label(ctx, `${Math.round(quality * 100)}%`, 459, 382 - quality * 130, colors.green, 12, "center");
  readout("structural-probe-readout", `<div class="row"><span class="lbl">layer</span><span>${layer}</span></div><div class="row"><span class="lbl">pattern</span><span>syntax is easiest to decode near the middle in this schematic</span></div>`);
}

function drawSemanticComposition() {
  const c = canvas("semantic-composition-canvas");
  if (!c) return;
  const ctx = ctx2d(c);
  const form = select("composition-form")?.value ?? "add";
  setText("composition-form-v", select("composition-form")?.selectedOptions[0]?.textContent ?? form);
  clear(ctx, c);
  label(ctx, "head + dependent -> parent meaning", 30, 28, colors.text, 14);
  const origin = { x: 210, y: 275 };
  arrow(ctx, origin, { x: 310, y: 206 }, colors.blue, 4);
  arrow(ctx, origin, { x: 282, y: 328 }, colors.red, 4);
  const parent = form === "bilinear" ? { x: 373, y: 198 } : form === "nonlinear" ? { x: 342, y: 166 } : { x: 382, y: 258 };
  arrow(ctx, origin, parent, colors.green, 5);
  dot(ctx, parent, 7, colors.green);
  label(ctx, "head", 315, 202, colors.blue);
  label(ctx, "dependent", 286, 346, colors.red);
  label(ctx, "predicted parent", parent.x + 10, parent.y, colors.green);
  box(ctx, 488, 108, 176, 64, "#fff", colors.rule);
  label(ctx, form === "add" ? "additive" : form === "bilinear" ? "bilinear" : "nonlinear", 576, 136, colors.text, 16, "center");
  label(ctx, "composition hypothesis", 576, 156, colors.dim, 11, "center");
  readout("semantic-composition-readout", `<div class="row"><span class="lbl">form</span><span>${form}</span></div><div class="row"><span class="lbl">scope</span><span>these are alternative probe forms, not model results</span></div>`);
}

function drawHeadTypes() {
  const c = canvas("head-types-canvas");
  if (!c) return;
  const ctx = ctx2d(c);
  const nullOn = input("head-null")?.checked ?? false;
  clear(ctx, c);
  label(ctx, "head embeddings: clean-looking clusters need controls", 30, 28, colors.text, 14);
  const centers = [
    { x: 170, y: 138, color: colors.blue, name: "positional" },
    { x: 310, y: 184, color: colors.green, name: "induction" },
    { x: 214, y: 290, color: colors.red, name: "syntactic" },
  ];
  for (let i = 0; i < 90; i++) {
    const g = i % 3;
    const layerShift = nullOn ? (Math.floor(i / 9) - 5) * 15 : 0;
    const p = centers[g];
    dot(ctx, { x: p.x + Math.sin(i * 1.7) * 28 + layerShift, y: p.y + Math.cos(i * 1.2) * 24 }, 4, p.color);
  }
  centers.forEach((p) => label(ctx, p.name, p.x + 34, p.y, p.color, 11));
  const silhouette = nullOn ? 0.24 : 0.71;
  ctx.fillStyle = silhouette > 0.5 ? colors.green : colors.orange;
  ctx.fillRect(540, 288 - silhouette * 180, 58, silhouette * 180);
  label(ctx, "silhouette", 569, 308, colors.dim, 11, "center");
  label(ctx, silhouette.toFixed(2), 569, 278 - silhouette * 180, colors.text, 14, "center");
  readout("head-types-readout", `<div class="row"><span class="lbl">diagnostic</span><span>${nullOn ? "within-layer null on" : "raw clusters"}</span></div><div class="row"><span class="lbl">scope</span><span>cluster shape and causal role are separate questions</span></div>`);
}

function drawHeadPatterns() {
  const c = canvas("head-patterns-canvas");
  if (!c) return;
  const ctx = ctx2d(c);
  clear(ctx, c);
  const toks = ["the", "cat", "sat", "on", "the", "mat"];
  const n = toks.length;
  // Stanford-style heads (preposition heads its phrase); root "sat" points to itself.
  const depHead = [1, 2, 2, 2, 5, 3];
  const panels: { name: string; w: (d: number, s: number) => number }[] = [
    { name: "positional: previous token", w: (d, s) => (s === d - 1 ? 1 : 0) },
    { name: "induction: 2nd ‘the’ → after 1st ‘the’", w: (d, s) => (d === 4 ? (s === 1 ? 1 : 0) : s === d - 1 ? 0.6 : 0) },
    { name: "syntactic: dependent → head", w: (d, s) => (d !== 2 && depHead[d] === s ? 1 : s === d ? 0.2 : 0) },
    { name: "name-mover: → a name token", w: (d, s) => (s === 1 ? 1 : 0) },
  ];
  panels.forEach((panel, idx) => {
    const px = 24 + (idx % 2) * 380;
    const py = 32 + Math.floor(idx / 2) * 196;
    label(ctx, panel.name, px, py, colors.text, 12.5);
    const gx = px + 40;
    const gy = py + 16;
    const cell = 22;
    for (let d = 0; d < n; d++) {
      let total = 0;
      for (let s = 0; s <= d; s++) total += panel.w(d, s);
      for (let s = 0; s < n; s++) {
        const allowed = s <= d;
        const wv = allowed && total > 0 ? panel.w(d, s) / total : 0;
        ctx.fillStyle = allowed ? `rgba(31,74,140,${0.05 + wv * 0.83})` : "#f3f1ec";
        ctx.fillRect(gx + s * cell, gy + d * cell, cell - 2, cell - 2);
      }
      label(ctx, toks[d], gx - 6, gy + d * cell + cell - 8, colors.dim, 9.5, "right");
    }
    for (let s = 0; s < n; s++) {
      label(ctx, toks[s], gx + s * cell + (cell - 2) / 2, gy + n * cell + 12, colors.dim, 9.5, "center");
    }
    label(ctx, "source position →", gx, gy + n * cell + 28, colors.dim, 9.5);
  });
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

function drawVariableBinding() {
  const c = canvas("variable-binding-canvas");
  if (!c) return;
  const ctx = ctx2d(c);
  const distractor = input("binding-distractor")?.checked ?? false;
  clear(ctx, c);
  const panels = [
    { title: "language", a: "Alice", b: "Maya", use: "she" },
    { title: "code", a: "count", b: "total", use: "count" },
    { title: "logic", a: "A->B", b: "B->C", use: "A->C" },
  ];
  panels.forEach((p, i) => {
    const x = 70 + i * 220;
    box(ctx, x, 72, 170, 210, "#fff", colors.rule);
    label(ctx, p.title, x + 85, 100, colors.red, 12, "center");
    const a = { x: x + 50, y: 150 };
    const b = { x: x + 122, y: 150 };
    const u = { x: x + 86, y: 236 };
    box(ctx, a.x - 30, a.y - 16, 60, 32, colors.panel, colors.blue);
    box(ctx, b.x - 30, b.y - 16, 60, 32, colors.panel, colors.orange);
    box(ctx, u.x - 34, u.y - 16, 68, 32, "#fee2d5", colors.red);
    label(ctx, p.a, a.x, a.y + 4, colors.blue, 11, "center");
    label(ctx, p.b, b.x, b.y + 4, colors.orange, 11, "center");
    label(ctx, p.use, u.x, u.y + 4, colors.red, 11, "center");
    arrow(ctx, u, distractor ? b : a, distractor ? colors.orange : colors.green, 3);
  });
  readout("variable-binding-readout", `<div class="row"><span class="lbl">binding</span><span>${distractor ? "nearest distractor lure" : "structural dependency"}</span></div><div class="row"><span class="lbl">shared problem</span><span>resolve a use against a nonlocal source</span></div>`);
}

function init() {
  attach(["residual-layer", "residual-sparsity"], drawResidualStream);
  attach(["qk-token"], drawQkOv);
  attach(["probe-capacity", "probe-control"], drawProbeValidity);
  attach(["mdl-complexity"], drawMdlEvidence);
  attach(["causal-mode"], drawCausalInterventions);
  attach(["lens-layer", "lens-tuned"], drawLens);
  attach(["structural-layer"], drawStructuralProbe);
  attach(["composition-form"], drawSemanticComposition);
  attach(["head-null"], drawHeadTypes);
  drawHeadPatterns();
  attach(["induction-step"], drawInduction);
  attach(["induction-bump-step"], drawInductionBump);
  attach(["knowledge-divergence"], drawRepresentedExpressed);
  attach(["binding-distractor"], drawVariableBinding);
}

init();
