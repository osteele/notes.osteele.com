const C = {
  bg: "#ffffff",
  grid: "#e3ddd0",
  axis: "#5a6577",
  text: "#1f2733",
  textDim: "#5a6577",
  red: "#b8412a",
  blue: "#1f4a8c",
  green: "#2d7a3e",
  orange: "#d4690a",
  purple: "#6b4592",
  gray: "#bfb9aa",
};

function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }
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
function logGamma(z) {
  const p = [676.5203681218851, -1259.1392167224028, 771.3234287776531, -176.6150291621406, 12.507343278686905, -0.13857109526572012, 9.984369578019572e-6, 1.5056327351493116e-7];
  if (z < 0.5) return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - logGamma(1 - z);
  z -= 1;
  let x = 0.9999999999998099;
  for (let i = 0; i < p.length; i++) x += p[i] / (z + i + 1);
  const t = z + p.length - 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}
function betaFn(a, b) { return Math.exp(logGamma(a) + logGamma(b) - logGamma(a + b)); }
function normalPdf(x, mu = 0, sigma = 1) {
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
}
function normalCdf(x) {
  const sign = x < 0 ? -1 : 1;
  const z = Math.abs(x) / Math.sqrt(2);
  const t = 1 / (1 + 0.3275911 * z);
  const erf = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-z * z);
  return 0.5 * (1 + sign * erf);
}
function cauchyPdf(x, x0 = 0, gamma = 1) {
  return 1 / (Math.PI * gamma * (1 + ((x - x0) / gamma) ** 2));
}
function laplacePdf(x, mu = 0, b = 1) {
  return Math.exp(-Math.abs(x - mu) / b) / (2 * b);
}
function poissonPmf(k, lambda) {
  return Math.exp(k * Math.log(lambda) - lambda - logGamma(k + 1));
}
function binomialPmf(k, n, p) {
  if (k < 0 || k > n) return 0;
  return Math.exp(logGamma(n + 1) - logGamma(k + 1) - logGamma(n - k + 1) + k * Math.log(p) + (n - k) * Math.log(1 - p));
}
function negBinPmf(k, r, p) {
  return Math.exp(logGamma(k + r) - logGamma(k + 1) - logGamma(r) + r * Math.log(p) + k * Math.log(1 - p));
}
function chiPdf(x, k) {
  if (x <= 0) return k === 2 && x === 0 ? 0.5 : 0;
  return Math.exp((k / 2 - 1) * Math.log(x) - x / 2 - (k / 2) * Math.log(2) - logGamma(k / 2));
}
function tPdf(x, nu) {
  return Math.exp(logGamma((nu + 1) / 2) - logGamma(nu / 2) - 0.5 * Math.log(nu * Math.PI) - ((nu + 1) / 2) * Math.log(1 + x * x / nu));
}
function fPdf(x, d1, d2) {
  if (x <= 0) return 0;
  const a = d1 / 2, b = d2 / 2;
  return Math.exp(a * Math.log(d1 / d2) + (a - 1) * Math.log(x) - (a + b) * Math.log(1 + (d1 / d2) * x) - Math.log(betaFn(a, b)));
}
function betaPdf(x, a, b) {
  if (x <= 0 || x >= 1) return 0;
  return Math.exp((a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x) - Math.log(betaFn(a, b)));
}
function gammaPdf(x, a, rate) {
  if (x <= 0) return 0;
  return Math.exp(a * Math.log(rate) + (a - 1) * Math.log(x) - rate * x - logGamma(a));
}
function invChiSqPdf(x, nu) {
  if (x <= 0) return 0;
  return Math.exp(-(nu / 2) * Math.log(2) - logGamma(nu / 2) + (-nu / 2 - 1) * Math.log(x) - 1 / (2 * x));
}
function scaledInvChiSqPdf(x, nu, tau2) {
  if (x <= 0) return 0;
  const a = nu / 2;
  return Math.exp(a * Math.log(a * tau2) - logGamma(a) + (-a - 1) * Math.log(x) - (a * tau2) / x);
}
function seeded(seed) {
  let s = seed | 0;
  return () => {
    s = (1664525 * s + 1013904223) | 0;
    return ((s >>> 0) / 4294967296);
  };
}
function randn(rng) {
  let u = rng(); if (u <= 0) u = 1e-9;
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
function randnNonzero(rng, eps = 1e-6) {
  // Ratio demos need finite samples; extreme values are kept, exact zero denominators are not.
  let z = randn(rng);
  while (Math.abs(z) < eps) z = randn(rng);
  return z;
}

function clear(ctx, w, h) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);
}
function scales(w, h, xMin, xMax, yMax, pad = { l: 36, r: 14, t: 16, b: 28 }) {
  const plotW = w - pad.l - pad.r, plotH = h - pad.t - pad.b;
  return {
    pad, plotW, plotH,
    x: v => pad.l + ((v - xMin) / (xMax - xMin)) * plotW,
    y: v => pad.t + plotH - (v / yMax) * plotH,
  };
}
function logScales(w, h, xMin, xMax, yMin, yMax, pad = { l: 46, r: 14, t: 16, b: 34 }) {
  const plotW = w - pad.l - pad.r, plotH = h - pad.t - pad.b;
  const lx0 = Math.log(xMin), lx1 = Math.log(xMax);
  const ly0 = Math.log(yMin), ly1 = Math.log(yMax);
  return {
    pad, plotW, plotH,
    x: v => pad.l + ((Math.log(v) - lx0) / (lx1 - lx0)) * plotW,
    y: v => pad.t + plotH - ((Math.log(v) - ly0) / (ly1 - ly0)) * plotH,
  };
}
function axes(ctx, s, xTicks = []) {
  ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = s.pad.t + (i / 4) * s.plotH;
    ctx.beginPath(); ctx.moveTo(s.pad.l, y); ctx.lineTo(s.pad.l + s.plotW, y); ctx.stroke();
  }
  ctx.strokeStyle = C.axis;
  ctx.beginPath();
  ctx.moveTo(s.pad.l, s.pad.t);
  ctx.lineTo(s.pad.l, s.pad.t + s.plotH);
  ctx.lineTo(s.pad.l + s.plotW, s.pad.t + s.plotH);
  ctx.stroke();
  ctx.fillStyle = C.textDim; ctx.font = "10px -apple-system, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "top";
  for (const t of xTicks) ctx.fillText(String(t), s.x(t), s.pad.t + s.plotH + 4);
}
function line(ctx, s, points, color, dash = []) {
  ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.setLineDash(dash);
  ctx.beginPath();
  points.forEach((p, i) => {
    if (i === 0) ctx.moveTo(s.x(p.x), s.y(p.y)); else ctx.lineTo(s.x(p.x), s.y(p.y));
  });
  ctx.stroke(); ctx.setLineDash([]);
}
function bars(ctx, s, values, color, x0 = 0, width = 0.85) {
  ctx.fillStyle = color;
  values.forEach((v, i) => {
    const left = s.x(x0 + i - width / 2);
    const right = s.x(x0 + i + width / 2);
    ctx.fillRect(left, s.y(v), Math.max(1, right - left), s.y(0) - s.y(v));
  });
}
function curve(fn, xMin, xMax, n = 240) {
  return Array.from({ length: n + 1 }, (_, i) => {
    const x = xMin + (i / n) * (xMax - xMin);
    return { x, y: fn(x) };
  });
}
function label(ctx, text, x, y, align = "center", baseline = "middle", color = C.textDim) {
  ctx.fillStyle = color;
  ctx.font = "10px -apple-system, sans-serif";
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillText(text, x, y);
}

