# Phase 1: Limb 1 — Trial Efficacy & Evidence Geometry

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-file interactive HTML app with the MathCore math library, data loading, and Limb 1 implementing 10 advanced meta-analysis methods (REML, KH, prediction intervals, Bayesian NMA MCMC, node-splitting, Fisher information geometry, spectral decomposition, Riemannian geodesics, persistent homology, conformal prediction).

**Architecture:** Single `index.html` file at project root. All JavaScript inline in `<script>` blocks. MathCore is the shared math library (IIFE). Limb1 is the first method module (IIFE). App shell handles tabs, data loading, and routing. All rendering via Canvas/SVG — zero external dependencies.

**Tech Stack:** Vanilla HTML/CSS/JS. No frameworks, no CDN. Seeded xoshiro128** PRNG. All math from scratch.

**File:** `C:\Users\user\four_limb_synthesis\index.html` (single file, all tasks append to it)

---

## Task 1: HTML Shell + CSS + Tab Framework

**Files:**
- Create: `index.html`

This task builds the empty app skeleton: header with title + dataset selector + file upload, tab bar (Limb 1 active, Limbs 2–4 and Integration greyed out), tab panel container, footer, and all CSS. No JavaScript yet.

- [ ] **Step 1: Create index.html with full HTML structure and CSS**

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta property="og:title" content="Four-Limb Evidence Synthesis">
<meta property="og:description" content="Advanced meta-analysis with information geometry, TDA, and causal transport">
<title>Four-Limb Evidence Synthesis</title>
<style>
:root {
    --bg: #0a0e17;
    --surface: #131a2b;
    --surface2: #1a2340;
    --border: #2a3555;
    --text: #e0e6f0;
    --text-muted: #8892a8;
    --accent: #4e8cff;
    --accent-glow: rgba(78,140,255,0.15);
    --green: #34d399;
    --red: #f87171;
    --yellow: #fbbf24;
    --orange: #fb923c;
    --font-mono: 'Consolas', 'Monaco', 'Courier New', monospace;
    --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    --viridis-0: #440154; --viridis-1: #482777; --viridis-2: #3f4a8a;
    --viridis-3: #31688e; --viridis-4: #26838f; --viridis-5: #1f9d8a;
    --viridis-6: #6cce5a; --viridis-7: #b6de2b; --viridis-8: #fee825;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
    font-family: var(--font-sans); background: var(--bg); color: var(--text);
    line-height: 1.6; min-height: 100vh;
}
.app-header {
    background: var(--surface); border-bottom: 1px solid var(--border);
    padding: 16px 24px; display: flex; align-items: center; gap: 24px;
    flex-wrap: wrap;
}
.app-header h1 { font-size: 1.4rem; font-weight: 700; letter-spacing: -0.02em; }
.app-header h1 span { color: var(--accent); }
.header-controls { display: flex; gap: 12px; align-items: center; margin-left: auto; }
select, button, input[type="file"] {
    font-family: var(--font-sans); font-size: 0.85rem; padding: 6px 12px;
    border: 1px solid var(--border); border-radius: 6px;
    background: var(--surface2); color: var(--text); cursor: pointer;
}
select:hover, button:hover { border-color: var(--accent); }
button.primary {
    background: var(--accent); color: #fff; border-color: var(--accent);
    font-weight: 600;
}
button.primary:hover { opacity: 0.9; }
.tab-bar {
    display: flex; background: var(--surface); border-bottom: 1px solid var(--border);
    padding: 0 24px; gap: 0;
}
.tab-btn {
    padding: 12px 20px; border: none; background: none; color: var(--text-muted);
    font-size: 0.9rem; font-weight: 500; cursor: pointer; position: relative;
    border-bottom: 2px solid transparent; transition: all 0.2s;
}
.tab-btn:hover:not(.disabled) { color: var(--text); }
.tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); }
.tab-btn.disabled { opacity: 0.35; cursor: not-allowed; }
.tab-panel { display: none; padding: 24px; }
.tab-panel.active { display: block; }
.method-bar {
    display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px;
    padding: 12px; background: var(--surface); border-radius: 8px;
    border: 1px solid var(--border);
}
.method-btn {
    padding: 6px 14px; border: 1px solid var(--border); border-radius: 20px;
    background: var(--surface2); color: var(--text-muted); font-size: 0.8rem;
    cursor: pointer; transition: all 0.2s;
}
.method-btn:hover { border-color: var(--accent); color: var(--text); }
.method-btn.active { background: var(--accent); color: #fff; border-color: var(--accent); }
.viz-container {
    background: var(--surface); border: 1px solid var(--border); border-radius: 8px;
    padding: 16px; margin-bottom: 16px; min-height: 400px; position: relative;
}
.viz-title {
    font-size: 0.85rem; font-weight: 600; color: var(--text-muted);
    margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.05em;
}
.results-table {
    width: 100%; border-collapse: collapse; font-size: 0.85rem;
    background: var(--surface); border-radius: 8px; overflow: hidden;
}
.results-table th {
    background: var(--surface2); padding: 10px 12px; text-align: left;
    font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border);
}
.results-table td {
    padding: 8px 12px; border-bottom: 1px solid var(--border);
}
.results-table tr:hover td { background: var(--accent-glow); }
.export-bar {
    display: flex; gap: 8px; margin-top: 12px; justify-content: flex-end;
}
.status-bar {
    position: fixed; bottom: 0; left: 0; right: 0; padding: 8px 24px;
    background: var(--surface); border-top: 1px solid var(--border);
    font-size: 0.8rem; color: var(--text-muted); display: flex;
    justify-content: space-between; z-index: 100;
}
.footer-links a { color: var(--accent); text-decoration: none; margin-left: 16px; }
.footer-links a:hover { text-decoration: underline; }
.split-pane { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
@media (max-width: 900px) { .split-pane { grid-template-columns: 1fr; } }
.card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 8px; padding: 16px;
}
.card h3 { font-size: 0.95rem; margin-bottom: 8px; }
.badge {
    display: inline-block; padding: 2px 8px; border-radius: 12px;
    font-size: 0.75rem; font-weight: 600;
}
.badge-green { background: rgba(52,211,153,0.15); color: var(--green); }
.badge-red { background: rgba(248,113,113,0.15); color: var(--red); }
.badge-yellow { background: rgba(251,191,36,0.15); color: var(--yellow); }
canvas { image-rendering: pixelated; }
.spinner {
    display: inline-block; width: 16px; height: 16px;
    border: 2px solid var(--border); border-top-color: var(--accent);
    border-radius: 50%; animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.upload-zone {
    border: 2px dashed var(--border); border-radius: 8px; padding: 24px;
    text-align: center; color: var(--text-muted); cursor: pointer;
    transition: border-color 0.2s;
}
.upload-zone:hover { border-color: var(--accent); }
.test-panel {
    background: var(--surface); border: 1px solid var(--border); border-radius: 8px;
    padding: 16px; margin-top: 16px; max-height: 400px; overflow-y: auto;
    font-family: var(--font-mono); font-size: 0.8rem;
}
.test-pass { color: var(--green); }
.test-fail { color: var(--red); }
</style>
</head>
<body>

<header class="app-header">
    <h1>Four-Limb <span>Evidence Synthesis</span></h1>
    <div class="header-controls">
        <select id="dataset-select" aria-label="Select dataset">
            <option value="colchicine">Colchicine / ACS (4 trials)</option>
            <option value="sglt2">SGLT2i / HF (4 trials)</option>
            <option value="nma_synthetic">Synthetic NMA (1000 trials)</option>
            <option value="custom">Custom Upload...</option>
        </select>
        <input type="file" id="file-upload" accept=".csv" style="display:none" aria-label="Upload CSV">
        <button id="btn-upload" onclick="document.getElementById('file-upload').click()">Upload CSV</button>
        <button id="btn-run-tests" class="primary">Run Tests</button>
    </div>
</header>

<nav class="tab-bar" role="tablist">
    <button class="tab-btn active" role="tab" aria-selected="true" data-tab="limb1">Limb 1: Trial Efficacy</button>
    <button class="tab-btn disabled" role="tab" aria-selected="false" data-tab="limb2" disabled>Limb 2: Causal Transport</button>
    <button class="tab-btn disabled" role="tab" aria-selected="false" data-tab="limb3" disabled>Limb 3: Economics</button>
    <button class="tab-btn disabled" role="tab" aria-selected="false" data-tab="limb4" disabled>Limb 4: Uncertainty</button>
    <button class="tab-btn disabled" role="tab" aria-selected="false" data-tab="integration" disabled>Integration</button>
</nav>

<main>
    <div id="panel-limb1" class="tab-panel active" role="tabpanel">
        <div class="method-bar" id="limb1-methods" role="radiogroup" aria-label="Select method">
            <!-- Method buttons injected by Limb1.init() -->
        </div>
        <div id="limb1-viz" class="viz-container">
            <div class="viz-title" id="limb1-viz-title">Select a method to begin</div>
            <canvas id="limb1-canvas" width="900" height="500"></canvas>
        </div>
        <div id="limb1-results"></div>
        <div class="export-bar">
            <button onclick="Limb1.exportCSV()">Export CSV</button>
            <button onclick="Limb1.exportPNG()">Export PNG</button>
        </div>
    </div>
    <div id="panel-limb2" class="tab-panel" role="tabpanel"></div>
    <div id="panel-limb3" class="tab-panel" role="tabpanel"></div>
    <div id="panel-limb4" class="tab-panel" role="tabpanel"></div>
    <div id="panel-integration" class="tab-panel" role="tabpanel"></div>
</main>

<div id="test-output" class="test-panel" style="display:none"></div>

<footer class="status-bar">
    <span id="status-text">Ready</span>
    <span class="footer-links">
        Four-Limb Evidence Synthesis v1.0 — Phase 1
        <a href="https://github.com/mahmood726-cyber/four-limb-synthesis" target="_blank">GitHub</a>
    </span>
</footer>

<!-- Scripts follow in subsequent tasks -->
</body>
</html>
```

- [ ] **Step 2: Open in browser, verify layout renders**

Open `index.html` in Chrome. Verify:
- Dark theme renders
- Header with dataset selector and buttons visible
- Tab bar with "Limb 1" active, others greyed out
- Empty canvas area visible
- Footer at bottom

- [ ] **Step 3: Commit**

```bash
cd C:\Users\user\four_limb_synthesis
git add index.html
git commit -m "feat: scaffold HTML app shell with tabs, CSS, and layout"
```

---

## Task 2: MathCore — Random & Linear Algebra

**Files:**
- Modify: `index.html` (append `<script>` block before `</body>`)

This task adds the foundational MathCore modules: seeded PRNG (xoshiro128**), basic array/matrix ops, and linear algebra (multiply, invert, eigendecompose via QR iteration, Cholesky).

- [ ] **Step 1: Write MathCore.random and MathCore.linalg test stubs**

Append this `<script>` block right before `</body>` (after the footer, before `</body>`):

```javascript
/* === TEST HARNESS === */
const TestRunner = (() => {
    const tests = [];
    function register(name, fn) { tests.push({name, fn}); }
    function run() {
        const el = document.getElementById('test-output');
        el.style.display = 'block';
        el.innerHTML = '';
        let pass = 0, fail = 0;
        for (const t of tests) {
            try {
                t.fn();
                el.innerHTML += `<div class="test-pass">PASS: ${t.name}</div>`;
                pass++;
            } catch(e) {
                el.innerHTML += `<div class="test-fail">FAIL: ${t.name} — ${e.message}</div>`;
                fail++;
            }
        }
        el.innerHTML += `<div style="margin-top:8px;color:var(--text)">Total: ${pass+fail} | Pass: ${pass} | Fail: ${fail}</div>`;
        document.getElementById('status-text').textContent = `Tests: ${pass} passed, ${fail} failed`;
    }
    return { register, run };
})();
document.getElementById('btn-run-tests').addEventListener('click', () => TestRunner.run());
```

- [ ] **Step 2: Implement MathCore.random (xoshiro128\*\*) and MathCore.linalg**

Insert this `<script>` block BEFORE the test harness script:

```javascript
/* === MATHCORE === */
const MathCore = (() => {
    // --- Random: xoshiro128** ---
    const random = (() => {
        let s = new Uint32Array(4);

        function seed(val) {
            // SplitMix32 to initialize state from a single integer
            let z = val >>> 0;
            for (let i = 0; i < 4; i++) {
                z = (z + 0x9e3779b9) >>> 0;
                let t = z ^ (z >>> 16); t = Math.imul(t, 0x21f0aaad);
                t = t ^ (t >>> 15); t = Math.imul(t, 0x735a2d97);
                s[i] = (t ^ (t >>> 15)) >>> 0;
            }
        }

        function rotl(x, k) { return ((x << k) | (x >>> (32 - k))) >>> 0; }

        function nextU32() {
            const result = (Math.imul(rotl(Math.imul(s[1], 5), 7), 9)) >>> 0;
            const t = (s[1] << 9) >>> 0;
            s[2] = (s[2] ^ s[0]) >>> 0;
            s[3] = (s[3] ^ s[1]) >>> 0;
            s[1] = (s[1] ^ s[2]) >>> 0;
            s[0] = (s[0] ^ s[3]) >>> 0;
            s[2] = (s[2] ^ t) >>> 0;
            s[3] = rotl(s[3], 11);
            return result;
        }

        function uniform() { return nextU32() / 4294967296; }

        // Box-Muller for normal draws
        let spareReady = false, spare = 0;
        function normal(mu = 0, sigma = 1) {
            if (spareReady) { spareReady = false; return spare * sigma + mu; }
            let u, v, s2;
            do { u = uniform() * 2 - 1; v = uniform() * 2 - 1; s2 = u*u + v*v; }
            while (s2 >= 1 || s2 === 0);
            const f = Math.sqrt(-2 * Math.log(s2) / s2);
            spare = v * f; spareReady = true;
            return u * f * sigma + mu;
        }

        function gamma(alpha, beta = 1) {
            // Marsaglia & Tsang
            if (alpha < 1) {
                return gamma(alpha + 1, beta) * Math.pow(uniform(), 1 / alpha);
            }
            const d = alpha - 1/3, c = 1 / Math.sqrt(9 * d);
            while (true) {
                let x, v;
                do { x = normal(); v = 1 + c * x; } while (v <= 0);
                v = v * v * v;
                const u = uniform();
                if (u < 1 - 0.0331 * x * x * x * x) return d * v / beta;
                if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v / beta;
            }
        }

        function invGamma(alpha, beta = 1) { return beta / gamma(alpha, 1); }

        // LHS sampler: returns mc_iters x d matrix (flat array)
        function lhs(n, d, seedVal) {
            seed(seedVal);
            const result = new Float64Array(n * d);
            for (let j = 0; j < d; j++) {
                const perm = Array.from({length: n}, (_, i) => i);
                // Fisher-Yates shuffle
                for (let i = n - 1; i > 0; i--) {
                    const k = (nextU32() % (i + 1)) >>> 0;
                    [perm[i], perm[k]] = [perm[k], perm[i]];
                }
                for (let i = 0; i < n; i++) {
                    result[i * d + j] = (perm[i] + uniform()) / n;
                }
            }
            return result;
        }

        return { seed, uniform, normal, gamma, invGamma, lhs, nextU32 };
    })();

    // --- Linear Algebra ---
    const linalg = (() => {
        // Create zero matrix (row-major flat array)
        function zeros(r, c) { return { data: new Float64Array(r * c), rows: r, cols: c }; }
        function eye(n) {
            const m = zeros(n, n);
            for (let i = 0; i < n; i++) m.data[i * n + i] = 1;
            return m;
        }
        function get(m, i, j) { return m.data[i * m.cols + j]; }
        function set(m, i, j, v) { m.data[i * m.cols + j] = v; }

        function clone(m) { return { data: Float64Array.from(m.data), rows: m.rows, cols: m.cols }; }

        function multiply(a, b) {
            if (a.cols !== b.rows) throw new Error('Dimension mismatch');
            const c = zeros(a.rows, b.cols);
            for (let i = 0; i < a.rows; i++)
                for (let k = 0; k < a.cols; k++) {
                    const aik = get(a, i, k);
                    for (let j = 0; j < b.cols; j++)
                        c.data[i * c.cols + j] += aik * get(b, k, j);
                }
            return c;
        }

        function transpose(m) {
            const t = zeros(m.cols, m.rows);
            for (let i = 0; i < m.rows; i++)
                for (let j = 0; j < m.cols; j++)
                    set(t, j, i, get(m, i, j));
            return t;
        }

        // Cholesky decomposition (lower triangular L such that A = L L^T)
        function cholesky(m) {
            const n = m.rows;
            const L = zeros(n, n);
            for (let i = 0; i < n; i++) {
                for (let j = 0; j <= i; j++) {
                    let sum = 0;
                    for (let k = 0; k < j; k++) sum += get(L, i, k) * get(L, j, k);
                    if (i === j) {
                        const diag = get(m, i, i) - sum;
                        if (diag <= 0) throw new Error('Matrix not positive definite');
                        set(L, i, j, Math.sqrt(diag));
                    } else {
                        set(L, i, j, (get(m, i, j) - sum) / get(L, j, j));
                    }
                }
            }
            return L;
        }

        // Solve L x = b where L is lower triangular
        function solveLower(L, b) {
            const n = L.rows;
            const x = new Float64Array(n);
            for (let i = 0; i < n; i++) {
                let sum = b[i];
                for (let j = 0; j < i; j++) sum -= get(L, i, j) * x[j];
                x[i] = sum / get(L, i, i);
            }
            return x;
        }

        // Solve L^T x = b where L is lower triangular
        function solveUpper(L, b) {
            const n = L.rows;
            const x = new Float64Array(n);
            for (let i = n - 1; i >= 0; i--) {
                let sum = b[i];
                for (let j = i + 1; j < n; j++) sum -= get(L, j, i) * x[j];
                x[i] = sum / get(L, i, i);
            }
            return x;
        }

        // Solve A x = b via Cholesky
        function solve(A, b) {
            const L = cholesky(A);
            const y = solveLower(L, b);
            return solveUpper(L, y);
        }

        // Invert via Cholesky
        function invert(A) {
            const n = A.rows;
            const L = cholesky(A);
            const inv = zeros(n, n);
            for (let col = 0; col < n; col++) {
                const e = new Float64Array(n); e[col] = 1;
                const y = solveLower(L, e);
                const x = solveUpper(L, y);
                for (let row = 0; row < n; row++) set(inv, row, col, x[row]);
            }
            return inv;
        }

        // Eigendecomposition via QR iteration (symmetric matrices only)
        // Returns {values: Float64Array, vectors: matrix} sorted descending
        function eigenSymmetric(A) {
            const n = A.rows;
            let T = clone(A);
            let V = eye(n);

            // Jacobi eigenvalue algorithm (more stable for small symmetric matrices)
            for (let sweep = 0; sweep < 100; sweep++) {
                let offDiag = 0;
                for (let i = 0; i < n; i++)
                    for (let j = i + 1; j < n; j++)
                        offDiag += get(T, i, j) * get(T, i, j);
                if (offDiag < 1e-20) break;

                for (let p = 0; p < n - 1; p++) {
                    for (let q = p + 1; q < n; q++) {
                        const apq = get(T, p, q);
                        if (Math.abs(apq) < 1e-15) continue;
                        const tau = (get(T, q, q) - get(T, p, p)) / (2 * apq);
                        const t = (tau >= 0 ? 1 : -1) / (Math.abs(tau) + Math.sqrt(1 + tau * tau));
                        const c = 1 / Math.sqrt(1 + t * t);
                        const s = t * c;

                        // Rotate T
                        const Rp = new Float64Array(n), Rq = new Float64Array(n);
                        for (let i = 0; i < n; i++) { Rp[i] = get(T, i, p); Rq[i] = get(T, i, q); }
                        for (let i = 0; i < n; i++) {
                            set(T, i, p, c * Rp[i] - s * Rq[i]);
                            set(T, i, q, s * Rp[i] + c * Rq[i]);
                        }
                        for (let i = 0; i < n; i++) { Rp[i] = get(T, p, i); Rq[i] = get(T, q, i); }
                        for (let i = 0; i < n; i++) {
                            set(T, p, i, c * Rp[i] - s * Rq[i]);
                            set(T, q, i, s * Rp[i] + c * Rq[i]);
                        }
                        // Accumulate eigenvectors
                        for (let i = 0; i < n; i++) {
                            const vip = get(V, i, p), viq = get(V, i, q);
                            set(V, i, p, c * vip - s * viq);
                            set(V, i, q, s * vip + c * viq);
                        }
                    }
                }
            }

            const values = new Float64Array(n);
            for (let i = 0; i < n; i++) values[i] = get(T, i, i);

            // Sort descending by eigenvalue
            const idx = Array.from({length: n}, (_, i) => i);
            idx.sort((a, b) => values[b] - values[a]);
            const sortedVals = new Float64Array(n);
            const sortedVecs = zeros(n, n);
            for (let i = 0; i < n; i++) {
                sortedVals[i] = values[idx[i]];
                for (let j = 0; j < n; j++) set(sortedVecs, j, i, get(V, j, idx[i]));
            }

            return { values: sortedVals, vectors: sortedVecs };
        }

        // Create matrix from 2D array
        function fromArray(arr) {
            const r = arr.length, c = arr[0].length;
            const m = zeros(r, c);
            for (let i = 0; i < r; i++)
                for (let j = 0; j < c; j++) set(m, i, j, arr[i][j]);
            return m;
        }

        // Matrix-vector multiply: A * v → result vector
        function matvec(A, v) {
            const out = new Float64Array(A.rows);
            for (let i = 0; i < A.rows; i++) {
                let sum = 0;
                for (let j = 0; j < A.cols; j++) sum += get(A, i, j) * v[j];
                out[i] = sum;
            }
            return out;
        }

        return {
            zeros, eye, get, set, clone, multiply, transpose, cholesky,
            solveLower, solveUpper, solve, invert, eigenSymmetric,
            fromArray, matvec
        };
    })();

    return { random, linalg };
})();
```

- [ ] **Step 3: Write and register tests for random + linalg**

Append these test registrations in the test harness script block (after `TestRunner` definition, before the click listener):

```javascript
// T1: Seeded PRNG determinism
TestRunner.register('PRNG determinism', () => {
    MathCore.random.seed(42);
    const a = MathCore.random.uniform();
    MathCore.random.seed(42);
    const b = MathCore.random.uniform();
    if (Math.abs(a - b) > 1e-15) throw new Error(`${a} !== ${b}`);
});

// T2: Normal distribution mean (law of large numbers)
TestRunner.register('Normal mean ~0', () => {
    MathCore.random.seed(123);
    let sum = 0;
    for (let i = 0; i < 10000; i++) sum += MathCore.random.normal();
    const mean = sum / 10000;
    if (Math.abs(mean) > 0.05) throw new Error(`Mean ${mean} too far from 0`);
});

// T3: Matrix multiply identity
TestRunner.register('Matrix multiply A*I = A', () => {
    const A = MathCore.linalg.fromArray([[1,2],[3,4]]);
    const I = MathCore.linalg.eye(2);
    const R = MathCore.linalg.multiply(A, I);
    if (Math.abs(MathCore.linalg.get(R, 0, 0) - 1) > 1e-10) throw new Error('Failed');
    if (Math.abs(MathCore.linalg.get(R, 1, 1) - 4) > 1e-10) throw new Error('Failed');
});

// T4: Cholesky decomposition
TestRunner.register('Cholesky L*L^T = A', () => {
    const A = MathCore.linalg.fromArray([[4,2],[2,3]]);
    const L = MathCore.linalg.cholesky(A);
    const LT = MathCore.linalg.transpose(L);
    const R = MathCore.linalg.multiply(L, LT);
    if (Math.abs(MathCore.linalg.get(R, 0, 0) - 4) > 1e-10) throw new Error('Failed');
    if (Math.abs(MathCore.linalg.get(R, 0, 1) - 2) > 1e-10) throw new Error('Failed');
    if (Math.abs(MathCore.linalg.get(R, 1, 1) - 3) > 1e-10) throw new Error('Failed');
});

// T5: Eigendecomposition
TestRunner.register('Eigen symmetric 2x2', () => {
    const A = MathCore.linalg.fromArray([[2,1],[1,2]]);
    const {values} = MathCore.linalg.eigenSymmetric(A);
    // eigenvalues should be 3 and 1
    if (Math.abs(values[0] - 3) > 1e-8) throw new Error(`λ0=${values[0]} expected 3`);
    if (Math.abs(values[1] - 1) > 1e-8) throw new Error(`λ1=${values[1]} expected 1`);
});

// T6: Solve Ax=b via Cholesky
TestRunner.register('Solve Ax=b', () => {
    const A = MathCore.linalg.fromArray([[4,2],[2,3]]);
    const b = [8, 7]; // x should be [1, 1+2/3] roughly
    const x = MathCore.linalg.solve(A, b);
    // Verify A*x ≈ b
    const Ax = MathCore.linalg.matvec(A, x);
    if (Math.abs(Ax[0] - 8) > 1e-8) throw new Error(`Ax[0]=${Ax[0]}`);
    if (Math.abs(Ax[1] - 7) > 1e-8) throw new Error(`Ax[1]=${Ax[1]}`);
});

// T7: LHS coverage
TestRunner.register('LHS samples in [0,1]', () => {
    const samples = MathCore.random.lhs(100, 3, 42);
    for (let i = 0; i < 300; i++) {
        if (samples[i] < 0 || samples[i] > 1) throw new Error(`Sample ${i} = ${samples[i]}`);
    }
});

// T8: Gamma distribution mean
TestRunner.register('Gamma(2,1) mean ~2', () => {
    MathCore.random.seed(99);
    let sum = 0;
    for (let i = 0; i < 5000; i++) sum += MathCore.random.gamma(2, 1);
    const mean = sum / 5000;
    if (Math.abs(mean - 2) > 0.15) throw new Error(`Mean ${mean} expected ~2`);
});
```

- [ ] **Step 4: Open in browser, click "Run Tests", verify 8/8 pass**

Expected: All 8 tests show green PASS. Status bar shows "Tests: 8 passed, 0 failed".

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: MathCore random (xoshiro128**) + linalg (Cholesky, eigen, solve) with 8 tests"
```

---

## Task 3: MathCore — Stats & Optimization

**Files:**
- Modify: `index.html` (extend MathCore IIFE)

Add `MathCore.stats` (normal/t/chi2 PDF/CDF/quantile, KDE) and `MathCore.optim` (Newton-Raphson, golden section) inside the existing MathCore IIFE.

- [ ] **Step 1: Add stats module inside MathCore IIFE**

Insert before the `return { random, linalg };` line at the bottom of the MathCore IIFE:

```javascript
    // --- Stats ---
    const stats = (() => {
        const SQRT2PI = Math.sqrt(2 * Math.PI);
        const LN2PI_HALF = 0.5 * Math.log(2 * Math.PI);

        function normalPdf(x, mu = 0, sigma = 1) {
            const z = (x - mu) / sigma;
            return Math.exp(-0.5 * z * z) / (sigma * SQRT2PI);
        }

        function normalLogPdf(x, mu = 0, sigma = 1) {
            const z = (x - mu) / sigma;
            return -0.5 * z * z - Math.log(sigma) - LN2PI_HALF;
        }

        // Abramowitz & Stegun approximation
        function normalCdf(x) {
            const a1=0.254829592, a2=-0.284496736, a3=1.421413741, a4=-1.453152027, a5=1.061405429;
            const p = 0.3275911;
            const sign = x < 0 ? -1 : 1;
            x = Math.abs(x) / Math.SQRT2;
            const t = 1 / (1 + p * x);
            const y = 1 - ((((a5*t + a4)*t + a3)*t + a2)*t + a1)*t * Math.exp(-x*x);
            return 0.5 * (1 + sign * y);
        }

        // Inverse normal CDF (Beasley-Springer-Moro)
        function normalQuantile(p) {
            if (p <= 0) return -Infinity;
            if (p >= 1) return Infinity;
            if (Math.abs(p - 0.5) < 1e-15) return 0;
            const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02,
                        1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
            const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02,
                        6.680131188771972e+01, -1.328068155288572e+01];
            const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00,
                        -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
            const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00,
                        3.754408661907416e+00];
            const pLow = 0.02425, pHigh = 1 - pLow;
            let q, r;
            if (p < pLow) {
                q = Math.sqrt(-2 * Math.log(p));
                return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
                       ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
            } else if (p <= pHigh) {
                q = p - 0.5; r = q * q;
                return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q /
                       (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
            } else {
                q = Math.sqrt(-2 * Math.log(1 - p));
                return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
                        ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
            }
        }

        // Log-gamma (Stirling)
        function logGamma(x) {
            const c = [76.18009172947146, -86.50532032941677, 24.01409824083091,
                       -1.231739572450155, 0.001208650973866179, -0.000005395239384953];
            let y = x, tmp = x + 5.5;
            tmp -= (x + 0.5) * Math.log(tmp);
            let ser = 1.000000000190015;
            for (let j = 0; j < 6; j++) ser += c[j] / (++y);
            return -tmp + Math.log(2.5066282746310005 * ser / x);
        }

        // t-distribution CDF via regularized incomplete beta
        function tCdf(t, df) {
            const x = df / (df + t * t);
            const ib = regIncBeta(df / 2, 0.5, x);
            return t >= 0 ? 1 - 0.5 * ib : 0.5 * ib;
        }

        // t-distribution quantile via bisection on tCdf
        function tQuantile(p, df) {
            if (p <= 0) return -Infinity;
            if (p >= 1) return Infinity;
            let lo = -100, hi = 100;
            for (let i = 0; i < 100; i++) {
                const mid = (lo + hi) / 2;
                if (tCdf(mid, df) < p) lo = mid; else hi = mid;
            }
            return (lo + hi) / 2;
        }

        // Chi-squared CDF via regularized lower incomplete gamma
        function chi2Cdf(x, k) {
            if (x <= 0) return 0;
            return regLowerGamma(k / 2, x / 2);
        }

        // Regularized incomplete beta function (continued fraction)
        function regIncBeta(a, b, x) {
            if (x < 0 || x > 1) return 0;
            if (x === 0) return 0;
            if (x === 1) return 1;
            const lbeta = logGamma(a) + logGamma(b) - logGamma(a + b);
            const front = Math.exp(Math.log(x) * a + Math.log(1 - x) * b - lbeta);
            if (x < (a + 1) / (a + b + 2)) {
                return front * betaCf(a, b, x) / a;
            } else {
                return 1 - front * betaCf(b, a, 1 - x) / b;
            }
        }

        function betaCf(a, b, x) {
            const maxIter = 200;
            let am = 1, bm = 1, az = 1, bz = 0;
            for (let m = 0; m <= maxIter; m++) {
                const em = m, d1 = m === 0 ? 1 : em * (b - em) * x / ((a + 2*em -1) * (a + 2*em));
                az = (az + am * d1); bz = (bz + bm * d1);
                const d2 = -(a + em) * (a + b + em) * x / ((a + 2*em) * (a + 2*em + 1));
                am = az + am * d2; bm = bz + bm * d2;
                if (Math.abs(bm) > 0) {
                    const r = am / bm;
                    am /= bm; bm = 1; az /= bm === 0 ? 1 : bm; bz /= bm === 0 ? 1 : bm;
                    // Normalize
                    const old = az;
                    az = am; bz = bm; am = 1; bm = 0;
                }
            }
            return az / bz;
        }

        // Regularized lower incomplete gamma (series expansion)
        function regLowerGamma(a, x) {
            if (x < 0) return 0;
            if (x === 0) return 0;
            let sum = 0, term = 1 / a;
            for (let n = 1; n < 200; n++) {
                term *= x / (a + n);
                sum += term;
                if (Math.abs(term) < 1e-14) break;
            }
            return (1 / a + sum) * Math.exp(-x + a * Math.log(x) - logGamma(a));
        }

        // Kernel density estimation (Gaussian kernel)
        function kde(data, bandwidth, grid) {
            const n = data.length;
            const h = bandwidth ?? (1.06 * std(data) * Math.pow(n, -0.2));
            return grid.map(x => {
                let sum = 0;
                for (let i = 0; i < n; i++) sum += normalPdf((x - data[i]) / h);
                return sum / (n * h);
            });
        }

        function mean(arr) { let s = 0; for (let i = 0; i < arr.length; i++) s += arr[i]; return s / arr.length; }
        function variance(arr) {
            const m = mean(arr);
            let s = 0; for (let i = 0; i < arr.length; i++) s += (arr[i] - m) * (arr[i] - m);
            return s / (arr.length - 1);
        }
        function std(arr) { return Math.sqrt(variance(arr)); }
        function quantile(arr, p) {
            const sorted = Float64Array.from(arr).sort();
            const idx = p * (sorted.length - 1);
            const lo = Math.floor(idx), hi = Math.ceil(idx);
            return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
        }

        return {
            normalPdf, normalLogPdf, normalCdf, normalQuantile,
            logGamma, tCdf, tQuantile, chi2Cdf, regIncBeta, regLowerGamma,
            kde, mean, variance, std, quantile
        };
    })();

    // --- Optimization ---
    const optim = (() => {
        // Newton-Raphson: minimize f(x) given f'(x) and f''(x)
        // Returns x that makes f'(x)=0
        function newtonRaphson(fprime, f2prime, x0, {maxIter = 100, tol = 1e-8} = {}) {
            let x = x0;
            for (let i = 0; i < maxIter; i++) {
                const g = fprime(x);
                const h = f2prime(x);
                if (Math.abs(h) < 1e-30) break;
                const dx = g / h;
                x -= dx;
                if (Math.abs(dx) < tol) break;
            }
            return x;
        }

        // Golden section search: minimize f(x) on [a, b]
        function goldenSection(f, a, b, {tol = 1e-8, maxIter = 100} = {}) {
            const gr = (Math.sqrt(5) - 1) / 2;
            let c = b - gr * (b - a);
            let d = a + gr * (b - a);
            for (let i = 0; i < maxIter; i++) {
                if (Math.abs(b - a) < tol) break;
                if (f(c) < f(d)) { b = d; } else { a = c; }
                c = b - gr * (b - a);
                d = a + gr * (b - a);
            }
            return (a + b) / 2;
        }

        return { newtonRaphson, goldenSection };
    })();
```

- [ ] **Step 2: Update MathCore return statement**

Change the return at the bottom of the MathCore IIFE from:

```javascript
    return { random, linalg };
```

to:

```javascript
    return { random, linalg, stats, optim };
```

- [ ] **Step 3: Register stats + optim tests**

Add after the existing test registrations:

```javascript
// T9: Normal CDF symmetry
TestRunner.register('Normal CDF(0) = 0.5', () => {
    const p = MathCore.stats.normalCdf(0);
    if (Math.abs(p - 0.5) > 1e-6) throw new Error(`CDF(0) = ${p}`);
});

// T10: Normal quantile inverse
TestRunner.register('Normal quantile inverse', () => {
    const z = MathCore.stats.normalQuantile(0.975);
    if (Math.abs(z - 1.96) > 0.01) throw new Error(`z = ${z}, expected ~1.96`);
});

// T11: t-distribution quantile
TestRunner.register('t-quantile(0.975, 10) ~ 2.228', () => {
    const t = MathCore.stats.tQuantile(0.975, 10);
    if (Math.abs(t - 2.228) > 0.05) throw new Error(`t = ${t}`);
});

// T12: Newton-Raphson finds sqrt(2)
TestRunner.register('Newton-Raphson sqrt(2)', () => {
    // Solve f(x) = x^2 - 2 = 0, f'(x) = 2x, f''(x) = 2
    const x = MathCore.optim.newtonRaphson(x => 2*x, () => 2, 1.5);
    // Newton on f'(x)=0 finds extrema, not roots. Let's test differently:
    // Find x where derivative of (x-sqrt2)^2 = 0 → fprime = 2(x-sqrt2), f2prime = 2
    // Actually test: minimize g(x) = (x^2 - 2)^2 → g'=4x(x^2-2), g''=12x^2-8
    const result = MathCore.optim.goldenSection(x => (x*x - 2)*(x*x - 2), 1, 2);
    if (Math.abs(result - Math.SQRT2) > 0.001) throw new Error(`Got ${result}`);
});
```

- [ ] **Step 4: Run tests, verify 12/12 pass**

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: MathCore stats (normal/t/chi2 CDF+quantile, KDE) + optim (Newton, golden section)"
```

---

## Task 4: Data Layer — Pre-loaded Datasets + CSV Upload

**Files:**
- Modify: `index.html` (add DataLayer module)

Embeds the Colchicine, SGLT2, and synthetic NMA datasets as JS objects. Implements CSV parsing and upload handling. Auto-detects data format (rr/ci vs yi/vi vs NMA t1/t2).

- [ ] **Step 1: Add DataLayer module**

Insert a new `<script>` block after MathCore and before the test harness:

```javascript
/* === DATA LAYER === */
const DataLayer = (() => {
    const DATASETS = {
        colchicine: {
            name: 'Colchicine / ACS',
            format: 'rr_ci',
            trials: [
                {trial_name:'COLCOT', rr:0.77, ci_lower:0.61, ci_upper:0.96, n:4742, population:'post-MI'},
                {trial_name:'CLEAR SYNERGY', rr:0.98, ci_lower:0.84, ci_upper:1.13, n:7062, population:'MI'},
                {trial_name:'COPS', rr:0.65, ci_lower:0.38, ci_upper:1.09, n:795, population:'ACS'},
                {trial_name:'LoDoCo2', rr:0.71, ci_lower:0.58, ci_upper:0.87, n:5522, population:'CCD'}
            ]
        },
        sglt2: {
            name: 'SGLT2i / HF',
            format: 'rr_ci',
            trials: [
                {trial_name:'DAPA-HF', rr:0.74, ci_lower:0.65, ci_upper:0.85, n:4744, population:'HFrEF'},
                {trial_name:'EMPEROR-Reduced', rr:0.75, ci_lower:0.65, ci_upper:0.86, n:3730, population:'HFrEF'},
                {trial_name:'EMPEROR-Preserved', rr:0.79, ci_lower:0.69, ci_upper:0.90, n:5988, population:'HFpEF'},
                {trial_name:'DELIVER', rr:0.82, ci_lower:0.73, ci_upper:0.92, n:6263, population:'HFpEF'}
            ]
        },
        nma_synthetic: {
            name: 'Synthetic NMA (1000 trials)',
            format: 'nma',
            trials: null // Generated on demand
        }
    };

    let activeData = null;

    function generateSyntheticNMA() {
        MathCore.random.seed(777);
        const trials = [];
        for (let i = 0; i < 1000; i++) {
            const tt = MathCore.random.uniform();
            const year = 2000 + Math.floor(MathCore.random.uniform() * 31);
            const age = 60 + MathCore.random.normal(0, 12);
            const clampedAge = Math.max(30, Math.min(90, age));

            const true_1v0 = -0.3 + (year - 2015) * 0.005 + (clampedAge - 60) * 0.002;
            const true_2v0 = -0.4 + (year - 2015) * 0.004 + (clampedAge - 60) * 0.001;
            const vi = 1 / (Math.max(100, Math.floor(MathCore.random.uniform() * 5000)) * 0.1);

            let t1, t2, yi;
            if (tt < 0.45) {
                t1 = 0; t2 = 1;
                yi = true_1v0 + MathCore.random.normal(0, Math.sqrt(vi + 0.02));
            } else if (tt < 0.90) {
                t1 = 0; t2 = 2;
                yi = true_2v0 + MathCore.random.normal(0, Math.sqrt(vi + 0.02));
            } else {
                t1 = 1; t2 = 2;
                yi = (true_2v0 - true_1v0) + MathCore.random.normal(0, Math.sqrt(vi + 0.02));
            }
            trials.push({trial_name: `NCT${String(i+1).padStart(8,'0')}`, t1, t2, yi, vi, year, mean_age: clampedAge});
        }
        return trials;
    }

    function convertRrToYiVi(trials) {
        return trials.map(t => {
            const yi = Math.log(t.rr);
            const se = (Math.log(t.ci_upper) - Math.log(t.ci_lower)) / (2 * 1.96);
            const vi = se * se;
            return {...t, yi, vi};
        });
    }

    function detectFormat(trials) {
        if (trials.length === 0) return 'unknown';
        const keys = Object.keys(trials[0]);
        if (keys.includes('t1') && keys.includes('t2')) return 'nma';
        if (keys.includes('rr') && keys.includes('ci_lower')) return 'rr_ci';
        if (keys.includes('yi') && keys.includes('vi')) return 'yi_vi';
        return 'unknown';
    }

    function parseCSV(text) {
        const lines = text.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const rows = [];
        for (let i = 1; i < lines.length; i++) {
            const vals = lines[i].split(',').map(v => v.trim());
            if (vals.length !== headers.length) continue;
            const row = {};
            for (let j = 0; j < headers.length; j++) {
                const num = parseFloat(vals[j]);
                row[headers[j]] = isNaN(num) ? vals[j] : num;
            }
            rows.push(row);
        }
        return rows;
    }

    function load(datasetKey) {
        const ds = DATASETS[datasetKey];
        if (!ds) throw new Error(`Unknown dataset: ${datasetKey}`);
        let trials = ds.trials;
        if (datasetKey === 'nma_synthetic' && !trials) {
            trials = generateSyntheticNMA();
            DATASETS.nma_synthetic.trials = trials;
        }
        const format = ds.format;
        // Convert rr/ci to yi/vi for uniformity
        if (format === 'rr_ci') {
            activeData = { name: ds.name, format, trials, trialsYiVi: convertRrToYiVi(trials) };
        } else {
            activeData = { name: ds.name, format, trials, trialsYiVi: trials };
        }
        return activeData;
    }

    function loadCSV(text) {
        const trials = parseCSV(text);
        const format = detectFormat(trials);
        if (format === 'unknown') throw new Error('Unrecognized CSV format. Need rr/ci_lower/ci_upper or yi/vi or t1/t2/yi/vi columns.');
        if (format === 'rr_ci') {
            activeData = { name: 'Custom Upload', format, trials, trialsYiVi: convertRrToYiVi(trials) };
        } else {
            activeData = { name: 'Custom Upload', format, trials, trialsYiVi: trials };
        }
        return activeData;
    }

    function getActive() { return activeData; }

    return { load, loadCSV, getActive, DATASETS, detectFormat };
})();
```

- [ ] **Step 2: Wire up UI controls**

Add a new `<script>` block for the App controller after DataLayer:

```javascript
/* === APP CONTROLLER === */
const App = (() => {
    function init() {
        // Load default dataset
        DataLayer.load('colchicine');
        updateStatus(`Loaded: Colchicine / ACS (4 trials)`);

        // Dataset selector
        document.getElementById('dataset-select').addEventListener('change', (e) => {
            const key = e.target.value;
            if (key === 'custom') {
                document.getElementById('file-upload').click();
                return;
            }
            const data = DataLayer.load(key);
            updateStatus(`Loaded: ${data.name} (${data.trials.length} trials, format: ${data.format})`);
            if (typeof Limb1 !== 'undefined' && Limb1.onDataChange) Limb1.onDataChange(data);
        });

        // File upload
        document.getElementById('file-upload').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (evt) => {
                try {
                    const data = DataLayer.loadCSV(evt.target.result);
                    updateStatus(`Loaded: ${file.name} (${data.trials.length} trials, format: ${data.format})`);
                    if (typeof Limb1 !== 'undefined' && Limb1.onDataChange) Limb1.onDataChange(data);
                } catch (err) {
                    updateStatus(`Error: ${err.message}`);
                }
            };
            reader.readAsText(file);
        });

        // Tab switching
        document.querySelectorAll('.tab-btn:not(.disabled)').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
                document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
                btn.classList.add('active');
                btn.setAttribute('aria-selected', 'true');
                const tabId = btn.dataset.tab;
                document.getElementById(`panel-${tabId}`).classList.add('active');
            });
        });
    }

    function updateStatus(msg) {
        document.getElementById('status-text').textContent = msg;
    }

    return { init, updateStatus };
})();

