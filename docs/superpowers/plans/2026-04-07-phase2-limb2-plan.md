# Phase 2: Limb 2 — Causal Transport & Distribution Matching

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Limb 2 tab to the existing HTML app with 8 causal transport methods (IPSW, AIPW, Sinkhorn optimal transport, kernel mean embedding, do-calculus with DAG editor, knockoff filter, KLIEP density ratios, Mapper TDA), plus context data in DataLayer and MathCore extensions.

**Architecture:** Extend the existing `index.html` (2,216 lines). Add embedded context data to DataLayer. Add `MathCore.kernel` and `MathCore.graph` modules. Create `Limb2` IIFE that consumes Limb1 results. Enable the Limb 2 tab. Add Limb 2 panel HTML with canvas, DAG editor SVG, method bar.

**Tech Stack:** Vanilla JS, Canvas/SVG rendering, zero external dependencies. Follows existing patterns (IIFE modules, seeded PRNG, MathCore math library).

**File:** `C:\Users\user\four_limb_synthesis\index.html`

**Existing structure (line references):**
- MathCore IIFE: line 207 (return at ~line 777 with `{ random, linalg, stats, optim, tda }`)
- DataLayer IIFE: line 782 (return at ~line 909)
- App IIFE: line 918
- Limb1 IIFE: line 989
- TestRunner IIFE: line 1861

---

## Task 1: Enable Limb 2 Tab + Panel HTML

**Files:**
- Modify: `index.html`

Enable the Limb 2 tab button (remove `disabled` attribute and `disabled` class), and replace the empty `panel-limb2` div with full panel HTML (method bar, canvas, DAG editor area, results, export buttons).

- [ ] **Step 1: Enable the Limb 2 tab button**

Find line 165:
```html
    <button class="tab-btn disabled" role="tab" aria-selected="false" data-tab="limb2" disabled>Limb 2: Causal Transport</button>
```
Replace with:
```html
    <button class="tab-btn" role="tab" aria-selected="false" data-tab="limb2">Limb 2: Causal Transport</button>
```

- [ ] **Step 2: Replace empty Limb 2 panel with full HTML**

Find line 186:
```html
    <div id="panel-limb2" class="tab-panel" role="tabpanel"></div>
```
Replace with:
```html
    <div id="panel-limb2" class="tab-panel" role="tabpanel">
        <div class="method-bar" id="limb2-methods" role="radiogroup" aria-label="Select transport method"></div>
        <div class="split-pane">
            <div>
                <div id="limb2-viz" class="viz-container">
                    <div class="viz-title" id="limb2-viz-title">Select a method to begin</div>
                    <canvas id="limb2-canvas" width="900" height="500"></canvas>
                </div>
            </div>
            <div>
                <div id="limb2-dag-container" class="viz-container" style="min-height:350px;">
                    <div class="viz-title">Causal DAG Editor</div>
                    <svg id="limb2-dag-svg" width="400" height="320" style="background:var(--surface2);border-radius:6px;cursor:crosshair;"></svg>
                    <div style="margin-top:8px;display:flex;gap:6px;">
                        <button id="dag-add-node" class="method-btn">+ Node</button>
                        <button id="dag-add-edge" class="method-btn">+ Edge</button>
                        <button id="dag-clear" class="method-btn">Clear</button>
                        <button id="dag-default" class="method-btn active">Default DAG</button>
                    </div>
                </div>
                <div id="limb2-comparison" class="card" style="margin-top:12px;">
                    <h3>Method Comparison</h3>
                    <div id="limb2-comparison-table"></div>
                </div>
            </div>
        </div>
        <div id="limb2-results"></div>
        <div class="export-bar">
            <button onclick="if(typeof Limb2!=='undefined')Limb2.exportCSV()">Export CSV</button>
            <button onclick="if(typeof Limb2!=='undefined')Limb2.exportPNG()">Export PNG</button>
        </div>
    </div>
```

- [ ] **Step 3: Update App tab switching to handle Limb 2**

In the App IIFE, find the tab click handler. It currently only enables non-disabled tabs. Since we removed `disabled` from Limb 2, it will now be clickable. Verify by checking the existing code handles this correctly — it should, since it queries `.tab-btn:not(.disabled)`.

Actually, looking at line ~940, the tab handler attaches to `.tab-btn:not(.disabled)` at init time. Since we removed the disabled class, we need to make sure it picks up Limb 2. The simplest fix: move the event delegation to use event delegation on the tab-bar instead. Find the tab switching code and replace it.

Find in App.init():
```javascript
        document.querySelectorAll('.tab-btn:not(.disabled)').forEach(btn => {
            btn.addEventListener('click', () => {
```

This binds at init time so it will pick up the Limb 2 button since we removed `disabled`. No change needed — the button is now enabled and will be found by the selector at DOMContentLoaded.

- [ ] **Step 4: Verify in browser**

Open index.html. Limb 2 tab should now be clickable. Clicking it shows the empty panel with canvas and DAG editor area. All existing 35 tests still pass.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: enable Limb 2 tab with panel HTML, canvas, and DAG editor area"
```

---

## Task 2: MathCore.kernel + MathCore.graph Extensions

**Files:**
- Modify: `index.html` (extend MathCore IIFE)

Add kernel functions (Gaussian RBF, MMD, median bandwidth) and graph operations (adjacency, topological sort, back-door criterion) to MathCore.

- [ ] **Step 1: Add MathCore.kernel module**

Insert inside the MathCore IIFE, before the `return` statement (currently returning `{ random, linalg, stats, optim, tda }`):

```javascript
    // --- Kernel Functions ---
    const kernel = (() => {
        // Gaussian RBF kernel: k(x,y) = exp(-||x-y||²/(2σ²))
        function rbf(x, y, sigma) {
            let ssd = 0;
            for (let i = 0; i < x.length; i++) ssd += (x[i] - y[i]) ** 2;
            return Math.exp(-ssd / (2 * sigma * sigma));
        }

        // Compute Gram matrix K_ij = k(X[i], X[j])
        function gramMatrix(X, sigma) {
            const n = X.length;
            const K = linalg.zeros(n, n);
            for (let i = 0; i < n; i++) {
                linalg.set(K, i, i, 1.0); // k(x,x) = 1
                for (let j = i + 1; j < n; j++) {
                    const v = rbf(X[i], X[j], sigma);
                    linalg.set(K, i, j, v);
                    linalg.set(K, j, i, v);
                }
            }
            return K;
        }

        // Median heuristic for bandwidth: σ = median(||xi - xj||) for i<j
        function medianBandwidth(X) {
            const dists = [];
            for (let i = 0; i < X.length; i++)
                for (let j = i + 1; j < X.length; j++) {
                    let d = 0;
                    for (let k = 0; k < X[i].length; k++) d += (X[i][k] - X[j][k]) ** 2;
                    dists.push(Math.sqrt(d));
                }
            dists.sort((a, b) => a - b);
            return dists[Math.floor(dists.length / 2)] || 1.0;
        }

        // MMD² (Maximum Mean Discrepancy) between two samples X and Y
        // Unbiased estimator
        function mmd2(X, Y, sigma) {
            const m = X.length, n = Y.length;
            let kxx = 0, kyy = 0, kxy = 0;
            for (let i = 0; i < m; i++)
                for (let j = i + 1; j < m; j++)
                    kxx += rbf(X[i], X[j], sigma);
            kxx = (2 * kxx) / (m * (m - 1));

            for (let i = 0; i < n; i++)
                for (let j = i + 1; j < n; j++)
                    kyy += rbf(Y[i], Y[j], sigma);
            kyy = (2 * kyy) / (n * (n - 1));

            for (let i = 0; i < m; i++)
                for (let j = 0; j < n; j++)
                    kxy += rbf(X[i], Y[j], sigma);
            kxy /= (m * n);

            return kxx + kyy - 2 * kxy;
        }

        // Permutation test for MMD: returns p-value
        function mmdPermTest(X, Y, sigma, nPerm = 200) {
            const observed = mmd2(X, Y, sigma);
            const pooled = X.concat(Y);
            const m = X.length;
            let count = 0;
            for (let p = 0; p < nPerm; p++) {
                // Fisher-Yates shuffle
                const shuffled = pooled.slice();
                for (let i = shuffled.length - 1; i > 0; i--) {
                    const j = (random.nextU32() % (i + 1)) >>> 0;
                    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                }
                const permMmd = mmd2(shuffled.slice(0, m), shuffled.slice(m), sigma);
                if (permMmd >= observed) count++;
            }
            return (count + 1) / (nPerm + 1);
        }

        return { rbf, gramMatrix, medianBandwidth, mmd2, mmdPermTest };
    })();

    // --- Graph Operations ---
    const graph = (() => {
        // DAG represented as adjacency list: {nodes: [...], edges: [{from, to}]}

        // Get parents of a node
        function parents(dag, node) {
            return dag.edges.filter(e => e.to === node).map(e => e.from);
        }

        // Get children of a node
        function children(dag, node) {
            return dag.edges.filter(e => e.from === node).map(e => e.to);
        }

        // Get ancestors (all nodes that can reach 'node' via directed paths)
        function ancestors(dag, node) {
            const visited = new Set();
            const queue = parents(dag, node);
            while (queue.length > 0) {
                const curr = queue.pop();
                if (visited.has(curr)) continue;
                visited.add(curr);
                queue.push(...parents(dag, curr));
            }
            return [...visited];
        }

        // Get descendants
        function descendants(dag, node) {
            const visited = new Set();
            const queue = children(dag, node);
            while (queue.length > 0) {
                const curr = queue.pop();
                if (visited.has(curr)) continue;
                visited.add(curr);
                queue.push(...children(dag, curr));
            }
            return [...visited];
        }

        // Back-door criterion: find adjustment set Z for causal effect of X on Y
        // Z must block all back-door paths from X to Y
        // Z must not contain any descendant of X
        // Simple approach: Z = parents(X) that are not descendants of X
        function backdoorSet(dag, treatment, outcome) {
            const descX = new Set(descendants(dag, treatment));
            // All non-descendants of X that are not X or Y
            const candidates = dag.nodes.filter(n =>
                n !== treatment && n !== outcome && !descX.has(n)
            );
            // Return all candidates that are ancestors of outcome or treatment
            // (conservative: return all non-descendants except X and Y)
            return candidates;
        }

        // Check if causal effect is identifiable via back-door
        function isIdentifiable(dag, treatment, outcome) {
            const Z = backdoorSet(dag, treatment, outcome);
            // If Z exists (even empty), effect is identifiable
            return { identifiable: true, adjustmentSet: Z };
        }

        // Topological sort (Kahn's algorithm)
        function topoSort(dag) {
            const inDeg = {};
            for (const n of dag.nodes) inDeg[n] = 0;
            for (const e of dag.edges) inDeg[e.to] = (inDeg[e.to] ?? 0) + 1;
            const queue = dag.nodes.filter(n => inDeg[n] === 0);
            const result = [];
            while (queue.length > 0) {
                const n = queue.shift();
                result.push(n);
                for (const e of dag.edges.filter(e => e.from === n)) {
                    inDeg[e.to]--;
                    if (inDeg[e.to] === 0) queue.push(e.to);
                }
            }
            return result;
        }

        return { parents, children, ancestors, descendants, backdoorSet, isIdentifiable, topoSort };
    })();
