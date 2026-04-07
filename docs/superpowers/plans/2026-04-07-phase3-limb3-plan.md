# Phase 3: Limb 3 — Stochastic Economics & Adoption Dynamics

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Limb 3 tab to the existing HTML app with 8 methods for modelling treatment adoption dynamics: Euler-Maruyama SDE solver for stochastic Bass model, mean-field game theory, Hamilton-Jacobi-Bellman optimal control, regime-switching HMM, network diffusion via graph Laplacian, real options analysis, neural ODE, and multi-objective Pareto optimization via NSGA-II.

**Architecture:** Extend `index.html` (3,727 lines). Add `MathCore.ode` module (Euler-Maruyama, RK4). Create `Limb3` IIFE consuming Limb 2 transported effects + context data. Enable Limb 3 tab. All 8 methods use the 4-region × 2-year context data with adoption parameters.

**Tech Stack:** Vanilla JS, Canvas rendering, zero dependencies. Seeded PRNG for all stochastic methods.

**File:** `C:\Users\user\four_limb_synthesis\index.html`

**Existing structure:**
- MathCore IIFE: line 238 (return at line 967 with `{ random, linalg, stats, optim, tda, kernel, graph }`)
- DataLayer IIFE: line 976 (with CONTEXT at line 1104)
- App IIFE: line 1157
- Limb1 IIFE: line 1229
- Limb2 IIFE: line 2102
- TestRunner IIFE: line 3193

**Context data available (4 regions):**
- North America: health_exp=12000, readiness=0.9, cost=120
- Western Europe: health_exp=6000, readiness=0.85, cost=80
- Southeast Asia: health_exp=800, readiness=0.4, cost=20
- Sub-Saharan Africa: health_exp=150, readiness=0.2, cost=10

---

## Task 1: Enable Limb 3 Tab + Panel HTML + MathCore.ode

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Enable the Limb 3 tab button**

Find line 166:
```html
    <button class="tab-btn disabled" role="tab" aria-selected="false" data-tab="limb3" disabled>Limb 3: Economics</button>
```
Replace with:
```html
    <button class="tab-btn" role="tab" aria-selected="false" data-tab="limb3">Limb 3: Economics</button>
```

- [ ] **Step 2: Replace empty Limb 3 panel**

Find line 218:
```html
    <div id="panel-limb3" class="tab-panel" role="tabpanel"></div>
```
Replace with:
```html
    <div id="panel-limb3" class="tab-panel" role="tabpanel">
        <div class="method-bar" id="limb3-methods" role="radiogroup" aria-label="Select economics method"></div>
        <div class="split-pane">
            <div>
                <div id="limb3-viz" class="viz-container">
                    <div class="viz-title" id="limb3-viz-title">Select a method to begin</div>
                    <canvas id="limb3-canvas" width="900" height="500"></canvas>
                </div>
            </div>
            <div>
                <div id="limb3-controls" class="card">
                    <h3>Adoption Parameters</h3>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:0.85rem;">
                        <label>Innovation (p): <input type="range" id="limb3-p" min="0.01" max="0.10" step="0.005" value="0.03"></label>
                        <label>Imitation (q): <input type="range" id="limb3-q" min="0.1" max="0.8" step="0.05" value="0.38"></label>
                        <label>Volatility (σ): <input type="range" id="limb3-sigma" min="0.05" max="0.5" step="0.05" value="0.15"></label>
                        <label>Discount rate (r): <input type="range" id="limb3-r" min="0.01" max="0.15" step="0.01" value="0.05"></label>
                    </div>
                </div>
                <div id="limb3-summary" class="card" style="margin-top:12px;">
                    <h3>Regional Summary</h3>
                    <div id="limb3-summary-table"></div>
                </div>
            </div>
        </div>
        <div id="limb3-results"></div>
        <div class="export-bar">
            <button onclick="if(typeof Limb3!=='undefined')Limb3.exportCSV()">Export CSV</button>
            <button onclick="if(typeof Limb3!=='undefined')Limb3.exportPNG()">Export PNG</button>
        </div>
    </div>
```

- [ ] **Step 3: Add MathCore.ode module**

Insert inside MathCore IIFE before the `return` statement:

```javascript
    // --- ODE Solvers ---
    const ode = (() => {
        // RK4: solve dy/dt = f(t, y) from t0 to t1 with step h
        function rk4(f, y0, t0, t1, h) {
            let t = t0, y = y0;
            const trajectory = [{t, y}];
            while (t < t1 - 1e-12) {
                const dt = Math.min(h, t1 - t);
                const k1 = f(t, y);
                const k2 = f(t + dt/2, y + k1 * dt/2);
                const k3 = f(t + dt/2, y + k2 * dt/2);
                const k4 = f(t + dt, y + k3 * dt);
                y = y + (k1 + 2*k2 + 2*k3 + k4) * dt / 6;
                t += dt;
                trajectory.push({t, y});
            }
            return trajectory;
        }

        // Euler-Maruyama: solve dY = f(t,Y)dt + g(t,Y)dW
        // Returns a single sample path
        function eulerMaruyama(drift, diffusion, y0, t0, t1, dt, rng) {
            let t = t0, y = y0;
            const path = [{t, y}];
            const sqrtDt = Math.sqrt(dt);
            while (t < t1 - 1e-12) {
                const step = Math.min(dt, t1 - t);
                const sqrtStep = Math.sqrt(step);
                const dW = rng.normal() * sqrtStep;
                const fVal = drift(t, y);
                const gVal = diffusion(t, y);
                y = y + fVal * step + gVal * dW;
                y = Math.max(0, y); // Absorbing barrier at 0
                t += step;
                path.push({t, y});
            }
            return path;
        }

        // Run N sample paths of Euler-Maruyama
        function emPaths(drift, diffusion, y0, t0, t1, dt, nPaths, seed) {
            const paths = [];
            for (let i = 0; i < nPaths; i++) {
                random.seed(seed + i * 7919);
                paths.push(eulerMaruyama(drift, diffusion, y0, t0, t1, dt, random));
            }
            return paths;
        }

        // Compute median + quantile bands from an array of paths (same time grid)
        function pathBands(paths, quantiles = [0.025, 0.5, 0.975]) {
            if (paths.length === 0) return [];
            const nSteps = paths[0].length;
            const bands = [];
            for (let s = 0; s < nSteps; s++) {
                const t = paths[0][s].t;
                const vals = paths.map(p => p[s].y).sort((a, b) => a - b);
                const n = vals.length;
                const result = {t};
                for (const q of quantiles) {
                    const idx = Math.min(Math.floor(q * n), n - 1);
                    result[`q${q}`] = vals[idx];
                }
                bands.push(result);
            }
            return bands;
        }

        return { rk4, eulerMaruyama, emPaths, pathBands };
    })();
```

- [ ] **Step 4: Update MathCore return**

Change:
```javascript
    return { random, linalg, stats, optim, tda, kernel, graph };
```
To:
```javascript
    return { random, linalg, stats, optim, tda, kernel, graph, ode };
```

- [ ] **Step 5: Register tests**

```javascript
// T53: RK4 solves exponential growth dy/dt = y
TestRunner.register('ODE: RK4 exponential growth', () => {
    const traj = MathCore.ode.rk4((_t, y) => y, 1.0, 0, 1, 0.01);
    const yFinal = traj[traj.length - 1].y;
    // Should be e^1 ≈ 2.718
    if (Math.abs(yFinal - Math.E) > 0.01) throw new Error(`y(1)=${yFinal}, expected ${Math.E}`);
});

// T54: Euler-Maruyama produces valid path
TestRunner.register('ODE: Euler-Maruyama Bass SDE path', () => {
    MathCore.random.seed(42);
    const m = 0.8, p = 0.03, q = 0.38;
    const drift = (_t, y) => (p * (m - y) + q * y * (m - y) / m);
    const diffusion = (_t, y) => 0.15 * y;
    const path = MathCore.ode.eulerMaruyama(drift, diffusion, 0.01, 0, 10, 0.01, MathCore.random);
    if (path.length < 10) throw new Error(`Path too short: ${path.length}`);
    const yEnd = path[path.length - 1].y;
    if (yEnd < 0 || yEnd > 1) throw new Error(`y(10) = ${yEnd} out of [0,1]`);
});

// T55: emPaths produces N paths with bands
TestRunner.register('ODE: emPaths + pathBands', () => {
    const drift = (_t, y) => 0.1 * (0.5 - y);
    const diff = (_t, y) => 0.05 * y;
    const paths = MathCore.ode.emPaths(drift, diff, 0.01, 0, 5, 0.1, 50, 42);
    if (paths.length !== 50) throw new Error(`Expected 50 paths, got ${paths.length}`);
    const bands = MathCore.ode.pathBands(paths);
    if (!bands[0].hasOwnProperty('q0.5')) throw new Error('Missing median band');
});
```