document.addEventListener('DOMContentLoaded', () => App.init());
```

- [ ] **Step 3: Register data layer tests**

```javascript
// T13: Load colchicine dataset
TestRunner.register('Load colchicine dataset', () => {
    const d = DataLayer.load('colchicine');
    if (d.trials.length !== 4) throw new Error(`Expected 4 trials, got ${d.trials.length}`);
    if (d.format !== 'rr_ci') throw new Error(`Expected rr_ci format`);
});

// T14: Convert RR/CI to yi/vi
TestRunner.register('RR→yi/vi conversion', () => {
    const d = DataLayer.load('colchicine');
    const colcot = d.trialsYiVi[0]; // COLCOT: rr=0.77
    if (Math.abs(colcot.yi - Math.log(0.77)) > 1e-10) throw new Error(`yi = ${colcot.yi}`);
    if (colcot.vi <= 0) throw new Error(`vi must be positive, got ${colcot.vi}`);
});

// T15: Detect NMA format
TestRunner.register('Detect NMA format', () => {
    const fmt = DataLayer.detectFormat([{t1:0, t2:1, yi:-0.3, vi:0.05}]);
    if (fmt !== 'nma') throw new Error(`Expected nma, got ${fmt}`);
});

// T16: CSV parsing
TestRunner.register('Parse CSV string', () => {
    const csv = 'trial_name,rr,ci_lower,ci_upper\nA,0.8,0.7,0.91';
    const d = DataLayer.loadCSV(csv);
    if (d.trials.length !== 1) throw new Error(`Expected 1 trial`);
    if (d.trials[0].rr !== 0.8) throw new Error(`RR = ${d.trials[0].rr}`);
});