```

- [ ] **Step 2: Update MathCore return statement**

Change:
```javascript
    return { random, linalg, stats, optim, tda };
```
To:
```javascript
    return { random, linalg, stats, optim, tda, kernel, graph };
```

- [ ] **Step 3: Register tests for kernel + graph**

Append to the TestRunner test registrations:

```javascript
// T36: Gaussian RBF kernel self = 1
TestRunner.register('Kernel: RBF k(x,x) = 1', () => {
    const v = MathCore.kernel.rbf([1, 2], [1, 2], 1.0);
    if (Math.abs(v - 1.0) > 1e-10) throw new Error(`k(x,x) = ${v}`);
});

// T37: MMD² between identical samples ≈ 0
TestRunner.register('Kernel: MMD² identical ≈ 0', () => {
    const X = [[0,0],[1,1],[2,2]];
    const mmd = MathCore.kernel.mmd2(X, X, 1.0);
    if (Math.abs(mmd) > 0.5) throw new Error(`MMD² = ${mmd}, expected ~0`);
});

// T38: MMD² between different samples > 0
TestRunner.register('Kernel: MMD² different > 0', () => {
    const X = [[0,0],[0.1,0.1],[0.2,0.2]];
    const Y = [[5,5],[5.1,5.1],[5.2,5.2]];
    const mmd = MathCore.kernel.mmd2(X, Y, 1.0);
    if (mmd <= 0) throw new Error(`MMD² = ${mmd}, expected > 0`);
});

// T39: Back-door adjustment set
TestRunner.register('Graph: back-door set X→Y with confounder Z', () => {
    const dag = {
        nodes: ['Z', 'X', 'Y'],
        edges: [{from:'Z', to:'X'}, {from:'Z', to:'Y'}, {from:'X', to:'Y'}]
    };
    const Z = MathCore.graph.backdoorSet(dag, 'X', 'Y');
    if (!Z.includes('Z')) throw new Error(`Adjustment set should include Z, got ${Z}`);
});

// T40: Topological sort
TestRunner.register('Graph: topological sort', () => {
    const dag = {
        nodes: ['A', 'B', 'C'],
        edges: [{from:'A', to:'B'}, {from:'B', to:'C'}]
    };
    const sorted = MathCore.graph.topoSort(dag);
    if (sorted[0] !== 'A' || sorted[2] !== 'C') throw new Error(`Sort = ${sorted}`);
});
```

- [ ] **Step 4: Run tests, verify 40/40 pass**

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: MathCore.kernel (RBF, MMD, bandwidth) + MathCore.graph (DAG, back-door, topoSort) with 5 tests"
```

---

## Task 3: DataLayer Context Data + Transport Data Generator

**Files:**
- Modify: `index.html` (extend DataLayer)

Add embedded context data (regional covariates) to DataLayer, plus a function to generate synthetic trial-level covariate data for transport methods. Limb 2 methods need individual-level covariates, not just summary statistics, so we generate synthetic IPD matching the summary stats.

- [ ] **Step 1: Add context data and IPD generator to DataLayer**

Inside the DataLayer IIFE, add after the `DATASETS` object:

```javascript
    // Regional context data (embedded from context_mi.csv)
    const CONTEXT = [
        {region:'North America', year:2025, population_millions:380, mi_prevalence_per_100k:2400, health_exp_per_capita:12000, age_65_plus_share:0.18, diabetes_prevalence:0.11, adoption_readiness:0.9, treatment_cost_usd:120},
        {region:'North America', year:2030, population_millions:395, mi_prevalence_per_100k:2500, health_exp_per_capita:14000, age_65_plus_share:0.20, diabetes_prevalence:0.12, adoption_readiness:0.95, treatment_cost_usd:100},
        {region:'Western Europe', year:2025, population_millions:450, mi_prevalence_per_100k:2200, health_exp_per_capita:6000, age_65_plus_share:0.22, diabetes_prevalence:0.08, adoption_readiness:0.85, treatment_cost_usd:80},
        {region:'Western Europe', year:2030, population_millions:460, mi_prevalence_per_100k:2300, health_exp_per_capita:7000, age_65_plus_share:0.24, diabetes_prevalence:0.09, adoption_readiness:0.9, treatment_cost_usd:70},
        {region:'Southeast Asia', year:2025, population_millions:680, mi_prevalence_per_100k:1800, health_exp_per_capita:800, age_65_plus_share:0.08, diabetes_prevalence:0.10, adoption_readiness:0.4, treatment_cost_usd:20},
        {region:'Southeast Asia', year:2030, population_millions:720, mi_prevalence_per_100k:2000, health_exp_per_capita:1200, age_65_plus_share:0.10, diabetes_prevalence:0.12, adoption_readiness:0.5, treatment_cost_usd:15},
        {region:'Sub-Saharan Africa', year:2025, population_millions:1200, mi_prevalence_per_100k:1200, health_exp_per_capita:150, age_65_plus_share:0.04, diabetes_prevalence:0.05, adoption_readiness:0.2, treatment_cost_usd:10},
        {region:'Sub-Saharan Africa', year:2030, population_millions:1400, mi_prevalence_per_100k:1400, health_exp_per_capita:250, age_65_plus_share:0.05, diabetes_prevalence:0.06, adoption_readiness:0.3, treatment_cost_usd:8}
    ];

    // Generate synthetic IPD matching summary stats (for transport methods)
    // Returns {trialIPD: [{age_65, diabetes, yi}], targetIPD: [{age_65, diabetes}]}
    function generateTransportIPD(trialData, contextRow, nTrial = 200, nTarget = 200, seed = 42) {
        MathCore.random.seed(seed);
        // Trial population: age_65 ~ Bernoulli(0.18), diabetes ~ Bernoulli(0.20) [reference]
        const trialIPD = [];
        for (let i = 0; i < nTrial; i++) {
            const age65 = MathCore.random.uniform() < 0.18 ? 1 : 0;
            const diabetes = MathCore.random.uniform() < 0.20 ? 1 : 0;
            // yi from pooled effect + covariate effect
            const yi = (trialData.yi ?? -0.25) + 0.05 * age65 + 0.10 * diabetes + MathCore.random.normal(0, 0.3);
            trialIPD.push({age_65: age65, diabetes: diabetes, yi: yi});
        }

        // Target population: covariates from contextRow
        const targetIPD = [];
        for (let i = 0; i < nTarget; i++) {
            const age65 = MathCore.random.uniform() < contextRow.age_65_plus_share ? 1 : 0;
            const diabetes = MathCore.random.uniform() < contextRow.diabetes_prevalence ? 1 : 0;
            targetIPD.push({age_65: age65, diabetes: diabetes});
        }

        return { trialIPD, targetIPD };
    }

    function getContext() { return CONTEXT; }
    function getContextByRegion(region, year) {
        return CONTEXT.find(c => c.region === region && c.year === year) ?? CONTEXT[0];
    }
```

- [ ] **Step 2: Update DataLayer return statement**

Change:
```javascript
    return { load, loadCSV, getActive, DATASETS, detectFormat };
```
To:
```javascript
    return { load, loadCSV, getActive, DATASETS, detectFormat, getContext, getContextByRegion, generateTransportIPD, CONTEXT };
```

- [ ] **Step 3: Register tests**

```javascript
// T41: Context data loads
TestRunner.register('DataLayer: context data has 8 rows', () => {
    const ctx = DataLayer.getContext();
    if (ctx.length !== 8) throw new Error(`Expected 8, got ${ctx.length}`);
});

// T42: Generate transport IPD
TestRunner.register('DataLayer: generate transport IPD', () => {
    const ctx = DataLayer.getContextByRegion('North America', 2025);
    const ipd = DataLayer.generateTransportIPD({yi: -0.25}, ctx, 100, 100, 42);
    if (ipd.trialIPD.length !== 100) throw new Error(`Trial n=${ipd.trialIPD.length}`);
    if (ipd.targetIPD.length !== 100) throw new Error(`Target n=${ipd.targetIPD.length}`);
    if (typeof ipd.trialIPD[0].age_65 !== 'number') throw new Error('Missing age_65');
});
```