const renderers = {
  "bernoulli-binomial": (ctx, w, h, p) => {
    const n = +p.n, prob = +p.p;
    const vals = Array.from({ length: n + 1 }, (_, k) => binomialPmf(k, n, prob));
    // y-axis is fixed w.r.t. p so bar heights stay proportional to probability
    // and visibly conserve their total. Scale to the tallest bar the distribution
    // reaches at the p-slider extreme (0.02/0.98), where binomial peaks are highest.
    const peak = Math.max(...Array.from({ length: n + 1 }, (_, k) => binomialPmf(k, n, 0.02)));
    const s = scales(w, h, -0.5, n + 0.5, peak * 1.05);
    clear(ctx, w, h); axes(ctx, s, [0, Math.round(n / 2), n]); bars(ctx, s, vals, "rgba(31,74,140,0.72)");
    return `mean=${(n * prob).toFixed(2)}  var=${(n * prob * (1 - prob)).toFixed(2)}`;
  },
  "categorical-multinomial": (ctx, w, h, p) => {
    const n = +p.n;
    let p1 = +p.p1, p2 = +p.p2;
    // Clamp so the three-component vector stays on the simplex with room for p3.
    if (p1 + p2 > 0.95) { const s = 0.95 / (p1 + p2); p1 *= s; p2 *= s; }
    const probs = [p1, p2, 1 - p1 - p2];
    const labels = ["1", "2", "3"];
    const means = probs.map(pk => n * pk);
    const sds = probs.map(pk => Math.sqrt(n * pk * (1 - pk)));
    const yMax = Math.max(...means.map((m, i) => m + 2 * sds[i])) * 1.1;
    const s = scales(w, h, -0.5, probs.length - 0.5, yMax);
    clear(ctx, w, h); axes(ctx, s, labels.map((_, i) => i));
    const colors = ["rgba(31,74,140,0.72)", "rgba(45,122,62,0.72)", "rgba(107,69,146,0.72)"];
    means.forEach((m, i) => {
      ctx.fillStyle = colors[i];
      const x0 = s.x(i - 0.35), x1 = s.x(i + 0.35);
      ctx.fillRect(x0, s.y(m), x1 - x0, s.y(0) - s.y(m));
      // whiskers for ±2σ binomial-marginal spread
      ctx.strokeStyle = C.text; ctx.lineWidth = 1.4;
      const cx = s.x(i), top = s.y(m + 2 * sds[i]), bot = s.y(Math.max(0, m - 2 * sds[i]));
      ctx.beginPath(); ctx.moveTo(cx, top); ctx.lineTo(cx, bot);
      ctx.moveTo(cx - 5, top); ctx.lineTo(cx + 5, top);
      ctx.moveTo(cx - 5, bot); ctx.lineTo(cx + 5, bot);
      ctx.stroke();
    });
    label(ctx, "category", (s.pad.l + s.pad.l + s.plotW) / 2, h - 4);
    return `p=(${probs.map(v => v.toFixed(2)).join(", ")})  n=${n}  Kᵢ ~ Binomial(n, pᵢ); cov(Kᵢ,Kⱼ) = -n pᵢ pⱼ`;
  },
  geometric: (ctx, w, h, p) => {
    const prob = +p.p, maxK = Math.ceil(6 / prob);
    const vals = Array.from({ length: maxK }, (_, i) => prob * (1 - prob) ** i);
    const s = scales(w, h, 0.5, maxK + 0.5, Math.max(...vals) * 1.18);
    clear(ctx, w, h); axes(ctx, s, [1, Math.round(maxK / 2), maxK]); bars(ctx, s, vals, "rgba(45,122,62,0.7)", 1);
    return `E[X]=1/p=${(1 / prob).toFixed(2)}  P(X>k)=(1-p)^k`;
  },
  "poisson-limit": (ctx, w, h, p) => {
    const lambda = +p.lambda, n = +p.n, q = Math.min(0.99, lambda / n), maxK = Math.max(12, Math.ceil(lambda + 5 * Math.sqrt(lambda)));
    const bin = Array.from({ length: maxK + 1 }, (_, k) => binomialPmf(k, n, q));
    const pois = Array.from({ length: maxK + 1 }, (_, k) => poissonPmf(k, lambda));
    const s = scales(w, h, -0.5, maxK + 0.5, Math.max(...bin, ...pois) * 1.2);
    clear(ctx, w, h); axes(ctx, s, [0, Math.round(maxK / 2), maxK]);
    bars(ctx, s, bin, "rgba(31,74,140,0.6)");
    bars(ctx, s, pois, "rgba(184,65,42,0.36)", 0, 0.35);
    return `Binomial(${n}, ${(lambda / n).toFixed(3)}) overlays Poisson(${lambda.toFixed(1)})`;
  },
	  "negative-binomial": (ctx, w, h, p) => {
	    const r = +p.r, prob = +p.p, mean = r * (1 - prob) / prob, maxK = Math.ceil(mean + 6 * Math.sqrt(mean / prob));
	    const nb = Array.from({ length: maxK + 1 }, (_, k) => negBinPmf(k, r, prob));
	    const pois = Array.from({ length: maxK + 1 }, (_, k) => poissonPmf(k, mean));
	    const s = scales(w, h, -0.5, maxK + 0.5, Math.max(...nb, ...pois) * 1.2);
	    clear(ctx, w, h); axes(ctx, s, [0, Math.round(mean), maxK]);
	    bars(ctx, s, nb, "rgba(107,69,146,0.65)", 0, 0.7);
	    bars(ctx, s, pois, "rgba(191,185,170,0.75)", 0, 0.32);
	    const variance = r * (1 - prob) / (prob * prob);
	    return `mean=${mean.toFixed(2)}  variance=${variance.toFixed(2)}  var/mean=${(1 / prob).toFixed(2)}`;
	  },
  "inverse-cdf": (ctx, w, h, p) => {
    const family = p.family, shape = +p.shape;
    const inv = u => {
      if (family === "exponential") return -Math.log(1 - u) / shape;
      if (family === "pareto") return (1 - u) ** (-1 / shape);
      return Math.log(u / (1 - u)) / shape;
    };
    const ys = Array.from({ length: 101 }, (_, i) => inv(clamp((i + 0.5) / 102, 1e-4, 0.9999)));
    const yMin = Math.min(...ys), yMax = Math.max(...ys);
	    const s = scales(w, h, 0, 1, yMax - yMin, { l: 36, r: 14, t: 16, b: 28 });
	    clear(ctx, w, h); axes(ctx, s, [0, 0.5, 1]);
	    const shifted = { ...s, y: v => s.y(v - yMin) };
	    line(ctx, shifted, ys.map((y, i) => ({ x: (i + 0.5) / 102, y })), C.red);
	    label(ctx, yMax.toFixed(1), s.pad.l - 5, shifted.y(yMax), "right", "middle");
	    label(ctx, ((yMin + yMax) / 2).toFixed(1), s.pad.l - 5, shifted.y((yMin + yMax) / 2), "right", "middle");
	    label(ctx, yMin.toFixed(1), s.pad.l - 5, shifted.y(yMin), "right", "middle");
	    ctx.fillStyle = C.blue;
    for (let i = 1; i <= 9; i++) {
      const u = i / 10, y = inv(u);
      ctx.beginPath(); ctx.arc(s.x(u), s.y(y - yMin), 3, 0, 2 * Math.PI); ctx.fill();
    }
    return `uniform u values become ${family} samples through F^-1(u)`;
  },
  "exponential-min": (ctx, w, h, p) => {
    const l1 = +p.l1, l2 = +p.l2, xmax = 6 / Math.min(l1, l2, l1 + l2);
    const curves = [
      { fn: x => l1 * Math.exp(-l1 * x), c: C.blue },
      { fn: x => l2 * Math.exp(-l2 * x), c: C.purple },
      { fn: x => (l1 + l2) * Math.exp(-(l1 + l2) * x), c: C.red },
    ];
    const ymax = Math.max(...curves.flatMap(c => curve(c.fn, 0, xmax, 120).map(p => p.y))) * 1.1;
    const s = scales(w, h, 0, xmax, ymax);
    clear(ctx, w, h); axes(ctx, s, [0, +(xmax / 2).toFixed(1), +xmax.toFixed(1)]);
    curves.forEach(c => line(ctx, s, curve(c.fn, 0, xmax), c.c, c.c === C.red ? [] : [4, 4]));
    return `min rate = lambda1 + lambda2 = ${(l1 + l2).toFixed(2)}`;
  },
	  "gaussian-clt": (ctx, w, h, p) => {
	    const sigma = +p.sigma, m = +p.m, rng = seeded(11 + m * 17), samples = [];
	    for (let i = 0; i < 5000; i++) {
	      let sum = 0;
	      for (let j = 0; j < m; j++) sum += rng() - 0.5;
	      samples.push(sigma * sum / Math.sqrt(m / 12));
	    }
	    const xMax = 8;
	    const bins = hist(samples, -xMax, xMax, 36);
	    const ymax = normalPdf(0, 0, 0.4) * 1.12;
	    const s = scales(w, h, -xMax, xMax, ymax);
	    clear(ctx, w, h); axes(ctx, s, [-xMax, -xMax / 2, 0, xMax / 2, xMax].map(v => +v.toFixed(1)));
	    drawHist(ctx, s, bins, "rgba(31,74,140,0.5)");
	    line(ctx, s, curve(x => normalPdf(x, 0, sigma), -xMax, xMax), C.red);
	    return `bars and curve both have sigma=${sigma.toFixed(2)}; sum of ${m} centered uniforms`;
	  },
  "cauchy-mean": (ctx, w, h, p) => {
    const gamma = +p.gamma || 1;
    const xMax = Math.max(8, gamma * 8);
    const s = scales(w, h, -xMax, xMax, Math.max(cauchyPdf(0, 0, gamma), normalPdf(0)) * 1.18);
    clear(ctx, w, h);
    axes(ctx, s, [-xMax, -xMax / 2, 0, xMax / 2, xMax].map(v => +v.toFixed(1)));
    line(ctx, s, curve(x => normalPdf(x), -xMax, xMax), C.blue, [4, 4]);
    line(ctx, s, curve(x => cauchyPdf(x, 0, gamma), -xMax, xMax), C.red);
    return `red Cauchy(0, ${gamma.toFixed(2)}); dashed blue Normal(0,1)`;
  },
  laplace: (ctx, w, h, p) => {
    const b = +p.b || 1;
    // Sample the simulated difference Exp(1/b) - Exp(1/b) so the histogram lands on the same scale as the analytic Laplace(0, b).
    const rate = 1 / b;
    const rng = seeded(57 + Math.round(b * 1000));
    const samples: number[] = [];
    for (let i = 0; i < 6000; i++) {
      let u1 = rng(); if (u1 <= 0) u1 = 1e-9;
      let u2 = rng(); if (u2 <= 0) u2 = 1e-9;
      samples.push((-Math.log(u1) + Math.log(u2)) / rate);
    }
    const xMax = Math.max(6, b * 6);
    const peak = Math.max(laplacePdf(0, 0, b), normalPdf(0)) * 1.25;
    const s = scales(w, h, -xMax, xMax, peak);
    clear(ctx, w, h);
    axes(ctx, s, [-xMax, -xMax / 2, 0, xMax / 2, xMax].map(v => +v.toFixed(1)));
    const bins = hist(samples.map(x => clamp(x, -xMax, xMax)), -xMax, xMax, 48);
    drawHist(ctx, s, bins, "rgba(45,122,62,0.42)");
    line(ctx, s, curve(x => normalPdf(x), -xMax, xMax), C.blue, [4, 4]);
    line(ctx, s, curve(x => laplacePdf(x, 0, b), -xMax, xMax), C.red);
    return `red Laplace(0, b=${b.toFixed(2)}); dashed blue Normal(0,1); bars: difference of two iid Exp(1/b)`;
  },
  sums: (ctx, w, h, p) => {
    const xs = Array.from({ length: 241 }, (_, i) => -6 + 12 * i / 240);
    const pdfFor = name => x => name === "normal" ? normalPdf(x) : name === "cauchy" ? cauchyPdf(x) : (Math.abs(x) <= 1 ? 0.5 : 0);
    const fa = pdfFor(p.a), fb = pdfFor(p.b), dx = xs[1] - xs[0];
    const conv = xs.map(x => {
      let s = 0;
      for (const u of xs) s += fa(u) * fb(x - u) * dx;
      return { x, y: s };
    });
    const ya = xs.map(x => ({ x, y: fa(x) })), yb = xs.map(x => ({ x, y: fb(x) }));
    const ymax = Math.max(...conv.map(d => d.y), ...ya.map(d => d.y), ...yb.map(d => d.y)) * 1.12;
    const sc = scales(w, h, -6, 6, ymax);
    clear(ctx, w, h); axes(ctx, sc, [-6, -3, 0, 3, 6]);
    line(ctx, sc, ya, C.blue, [4, 4]); line(ctx, sc, yb, C.purple, [2, 3]); line(ctx, sc, conv, C.red);
    return `red is convolution f_X * f_Y`;
  },
  extremes: (ctx, w, h, p) => {
    const n = +p.n, which = p.which;
    const pdf = x => {
      const F = x;
      if (x <= 0 || x >= 1) return 0;
      return which === "max" ? n * F ** (n - 1) : n * (1 - F) ** (n - 1);
    };
    const s = scales(w, h, 0, 1, n * 1.08);
    clear(ctx, w, h); axes(ctx, s, [0, 0.5, 1]); line(ctx, s, curve(pdf, 0, 1), C.red);
    return which === "max" ? `max CDF is F(x)^${n}` : `min CDF is 1 - (1 - F(x))^${n}`;
  },
  transformations: (ctx, w, h, p) => {
    const sigma = +p.sigma, kind = p.kind;
    const xMax = kind === "square" ? 9 : 8;
    const fn = x => {
      if (kind === "square") return x <= 0 ? 0 : (normalPdf(Math.sqrt(x)) + normalPdf(-Math.sqrt(x))) / (2 * Math.sqrt(x));
      return x <= 0 ? 0 : normalPdf(Math.log(x), 0, sigma) / x;
    };
    const ymax = Math.max(...curve(fn, 0.001, xMax).map(d => d.y)) * 1.15;
    const s = scales(w, h, 0, xMax, ymax);
    clear(ctx, w, h); axes(ctx, s, [0, Math.round(xMax / 2), xMax]); line(ctx, s, curve(fn, 0.001, xMax), C.red);
    return kind === "square" ? `two preimages +/-sqrt(y); Jacobian 1/(2 sqrt(y))` : `log-normal Jacobian contributes 1/y`;
  },
	  ratios: (ctx, w, h, p) => {
	    const denScale = +p.denScale;
	    const rng = seeded(93 + Math.round(denScale * 1000));
	    const samples = [];
	    for (let i = 0; i < 7000; i++) {
	      const numerator = randn(rng);
	      const denominator = denScale * randnNonzero(rng);
	      samples.push(numerator / denominator);
	    }
	    const bins = hist(samples.map(x => clamp(x, -20, 20)), -20, 20, 60);
	    const s = scales(w, h, -20, 20, Math.max(...bins.map(b => b.y), normalPdf(0)) * 1.2);
	    clear(ctx, w, h); axes(ctx, s, [-20, -10, 0, 10, 20]);
	    drawHist(ctx, s, bins, "rgba(184,65,42,0.46)");
	    line(ctx, s, curve(x => normalPdf(x), -20, 20), C.blue, [4, 4]);
	    return `Z1 / (${denScale.toFixed(2)} Z2): smaller denominator scale spreads mass into the tails`;
	  },
  "chi-square": (ctx, w, h, p) => continuous(ctx, w, h, 0, Math.max(12, +p.k * 3), x => chiPdf(x, +p.k), C.red, `chi-square df=${p.k}`),
  "student-t": (ctx, w, h, p) => {
    const nu = +p.nu, s = scales(w, h, -5, 5, 0.42);
    clear(ctx, w, h); axes(ctx, s, [-4, -2, 0, 2, 4]); line(ctx, s, curve(x => normalPdf(x), -5, 5), C.blue, [4, 4]); line(ctx, s, curve(x => tPdf(x, nu), -5, 5), C.red);
    return `t_${nu} approaches normal as degrees of freedom increase`;
  },
  "f-distribution": (ctx, w, h, p) => continuous(ctx, w, h, 0, 6, x => fPdf(x, +p.d1, +p.d2), C.red, `F(${p.d1}, ${p.d2}) is a ratio of scaled chi-squares`),
  "inverse-chi-square": (ctx, w, h, p) => {
    const nu = +p.nu;
    const mode = 1 / (nu + 2);
    const xMax = Math.max(0.6, 6 / Math.max(2, nu));
    return continuous(ctx, w, h, 0, xMax, x => invChiSqPdf(x, nu), C.red,
      `Inv-χ²(${nu})  mean=${nu > 2 ? (1 / (nu - 2)).toFixed(3) : "∞"}  mode=${mode.toFixed(3)}`);
  },
  "invchi2-normal": (ctx, w, h, p) => {
    const nu0 = 4, tau02 = 1, n = +p.n, s2 = +p.s2;
    const nu1 = nu0 + n, tau12 = (nu0 * tau02 + n * s2) / nu1;
    const prior = x => scaledInvChiSqPdf(x, nu0, tau02);
    const post = x => scaledInvChiSqPdf(x, nu1, tau12);
    return priorPosterior(ctx, w, h, 0, Math.max(4, tau12 * 4), prior, post,
      `posterior: Scale-Inv-χ²(ν=${nu1}, τ²=${tau12.toFixed(2)})`);
  },
  "beta-binomial": (ctx, w, h, p) => {
    const a0 = 2, b0 = 2, a = a0 + +p.s, b = b0 + +p.f;
    return priorPosterior(ctx, w, h, 0, 1, x => betaPdf(x, a0, b0), x => betaPdf(x, a, b), `posterior Beta(${a}, ${b})`);
  },
  "gamma-poisson": (ctx, w, h, p) => {
    const a0 = 2, r0 = 1, a = a0 + +p.y, r = r0 + +p.t;
    return priorPosterior(ctx, w, h, 0, Math.max(8, a / r * 4), x => gammaPdf(x, a0, r0), x => gammaPdf(x, a, r), `posterior Gamma(shape=${a}, rate=${r})`);
  },
  "normal-normal": (ctx, w, h, p) => {
    const mu0 = 0, tau0 = 1, sigma = 1, n = +p.n, xbar = +p.xbar;
    const postVar = 1 / (1 / tau0 + n / (sigma * sigma));
    const postMean = postVar * (mu0 / tau0 + n * xbar / (sigma * sigma));
    return priorPosterior(ctx, w, h, -4, 4, x => normalPdf(x, mu0, Math.sqrt(tau0)), x => normalPdf(x, postMean, Math.sqrt(postVar)), `posterior mean=${postMean.toFixed(2)}, sd=${Math.sqrt(postVar).toFixed(2)}`);
  },
	  "dirichlet-multinomial": (ctx, w, h, p) => {
	    const vals = [1 + +p.a, 1 + +p.b, 1 + +p.c], total = vals.reduce((a, b) => a + b, 0);
	    const probs = vals.map(v => v / total);
	    clear(ctx, w, h);
	    const pad = Math.min(30, w * 0.08);
	    const top = 20, height = h - 58;
	    const A = { x: w / 2, y: top };
	    const B = { x: pad, y: top + height };
	    const Cc = { x: w - pad, y: top + height };
	    const toXY = (a, b, c) => ({ x: a * A.x + b * B.x + c * Cc.x, y: a * A.y + b * B.y + c * Cc.y });
	    const logNorm = logGamma(total) - vals.reduce((acc, v) => acc + logGamma(v), 0);
	    const logDir = (a, b, c) => logNorm + (vals[0] - 1) * Math.log(a) + (vals[1] - 1) * Math.log(b) + (vals[2] - 1) * Math.log(c);
	    const grid = [];
	    for (let i = 1; i < 38; i++) {
	      for (let j = 1; j < 38 - i; j++) {
	        const a = i / 38, b = j / 38, c = 1 - a - b;
	        grid.push({ a, b, c, logD: logDir(a, b, c) });
	      }
	    }
	    const maxLog = Math.max(...grid.map(d => d.logD));
	    for (const d of grid) {
	      const pt = toXY(d.a, d.b, d.c);
	      const heat = clamp(Math.exp(d.logD - maxLog), 0, 1);
	      ctx.fillStyle = `rgba(107,69,146,${0.08 + 0.72 * Math.sqrt(heat)})`;
	      ctx.beginPath(); ctx.arc(pt.x, pt.y, 4, 0, 2 * Math.PI); ctx.fill();
	    }
	    ctx.strokeStyle = C.axis; ctx.lineWidth = 1.4;
	    ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.lineTo(Cc.x, Cc.y); ctx.closePath(); ctx.stroke();
	    const mean = toXY(probs[0], probs[1], probs[2]);
	    ctx.fillStyle = C.red; ctx.beginPath(); ctx.arc(mean.x, mean.y, 5, 0, 2 * Math.PI); ctx.fill();
	    label(ctx, "A", A.x, A.y - 10);
	    label(ctx, "B", B.x - 8, B.y + 12, "right");
	    label(ctx, "C", Cc.x + 8, Cc.y + 12, "left");
	    return `posterior mean probabilities: ${probs.map(v => v.toFixed(2)).join(", ")}`;
	  },
	  "pareto-tail": (ctx, w, h, p) => {
	    const alpha = +p.alpha, loglog = p.scale !== "linear";
	    clear(ctx, w, h);
	    if (loglog) {
	      const s = logScales(w, h, 1, 40, 1e-7, 1);
	      axes(ctx, s, [1, 10, 40]);
	      [1, 1e-2, 1e-4, 1e-6].forEach(t => label(ctx, t === 1 ? "1" : `1e${Math.round(Math.log10(t))}`, s.pad.l - 5, s.y(t), "right"));
	      const gaussianTail = x => Math.max(1e-12, 2 * (1 - normalCdf(x / 2)));
	      line(ctx, s, curve(x => x ** -alpha, 1, 40), C.red);
	      line(ctx, s, curve(x => Math.exp(-x / 4), 1, 40), C.blue, [4, 4]);
	      line(ctx, s, curve(gaussianTail, 1, 40), C.green, [2, 3]);
	      label(ctx, "Pareto", s.x(8), s.y(8 ** -alpha), "left", "bottom", C.red);
	      label(ctx, "Exponential", s.x(14), s.y(Math.exp(-14 / 4)), "left", "bottom", C.blue);
	      label(ctx, "Gaussian", s.x(5), s.y(gaussianTail(5)), "left", "top", C.green);
	    } else {
	      const curves = [
	        { fn: x => alpha * x ** (-(alpha + 1)), c: C.red },
	        { fn: x => 0.25 * Math.exp(-x / 4), c: C.blue, dash: [4, 4] },
	        { fn: x => normalPdf(x, 4, 1), c: C.green, dash: [2, 3] },
	      ];
	      const ymax = Math.max(...curves.flatMap(c => curve(c.fn, 1, 20).map(d => d.y))) * 1.1;
	      const s = scales(w, h, 1, 20, ymax);
	      axes(ctx, s, [1, 5, 10, 20]);
	      curves.forEach(c => line(ctx, s, curve(c.fn, 1, 20), c.c, c.dash || []));
	    }
    const moments = alpha <= 1 ? "no mean" : alpha <= 2 ? "mean finite, variance infinite" : "mean and variance finite";
    return `Pareto alpha=${alpha.toFixed(2)}: ${moments}`;
  },
};