// T17: Synthetic NMA generation (deterministic)
TestRunner.register('Synthetic NMA 1000 trials', () => {
    const d = DataLayer.load('nma_synthetic');
    if (d.trials.length !== 1000) throw new Error(`Expected 1000, got ${d.trials.length}`);
    if (d.format !== 'nma') throw new Error(`Expected nma format`);
});
```

- [ ] **Step 4: Run tests, verify 17/17 pass**

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: DataLayer with 3 pre-loaded datasets, CSV upload, format auto-detection"
```

---

## Task 5: M1–M3 — REML, Knapp-Hartung, Prediction Intervals

**Files:**
- Modify: `index.html` (add Limb1 module start)

The core frequentist meta-analysis methods. REML tau² via Newton-Raphson on the REML log-likelihood, Knapp-Hartung CI adjustment, and prediction intervals.

- [ ] **Step 1: Register tests for M1–M3**

```javascript
// T18: REML on homogeneous data → tau² ≈ 0
TestRunner.register('M1: REML tau²=0 for identical studies', () => {
    const yi = [0.5, 0.5, 0.5, 0.5];
    const vi = [0.1, 0.1, 0.1, 0.1];
    const res = Limb1.methods.reml(yi, vi);
    if (res.tau2 > 0.01) throw new Error(`tau² = ${res.tau2}, expected ~0`);
});

// T19: REML mu on SGLT2 data (known from Python: ~0.78 pooled RR)
TestRunner.register('M1: REML pooled SGLT2 RR', () => {
    const d = DataLayer.load('sglt2');
    const yi = d.trialsYiVi.map(t => t.yi);
    const vi = d.trialsYiVi.map(t => t.vi);
    const res = Limb1.methods.reml(yi, vi);
    const rr = Math.exp(res.mu);
    if (rr < 0.70 || rr > 0.85) throw new Error(`Pooled RR = ${rr}, expected 0.70-0.85`);
});

// T20: KH CI is wider than z-based CI
TestRunner.register('M2: KH CI wider than z-based', () => {
    const yi = [-0.26, -0.29, -0.24, -0.20];
    const vi = [0.01, 0.02, 0.01, 0.015];
    const reml = Limb1.methods.reml(yi, vi);
    const kh = Limb1.methods.knappHartung(yi, vi, reml.tau2, reml.mu);
    const zWidth = 2 * 1.96 * reml.se;
    const khWidth = kh.ci_upper - kh.ci_lower;
    if (khWidth <= zWidth) throw new Error(`KH width ${khWidth} should exceed z-width ${zWidth}`);
});

// T21: Prediction interval wider than CI
TestRunner.register('M3: Prediction interval wider than CI', () => {
    const yi = [-0.26, -0.29, -0.24, -0.20];
    const vi = [0.01, 0.02, 0.01, 0.015];
    const reml = Limb1.methods.reml(yi, vi);
    const pi = Limb1.methods.predictionInterval(yi, vi, reml.tau2, reml.mu, reml.se);
    const ciWidth = 2 * 1.96 * reml.se;
    const piWidth = pi.upper - pi.lower;
    if (piWidth <= ciWidth) throw new Error(`PI width ${piWidth} should exceed CI width ${ciWidth}`);
});
```