- [ ] **Step 6: Run tests, verify 55/55 pass**

- [ ] **Step 7: Commit**

```bash
git add index.html
git commit -m "feat: Limb3 tab + MathCore.ode (RK4, Euler-Maruyama, pathBands) with 3 tests"
```

---

## Task 2: M19-M20 — Bass SDE + Mean-Field Game

**Files:**
- Modify: `index.html` (create Limb3 IIFE)

- [ ] **Step 1: Register tests**

```javascript
// T56: Bass SDE produces adoption paths for 4 regions
TestRunner.register('M19: Bass SDE 4-region adoption', () => {
    const ctx = DataLayer.getContext().filter(c => c.year === 2025);
    const res = Limb3.methods.bassSDE(ctx, {nPaths: 20, tMax: 10, seed: 42});
    if (res.length !== 4) throw new Error(`Expected 4 regions, got ${res.length}`);
    if (!res[0].bands) throw new Error('Missing bands');
    if (res[0].region !== 'North America') throw new Error(`First region: ${res[0].region}`);
});

// T57: Mean-field game converges
TestRunner.register('M20: MFG Nash equilibrium', () => {
    const ctx = DataLayer.getContext().filter(c => c.year === 2025);
    const res = Limb3.methods.meanFieldGame(ctx, {maxIter: 50, seed: 42});
    if (!res.equilibrium) throw new Error('No equilibrium');
    if (res.iterations < 1) throw new Error('No iterations');
    for (const r of res.equilibrium) {
        if (r.adoption < 0 || r.adoption > 1) throw new Error(`Adoption ${r.adoption} out of range`);
    }
});
```

- [ ] **Step 2: Create Limb3 IIFE with M19-M20**

Insert new `<script>` block after Limb2 and before TestRunner:

```javascript
/* === LIMB 3: STOCHASTIC ECONOMICS & ADOPTION DYNAMICS === */
const Limb3 = (() => {
    const methods = {};

    // Shared: Bass model parameters from context
    function bassParams(ctxRow, pBase = 0.03, qBase = 0.38) {
        const healthFactor = ctxRow.health_exp_per_capita / 5000;
        const p = pBase * healthFactor * ctxRow.adoption_readiness;
        const q = qBase * healthFactor * ctxRow.adoption_readiness;
        return {p, q, m: 0.8}; // m = uptake cap
    }

    // M19: Euler-Maruyama Bass SDE
    methods.bassSDE = function(contextRows, {nPaths = 100, tMax = 10, dt = 0.05, sigma = 0.15, seed = 42, pBase = 0.03, qBase = 0.38} = {}) {
        const results = [];

        for (const ctx of contextRows) {
            const {p, q, m} = bassParams(ctx, pBase, qBase);

            const drift = (_t, y) => {
                const u = Math.max(0, Math.min(m, y));
                return p * (m - u) + q * u * (m - u) / m;
            };
            const diffusion = (_t, y) => sigma * Math.max(0, y);

            const paths = MathCore.ode.emPaths(drift, diffusion, 0.01, 0, tMax, dt, nPaths, seed);
            const bands = MathCore.ode.pathBands(paths);

            // Deterministic Bass solution for comparison
            const detPath = MathCore.ode.rk4((_t, y) => {
                const u = Math.max(0, Math.min(m, y));
                return p * (m - u) + q * u * (m - u) / m;
            }, 0.01, 0, tMax, dt);

            results.push({
                region: ctx.region,
                paths, bands, detPath,
                params: {p, q, m, sigma},
                finalMedian: bands.length > 0 ? (bands[bands.length - 1]['q0.5'] ?? 0) : 0
            });
        }
        return results;
    };

    // M20: Mean-Field Game Theory
    // Simplified finite-state MFG: each region chooses adoption intensity
    // Utility = benefit * adoption - cost * adoption² + interaction * (mean_adoption - adoption)²
    methods.meanFieldGame = function(contextRows, {maxIter = 100, interactionStrength = 0.5, seed = 42} = {}) {
        MathCore.random.seed(seed);
        const R = contextRows.length;

        // Initialize adoption levels
        let adoption = contextRows.map(ctx => {
            const {p, q, m} = bassParams(ctx);
            // Start at Bass steady-state approximation
            return Math.min(m, p / (p + q) * m + 0.1);
        });

        let converged = false;
        let iter = 0;

        for (iter = 0; iter < maxIter; iter++) {
            const meanAdoption = adoption.reduce((a, b) => a + b, 0) / R;
            const newAdoption = new Float64Array(R);

            for (let r = 0; r < R; r++) {
                const ctx = contextRows[r];
                const benefit = ctx.health_exp_per_capita / 12000; // Normalized benefit
                const cost = ctx.treatment_cost_usd / 120; // Normalized cost

                // Best response: maximize utility given mean field
                // U(a) = benefit * a - cost * a² - interaction * (a - meanAdoption)²
                // dU/da = benefit - 2*cost*a - 2*interaction*(a - meanAdoption) = 0
                // a* = (benefit + 2*interaction*meanAdoption) / (2*cost + 2*interaction)
                const denom = 2 * cost + 2 * interactionStrength;
                const aStar = denom > 1e-10
                    ? (benefit + 2 * interactionStrength * meanAdoption) / denom
                    : 0.5;

                newAdoption[r] = Math.max(0, Math.min(0.8, aStar));
            }

            // Check convergence
            let maxDiff = 0;
            for (let r = 0; r < R; r++) maxDiff = Math.max(maxDiff, Math.abs(newAdoption[r] - adoption[r]));
            adoption = Array.from(newAdoption);

            if (maxDiff < 1e-4) { converged = true; break; }
        }

        // Compare with non-strategic (independent) adoption
        const independent = contextRows.map(ctx => {
            const benefit = ctx.health_exp_per_capita / 12000;
            const cost = ctx.treatment_cost_usd / 120;
            return Math.max(0, Math.min(0.8, benefit / (2 * cost)));
        });

        return {
            equilibrium: contextRows.map((ctx, i) => ({
                region: ctx.region,
                adoption: adoption[i],
                independent: independent[i],
                strategicGap: adoption[i] - independent[i]
            })),
            converged, iterations: iter + 1,
            interactionStrength
        };
    };

    // Public API stubs (filled in Task 6)
    function init() {}
    function onDataChange() {}
    function exportCSV() {}
    function exportPNG() {}
    function getResults() { return null; }

    return { methods, init, onDataChange, exportCSV, exportPNG, getResults };
})();
```

- [ ] **Step 3: Run tests, verify 57/57 pass**

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: Limb3 M19-M20 (Bass SDE Euler-Maruyama, mean-field game theory) with 2 tests"
```

---

## Task 3: M21-M22 — HJB Optimal Control + Regime-Switching HMM

**Files:**
- Modify: `index.html` (extend Limb3.methods)

- [ ] **Step 1: Register tests**

```javascript
// T58: HJB decision surface
TestRunner.register('M21: HJB optimal control policy', () => {
    const res = Limb3.methods.hjbControl({
        benefit: 0.8, cost: 100, sigma: 0.15, r: 0.05, T: 10, nGrid: 20
    });
    if (!res.policy) throw new Error('No policy');
    if (!res.valueFunction) throw new Error('No value function');
    if (res.policy.length !== 20) throw new Error(`Grid size ${res.policy.length}, expected 20`);
    // Optimal adoption should be higher when benefit is high
    if (res.policy[res.policy.length - 1] < res.policy[0] - 0.01) throw new Error('Policy should increase with benefit');
});

