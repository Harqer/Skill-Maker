---
name: semantic-gate-reduction
description: Reduce quantum circuit work before decomposition by exploiting algorithm semantics, algebraic identities, constant propagation, virtual permutations, common subexpressions, and cross-boundary fusion. Use before generic gate-level optimizers.
---

# Semantic Gate Reduction

Work at the highest representation that still exposes algorithm structure.

- Treat rotations/permutations as logical wire or index remapping when representation and backend semantics permit; do not synthesize avoidable SWAP networks.
- Propagate constants before reversible synthesis. Specialize operations containing known constants instead of instantiating generic circuits.
- Fuse adjacent algorithmic expressions before lowering so inverse pairs, duplicate XORs, shared conjunctions, and redundant temporary values can disappear.
- Factor repeated subexpressions only when the saved recomputation exceeds storage/uncomputation cost.
- Reorder commuting operations to expose cancellation and reduce critical-path depth.
- Do not independently optimize tiny gates if doing so hides a larger cross-operation cancellation.
- Preserve semantic regions (`add`, `maj`, `ch`, rotations, comparisons, modular reductions, etc.) until the relevant domain-aware passes have run.

Acceptance requires exact verification and target-native remeasurement.