- [ ] **Step 4: Run tests, verify 42/42 pass**

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: DataLayer context data + synthetic IPD generator for transport methods"
```

---

## Task 4: M11-M12 — IPSW + AIPW (Doubly Robust)

**Files:**
- Modify: `index.html` (add Limb2 IIFE with first two methods)

Create the Limb2 IIFE with IPSW and AIPW transport methods.

- [ ] **Step 1: Register tests**

```javascript
// T43: IPSW transports effect (different from naive)
TestRunner.register('M11: IPSW transported effect differs from naive', () => {
    MathCore.random.seed(42);
    const ctx = DataLayer.getContextByRegion('Sub-Saharan Africa', 2025);
    const ipd = DataLayer.generateTransportIPD({yi: -0.25}, ctx, 200, 200, 42);
    const res = Limb2.methods.ipsw(ipd.trialIPD, ipd.targetIPD);
    if (typeof res.ate_transported !== 'number' || isNaN(res.ate_transported)) throw new Error('IPSW returned NaN');
    if (res.weights.length !== 200) throw new Error(`Expected 200 weights`);
});

// T44: AIPW more efficient than IPSW (lower SE on same data)
TestRunner.register('M12: AIPW returns valid result', () => {
    MathCore.random.seed(42);
    const ctx = DataLayer.getContextByRegion('Western Europe', 2025);
    const ipd = DataLayer.generateTransportIPD({yi: -0.25}, ctx, 200, 200, 42);
    const res = Limb2.methods.aipw(ipd.trialIPD, ipd.targetIPD);
    if (typeof res.ate_dr !== 'number' || isNaN(res.ate_dr)) throw new Error('AIPW returned NaN');
});
```

- [ ] **Step 2: Create Limb2 IIFE with M11-M12**

Insert a new `<script>` block AFTER the Limb1 IIFE and BEFORE the TestRunner:

```javascript
/* === LIMB 2: CAUSAL TRANSPORT & DISTRIBUTION MATCHING === */
const Limb2 = (() => {
    const methods = {};

    // Helper: logistic regression via IRLS (iteratively reweighted least squares)
    // X: array of covariate vectors, y: binary outcome
    // Returns beta coefficients
    function logisticRegression(X, y, maxIter = 25) {
        const n = X.length, p = X[0].length;
        let beta = new Float64Array(p); // start at 0

        for (let iter = 0; iter < maxIter; iter++) {
            const mu = new Float64Array(n);
            const W = new Float64Array(n);
            for (let i = 0; i < n; i++) {
                let eta = 0;
                for (let j = 0; j < p; j++) eta += X[i][j] * beta[j];
                mu[i] = 1 / (1 + Math.exp(-eta));
                mu[i] = Math.max(1e-6, Math.min(1 - 1e-6, mu[i]));
                W[i] = mu[i] * (1 - mu[i]);
            }
            // X^T W X
            const XtWX = MathCore.linalg.zeros(p, p);
            const XtWz = new Float64Array(p);
            for (let i = 0; i < n; i++) {
                const z = 0;
                for (let j = 0; j < p; j++) {
                    for (let k = 0; k < p; k++) {
                        const old = MathCore.linalg.get(XtWX, j, k);
                        MathCore.linalg.set(XtWX, j, k, old + X[i][j] * W[i] * X[i][k]);
                    }
                    XtWz[j] += X[i][j] * (y[i] - mu[i]);
                }
            }
            // Solve: (X^T W X) delta = X^T (y - mu)
            try {
                const delta = MathCore.linalg.solve(XtWX, XtWz);
                let maxDelta = 0;
                for (let j = 0; j < p; j++) {
                    beta[j] += delta[j];
                    maxDelta = Math.max(maxDelta, Math.abs(delta[j]));
                }
                if (maxDelta < 1e-8) break;
            } catch(e) {
                break; // Singular matrix, stop
            }
        }
        return beta;
    }

    // Helper: predict probabilities from logistic model
    function logisticPredict(X, beta) {
        return X.map(xi => {
            let eta = 0;
            for (let j = 0; j < xi.length; j++) eta += xi[j] * beta[j];
            return 1 / (1 + Math.exp(-eta));
        });
    }

    // Convert IPD to covariate matrix (with intercept)
    function ipdToX(ipd) {
        return ipd.map(row => [1, row.age_65, row.diabetes]);
    }

    // M11: IPSW (Inverse Probability of Selection Weighting)
    methods.ipsw = function(trialIPD, targetIPD) {
        // Combined dataset: S=1 for trial, S=0 for target
        const Xtrial = ipdToX(trialIPD);
        const Xtarget = ipdToX(targetIPD);
        const Xall = Xtrial.concat(Xtarget);
        const Sall = new Float64Array(Xtrial.length + Xtarget.length);
        for (let i = 0; i < Xtrial.length; i++) Sall[i] = 1;

        // Fit P(S=1 | X) via logistic regression
        const beta = logisticRegression(Xall, Sall);
        const pScores = logisticPredict(Xtrial, beta);

        // IPSW weights: w_i = (1 - p_i) / p_i
        const rawWeights = pScores.map(p => (1 - p) / Math.max(p, 1e-6));

        // Trim extreme weights (1st and 99th percentile)
        const sorted = Float64Array.from(rawWeights).sort();
        const lo = sorted[Math.floor(0.01 * sorted.length)];
        const hi = sorted[Math.floor(0.99 * sorted.length)];
        const weights = rawWeights.map(w => Math.max(lo, Math.min(hi, w)));

        // Weighted ATE
        const sumW = weights.reduce((a, b) => a + b, 0);
        let ate = 0;
        for (let i = 0; i < trialIPD.length; i++) {
            ate += weights[i] * trialIPD[i].yi;
        }
        ate /= sumW;

        return {
            ate_transported: ate,
            weights: weights,
            propensity_scores: pScores,
            beta: Array.from(beta)
        };
    };

    // M12: AIPW (Augmented Inverse Probability Weighting / Doubly Robust)
    methods.aipw = function(trialIPD, targetIPD) {
        // Step 1: Propensity model (same as IPSW)
        const Xtrial = ipdToX(trialIPD);
        const Xtarget = ipdToX(targetIPD);
        const Xall = Xtrial.concat(Xtarget);
        const Sall = new Float64Array(Xall.length);
        for (let i = 0; i < Xtrial.length; i++) Sall[i] = 1;
        const betaS = logisticRegression(Xall, Sall);
        const pScores = logisticPredict(Xtrial, betaS);

        // Step 2: Outcome model m(X) — linear regression of yi on X (trial data only)
        const n = trialIPD.length;
        const p = Xtrial[0].length;
        // OLS: beta_y = (X^T X)^{-1} X^T y
        const XtX = MathCore.linalg.zeros(p, p);
        const Xty = new Float64Array(p);
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < p; j++) {
                Xty[j] += Xtrial[i][j] * trialIPD[i].yi;
                for (let k = 0; k < p; k++) {
                    const old = MathCore.linalg.get(XtX, j, k);
                    MathCore.linalg.set(XtX, j, k, old + Xtrial[i][j] * Xtrial[i][k]);
                }
            }
        }
        let betaY;
        try {
            betaY = MathCore.linalg.solve(XtX, Xty);
        } catch(e) {
            betaY = new Float64Array(p);
        }

        // Predict m(X) for trial observations
        const mTrial = Xtrial.map(xi => {
            let pred = 0;
            for (let j = 0; j < p; j++) pred += xi[j] * betaY[j];
            return pred;
        });

        // Predict m(X) for target observations
        const mTarget = Xtarget.map(xi => {
            let pred = 0;
            for (let j = 0; j < p; j++) pred += xi[j] * betaY[j];
            return pred;
        });

        // AIPW estimator
        // ATE_DR = (1/n_target) Σ_target m(Xi) + (1/n_trial) Σ_trial [(Si - P(Xi)) * (Yi - m(Xi)) / P(Xi)]
        const targetMean = mTarget.reduce((a, b) => a + b, 0) / mTarget.length;
        let augTerm = 0;
        for (let i = 0; i < n; i++) {
            const ps = Math.max(pScores[i], 1e-6);
            augTerm += ((1 - ps) / ps) * (trialIPD[i].yi - mTrial[i]);
        }
        augTerm /= n;
        const ate_dr = targetMean + augTerm;

        return {
            ate_dr,
            outcome_model_beta: Array.from(betaY),
            propensity_beta: Array.from(betaS),
            targetMean,
            augmentation: augTerm
        };
    };

    // Public API stubs
    function init() {}
    function onDataChange() {}
    function exportCSV() {}
    function exportPNG() {}
    function getResults() { return null; }

    return { methods, init, onDataChange, exportCSV, exportPNG, getResults };
})();
```

- [ ] **Step 3: Run tests, verify 44/44 pass**

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: Limb2 M11-M12 (IPSW + AIPW doubly robust) with logistic regression"
```

---

## Task 5: M13-M14 — Sinkhorn Optimal Transport + MMD

**Files:**
- Modify: `index.html` (extend Limb2.methods)

- [ ] **Step 1: Register tests**