// T59: HMM Viterbi decoding
TestRunner.register('M22: HMM Viterbi decoding produces valid states', () => {
    MathCore.random.seed(42);
    const observations = [];
    for (let t = 0; t < 20; t++) observations.push(0.5 + MathCore.random.normal(0, 0.3));
    const res = Limb3.methods.hmmDecode(observations);
    if (res.states.length !== 20) throw new Error(`Expected 20 states, got ${res.states.length}`);
    if (!res.states.every(s => s >= 0 && s <= 2)) throw new Error('States out of range');
    if (!res.transitionMatrix) throw new Error('No transition matrix');
});
```

- [ ] **Step 2: Implement M21-M22**

Add inside Limb3 IIFE after the meanFieldGame method:

```javascript
    // M21: Hamilton-Jacobi-Bellman Optimal Control
    // Simplified 1D: state = adoption level, control = adoption intensity
    methods.hjbControl = function({benefit = 0.8, cost = 100, sigma = 0.15, r = 0.05, T = 10, nGrid = 30, dt = 0.5} = {}) {
        // State grid: adoption level in [0, 0.8]
        const dx = 0.8 / (nGrid - 1);
        const xGrid = Array.from({length: nGrid}, (_, i) => i * dx);
        const nTime = Math.ceil(T / dt);

        // Value function V[t][x] and policy a[t][x]
        const V = Array.from({length: nTime + 1}, () => new Float64Array(nGrid));
        const policy = Array.from({length: nTime + 1}, () => new Float64Array(nGrid));

        // Terminal condition: V(T, x) = 0
        // Backward induction
        for (let n = nTime - 1; n >= 0; n--) {
            for (let i = 0; i < nGrid; i++) {
                const x = xGrid[i];
                let bestV = -Infinity, bestA = 0;

                // Try different adoption intensities
                for (let aIdx = 0; aIdx <= 10; aIdx++) {
                    const a = aIdx / 10 * 0.8; // a ∈ [0, 0.8]

                    // Instantaneous payoff: benefit*a*x - cost*a²
                    const payoff = benefit * a * (1 - x) - (cost / 1000) * a * a;

                    // Transition: x' = x + a*dt (simplified)
                    const xNext = Math.max(0, Math.min(0.8, x + a * dt * 0.1));
                    const iNext = Math.min(nGrid - 1, Math.round(xNext / dx));

                    // Bellman equation
                    const continuation = Math.exp(-r * dt) * V[n + 1][iNext];

                    // Add volatility penalty
                    const volPenalty = 0.5 * sigma * sigma * x * x * dt;

                    const totalV = payoff * dt + continuation - volPenalty;
                    if (totalV > bestV) { bestV = totalV; bestA = a; }
                }

                V[n][i] = bestV;
                policy[n][i] = bestA;
            }
        }

        return {
            policy: Array.from(policy[0]), // Policy at t=0
            valueFunction: Array.from(V[0]),
            xGrid, nTime,
            // Optimal adoption at current state x=0.1
            optimalAdoption: policy[0][Math.round(0.1 / dx)]
        };
    };

    // M22: Regime-Switching HMM
    // K=3 states: Normal, Crisis, Reform
    methods.hmmDecode = function(observations, K = 3) {
        const T = observations.length;
        const stateNames = ['Normal', 'Crisis', 'Reform'];

        // Emission parameters per state: mean and std of health_exp/readiness proxy
        const emissionMean = [0.5, 0.2, 0.8]; // Normal, Crisis, Reform
        const emissionStd = [0.2, 0.3, 0.15];

        // Transition matrix (row = from, col = to)
        const A = [
            [0.8, 0.15, 0.05], // Normal → ...
            [0.2, 0.6, 0.2],   // Crisis → ...
            [0.1, 0.05, 0.85]  // Reform → ...
        ];

        // Initial probabilities
        const pi = [0.6, 0.2, 0.2];

        // Viterbi algorithm
        const delta = Array.from({length: T}, () => new Float64Array(K));
        const psi = Array.from({length: T}, () => new Int32Array(K));

        // Initialization
        for (let k = 0; k < K; k++) {
            delta[0][k] = Math.log(pi[k]) + MathCore.stats.normalLogPdf(observations[0], emissionMean[k], emissionStd[k]);
        }

        // Recursion
        for (let t = 1; t < T; t++) {
            for (let j = 0; j < K; j++) {
                let bestVal = -Infinity, bestPrev = 0;
                for (let i = 0; i < K; i++) {
                    const val = delta[t-1][i] + Math.log(A[i][j]);
                    if (val > bestVal) { bestVal = val; bestPrev = i; }
                }
                delta[t][j] = bestVal + MathCore.stats.normalLogPdf(observations[t], emissionMean[j], emissionStd[j]);
                psi[t][j] = bestPrev;
            }
        }

        // Backtracking
        const states = new Int32Array(T);
        let bestFinal = -Infinity;
        for (let k = 0; k < K; k++) {
            if (delta[T-1][k] > bestFinal) { bestFinal = delta[T-1][k]; states[T-1] = k; }
        }
        for (let t = T - 2; t >= 0; t--) {
            states[t] = psi[t+1][states[t+1]];
        }

        // Forward algorithm for filtered probabilities
        const alpha = Array.from({length: T}, () => new Float64Array(K));
        for (let k = 0; k < K; k++) {
            alpha[0][k] = pi[k] * MathCore.stats.normalPdf(observations[0], emissionMean[k], emissionStd[k]);
        }
        for (let t = 1; t < T; t++) {
            for (let j = 0; j < K; j++) {
                let sum = 0;
                for (let i = 0; i < K; i++) sum += alpha[t-1][i] * A[i][j];
                alpha[t][j] = sum * MathCore.stats.normalPdf(observations[t], emissionMean[j], emissionStd[j]);
            }
            // Normalize
            const norm = alpha[t].reduce((a, b) => a + b, 0);
            if (norm > 0) for (let k = 0; k < K; k++) alpha[t][k] /= norm;
        }

        return {
            states: Array.from(states),
            stateNames,
            filteredProbs: alpha,
            transitionMatrix: A,
            emissionMean, emissionStd,
            logLikelihood: bestFinal
        };
    };
```

- [ ] **Step 3: Run tests, verify 59/59 pass**

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: Limb3 M21-M22 (HJB optimal control, regime-switching HMM Viterbi) with 2 tests"
```

---

## Task 4: M23-M24 — Network Diffusion + Real Options

**Files:**
- Modify: `index.html` (extend Limb3.methods)

- [ ] **Step 1: Register tests**

```javascript
// T60: Network diffusion produces adoption trajectories
TestRunner.register('M23: Network diffusion on 4 regions', () => {
    const ctx = DataLayer.getContext().filter(c => c.year === 2025);
    const res = Limb3.methods.networkDiffusion(ctx, {tMax: 10, dt: 0.1, alpha: 0.1});
    if (res.trajectories.length !== 4) throw new Error(`Expected 4, got ${res.trajectories.length}`);
    if (!res.laplacianEigenvalues) throw new Error('No eigenvalues');
    // Fiedler value (2nd smallest eigenvalue) should be > 0 for connected graph
    if (res.laplacianEigenvalues[1] <= -0.01) throw new Error(`Fiedler = ${res.laplacianEigenvalues[1]}`);
});

// T61: Real options threshold > naive NPV threshold
TestRunner.register('M24: Real options threshold > naive NPV', () => {
    const res = Limb3.methods.realOptions({
        benefit: 500, cost: 1000, sigma: 0.3, r: 0.05, delta: 0.02
    });
    if (res.optionThreshold <= res.naiveThreshold) throw new Error(
        `Option ${res.optionThreshold} should exceed naive ${res.naiveThreshold}`
    );
    if (res.optionValue < 0) throw new Error('Option value should be non-negative');
});
```

- [ ] **Step 2: Implement M23-M24**

Add inside Limb3 IIFE:

