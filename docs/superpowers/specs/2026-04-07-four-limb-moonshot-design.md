# Four-Limb Evidence Synthesis — Moonshot Design Spec

> **Date:** 2026-04-07
> **Target:** Single-file interactive HTML app (~30K-50K lines JS)
> **Methods:** 40 across 5 build phases
> **Papers:** 15 E156 micro-papers
> **Delivery:** One limb at a time; each release pairs with its E156 papers

---

## 1. Architecture

### 1.1 Single-File HTML Structure

```
<html>
├── <head> — Meta, Open Graph, embedded CSS
├── <body>
│   ├── Header — Title, topic selector, data upload
│   ├── Tab bar — Limb 1 | Limb 2 | Limb 3 | Limb 4 | Integration
│   ├── Tab panels (one per limb, lazy-initialized)
│   │   ├── Method selector (toggles within the limb)
│   │   ├── Visualization area (canvas/SVG)
│   │   ├── Results table
│   │   └── Export controls
│   └── Footer — Citation, version, E156 paper links
├── <script> — Shared math library (MathCore)
├── <script> — Limb 1 module
├── <script> — Limb 2 module
├── <script> — Limb 3 module
├── <script> — Limb 4 module
└── <script> — Integration module
```

### 1.2 Module Pattern

Each limb is a self-contained IIFE exposing a single `LimbN` namespace:

```javascript
const Limb1 = (() => {
    // Private state and methods
    function init(container, data) { ... }
    function run(method, params) { ... }
    function getResults() { ... }
    // Public API
    return { init, run, getResults };
})();
```

Cross-limb communication goes through a central `Pipeline` object that calls `LimbN.getResults()` and passes outputs downstream. No limb directly imports from another.

### 1.3 Data Layer

**Pre-loaded datasets:**
- Colchicine/ACS (4 trials, rr/ci format)
- SGLT2/HF (4 trials, rr/ci format)
- Synthetic NMA (1,000-trial subsample of the 100K dataset, t1/t2/yi/vi format — embedded as JSON. Full 100K available via file upload)

**User upload:**
- Trial data: CSV with either `rr, ci_lower, ci_upper` or `yi, vi` columns (auto-detected)
- Context data: CSV with `region, year, population_millions, mi_prevalence_per_100k, health_exp_per_capita, age_65_plus_share, diabetes_prevalence, adoption_readiness, treatment_cost_usd`
- NMA data: CSV with `t1, t2, yi, vi` columns (triggers NMA methods)

Format validation on upload with clear error messages. Template downloads for each format.

### 1.4 Shared Math Library (MathCore)

All methods share a `MathCore` utility library providing:

- `MathCore.linalg` — Matrix operations: multiply, invert, eigendecompose, Cholesky, SVD
- `MathCore.stats` — Normal/t/chi2/F PDF/CDF/quantile, kernel density estimation
- `MathCore.optim` — Newton-Raphson, L-BFGS, golden section, grid search
- `MathCore.random` — Seeded xoshiro128** PRNG, LHS sampler, normal/uniform/gamma draws
- `MathCore.quad` — Numerical integration (Gauss-Legendre, adaptive Simpson)
- `MathCore.ode` — Euler, RK4, Euler-Maruyama (SDE)
- `MathCore.graph` — Adjacency matrix, Laplacian, shortest path, connected components
- `MathCore.tda` — Vietoris-Rips complex, persistent homology (incremental algorithm)
- `MathCore.gp` — Gaussian process regression (Cholesky-based, SE/Matern kernels)
- `MathCore.poly` — Hermite/Legendre orthogonal polynomial basis for PCE

Deterministic throughout: all randomness via seeded PRNG. No `Math.random()`.

---

## 2. Limb 1 — Trial Efficacy & Evidence Geometry

### 2.1 Methods

#### M1: REML Tau² Estimator
Iterative restricted maximum likelihood for between-study variance. Newton-Raphson on the REML log-likelihood:

```
l_REML(τ²) = -½ Σ log(vi + τ²) - ½ Σ (yi - μ̂)²/(vi + τ²) - ½ log(Σ 1/(vi + τ²))
```

Converge when |Δτ²| < 1e-8 or 100 iterations. Fall back to DerSimonian-Laird if non-convergence.

#### M2: Knapp-Hartung Adjustment
Replaces z-based CI with t-distribution on k-1 df. Variance correction factor:

```
q_KH = (1/(k-1)) Σ wi(yi - μ̂)² / Σ wi    where wi = 1/(vi + τ²)
```

CI: μ̂ ± t_{k-1, α/2} × √(q_KH / Σ wi)

#### M3: Prediction Intervals
For a future study from the same distribution:

```
PI: μ̂ ± t_{k-2, α/2} × √(τ² + SE²_μ)
```

Uses REML τ² from M1.

#### M4: Bayesian NMA via MCMC
Metropolis-within-Gibbs sampler for the consistency NMA model:

```
yi_jk ~ N(d_jk, vi_jk + τ²)
d_jk = d_0k - d_0j    (consistency)
d_0k ~ N(0, 10²)      (vague prior)
τ² ~ InvGamma(0.01, 0.01)
```

3 chains, 5000 warmup + 5000 samples each. Gelman-Rubin R̂ convergence diagnostic. Replaces the 50×50 grid approximation.

#### M5: Node-Splitting Inconsistency
For each comparison with both direct and indirect evidence, fit two models:

```
Consistency:  d_AB = d_AB (one parameter)
Inconsistency: d_AB^direct ≠ d_AB^indirect (two parameters)
```

Report the difference (d_direct - d_indirect) with 95% CrI. Flag comparisons where CrI excludes zero.

#### M6: Fisher Information Metric
Each study estimate (yi, vi) defines a normal distribution N(yi, vi). The Fisher information metric on this 2D manifold (μ, σ²) is:

```
g = [[1/σ², 0], [0, 1/(2σ⁴)]]
```

The geodesic distance between studies i and j on this manifold:

```
d_Fisher(i,j) = √(2) × |log(σi/σj)| + (μi-μj)²/(σi×σj)  (Rao distance)
```

This replaces Euclidean distance for clustering and network analysis — studies with different precisions are naturally weighted.

#### M7: Spectral Heterogeneity Decomposition
Construct the k×k between-study covariance matrix (from the MCMC posterior or residuals). Eigendecompose:

```
Σ_between = Σ λ_i × e_i × e_i^T
```

Top eigenvalues explain the dominant modes of heterogeneity. Eigenvectors identify which studies cluster together and which are outliers. Proportion of variance: λ_i / Σλ_j.

#### M8: Riemannian Geodesic Distances
Using the Fisher metric from M6, compute the full k×k geodesic distance matrix between all studies. Apply multidimensional scaling (MDS) to embed studies in 2D for visualization. Geodesic-based hierarchical clustering identifies study subgroups that share a common effect distribution.

#### M9: Persistent Homology (TDA)
Build a Vietoris-Rips filtration on the geodesic distance matrix from M8:

```
At radius ε: connect studies i,j if d(i,j) ≤ ε
Track connected components (H0) and loops (H1) as ε grows
```

- **H0 persistence:** Long-lived components = well-separated study clusters (subgroups)
- **H1 persistence:** Long-lived loops = "evidence gaps" — regions of the parameter space with no direct evidence, only indirect paths

Output: persistence diagram (birth-death pairs) and barcode plot.

#### M10: Conformal Prediction Intervals
Distribution-free coverage guarantee. Split studies into calibration (⌈k/2⌉) and prediction sets. For a new study:

```
1. Compute nonconformity scores: αi = |yi - μ̂| / √(vi + τ²)
2. Quantile: q = ⌈(1-α)(n+1)⌉/n-th value of sorted scores
3. PI: μ̂ ± q × √(vi_new + τ²)
```

Guarantees P(y_new ∈ PI) ≥ 1-α regardless of the true distribution. Compare with parametric PI from M3.

### 2.2 E156 Papers

**P1: Information-Geometric Meta-Analysis (methods M6, M8)**
- Estimand: Geodesic distortion ratio (Rao distance vs Euclidean distance between study estimates)
- Question: Does the Fisher information metric reveal heterogeneity structure that Euclidean meta-analysis misses?
- Dataset: Colchicine ACS trials + SGLT2 HF trials + synthetic NMA

**P2: Spectral Heterogeneity Decomposition (method M7)**
- Estimand: Proportion of between-study variance explained by the leading eigenvalue
- Question: Can eigendecomposition of the between-study covariance identify interpretable sources of heterogeneity?

**P3: Topological Evidence Gaps via Persistent Homology (method M9)**
- Estimand: H1 persistence ratio (longest loop lifetime / total filtration range)
- Question: Do topological "holes" in the evidence network predict areas where future trials would most reduce uncertainty?

**P4: Distribution-Free Meta-Analysis via Conformal Prediction (method M10)**
- Estimand: Empirical coverage gap (conformal PI coverage minus parametric PI coverage)
- Question: How much does the normality assumption in standard prediction intervals cost in terms of actual coverage?

### 2.3 UI Components

- **Forest plot:** Toggle REML / Bayesian NMA / Conformal. Shows point estimates, CIs, PIs.
- **Network diagram:** Interactive force-directed graph. Edge weights = geodesic distance. Node size = study weight. Color = inconsistency flag from M5.
- **Spectral plot:** Scree plot of eigenvalues + heatmap of eigenvector loadings per study.
- **Persistence diagram:** Scatter plot (birth × death) with diagonal reference line. Long bars = significant topological features.
- **Manifold embedding:** 2D MDS projection from geodesic distances. Study points colored by subgroup from hierarchical clustering.
- **Convergence diagnostics:** Trace plots and R̂ for MCMC (M4).

---

## 3. Limb 2 — Causal Transport & Distribution Matching

### 3.1 Methods

