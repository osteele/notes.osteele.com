// Exponential-family decomposition picker.
//
// Pick a family from the table; the density preview updates and the parameter
// sliders rebind to that family's conventional parameters. The live readout
// shows the numerical values of η and A(η) for the current slider values.
//
// Self-contained: doesn't depend on any other public-script entry.

const C = {
  bg: "#ffffff",
  grid: "#e3ddd0",
  axis: "#5a6577",
  text: "#1f2733",
  textDim: "#5a6577",
  posterior: "#2d7a3e",
  posteriorFill: "rgba(45,122,62,0.18)",
};

function setupCanvas(canvas: HTMLCanvasElement) {
  const ratio = window.devicePixelRatio || 1;
  const intrinsicW = parseInt(canvas.getAttribute("width") || "780", 10);
  const intrinsicH = parseInt(canvas.getAttribute("height") || "280", 10);
  canvas.style.width = "100%";
  canvas.style.height = `${canvas.getBoundingClientRect().width * intrinsicH / intrinsicW}px`;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * ratio;
  canvas.height = rect.height * ratio;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(ratio, ratio);
  return { ctx, w: rect.width, h: rect.height };
}

function logGamma(z: number): number {
  const g = 7;
  const p = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  z -= 1;
  let x = p[0];
  for (let i = 1; i < g + 2; i++) x += p[i] / (z + i);
  const t = z + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}
function logBeta(a: number, b: number) {
  return logGamma(a) + logGamma(b) - logGamma(a + b);
}
function betaPdf(x: number, a: number, b: number) {
  if (x <= 0 || x >= 1) return 0;
  return Math.exp((a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x) - logBeta(a, b));
}
function poissonPmf(k: number, lam: number) {
  if (k < 0 || !Number.isInteger(k)) return 0;
  return Math.exp(k * Math.log(lam) - lam - logGamma(k + 1));
}
function gammaPdf(x: number, alpha: number, beta: number) {
  if (x <= 0) return 0;
  return Math.exp(alpha * Math.log(beta) - logGamma(alpha) + (alpha - 1) * Math.log(x) - beta * x);
}
function normalPdf(x: number, mu: number, sigma: number) {
  return Math.exp(-((x - mu) ** 2) / (2 * sigma * sigma)) / (sigma * Math.sqrt(2 * Math.PI));
}

type ExpDist = "bernoulli" | "poisson" | "exponential" | "normal" | "gamma" | "beta";

interface ExpDistMeta {
  display: string;
  kind: "discrete" | "continuous";
  xRange: [number, number];
  p1: { sym: string; min: number; max: number; step: number; def: number };
  p2?: { sym: string; min: number; max: number; step: number; def: number };
  pdf: (x: number, p1: number, p2?: number) => number;
  describe: (p1: number, p2?: number) => string;
}

