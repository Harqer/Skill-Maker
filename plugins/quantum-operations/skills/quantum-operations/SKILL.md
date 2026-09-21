---
name: quantum-operations
description: Route quantum-circuit implementation and optimization work across specialized skills. Use when designing, auditing, or reducing an exact quantum workload for real hardware, especially when width, native two-qubit count, depth, ancilla use, arithmetic synthesis, or backend lowering matter.
---

# Quantum Operations Router

Use this skill as the entry point for nontrivial quantum circuit work.

## Non-negotiable rules

- Preserve the requested algorithm exactly unless the user explicitly allows approximation.
- Optimize the complete intended workload, not a toy substitute.
- Never claim an optimization from logical gate counts alone. Re-measure after target-native lowering.
- Optimize **peak live qubits**, **native 2Q count**, **native 2Q depth**, and **total depth** jointly; report tradeoffs instead of hiding them.
- Keep high-level semantic operations intact long enough to expose algebraic cancellation, fusion, constant propagation, and liveness opportunities.
- Prefer deterministic local/static validation before metered QPU execution.

## Skill selection

Load only the skills relevant to the bottleneck:

- Baseline/resource accounting → `quantum-cost-baseline`
- High-level gate removal/fusion → `semantic-gate-reduction`
- Adders, modular arithmetic, carry handling → `reversible-arithmetic`
- Qubit width, garbage, temporary registers → `ancilla-lifetime`
- XOR/AND networks, SHA Boolean layers → `boolean-fusion`
- Toffoli-heavy regions / phase-tolerant conjunctions → `relative-phase-synthesis`
- PyZX / ZX-calculus / phase-polynomial cleanup → `pyzx-optimization`
- pytket compiler-pass optimization / mapping → `pytket-optimization`
- Choosing or sequencing PyZX and pytket → `zx-tket-optimization`
- Fire Opal validation/error-suppressed hardware execution → `fire-opal`
- Backend basis/topology/routing → `hardware-native-lowering`
- Correctness and regression proof → `quantum-verification`
- SHA-256 specifically → `sha256-quantum-optimization`

For a full optimization pass, use this order unless evidence supports a different ordering:

1. Establish a reproducible cost baseline.
2. Apply semantic and algebraic reductions.
3. Restructure arithmetic and Boolean networks.
4. Reduce liveness and recycle ancillas.
5. Use phase-aware synthesis where legal.
6. Apply representation-appropriate PyZX and/or pytket simplification, preserving competing candidates.
7. Lower and route to the target QPU.
8. Verify exactness and compare native costs.
9. If supported and useful, apply Fire Opal at validation/execution time; do not treat it as a width-reduction substitute.
10. Iterate only when the Pareto frontier improves.

Read `references/optimization-contract.md` for the shared optimization contract.