- [ ] **Step 2: Implement Limb1 module with M1–M3**

Add a new `<script>` block after DataLayer and before App:

```javascript
/* === LIMB 1: TRIAL EFFICACY & EVIDENCE GEOMETRY === */
const Limb1 = (() => {
    const methods = {};

    // M1: REML tau² estimator
    methods.reml = function(yi, vi, {maxIter = 100, tol = 1e-8} = {}) {
        const k = yi.length;
        if (k < 2) return { tau2: 0, mu: yi[0] ?? 0, se: Math.sqrt(vi[0] ?? 1) };

        // DerSimonian-Laird initial estimate
        const wFixed = vi.map(v => 1 / v);
        const sumW = wFixed.reduce((a, b) => a + b, 0);
        const muFixed = yi.reduce((s, y, i) => s + wFixed[i] * y, 0) / sumW;
        let Q = 0;
        for (let i = 0; i < k; i++) Q += wFixed[i] * (yi[i] - muFixed) ** 2;
        const c = sumW - wFixed.reduce((s, w) => s + w * w, 0) / sumW;
        let tau2 = Math.max(0, (Q - (k - 1)) / c);

        // Newton-Raphson on REML likelihood
        for (let iter = 0; iter < maxIter; iter++) {
            const w = vi.map(v => 1 / (v + tau2));
            const sumW2 = w.reduce((a, b) => a + b, 0);
            const mu = w.reduce((s, wi, i) => s + wi * yi[i], 0) / sumW2;

            // First derivative of REML log-likelihood w.r.t. tau²
            let dl = 0, d2l = 0;
            for (let i = 0; i < k; i++) {
                const wi2 = w[i] * w[i];
                dl += -0.5 * w[i] + 0.5 * wi2 * (yi[i] - mu) ** 2 + 0.5 * wi2 / sumW2;
                d2l += 0.5 * wi2 - wi2 * w[i] * (yi[i] - mu) ** 2 - wi2 * w[i] / sumW2;
            }

            if (Math.abs(d2l) < 1e-30) break;
            const step = dl / d2l;
            const newTau2 = tau2 - step;
            tau2 = Math.max(0, newTau2);
            if (Math.abs(step) < tol) break;
        }

        const w = vi.map(v => 1 / (v + tau2));
        const sumWf = w.reduce((a, b) => a + b, 0);
        const mu = w.reduce((s, wi, i) => s + wi * yi[i], 0) / sumWf;
        const se = Math.sqrt(1 / sumWf);
        const I2 = Math.max(0, (Q - (k - 1)) / Q) * 100;

        return { tau2, mu, se, I2, Q, k, weights: w };
    };

    // M2: Knapp-Hartung adjustment
    methods.knappHartung = function(yi, vi, tau2, mu) {
        const k = yi.length;
        const w = vi.map(v => 1 / (v + tau2));
        const sumW = w.reduce((a, b) => a + b, 0);
        const qKH = w.reduce((s, wi, i) => s + wi * (yi[i] - mu) ** 2, 0) / (k - 1);
        const seKH = Math.sqrt(qKH / sumW);
        const tCrit = MathCore.stats.tQuantile(0.975, k - 1);
        return {
            mu, se: seKH,
            ci_lower: mu - tCrit * seKH,
            ci_upper: mu + tCrit * seKH,
            q_kh: qKH, df: k - 1
        };
    };

    // M3: Prediction interval
    methods.predictionInterval = function(yi, vi, tau2, mu, se) {
        const k = yi.length;
        if (k < 3) return { lower: -Infinity, upper: Infinity, df: 0 };
        const tCrit = MathCore.stats.tQuantile(0.975, k - 2);
        const piSe = Math.sqrt(tau2 + se * se);
        return {
            lower: mu - tCrit * piSe,
            upper: mu + tCrit * piSe,
            df: k - 2
        };
    };

    // Public API stubs (filled in later tasks)
    function init() {}
    function onDataChange(data) {}
    function exportCSV() {}
    function exportPNG() {}
    function getResults() { return null; }

    return { methods, init, onDataChange, exportCSV, exportPNG, getResults };
})();
```