const EXP_META: Record<ExpDist, ExpDistMeta> = {
  bernoulli: {
    display: "Bernoulli(p)",
    kind: "discrete",
    xRange: [0, 1],
    p1: { sym: "p", min: 0.02, max: 0.98, step: 0.01, def: 0.5 },
    pdf: (k, p) => (k === 0 ? 1 - p : k === 1 ? p : 0),
    describe: (p) => `η = log(p / (1 − p)) = ${Math.log(p / (1 - p)).toFixed(3)},  A(η) = log(1 + e^η) = ${(-Math.log(1 - p)).toFixed(3)},  μ = E[T(X)] = p = ${p.toFixed(3)}`,
  },
  poisson: {
    display: "Poisson(λ)",
    kind: "discrete",
    xRange: [0, 20],
    p1: { sym: "λ", min: 0.2, max: 12, step: 0.1, def: 3 },
    pdf: (k, lam) => poissonPmf(Math.round(k), lam),
    describe: (lam) => `η = log λ = ${Math.log(lam).toFixed(3)},  A(η) = e^η = ${lam.toFixed(3)},  μ = ∇A(η) = λ = ${lam.toFixed(3)}`,
  },
  exponential: {
    display: "Exponential(λ)",
    kind: "continuous",
    xRange: [0, 6],
    p1: { sym: "λ", min: 0.2, max: 3, step: 0.02, def: 1 },
    pdf: (x, lam) => (x < 0 ? 0 : lam * Math.exp(-lam * x)),
    describe: (lam) => `η = −λ = ${(-lam).toFixed(3)},  A(η) = −log(−η) = ${(-Math.log(lam)).toFixed(3)},  μ = 1/λ = ${(1 / lam).toFixed(3)}`,
  },
  normal: {
    display: "Normal(μ, σ²) — σ known",
    kind: "continuous",
    xRange: [-5, 5],
    p1: { sym: "μ", min: -3, max: 3, step: 0.05, def: 0 },
    p2: { sym: "σ", min: 0.3, max: 2.5, step: 0.05, def: 1 },
    pdf: (x, mu, sigma) => normalPdf(x, mu, sigma ?? 1),
    describe: (mu, sigma) => {
      const s = sigma ?? 1;
      return `η = μ/σ² = ${(mu / (s * s)).toFixed(3)},  A(η) = μ²/(2σ²) = ${((mu * mu) / (2 * s * s)).toFixed(3)},  E[T(X)] = μ = ${mu.toFixed(3)}`;
    },
  },
  gamma: {
    display: "Gamma(α, β)",
    kind: "continuous",
    xRange: [0, 12],
    p1: { sym: "α", min: 0.5, max: 8, step: 0.05, def: 2 },
    p2: { sym: "β", min: 0.2, max: 4, step: 0.05, def: 1 },
    pdf: (x, alpha, beta) => gammaPdf(x, alpha, beta ?? 1),
    describe: (a, b) => {
      const bv = b ?? 1;
      return `η = (α−1, −β) = (${(a - 1).toFixed(2)}, ${(-bv).toFixed(2)}),  T(x) = (log x, x),  E[X] = α/β = ${(a / bv).toFixed(3)}`;
    },
  },
  beta: {
    display: "Beta(α, β)",
    kind: "continuous",
    xRange: [0, 1],
    p1: { sym: "α", min: 0.5, max: 8, step: 0.05, def: 2 },
    p2: { sym: "β", min: 0.5, max: 8, step: 0.05, def: 5 },
    pdf: (x, alpha, beta) => betaPdf(x, alpha, beta ?? 1),
    describe: (a, b) => {
      const bv = b ?? 1;
      return `η = (α−1, β−1) = (${(a - 1).toFixed(2)}, ${(bv - 1).toFixed(2)}),  T(x) = (log x, log(1−x)),  E[X] = α/(α+β) = ${(a / (a + bv)).toFixed(3)}`;
    },
  },
};

