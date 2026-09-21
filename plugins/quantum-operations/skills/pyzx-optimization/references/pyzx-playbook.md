# PyZX playbook

Current PyZX optimization primitives worth considering:

- `pyzx.simplify.full_reduce(graph)` for strong ZX-diagram simplification.
- `pyzx.extract_circuit(graph)` to resynthesize a circuit after graph reduction.
- `pyzx.optimize.basic_optimization(circuit)` for gate-level commutation/cancellation.
- `pyzx.optimize.phase_block_optimize(circuit)` for Clifford+T phase-polynomial regions.
- `pyzx.optimize.full_optimize(circuit)` combines circuit-level strategies.
- `Circuit.verify_equality(other)` for ZX-based equivalence checking when applicable.
- `Circuit.twoqubitcount()` for an intermediate 2Q metric.

Important caveats:

- Extraction is not architecture-aware and can increase two-qubit gates.
- `phase_block_optimize` is restricted to Clifford+T-style input and can produce incorrect output for unsupported smaller rotations or Toffoli-like gates.
- ZX simplification may be valuable even when direct circuit extraction is not the best final representation.
- Final acceptance always happens after downstream native lowering/routing.

Primary documentation:
- https://pyzx.readthedocs.io/en/latest/simplify.html
- https://pyzx.readthedocs.io/en/latest/api.html