#### M11: IPSW (Inverse Probability of Selection Weighting)
Model the probability of being in the trial vs target population using logistic regression on covariates (age, diabetes, etc.):

```
P(S=1 | X) = logistic(β₀ + β₁X_age + β₂X_diabetes + ...)
```

Weight each trial observation by 1/P(S=1|Xi). The transported effect:

```
ATE_target = Σ wi × Yi / Σ wi    where wi = (1 - P̂i) / P̂i
```

Trim extreme weights (< 1st or > 99th percentile) to stabilize.

#### M12: AIPW (Doubly Robust)
Combines an outcome model with IPSW. Consistent if EITHER model is correctly specified:

```
ATE_DR = (1/n) Σ [m̂(Xi) + (Si - P̂(Xi)) × (Yi - m̂(Xi)) / P̂(Xi)]
```

Where m̂(X) is the outcome regression and P̂(X) is the propensity score.

#### M13: Optimal Transport (Sinkhorn)
Compute the Wasserstein-2 distance between trial and target covariate distributions using the Sinkhorn algorithm (entropic regularization):

```
W₂(P_trial, P_target) = min_T ∫ ||x - T(x)||² dP_trial(x)
```

Sinkhorn iterations on the cost matrix C_ij = ||x_i - x_j||²:

```
K = exp(-C / ε)        (Gibbs kernel)
a ← a ⊙ (p / K b)     (scaling iterations)
b ← b ⊙ (q / K^T a)
```

The transport plan T maps trial covariates to target covariates, enabling effect adjustment along the optimal transport map.

#### M14: Kernel Mean Embedding (MMD)
Embed distributions in RKHS using a Gaussian kernel:

```
μ_P = E_P[k(·, x)]
MMD²(P, Q) = ||μ_P - μ_Q||²_H = E[k(x,x')] - 2E[k(x,y)] + E[k(y,y')]
```

MMD quantifies the distributional shift. Permutation test for H₀: P_trial = P_target.

Bandwidth selection via median heuristic: σ = median(||xi - xj||).

#### M15: Causal Transport via Do-Calculus
Requires a user-specified causal DAG. The transported effect uses the truncated factorization:

```
P_target(Y | do(X)) = Σ_z P_trial(Y | X, Z) × P_target(Z)
```

Where Z is the set of adjustment variables identified by the back-door criterion on the DAG. The DAG editor allows users to specify which covariates are confounders vs mediators vs colliders.

ID algorithm checks if the causal effect is identifiable from the given DAG.

#### M16: Knockoff Filter for Variable Selection
Constructs knockoff copies X̃ of each covariate that mimic the correlation structure but are conditionally independent of the outcome:

```
(X, X̃) has the same pairwise correlations
X̃ ⊥ Y | X
```

Feature importance = |W_j| where W_j = |t_j| - |t̃_j| (original minus knockoff coefficient magnitude). FDR controlled at target level q.

This determines which covariates actually matter for transport, replacing the arbitrary choice of age + diabetes.

#### M17: Density Ratio Estimation (KLIEP)
Directly estimates the importance weight r(x) = P_target(x) / P_trial(x) by minimizing KL divergence:

```
min KL(P_target || r × P_trial)
s.t. E_trial[r(X)] = 1
```

Parameterized as r(x) = Σ αi × φi(x) with Gaussian basis functions. Solved via convex optimization. Avoids modelling either density individually.

#### M18: Mapper Algorithm (TDA)
Topological summary of the covariate space:

```
1. Choose a filter function f: X → R (e.g., first principal component)
2. Cover the range of f with overlapping intervals
3. Cluster points within each interval
4. Connect clusters that share points in overlapping intervals
```

Output: a simplicial complex (nerve) that captures the topological shape of the covariate space. Reveals clusters, branches, and loops that linear methods miss. Colored by treatment effect to show how the effect varies across the covariate topology.

### 3.2 E156 Papers

**P5: Optimal Transport for Effect Transportability (methods M13, M17)**
- Estimand: Wasserstein-adjusted ATE minus naive-adjusted ATE
- Question: Does optimal transport correct for distributional shift that linear transport misses?

**P6: Doubly Robust Causal Transport (methods M11, M12, M15)**
- Estimand: Bias reduction of AIPW over IPSW when the outcome model is misspecified
- Question: How much does double robustness protect transported effect estimates in meta-analysis?

**P7: Topological Covariate Matching (methods M14, M18)**
- Estimand: MMD between trial and target populations before vs after Mapper-guided matching
- Question: Can topological analysis identify non-linear covariate structures that improve transportability?

### 3.3 UI Components

- **Distribution overlay:** Trial vs target covariate distributions (kernel density plots, per-covariate).
- **Optimal transport map:** 2D scatter with arrows showing the Sinkhorn transport plan.
- **Causal DAG editor:** Drag-and-drop node editor. Users place variables, draw directed edges. Color-coded: confounders (blue), mediators (green), colliders (red). Back-door adjustment set highlighted.
- **Knockoff importance:** Bar chart with FDR threshold line. Selected covariates highlighted.
- **Mapper complex:** Interactive node-link diagram. Node size = cluster size, color = mean treatment effect in that cluster, edges = shared members.
- **Method comparison table:** Side-by-side transported effects from IPSW / AIPW / Sinkhorn / do-calculus.