function continuous(ctx, w, h, xMin, xMax, fn, color, text) {
  const pts = curve(fn, xMin + 1e-4, xMax);
  const s = scales(w, h, xMin, xMax, Math.max(...pts.map(p => p.y)) * 1.15);
  clear(ctx, w, h); axes(ctx, s, [xMin, Math.round((xMin + xMax) / 2), xMax]); line(ctx, s, pts, color);
  return text;
}
function priorPosterior(ctx, w, h, xMin, xMax, prior, posterior, text) {
  const a = curve(prior, xMin + 1e-4, xMax - 1e-4), b = curve(posterior, xMin + 1e-4, xMax - 1e-4);
  const s = scales(w, h, xMin, xMax, Math.max(...a.map(p => p.y), ...b.map(p => p.y)) * 1.15);
  clear(ctx, w, h); axes(ctx, s, [xMin, +((xMin + xMax) / 2).toFixed(1), xMax]); line(ctx, s, a, C.gray, [4, 4]); line(ctx, s, b, C.red);
  return text;
}
function hist(samples, xMin, xMax, bins) {
  const counts = new Array(bins).fill(0), dx = (xMax - xMin) / bins;
  for (const x of samples) {
    const i = Math.floor((x - xMin) / dx);
    if (i >= 0 && i < bins) counts[i]++;
  }
  const n = samples.length;
  return counts.map((c, i) => ({ x0: xMin + i * dx, x1: xMin + (i + 1) * dx, x: xMin + (i + 0.5) * dx, y: c / (n * dx) }));
}
function drawHist(ctx, s, bins, color) {
  ctx.fillStyle = color;
  for (const b of bins) {
    ctx.fillRect(s.x(b.x0), s.y(b.y), Math.max(1, s.x(b.x1) - s.x(b.x0) - 1), s.y(0) - s.y(b.y));
  }
}