function setupExpFamily() {
  const canvas = document.getElementById("fig-expfam") as HTMLCanvasElement | null;
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const p1In = document.getElementById("fig-expfam-p1") as HTMLInputElement | null;
  const p2In = document.getElementById("fig-expfam-p2") as HTMLInputElement | null;
  const p1Lbl = document.getElementById("fig-expfam-p1-lbl") as HTMLElement | null;
  const p2Lbl = document.getElementById("fig-expfam-p2-lbl") as HTMLElement | null;
  const p1Val = document.getElementById("fig-expfam-p1-v") as HTMLElement | null;
  const p2Val = document.getElementById("fig-expfam-p2-v") as HTMLElement | null;
  const p2Row = document.getElementById("fig-expfam-p2-row") as HTMLElement | null;
  const readout = document.getElementById("expfam-readout") as HTMLElement | null;
  if (!p1In || !p2In || !p1Lbl || !p2Lbl || !p1Val || !p2Val || !p2Row || !readout) return;

  let active: ExpDist = "bernoulli";

  function applyMeta(name: ExpDist) {
    const m = EXP_META[name];
    active = name;
    p1In!.min = String(m.p1.min);
    p1In!.max = String(m.p1.max);
    p1In!.step = String(m.p1.step);
    p1In!.value = String(m.p1.def);
    p1Lbl!.textContent = m.p1.sym + ":";
    p1Val!.textContent = m.p1.def.toFixed(2);
    if (m.p2) {
      p2Row!.style.display = "";
      p2In!.min = String(m.p2.min);
      p2In!.max = String(m.p2.max);
      p2In!.step = String(m.p2.step);
      p2In!.value = String(m.p2.def);
      p2Lbl!.textContent = m.p2.sym + ":";
      p2Val!.textContent = m.p2.def.toFixed(2);
    } else {
      p2Row!.style.display = "none";
    }
  }

  function render() {
    const m = EXP_META[active];
    const p1 = parseFloat(p1In!.value);
    const p2 = m.p2 ? parseFloat(p2In!.value) : undefined;
    p1Val!.textContent = p1.toFixed(2);
    if (m.p2 && p2 !== undefined) p2Val!.textContent = p2.toFixed(2);

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, w, h);

    const padL = 56, padR = 18, padT = 16, padB = 32;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    const [xMin, xMax] = m.xRange;
    let yMax = 0;
    const xs: number[] = [];
    const ys: number[] = [];
    if (m.kind === "discrete") {
      const kMax = Math.ceil(xMax);
      for (let k = Math.floor(xMin); k <= kMax; k++) {
        xs.push(k);
        const y = m.pdf(k, p1, p2);
        ys.push(y);
        if (y > yMax) yMax = y;
      }
    } else {
      const N = 300;
      for (let i = 0; i <= N; i++) {
        const x = xMin + ((xMax - xMin) * i) / N;
        xs.push(x);
        const y = m.pdf(x, p1, p2);
        ys.push(y);
        if (y > yMax) yMax = y;
      }
    }
    yMax = Math.max(yMax * 1.1, 1e-6);

    ctx.strokeStyle = C.grid;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const gx = padL + (i / 10) * plotW;
      ctx.beginPath(); ctx.moveTo(gx, padT); ctx.lineTo(gx, padT + plotH); ctx.stroke();
    }
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(padL, padT + plotH); ctx.lineTo(padL + plotW, padT + plotH);
    ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + plotH);
    ctx.stroke();

    ctx.fillStyle = C.textDim;
    ctx.font = "11px -apple-system, sans-serif";
    ctx.textAlign = "center";
    const xLabelN = 6;
    for (let i = 0; i <= xLabelN; i++) {
      const v = xMin + ((xMax - xMin) * i) / xLabelN;
      const px = padL + (i / xLabelN) * plotW;
      ctx.fillText(m.kind === "discrete" ? String(Math.round(v)) : v.toFixed(1), px, padT + plotH + 14);
    }
    ctx.fillStyle = C.text;
    ctx.fillText("x", padL + plotW / 2, padT + plotH + 28);
    ctx.save();
    ctx.translate(14, padT + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(m.kind === "discrete" ? "P(X = x)" : "density", 0, 0);
    ctx.restore();

    const xS = (x: number) => padL + ((x - xMin) / (xMax - xMin)) * plotW;
    const yS = (y: number) => padT + plotH - (y / yMax) * plotH;

    if (m.kind === "discrete") {
      const barW = Math.max(3, plotW / (xMax - xMin) * 0.7);
      ctx.fillStyle = C.posteriorFill;
      ctx.strokeStyle = C.posterior;
      ctx.lineWidth = 1.5;
      for (let i = 0; i < xs.length; i++) {
        const y = ys[i];
        if (y <= 0) continue;
        const px = xS(xs[i]) - barW / 2;
        const py = yS(y);
        ctx.fillRect(px, py, barW, padT + plotH - py);
        ctx.strokeRect(px, py, barW, padT + plotH - py);
      }
    } else {
      ctx.fillStyle = C.posteriorFill;
      ctx.beginPath();
      ctx.moveTo(xS(xs[0]), padT + plotH);
      for (let i = 0; i < xs.length; i++) ctx.lineTo(xS(xs[i]), yS(ys[i]));
      ctx.lineTo(xS(xs[xs.length - 1]), padT + plotH);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = C.posterior;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < xs.length; i++) {
        const px = xS(xs[i]);
        const py = yS(ys[i]);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    readout.textContent = `${EXP_META[active].display}.  ${m.describe(p1, p2)}`;
  }

  document.querySelectorAll<HTMLElement>("[data-expfam-row]").forEach((row) => {
    row.addEventListener("click", () => {
      const name = row.dataset.expfamRow as ExpDist;
      if (!(name in EXP_META)) return;
      document.querySelectorAll("[data-expfam-row]").forEach((r) => r.classList.remove("active"));
      row.classList.add("active");
      applyMeta(name);
      render();
    });
  });

  p1In.addEventListener("input", render);
  p2In.addEventListener("input", render);

  applyMeta("bernoulli");
  render();
  window.addEventListener("resize", render);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupExpFamily);
} else {
  setupExpFamily();
}