---

## 4. Limb 3 — Stochastic Economics & Adoption Dynamics

### 4.1 Methods

#### M19: Euler-Maruyama SDE Solver
Proper numerical solution of the Bass-SDE:

```
dU = [p(m-U) + qU(m-U)/m]dt + σ U dW
```

Discretized:

```
U_{n+1} = U_n + f(U_n)Δt + σ U_n √Δt × Z_n    where Z_n ~ N(0,1)
```

Δt = 0.01 years. N_paths = 500 sample paths per region. Reports median, 95% credible band.

Strong order 0.5 convergence. Step size adaptive if |ΔU/U| > 0.1.

#### M20: Mean-Field Game Theory
Each of R regions is a rational agent choosing adoption intensity a_r(t). The coupled system:

```
Forward (population):    ∂m/∂t = -∇·(m × v) + σ²Δm/2
Backward (value):        -∂V/∂t = H(x, ∇V, m) + σ²ΔV/2
Coupling:                v = -∇_p H(x, ∇V, m)
```

Simplified finite-state MFG: discretize adoption into L levels. Solve via fixed-point iteration:
1. Guess mean-field distribution m(t)
2. Solve each agent's optimal control given m(t)
3. Aggregate to get new m(t)
4. Repeat until convergence (|m_new - m_old| < 1e-4)

Nash equilibrium: no region can improve its outcome by deviating unilaterally.

#### M21: Hamilton-Jacobi-Bellman Optimal Control
"When should region r adopt?" Solves the HJB equation:

```
max_a { -∂V/∂t - ½σ²∂²V/∂x² - (benefit(x,a) - cost(a)) } = 0
```

State x = (efficacy_estimate, burden, health_expenditure). Control a = adoption intensity [0, 1].

Terminal condition: V(T, x) = 0. Solve backward in time via finite differences.

Optimal policy: a*(t, x) = argmax_a { benefit(x,a) - cost(a) + continuation_value }.

#### M22: Regime-Switching HMM
Health systems alternate between K=3 hidden states:

```
State 1: Normal (moderate adoption rate)
State 2: Crisis (adoption drops, costs spike)
State 3: Reform (adoption accelerates, costs subsidized)
```

Transition matrix A (3×3), emission parameters per state. Fitted via Baum-Welch (EM) on observed health expenditure and adoption readiness time series.

Viterbi decoding gives the most likely state sequence per region.

Forward algorithm gives filtered state probabilities for forecasting.

#### M23: Network Diffusion (Graph Laplacian)
Regions as nodes in a weighted graph. Edge weight w_ij = trade volume × geographic proximity between regions i and j.

Graph Laplacian: L = D - W where D_ii = Σ_j w_ij.

Diffusion equation on the graph:

```
du/dt = -α L u + f(u)
```

Where u(t) is the adoption vector across regions, α is the diffusion coefficient, and f(u) is the local Bass dynamics from M19.

Spectral decomposition of L identifies the dominant diffusion modes (Fiedler vector = primary axis of spread).

#### M24: Real Options Analysis
Adoption as an irreversible investment under uncertainty. The value of waiting:

```
Option value = E[max(NPV_adopt_now, V_wait × e^{-rΔt})]
```

Trigger threshold: adopt when NPV > NPV* where NPV* > 0 (waiting has value because uncertainty may resolve). NPV* derived from the Bellman equation:

```
NPV* = (β/(β-1)) × I    where β = ½ - (r-δ)/σ² + √[(r-δ)/σ² - ½]² + 2r/σ²)
```

I = adoption cost, r = discount rate, δ = convenience yield, σ = uncertainty in benefit.

Compare with naive NPV > 0 threshold — real options gives a *higher* threshold, reflecting the value of information.

#### M25: Neural ODE
A small neural network parameterizes the continuous-time dynamics:

```
du/dt = NN_θ(u, t, context)
```

Architecture: 2-layer MLP (input: [u, t, health_exp, readiness], hidden: 32, output: du/dt).

Trained via adjoint sensitivity method (backprop through the ODE solver):

```
Loss = Σ_i ||u(t_i) - u_observed(t_i)||²
dL/dθ via adjoint ODE (reverse-mode differentiation)
```

Adam optimizer, 500 epochs. Compared with Bass as a baseline.

#### M26: Multi-Objective Pareto Optimization
Three objectives: maximize benefit, minimize cost, maximize equity (Gini coefficient of benefit distribution across regions).

```
min_a (-Benefit(a), Cost(a), -Equity(a))    s.t. a ∈ [0,1]^R
```

NSGA-II algorithm:
1. Initialize population of adoption strategies
2. Evaluate all three objectives
3. Non-dominated sorting + crowding distance
4. Crossover + mutation → next generation
5. Repeat 200 generations