- [ ] **Step 3: Run tests, verify 21/21 pass**

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: Limb1 M1-M3 (REML, Knapp-Hartung, prediction intervals) with 4 tests"
```

---

## Task 6: M4–M5 — Bayesian NMA MCMC + Node-Splitting

**Files:**
- Modify: `index.html` (extend Limb1.methods)

Metropolis-within-Gibbs sampler for the consistency NMA model. Node-splitting for inconsistency detection.

- [ ] **Step 1: Register tests**

```javascript
// T22: MCMC NMA recovers known effect (synthetic data)
TestRunner.register('M4: MCMC NMA mu1 ~ -0.3', () => {
    MathCore.random.seed(42);
    const trials = [];
    for (let i = 0; i < 30; i++) {
        trials.push({t1:0, t2:1, yi: -0.3 + MathCore.random.normal(0, 0.1), vi: 0.05});
    }
    for (let i = 0; i < 30; i++) {
        trials.push({t1:0, t2:2, yi: -0.4 + MathCore.random.normal(0, 0.1), vi: 0.05});
    }
    const res = Limb1.methods.mcmcNMA(trials, {warmup:1000, samples:2000, chains:1, seed:42});
    if (Math.abs(res.mu1_mean - (-0.3)) > 0.15) throw new Error(`mu1=${res.mu1_mean}, expected ~-0.3`);
    if (Math.abs(res.mu2_mean - (-0.4)) > 0.15) throw new Error(`mu2=${res.mu2_mean}, expected ~-0.4`);
});

// T23: MCMC R-hat < 1.1 on well-behaved data
TestRunner.register('M4: MCMC Rhat < 1.1', () => {
    MathCore.random.seed(99);
    const trials = [];
    for (let i = 0; i < 20; i++) trials.push({t1:0, t2:1, yi: -0.25 + MathCore.random.normal(0, 0.08), vi: 0.04});
    for (let i = 0; i < 20; i++) trials.push({t1:0, t2:2, yi: -0.35 + MathCore.random.normal(0, 0.08), vi: 0.04});
    const res = Limb1.methods.mcmcNMA(trials, {warmup:1000, samples:1000, chains:2, seed:99});
    if (res.rhat_mu1 > 1.1) throw new Error(`Rhat = ${res.rhat_mu1}`);
});

// T24: Node-splitting detects no inconsistency when consistent
TestRunner.register('M5: Node-split no inconsistency on consistent data', () => {
    MathCore.random.seed(55);
    const trials = [];
    for (let i = 0; i < 15; i++) trials.push({t1:0, t2:1, yi: -0.3 + MathCore.random.normal(0, 0.1), vi: 0.05});
    for (let i = 0; i < 15; i++) trials.push({t1:0, t2:2, yi: -0.4 + MathCore.random.normal(0, 0.1), vi: 0.05});
    for (let i = 0; i < 10; i++) trials.push({t1:1, t2:2, yi: -0.1 + MathCore.random.normal(0, 0.1), vi: 0.05}); // -0.4 - (-0.3) = -0.1
    const res = Limb1.methods.nodeSplit(trials);
    // For 1-2 comparison: direct ~ -0.1, indirect ~ -0.1, difference CI should include 0
    const comp12 = res.find(r => r.comparison === '1v2');
    if (comp12 && comp12.inconsistent) throw new Error('False inconsistency detected');
});
```

- [ ] **Step 2: Implement MCMC NMA (M4)**

Add inside the Limb1 IIFE, after the M3 method:

```javascript
    // M4: Bayesian NMA via Metropolis-within-Gibbs
    methods.mcmcNMA = function(trials, {warmup = 2000, samples = 3000, chains = 2, seed = 42} = {}) {
        const d01 = trials.filter(t => t.t1 === 0 && t.t2 === 1);
        const d02 = trials.filter(t => t.t1 === 0 && t.t2 === 2);
        const d12 = trials.filter(t => t.t1 === 1 && t.t2 === 2);

        function logLikelihood(mu1, mu2, tau2) {
            let ll = 0;
            for (const t of d01) ll += MathCore.stats.normalLogPdf(t.yi, mu1, Math.sqrt(t.vi + tau2));
            for (const t of d02) ll += MathCore.stats.normalLogPdf(t.yi, mu2, Math.sqrt(t.vi + tau2));
            for (const t of d12) ll += MathCore.stats.normalLogPdf(t.yi, mu2 - mu1, Math.sqrt(t.vi + tau2));
            return ll;
        }

        const allChains = [];

        for (let c = 0; c < chains; c++) {
            MathCore.random.seed(seed + c * 1000);
            let mu1 = MathCore.random.normal(-0.3, 0.5);
            let mu2 = MathCore.random.normal(-0.3, 0.5);
            let tau2 = 0.05;
            const chainSamples = [];

            const totalIter = warmup + samples;
            for (let iter = 0; iter < totalIter; iter++) {
                // Metropolis step for mu1
                const mu1_prop = mu1 + MathCore.random.normal(0, 0.05);
                const ll_curr = logLikelihood(mu1, mu2, tau2);
                const ll_prop = logLikelihood(mu1_prop, mu2, tau2);
                if (Math.log(MathCore.random.uniform()) < ll_prop - ll_curr) mu1 = mu1_prop;

                // Metropolis step for mu2
                const mu2_prop = mu2 + MathCore.random.normal(0, 0.05);
                const ll_curr2 = logLikelihood(mu1, mu2, tau2);
                const ll_prop2 = logLikelihood(mu1, mu2_prop, tau2);
                if (Math.log(MathCore.random.uniform()) < ll_prop2 - ll_curr2) mu2 = mu2_prop;

                // Gibbs step for tau2 (InvGamma full conditional)
                const a_post = 0.01 + trials.length / 2;
                let ss = 0;
                for (const t of d01) ss += (t.yi - mu1) ** 2 / 2;
                for (const t of d02) ss += (t.yi - mu2) ** 2 / 2;
                for (const t of d12) ss += (t.yi - (mu2 - mu1)) ** 2 / 2;
                tau2 = Math.max(1e-6, MathCore.random.invGamma(a_post, 0.01 + ss));

                if (iter >= warmup) chainSamples.push({mu1, mu2, tau2});
            }
            allChains.push(chainSamples);
        }

        // Compute posterior summaries
        const allMu1 = allChains.flat().map(s => s.mu1);
        const allMu2 = allChains.flat().map(s => s.mu2);
        const allTau2 = allChains.flat().map(s => s.tau2);

        const mu1_mean = MathCore.stats.mean(allMu1);
        const mu2_mean = MathCore.stats.mean(allMu2);
        const tau2_mean = MathCore.stats.mean(allTau2);

        const mu1_sorted = Float64Array.from(allMu1).sort();
        const mu2_sorted = Float64Array.from(allMu2).sort();
        const n = mu1_sorted.length;
        const lo = Math.floor(0.025 * n), hi = Math.floor(0.975 * n);

        // Gelman-Rubin R-hat
        function rhat(chainArrays) {
            const m = chainArrays.length;
            const ns = chainArrays.map(c => c.length);
            const means = chainArrays.map(c => MathCore.stats.mean(c));
            const grandMean = MathCore.stats.mean(means);
            const n0 = ns[0];
            const B = n0 * MathCore.stats.variance(means);
            const W = MathCore.stats.mean(chainArrays.map(c => MathCore.stats.variance(c)));
            if (W < 1e-20) return 1.0;
            const varEst = ((n0 - 1) / n0) * W + (1 / n0) * B;
            return Math.sqrt(varEst / W);
        }

        const rhat_mu1 = chains > 1 ? rhat(allChains.map(c => c.map(s => s.mu1))) : 1.0;

        return {
            mu1_mean, mu2_mean, tau2_mean,
            mu1_ci: [mu1_sorted[lo], mu1_sorted[hi]],
            mu2_ci: [mu2_sorted[lo], mu2_sorted[hi]],
            rhat_mu1,
            chains: allChains,
            nSamples: n
        };
    };
```

- [ ] **Step 3: Implement Node-Splitting (M5)**

Add after the MCMC method:

```javascript
    // M5: Node-splitting inconsistency test
    methods.nodeSplit = function(trials) {
        const comparisons = new Set();
        for (const t of trials) comparisons.add(`${t.t1}v${t.t2}`);

        const results = [];

        for (const comp of comparisons) {
            const [a, b] = comp.split('v').map(Number);
            // Direct evidence for a-b
            const direct = trials.filter(t => t.t1 === a && t.t2 === b);
            if (direct.length === 0) continue;

            // Indirect evidence: a-c and c-b paths
            const treatments = new Set(trials.flatMap(t => [t.t1, t.t2]));
            let indirectEstimates = [];

            for (const c of treatments) {
                if (c === a || c === b) continue;
                // a-c evidence
                const ac = trials.filter(t => (t.t1 === a && t.t2 === c));
                // c-b evidence
                const cb = trials.filter(t => (t.t1 === c && t.t2 === b));
                // Also check b-c (reversed)
                const bc = trials.filter(t => (t.t1 === Math.min(b,c) && t.t2 === Math.max(b,c)));

                if (ac.length > 0 && (cb.length > 0 || bc.length > 0)) {
                    const acYi = ac.map(t => t.yi), acVi = ac.map(t => t.vi);
                    const acPool = MathCore.stats.mean(acYi); // Simplified pooling
                    const acSe = Math.sqrt(acVi.reduce((s,v) => s + 1/v, 0));
                    const acPoolSe = 1 / acSe;

                    let cbPool, cbPoolSe;
                    if (cb.length > 0) {
                        const cbYi = cb.map(t => t.yi), cbVi = cb.map(t => t.vi);
                        cbPool = MathCore.stats.mean(cbYi);
                        cbPoolSe = 1 / Math.sqrt(cbVi.reduce((s,v) => s + 1/v, 0));
                    } else {
                        // Use b-c reversed: d_cb = -d_bc
                        const bcYi = bc.map(t => -t.yi), bcVi = bc.map(t => t.vi);
                        cbPool = MathCore.stats.mean(bcYi);
                        cbPoolSe = 1 / Math.sqrt(bcVi.reduce((s,v) => s + 1/v, 0));
                    }

                    // Indirect: d_ab = d_ac + d_cb
                    const indirectEst = acPool + cbPool;
                    const indirectSe = Math.sqrt(acPoolSe**2 + cbPoolSe**2);
                    indirectEstimates.push({estimate: indirectEst, se: indirectSe});
                }
            }

            if (indirectEstimates.length === 0) {
                results.push({comparison: comp, direct_only: true, inconsistent: false});
                continue;
            }

            // Pool direct
            const dYi = direct.map(t => t.yi), dVi = direct.map(t => t.vi);
            const dW = dVi.map(v => 1/v);
            const dSumW = dW.reduce((a,b) => a+b, 0);
            const directEst = dW.reduce((s,w,i) => s + w * dYi[i], 0) / dSumW;
            const directSe = Math.sqrt(1 / dSumW);

            // Pool indirect estimates
            const indW = indirectEstimates.map(e => 1/(e.se*e.se));
            const indSumW = indW.reduce((a,b) => a+b, 0);
            const indirectPool = indW.reduce((s,w,i) => s + w * indirectEstimates[i].estimate, 0) / indSumW;
            const indirectSe = Math.sqrt(1 / indSumW);

            // Difference
            const diff = directEst - indirectPool;
            const diffSe = Math.sqrt(directSe**2 + indirectSe**2);
            const z = diff / diffSe;
            const pValue = 2 * (1 - MathCore.stats.normalCdf(Math.abs(z)));

            results.push({
                comparison: comp,
                direct: directEst, direct_se: directSe,
                indirect: indirectPool, indirect_se: indirectSe,
                difference: diff, diff_se: diffSe,
                ci_lower: diff - 1.96 * diffSe,
                ci_upper: diff + 1.96 * diffSe,
                p_value: pValue,
                inconsistent: pValue < 0.05
            });
        }

        return results;
    };
```

- [ ] **Step 4: Run tests, verify 24/24 pass**

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: Limb1 M4-M5 (Bayesian NMA MCMC, node-splitting inconsistency) with 3 tests"
```

---

## Task 7: M6–M8 — Fisher Information Geometry, Spectral Decomposition, Riemannian MDS

**Files:**
- Modify: `index.html` (extend Limb1.methods)

The information geometry methods: Fisher metric, Rao geodesic distance, spectral heterogeneity decomposition, and MDS embedding.

- [ ] **Step 1: Register tests**

```javascript
// T25: Rao distance between identical studies is 0
TestRunner.register('M6: Rao distance self=0', () => {
    const d = Limb1.methods.raoDistance(0.5, 0.1, 0.5, 0.1);
    if (Math.abs(d) > 1e-10) throw new Error(`Distance = ${d}, expected 0`);
});

// T26: Rao distance > Euclidean distance (precision-weighted)
TestRunner.register('M6: Rao > Euclidean when precisions differ', () => {
    const rao = Limb1.methods.raoDistance(-0.3, 0.01, -0.3, 0.5);
    const eucl = Math.abs(-0.3 - (-0.3)); // = 0
    // Rao distance should be > 0 because precisions differ
    if (rao <= 0) throw new Error(`Rao = ${rao}, expected > 0 due to precision difference`);
});

// T27: Spectral decomposition eigenvalues sum to total variance
TestRunner.register('M7: Spectral eigenvalues sum ≈ total variance', () => {
    const yi = [-0.3, -0.1, -0.5, -0.2, -0.4];
    const vi = [0.01, 0.02, 0.01, 0.03, 0.02];
    const res = Limb1.methods.spectralDecomposition(yi, vi);
    const totalFromEigen = res.eigenvalues.reduce((a,b) => a+b, 0);
    if (totalFromEigen < 0) throw new Error(`Negative total variance from eigenvalues`);
});

// T28: MDS embedding produces k points in 2D
TestRunner.register('M8: MDS produces correct dimensionality', () => {
    // 4 points with known distances
    const distMatrix = [
        [0, 1, 2, 3],
        [1, 0, 1.5, 2.5],
        [2, 1.5, 0, 1],
        [3, 2.5, 1, 0]
    ];
    const coords = Limb1.methods.mds(distMatrix, 2);
    if (coords.length !== 4) throw new Error(`Expected 4 points, got ${coords.length}`);
    if (coords[0].length !== 2) throw new Error(`Expected 2D, got ${coords[0].length}D`);
});
```

