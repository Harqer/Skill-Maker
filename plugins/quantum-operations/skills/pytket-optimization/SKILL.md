---
name: pytket-optimization
description: Use pytket compilation passes to simplify, resynthesize, rebase, place, route, and post-route-clean quantum circuits across hardware targets. Use for pass-pipeline design, phase/Pauli gadget optimization, peephole resynthesis, architecture mapping, or cross-checking another compiler's result.
---

# pytket Optimization

Use pytket as a composable compiler layer. Build an explicit pass sequence rather than invoking many passes blindly.

## Pass ordering

1. Preserve semantic/reversible optimization opportunities before decomposing structured operations.
2. Decompose boxes only when a downstream pass requires primitives.
3. Apply strong structure-aware or resynthesis passes **before** hard device constraints when their preconditions are satisfied.
4. Rebase only when needed for a chosen optimization or target gate set.
5. Apply placement and routing against the target architecture.
6. Re-run safe cleanup/peephole passes after routing to remove movement-induced redundancy.
7. Validate backend predicates and measure final native resources.

## Useful pass families

- `FullPeepholeOptimise` for broad 2- and 3-qubit peephole/resynthesis cleanup.
- `PeepholeOptimise2Q` when the older 2Q-focused behavior is specifically desired.
- `PauliSimp` / `GreedyPauliSimp` for suitable Pauli-gadget structure.
- `OptimisePhaseGadgets` for phase-gadget regions.
- `KAKDecomposition` / three-qubit squash-style resynthesis when applicable.
- `AutoRebase` / `RebaseCustom` for gate-set conversion.
- placement/routing passes for architecture constraints.
- `SequencePass` to make the pipeline explicit and predicate-aware.

## Cautions

- A powerful resynthesis pass can invalidate structure produced by earlier optimization. Measure after each major stage and retain the best candidate.
- Some passes do not preserve global phase. Decide whether global phase is semantically irrelevant before using them.
- ZX resynthesis inside pytket can discard earlier optimization gains and may increase circuit cost; do not assume it is monotonic.
- Routing can invalidate previously satisfied predicates, so solve constraints in a deliberate order.
- Backend default compilation is useful as a baseline, not proof that no better custom pass pipeline exists.

## Acceptance rule

Compare multiple pass sequences under identical target constraints. Keep the candidate that improves the relevant Pareto metrics while preserving the algorithm's required equivalence relation.

Read `references/pytket-pass-guide.md` for a compact pass-selection guide.