Output: Pareto front (3D surface of non-dominated solutions). User selects preferred trade-off point.

### 4.2 E156 Papers

**P8: Mean-Field Game Theory for Treatment Adoption (methods M20, M23)**
- Estimand: Nash equilibrium adoption rate minus non-strategic (independent) adoption rate
- Question: Does strategic interaction between health systems accelerate or retard optimal adoption?

**P9: Stochastic Optimal Control for Adoption Timing (methods M19, M21, M24)**
- Estimand: Real-options adoption threshold minus naive NPV threshold
- Question: How much does the option value of waiting shift the optimal adoption timing for health interventions?

**P10: Neural ODE for Data-Driven Adoption Dynamics (methods M22, M25)**
- Estimand: Prediction RMSE of Neural ODE vs Bass SDE on held-out adoption trajectories
- Question: Can learned dynamics outperform structural models when adoption patterns are non-Bass?

### 4.3 UI Components

- **SDE spaghetti plot:** 500 sample paths per region, median + 95% band. Toggle Bass vs Neural ODE.
- **MFG equilibrium viewer:** Animated heatmap of adoption across regions over time. Slider for strategic interaction strength.
- **HJB decision surface:** 3D surface (axes: efficacy uncertainty × burden × time), color = optimal adoption intensity.
- **Real options comparison:** Side-by-side: naive NPV threshold vs real options threshold. Gap = option value of waiting.
- **Network graph:** Regions as nodes, edge width = diffusion weight. Node color = current adoption level. Animated diffusion spread.
- **Regime timeline:** Per-region horizontal bar showing HMM-decoded states (Normal / Crisis / Reform) over time.
- **Pareto front:** Interactive 3D scatter. User clicks a point → details show that strategy's benefit/cost/equity values.

---

## 5. Limb 4 — Integration & Uncertainty Architecture

### 5.1 Methods

#### M27: Sobol Sensitivity Indices
Variance-based decomposition. First-order index for input i:

```
S_i = V[E[Y|X_i]] / V[Y]
```

Total-order index (includes all interactions):

```
S_Ti = 1 - V[E[Y|X_{~i}]] / V[Y]
```

Computed via Saltelli's estimator: requires N(2d+2) model evaluations where d = number of inputs, N = base sample size.

Use the GP emulator (M29) to make this cheap — evaluate the emulator instead of the full pipeline.

#### M28: Shapley Values for Uncertainty Attribution
Game-theoretic attribution of output variance to each input. For d inputs:

```
φ_i = Σ_{S ⊆ D\{i}} |S|!(d-|S|-1)!/d! × [v(S∪{i}) - v(S)]
```

Where v(S) = V[E[Y|X_S]] is the variance explained by coalition S.

Unlike Sobol, Shapley values handle correlated inputs correctly and always sum exactly to V[Y].

Computational cost: 2^d coalitions. For d ≤ 10 (our case: ~6-8 uncertain inputs), this is feasible.

#### M29: Gaussian Process Emulator
Train a GP on the MC draws as a cheap surrogate for the full pipeline:

```
f ~ GP(m(x), k(x, x'))
k(x, x') = σ²_f exp(-||x-x'||² / (2l²))    (SE kernel)
```

Training: maximize marginal likelihood w.r.t. hyperparameters (σ²_f, l, σ²_n).

Prediction: analytic posterior mean and variance at any test point:

```
μ* = K_*^T (K + σ²_n I)^{-1} y
σ²* = k(x*, x*) - K_*^T (K + σ²_n I)^{-1} K_*
```

Enables cheap evaluation for Sobol/Shapley (M27/M28) and optimization.

Active learning: add training points where GP uncertainty is highest (query-by-committee).

#### M30: Polynomial Chaos Expansion (PCE)
Expand the output as a polynomial series in the uncertain inputs:

```
Y ≈ Σ_{|α|≤p} c_α × Ψ_α(ξ)
```

Where ξ = standardized inputs, Ψ_α = products of Hermite polynomials (for Gaussian inputs), and c_α = expansion coefficients.

Coefficients via least-angle regression (LARS) on an oversampled design matrix.

Sobol indices fall out analytically:

```
S_i = Σ_{α: α_i > 0, α_j=0 ∀j≠i} c_α² / Σ_{α≠0} c_α²
```

Near-zero marginal cost once the PCE is fitted.

#### M31: Copula Models for Limb Dependencies
Model the joint uncertainty across limbs when they are not independent.

Fit marginal distributions per limb output (normal, gamma, or empirical). Join with a parametric copula:

```
C(u₁, u₂, u₃, u₄; θ) = joint CDF
```

Candidate copulas: Gaussian, Clayton (lower tail dependence), Frank (symmetric), Gumbel (upper tail dependence).

Selected via AIC on the MC draws. Enables sampling from the joint that respects inter-limb correlations.

#### M32: Sequential Monte Carlo (Particle Filter)
Living evidence synthesis: as new trial data arrives, update the posterior without re-running from scratch.