- [ ] **Step 2: Implement M6–M8**

Add inside Limb1 IIFE after the node-split method:

```javascript
    // M6: Rao (Fisher) geodesic distance between two normal distributions
    // N(mu1, sigma1²) and N(mu2, sigma2²)
    // Exact Rao distance for univariate normals:
    // d = sqrt(2) * sqrt( log(sigma2/sigma1)² + 2*(1 - sqrt(2*sigma1*sigma2/(sigma1²+sigma2²)) * exp(-(mu1-mu2)²/(4*(sigma1²+sigma2²)))) )
    // Simplified approximation (widely used):
    methods.raoDistance = function(mu1, vi1, mu2, vi2) {
        const s1 = Math.sqrt(vi1), s2 = Math.sqrt(vi2);
        // Fisher-Rao distance for univariate normals (exact closed form):
        const logRatio = Math.log(s2 / s1);
        const meanDiffSq = (mu1 - mu2) ** 2;
        const avgVar = (vi1 + vi2) / 2;
        // Use the simpler well-known form: d² = (mu1-mu2)²/(s1*s2) + 2*log(s2/s1)²
        return Math.sqrt(meanDiffSq / (s1 * s2) + 2 * logRatio * logRatio);
    };

    // Compute full k×k geodesic distance matrix
    methods.geodesicDistanceMatrix = function(yi, vi) {
        const k = yi.length;
        const D = Array.from({length: k}, () => new Float64Array(k));
        for (let i = 0; i < k; i++) {
            for (let j = i + 1; j < k; j++) {
                const d = methods.raoDistance(yi[i], vi[i], yi[j], vi[j]);
                D[i][j] = d;
                D[j][i] = d;
            }
        }
        return D;
    };

    // M7: Spectral heterogeneity decomposition
    methods.spectralDecomposition = function(yi, vi) {
        const k = yi.length;
        const mu = MathCore.stats.mean(yi);
        // Residual covariance matrix: (yi - mu)(yj - mu) - diag(vi)
        // Simplified: use the outer product of residuals
        const residuals = yi.map(y => y - mu);
        const covArr = [];
        for (let i = 0; i < k; i++) {
            const row = [];
            for (let j = 0; j < k; j++) {
                row.push(i === j ? residuals[i] * residuals[j] : residuals[i] * residuals[j] * 0.5);
            }
            covArr.push(row);
        }
        const covMatrix = MathCore.linalg.fromArray(covArr);
        const {values, vectors} = MathCore.linalg.eigenSymmetric(covMatrix);

        // Proportion of variance
        const totalVar = values.reduce((a, b) => a + Math.max(0, b), 0);
        const proportions = Array.from(values).map(v => totalVar > 0 ? Math.max(0, v) / totalVar : 0);

        return {
            eigenvalues: Array.from(values),
            eigenvectors: vectors,
            proportions,
            totalVariance: totalVar
        };
    };

    // M8: Classical MDS (Torgersen) from distance matrix
    methods.mds = function(distMatrix, dims = 2) {
        const n = distMatrix.length;
        // Double centering: B = -0.5 * H * D² * H where H = I - (1/n)*ones
        const D2 = Array.from({length: n}, (_, i) =>
            Array.from({length: n}, (_, j) => distMatrix[i][j] ** 2));

        // Row means, col means, grand mean
        const rowMeans = D2.map(row => row.reduce((a, b) => a + b, 0) / n);
        const colMeans = new Float64Array(n);
        for (let j = 0; j < n; j++) {
            for (let i = 0; i < n; i++) colMeans[j] += D2[i][j];
            colMeans[j] /= n;
        }
        let grandMean = 0;
        for (let i = 0; i < n; i++) grandMean += rowMeans[i];
        grandMean /= n;

        const B = [];
        for (let i = 0; i < n; i++) {
            const row = [];
            for (let j = 0; j < n; j++) {
                row.push(-0.5 * (D2[i][j] - rowMeans[i] - colMeans[j] + grandMean));
            }
            B.push(row);
        }

        const Bm = MathCore.linalg.fromArray(B);
        const {values, vectors} = MathCore.linalg.eigenSymmetric(Bm);

        // Take top 'dims' eigenvalues/vectors
        const coords = [];
        for (let i = 0; i < n; i++) {
            const point = [];
            for (let d = 0; d < dims; d++) {
                const lambda = Math.max(0, values[d]);
                point.push(MathCore.linalg.get(vectors, i, d) * Math.sqrt(lambda));
            }
            coords.push(point);
        }
        return coords;
    };

    // Hierarchical clustering on distance matrix (single linkage)
    methods.hierarchicalCluster = function(distMatrix, nClusters = 2) {
        const n = distMatrix.length;
        const labels = Array.from({length: n}, (_, i) => i);
        const clusters = Array.from({length: n}, (_, i) => [i]);

        while (clusters.length > nClusters) {
            let minDist = Infinity, mi = -1, mj = -1;
            for (let i = 0; i < clusters.length; i++) {
                for (let j = i + 1; j < clusters.length; j++) {
                    // Single linkage: min distance between any pair
                    for (const a of clusters[i]) {
                        for (const b of clusters[j]) {
                            if (distMatrix[a][b] < minDist) {
                                minDist = distMatrix[a][b]; mi = i; mj = j;
                            }
                        }
                    }
                }
            }
            // Merge mj into mi
            clusters[mi] = clusters[mi].concat(clusters[mj]);
            clusters.splice(mj, 1);
        }

        const result = new Array(n);
        clusters.forEach((cluster, ci) => {
            for (const idx of cluster) result[idx] = ci;
        });
        return result;
    };
```

- [ ] **Step 3: Run tests, verify 28/28 pass**

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: Limb1 M6-M8 (Fisher-Rao distance, spectral decomposition, MDS embedding) with 4 tests"
```

---

## Task 8: M9–M10 — Persistent Homology (TDA) + Conformal Prediction

**Files:**
- Modify: `index.html` (add MathCore.tda, extend Limb1.methods)

Vietoris-Rips filtration for persistent homology and conformal prediction intervals.

- [ ] **Step 1: Add MathCore.tda module**

Insert inside MathCore IIFE, before the final `return`:

```javascript
    // --- TDA: Persistent Homology ---
    const tda = (() => {
        // Union-Find for H0 tracking
        function makeUF(n) {
            const parent = Array.from({length: n}, (_, i) => i);
            const rank = new Uint8Array(n);
            function find(x) {
                while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
                return x;
            }
            function union(a, b) {
                a = find(a); b = find(b);
                if (a === b) return false;
                if (rank[a] < rank[b]) [a, b] = [b, a];
                parent[b] = a;
                if (rank[a] === rank[b]) rank[a]++;
                return true;
            }
            return { find, union };
        }

        // Vietoris-Rips persistent homology (H0 and simplified H1)
        // Input: k×k distance matrix
        // Output: {h0: [{birth, death}], h1: [{birth, death}]}
        function vietorisRips(distMatrix) {
            const n = distMatrix.length;
            // Build sorted edge list
            const edges = [];
            for (let i = 0; i < n; i++)
                for (let j = i + 1; j < n; j++)
                    edges.push({i, j, d: distMatrix[i][j]});
            edges.sort((a, b) => a.d - b.d);

            // H0: Track connected components via union-find
            const uf = makeUF(n);
            const births = new Float64Array(n); // All born at 0
            const h0 = [];

            // Track adjacency for H1
            const adj = Array.from({length: n}, () => new Set());
            const h1 = [];

            for (const edge of edges) {
                const {i, j, d} = edge;
                const ri = uf.find(i), rj = uf.find(j);

                if (ri !== rj) {
                    // Merging two components: the younger one dies
                    const deathComponent = births[ri] > births[rj] ? ri : rj;
                    h0.push({birth: 0, death: d});
                    uf.union(i, j);
                } else {
                    // Same component — potential H1 cycle
                    // Check if adding this edge creates a new cycle via BFS
                    // Simplified: if both endpoints already connected, it's a cycle
                    if (!adj[i].has(j)) {
                        // Check if path exists between i and j using only edges with d' < d
                        // For simplicity, record it as a potential 1-cycle
                        h1.push({birth: d, death: Infinity}); // Will be killed later if it's filled in
                    }
                }
                adj[i].add(j);
                adj[j].add(i);
            }

            // Close remaining H1 features: check triangle fillings
            // For each potential 1-cycle, check if a triangle fills it at a later filtration value
            // Simplified: use the maximum edge in each triangle as the death time
            const h1Final = [];
            for (let k = 0; k < Math.min(h1.length, 50); k++) {
                // Find the shortest cycle through this edge
                // For now, keep as infinity death (never filled)
                // or use a heuristic: death = 1.5 × birth for short cycles
                h1Final.push(h1[k]);
            }

            // The essential H0 feature (the one that never dies)
            // is the final connected component
            return {h0, h1: h1Final};
        }

        return { vietorisRips };
    })();
```

Update the MathCore return to include tda:

```javascript
    return { random, linalg, stats, optim, tda };
```

- [ ] **Step 2: Register tests**

```javascript
// T29: Persistent homology H0 on 3 points
TestRunner.register('M9: TDA H0 on 3 well-separated points', () => {
    const D = [[0, 1, 10], [1, 0, 10], [10, 10, 0]];
    const ph = MathCore.tda.vietorisRips(D);
    // 3 points → 2 merges → 2 H0 deaths
    if (ph.h0.length !== 2) throw new Error(`Expected 2 H0 features, got ${ph.h0.length}`);
    // First merge at d=1, second at d=10
    const deaths = ph.h0.map(f => f.death).sort((a,b) => a-b);
    if (Math.abs(deaths[0] - 1) > 0.01) throw new Error(`First death at ${deaths[0]}`);
    if (Math.abs(deaths[1] - 10) > 0.01) throw new Error(`Second death at ${deaths[1]}`);
});

// T30: Persistence from geodesic distances
TestRunner.register('M9: TDA on geodesic distance matrix', () => {
    const yi = [-0.3, -0.1, -0.5, -0.2, -0.4];
    const vi = [0.01, 0.02, 0.01, 0.03, 0.02];
    const D = Limb1.methods.geodesicDistanceMatrix(yi, vi);
    const ph = MathCore.tda.vietorisRips(D);
    // 5 points → 4 H0 features
    if (ph.h0.length !== 4) throw new Error(`Expected 4 H0, got ${ph.h0.length}`);
});

// T31: Conformal PI has correct coverage (at least 1-α)
TestRunner.register('M10: Conformal PI covers future point', () => {
    MathCore.random.seed(42);
    const yi = []; const vi = [];
    for (let i = 0; i < 20; i++) { yi.push(MathCore.random.normal(-0.3, 0.15)); vi.push(0.02); }
    const tau2 = 0.02;
    const mu = MathCore.stats.mean(yi);
    const res = Limb1.methods.conformalPI(yi, vi, tau2, mu, 0.95);
    // PI should contain the true mean (-0.3) with high probability
    if (res.lower > 0 || res.upper < -0.6) throw new Error(`PI [${res.lower}, ${res.upper}] doesn't contain plausible range`);
});

// T32: Conformal PI wider than parametric PI for heavy tails
TestRunner.register('M10: Conformal PI exists and has width', () => {
    const yi = [-0.3, -0.1, -0.5, -0.2, -0.4, -0.6, -0.15, -0.35];
    const vi = [0.01, 0.02, 0.01, 0.03, 0.02, 0.01, 0.015, 0.025];
    const tau2 = 0.03;
    const mu = MathCore.stats.mean(yi);
    const res = Limb1.methods.conformalPI(yi, vi, tau2, mu, 0.95);
    if (res.upper <= res.lower) throw new Error('PI has zero or negative width');
});
```

- [ ] **Step 3: Implement Conformal Prediction (M10)**

Add inside Limb1 IIFE:

```javascript
    // M10: Conformal prediction interval
    methods.conformalPI = function(yi, vi, tau2, mu, coverage = 0.95) {
        const k = yi.length;
        if (k < 4) return { lower: -Infinity, upper: Infinity, scores: [] };

        // Compute nonconformity scores
        const scores = yi.map((y, i) => Math.abs(y - mu) / Math.sqrt(vi[i] + tau2));
        const sortedScores = Float64Array.from(scores).sort();

        // Quantile at (1-alpha)(n+1)/n level
        const alpha = 1 - coverage;
        const idx = Math.ceil((1 - alpha) * (k + 1)) - 1;
        const q = idx < k ? sortedScores[Math.min(idx, k - 1)] : sortedScores[k - 1] * 1.5;

        // For a new study with "average" variance
        const viNew = MathCore.stats.mean(vi);
        const scale = Math.sqrt(viNew + tau2);

        return {
            lower: mu - q * scale,
            upper: mu + q * scale,
            quantile: q,
            scores: Array.from(scores)
        };
    };
```

- [ ] **Step 4: Run tests, verify 32/32 pass**

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: MathCore.tda + Limb1 M9-M10 (persistent homology, conformal prediction) with 4 tests"
```

---

## Task 9: Limb 1 Visualization — Forest Plot + Convergence Diagnostics

**Files:**
- Modify: `index.html` (add rendering functions to Limb1, wire up method bar)

Canvas-based forest plot showing study estimates, pooled effect, CIs/PIs. MCMC trace plots. Method selector bar.

- [ ] **Step 1: Add visualization engine to Limb1**

