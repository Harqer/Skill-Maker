---
name: sha256-quantum-optimization
description: Optimize an exact, general reversible SHA-256 implementation for real quantum hardware. Use for SHA-256 message schedule, Ch/Maj/Sigma fusion, multi-operand round arithmetic, ancilla reuse, width reduction, feed-forward, and native-cost minimization across all 64 rounds.
---

# SHA-256 Quantum Optimization

Preserve exact SHA-256 semantics for arbitrary supported messages. Never replace the workload with reduced rounds or a message-specialized circuit unless explicitly requested.

Apply the plugin skills as one coupled design problem:

1. Keep `ROTR` operations as index/wire interpretation changes whenever the representation permits. Treat `SHR` carefully because it injects zeros rather than permuting all bits.
2. Fuse `Sigma1(e)`, `Ch(e,f,g)`, `h`, `K[t]`, and `W[t]` before committing to a chain of independent carry-propagating adders.
3. Fuse `Sigma0(a)` and `Maj(a,b,c)` and share Boolean products/parities when profitable.
4. Evaluate carry-save/compressor representations across the multi-operand round sum; propagate carries only where required by the next semantic boundary.
5. Specialize round constants and padded-message constants aggressively while keeping the implementation general for the declared message interface.
6. Stream/reuse temporaries and schedule immediate uncomputation.
7. Treat the 16-word message-schedule dependency as a real liveness constraint. Recompute/pebble only when the width reduction justifies the added gates/depth.
8. Optimize complete rounds and cross-round boundaries before expanding to primitive gates.
9. Apply relative-phase/temporary-AND synthesis only with proven phase safety.
10. Apply ZX/TKET-style cleanup after semantic synthesis, then lower to the actual backend and measure native metrics.
11. Verify all 64 rounds, feed-forward/chaining, padding/message schedule, and final digest against classical SHA-256 known-answer vectors.

Read `references/sha256-objectives.md` for the optimization objective.
