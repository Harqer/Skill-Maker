---
name: pyzx-optimization
description: Use PyZX for ZX-calculus, Clifford+T, phase-polynomial, CNOT, and circuit-level simplification after semantic/reversible optimization. Use when a unitary circuit can benefit from ZX rewriting, phase-gadget fusion, T-count reduction, or parity-network resynthesis, while guarding against extraction and architecture-unaware regressions.
---

# PyZX Optimization

Use PyZX as a **post-semantic optimizer**, not as the first optimization stage.

## Preconditions

- Preserve high-level algorithm semantics, arithmetic structure, ancilla lifetimes, and Boolean fusion opportunities before converting to PyZX.
- Determine whether the candidate region is unitary and compatible with the chosen PyZX path. Do not silently run graph extraction over unsupported measurement/reset/classical-control semantics.
- Record the pre-PyZX width, 2Q count, depth, and relevant Clifford+T statistics.

## Optimization paths

Choose the least-destructive path that addresses the bottleneck:

1. `pyzx.optimize.basic_optimization` for local gate commutation/cancellation.
2. `pyzx.optimize.phase_block_optimize` for **Clifford+T** phase-polynomial regions only. Do not feed arbitrary smaller-angle rotations or Toffoli-like gates into this pass without first producing a supported representation.
3. `pyzx.optimize.full_optimize` when the circuit representation satisfies its assumptions and gate-level optimization is sufficient.
4. ZX graph simplification with `full_reduce` when global ZX rewrites are justified.
5. Consider phase teleportation when T/phase reduction is desired without fully restructuring the circuit through graph extraction.

## Extraction discipline

- Treat `extract_circuit` as a resynthesis step, not a guaranteed gate-count reduction.
- PyZX extraction is not architecture-aware and can increase CNOT/2Q count. Always re-measure the extracted circuit.
- Follow extraction with circuit-level cleanup when beneficial.
- Preserve a pre-extraction candidate when the graph is better as an analysis/phase-optimization artifact than as a final circuit.

## Verification

- Use `verify_equality` where applicable, understanding that successful reduction proves the attempted equivalence relation while a non-success is not automatically proof of inequality.
- For small blocks, supplement with exact tensor/matrix checks when feasible.
- Re-run the plugin's `quantum-verification` skill after major rewrites.

## Acceptance rule

Never accept a PyZX rewrite because the ZX graph is smaller or the T-count fell. Accept it only if exactness is preserved and the downstream target-native Pareto metrics improve.

Read `references/pyzx-playbook.md` for API-level guidance and failure modes.