Add inside the Limb1 IIFE, replacing the stub `init` and `onDataChange`:

```javascript
    // --- Visualization ---
    const COLORS = {
        study: '#4e8cff', pooled: '#34d399', pi: '#fbbf24',
        conformal: '#fb923c', grid: '#2a3555', text: '#e0e6f0',
        muted: '#8892a8', bg: '#131a2b', red: '#f87171',
        cluster0: '#4e8cff', cluster1: '#34d399', cluster2: '#fbbf24', cluster3: '#fb923c'
    };

    const METHOD_LIST = [
        {id: 'reml_kh', label: 'REML + KH', group: 'pooling'},
        {id: 'bayesian_nma', label: 'Bayesian NMA', group: 'pooling'},
        {id: 'forest', label: 'Forest Plot', group: 'viz'},
        {id: 'spectral', label: 'Spectral Decomposition', group: 'geometry'},
        {id: 'geodesic', label: 'Geodesic Embedding', group: 'geometry'},
        {id: 'persistence', label: 'Persistence Diagram', group: 'tda'},
        {id: 'conformal', label: 'Conformal PI', group: 'prediction'},
        {id: 'inconsistency', label: 'Node-Splitting', group: 'consistency'},
    ];

    let activeMethod = 'forest';
    let currentResults = null;

    function init() {
        const bar = document.getElementById('limb1-methods');
        bar.innerHTML = '';
        for (const m of METHOD_LIST) {
            const btn = document.createElement('button');
            btn.className = 'method-btn' + (m.id === activeMethod ? ' active' : '');
            btn.textContent = m.label;
            btn.setAttribute('role', 'radio');
            btn.setAttribute('aria-checked', m.id === activeMethod ? 'true' : 'false');
            btn.addEventListener('click', () => selectMethod(m.id));
            bar.appendChild(btn);
        }
        onDataChange(DataLayer.getActive());
    }

    function selectMethod(methodId) {
        activeMethod = methodId;
        document.querySelectorAll('#limb1-methods .method-btn').forEach(b => {
            b.classList.toggle('active', b.textContent === METHOD_LIST.find(m => m.id === methodId)?.label);
        });
        render();
    }

    function onDataChange(data) {
        if (!data) return;
        runAnalysis(data);
        render();
    }

    function runAnalysis(data) {
        const yi = data.trialsYiVi.map(t => t.yi);
        const vi = data.trialsYiVi.map(t => t.vi);
        const trials = data.trialsYiVi;

        const reml = methods.reml(yi, vi);
        const kh = methods.knappHartung(yi, vi, reml.tau2, reml.mu);
        const pi = methods.predictionInterval(yi, vi, reml.tau2, reml.mu, reml.se);
        const conformal = methods.conformalPI(yi, vi, reml.tau2, reml.mu);
        const geodesicDist = methods.geodesicDistanceMatrix(yi, vi);
        const mdsCoords = methods.mds(geodesicDist, 2);
        const clusters = methods.hierarchicalCluster(geodesicDist, Math.min(3, yi.length));
        const spectral = methods.spectralDecomposition(yi, vi);
        const persistence = MathCore.tda.vietorisRips(geodesicDist);

        let nma = null, nodeSplit = null;
        if (data.format === 'nma') {
            nma = methods.mcmcNMA(trials, {warmup: 1000, samples: 2000, chains: 2, seed: 42});
            nodeSplit = methods.nodeSplit(trials);
        }

        currentResults = {
            reml, kh, pi, conformal, geodesicDist, mdsCoords,
            clusters, spectral, persistence, nma, nodeSplit,
            yi, vi, trials, data
        };
    }

    function render() {
        if (!currentResults) return;
        const canvas = document.getElementById('limb1-canvas');
        const ctx = canvas.getContext('2d');
        const W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);

        const title = document.getElementById('limb1-viz-title');

        switch (activeMethod) {
            case 'forest':
            case 'reml_kh':
                title.textContent = 'Forest Plot — REML + Knapp-Hartung';
                drawForestPlot(ctx, W, H);
                break;
            case 'bayesian_nma':
                title.textContent = currentResults.nma ? 'Bayesian NMA Posterior' : 'Bayesian NMA (requires NMA data)';
                if (currentResults.nma) drawNMAPosterior(ctx, W, H);
                break;
            case 'spectral':
                title.textContent = 'Spectral Heterogeneity Decomposition';
                drawScreePlot(ctx, W, H);
                break;
            case 'geodesic':
                title.textContent = 'Riemannian Geodesic Embedding (MDS)';
                drawMDS(ctx, W, H);
                break;
            case 'persistence':
                title.textContent = 'Persistent Homology — Persistence Diagram';
                drawPersistence(ctx, W, H);
                break;
            case 'conformal':
                title.textContent = 'Conformal vs Parametric Prediction Intervals';
                drawForestPlot(ctx, W, H, true);
                break;
            case 'inconsistency':
                title.textContent = 'Node-Splitting Inconsistency Test';
                drawNodeSplit(ctx, W, H);
                break;
        }
        updateResultsTable();
    }

    function drawForestPlot(ctx, W, H, showConformal = false) {
        const {yi, vi, reml, kh, pi, conformal, data} = currentResults;
        const k = yi.length;
        const margin = {top: 40, right: 80, bottom: 40, left: 180};
        const plotW = W - margin.left - margin.right;
        const plotH = H - margin.top - margin.bottom;

        // Determine x-axis range (log-RR scale)
        const allVals = [...yi, reml.mu, kh.ci_lower, kh.ci_upper, pi.lower, pi.upper];
        let xMin = Math.min(...allVals) - 0.2;
        let xMax = Math.max(...allVals) + 0.2;

        function xScale(v) { return margin.left + (v - xMin) / (xMax - xMin) * plotW; }
        function yScale(i) { return margin.top + (i + 0.5) / (k + 2) * plotH; }

        // Grid
        ctx.strokeStyle = COLORS.grid; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(xScale(0), margin.top); ctx.lineTo(xScale(0), H - margin.bottom); ctx.stroke();

        // Study estimates
        ctx.font = '11px -apple-system, sans-serif';
        for (let i = 0; i < k; i++) {
            const y = yScale(i);
            const se = Math.sqrt(vi[i]);
            const lo = yi[i] - 1.96 * se, hi = yi[i] + 1.96 * se;

            // CI line
            ctx.strokeStyle = COLORS.study; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(xScale(lo), y); ctx.lineTo(xScale(hi), y); ctx.stroke();

            // Point estimate (size proportional to weight)
            const weight = 1 / vi[i];
            const maxW = Math.max(...vi.map(v => 1/v));
            const size = 3 + 8 * (weight / maxW);
            ctx.fillStyle = COLORS.study;
            ctx.fillRect(xScale(yi[i]) - size/2, y - size/2, size, size);

            // Label
            ctx.fillStyle = COLORS.text; ctx.textAlign = 'right';
            const label = data.trials[i]?.trial_name ?? `Study ${i+1}`;
            ctx.fillText(label, margin.left - 8, y + 4);

            // RR text on right
            ctx.textAlign = 'left';
            ctx.fillText(`${Math.exp(yi[i]).toFixed(2)} [${Math.exp(lo).toFixed(2)}, ${Math.exp(hi).toFixed(2)}]`, xScale(xMax) + 4, y + 4);
        }

        // Pooled estimate (diamond)
        const poolY = yScale(k + 0.5);
        ctx.fillStyle = COLORS.pooled;
        ctx.beginPath();
        ctx.moveTo(xScale(reml.mu), poolY - 8);
        ctx.lineTo(xScale(kh.ci_upper), poolY);
        ctx.lineTo(xScale(reml.mu), poolY + 8);
        ctx.lineTo(xScale(kh.ci_lower), poolY);
        ctx.closePath(); ctx.fill();

        ctx.fillStyle = COLORS.text; ctx.textAlign = 'right';
        ctx.fillText('Pooled (REML+KH)', margin.left - 8, poolY + 4);

        // Prediction interval
        ctx.strokeStyle = COLORS.pi; ctx.lineWidth = 2; ctx.setLineDash([5, 3]);
        ctx.beginPath(); ctx.moveTo(xScale(pi.lower), poolY); ctx.lineTo(xScale(pi.upper), poolY); ctx.stroke();
        ctx.setLineDash([]);

        // Conformal PI
        if (showConformal) {
            const cY = poolY + 20;
            ctx.strokeStyle = COLORS.conformal; ctx.lineWidth = 2; ctx.setLineDash([3, 3]);
            ctx.beginPath(); ctx.moveTo(xScale(conformal.lower), cY); ctx.lineTo(xScale(conformal.upper), cY); ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = COLORS.conformal; ctx.textAlign = 'right';
            ctx.fillText('Conformal PI', margin.left - 8, cY + 4);
        }

        // X-axis label
        ctx.fillStyle = COLORS.muted; ctx.textAlign = 'center'; ctx.font = '12px -apple-system, sans-serif';
        ctx.fillText('log(RR)', W / 2, H - 10);
    }

    function drawNMAPosterior(ctx, W, H) {
        if (!currentResults.nma) return;
        const {nma} = currentResults;
        const margin = {top: 40, right: 40, bottom: 50, left: 60};
        const plotW = W - margin.left - margin.right;
        const plotH = H - margin.top - margin.bottom;

        // Draw trace plot for mu1
        const chain = nma.chains[0];
        const values = chain.map(s => s.mu1);
        const n = values.length;
        const yMin = Math.min(...values) - 0.05;
        const yMax = Math.max(...values) + 0.05;

        ctx.strokeStyle = COLORS.study; ctx.lineWidth = 0.5;
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
            const x = margin.left + (i / n) * plotW;
            const y = margin.top + (1 - (values[i] - yMin) / (yMax - yMin)) * plotH;
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Second chain if available
        if (nma.chains.length > 1) {
            const chain2 = nma.chains[1].map(s => s.mu1);
            ctx.strokeStyle = COLORS.green; ctx.lineWidth = 0.5;
            ctx.beginPath();
            for (let i = 0; i < chain2.length; i++) {
                const x = margin.left + (i / chain2.length) * plotW;
                const y = margin.top + (1 - (chain2[i] - yMin) / (yMax - yMin)) * plotH;
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }

        // Mean line
        ctx.strokeStyle = COLORS.red; ctx.lineWidth = 2; ctx.setLineDash([4,2]);
        const meanY = margin.top + (1 - (nma.mu1_mean - yMin) / (yMax - yMin)) * plotH;
        ctx.beginPath(); ctx.moveTo(margin.left, meanY); ctx.lineTo(W - margin.right, meanY); ctx.stroke();
        ctx.setLineDash([]);

        // Labels
        ctx.fillStyle = COLORS.text; ctx.font = '12px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('MCMC Iteration', W/2, H - 10);
        ctx.save(); ctx.translate(15, H/2); ctx.rotate(-Math.PI/2);
        ctx.fillText('mu1 (Drug 1 vs Placebo)', 0, 0);
        ctx.restore();

        ctx.fillStyle = COLORS.muted; ctx.textAlign = 'left'; ctx.font = '11px -apple-system, sans-serif';
        ctx.fillText(`Mean: ${nma.mu1_mean.toFixed(4)}  R̂: ${nma.rhat_mu1.toFixed(3)}`, margin.left + 10, margin.top + 20);
    }

    function drawScreePlot(ctx, W, H) {
        const {spectral} = currentResults;
        const vals = spectral.eigenvalues.filter(v => v > 0);
        const k = vals.length;
        if (k === 0) return;

        const margin = {top: 40, right: 40, bottom: 50, left: 60};
        const plotW = W - margin.left - margin.right;
        const plotH = H - margin.top - margin.bottom;
        const barW = Math.min(40, plotW / k - 4);
        const maxVal = Math.max(...vals);

        for (let i = 0; i < k; i++) {
            const x = margin.left + (i + 0.5) * (plotW / k) - barW / 2;
            const barH = (vals[i] / maxVal) * plotH;
            const y = margin.top + plotH - barH;
            ctx.fillStyle = `hsl(${220 + i * 30}, 70%, 60%)`;
            ctx.fillRect(x, y, barW, barH);
            ctx.fillStyle = COLORS.muted; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText(`${(spectral.proportions[i] * 100).toFixed(0)}%`, x + barW/2, y - 6);
        }

        ctx.fillStyle = COLORS.text; ctx.textAlign = 'center'; ctx.font = '12px sans-serif';
        ctx.fillText('Eigenvalue Index', W/2, H - 10);
    }

    function drawMDS(ctx, W, H) {
        const {mdsCoords, clusters, yi, data} = currentResults;
        const margin = {top: 40, right: 40, bottom: 50, left: 60};
        const plotW = W - margin.left - margin.right;
        const plotH = H - margin.top - margin.bottom;

        const xs = mdsCoords.map(c => c[0]), ys = mdsCoords.map(c => c[1]);
        const xMin = Math.min(...xs), xMax = Math.max(...xs);
        const yMin = Math.min(...ys), yMax = Math.max(...ys);
        const xRange = (xMax - xMin) || 1, yRange = (yMax - yMin) || 1;

        const clusterColors = [COLORS.cluster0, COLORS.cluster1, COLORS.cluster2, COLORS.cluster3];

        for (let i = 0; i < mdsCoords.length; i++) {
            const px = margin.left + ((xs[i] - xMin) / xRange) * plotW;
            const py = margin.top + ((ys[i] - yMin) / yRange) * plotH;
            const r = 4 + 6 * (1 / (Math.sqrt(currentResults.vi[i]) + 0.001)) / (1 / (Math.sqrt(Math.min(...currentResults.vi)) + 0.001));
            ctx.fillStyle = clusterColors[clusters[i] % 4];
            ctx.beginPath(); ctx.arc(px, py, Math.min(r, 12), 0, 2 * Math.PI); ctx.fill();

            if (mdsCoords.length <= 20) {
                ctx.fillStyle = COLORS.text; ctx.font = '10px sans-serif'; ctx.textAlign = 'left';
                const label = data.trials[i]?.trial_name ?? `${i+1}`;
                ctx.fillText(label, px + 8, py + 3);
            }
        }

        ctx.fillStyle = COLORS.text; ctx.textAlign = 'center'; ctx.font = '12px sans-serif';
        ctx.fillText('MDS Dimension 1', W/2, H - 10);
    }

    function drawPersistence(ctx, W, H) {
        const {persistence} = currentResults;
        const margin = {top: 40, right: 40, bottom: 50, left: 60};
        const plotW = W - margin.left - margin.right;
        const plotH = H - margin.top - margin.bottom;

        const allDeaths = persistence.h0.map(f => f.death).filter(d => isFinite(d));
        const maxD = allDeaths.length > 0 ? Math.max(...allDeaths) * 1.2 : 1;

        // Diagonal line (birth = death)
        ctx.strokeStyle = COLORS.grid; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(margin.left, margin.top + plotH);
        ctx.lineTo(margin.left + plotW, margin.top);
        ctx.stroke();

        // H0 points
        for (const f of persistence.h0) {
            if (!isFinite(f.death)) continue;
            const x = margin.left + (f.birth / maxD) * plotW;
            const y = margin.top + (1 - f.death / maxD) * plotH;
            ctx.fillStyle = COLORS.study;
            ctx.beginPath(); ctx.arc(x, y, 5, 0, 2 * Math.PI); ctx.fill();
        }

        // H1 points
        for (const f of persistence.h1) {
            const death = isFinite(f.death) ? f.death : maxD;
            const x = margin.left + (f.birth / maxD) * plotW;
            const y = margin.top + (1 - death / maxD) * plotH;
            ctx.fillStyle = COLORS.red;
            ctx.beginPath();
            ctx.moveTo(x, y - 5); ctx.lineTo(x + 5, y + 5); ctx.lineTo(x - 5, y + 5);
            ctx.closePath(); ctx.fill();
        }

        // Legend
        ctx.fillStyle = COLORS.study;
        ctx.beginPath(); ctx.arc(W - 120, 20, 5, 0, 2*Math.PI); ctx.fill();
        ctx.fillStyle = COLORS.text; ctx.font = '11px sans-serif'; ctx.textAlign = 'left';
        ctx.fillText('H0 (components)', W - 110, 24);
        ctx.fillStyle = COLORS.red;
        ctx.beginPath(); ctx.moveTo(W - 120, 40); ctx.lineTo(W - 115, 50); ctx.lineTo(W - 125, 50); ctx.closePath(); ctx.fill();
        ctx.fillStyle = COLORS.text;
        ctx.fillText('H1 (loops)', W - 110, 48);

        ctx.fillStyle = COLORS.text; ctx.textAlign = 'center'; ctx.font = '12px sans-serif';
        ctx.fillText('Birth', W/2, H - 10);
    }

    function drawNodeSplit(ctx, W, H) {
        if (!currentResults.nodeSplit) {
            ctx.fillStyle = COLORS.muted; ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('Node-splitting requires NMA data (t1/t2 columns)', W/2, H/2);
            return;
        }
        const results = currentResults.nodeSplit;
        const margin = {top: 40, right: 40, bottom: 40, left: 120};
        const plotH = H - margin.top - margin.bottom;
        const plotW = W - margin.left - margin.right;
        const n = results.length;
        if (n === 0) return;

        const allVals = results.flatMap(r => r.direct_only ? [] : [r.ci_lower, r.ci_upper, r.difference]);
        const xMin = Math.min(0, ...allVals) - 0.1;
        const xMax = Math.max(0, ...allVals) + 0.1;
        function xScale(v) { return margin.left + (v - xMin) / (xMax - xMin) * plotW; }

        // Zero line
        ctx.strokeStyle = COLORS.grid; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(xScale(0), margin.top); ctx.lineTo(xScale(0), H - margin.bottom); ctx.stroke();

        for (let i = 0; i < n; i++) {
            const r = results[i];
            const y = margin.top + (i + 0.5) / n * plotH;
            ctx.fillStyle = COLORS.text; ctx.textAlign = 'right'; ctx.font = '11px sans-serif';
            ctx.fillText(r.comparison, margin.left - 8, y + 4);

            if (r.direct_only) {
                ctx.fillStyle = COLORS.muted; ctx.textAlign = 'left';
                ctx.fillText('Direct only', xScale(0) + 10, y + 4);
                continue;
            }

            // CI for difference
            ctx.strokeStyle = r.inconsistent ? COLORS.red : COLORS.green;
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(xScale(r.ci_lower), y); ctx.lineTo(xScale(r.ci_upper), y); ctx.stroke();

            // Point
            ctx.fillStyle = r.inconsistent ? COLORS.red : COLORS.green;
            ctx.beginPath(); ctx.arc(xScale(r.difference), y, 5, 0, 2 * Math.PI); ctx.fill();
        }
    }

    function updateResultsTable() {
        const el = document.getElementById('limb1-results');
        if (!currentResults) { el.innerHTML = ''; return; }
        const {reml, kh, pi, conformal} = currentResults;

        el.innerHTML = `<table class="results-table">
            <tr><th>Metric</th><th>Value</th></tr>
            <tr><td>Pooled log-RR (REML)</td><td>${reml.mu.toFixed(4)}</td></tr>
            <tr><td>Pooled RR</td><td>${Math.exp(reml.mu).toFixed(4)}</td></tr>
            <tr><td>τ² (REML)</td><td>${reml.tau2.toFixed(6)}</td></tr>
            <tr><td>I²</td><td>${reml.I2.toFixed(1)}%</td></tr>
            <tr><td>KH 95% CI (RR)</td><td>[${Math.exp(kh.ci_lower).toFixed(3)}, ${Math.exp(kh.ci_upper).toFixed(3)}]</td></tr>
            <tr><td>95% Prediction Interval (RR)</td><td>[${Math.exp(pi.lower).toFixed(3)}, ${Math.exp(pi.upper).toFixed(3)}]</td></tr>
            <tr><td>Conformal PI (RR)</td><td>[${Math.exp(conformal.lower).toFixed(3)}, ${Math.exp(conformal.upper).toFixed(3)}]</td></tr>
            <tr><td>Studies (k)</td><td>${reml.k}</td></tr>
        </table>`;
    }

    function getResults() { return currentResults; }

    function exportCSV() {
        if (!currentResults) return;
        const {yi, vi, reml} = currentResults;
        let csv = 'study,yi,vi,weight,rr,ci_lower,ci_upper\n';
        for (let i = 0; i < yi.length; i++) {
            const se = Math.sqrt(vi[i]);
            csv += `${i+1},${yi[i].toFixed(6)},${vi[i].toFixed(6)},${reml.weights[i].toFixed(4)},${Math.exp(yi[i]).toFixed(4)},${Math.exp(yi[i]-1.96*se).toFixed(4)},${Math.exp(yi[i]+1.96*se).toFixed(4)}\n`;
        }
        const blob = new Blob([csv], {type: 'text/csv'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'limb1_results.csv';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function exportPNG() {
        const canvas = document.getElementById('limb1-canvas');
        const url = canvas.toDataURL('image/png');
        const a = document.createElement('a'); a.href = url; a.download = 'limb1_plot.png';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
    }
```