```
State: θ_t = (μ, τ², β, adoption_params)
Observation: y_new (new trial result)

1. Predict: θ_t^(i) ~ P(θ_t | θ_{t-1}^(i))     (random walk on parameters)
2. Weight: w_t^(i) ∝ P(y_new | θ_t^(i))           (likelihood of new data)
3. Resample: multinomial resampling if ESS < N/2
```

N = 1000 particles. Each particle carries the full state of all 4 limbs. Effective Sample Size (ESS) monitors degeneracy.

User can "add a trial" interactively and watch the posterior update in real time.

#### M33: Extreme Value Theory (EVT)
Model the tail of the benefit distribution using Peaks Over Threshold:

```
P(Y > u + y | Y > u) ≈ GPD(y; ξ, σ_u)
```

Where u is the threshold (e.g., 10th percentile of benefit), ξ is the shape parameter (heavy vs light tail), σ_u is the scale.

Fitted via maximum likelihood on the MC draws that exceed the threshold.

Return levels: "The 1-in-100 worst-case benefit is X events prevented." Tail risk metric for policy makers.

#### M34: Score Matching
Estimates ∇ log p(x) (the score function) directly without computing the normalizing constant:

```
min_θ E_p[||s_θ(x) - ∇ log p(x)||²]
  = min_θ E_p[Tr(∇s_θ) + ½||s_θ||²]    (score matching identity)
```

Parameterized as a small MLP. Enables implicit generative modelling: sample from the joint output distribution via Langevin dynamics:

```
x_{t+1} = x_t + (ε/2)s_θ(x_t) + √ε × z_t
```

This provides a non-parametric generative model of the full synthesis output.

#### M35: Variational Inference
Approximate the full joint posterior P(θ|data) with a tractable family Q(θ; φ):

```
min_φ KL(Q(θ; φ) || P(θ|data))
  = max_φ ELBO = E_Q[log P(data|θ)] - KL(Q || Prior)
```

Structured mean-field: Q factorizes across limbs but allows within-limb correlations.

```
Q(θ; φ) = Q₁(θ_trial; φ₁) × Q₂(θ_transport; φ₂) × Q₃(θ_econ; φ₃) × Q₄(θ_integ; φ₄)
```

Each factor is a multivariate Gaussian with full covariance. Optimized via Adam on the ELBO using the reparameterization trick.

Copula (M31) models the between-factor dependence that mean-field misses.

### 5.2 E156 Papers

**P11: Shapley Uncertainty Attribution in Evidence Synthesis (methods M27, M28)**
- Estimand: Maximum absolute difference between Sobol first-order index and Shapley value for the same input
- Question: When inputs to evidence synthesis are correlated, how much does Sobol misattribute variance compared to Shapley?

**P12: Polynomial Chaos for Health Impact Uncertainty (methods M29, M30)**
- Estimand: PCE RMSE vs GP RMSE on held-out test points from the pipeline
- Question: Can polynomial chaos expansion provide analytic sensitivity indices while matching GP emulator accuracy?

**P13: Living Evidence Synthesis via Particle Filter (methods M32, M33)**
- Estimand: Posterior updating lag (number of new trials before SMC posterior differs significantly from full re-analysis)
- Question: How many new trials can a particle filter absorb before degenerating, and does EVT tail modeling improve worst-case decision support?

### 5.3 UI Components

- **Sobol/Shapley tornado:** Horizontal bar chart, toggle between Sobol-S1, Sobol-ST, Shapley. Color-coded by limb.
- **GP response surface:** 2D heatmap with selectable axes (any two inputs). GP uncertainty shown as contour overlay. Click to query prediction.
- **PCE coefficients:** Bar chart of leading polynomial basis coefficients. Annotated with which input(s) each basis function depends on.
- **Copula structure:** Bivariate density contour plots for each pair of limb outputs. Copula family shown.
- **Particle filter animation:** Particles (dots) in 2D projection of the state space. User clicks "Add Trial" → particles reweight → animation shows resampling. ESS gauge.
- **EVT tail plot:** Lower tail of benefit distribution with GPD fit overlay. Return level table (1-in-10, 1-in-100, 1-in-1000).
- **Score field:** 2D vector field showing ∇ log p(x) with Langevin sample trajectories.

---

## 6. Cross-Limb Integration — The Evidence Manifold

### 6.1 Methods

#### M36: Full Joint Posterior via VI
Uses the variational inference framework from M35 with the copula from M31 to approximate:

```
P(θ_all | data_all) ≈ C(Q₁, Q₂, Q₃, Q₄; θ_copula)
```

Where C is the fitted copula joining the mean-field variational factors.

Full posterior summary: marginal densities, pairwise dependence, highest posterior density regions.

#### M37: Information-Theoretic Evidence Flow
Mutual information between limb outputs, computed from the joint posterior (M36):

```
I(Limb_i; Limb_j) = H(Limb_i) + H(Limb_j) - H(Limb_i, Limb_j)
```

Entropies estimated via KDE on the variational samples.