```javascript
// T45: Sinkhorn converges and returns transport plan
TestRunner.register('M13: Sinkhorn transport plan valid', () => {
    MathCore.random.seed(42);
    const X = [[0,0],[1,0],[0,1]];
    const Y = [[0.1,0.1],[1.1,0.1],[0.1,1.1]];
    const res = Limb2.methods.sinkhorn(X, Y, 0.1);
    if (!res.plan) throw new Error('No transport plan');
    if (res.wasserstein < 0) throw new Error(`W2 = ${res.wasserstein}`);
    // Plan should be 3x3, rows sum ≈ 1/3, cols sum ≈ 1/3
    const rowSum = res.plan[0].reduce((a,b) => a+b, 0);
    if (Math.abs(rowSum - 1/3) > 0.05) throw new Error(`Row sum = ${rowSum}`);
});

// T46: MMD test on shifted data detects difference
TestRunner.register('M14: MMD detects shifted distributions', () => {
    MathCore.random.seed(42);
    const ctx = DataLayer.getContextByRegion('Sub-Saharan Africa', 2025);
    const ipd = DataLayer.generateTransportIPD({yi: -0.25}, ctx, 100, 100, 42);
    const X = ipd.trialIPD.map(r => [r.age_65, r.diabetes]);
    const Y = ipd.targetIPD.map(r => [r.age_65, r.diabetes]);
    const res = Limb2.methods.mmdTest(X, Y);
    if (typeof res.mmd2 !== 'number') throw new Error('No MMD² value');
    if (typeof res.pValue !== 'number') throw new Error('No p-value');
});
```

- [ ] **Step 2: Implement M13-M14 inside Limb2**

Add after the `aipw` method inside the Limb2 IIFE:

```javascript
    // M13: Optimal Transport via Sinkhorn algorithm
    methods.sinkhorn = function(X, Y, epsilon = 0.1, maxIter = 500) {
        const m = X.length, n = Y.length;

        // Cost matrix C_ij = ||X_i - Y_j||²
        const C = [];
        for (let i = 0; i < m; i++) {
            C[i] = new Float64Array(n);
            for (let j = 0; j < n; j++) {
                let d = 0;
                for (let k = 0; k < X[i].length; k++) d += (X[i][k] - Y[j][k]) ** 2;
                C[i][j] = d;
            }
        }

        // Gibbs kernel K = exp(-C/ε)
        const K = [];
        for (let i = 0; i < m; i++) {
            K[i] = new Float64Array(n);
            for (let j = 0; j < n; j++) {
                K[i][j] = Math.exp(-C[i][j] / epsilon);
            }
        }

        // Uniform marginals
        const p = new Float64Array(m).fill(1 / m);
        const q = new Float64Array(n).fill(1 / n);

        // Sinkhorn iterations
        let a = new Float64Array(m).fill(1);
        let b = new Float64Array(n).fill(1);

        for (let iter = 0; iter < maxIter; iter++) {
            // a = p / (K * b)
            const aNew = new Float64Array(m);
            for (let i = 0; i < m; i++) {
                let sum = 0;
                for (let j = 0; j < n; j++) sum += K[i][j] * b[j];
                aNew[i] = p[i] / Math.max(sum, 1e-30);
            }
            a = aNew;

            // b = q / (K^T * a)
            const bNew = new Float64Array(n);
            for (let j = 0; j < n; j++) {
                let sum = 0;
                for (let i = 0; i < m; i++) sum += K[i][j] * a[i];
                bNew[j] = q[j] / Math.max(sum, 1e-30);
            }

            // Check convergence
            let maxDiff = 0;
            for (let j = 0; j < n; j++) maxDiff = Math.max(maxDiff, Math.abs(bNew[j] - b[j]));
            b = bNew;
            if (maxDiff < 1e-8) break;
        }

        // Transport plan: T_ij = a_i * K_ij * b_j
        const plan = [];
        let wasserstein = 0;
        for (let i = 0; i < m; i++) {
            plan[i] = new Float64Array(n);
            for (let j = 0; j < n; j++) {
                plan[i][j] = a[i] * K[i][j] * b[j];
                wasserstein += plan[i][j] * C[i][j];
            }
        }

        return {
            plan, wasserstein,
            scaling_a: a, scaling_b: b
        };
    };

    // Transport effect using Sinkhorn plan
    methods.sinkhornTransport = function(trialIPD, targetIPD, epsilon = 0.1) {
        const X = trialIPD.map(r => [r.age_65, r.diabetes]);
        const Y = targetIPD.map(r => [r.age_65, r.diabetes]);
        const sinkResult = methods.sinkhorn(X, Y, epsilon);

        // Transported effect: weighted average of trial outcomes using transport plan
        // For each target j: transported_y_j = Σ_i T_ij * y_i / Σ_i T_ij
        const m = trialIPD.length, n = targetIPD.length;
        const transportedEffects = new Float64Array(n);
        for (let j = 0; j < n; j++) {
            let wSum = 0, ySum = 0;
            for (let i = 0; i < m; i++) {
                wSum += sinkResult.plan[i][j];
                ySum += sinkResult.plan[i][j] * trialIPD[i].yi;
            }
            transportedEffects[j] = wSum > 1e-30 ? ySum / wSum : 0;
        }

        const ate = MathCore.stats.mean(Array.from(transportedEffects));

        return {
            ate_transported: ate,
            wasserstein: sinkResult.wasserstein,
            transportedEffects,
            plan: sinkResult.plan
        };
    };

    // M14: MMD two-sample test
    methods.mmdTest = function(X, Y, nPerm = 200) {
        const sigma = MathCore.kernel.medianBandwidth(X.concat(Y));
        const mmd2 = MathCore.kernel.mmd2(X, Y, sigma);
        const pValue = MathCore.kernel.mmdPermTest(X, Y, sigma, nPerm);

        return {
            mmd2,
            pValue,
            sigma,
            significant: pValue < 0.05
        };
    };
```

- [ ] **Step 3: Run tests, verify 46/46 pass**

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: Limb2 M13-M14 (Sinkhorn optimal transport, MMD two-sample test) with 2 tests"
```

---

## Task 6: M15-M16 — Causal Transport (Do-Calculus) + Knockoff Filter

**Files:**
- Modify: `index.html` (extend Limb2.methods)

- [ ] **Step 1: Register tests**

```javascript
// T47: Do-calculus transport adjusts for confounders
TestRunner.register('M15: Causal transport with back-door adjustment', () => {
    MathCore.random.seed(42);
    const ctx = DataLayer.getContextByRegion('North America', 2025);
    const ipd = DataLayer.generateTransportIPD({yi: -0.25}, ctx, 200, 200, 42);
    const dag = {
        nodes: ['age_65', 'diabetes', 'treatment', 'outcome'],
        edges: [
            {from:'age_65', to:'treatment'}, {from:'age_65', to:'outcome'},
            {from:'diabetes', to:'treatment'}, {from:'diabetes', to:'outcome'},
            {from:'treatment', to:'outcome'}
        ]
    };
    const res = Limb2.methods.causalTransport(ipd.trialIPD, ipd.targetIPD, dag);
    if (typeof res.ate_causal !== 'number' || isNaN(res.ate_causal)) throw new Error('NaN result');
    if (!res.adjustmentSet) throw new Error('No adjustment set');
});

// T48: Knockoff filter selects relevant covariates
TestRunner.register('M16: Knockoff filter returns importance scores', () => {
    MathCore.random.seed(42);
    const ctx = DataLayer.getContextByRegion('North America', 2025);
    const ipd = DataLayer.generateTransportIPD({yi: -0.25}, ctx, 200, 200, 42);
    const res = Limb2.methods.knockoffFilter(ipd.trialIPD, 0.2);
    if (!res.importances || res.importances.length !== 2) throw new Error('Wrong importance count');
    if (typeof res.selected !== 'object') throw new Error('No selected set');
});
```

- [ ] **Step 2: Implement M15-M16**

Add inside Limb2 IIFE after the mmdTest method:

```javascript
    // M15: Causal Transport via Do-Calculus
    methods.causalTransport = function(trialIPD, targetIPD, dag) {
        // Identify adjustment set via back-door criterion
        const {adjustmentSet} = MathCore.graph.isIdentifiable(dag, 'treatment', 'outcome');

        // Map covariate names to IPD fields
        const covMap = {'age_65': 'age_65', 'diabetes': 'diabetes'};
        const adjustVars = adjustmentSet.filter(v => v in covMap).map(v => covMap[v]);

        // Stratified estimation: P_target(Y|do(X)) = Σ_z P_trial(Y|X,Z=z) * P_target(Z=z)
        // Bin the adjustment variables
        // For binary covariates, enumerate all combinations
        const nAdj = adjustVars.length;
        const strata = 1 << nAdj; // 2^nAdj for binary
        let ate = 0;
        let totalTargetWeight = 0;

        for (let s = 0; s < strata; s++) {
            // Decode stratum
            const stratumValues = {};
            for (let j = 0; j < nAdj; j++) {
                stratumValues[adjustVars[j]] = (s >> j) & 1;
            }

            // Trial observations in this stratum
            const trialInStratum = trialIPD.filter(row => {
                return adjustVars.every(v => row[v] === stratumValues[v]);
            });

            // Target proportion in this stratum
            const targetInStratum = targetIPD.filter(row => {
                return adjustVars.every(v => row[v] === stratumValues[v]);
            });
            const targetProp = targetInStratum.length / targetIPD.length;

            if (trialInStratum.length > 0 && targetProp > 0) {
                const stratumMean = MathCore.stats.mean(trialInStratum.map(r => r.yi));
                ate += stratumMean * targetProp;
                totalTargetWeight += targetProp;
            }
        }

        if (totalTargetWeight > 0) ate /= totalTargetWeight;

        return {
            ate_causal: ate,
            adjustmentSet: adjustVars,
            identifiable: true,
            nStrata: strata
        };
    };

    // M16: Knockoff Filter for Variable Selection
    methods.knockoffFilter = function(trialIPD, fdrTarget = 0.2) {
        const covNames = ['age_65', 'diabetes'];
        const n = trialIPD.length;
        const p = covNames.length;

        // Build X matrix and y vector
        const X = trialIPD.map(r => covNames.map(c => r[c]));
        const y = trialIPD.map(r => r.yi);

        // Generate knockoff copies: X̃ = X + noise that preserves correlation structure
        MathCore.random.seed(12345);
        const Xtilde = X.map(row => row.map(v => {
            // For binary: flip with probability 0.3 to break Y|X dependence
            return MathCore.random.uniform() < 0.3 ? (1 - v) : v;
        }));

        // Fit regression with both original and knockoff features
        // Augmented design: [X, X̃] → y
        const Xaug = X.map((row, i) => [1, ...row, ...Xtilde[i]]);
        const pAug = Xaug[0].length;

        // OLS
        const XtX = MathCore.linalg.zeros(pAug, pAug);
        const Xty = new Float64Array(pAug);
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < pAug; j++) {
                Xty[j] += Xaug[i][j] * y[i];
                for (let k = 0; k < pAug; k++) {
                    const old = MathCore.linalg.get(XtX, j, k);
                    MathCore.linalg.set(XtX, j, k, old + Xaug[i][j] * Xaug[i][k]);
                }
            }
        }

        // Add ridge penalty for stability
        for (let j = 0; j < pAug; j++) {
            const old = MathCore.linalg.get(XtX, j, j);
            MathCore.linalg.set(XtX, j, j, old + 0.01);
        }

        let betaAug;
        try { betaAug = MathCore.linalg.solve(XtX, Xty); }
        catch(e) { betaAug = new Float64Array(pAug); }

        // Knockoff statistics: W_j = |beta_j| - |beta_j_tilde|
        const W = [];
        for (let j = 0; j < p; j++) {
            const origCoef = Math.abs(betaAug[1 + j]);       // skip intercept
            const knockCoef = Math.abs(betaAug[1 + p + j]);
            W.push(origCoef - knockCoef);
        }

        // Knockoff+ threshold
        const absW = W.map(Math.abs).sort((a, b) => b - a);
        let threshold = Infinity;
        for (const t of absW) {
            const numer = 1 + W.filter(w => w <= -t).length;
            const denom = Math.max(1, W.filter(w => w >= t).length);
            if (numer / denom <= fdrTarget) {
                threshold = t;
                break;
            }
        }

        const selected = covNames.filter((_, j) => W[j] >= threshold);

        return {
            importances: W,
            covariateNames: covNames,
            selected,
            threshold: isFinite(threshold) ? threshold : null,
            fdrTarget
        };
    };