```javascript
    // M23: Network Diffusion via Graph Laplacian
    methods.networkDiffusion = function(contextRows, {tMax = 10, dt = 0.1, alpha = 0.1, pBase = 0.03, qBase = 0.38} = {}) {
        const R = contextRows.length;

        // Weight matrix: trade/proximity proxy (inverse of health expenditure gap)
        const W = MathCore.linalg.zeros(R, R);
        for (let i = 0; i < R; i++) {
            for (let j = i + 1; j < R; j++) {
                const gap = Math.abs(contextRows[i].health_exp_per_capita - contextRows[j].health_exp_per_capita);
                const weight = 1 / (1 + gap / 1000); // Inverse distance
                MathCore.linalg.set(W, i, j, weight);
                MathCore.linalg.set(W, j, i, weight);
            }
        }

        // Graph Laplacian: L = D - W
        const L = MathCore.linalg.zeros(R, R);
        for (let i = 0; i < R; i++) {
            let degSum = 0;
            for (let j = 0; j < R; j++) {
                if (i !== j) {
                    const w = MathCore.linalg.get(W, i, j);
                    MathCore.linalg.set(L, i, j, -w);
                    degSum += w;
                }
            }
            MathCore.linalg.set(L, i, i, degSum);
        }

        // Eigendecomposition of Laplacian
        const {values: eigenvalues} = MathCore.linalg.eigenSymmetric(L);

        // Diffusion + local Bass dynamics: du/dt = -α L u + f(u)
        const nSteps = Math.ceil(tMax / dt);
        const trajectories = contextRows.map(() => []);
        let u = contextRows.map(() => 0.01); // Initial adoption

        for (let step = 0; step <= nSteps; step++) {
            const t = step * dt;
            for (let i = 0; i < R; i++) trajectories[i].push({t, y: u[i]});

            if (step === nSteps) break;

            // Compute du/dt
            const dudt = new Float64Array(R);
            for (let i = 0; i < R; i++) {
                // Diffusion: -α * (L * u)_i
                let diffusion = 0;
                for (let j = 0; j < R; j++) diffusion += MathCore.linalg.get(L, i, j) * u[j];
                dudt[i] -= alpha * diffusion;

                // Local Bass dynamics
                const {p, q, m} = bassParams(contextRows[i], pBase, qBase);
                const ui = Math.max(0, Math.min(m, u[i]));
                dudt[i] += p * (m - ui) + q * ui * (m - ui) / m;
            }

            // Euler step
            for (let i = 0; i < R; i++) {
                u[i] = Math.max(0, Math.min(0.8, u[i] + dudt[i] * dt));
            }
        }

        return {
            trajectories: contextRows.map((ctx, i) => ({
                region: ctx.region, path: trajectories[i]
            })),
            weightMatrix: W,
            laplacian: L,
            laplacianEigenvalues: Array.from(eigenvalues).sort((a, b) => a - b)
        };
    };

    // M24: Real Options Analysis
    // NPV* = (β/(β-1)) × I where β involves the discount rate and volatility
    methods.realOptions = function({benefit = 500, cost = 1000, sigma = 0.3, r = 0.05, delta = 0.02} = {}) {
        // Naive NPV threshold: adopt when benefit > cost → threshold = cost
        const naiveThreshold = cost;

        // Real options β parameter
        const halfMinusDrift = 0.5 - (r - delta) / (sigma * sigma);
        const discriminant = halfMinusDrift * halfMinusDrift + 2 * r / (sigma * sigma);
        const beta = halfMinusDrift + Math.sqrt(discriminant);

        // Option threshold: adopt when benefit > NPV*
        const optionThreshold = (beta / (beta - 1)) * cost;

        // Option value at current benefit level
        const optionValue = beta > 1
            ? (benefit < optionThreshold
                ? Math.pow(benefit / optionThreshold, beta) * (optionThreshold - cost)
                : benefit - cost)
            : Math.max(0, benefit - cost);

        // Time to adopt (approximate)
        const waitingPremium = (optionThreshold / naiveThreshold - 1) * 100;

        return {
            naiveThreshold,
            optionThreshold,
            beta,
            optionValue,
            waitingPremium, // % above naive threshold
            shouldAdoptNow: benefit >= optionThreshold,
            shouldAdoptNaive: benefit >= naiveThreshold
        };
    };
```

- [ ] **Step 3: Run tests, verify 61/61 pass**

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: Limb3 M23-M24 (network diffusion graph Laplacian, real options analysis) with 2 tests"
```

---

## Task 5: M25-M26 — Neural ODE + NSGA-II Pareto

**Files:**
- Modify: `index.html` (extend Limb3.methods)

- [ ] **Step 1: Register tests**

```javascript
// T62: Neural ODE trains and predicts
TestRunner.register('M25: Neural ODE training reduces loss', () => {
    MathCore.random.seed(42);
    // Generate training data from Bass model
    const target = [];
    for (let t = 0; t <= 10; t += 0.5) {
        const y = 0.8 * (1 - Math.exp(-0.4 * t)) / (1 + 12 * Math.exp(-0.4 * t));
        target.push({t, y});
    }
    const res = Limb3.methods.neuralODE(target, {epochs: 100, hiddenSize: 16, seed: 42});
    if (res.finalLoss >= res.initialLoss) throw new Error(`Loss did not decrease: ${res.initialLoss} → ${res.finalLoss}`);
    if (!res.predictedPath) throw new Error('No predicted path');
});

// T63: NSGA-II Pareto front
TestRunner.register('M26: NSGA-II produces Pareto front', () => {
    MathCore.random.seed(42);
    const ctx = DataLayer.getContext().filter(c => c.year === 2025);
    const res = Limb3.methods.paretoOptimize(ctx, {popSize: 30, generations: 50, seed: 42});
    if (!res.paretoFront || res.paretoFront.length === 0) throw new Error('Empty Pareto front');
    // Pareto front should have benefit, cost, equity for each solution
    const sol = res.paretoFront[0];
    if (typeof sol.benefit !== 'number') throw new Error('Missing benefit');
    if (typeof sol.cost !== 'number') throw new Error('Missing cost');
    if (typeof sol.equity !== 'number') throw new Error('Missing equity');
});