Visualized as a Sankey diagram: wider bands = more information flow between limbs. Identifies which limbs are redundant vs complementary.

Conditional MI: I(Limb_i; Limb_j | Limb_k) reveals whether the information between two limbs is mediated by a third.

#### M38: Riemannian Evidence Manifold
The full parameter space θ = (θ_trial, θ_transport, θ_econ, θ_uncertainty) defines a statistical manifold M.

Fisher information matrix of the full model = Riemannian metric on M:

```
g_ij(θ) = E[-∂² log P(data|θ) / ∂θ_i ∂θ_j]
```

Computed numerically via finite differences on the log-likelihood evaluated at the variational posterior mean.

Geodesic computation: solve the geodesic equation via shooting method:

```
d²γ/dt² + Γ^k_ij (dγ^i/dt)(dγ^j/dt) = 0
```

Where Γ are Christoffel symbols derived from g.

Key application: geodesic distance from current evidence state to the "decision boundary" (the manifold subspace where NHB = 0). This geodesic distance = "minimum amount of evidence needed to change the decision."

Projection to 2D/3D via Riemannian MDS (minimize geodesic stress).

#### M39: Entropic Regularization
Adds maximum entropy penalty to the joint inference:

```
max_Q { ELBO(Q) + λ × H(Q) }
```

Where λ controls the trade-off between sharpness and robustness. Higher λ → more conservative (wider posteriors) → more robust to model misspecification.

λ selected by cross-validation: hold out one trial at a time, choose λ that minimizes leave-one-out prediction error.

Reports: how much posterior width increases under entropic regularization. If it increases substantially, the data do not strongly constrain the model.

#### M40: Causal DAG Discovery (PC Algorithm)
Learns the causal structure between limb variables from the MC draws:

```
1. Start with complete undirected graph over all variables
2. For each edge (i,j), test conditional independence: i ⊥⊥ j | S?
3. Remove edge if independent (Fisher z-test on partial correlations)
4. Orient edges using v-structures and Meek rules
```

Significance level α = 0.01. Maximum conditioning set size = 3.

Output: a partially directed acyclic graph (CPDAG) showing which causal connections are data-supported.

User can compare the discovered DAG with their assumed DAG (from M15) and identify where assumptions may be wrong.

### 6.2 E156 Papers

**P14: The Evidence Manifold (methods M36, M37, M38)**
- Estimand: Geodesic distance from current evidence state to the decision boundary (NHB = 0)
- Question: Can Riemannian geometry on the evidence manifold quantify how far the current evidence is from a decision reversal?

**P15: Causal Architecture of Evidence-to-Implementation (methods M39, M40)**
- Estimand: Number of edges in the discovered DAG that contradict the assumed DAG
- Question: Does data-driven causal discovery reveal evidence-to-implementation pathways that expert-specified DAGs miss?

### 6.3 UI Components

- **Evidence manifold:** 3D interactive visualization (Riemannian MDS projection). Current evidence state = large marker. Decision boundary = colored surface. Geodesic paths drawn as curves. Rotate/zoom.
- **Sankey diagram:** Information flow in bits between limbs. Band width proportional to mutual information.
- **Causal DAG comparison:** Side-by-side: user-specified DAG (from Limb 2) vs PC-discovered DAG. Matching edges = green, mismatches = red, new discoveries = orange.
- **Joint posterior ridgeline:** Marginal density plots stacked vertically for all key parameters.
- **Decision dashboard:** Binary outcome (ADOPT / DO NOT ADOPT / INSUFFICIENT EVIDENCE). Geodesic distance gauge. Entropic robustness gauge. EVPI value. Confidence decomposition pie chart (which limb contributes most to the decision confidence).

---

## 7. Build Phases & Dependencies

### Phase 1: Limb 1 (Trial Efficacy & Evidence Geometry)

**Scope:** Scaffold the HTML app shell, MathCore library, data upload/preload, Limb 1 tab with all 10 methods.

**MathCore modules needed:** linalg, stats, optim, random, tda

**Deliverables:**
- Working single-file HTML with Limb 1 tab
- 10 methods functional with interactive visualizations
- Pre-loaded datasets + CSV upload
- E156 papers P1–P4 drafted

**Tests:** ≥25 unit tests embedded as a test harness (button in UI runs them). Validate against R metafor for M1-M5. Validate geodesic distances against analytic Rao distance formula.

### Phase 2: Limb 2 (Causal Transport)

**Scope:** Add Limb 2 tab with 8 methods. Extend MathCore with graph and kernel modules.

**New MathCore modules:** graph (for DAG operations), kernel (for MMD/KLIEP)

**Data flow:** Limb 1 results automatically feed into Limb 2. User provides or edits the causal DAG.

**Deliverables:**
- Limb 2 tab with all 8 methods
- DAG editor
- E156 papers P5–P7 drafted

**Tests:** ≥20 tests. Validate IPSW/AIPW against known examples. Validate Sinkhorn against POT library reference values.

### Phase 3: Limb 3 (Stochastic Economics)

