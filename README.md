# four-limb-synthesis

Four-Limb Evidence Synthesis — a single-file, offline HTML application that
combines several evidence-synthesis and modelling methods across three working
"limbs". All computation runs in the browser via an embedded JavaScript
math/statistics core (no external CDN, no network calls).

## Limbs

- **Limb 1 — Trial Efficacy**: REML τ² estimation, Knapp–Hartung adjustment,
  prediction intervals, Bayesian NMA (Metropolis-within-Gibbs) with
  node-splitting inconsistency check, spectral heterogeneity decomposition,
  classical MDS, topological data analysis (Vietoris–Rips H0), and conformal
  prediction intervals.
- **Limb 2 — Causal Transport**: IPSW and AIPW transport, optimal transport
  (Sinkhorn), MMD two-sample test, do-calculus causal transport, knockoff
  variable selection, KLIEP density-ratio estimation, and the Mapper algorithm.
- **Limb 3 — Economics**: Bass-diffusion SDE (Euler–Maruyama), mean-field game
  equilibrium, Hamilton–Jacobi–Bellman optimal control, regime-switching HMM
  (Viterbi), network diffusion via the graph Laplacian, real-options analysis,
  Neural ODE, and NSGA-II multi-objective optimization.
- **Limb 4 — Uncertainty**: in development (tab disabled in the current build).

## Run

Open `index.html` in any modern browser — it is fully self-contained and works
offline.

## Tests

```
node test_node.js          # full suite (65 checks)
node test_runner.js        # focused subset
node test_runner_full.js   # full suite, alternate runner
```

The embedded math core (RNG, linear algebra, distributions, optimisers) is
covered by the same suites.

## License

See `LICENSE`.