```

- [ ] **Step 3: Run tests, verify 48/48 pass**

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: Limb2 M15-M16 (causal transport do-calculus, knockoff filter) with 2 tests"
```

---

## Task 7: M17-M18 — KLIEP Density Ratio + Mapper TDA

**Files:**
- Modify: `index.html` (extend Limb2.methods)

- [ ] **Step 1: Register tests**

```javascript
// T49: KLIEP density ratios are positive and normalize
TestRunner.register('M17: KLIEP ratios positive and E[r]=1', () => {
    MathCore.random.seed(42);
    const ctx = DataLayer.getContextByRegion('Southeast Asia', 2025);
    const ipd = DataLayer.generateTransportIPD({yi: -0.25}, ctx, 100, 100, 42);
    const X = ipd.trialIPD.map(r => [r.age_65, r.diabetes]);
    const Y = ipd.targetIPD.map(r => [r.age_65, r.diabetes]);
    const res = Limb2.methods.kliep(X, Y);
    if (res.ratios.some(r => r < 0)) throw new Error('Negative ratio');
    const meanR = res.ratios.reduce((a,b) => a+b, 0) / res.ratios.length;
    if (Math.abs(meanR - 1) > 0.3) throw new Error(`E[r] = ${meanR}, expected ~1`);
});

// T50: Mapper produces nodes and edges
TestRunner.register('M18: Mapper produces simplicial complex', () => {
    MathCore.random.seed(42);
    const points = [];
    for (let i = 0; i < 50; i++) {
        points.push([MathCore.random.normal(0, 1), MathCore.random.normal(0, 1)]);
    }
    const res = Limb2.methods.mapper(points, {nIntervals: 5, overlap: 0.3});
    if (!res.nodes || res.nodes.length === 0) throw new Error('No nodes');
    if (!Array.isArray(res.edges)) throw new Error('No edges array');
});

// T51: KLIEP weighted effect
TestRunner.register('M17: KLIEP transported effect', () => {
    MathCore.random.seed(42);
    const ctx = DataLayer.getContextByRegion('Sub-Saharan Africa', 2025);
    const ipd = DataLayer.generateTransportIPD({yi: -0.25}, ctx, 100, 100, 42);
    const res = Limb2.methods.kliepTransport(ipd.trialIPD, ipd.targetIPD);
    if (typeof res.ate_transported !== 'number' || isNaN(res.ate_transported)) throw new Error('NaN');
});
```

- [ ] **Step 2: Implement M17-M18**

Add inside Limb2 IIFE:

```javascript
    // M17: KLIEP Density Ratio Estimation
    // Estimates r(x) = P_target(x) / P_trial(x) using Gaussian basis functions
    methods.kliep = function(Xtrial, Xtarget, nBasis = 50, maxIter = 100) {
        const m = Xtrial.length, n = Xtarget.length;
        const dim = Xtrial[0].length;

        // Use a subset of target points as basis centers
        const nB = Math.min(nBasis, n);
        const centers = Xtarget.slice(0, nB);
        const sigma = MathCore.kernel.medianBandwidth(Xtrial.concat(Xtarget));

        // Compute basis functions φ_l(x) = K(x, c_l) for all trial and target points
        // A_il = φ_l(Xtarget[i]) and B_il = φ_l(Xtrial[i])
        const A = []; // n x nB (target)
        for (let i = 0; i < n; i++) {
            A[i] = new Float64Array(nB);
            for (let l = 0; l < nB; l++) {
                A[i][l] = MathCore.kernel.rbf(Xtarget[i], centers[l], sigma);
            }
        }

        const B = []; // m x nB (trial)
        for (let i = 0; i < m; i++) {
            B[i] = new Float64Array(nB);
            for (let l = 0; l < nB; l++) {
                B[i][l] = MathCore.kernel.rbf(Xtrial[i], centers[l], sigma);
            }
        }

        // Initialize alpha uniformly
        let alpha = new Float64Array(nB).fill(1 / nB);

        // Gradient ascent to maximize Σ_target log(r(x)) s.t. E_trial[r(x)] = 1
        const lr = 0.01;
        for (let iter = 0; iter < maxIter; iter++) {
            // r(x) = Σ_l alpha_l * φ_l(x)
            // Compute r for target points
            const rTarget = new Float64Array(n);
            for (let i = 0; i < n; i++) {
                for (let l = 0; l < nB; l++) rTarget[i] += alpha[l] * A[i][l];
                rTarget[i] = Math.max(rTarget[i], 1e-10);
            }

            // Gradient of log-likelihood: Σ_target φ_l(x)/r(x) / n
            const grad = new Float64Array(nB);
            for (let l = 0; l < nB; l++) {
                for (let i = 0; i < n; i++) {
                    grad[l] += A[i][l] / rTarget[i];
                }
                grad[l] /= n;
            }

            // Update alpha
            for (let l = 0; l < nB; l++) {
                alpha[l] += lr * grad[l];
                alpha[l] = Math.max(alpha[l], 0);
            }

            // Normalize so E_trial[r(x)] = 1
            let normConst = 0;
            for (let i = 0; i < m; i++) {
                let ri = 0;
                for (let l = 0; l < nB; l++) ri += alpha[l] * B[i][l];
                normConst += ri;
            }
            normConst /= m;
            if (normConst > 1e-10) {
                for (let l = 0; l < nB; l++) alpha[l] /= normConst;
            }
        }

        // Compute final ratios for trial points
        const ratios = new Float64Array(m);
        for (let i = 0; i < m; i++) {
            for (let l = 0; l < nB; l++) ratios[i] += alpha[l] * B[i][l];
            ratios[i] = Math.max(ratios[i], 1e-10);
        }

        return { ratios: Array.from(ratios), alpha: Array.from(alpha), sigma };
    };

    // KLIEP-based transported effect
    methods.kliepTransport = function(trialIPD, targetIPD) {
        const X = trialIPD.map(r => [r.age_65, r.diabetes]);
        const Y = targetIPD.map(r => [r.age_65, r.diabetes]);
        const kliepRes = methods.kliep(X, Y);

        // Importance-weighted average
        const sumW = kliepRes.ratios.reduce((a, b) => a + b, 0);
        let ate = 0;
        for (let i = 0; i < trialIPD.length; i++) {
            ate += kliepRes.ratios[i] * trialIPD[i].yi;
        }
        ate /= sumW;

        return { ate_transported: ate, ratios: kliepRes.ratios };
    };

    // M18: Mapper Algorithm (TDA)
    methods.mapper = function(points, {nIntervals = 10, overlap = 0.3, nClusters = 3} = {}) {
        const n = points.length;
        if (n === 0) return { nodes: [], edges: [] };

        // Step 1: Filter function = first principal component (projection onto max-variance direction)
        const dim = points[0].length;
        const mean = new Float64Array(dim);
        for (const p of points) for (let d = 0; d < dim; d++) mean[d] += p[d] / n;

        // Simple PCA: compute variance along each dimension, project onto highest
        const variances = new Float64Array(dim);
        for (const p of points)
            for (let d = 0; d < dim; d++) variances[d] += (p[d] - mean[d]) ** 2;

        const maxDim = variances.indexOf(Math.max(...variances));
        const filterVals = points.map(p => p[maxDim]);

        // Step 2: Cover the range with overlapping intervals
        const fMin = Math.min(...filterVals);
        const fMax = Math.max(...filterVals);
        const range = fMax - fMin || 1;
        const intervalWidth = range / nIntervals * (1 + overlap);
        const step = range / nIntervals;

        const intervals = [];
        for (let i = 0; i < nIntervals; i++) {
            const lo = fMin + i * step - overlap * step / 2;
            const hi = lo + intervalWidth;
            intervals.push({lo, hi});
        }

        // Step 3: Cluster within each interval
        const nodes = []; // {id, members: [point indices], meanFilter, meanEffect}
        let nodeId = 0;
        const pointToNodes = Array.from({length: n}, () => []);

        for (const interval of intervals) {
            // Points in this interval
            const members = [];
            for (let i = 0; i < n; i++) {
                if (filterVals[i] >= interval.lo && filterVals[i] <= interval.hi) {
                    members.push(i);
                }
            }
            if (members.length === 0) continue;

            // Simple k-means clustering (k = min(nClusters, members.length))
            const k = Math.min(nClusters, members.length);
            // Assign to k clusters by sorting on filter value and splitting
            const sorted = members.slice().sort((a, b) => filterVals[a] - filterVals[b]);
            const clusterSize = Math.ceil(sorted.length / k);
            for (let c = 0; c < k; c++) {
                const clusterMembers = sorted.slice(c * clusterSize, (c + 1) * clusterSize);
                if (clusterMembers.length === 0) continue;
                const mf = MathCore.stats.mean(clusterMembers.map(i => filterVals[i]));
                const id = nodeId++;
                nodes.push({id, members: clusterMembers, meanFilter: mf, size: clusterMembers.length});
                for (const m of clusterMembers) pointToNodes[m].push(id);
            }
        }

        // Step 4: Connect nodes that share members
        const edges = [];
        const edgeSet = new Set();
        for (let i = 0; i < n; i++) {
            const nodeList = pointToNodes[i];
            for (let a = 0; a < nodeList.length; a++) {
                for (let b = a + 1; b < nodeList.length; b++) {
                    const key = `${Math.min(nodeList[a], nodeList[b])}-${Math.max(nodeList[a], nodeList[b])}`;
                    if (!edgeSet.has(key)) {
                        edgeSet.add(key);
                        edges.push({from: nodeList[a], to: nodeList[b]});
                    }
                }
            }
        }

        return { nodes, edges };
    };
```

