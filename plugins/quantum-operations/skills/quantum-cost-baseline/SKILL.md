---
name: quantum-cost-baseline
description: Build reproducible quantum resource baselines and compare candidates fairly. Use before or after optimization when width, gate count, native two-qubit count, depth, routing overhead, or ancilla liveness must be measured.
---

# Quantum Cost Baseline

1. Freeze the algorithm, input class, target backend, basis/native gate set, topology, compiler versions, seed, and optimization settings.
2. Record logical qubits and **peak live qubits** separately.
3. Record logical operation counts by family before decomposition.
4. After native lowering, record at minimum:
   - native 2Q count;
   - native 2Q depth;
   - total native depth;
   - routed SWAP-equivalent overhead if applicable;
   - measurement/reset count;
   - final physical width.
5. Keep width/depth/count as a Pareto comparison. Do not collapse them into one score unless the target hardware supplies a justified cost model.
6. For every candidate, use identical compilation conditions and verify functional equivalence before accepting the resource delta.
7. Report both absolute values and deltas from baseline.
