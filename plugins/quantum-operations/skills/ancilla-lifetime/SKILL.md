---
name: ancilla-lifetime
description: Reduce quantum width through ancilla liveness analysis, pooling, compute-consume-uncompute scheduling, borrowed/dirty ancillas, safe recomputation, and reversible pebbling. Use when peak live qubits or garbage registers limit hardware feasibility.
---

# Ancilla and Lifetime Optimization

Treat qubits as a liveness problem, not a static allocation problem.

- Draw def-use/liveness intervals for every temporary register.
- Use `compute -> consume -> uncompute` immediately when no later dependency needs the value.
- Pool non-overlapping temporaries instead of allocating per function or round.
- Distinguish clean, dirty, borrowed, resettable, and measured ancillas; never silently interchange their contracts.
- Prefer recomputation over storage when it lowers peak width enough to justify added native depth/count.
- Apply reversible pebbling to dependency graphs, but do not assume pebbling removes mandatory simultaneously-live dependencies.
- Reorder independent work to shorten temporary lifetimes.
- Where hardware/runtime permits mid-circuit reset/measurement and the algorithm permits it, compare qubit recycling against fully coherent uncomputation.
- Verify every released ancilla is restored to its required state and disentangled from live outputs.

Primary metric: **peak live qubits**, not total qubits ever allocated in source code.