function cardParams(card) {
  const params = {};
  card.querySelectorAll("[data-param]").forEach(input => {
    params[input.dataset.param] = input.value;
    const valueEl = input.closest(".control")?.querySelector(".v");
    if (valueEl) valueEl.textContent = input.tagName === "SELECT" ? input.options[input.selectedIndex].text : input.value;
  });
  return params;
}
function renderCard(card) {
  const canvas = card.querySelector("canvas");
  const readout = card.querySelector(".readout");
  const fn = renderers[card.dataset.viz];
  if (!canvas || !fn) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const msg = fn(ctx, w, h, cardParams(card));
  if (readout) readout.textContent = msg;
}
document.querySelectorAll(".viz-card").forEach(card => {
  card.querySelectorAll("[data-param]").forEach(input => {
    input.addEventListener("input", () => renderCard(card));
    input.addEventListener("change", () => renderCard(card));
  });
  renderCard(card);
});

// ─────────── Galton board: animated CLT path counts ───────────
(function galtonBoard() {
  const canvas = document.getElementById("galton-board");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const levelsIn = document.getElementById("galton-levels");
  const ballsIn = document.getElementById("galton-balls");
  const levelsV = document.getElementById("galton-levels-v");
  const ballsV = document.getElementById("galton-balls-v");
  const readout = document.getElementById("galton-readout");
  let seed = 31;
  function random() {
    seed = (1664525 * seed + 1013904223) | 0;
    return (seed >>> 0) / 4294967296;
  }
  function draw() {
    const rows = +levelsIn.value;
    const balls = +ballsIn.value;
    levelsV.textContent = String(rows);
    ballsV.textContent = String(balls);
    const counts = Array(rows + 1).fill(0);
    const animated = [];
    for (let b = 0; b < balls; b++) {
      let k = 0;
      const choices = [];
      for (let r = 0; r < rows; r++) {
        const right = random() < 0.5;
        if (right) k++;
        choices.push(k);
      }
      counts[k]++;
      if (b < 80) animated.push(choices);
    }
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
    const topY = 30, boardH = 230, cx = w * 0.5, dx = Math.min(34, 520 / rows), dy = boardH / rows;
    ctx.fillStyle = C.gray;
    for (let r = 0; r < rows; r++) {
      for (let k = 0; k <= r; k++) {
        const x = cx + (k - r / 2) * dx;
        const y = topY + r * dy;
        ctx.beginPath(); ctx.arc(x, y, 3, 0, 2 * Math.PI); ctx.fill();
      }
    }
    animated.forEach((path, i) => {
      let kPrev = 0;
      ctx.strokeStyle = `rgba(31,74,140,${0.08 + 0.22 * (1 - i / animated.length)})`;
      ctx.beginPath();
      ctx.moveTo(cx, topY - 14);
      path.forEach((k, r) => {
        const x = cx + (k - (r + 1) / 2) * dx;
        const y = topY + (r + 1) * dy;
        ctx.lineTo(x, y);
        kPrev = k;
      });
      ctx.stroke();
      const x = cx + (kPrev - rows / 2) * dx;
      ctx.fillStyle = "rgba(31,74,140,0.42)";
      ctx.beginPath(); ctx.arc(x, topY + rows * dy, 2.4, 0, 2 * Math.PI); ctx.fill();
    });
    const histX = 70, histY = 300, histW = w - 140, histH = 82;
    const maxCount = Math.max(...counts, 1);
    counts.forEach((c, k) => {
      const x = histX + k / (rows + 1) * histW;
      const bw = histW / (rows + 1) - 2;
      const bh = c / maxCount * histH;
      ctx.fillStyle = "rgba(45,122,62,0.55)";
      ctx.fillRect(x, histY + histH - bh, bw, bh);
    });
    const mean = rows / 2, sd = Math.sqrt(rows / 4);
    const maxPdf = normalPdf(mean, mean, sd);
    ctx.strokeStyle = C.red; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i <= 240; i++) {
      const xVal = i / 240 * rows;
      const x = histX + xVal / (rows + 1) * histW;
      const y = histY + histH - normalPdf(xVal, mean, sd) / maxPdf * histH;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    const empiricalMean = counts.reduce((s, c, k) => s + c * k, 0) / balls;
    readout.innerHTML =
      `<div class="row"><span class="lbl">empirical mean</span><span>${empiricalMean.toFixed(2)} successes vs theoretical ${mean.toFixed(2)}</span></div>` +
      `<div class="row"><span class="lbl">limit picture</span><span>many left/right paths accumulate into a binomial histogram with a normal envelope</span></div>`;
  }
  [levelsIn, ballsIn].forEach((input) => input.addEventListener("input", draw));
  document.getElementById("galton-drop").addEventListener("click", () => { seed += 101; draw(); });
  draw();
})();
window.addEventListener("resize", () => {
  document.querySelectorAll(".viz-card").forEach(renderCard);
});

