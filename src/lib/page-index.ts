// Single source of truth for the curated math-notes directory shown on the
// /math/ index page. Layouts also consult this to look up a page's description
// for `<meta name="description">` / Open Graph tags via `descriptionForPath`.
//
// Ported from viz.osteele.com (where these pages originated as interactive
// visualizations). On notes.osteele.com the same pages are treated as study
// notes that happen to be interactive; they live under /math/<slug>/.

export interface SectionItem {
  href: string;
  title: string;
  desc: string;
  badge?: string;
}

export interface Section {
  id: string;
  title: string;
  description: string;
  caveat?: string;
  attribution?: string;
  accent: string;
  tint: string;
  glyph: string;
  items: SectionItem[];
}

const caveatBase = "These pages aren't a complete or standard treatment of the subject. Each sits at the intersection of a topic from coursework, a topic I wanted to study more closely, and a topic I thought an interactive figure could make more accessible.";
const caveatMeasure = "Some also take a more measure-theoretic angle than the course, or than a typical introduction.";
const caveatWip = "All are works in progress — not externally reviewed, and in places I haven't finished checking the implementation against the math.";
export const courseCaveat = `${caveatBase} ${caveatWip}`;
export const courseCaveatMeasure = `${caveatBase} ${caveatMeasure} ${caveatWip}`;
export const selfStudyCaveat = "Unlike the coursework sections, these pages aren't tied to a class — they're topics I studied on my own. Like everything here, they're works in progress, not externally reviewed.";