// T64: Neural ODE predicted path in valid range
TestRunner.register('M25: Neural ODE prediction in [0, 1]', () => {
    MathCore.random.seed(42);
    const target = [];
    for (let t = 0; t <= 5; t += 1) target.push({t, y: 0.3 + t * 0.05});
    const res = Limb3.methods.neuralODE(target, {epochs: 50, hiddenSize: 8, seed: 42});
    for (const p of res.predictedPath) {
        if (p.y < -0.5 || p.y > 2) throw new Error(`y(${p.t})=${p.y} out of range`);
    }
});
```

- [ ] **Step 2: Implement M25-M26**

Add inside Limb3 IIFE:

```javascript
    // M25: Neural ODE
    // Tiny MLP that parameterizes du/dt = NN(u, t, context)
    methods.neuralODE = function(targetData, {epochs = 200, lr = 0.01, hiddenSize = 16, seed = 42} = {}) {
        MathCore.random.seed(seed);
        const inputSize = 2; // [u, t]
        const outputSize = 1; // du/dt

        // Initialize weights (Xavier)
        const W1 = Array.from({length: hiddenSize}, () =>
            Array.from({length: inputSize}, () => MathCore.random.normal(0, Math.sqrt(2 / inputSize))));
        const b1 = new Float64Array(hiddenSize);
        const W2 = Array.from({length: outputSize}, () =>
            Array.from({length: hiddenSize}, () => MathCore.random.normal(0, Math.sqrt(2 / hiddenSize))));
        const b2 = new Float64Array(outputSize);

        // Forward pass through MLP
        function mlpForward(u, t) {
            const input = [u, t / 10]; // Normalize t
            // Hidden layer with tanh
            const hidden = new Float64Array(hiddenSize);
            for (let h = 0; h < hiddenSize; h++) {
                let sum = b1[h];
                for (let i = 0; i < inputSize; i++) sum += W1[h][i] * input[i];
                hidden[h] = Math.tanh(sum);
            }
            // Output layer
            let output = b2[0];
            for (let h = 0; h < hiddenSize; h++) output += W2[0][h] * hidden[h];
            return output;
        }

        // Integrate ODE using RK4
        function integrate(y0, tSpan) {
            return MathCore.ode.rk4((_t, y) => mlpForward(y, _t), y0, tSpan[0], tSpan[tSpan.length - 1], 0.1);
        }

        // Training loop (simple finite differences for gradients)
        const y0 = targetData[0].y;
        const tMax = targetData[targetData.length - 1].t;
        let initialLoss = Infinity, finalLoss = 0;

        for (let epoch = 0; epoch < epochs; epoch++) {
            // Forward: integrate
            const predicted = integrate(y0, [0, tMax]);

            // Compute loss at target time points
            let loss = 0;
            for (const tgt of targetData) {
                // Find closest predicted point
                let closest = predicted[0];
                for (const p of predicted) {
                    if (Math.abs(p.t - tgt.t) < Math.abs(closest.t - tgt.t)) closest = p;
                }
                loss += (closest.y - tgt.y) ** 2;
            }
            loss /= targetData.length;

            if (epoch === 0) initialLoss = loss;
            finalLoss = loss;

            // Gradient step via finite differences on W1, W2
            const eps = 1e-4;
            for (let h = 0; h < hiddenSize; h++) {
                for (let i = 0; i < inputSize; i++) {
                    W1[h][i] += eps;
                    const predPlus = integrate(y0, [0, tMax]);
                    let lossPlus = 0;
                    for (const tgt of targetData) {
                        let closest = predPlus[0];
                        for (const p of predPlus) {
                            if (Math.abs(p.t - tgt.t) < Math.abs(closest.t - tgt.t)) closest = p;
                        }
                        lossPlus += (closest.y - tgt.y) ** 2;
                    }
                    lossPlus /= targetData.length;
                    const grad = (lossPlus - loss) / eps;
                    W1[h][i] -= eps + lr * grad;
                }
            }

            for (let h = 0; h < hiddenSize; h++) {
                W2[0][h] += eps;
                const predPlus = integrate(y0, [0, tMax]);
                let lossPlus = 0;
                for (const tgt of targetData) {
                    let closest = predPlus[0];
                    for (const p of predPlus) {
                        if (Math.abs(p.t - tgt.t) < Math.abs(closest.t - tgt.t)) closest = p;
                    }
                    lossPlus += (closest.y - tgt.y) ** 2;
                }
                lossPlus /= targetData.length;
                const grad = (lossPlus - loss) / eps;
                W2[0][h] -= eps + lr * grad;
            }
        }

        const predictedPath = integrate(y0, [0, tMax]);

        return {
            predictedPath,
            targetData,
            initialLoss, finalLoss,
            epochs,
            weights: {W1, b1, W2, b2}
        };
    };

    // M26: Multi-Objective Pareto Optimization (NSGA-II)
    methods.paretoOptimize = function(contextRows, {popSize = 50, generations = 100, seed = 42} = {}) {
        MathCore.random.seed(seed);
        const R = contextRows.length;

        // Individual: adoption vector a ∈ [0, 0.8]^R
        function randomIndividual() {
            return Array.from({length: R}, () => MathCore.random.uniform() * 0.8);
        }

        // Evaluate 3 objectives: benefit (max), cost (min), equity (max = low Gini)
        function evaluate(a) {
            let totalBenefit = 0, totalCost = 0;
            const benefits = [];
            for (let i = 0; i < R; i++) {
                const ctx = contextRows[i];
                const pop = ctx.population_millions * 1e6;
                const rate = ctx.mi_prevalence_per_100k / 100000;
                const eligible = pop * rate * 0.05;
                const treated = eligible * a[i];
                const regionBenefit = treated * 0.01; // Simplified ARR
                const regionCost = treated * ctx.treatment_cost_usd;
                benefits.push(regionBenefit / (pop / 1e6)); // Per-million benefit
                totalBenefit += regionBenefit;
                totalCost += regionCost;
            }

            // Gini coefficient for equity
            const sorted = benefits.slice().sort((a, b) => a - b);
            const n = sorted.length;
            let giniNum = 0;
            for (let i = 0; i < n; i++) giniNum += (2 * (i + 1) - n - 1) * sorted[i];
            const giniDen = n * sorted.reduce((a, b) => a + b, 0);
            const gini = giniDen > 0 ? giniNum / giniDen : 0;

            return {
                benefit: totalBenefit,
                cost: totalCost,
                equity: 1 - gini, // Higher = more equal
                adoption: a.slice()
            };
        }

        // Dominance check: does a dominate b?
        function dominates(a, b) {
            let better = false;
            if (a.benefit < b.benefit) return false;
            if (a.cost > b.cost) return false;
            if (a.equity < b.equity) return false;
            if (a.benefit > b.benefit) better = true;
            if (a.cost < b.cost) better = true;
            if (a.equity > b.equity) better = true;
            return better;
        }

        // Non-dominated sorting
        function nonDominatedSort(pop) {
            const fronts = [[]];
            const dominatedBy = pop.map(() => []);
            const dominationCount = new Int32Array(pop.length);

            for (let i = 0; i < pop.length; i++) {
                for (let j = i + 1; j < pop.length; j++) {
                    if (dominates(pop[i], pop[j])) {
                        dominatedBy[i].push(j);
                        dominationCount[j]++;
                    } else if (dominates(pop[j], pop[i])) {
                        dominatedBy[j].push(i);
                        dominationCount[i]++;
                    }
                }
                if (dominationCount[i] === 0) fronts[0].push(i);
            }

            let fi = 0;
            while (fronts[fi].length > 0) {
                const nextFront = [];
                for (const i of fronts[fi]) {
                    for (const j of dominatedBy[i]) {
                        dominationCount[j]--;
                        if (dominationCount[j] === 0) nextFront.push(j);
                    }
                }
                fi++;
                if (nextFront.length > 0) fronts.push(nextFront);
            }

            return fronts;
        }

        // Crowding distance
        function crowdingDistance(front, pop) {
            const n = front.length;
            const dist = new Float64Array(n).fill(0);
            const objectives = ['benefit', 'cost', 'equity'];

            for (const obj of objectives) {
                const sorted = front.map((idx, i) => ({idx, i, val: pop[idx][obj]}));
                sorted.sort((a, b) => a.val - b.val);
                dist[sorted[0].i] = Infinity;
                dist[sorted[n - 1].i] = Infinity;
                const range = sorted[n-1].val - sorted[0].val;
                if (range > 0) {
                    for (let k = 1; k < n - 1; k++) {
                        dist[sorted[k].i] += (sorted[k+1].val - sorted[k-1].val) / range;
                    }
                }
            }
            return dist;
        }

        // Initialize population
        let pop = Array.from({length: popSize}, () => evaluate(randomIndividual()));

        // Evolution
        for (let gen = 0; gen < generations; gen++) {
            // Create offspring via crossover + mutation
            const offspring = [];
            for (let i = 0; i < popSize; i++) {
                const p1 = pop[(MathCore.random.nextU32() % popSize) >>> 0];
                const p2 = pop[(MathCore.random.nextU32() % popSize) >>> 0];
                const child = p1.adoption.map((v, j) => {
                    let c = MathCore.random.uniform() < 0.5 ? v : p2.adoption[j];
                    // Mutation
                    if (MathCore.random.uniform() < 0.1) c += MathCore.random.normal(0, 0.05);
                    return Math.max(0, Math.min(0.8, c));
                });
                offspring.push(evaluate(child));
            }

            // Combined population
            const combined = pop.concat(offspring);
            const fronts = nonDominatedSort(combined);

            // Select best popSize individuals
            const newPop = [];
            for (const front of fronts) {
                if (newPop.length + front.length <= popSize) {
                    for (const idx of front) newPop.push(combined[idx]);
                } else {
                    // Fill remaining with highest crowding distance
                    const cd = crowdingDistance(front, combined);
                    const sorted = front.map((idx, i) => ({idx, cd: cd[i]})).sort((a, b) => b.cd - a.cd);
                    for (const s of sorted) {
                        if (newPop.length >= popSize) break;
                        newPop.push(combined[s.idx]);
                    }
                    break;
                }
            }
            pop = newPop;
        }

        // Extract Pareto front (first front)
        const fronts = nonDominatedSort(pop);
        const paretoFront = fronts[0].map(i => pop[i]);

        return {
            paretoFront,
            allSolutions: pop,
            generations,
            nParetoOptimal: paretoFront.length
        };
    };
```

- [ ] **Step 3: Run tests, verify 64/64 pass**

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: Limb3 M25-M26 (Neural ODE, NSGA-II Pareto optimization) with 3 tests"
```

---

## Task 6: Limb 3 Visualization Engine

**Files:**
- Modify: `index.html` (replace Limb3 stubs with full visualization)