(function familyMap() {
  const canvas = document.getElementById("family-map");
  if (!canvas) return;
  const readout = document.getElementById("family-readout");
  const intrinsic = { w: 840, h: 510 };
  type NodeKind = "1d" | "multi";
  type Support = "discrete" | "continuous";
  // Bounds of the support set, encoded by pill shape:
  //   - bounded: both ends square (interval / finite set)
  //   - half-bounded: left square (bounded below), right round (unbounded above)
  //   - unbounded: both ends round (capsule)
  type Bounds = "bounded" | "half-bounded" | "unbounded";
  const baseNodes = ([
    ["Beta", "beta-binomial", 95, 55, "1d", "continuous", "bounded", "Distribution on [0,1]; conjugate prior for a Bernoulli/binomial probability."],
    ["Dirichlet", "dirichlet-multinomial", 245, 55, "multi", "continuous", "bounded", "Distribution on the K-simplex; multivariate generalization of Beta; conjugate prior for categorical / multinomial probabilities."],
    ["Gamma", "gamma-poisson", 385, 55, "1d", "continuous", "half-bounded", "Positive-support distribution; sum of exponentials; conjugate prior for a Poisson rate."],
    ["Bernoulli", "bernoulli-binomial", 95, 155, "1d", "discrete", "bounded", "Single yes/no trial with success probability p."],
    ["Binomial", "bernoulli-binomial", 245, 155, "1d", "discrete", "bounded", "Number of successes in n independent Bernoulli trials."],
    ["Poisson", "poisson", 385, 155, "1d", "discrete", "half-bounded", "Count of rare independent events at rate λ; limit of binomial as n→∞, np→λ."],
    ["Categorical", "categorical-multinomial", 95, 245, "multi", "discrete", "bounded", "Single draw over K outcomes with probability vector p; K-dimensional generalization of Bernoulli."],
    ["Multinomial", "categorical-multinomial", 245, 245, "multi", "discrete", "bounded", "Vector of category counts after n categorical draws; K-dimensional generalization of binomial."],
    ["Geometric", "geometric", 95, 335, "1d", "discrete", "half-bounded", "Number of trials until the first Bernoulli success; discrete memoryless waiting time."],
    ["NegBin", "negative-binomial", 245, 335, "1d", "discrete", "half-bounded", "Trials until r successes; overdispersed count when Poisson variance is too small."],
    ["Uniform", "uniform", 540, 55, "1d", "continuous", "bounded", "Flat density on [a,b]; the source law for inverse-CDF sampling."],
    ["Cauchy", "cauchy", 720, 95, "1d", "continuous", "unbounded", "Ratio of two standard normals; heavy-tailed; mean and variance undefined."],
    ["Exponential", "exponential", 560, 205, "1d", "continuous", "half-bounded", "Continuous memoryless waiting time at rate λ; Gamma with shape 1."],
    ["Gaussian", "gaussian", 710, 205, "1d", "continuous", "unbounded", "Bell curve; closed under independent sums; the CLT limit for finite-variance sums."],
    ["Laplace", "laplace", 455, 275, "1d", "continuous", "unbounded", "Double exponential: symmetric, sharp peak at the mean, exponential tails; the L1 / lasso noise model."],
    ["Inv-χ²", "inverse-chi-square", 475, 350, "1d", "continuous", "half-bounded", "Reciprocal of a chi-squared variable; scaled version is the conjugate prior for normal variance."],
    ["Chi²", "chi-square", 605, 350, "1d", "continuous", "half-bounded", "Sum of k squared standard normals; equivalently Gamma with shape k/2, rate 1/2."],
    ["Student t", "student-t", 740, 350, "1d", "continuous", "unbounded", "Normal divided by estimated scale √(χ²/ν); heavy-tailed; approaches Gaussian as ν → ∞."],
    ["F", "f-distribution", 670, 450, "1d", "continuous", "half-bounded", "Ratio of two scaled independent chi-squareds; the ANOVA variance-ratio sampling law."],
  ] as [string, string, number, number, NodeKind, Support, Bounds, string][]).map(([name, id, x, y, kind, support, bounds, summary]) => ({ name, id, x, y, kind, support, bounds, summary }));
  type EdgeKind = "op" | "prior" | "case" | "limit";
  // Optional 6th element: true => bidirectional (two arrowheads), e.g. an involutive transform like 1/X.
  const edges: [string, string, string, EdgeKind, string?, boolean?][] = [
    // Discrete sums and generalizations
    ["Bernoulli", "Binomial", "sum", "op", "Sum of n iid Bernoulli(p) trials is Binomial(n, p)."],
    ["Bernoulli", "Categorical", "K categories", "op", "Categorical(p₁,…,p_K) generalizes Bernoulli from 2 outcomes to K."],
    ["Binomial", "Multinomial", "K categories", "op", "Multinomial counts across K categories generalize Binomial from 2 to K."],
    ["Categorical", "Multinomial", "sum", "op", "Sum of n iid Categorical(p) draws is Multinomial(n, p)."],
    ["Geometric", "NegBin", "sum of waits", "op", "NegBin(r, p) is the sum of r iid Geometric(p) waiting times."],
    ["Uniform", "Exponential", "F⁻¹(U)", "op", "Inverse-CDF sampling: −ln(U)/λ with U ~ Uniform(0,1) gives Exp(λ)."],
    ["Poisson", "Exponential", "waits between", "op", "Inter-arrival times of a rate-λ Poisson process are Exp(λ); equivalently, the count of Exp(λ) events in time t is Poisson(λt)."],
    ["Exponential", "Laplace", "difference of two", "op", "If E₁, E₂ are independent Exp(1/b), then E₁ − E₂ ~ Laplace(0, b). That is why Laplace is called the double exponential."],
    // Conjugate priors
    ["Beta", "Bernoulli", "prior for", "prior", "Beta(α, β) is the conjugate prior for the Bernoulli/Binomial success probability p — same prior for the primitive single-trial form and the n-trial aggregate."],
    ["Dirichlet", "Categorical", "prior for", "prior", "Dirichlet(α) is the conjugate prior for Categorical/Multinomial probabilities."],
    ["Gamma", "Poisson", "prior for", "prior", "Gamma(α, β) is the conjugate prior for the Poisson rate λ."],
    ["Inv-χ²", "Gaussian", "prior for σ²", "prior", "Scaled inverse chi-squared is the conjugate prior for Gaussian variance σ²."],
    // Special cases
    ["Dirichlet", "Beta", "K=2", "case", "Beta is the K=2 special case of Dirichlet."],
    ["Gamma", "Exponential", "shape = 1", "case", "Exponential(λ) = Gamma(shape=1, rate=λ)."],
    ["Gamma", "Chi²", "shape = k/2", "case", "χ²(k) is the special case Gamma(shape=k/2, rate=1/2)."],
    // Limits
    ["Binomial", "Poisson", "rare limit", "limit", "Binomial(n, λ/n) → Poisson(λ) as n → ∞: many trials, vanishing per-trial probability, np = λ held fixed."],
    ["Student t", "Gaussian", "ν → ∞", "limit", "Student t with ν degrees of freedom approaches Gaussian as ν → ∞."],
    // Gaussian-family transforms
    ["Gaussian", "Chi²", "square and sum", "op", "Sum of k squared independent standard normals is χ²(k)."],
    ["Gaussian", "Cauchy", "ratio of", "op", "Ratio of two independent standard normals is Standard Cauchy."],
    ["Chi²", "Inv-χ²", "1/X", "op", "If X ~ χ²(ν) then 1/X ~ Inv-χ²(ν), and vice versa — the transform is its own inverse.", true],
    ["Chi²", "Student t", "scale estimate", "op", "Student t(ν) = Z / √(χ²(ν)/ν): a standard normal divided by an estimated scale."],
    ["Chi²", "F", "ratio of", "op", "F(d₁, d₂) is the ratio of two independent χ²s, each divided by its degrees of freedom."],
    ["Gaussian", "Student t", "normal / scale", "op", "Student t(ν) is a standard normal divided by √(χ²(ν)/ν)."],
  ];
  const filterState: { mode: "all" | EdgeKind } = { mode: "all" };

  let nodes: any[] = [];
  const edgeHits: { x: number; y: number; halfW: number; halfH: number; label: string; tip: string; a: string; b: string }[] = [];
  // Per-corner-radius rectangle. Corner order: top-left, top-right, bottom-right, bottom-left.
  function pillPath(ctx, x, y, w, h, rTL, rTR, rBR, rBL) {
    ctx.beginPath();
    ctx.moveTo(x + rTL, y);
    ctx.lineTo(x + w - rTR, y);
    if (rTR > 0) ctx.arcTo(x + w, y, x + w, y + rTR, rTR);
    ctx.lineTo(x + w, y + h - rBR);
    if (rBR > 0) ctx.arcTo(x + w, y + h, x + w - rBR, y + h, rBR);
    ctx.lineTo(x + rBL, y + h);
    if (rBL > 0) ctx.arcTo(x, y + h, x, y + h - rBL, rBL);
    ctx.lineTo(x, y + rTL);
    if (rTL > 0) ctx.arcTo(x, y, x + rTL, y, rTL);
    ctx.closePath();
  }
  function cornerRadii(bounds: Bounds, halfH: number): [number, number, number, number] {
    const cap = halfH; // full capsule radius
    const square = Math.max(2, halfH * 0.18); // small "square" softening so corners don't look harsh
    if (bounds === "bounded") return [square, square, square, square];
    if (bounds === "unbounded") return [cap, cap, cap, cap];
    // half-bounded: bounded below (left = square), unbounded above (right = round)
    return [square, cap, cap, square];
  }
  // Intersection of a ray from node center with the pill's axis-aligned bbox.
  // Close enough to the stadium edge for our visual purposes.
  function pillBboxExit(node, ux, uy) {
    const tX = ux === 0 ? Infinity : node.hw / Math.abs(ux);
    const tY = uy === 0 ? Infinity : node.hh / Math.abs(uy);
    const t = Math.min(tX, tY);
    return { x: node.px + ux * t, y: node.py + uy * t };
  }
  function draw() {
    const { ctx, w, h } = setupCanvas(canvas);
    const sx = w / intrinsic.w, sy = h / intrinsic.h;
    const fontScale = Math.min(sx, sy);
    const pillFontSize = Math.max(12, 14 * fontScale);
    const pillFont = `600 ${pillFontSize.toFixed(1)}px -apple-system, sans-serif`;
    ctx.font = pillFont;
    nodes = baseNodes.map(n => {
      const textW = ctx.measureText(n.name).width;
      const pillW = Math.max(textW + 24 * fontScale, 70 * fontScale);
      const pillH = 30 * fontScale;
      return { ...n, px: n.x * sx, py: n.y * sy, hw: pillW / 2, hh: pillH / 2 };
    });
    const byName = Object.fromEntries(nodes.map(n => [n.name, n]));
    clear(ctx, w, h);

    const visibleEdges = edges.filter(([, , , k]) => filterState.mode === "all" || k === filterState.mode);
    // When filtering, dim nodes not touched by any visible edge.
    const activeNames: Set<string> | null = filterState.mode === "all"
      ? null
      : new Set(visibleEdges.flatMap(([a, b]) => [a, b]));
    const isActive = (n) => activeNames === null || activeNames.has(n.name);

    const labelHalfH = Math.max(8, 9 * fontScale);
    const ts = [0.5, 0.42, 0.58, 0.35, 0.65, 0.28, 0.72, 0.22, 0.78];
    const offsets = [0, -10, 10, -18, 18, -28, 28, -40, 40, -55, 55, -72, 72, -92, 92].map(o => o * fontScale);
    edgeHits.length = 0;
    const labelPad = 10 * fontScale;
    const placedLabels: { x: number; y: number; halfW: number; halfH: number }[] = [];
    function rectClearOfNodes(px, py, halfW, halfH) {
      for (const n of nodes) {
        const dx = Math.max(Math.abs(n.px - px) - halfW - n.hw, 0);
        const dy = Math.max(Math.abs(n.py - py) - halfH - n.hh, 0);
        if (dx * dx + dy * dy < labelPad * labelPad) return false;
      }
      for (const l of placedLabels) {
        if (Math.abs(l.x - px) < l.halfW + halfW + 4 && Math.abs(l.y - py) < l.halfH + halfH + 3) return false;
      }
      return true;
    }
    const edgeStyle: Record<EdgeKind, { stroke: string; labelColor: string; dash: number[]; width: number }> = {
      op:    { stroke: "rgba(31,74,140,0.42)",  labelColor: C.textDim, dash: [],     width: 1.4 },
      prior: { stroke: "rgba(212,105,10,0.62)", labelColor: C.orange,  dash: [5, 4], width: 1.6 },
      case:  { stroke: "rgba(45,122,62,0.60)",  labelColor: C.green,   dash: [2, 3], width: 1.4 },
      limit: { stroke: "rgba(107,69,146,0.60)", labelColor: C.purple,  dash: [6, 3, 2, 3], width: 1.6 },
    };
    // Detect parallel multi-edges (same node pair, different kinds) so we can offset them slightly.
    const pairCounts = new Map<string, number>();
    const pairKey = (a: string, b: string) => [a, b].sort().join("|");
    const pairIndex = new Map<string, number>();
    for (const [a, b] of visibleEdges) {
      const k = pairKey(a, b);
      const cur = pairCounts.get(k) ?? 0;
      pairCounts.set(k, cur + 1);
    }
    ctx.font = `${Math.max(11, 12.5 * fontScale).toFixed(1)}px -apple-system, sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    for (const [a, b, edgeLabel, kind, edgeTip, bidir] of visibleEdges) {
      const A = byName[a], B = byName[b];
      const style = edgeStyle[kind];
      ctx.strokeStyle = style.stroke;
      ctx.lineWidth = style.width;
      ctx.setLineDash(style.dash);
      const dx0 = B.px - A.px, dy0 = B.py - A.py;
      const len0 = Math.max(1, Math.hypot(dx0, dy0));
      const ux = dx0 / len0, uy = dy0 / len0;
      const nx = -uy, ny = ux;
      // Multi-edge offset: shift parallel edges apart so labels don't pile up.
      const k = pairKey(a, b);
      const total = pairCounts.get(k) ?? 1;
      const idx = pairIndex.get(k) ?? 0;
      pairIndex.set(k, idx + 1);
      const offsetMag = total > 1 ? (idx - (total - 1) / 2) * 6 * fontScale : 0;
      const aShift = { x: A.px + nx * offsetMag, y: A.py + ny * offsetMag };
      const bShift = { x: B.px + nx * offsetMag, y: B.py + ny * offsetMag };
      const startA = pillBboxExit(A, ux, uy);
      const endB   = pillBboxExit(B, -ux, -uy);
      const headLen = 9 * fontScale;
      const headHalfW = 4.2 * fontScale;
      const startTipX = startA.x + nx * offsetMag;
      const startTipY = startA.y + ny * offsetMag;
      const endTipX = endB.x + nx * offsetMag;
      const endTipY = endB.y + ny * offsetMag;
      // End the line just before each arrowhead tip so dashes don't bleed into the head.
      const lineStartX = bidir ? startTipX + ux * headLen * 0.85 : startTipX;
      const lineStartY = bidir ? startTipY + uy * headLen * 0.85 : startTipY;
      const lineEndX = endTipX - ux * headLen * 0.85;
      const lineEndY = endTipY - uy * headLen * 0.85;
      ctx.beginPath();
      ctx.moveTo(lineStartX, lineStartY);
      ctx.lineTo(lineEndX, lineEndY);
      ctx.stroke();
      ctx.setLineDash([]);
      // Solid arrowhead at the destination, matching the edge color.
      ctx.fillStyle = style.stroke;
      ctx.beginPath();
      ctx.moveTo(endTipX, endTipY);
      ctx.lineTo(endTipX - ux * headLen + nx * headHalfW, endTipY - uy * headLen + ny * headHalfW);
      ctx.lineTo(endTipX - ux * headLen - nx * headHalfW, endTipY - uy * headLen - ny * headHalfW);
      ctx.closePath();
      ctx.fill();
      if (bidir) {
        // Mirror arrowhead at the source end.
        ctx.beginPath();
        ctx.moveTo(startTipX, startTipY);
        ctx.lineTo(startTipX + ux * headLen + nx * headHalfW, startTipY + uy * headLen + ny * headHalfW);
        ctx.lineTo(startTipX + ux * headLen - nx * headHalfW, startTipY + uy * headLen - ny * headHalfW);
        ctx.closePath();
        ctx.fill();
      }
      const textW = ctx.measureText(edgeLabel).width;
      const labelW = textW + 8;
      const labelHalfW = labelW / 2;
      let chosen: { px: number; py: number } | null = null;
      for (const t of ts) {
        const bx = aShift.x + (bShift.x - aShift.x) * t;
        const by = aShift.y + (bShift.y - aShift.y) * t;
        for (const offset of offsets) {
          const px = bx + nx * offset;
          const py = by + ny * offset;
          const inBounds = px - labelHalfW > 4 && px + labelHalfW < w - 4 && py - labelHalfH > 4 && py + labelHalfH < h - 4;
          if (inBounds && rectClearOfNodes(px, py, labelHalfW, labelHalfH)) { chosen = { px, py }; break; }
        }
        if (chosen) break;
      }
      const { px: mx, py: my } = chosen ?? { px: (aShift.x + bShift.x) / 2, py: (aShift.y + bShift.y) / 2 };
      ctx.fillStyle = "rgba(255,255,255,0.92)"; ctx.fillRect(mx - labelHalfW, my - labelHalfH, labelW, labelHalfH * 2);
      ctx.fillStyle = style.labelColor; ctx.fillText(edgeLabel, mx, my);
      placedLabels.push({ x: mx, y: my, halfW: labelHalfW, halfH: labelHalfH });
      edgeHits.push({ x: mx, y: my, halfW: labelHalfW, halfH: labelHalfH, label: edgeLabel, tip: edgeTip ?? edgeLabel, a, b });
    }
    // Nodes as pills. Fill encodes support type (warm = discrete, cool = continuous);
    // italic text marks multivariate distributions.
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    for (const n of nodes) {
      const active = isActive(n);
      const alpha = active ? 1 : 0.22;
      const fill = n.support === "discrete"
        ? `rgba(212,105,10,${0.12 * alpha})`
        : `rgba(31,74,140,${0.10 * alpha})`;
      const border = n.support === "discrete"
        ? `rgba(212,105,10,${0.5 * alpha})`
        : `rgba(31,74,140,${0.5 * alpha})`;
      const radii = cornerRadii(n.bounds, n.hh);
      pillPath(ctx, n.px - n.hw, n.py - n.hh, n.hw * 2, n.hh * 2, radii[0], radii[1], radii[2], radii[3]);
      ctx.fillStyle = fill; ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = border;
      ctx.stroke();
      ctx.fillStyle = `rgba(31,39,51,${active ? 1 : 0.35})`;
      ctx.font = n.kind === "multi"
        ? `italic 600 ${pillFontSize.toFixed(1)}px -apple-system, sans-serif`
        : pillFont;
      ctx.fillText(n.name, n.px, n.py);
    }
  }
  draw();
  document.querySelectorAll(".family-filter").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".family-filter").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      filterState.mode = (btn as HTMLElement).dataset.filter as any;
      draw();
    });
  });
  function hitTest(event): { type: "node"; node: any } | { type: "edge"; edge: typeof edgeHits[number] } | null {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    for (const e of edgeHits) {
      if (Math.abs(e.x - x) <= e.halfW + 3 && Math.abs(e.y - y) <= e.halfH + 4) return { type: "edge", edge: e };
    }
    const node = nodes.find(n => Math.abs(n.px - x) <= n.hw + 2 && Math.abs(n.py - y) <= n.hh + 2);
    return node ? { type: "node", node } : null;
  }
  const defaultReadout = readout.textContent ?? "";
  canvas.addEventListener("mousemove", event => {
    const hit = hitTest(event);
    if (hit?.type === "node") {
      canvas.style.cursor = "pointer";
      canvas.title = `${hit.node.name} — ${hit.node.summary}`;
      readout.textContent = `${hit.node.name} — ${hit.node.summary}`;
    } else if (hit?.type === "edge") {
      canvas.style.cursor = "help";
      const e = hit.edge;
      canvas.title = `${e.a} → ${e.b}: ${e.tip}`;
      readout.textContent = `${e.a} → ${e.b}: ${e.tip}`;
    } else {
      canvas.style.cursor = "default";
      canvas.title = "";
      readout.textContent = defaultReadout;
    }
  });
  canvas.addEventListener("mouseleave", () => {
    canvas.title = "";
    readout.textContent = defaultReadout;
  });
  canvas.addEventListener("click", event => {
    const hit = hitTest(event);
    if (hit?.type !== "node") return;
    document.getElementById(hit.node.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  window.addEventListener("resize", draw);
})();
