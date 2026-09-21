---
name: zx-tket-optimization
description: Orchestrate PyZX and pytket as complementary post-semantic optimization stages. Use when deciding whether a circuit needs ZX/phase-polynomial simplification, compiler-pass resynthesis, architecture mapping, or a measured comparison of multiple optimization pipelines.
---

# PyZX / pytket Orchestration

This is a router, not a monolithic "run both" instruction.

- Load `pyzx-optimization` for ZX-calculus, phase-polynomial, Clifford+T, parity-network, or graph-based simplification.
- Load `pytket-optimization` for explicit compiler-pass sequences, rebasing, Pauli/phase-gadget optimization, placement, routing, and backend-aware cleanup.
- Run semantic, arithmetic, Boolean, and ancilla-lifetime optimization first.
- Do not assume `PyZX -> pytket` or `pytket -> PyZX` is always superior. Compile both orders when the circuit class justifies comparison.
- Preserve candidate checkpoints because a later resynthesis/extraction stage can erase earlier wins.
- Verify exactness after each representation-changing stage.
- Accept only target-relevant Pareto improvements after final lowering/routing.