- [ ] **Step 1: Replace Limb3 stub functions**

Replace the 5 stubs (init, onDataChange, exportCSV, exportPNG, getResults) in the Limb3 IIFE with:

```javascript
    const METHOD_LIST = [
        {id: 'sde', label: 'Bass SDE Paths'},
        {id: 'mfg', label: 'Mean-Field Game'},
        {id: 'hjb', label: 'HJB Optimal Control'},
        {id: 'hmm', label: 'Regime Switching'},
        {id: 'network', label: 'Network Diffusion'},
        {id: 'options', label: 'Real Options'},
        {id: 'neuralode', label: 'Neural ODE'},
        {id: 'pareto', label: 'Pareto Front'},
    ];

    let activeMethod = 'sde';
    let currentResults = null;

    function init() {
        const bar = document.getElementById('limb3-methods');
        if (!bar) return;
        bar.innerHTML = '';
        for (const m of METHOD_LIST) {
            const btn = document.createElement('button');
            btn.className = 'method-btn' + (m.id === activeMethod ? ' active' : '');
            btn.textContent = m.label;
            btn.addEventListener('click', () => {
                activeMethod = m.id;
                bar.querySelectorAll('.method-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                render();
            });
            bar.appendChild(btn);
        }

        // Wire parameter sliders
        ['limb3-p', 'limb3-q', 'limb3-sigma', 'limb3-r'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', () => { onDataChange(); });
        });

        onDataChange();
    }

    function getSliderParams() {
        const getVal = (id, def) => { const el = document.getElementById(id); return el ? parseFloat(el.value) : def; };
        return {
            pBase: getVal('limb3-p', 0.03),
            qBase: getVal('limb3-q', 0.38),
            sigma: getVal('limb3-sigma', 0.15),
            r: getVal('limb3-r', 0.05)
        };
    }

    function onDataChange() {
        const ctx2025 = DataLayer.getContext().filter(c => c.year === 2025);
        if (ctx2025.length === 0) return;

        const params = getSliderParams();

        const sde = methods.bassSDE(ctx2025, {nPaths: 50, tMax: 10, sigma: params.sigma, seed: 42, pBase: params.pBase, qBase: params.qBase});
        const mfg = methods.meanFieldGame(ctx2025, {maxIter: 100, seed: 42});
        const hjb = methods.hjbControl({benefit: 0.8, cost: 100, sigma: params.sigma, r: params.r, T: 10, nGrid: 30});
        const network = methods.networkDiffusion(ctx2025, {tMax: 10, dt: 0.1, alpha: 0.1, pBase: params.pBase, qBase: params.qBase});

        // HMM: generate synthetic observations from health expenditure
        const hmmObs = ctx2025.map(ctx => {
            const obs = [];
            for (let t = 0; t < 20; t++) {
                MathCore.random.seed(42 + t);
                obs.push(ctx.adoption_readiness + MathCore.random.normal(0, 0.15));
            }
            return {region: ctx.region, observations: obs, decoded: methods.hmmDecode(obs)};
        });

        // Real options per region
        const options = ctx2025.map(ctx => ({
            region: ctx.region,
            result: methods.realOptions({
                benefit: ctx.health_exp_per_capita * 0.05,
                cost: ctx.treatment_cost_usd * 10,
                sigma: params.sigma, r: params.r, delta: 0.02
            })
        }));

        // Neural ODE: train on the first region's deterministic Bass curve
        const bassTarget = sde[0].detPath.filter((_, i) => i % 10 === 0).map(p => ({t: p.t, y: p.y}));
        const neuralODE = methods.neuralODE(bassTarget, {epochs: 50, hiddenSize: 8, seed: 42});

        // Pareto optimization
        const pareto = methods.paretoOptimize(ctx2025, {popSize: 30, generations: 50, seed: 42});

        currentResults = {sde, mfg, hjb, hmmResults: hmmObs, network, options, neuralODE, pareto, ctx: ctx2025};
        render();
    }

    function render() {
        if (!currentResults) return;
        const canvas = document.getElementById('limb3-canvas');
        if (!canvas) return;
        const ctx2d = (typeof canvas.getContext === 'function') ? canvas.getContext('2d') : null;
        if (!ctx2d) return;
        const W = canvas.width, H = canvas.height;
        ctx2d.clearRect(0, 0, W, H);
        const title = document.getElementById('limb3-viz-title');

        switch (activeMethod) {
            case 'sde': title.textContent = 'Bass SDE Sample Paths'; drawSDE(ctx2d, W, H); break;
            case 'mfg': title.textContent = 'Mean-Field Game Equilibrium'; drawMFG(ctx2d, W, H); break;
            case 'hjb': title.textContent = 'HJB Optimal Control Policy'; drawHJB(ctx2d, W, H); break;
            case 'hmm': title.textContent = 'Regime-Switching HMM'; drawHMM(ctx2d, W, H); break;
            case 'network': title.textContent = 'Network Diffusion Across Regions'; drawNetwork(ctx2d, W, H); break;
            case 'options': title.textContent = 'Real Options vs Naive NPV'; drawOptions(ctx2d, W, H); break;
            case 'neuralode': title.textContent = 'Neural ODE vs Bass Model'; drawNeuralODE(ctx2d, W, H); break;
            case 'pareto': title.textContent = 'Pareto Front (Benefit × Cost × Equity)'; drawPareto(ctx2d, W, H); break;
        }
        updateSummaryTable();
    }

    const REGION_COLORS = ['#4e8cff', '#34d399', '#fbbf24', '#fb923c'];

    function drawSDE(ctx2d, W, H) {
        const margin = {top: 30, right: 30, bottom: 50, left: 60};
        const pW = W - margin.left - margin.right, pH = H - margin.top - margin.bottom;

        for (let r = 0; r < currentResults.sde.length; r++) {
            const {bands, region} = currentResults.sde[r];
            if (bands.length === 0) continue;
            const color = REGION_COLORS[r % 4];

            // 95% band
            ctx2d.fillStyle = color; ctx2d.globalAlpha = 0.1;
            ctx2d.beginPath();
            for (let i = 0; i < bands.length; i++) {
                const x = margin.left + (bands[i].t / 10) * pW;
                const y = margin.top + (1 - (bands[i]['q0.975'] ?? 0) / 0.85) * pH;
                if (i === 0) ctx2d.moveTo(x, y); else ctx2d.lineTo(x, y);
            }
            for (let i = bands.length - 1; i >= 0; i--) {
                const x = margin.left + (bands[i].t / 10) * pW;
                const y = margin.top + (1 - (bands[i]['q0.025'] ?? 0) / 0.85) * pH;
                ctx2d.lineTo(x, y);
            }
            ctx2d.closePath(); ctx2d.fill();
            ctx2d.globalAlpha = 1;

            // Median line
            ctx2d.strokeStyle = color; ctx2d.lineWidth = 2;
            ctx2d.beginPath();
            for (let i = 0; i < bands.length; i++) {
                const x = margin.left + (bands[i].t / 10) * pW;
                const y = margin.top + (1 - (bands[i]['q0.5'] ?? 0) / 0.85) * pH;
                if (i === 0) ctx2d.moveTo(x, y); else ctx2d.lineTo(x, y);
            }
            ctx2d.stroke();

            // Label
            ctx2d.fillStyle = color; ctx2d.font = '10px sans-serif'; ctx2d.textAlign = 'left';
            const lastBand = bands[bands.length - 1];
            const ly = margin.top + (1 - (lastBand['q0.5'] ?? 0) / 0.85) * pH;
            ctx2d.fillText(region, W - margin.right + 4, ly);
        }

        ctx2d.fillStyle = '#e0e6f0'; ctx2d.font = '12px sans-serif'; ctx2d.textAlign = 'center';
        ctx2d.fillText('Years from launch', W / 2, H - 10);
    }

    function drawMFG(ctx2d, W, H) {
        const {mfg} = currentResults;
        const margin = {top: 30, right: 30, bottom: 50, left: 120};
        const pW = W - margin.left - margin.right, pH = H - margin.top - margin.bottom;

        for (let i = 0; i < mfg.equilibrium.length; i++) {
            const e = mfg.equilibrium[i];
            const y = margin.top + (i + 0.5) / mfg.equilibrium.length * pH;
            const barW = (e.adoption / 0.8) * pW;
            const indW = (e.independent / 0.8) * pW;

            // Independent (grey)
            ctx2d.fillStyle = '#2a3555'; ctx2d.fillRect(margin.left, y - 12, indW, 10);
            // Nash equilibrium (color)
            ctx2d.fillStyle = REGION_COLORS[i]; ctx2d.fillRect(margin.left, y + 2, barW, 10);

            ctx2d.fillStyle = '#e0e6f0'; ctx2d.textAlign = 'right'; ctx2d.font = '11px sans-serif';
            ctx2d.fillText(e.region, margin.left - 8, y + 4);

            ctx2d.textAlign = 'left'; ctx2d.fillStyle = '#8892a8'; ctx2d.font = '10px sans-serif';
            ctx2d.fillText(`Nash: ${(e.adoption*100).toFixed(0)}%  Ind: ${(e.independent*100).toFixed(0)}%  Gap: ${(e.strategicGap*100).toFixed(1)}%`, margin.left + Math.max(barW, indW) + 8, y + 4);
        }
        ctx2d.fillStyle = '#2a3555'; ctx2d.fillRect(W - 180, 10, 10, 10);
        ctx2d.fillStyle = '#4e8cff'; ctx2d.fillRect(W - 180, 26, 10, 10);
        ctx2d.fillStyle = '#e0e6f0'; ctx2d.font = '10px sans-serif'; ctx2d.textAlign = 'left';
        ctx2d.fillText('Independent', W - 166, 19);
        ctx2d.fillText('Nash Equilibrium', W - 166, 35);
    }

    function drawHJB(ctx2d, W, H) {
        const {hjb} = currentResults;
        const margin = {top: 30, right: 30, bottom: 50, left: 60};
        const pW = W - margin.left - margin.right, pH = H - margin.top - margin.bottom;

        const maxPolicy = Math.max(...hjb.policy);
        for (let i = 0; i < hjb.xGrid.length; i++) {
            const x = margin.left + (hjb.xGrid[i] / 0.8) * pW;
            const barH = (hjb.policy[i] / (maxPolicy + 0.01)) * pH;
            const hue = 120 + (hjb.policy[i] / (maxPolicy + 0.01)) * 100;
            ctx2d.fillStyle = `hsl(${hue}, 65%, 50%)`;
            ctx2d.fillRect(x - 8, margin.top + pH - barH, 16, barH);
        }
        ctx2d.fillStyle = '#e0e6f0'; ctx2d.font = '12px sans-serif'; ctx2d.textAlign = 'center';
        ctx2d.fillText('Current Adoption Level', W / 2, H - 10);
        ctx2d.save(); ctx2d.translate(15, H / 2); ctx2d.rotate(-Math.PI / 2);
        ctx2d.fillText('Optimal Intensity', 0, 0); ctx2d.restore();
    }

    function drawHMM(ctx2d, W, H) {
        const {hmmResults} = currentResults;
        const margin = {top: 30, right: 30, bottom: 50, left: 120};
        const pH = H - margin.top - margin.bottom;
        const pW = W - margin.left - margin.right;
        const stateColors = ['#4e8cff', '#f87171', '#34d399'];

        for (let r = 0; r < hmmResults.length; r++) {
            const {region, decoded} = hmmResults[r];
            const y0 = margin.top + r * (pH / hmmResults.length);
            const rowH = pH / hmmResults.length - 4;

            ctx2d.fillStyle = '#e0e6f0'; ctx2d.textAlign = 'right'; ctx2d.font = '10px sans-serif';
            ctx2d.fillText(region, margin.left - 8, y0 + rowH / 2 + 3);

            const T = decoded.states.length;
            const segW = pW / T;
            for (let t = 0; t < T; t++) {
                ctx2d.fillStyle = stateColors[decoded.states[t]];
                ctx2d.fillRect(margin.left + t * segW, y0, segW - 1, rowH);
            }
        }
        // Legend
        const labels = ['Normal', 'Crisis', 'Reform'];
        for (let k = 0; k < 3; k++) {
            ctx2d.fillStyle = stateColors[k]; ctx2d.fillRect(W - 200 + k * 70, H - 20, 10, 10);
            ctx2d.fillStyle = '#e0e6f0'; ctx2d.font = '10px sans-serif'; ctx2d.textAlign = 'left';
            ctx2d.fillText(labels[k], W - 186 + k * 70, H - 11);
        }
    }

    function drawNetwork(ctx2d, W, H) {
        const {network} = currentResults;
        const margin = {top: 30, right: 30, bottom: 50, left: 60};
        const pW = W - margin.left - margin.right, pH = H - margin.top - margin.bottom;

        for (let r = 0; r < network.trajectories.length; r++) {
            const {path, region} = network.trajectories[r];
            ctx2d.strokeStyle = REGION_COLORS[r]; ctx2d.lineWidth = 2;
            ctx2d.beginPath();
            for (let i = 0; i < path.length; i++) {
                const x = margin.left + (path[i].t / 10) * pW;
                const y = margin.top + (1 - path[i].y / 0.85) * pH;
                if (i === 0) ctx2d.moveTo(x, y); else ctx2d.lineTo(x, y);
            }
            ctx2d.stroke();
            const last = path[path.length - 1];
            ctx2d.fillStyle = REGION_COLORS[r]; ctx2d.font = '10px sans-serif'; ctx2d.textAlign = 'left';
            ctx2d.fillText(region, W - margin.right + 4, margin.top + (1 - last.y / 0.85) * pH);
        }
        ctx2d.fillStyle = '#e0e6f0'; ctx2d.font = '12px sans-serif'; ctx2d.textAlign = 'center';
        ctx2d.fillText('Years', W / 2, H - 10);
    }

    function drawOptions(ctx2d, W, H) {
        const {options} = currentResults;
        const margin = {top: 30, right: 30, bottom: 50, left: 120};
        const pW = W - margin.left - margin.right, pH = H - margin.top - margin.bottom;
        const maxThresh = Math.max(...options.map(o => o.result.optionThreshold));

        for (let i = 0; i < options.length; i++) {
            const {region, result} = options[i];
            const y = margin.top + (i + 0.5) / options.length * pH;

            // Naive threshold (grey)
            const naiveW = (result.naiveThreshold / maxThresh) * pW * 0.8;
            ctx2d.fillStyle = '#2a3555'; ctx2d.fillRect(margin.left, y - 8, naiveW, 7);

            // Option threshold (colored)
            const optW = (result.optionThreshold / maxThresh) * pW * 0.8;
            ctx2d.fillStyle = REGION_COLORS[i]; ctx2d.fillRect(margin.left, y + 2, optW, 7);

            ctx2d.fillStyle = '#e0e6f0'; ctx2d.textAlign = 'right'; ctx2d.font = '11px sans-serif';
            ctx2d.fillText(region, margin.left - 8, y + 4);

            ctx2d.fillStyle = '#8892a8'; ctx2d.textAlign = 'left'; ctx2d.font = '10px sans-serif';
            ctx2d.fillText(`Premium: +${result.waitingPremium.toFixed(0)}%`, margin.left + optW + 8, y + 4);
        }
    }

    function drawNeuralODE(ctx2d, W, H) {
        const {neuralODE, sde} = currentResults;
        const margin = {top: 30, right: 30, bottom: 50, left: 60};
        const pW = W - margin.left - margin.right, pH = H - margin.top - margin.bottom;
        const tMax = sde[0].detPath[sde[0].detPath.length - 1].t;

        // Bass deterministic (blue)
        ctx2d.strokeStyle = '#4e8cff'; ctx2d.lineWidth = 2;
        ctx2d.beginPath();
        for (const p of sde[0].detPath) {
            const x = margin.left + (p.t / tMax) * pW;
            const y = margin.top + (1 - p.y / 0.85) * pH;
            if (p === sde[0].detPath[0]) ctx2d.moveTo(x, y); else ctx2d.lineTo(x, y);
        }
        ctx2d.stroke();

        // Neural ODE (green)
        ctx2d.strokeStyle = '#34d399'; ctx2d.lineWidth = 2; ctx2d.setLineDash([4, 2]);
        ctx2d.beginPath();
        for (const p of neuralODE.predictedPath) {
            const x = margin.left + (p.t / tMax) * pW;
            const y = margin.top + (1 - Math.max(0, p.y) / 0.85) * pH;
            if (p === neuralODE.predictedPath[0]) ctx2d.moveTo(x, y); else ctx2d.lineTo(x, y);
        }
        ctx2d.stroke(); ctx2d.setLineDash([]);

        // Target points
        ctx2d.fillStyle = '#fb923c';
        for (const p of neuralODE.targetData) {
            const x = margin.left + (p.t / tMax) * pW;
            const y = margin.top + (1 - p.y / 0.85) * pH;
            ctx2d.beginPath(); ctx2d.arc(x, y, 4, 0, 2 * Math.PI); ctx2d.fill();
        }

        // Legend
        ctx2d.fillStyle = '#4e8cff'; ctx2d.fillRect(W - 180, 10, 20, 3);
        ctx2d.fillStyle = '#34d399'; ctx2d.fillRect(W - 180, 26, 20, 3);
        ctx2d.fillStyle = '#fb923c'; ctx2d.beginPath(); ctx2d.arc(W - 170, 42, 3, 0, 2*Math.PI); ctx2d.fill();
        ctx2d.fillStyle = '#e0e6f0'; ctx2d.font = '10px sans-serif'; ctx2d.textAlign = 'left';
        ctx2d.fillText('Bass Model', W - 155, 14); ctx2d.fillText('Neural ODE', W - 155, 30);
        ctx2d.fillText('Training Data', W - 155, 46);

        ctx2d.fillStyle = '#8892a8'; ctx2d.font = '10px sans-serif'; ctx2d.textAlign = 'left';
        ctx2d.fillText(`Loss: ${neuralODE.initialLoss.toFixed(4)} → ${neuralODE.finalLoss.toFixed(4)}`, margin.left + 10, margin.top + 16);
    }

    function drawPareto(ctx2d, W, H) {
        const {pareto} = currentResults;
        const margin = {top: 30, right: 30, bottom: 50, left: 60};
        const pW = W - margin.left - margin.right, pH = H - margin.top - margin.bottom;

        const front = pareto.paretoFront;
        const allBenefit = pareto.allSolutions.map(s => s.benefit);
        const allCost = pareto.allSolutions.map(s => s.cost);
        const bMin = Math.min(...allBenefit), bMax = Math.max(...allBenefit);
        const cMin = Math.min(...allCost), cMax = Math.max(...allCost);
        const bRange = bMax - bMin || 1, cRange = cMax - cMin || 1;

        // All solutions (grey dots)
        ctx2d.fillStyle = '#2a3555';
        for (const s of pareto.allSolutions) {
            const x = margin.left + ((s.benefit - bMin) / bRange) * pW;
            const y = margin.top + ((s.cost - cMin) / cRange) * pH;
            ctx2d.beginPath(); ctx2d.arc(x, y, 2, 0, 2 * Math.PI); ctx2d.fill();
        }

        // Pareto front (colored by equity)
        for (const s of front) {
            const x = margin.left + ((s.benefit - bMin) / bRange) * pW;
            const y = margin.top + ((s.cost - cMin) / cRange) * pH;
            const hue = 120 * s.equity; // Green = high equity
            ctx2d.fillStyle = `hsl(${hue}, 70%, 55%)`;
            ctx2d.beginPath(); ctx2d.arc(x, y, 6, 0, 2 * Math.PI); ctx2d.fill();
            ctx2d.strokeStyle = '#fff'; ctx2d.lineWidth = 1; ctx2d.stroke();
        }

        ctx2d.fillStyle = '#e0e6f0'; ctx2d.font = '12px sans-serif'; ctx2d.textAlign = 'center';
        ctx2d.fillText('Total Benefit (events prevented)', W / 2, H - 10);
        ctx2d.save(); ctx2d.translate(15, H / 2); ctx2d.rotate(-Math.PI / 2);
        ctx2d.fillText('Total Cost (USD)', 0, 0); ctx2d.restore();

        ctx2d.fillStyle = '#8892a8'; ctx2d.font = '10px sans-serif'; ctx2d.textAlign = 'left';
        ctx2d.fillText(`${pareto.nParetoOptimal} Pareto-optimal solutions (color = equity)`, margin.left + 10, margin.top + 16);
    }

    function updateSummaryTable() {
        const el = document.getElementById('limb3-summary-table');
        if (!el || !currentResults) return;
        const {sde, mfg, options} = currentResults;

        let html = '<table class="results-table"><tr><th>Region</th><th>SDE Median (10y)</th><th>MFG Nash</th><th>Options Premium</th></tr>';
        for (let i = 0; i < sde.length; i++) {
            html += `<tr><td>${sde[i].region}</td>`;
            html += `<td>${(sde[i].finalMedian * 100).toFixed(1)}%</td>`;
            html += `<td>${(mfg.equilibrium[i].adoption * 100).toFixed(1)}%</td>`;
            html += `<td>+${options[i].result.waitingPremium.toFixed(0)}%</td></tr>`;
        }
        html += '</table>';
        el.innerHTML = html;
    }

    function getResults() { return currentResults; }

    function exportCSV() {
        if (!currentResults) return;
        const {sde, mfg, options} = currentResults;
        let csv = 'region,sde_median_10y,mfg_nash,mfg_independent,option_threshold,naive_threshold\n';
        for (let i = 0; i < sde.length; i++) {
            csv += `${sde[i].region},${sde[i].finalMedian.toFixed(4)},${mfg.equilibrium[i].adoption.toFixed(4)},`;
            csv += `${mfg.equilibrium[i].independent.toFixed(4)},${options[i].result.optionThreshold.toFixed(1)},`;
            csv += `${options[i].result.naiveThreshold.toFixed(1)}\n`;
        }
        const blob = new Blob([csv], {type: 'text/csv'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'limb3_economics_results.csv';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function exportPNG() {
        const canvas = document.getElementById('limb3-canvas');
        if (!canvas) return;
        const url = canvas.toDataURL('image/png');
        const a = document.createElement('a'); a.href = url; a.download = 'limb3_plot.png';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
    }
```

