# pytket pass guide

Common current primitives:

- `SequencePass([...])`: explicit composable pipeline with predicate compatibility checks.
- `FullPeepholeOptimise()`: broad peephole + 2/3-qubit resynthesis.
- `PeepholeOptimise2Q()`: 2Q-focused peephole path.
- `PauliSimp()` / `GreedyPauliSimp()`: Pauli-gadget simplification/resynthesis.
- `OptimisePhaseGadgets()`: phase-gadget optimization.
- `AutoRebase(...)` / `RebaseCustom(...)`: target gate-set conversion.
- placement and routing passes: architecture mapping.

Compiler discipline:

- Strong unconstrained optimization usually belongs before placement/routing.
- Post-route cleanup is often worthwhile.
- Track predicates and gate-set/connectivity constraints explicitly.
- Compare custom pipelines against the backend's default compilation pass.
- Do not accept a pass because it reduced abstract gate count if native 2Q depth or routing overhead gets worse.

Primary documentation:
- https://docs.quantinuum.com/tket/api-docs/passes.html
- https://docs.quantinuum.com/tket/user-guide/manual/manual_compiler.html