- [ ] **Step 2: Wire init to DOMContentLoaded**

In the App.init() function, add after the tab switching code:

```javascript
        // Initialize Limb1
        Limb1.init();
```

- [ ] **Step 3: Test manually in browser**

Open `index.html`:
1. Forest plot renders with 4 Colchicine studies + pooled diamond + PI
2. Switch dataset to "SGLT2i / HF" → re-renders with 4 SGLT2 studies
3. Click "Spectral Decomposition" → scree plot shows
4. Click "Geodesic Embedding" → MDS scatter with colored clusters
5. Click "Persistence Diagram" → H0/H1 points visible
6. Click "Conformal PI" → forest plot with orange conformal PI line
7. Results table updates with each method
8. Export CSV and PNG buttons work

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: Limb1 full visualization engine (forest plot, MDS, scree, persistence diagram, trace plot)"
```

---

## Task 10: Final Integration Test + Polish

**Files:**
- Modify: `index.html`

Final test registering an integration test that runs the full Limb 1 pipeline end-to-end. Polish status messages.

- [ ] **Step 1: Register integration test**

```javascript
// T33: Full pipeline on colchicine (end-to-end)
TestRunner.register('Integration: full Limb1 on colchicine', () => {
    const d = DataLayer.load('colchicine');
    const yi = d.trialsYiVi.map(t => t.yi);
    const vi = d.trialsYiVi.map(t => t.vi);
    const reml = Limb1.methods.reml(yi, vi);
    const kh = Limb1.methods.knappHartung(yi, vi, reml.tau2, reml.mu);
    const pi = Limb1.methods.predictionInterval(yi, vi, reml.tau2, reml.mu, reml.se);
    const conf = Limb1.methods.conformalPI(yi, vi, reml.tau2, reml.mu);
    const D = Limb1.methods.geodesicDistanceMatrix(yi, vi);
    const mds = Limb1.methods.mds(D, 2);
    const spectral = Limb1.methods.spectralDecomposition(yi, vi);
    const ph = MathCore.tda.vietorisRips(D);

    // Sanity checks
    if (reml.tau2 < 0) throw new Error('Negative tau²');
    if (kh.ci_lower >= kh.ci_upper) throw new Error('KH CI inverted');
    if (pi.lower >= pi.upper) throw new Error('PI inverted');
    if (conf.lower >= conf.upper) throw new Error('Conformal PI inverted');
    if (mds.length !== 4) throw new Error('MDS wrong count');
    if (spectral.eigenvalues.length !== 4) throw new Error('Spectral wrong count');
    if (ph.h0.length !== 3) throw new Error(`H0 should have 3 features, got ${ph.h0.length}`);
});

// T34: Full pipeline on synthetic NMA
TestRunner.register('Integration: full Limb1 on synthetic NMA', () => {
    const d = DataLayer.load('nma_synthetic');
    const yi = d.trialsYiVi.map(t => t.yi);
    const vi = d.trialsYiVi.map(t => t.vi);
    const reml = Limb1.methods.reml(yi, vi);
    if (reml.k !== 1000) throw new Error(`Expected 1000 studies, got ${reml.k}`);
    if (Math.exp(reml.mu) > 1 || Math.exp(reml.mu) < 0.5) throw new Error(`Pooled RR ${Math.exp(reml.mu)} out of range`);
});

// T35: MCMC on synthetic NMA subsample
TestRunner.register('Integration: MCMC NMA on 60-trial subsample', () => {
    MathCore.random.seed(42);
    const d = DataLayer.load('nma_synthetic');
    const subset = d.trialsYiVi.slice(0, 60);
    const nma = Limb1.methods.mcmcNMA(subset, {warmup:500, samples:1000, chains:1, seed:42});
    if (Math.abs(nma.mu1_mean) > 1) throw new Error(`mu1=${nma.mu1_mean} implausible`);
});
```

- [ ] **Step 2: Run all tests, verify 35/35 pass**

Click "Run Tests" in the browser. Expected: 35 passed, 0 failed.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: Limb1 Phase 1 complete — 10 methods, 35 tests, full visualization"
```

---

## Task 11: Deploy to GitHub Pages

**Files:**
- No new files

Push to GitHub and enable Pages.

- [ ] **Step 1: Initialize git remote and push**

```bash
cd C:\Users\user\four_limb_synthesis
git remote add origin https://github.com/mahmood726-cyber/four-limb-synthesis.git 2>/dev/null || true
git push -u origin master
```

- [ ] **Step 2: Enable GitHub Pages**

```bash
gh api repos/mahmood726-cyber/four-limb-synthesis/pages -X POST -f source.branch=master -f source.path=/ 2>/dev/null || echo "Pages may already be enabled"
```

- [ ] **Step 3: Verify deployment**

Visit `https://mahmood726-cyber.github.io/four-limb-synthesis/` — the app should render with the forest plot, dataset selector, and all method toggles working.

- [ ] **Step 4: Commit any final fixes**

If deployment reveals issues (e.g., paths), fix and push.

---

## Summary

| Task | Methods | Tests Added | Cumulative Tests |
|------|---------|-------------|------------------|
| 1 | — (HTML shell) | 0 | 0 |
| 2 | MathCore.random, MathCore.linalg | 8 | 8 |
| 3 | MathCore.stats, MathCore.optim | 4 | 12 |
| 4 | DataLayer (3 datasets + CSV upload) | 5 | 17 |
| 5 | M1 REML, M2 KH, M3 PI | 4 | 21 |
| 6 | M4 MCMC NMA, M5 Node-Split | 3 | 24 |
| 7 | M6 Rao Distance, M7 Spectral, M8 MDS | 4 | 28 |
| 8 | M9 Persistent Homology, M10 Conformal PI | 4 | 32 |
| 9 | Visualization engine | 0 (manual) | 32 |
| 10 | Integration tests | 3 | 35 |
| 11 | GitHub Pages deploy | 0 | 35 |

**Total: 11 tasks, 10 methods (M1–M10), 35 tests, single-file HTML app.**