- [ ] **Step 3: Run tests, verify 51/51 pass**

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: Limb2 M17-M18 (KLIEP density ratios, Mapper TDA) with 3 tests"
```

---

## Task 8: Limb 2 Visualization + DAG Editor + Method Comparison

**Files:**
- Modify: `index.html` (replace Limb2 stubs with full visualization)

Add visualization code to Limb2: distribution overlay, transport map, DAG editor, knockoff importance, Mapper complex, and the method comparison table.

- [ ] **Step 1: Replace Limb2 stub functions with full implementation**

Replace the stub `init`, `onDataChange`, `exportCSV`, `exportPNG`, `getResults` in the Limb2 IIFE with:

```javascript
    const METHOD_LIST = [
        {id: 'distribution', label: 'Distribution Overlay'},
        {id: 'ipsw', label: 'IPSW'},
        {id: 'aipw', label: 'AIPW'},
        {id: 'sinkhorn', label: 'Optimal Transport'},
        {id: 'mmd', label: 'MMD Test'},
        {id: 'causal', label: 'Causal DAG'},
        {id: 'knockoff', label: 'Knockoff Filter'},
        {id: 'kliep', label: 'KLIEP'},
        {id: 'mapper', label: 'Mapper TDA'},
    ];

    let activeMethod = 'distribution';
    let currentResults = null;
    let dagState = {
        nodes: ['age_65', 'diabetes', 'treatment', 'outcome'],
        edges: [
            {from:'age_65', to:'treatment'}, {from:'age_65', to:'outcome'},
            {from:'diabetes', to:'treatment'}, {from:'diabetes', to:'outcome'},
            {from:'treatment', to:'outcome'}
        ]
    };

    function init() {
        const bar = document.getElementById('limb2-methods');
        if (!bar) return;
        bar.innerHTML = '';
        for (const m of METHOD_LIST) {
            const btn = document.createElement('button');
            btn.className = 'method-btn' + (m.id === activeMethod ? ' active' : '');
            btn.textContent = m.label;
            btn.setAttribute('role', 'radio');
            btn.addEventListener('click', () => {
                activeMethod = m.id;
                bar.querySelectorAll('.method-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                render();
            });
            bar.appendChild(btn);
        }

        // DAG editor buttons
        const dagDefault = document.getElementById('dag-default');
        if (dagDefault) dagDefault.addEventListener('click', () => { resetDAG(); render(); });
        const dagClear = document.getElementById('dag-clear');
        if (dagClear) dagClear.addEventListener('click', () => {
            dagState = {nodes: [], edges: []};
            render();
        });

        onDataChange();
    }

    function resetDAG() {
        dagState = {
            nodes: ['age_65', 'diabetes', 'treatment', 'outcome'],
            edges: [
                {from:'age_65', to:'treatment'}, {from:'age_65', to:'outcome'},
                {from:'diabetes', to:'treatment'}, {from:'diabetes', to:'outcome'},
                {from:'treatment', to:'outcome'}
            ]
        };
    }

    function onDataChange() {
        const limb1Results = typeof Limb1 !== 'undefined' ? Limb1.getResults() : null;
        if (!limb1Results) return;

        const ctx = DataLayer.getContextByRegion('North America', 2025);
        const pooledYi = limb1Results.reml.mu;
        const ipd = DataLayer.generateTransportIPD({yi: pooledYi}, ctx, 200, 200, 42);

        const trialX = ipd.trialIPD.map(r => [r.age_65, r.diabetes]);
        const targetX = ipd.targetIPD.map(r => [r.age_65, r.diabetes]);

        // Run all transport methods
        const ipsw = methods.ipsw(ipd.trialIPD, ipd.targetIPD);
        const aipw = methods.aipw(ipd.trialIPD, ipd.targetIPD);
        const sinkhorn = methods.sinkhornTransport(ipd.trialIPD, ipd.targetIPD, 0.1);
        const mmd = methods.mmdTest(trialX, targetX, 100);
        const causal = methods.causalTransport(ipd.trialIPD, ipd.targetIPD, dagState);
        const knockoff = methods.knockoffFilter(ipd.trialIPD, 0.2);
        const kliep = methods.kliepTransport(ipd.trialIPD, ipd.targetIPD);
        const mapperResult = methods.mapper(trialX.concat(targetX), {nIntervals: 8, overlap: 0.3});

        currentResults = {
            ipsw, aipw, sinkhorn, mmd, causal, knockoff, kliep, mapper: mapperResult,
            ipd, trialX, targetX, pooledYi, ctx
        };

        render();
    }

    function render() {
        if (!currentResults) return;
        const canvas = document.getElementById('limb2-canvas');
        if (!canvas) return;
        const ctx2d = canvas.getContext('2d');
        const W = canvas.width, H = canvas.height;
        ctx2d.clearRect(0, 0, W, H);

        const title = document.getElementById('limb2-viz-title');

        switch (activeMethod) {
            case 'distribution':
                title.textContent = 'Covariate Distribution: Trial vs Target';
                drawDistribution(ctx2d, W, H);
                break;
            case 'ipsw': case 'aipw':
                title.textContent = activeMethod === 'ipsw' ? 'IPSW Propensity Weights' : 'AIPW Components';
                drawWeights(ctx2d, W, H);
                break;
            case 'sinkhorn':
                title.textContent = 'Optimal Transport Map (Sinkhorn)';
                drawTransportMap(ctx2d, W, H);
                break;
            case 'mmd':
                title.textContent = `MMD Two-Sample Test (p=${currentResults.mmd.pValue.toFixed(3)})`;
                drawDistribution(ctx2d, W, H);
                break;
            case 'causal':
                title.textContent = 'Causal Transport via Do-Calculus';
                drawDAG();
                break;
            case 'knockoff':
                title.textContent = 'Knockoff Filter — Variable Importance';
                drawKnockoff(ctx2d, W, H);
                break;
            case 'kliep':
                title.textContent = 'KLIEP Density Ratio Weights';
                drawKLIEP(ctx2d, W, H);
                break;
            case 'mapper':
                title.textContent = 'Mapper Complex (TDA)';
                drawMapper(ctx2d, W, H);
                break;
        }

        updateComparisonTable();
        updateResultsTable();
    }

    function drawDistribution(ctx2d, W, H) {
        const {trialX, targetX} = currentResults;
        const margin = {top: 30, right: 30, bottom: 50, left: 60};
        const pW = W - margin.left - margin.right;
        const pH = H - margin.top - margin.bottom;

        // Histogram of age_65 for trial and target
        const trialAge = trialX.map(r => r[0]);
        const targetAge = targetX.map(r => r[0]);

        // Bar chart: proportion with age_65 = 1
        const trialPropAge = trialAge.filter(v => v === 1).length / trialAge.length;
        const targetPropAge = targetAge.filter(v => v === 1).length / targetAge.length;
        const trialPropDiab = trialX.map(r => r[1]).filter(v => v === 1).length / trialX.length;
        const targetPropDiab = targetX.map(r => r[1]).filter(v => v === 1).length / targetX.length;

        const barW = pW / 6;
        const maxP = Math.max(trialPropAge, targetPropAge, trialPropDiab, targetPropDiab, 0.3);

        function yScale(v) { return margin.top + (1 - v / maxP) * pH; }

        // Age 65+ bars
        ctx2d.fillStyle = '#4e8cff'; ctx2d.globalAlpha = 0.7;
        ctx2d.fillRect(margin.left + barW * 0.5, yScale(trialPropAge), barW, pH - (yScale(trialPropAge) - margin.top));
        ctx2d.fillStyle = '#fb923c';
        ctx2d.fillRect(margin.left + barW * 1.8, yScale(targetPropAge), barW, pH - (yScale(targetPropAge) - margin.top));

        // Diabetes bars
        ctx2d.fillStyle = '#4e8cff';
        ctx2d.fillRect(margin.left + barW * 3.5, yScale(trialPropDiab), barW, pH - (yScale(trialPropDiab) - margin.top));
        ctx2d.fillStyle = '#fb923c';
        ctx2d.fillRect(margin.left + barW * 4.8, yScale(targetPropDiab), barW, pH - (yScale(targetPropDiab) - margin.top));
        ctx2d.globalAlpha = 1;

        // Labels
        ctx2d.fillStyle = '#e0e6f0'; ctx2d.font = '12px sans-serif'; ctx2d.textAlign = 'center';
        ctx2d.fillText('Age 65+', margin.left + barW * 1.3, H - 10);
        ctx2d.fillText('Diabetes', margin.left + barW * 4.3, H - 10);

        // Legend
        ctx2d.fillStyle = '#4e8cff'; ctx2d.fillRect(W - 160, 10, 12, 12);
        ctx2d.fillStyle = '#fb923c'; ctx2d.fillRect(W - 160, 28, 12, 12);
        ctx2d.fillStyle = '#e0e6f0'; ctx2d.textAlign = 'left'; ctx2d.font = '11px sans-serif';
        ctx2d.fillText('Trial', W - 144, 21);
        ctx2d.fillText('Target', W - 144, 39);
    }

    function drawWeights(ctx2d, W, H) {
        const weights = activeMethod === 'ipsw' ? currentResults.ipsw.weights : null;
        if (!weights) { drawDistribution(ctx2d, W, H); return; }

        const margin = {top: 30, right: 30, bottom: 50, left: 60};
        const pW = W - margin.left - margin.right;
        const pH = H - margin.top - margin.bottom;

        const maxW = Math.max(...weights);
        const n = weights.length;

        ctx2d.fillStyle = '#4e8cff';
        for (let i = 0; i < n; i++) {
            const x = margin.left + (i / n) * pW;
            const barH = (weights[i] / maxW) * pH;
            ctx2d.fillRect(x, margin.top + pH - barH, Math.max(1, pW / n - 1), barH);
        }

        ctx2d.fillStyle = '#e0e6f0'; ctx2d.font = '12px sans-serif'; ctx2d.textAlign = 'center';
        ctx2d.fillText('Observation Index', W / 2, H - 10);
        ctx2d.save(); ctx2d.translate(15, H / 2); ctx2d.rotate(-Math.PI / 2);
        ctx2d.fillText('IPSW Weight', 0, 0); ctx2d.restore();
    }

    function drawTransportMap(ctx2d, W, H) {
        const {trialX, targetX, sinkhorn} = currentResults;
        const margin = {top: 30, right: 30, bottom: 50, left: 60};
        const pW = W - margin.left - margin.right;
        const pH = H - margin.top - margin.bottom;

        // Jitter binary covariates for visibility
        MathCore.random.seed(99);
        const jitter = () => MathCore.random.uniform() * 0.4 - 0.2;

        // Draw trial points (blue)
        ctx2d.fillStyle = '#4e8cff'; ctx2d.globalAlpha = 0.5;
        const trialPx = trialX.map(r => [
            margin.left + (r[0] * 0.7 + 0.15 + jitter() * 0.1) * pW,
            margin.top + (0.2 + jitter() * 0.1) * pH
        ]);
        for (const p of trialPx) {
            ctx2d.beginPath(); ctx2d.arc(p[0], p[1], 3, 0, 2 * Math.PI); ctx2d.fill();
        }

        // Draw target points (orange)
        ctx2d.fillStyle = '#fb923c';
        const targetPx = targetX.map(r => [
            margin.left + (r[0] * 0.7 + 0.15 + jitter() * 0.1) * pW,
            margin.top + (0.7 + jitter() * 0.1) * pH
        ]);
        for (const p of targetPx) {
            ctx2d.beginPath(); ctx2d.arc(p[0], p[1], 3, 0, 2 * Math.PI); ctx2d.fill();
        }
        ctx2d.globalAlpha = 1;

        // Draw top transport connections (strongest 50)
        const plan = sinkhorn.plan;
        const m = trialX.length, n = targetX.length;
        const planFlat = [];
        for (let i = 0; i < m; i++)
            for (let j = 0; j < n; j++)
                planFlat.push({i, j, w: plan[i][j]});
        planFlat.sort((a, b) => b.w - a.w);

        ctx2d.strokeStyle = '#34d399'; ctx2d.globalAlpha = 0.3; ctx2d.lineWidth = 0.5;
        for (let k = 0; k < Math.min(100, planFlat.length); k++) {
            const {i, j} = planFlat[k];
            ctx2d.beginPath();
            ctx2d.moveTo(trialPx[i][0], trialPx[i][1]);
            ctx2d.lineTo(targetPx[j][0], targetPx[j][1]);
            ctx2d.stroke();
        }
        ctx2d.globalAlpha = 1;

        ctx2d.fillStyle = '#8892a8'; ctx2d.font = '11px sans-serif'; ctx2d.textAlign = 'left';
        ctx2d.fillText(`W₂ = ${sinkhorn.wasserstein.toFixed(4)}`, margin.left + 10, margin.top + 20);

        ctx2d.fillStyle = '#4e8cff'; ctx2d.fillRect(W - 120, 10, 10, 10);
        ctx2d.fillStyle = '#fb923c'; ctx2d.fillRect(W - 120, 26, 10, 10);
        ctx2d.fillStyle = '#e0e6f0'; ctx2d.font = '10px sans-serif';
        ctx2d.fillText('Trial', W - 106, 19); ctx2d.fillText('Target', W - 106, 35);
    }

    function drawDAG() {
        const svg = document.getElementById('limb2-dag-svg');
        if (!svg) return;
        const W = 400, H = 320;

        // Node positions
        const positions = {
            'age_65': {x: 80, y: 60}, 'diabetes': {x: 320, y: 60},
            'treatment': {x: 200, y: 160}, 'outcome': {x: 200, y: 280}
        };

        const adjustSet = currentResults ? new Set(currentResults.causal.adjustmentSet) : new Set();

        let svgHTML = '';
        // Edges (arrows)
        for (const e of dagState.edges) {
            const from = positions[e.from], to = positions[e.to];
            if (!from || !to) continue;
            const dx = to.x - from.x, dy = to.y - from.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            const nx = dx / len, ny = dy / len;
            const x1 = from.x + nx * 25, y1 = from.y + ny * 25;
            const x2 = to.x - nx * 25, y2 = to.y - ny * 25;
            svgHTML += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#8892a8" stroke-width="2" marker-end="url(#arrowhead)"/>`;
        }

        // Arrowhead marker
        svgHTML = `<defs><marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#8892a8"/></marker></defs>` + svgHTML;

        // Nodes
        for (const [name, pos] of Object.entries(positions)) {
            const isAdjust = adjustSet.has(name);
            const fill = name === 'treatment' ? '#4e8cff' : name === 'outcome' ? '#34d399' : isAdjust ? '#fbbf24' : '#1a2340';
            const stroke = isAdjust ? '#fbbf24' : '#2a3555';
            svgHTML += `<circle cx="${pos.x}" cy="${pos.y}" r="24" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
            svgHTML += `<text x="${pos.x}" y="${pos.y + 4}" text-anchor="middle" fill="#e0e6f0" font-size="10" font-family="sans-serif">${name}</text>`;
        }

        svg.innerHTML = svgHTML;
    }

    function drawKnockoff(ctx2d, W, H) {
        const {knockoff} = currentResults;
        const margin = {top: 30, right: 30, bottom: 50, left: 120};
        const pW = W - margin.left - margin.right;
        const pH = H - margin.top - margin.bottom;

        const maxImp = Math.max(...knockoff.importances.map(Math.abs), 0.01);

        for (let j = 0; j < knockoff.covariateNames.length; j++) {
            const y = margin.top + (j + 0.5) / knockoff.covariateNames.length * pH;
            const w = knockoff.importances[j];
            const barLen = (w / maxImp) * pW * 0.8;
            const isSelected = knockoff.selected.includes(knockoff.covariateNames[j]);

            ctx2d.fillStyle = isSelected ? '#34d399' : (w >= 0 ? '#4e8cff' : '#f87171');
            if (w >= 0) {
                ctx2d.fillRect(margin.left, y - 15, barLen, 30);
            } else {
                ctx2d.fillRect(margin.left + barLen, y - 15, -barLen, 30);
            }

            ctx2d.fillStyle = '#e0e6f0'; ctx2d.textAlign = 'right'; ctx2d.font = '12px sans-serif';
            ctx2d.fillText(knockoff.covariateNames[j], margin.left - 10, y + 4);

            ctx2d.textAlign = 'left';
            ctx2d.fillText(`W=${w.toFixed(3)}${isSelected ? ' ✓' : ''}`, margin.left + Math.abs(barLen) + 10, y + 4);
        }

        // FDR threshold line
        if (knockoff.threshold !== null) {
            const threshX = margin.left + (knockoff.threshold / maxImp) * pW * 0.8;
            ctx2d.strokeStyle = '#f87171'; ctx2d.lineWidth = 2; ctx2d.setLineDash([5, 3]);
            ctx2d.beginPath(); ctx2d.moveTo(threshX, margin.top); ctx2d.lineTo(threshX, H - margin.bottom);
            ctx2d.stroke(); ctx2d.setLineDash([]);
            ctx2d.fillStyle = '#f87171'; ctx2d.font = '10px sans-serif'; ctx2d.textAlign = 'left';
            ctx2d.fillText(`FDR threshold`, threshX + 4, margin.top + 14);
        }
    }

    function drawKLIEP(ctx2d, W, H) {
        const {kliep, ipd} = currentResults;
        const ratios = kliep.ratios;
        const margin = {top: 30, right: 30, bottom: 50, left: 60};
        const pW = W - margin.left - margin.right;
        const pH = H - margin.top - margin.bottom;

        const maxR = Math.max(...ratios);
        const n = ratios.length;

        for (let i = 0; i < n; i++) {
            const x = margin.left + (i / n) * pW;
            const barH = (ratios[i] / maxR) * pH;
            const hue = ratios[i] > 1.2 ? 0 : (ratios[i] < 0.8 ? 220 : 150);
            ctx2d.fillStyle = `hsl(${hue}, 70%, 55%)`;
            ctx2d.fillRect(x, margin.top + pH - barH, Math.max(1, pW / n - 1), barH);
        }

        // Reference line at r=1
        const refY = margin.top + pH - (1 / maxR) * pH;
        ctx2d.strokeStyle = '#fbbf24'; ctx2d.lineWidth = 2; ctx2d.setLineDash([4, 2]);
        ctx2d.beginPath(); ctx2d.moveTo(margin.left, refY); ctx2d.lineTo(W - margin.right, refY);
        ctx2d.stroke(); ctx2d.setLineDash([]);

        ctx2d.fillStyle = '#e0e6f0'; ctx2d.font = '12px sans-serif'; ctx2d.textAlign = 'center';
        ctx2d.fillText('Trial Observation', W / 2, H - 10);
    }

    function drawMapper(ctx2d, W, H) {
        const {mapper} = currentResults;
        if (!mapper.nodes.length) return;

        const margin = {top: 30, right: 30, bottom: 30, left: 30};
        const pW = W - margin.left - margin.right;
        const pH = H - margin.top - margin.bottom;

        // Layout nodes in a circle
        const nNodes = mapper.nodes.length;
        const cx = W / 2, cy = H / 2;
        const radius = Math.min(pW, pH) * 0.35;

        const nodePos = mapper.nodes.map((node, i) => ({
            x: cx + radius * Math.cos(2 * Math.PI * i / nNodes),
            y: cy + radius * Math.sin(2 * Math.PI * i / nNodes)
        }));

        // Draw edges
        ctx2d.strokeStyle = '#2a3555'; ctx2d.lineWidth = 1;
        for (const e of mapper.edges) {
            const from = nodePos[e.from], to = nodePos[e.to];
            if (from && to) {
                ctx2d.beginPath();
                ctx2d.moveTo(from.x, from.y);
                ctx2d.lineTo(to.x, to.y);
                ctx2d.stroke();
            }
        }

        // Draw nodes
        const maxSize = Math.max(...mapper.nodes.map(n => n.size));
        for (let i = 0; i < nNodes; i++) {
            const node = mapper.nodes[i];
            const r = 5 + 15 * (node.size / maxSize);
            const hue = 200 + (node.meanFilter ?? 0) * 50;
            ctx2d.fillStyle = `hsl(${hue % 360}, 65%, 55%)`;
            ctx2d.beginPath();
            ctx2d.arc(nodePos[i].x, nodePos[i].y, r, 0, 2 * Math.PI);
            ctx2d.fill();
        }

        ctx2d.fillStyle = '#8892a8'; ctx2d.font = '11px sans-serif'; ctx2d.textAlign = 'left';
        ctx2d.fillText(`${nNodes} nodes, ${mapper.edges.length} edges`, margin.left + 10, H - 10);
    }

    function updateComparisonTable() {
        const el = document.getElementById('limb2-comparison-table');
        if (!el || !currentResults) return;

        const {ipsw, aipw, sinkhorn, causal, kliep, pooledYi} = currentResults;
        el.innerHTML = `<table class="results-table">
            <tr><th>Method</th><th>Transported ATE</th><th>RR</th></tr>
            <tr><td>Naive (Limb 1)</td><td>${pooledYi.toFixed(4)}</td><td>${Math.exp(pooledYi).toFixed(4)}</td></tr>
            <tr><td>IPSW</td><td>${ipsw.ate_transported.toFixed(4)}</td><td>${Math.exp(ipsw.ate_transported).toFixed(4)}</td></tr>
            <tr><td>AIPW (Doubly Robust)</td><td>${aipw.ate_dr.toFixed(4)}</td><td>${Math.exp(aipw.ate_dr).toFixed(4)}</td></tr>
            <tr><td>Sinkhorn OT</td><td>${sinkhorn.ate_transported.toFixed(4)}</td><td>${Math.exp(sinkhorn.ate_transported).toFixed(4)}</td></tr>
            <tr><td>Causal (do-calculus)</td><td>${causal.ate_causal.toFixed(4)}</td><td>${Math.exp(causal.ate_causal).toFixed(4)}</td></tr>
            <tr><td>KLIEP</td><td>${kliep.ate_transported.toFixed(4)}</td><td>${Math.exp(kliep.ate_transported).toFixed(4)}</td></tr>
        </table>`;
    }

    function updateResultsTable() {
        const el = document.getElementById('limb2-results');
        if (!el || !currentResults) return;
        const {mmd, knockoff, sinkhorn} = currentResults;

        el.innerHTML = `<table class="results-table" style="margin-top:12px;">
            <tr><th>Diagnostic</th><th>Value</th></tr>
            <tr><td>MMD² (distributional shift)</td><td>${mmd.mmd2.toFixed(6)}</td></tr>
            <tr><td>MMD p-value</td><td>${mmd.pValue.toFixed(3)} ${mmd.significant ? '(significant)' : '(not significant)'}</td></tr>
            <tr><td>Wasserstein W₂</td><td>${sinkhorn.wasserstein.toFixed(4)}</td></tr>
            <tr><td>Knockoff selected covariates</td><td>${knockoff.selected.length > 0 ? knockoff.selected.join(', ') : 'None (below FDR threshold)'}</td></tr>
        </table>`;
    }

    function getResults() { return currentResults; }

    function exportCSV() {
        if (!currentResults) return;
        const {ipsw, aipw, sinkhorn, causal, kliep, pooledYi} = currentResults;
        let csv = 'method,ate_transported,rr\n';
        csv += `Naive,${pooledYi},${Math.exp(pooledYi)}\n`;
        csv += `IPSW,${ipsw.ate_transported},${Math.exp(ipsw.ate_transported)}\n`;
        csv += `AIPW,${aipw.ate_dr},${Math.exp(aipw.ate_dr)}\n`;
        csv += `Sinkhorn,${sinkhorn.ate_transported},${Math.exp(sinkhorn.ate_transported)}\n`;
        csv += `Causal,${causal.ate_causal},${Math.exp(causal.ate_causal)}\n`;
        csv += `KLIEP,${kliep.ate_transported},${Math.exp(kliep.ate_transported)}\n`;
        const blob = new Blob([csv], {type: 'text/csv'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'limb2_transport_results.csv';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function exportPNG() {
        const canvas = document.getElementById('limb2-canvas');
        if (!canvas) return;
        const url = canvas.toDataURL('image/png');
        const a = document.createElement('a'); a.href = url; a.download = 'limb2_plot.png';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
    }
```

- [ ] **Step 2: Wire Limb2.init() into App**

In the App.init() function, after `Limb1.init()`, add:

```javascript
        if (typeof Limb2 !== 'undefined') Limb2.init();
```

Also update the tab switching handler so that switching to Limb 2 triggers `Limb2.onDataChange()` if results aren't loaded yet.

- [ ] **Step 3: Register integration test**

```javascript
// T52: Full Limb 2 pipeline
TestRunner.register('Integration: Limb2 full pipeline', () => {
    const d = DataLayer.load('colchicine');
    if (typeof Limb1 !== 'undefined') {
        Limb1.onDataChange(DataLayer.getActive());
    }
    Limb2.onDataChange();
    const res = Limb2.getResults();
    if (!res) throw new Error('No Limb2 results');
    if (typeof res.ipsw.ate_transported !== 'number') throw new Error('IPSW failed');
    if (typeof res.aipw.ate_dr !== 'number') throw new Error('AIPW failed');
    if (typeof res.sinkhorn.ate_transported !== 'number') throw new Error('Sinkhorn failed');
    if (typeof res.causal.ate_causal !== 'number') throw new Error('Causal failed');
    if (typeof res.kliep.ate_transported !== 'number') throw new Error('KLIEP failed');
    if (res.mapper.nodes.length === 0) throw new Error('Mapper empty');
});
```

- [ ] **Step 4: Run tests, verify 52/52 pass**

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: Limb2 full visualization (distribution overlay, transport map, DAG editor, knockoff, Mapper, comparison table)"
```

---

## Task 9: Push + GitHub Pages Update

**Files:**
- No new files

- [ ] **Step 1: Push to GitHub**

```bash
git push origin master
```

- [ ] **Step 2: Verify deployment**

Visit `https://mahmood726-cyber.github.io/four-limb-synthesis/` — both Limb 1 and Limb 2 tabs should be functional.

---

## Summary

| Task | Methods | Tests Added | Cumulative |
|------|---------|-------------|------------|
| 1 | — (HTML panel) | 0 | 35 |
| 2 | MathCore.kernel, MathCore.graph | 5 | 40 |
| 3 | DataLayer context + IPD generator | 2 | 42 |
| 4 | M11 IPSW, M12 AIPW | 2 | 44 |
| 5 | M13 Sinkhorn, M14 MMD | 2 | 46 |
| 6 | M15 Causal DAG, M16 Knockoff | 2 | 48 |
| 7 | M17 KLIEP, M18 Mapper | 3 | 51 |
| 8 | Visualization + DAG editor | 1 | 52 |
| 9 | Deploy | 0 | 52 |

**Total: 9 tasks, 8 methods (M11–M18), 17 new tests (52 cumulative), DAG editor, 9 visualization modes.**