**Scope:** Add Limb 3 tab with 8 methods. Extend MathCore with ODE solvers and optimization.

**New MathCore modules:** ode (Euler-Maruyama, RK4), optim extensions (NSGA-II)

**Data flow:** Limb 2 transported effects feed into Limb 3 adoption models.

**Deliverables:**
- Limb 3 tab with all 8 methods including MFG, HJB, Neural ODE
- E156 papers P8–P10 drafted

**Tests:** ≥20 tests. Validate Bass SDE against analytic solution. Validate real options against Black-Scholes closed form. Neural ODE convergence test.

### Phase 4: Limb 4 (Uncertainty Architecture)

**Scope:** Add Limb 4 tab with 9 methods. Extend MathCore with GP, PCE, SMC modules.

**New MathCore modules:** gp, poly, smc

**Data flow:** All upstream limb results feed in. GP/PCE emulators trained on the full pipeline MC draws.

**Deliverables:**
- Limb 4 tab with all 9 methods
- Particle filter with live update capability
- E156 papers P11–P13 drafted

**Tests:** ≥25 tests. GP predictions within 95% CI. PCE Sobol indices match brute-force Sobol within 5%. Particle filter ESS > N/3 after 10 updates.

### Phase 5: Integration (Evidence Manifold)

**Scope:** Add Integration tab with 5 methods. Connect all limbs through the Pipeline object.

**Data flow:** Full end-to-end: data → Limb 1 → Limb 2 → Limb 3 → Limb 4 → Integration.

**Deliverables:**
- Integration tab with evidence manifold, Sankey, causal discovery
- Full pipeline runs end-to-end in browser
- E156 papers P14–P15 drafted
- GitHub Pages deployment

**Tests:** ≥15 tests. Geodesic distances satisfy triangle inequality. MI ≥ 0. PC algorithm recovers known structure on synthetic DAG.

### Total Test Budget

| Phase | Tests |
|-------|-------|
| Limb 1 | ≥25 |
| Limb 2 | ≥20 |
| Limb 3 | ≥20 |
| Limb 4 | ≥25 |
| Integration | ≥15 |
| **Total** | **≥105** |

---

## 8. E156 Paper Summary

| Paper | Title | Methods | Target Audience |
|-------|-------|---------|-----------------|
| P1 | Information-Geometric Meta-Analysis | M6, M8 | Stats in Med |
| P2 | Spectral Heterogeneity Decomposition | M7 | Biometrics |
| P3 | Topological Evidence Gaps via Persistent Homology | M9 | Stat Methods Med Res |
| P4 | Distribution-Free Meta-Analysis via Conformal Prediction | M10 | JRSS-B |
| P5 | Optimal Transport for Effect Transportability | M13, M17 | Biostatistics |
| P6 | Doubly Robust Causal Transport | M11, M12, M15 | JASA |
| P7 | Topological Covariate Matching via Mapper | M14, M18 | Ann Appl Stat |
| P8 | Mean-Field Game Theory for Treatment Adoption | M20, M23 | Health Econ |
| P9 | Stochastic Optimal Control for Adoption Timing | M19, M21, M24 | Med Decision Making |
| P10 | Neural ODE for Data-Driven Adoption Dynamics | M22, M25 | Nature Machine Intelligence |
| P11 | Shapley Uncertainty Attribution in Evidence Synthesis | M27, M28 | Stats in Med |
| P12 | Polynomial Chaos for Health Impact Uncertainty | M29, M30 | SIAM UQ |
| P13 | Living Evidence Synthesis via Particle Filter | M32, M33 | BMJ EBM |
| P14 | The Evidence Manifold | M36, M37, M38 | PNAS |
| P15 | Causal Architecture of Evidence-to-Implementation | M39, M40 | Nature Methods |

---

## 9. Constraints & Standards

### Performance
- All methods must complete within 30 seconds on a modern browser (Chrome/Edge/Firefox)
- MCMC (M4): cap at 15,000 total iterations. Use Web Workers for non-blocking UI
- Neural ODE (M25): cap at 500 training epochs
- Sinkhorn (M13): cap at 1000 iterations with ε = 0.01
- Particle filter (M32): N = 1000 particles

### Determinism
- All randomness via seeded xoshiro128** PRNG (MathCore.random)
- Same seed + same data = identical results across browsers
- No Math.random() anywhere

### Offline-First
- Zero external CDN dependencies
- All rendering via Canvas/SVG, no D3/Plotly/external libraries
- Must work from file:// or GitHub Pages

### Accessibility
- All interactive plots have keyboard navigation
- Color-blind safe palettes (viridis/cividis for heatmaps)
- WCAG AA contrast (4.5:1) for all text
- ARIA labels on interactive elements

### Code Safety (from lessons.md)
- No literal `</script>` inside script blocks
- No `??` mixed with `||` without parens
- `?? fallback` not `|| fallback` for numeric values
- Div balance check after structural edits
- Unique element IDs across the entire file
- Unique function names across all modules