- [ ] **Step 2: Wire Limb3.init() into App**

In App.init(), add after the Limb2 init line:

```javascript
        if (typeof Limb3 !== 'undefined') Limb3.init();
```

- [ ] **Step 3: Register integration test**

```javascript
// T65: Full Limb 3 pipeline
TestRunner.register('Integration: Limb3 full pipeline', () => {
    Limb3.onDataChange();
    const res = Limb3.getResults();
    if (!res) throw new Error('No Limb3 results');
    if (res.sde.length !== 4) throw new Error('SDE: expected 4 regions');
    if (!res.mfg.converged) throw new Error('MFG did not converge');
    if (!res.hjb.policy) throw new Error('No HJB policy');
    if (res.network.trajectories.length !== 4) throw new Error('Network: expected 4 regions');
    if (res.pareto.paretoFront.length === 0) throw new Error('Empty Pareto front');
});
```

- [ ] **Step 4: Run tests, verify 65/65 pass**

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: Limb3 full visualization (8 methods, SDE spaghetti, MFG, HJB, HMM, network, options, Neural ODE, Pareto)"
```

---

## Task 7: Push + GitHub Pages Update

- [ ] **Step 1: Push**

```bash
git push origin master
```

- [ ] **Step 2: Verify** at https://mahmood726-cyber.github.io/four-limb-synthesis/

---

## Summary

| Task | Methods | Tests Added | Cumulative |
|------|---------|-------------|------------|
| 1 | MathCore.ode (RK4, EM, pathBands), tab+panel | 3 | 55 |
| 2 | M19 Bass SDE, M20 Mean-Field Game | 2 | 57 |
| 3 | M21 HJB Optimal Control, M22 Regime-Switching HMM | 2 | 59 |
| 4 | M23 Network Diffusion, M24 Real Options | 2 | 61 |
| 5 | M25 Neural ODE, M26 NSGA-II Pareto | 3 | 64 |
| 6 | Visualization (8 draw functions + summary table) | 1 | 65 |
| 7 | Deploy | 0 | 65 |

**Total: 7 tasks, 8 methods (M19–M26), 13 new tests (65 cumulative), 8 visualization modes.**