export const sections: Section[] = [
  {
    id: "probability-and-statistics",
    title: "Probability & Statistics",
    description: "Foundations, estimation, and dependence. Visualizations I built while working these out for myself.",
    caveat: courseCaveat,
    accent: "#0d9488",
    tint: "#ccfbf1",
    glyph: "∑",
    items: [
      { href: "/math/measure-theory/", title: "Measure Theory & Random Variables", desc: "Measurable spaces, probability measures, pushforward measures, densities, and importance sampling" },
      { href: "/math/notation/", title: "Notation: density form vs. measure-theoretic form", desc: "A bilingual dictionary for the two ways probability is written on this site, plus the four places where the choice of language actually matters" },
      { href: "/math/named-distributions/", title: "Named Distributions", desc: "How Bernoulli, Poisson, Gaussian, Cauchy, chi-square, t, F, conjugate priors, and heavy-tail laws are related" },
      { href: "/math/modes-of-convergence/", title: "Modes of Convergence", desc: "Almost sure, in probability, in distribution, in L^p — the implication lattice, counterexamples as sample paths, Markov/Chebyshev/Chernoff bounds, and MCT/DCT/Fatou" },
      { href: "/math/calculus-of-variations/", title: "Calculus of Variations", desc: "First variations, Euler-Lagrange residuals, curve relaxation, and the brachistochrone race" },
      { href: "/math/sufficient-statistics/", title: "Sufficient Statistics", desc: "Fisher–Neyman factorization, the fiber picture, Rao–Blackwell variance collapse, and a categorical diagram showing factorization, variance, and Fisher info as one commuting square" },
      { href: "/math/exponential-family/", title: "The Exponential Family", desc: "The canonical form, naming and the statistical-physics log-partition story, derivatives of A giving the moments of T(X), canonical links (logit, log) behind GLMs, and an interactive picker stepping through six standard members" },
      { href: "/math/fisher-information/", title: "Fisher Information", desc: "Likelihood geometry, score functions, Fisher information, exponential families, log-partition, Jeffreys and max-entropy priors, and Bayesian updates" },
      { href: "/math/hypothesis-testing/", title: "Hypothesis Testing", desc: "Type-I error, type-II error, power, and decision thresholds through the classic overlapping-distributions diagram" },
      { href: "/math/distance-correlation/", title: "Distance Correlation", desc: "Distance-based dependence tests, partial distance correlation, and cases Pearson r misses", badge: "Paper notes" },
    ],
  },
  {
    id: "information-theory",
    title: "Information Theory",
    description: "Surprise, divergence, and the geometry of distributions. Visualizations I built while working these out for myself.",
    caveat: selfStudyCaveat,
    accent: "#b45309",
    tint: "#fef3c7",
    glyph: "H",
    items: [
      { href: "/math/entropy-mutual-information/", title: "Entropy & Mutual Information", desc: "Average surprise, conditional entropy, shared information, binary distributions, and noisy channels" },
      { href: "/math/kl-divergence/", title: "KL Divergence", desc: "Directed distribution mismatch, support errors, and the difference between forward and reverse KL" },
      { href: "/math/optimal-transport/", title: "Optimal Transport", desc: "Wasserstein distance and the transport plan: Sinkhorn iteration, and why OT gives gradients where KL divergence does not" },
      { href: "/math/information-geometry/", title: "Information Geometry", desc: "Probability distributions as a manifold: the probability simplex, Fisher-Rao geodesics, dual flatness, and e- vs m-projections" },
    ],
  },
  {
    id: "random-processes",
    title: "Random Processes",
    description: "Stochastic processes in time, frequency, and function space. Visualizations I built while working these out for myself.",
    attribution: "Topics guided by (but not strictly following) Prof. Ercan Kuruoğlu's Fall 2025 Random Processes course at Tsinghua SIGS.",
    caveat: courseCaveat,
    accent: "#7c3aed",
    tint: "#ede9fe",
    glyph: "∿",
    items: [
      { href: "/math/poisson-processes/", title: "Poisson Processes", desc: "Rare events in time: exponential waits, Poisson counts, equivalent definitions, thinning, splitting, and process diagnostics" },
      { href: "/math/markov-chains/", title: "Markov Chains", desc: "Discrete-time and continuous-time chains, stationary distributions, mixing, recurrence, periodicity, and CTMC rates" },
      { href: "/math/lti-random-inputs/", title: "LTI Systems on Random Inputs", desc: "Convolution, correlation propagation, spectra, AR(1) as a leaky integrator, and stationarity through linear filters" },
      { href: "/math/psd-wiener-khinchin/", title: "Power Spectral Density", desc: "Autocorrelation, spectra, LTI shaping, and periodograms for stationary random processes" },
      { href: "/math/gaussian-processes/", title: "Gaussian Processes for Regression", desc: "Priors over functions, kernels, posterior conditioning, marginal likelihood, 2-D regression, and acquisition" },
    ],
  },
  {
    id: "bayesian-inference",
    title: "Bayesian Inference",
    description: "Approximating intractable posteriors by sampling and by optimization. Visualizations I built while working these out for myself.",
    attribution: "Material draws on Prof. Ercan Kuruoğlu's Spring 2026 Bayesian Inference and Monte Carlo Simulation course at Tsinghua SIGS.",
    caveat: courseCaveatMeasure,
    accent: "#0284c7",
    tint: "#e0f2fe",
    glyph: "ϕ",
    items: [
      { href: "/math/choosing-a-prior/", title: "Choosing a Prior", desc: "Principles of prior selection: use real prior information when you have it; otherwise group invariance, max entropy, or Jeffreys — and how the three routes disagree near boundaries" },
      { href: "/math/conjugate-priors/", title: "Conjugate Priors & the Exponential Family", desc: "Why some prior–likelihood pairs update in closed form, hyperparameters as pseudo-counts, worked Beta/Normal/Gamma examples, and a table of standard pairs" },
      { href: "/math/posterior-summaries/", title: "Posterior Summaries & Bayes Risk", desc: "Squared, absolute, and zero-one loss pick out the posterior mean, median, and mode — three views of the same posterior, only one of which ignores everything but the peak" },
      { href: "/math/hierarchical-bayes/", title: "Hierarchical Bayes", desc: "Two-level Normal–Normal model, the posterior formula for borrowing strength across groups, empirical-Bayes fitting of the between-group variance, and the connection to ridge regression" },
      { href: "/math/bayesian-regression/", title: "Bayesian Regression: Penalties as Priors", desc: "OLS, ridge, LASSO, and best-subset selection as MAP under four noise/prior pairs — and why the shape of the prior near zero determines whether the estimator shrinks, selects, or both" },
      { href: "/math/bayesian-graphical-models/", title: "Bayesian Graphical Models", desc: "DAG factorization, d-separation, explaining away, Dirichlet-multinomial CPT learning, and structure scoring" },
      { href: "/math/hidden-markov-models/", title: "Hidden Markov Models", desc: "HMM sampling, forward-backward filtering and smoothing, log-domain messages, and Viterbi versus marginal MAP paths" },
      { href: "/math/monte-carlo/", title: "Monte Carlo & MCMC", desc: "Rejection, importance sampling, Metropolis-Hastings, Gibbs, RJMCMC, simulated annealing, and when to use each method on a static target" },
      { href: "/math/state-space-filtering/", title: "Kalman & Particle Filters", desc: "Sequential inference of a hidden state from noisy observations: Kalman filter for linear-Gaussian models, EKF/UKF for local linearization, particle filter for fully nonlinear non-Gaussian SSMs" },
      { href: "/math/variational-inference/", title: "Free Energy & Variational Inference", desc: "The free-energy/ELBO identity and how it turns posterior approximation into optimization" },
      { href: "/math/vb-gaussian-mixture/", title: "Variational Bayes for Gaussian Mixtures", desc: "CAVI for a 2-D Gaussian mixture with Normal–Wishart and Dirichlet priors, showing component ellipses, automatic pruning of unused components, and the ELBO trace" },
      { href: "/math/bayesian-neural-networks/", title: "Bayesian Neural Networks", desc: "Weight posteriors, predictive function ensembles, Laplace approximation, evidence, Occam's hill, and prior mismatch" },
    ],
  },
  {
    id: "machine-learning",
    title: "Machine Learning",
    description: "Language models, deep nets, and learned representations.",
    accent: "#059669",
    tint: "#d1fae5",
    glyph: "∇",
    items: [
      { href: "/math/attention/", title: "Attention", desc: "A weighted sum read as an adaptive sufficient statistic, Nadaraya–Watson kernel regression, and entropy-regularized retrieval" },
    ],
  },
];

// Normalize a path or href to a canonical form for lookup: strip query/hash,
// strip trailing slash (except root), and lowercase.
function canonical(p: string): string {
  const noQuery = p.split("?")[0].split("#")[0];
  const trimmed = noQuery.length > 1 ? noQuery.replace(/\/$/, "") : noQuery;
  return trimmed.toLowerCase();
}

const descriptionByPath = new Map<string, string>();
for (const section of sections) {
  for (const item of section.items) {
    if (item.href.startsWith("/")) {
      descriptionByPath.set(canonical(item.href), item.desc);
    }
  }
}

/**
 * Returns the curated one-line description for an internal page path, or
 * `undefined` if the path isn't listed in the index. Used by layouts to
 * populate `<meta name="description">` and Open Graph tags.
 */
export function descriptionForPath(pathname: string | undefined | null): string | undefined {
  if (!pathname) return undefined;
  return descriptionByPath.get(canonical(pathname));
}
