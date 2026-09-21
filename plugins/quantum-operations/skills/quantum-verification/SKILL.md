---
name: quantum-verification
description: Verify exact quantum circuit optimizations with classical vectors, reversible/unitary checks, ancilla cleanup assertions, block equivalence, randomized differential tests, and resource-regression tests. Use after every transformation that changes circuit structure.
---

# Quantum Verification

Use layered verification so optimization never outruns correctness.

- Unit-test reversible primitives against classical functions on exhaustive domains when small enough.
- Use randomized/property-based vectors for larger word sizes.
- Check forward+inverse identity for reversible blocks.
- Assert ancillas return to the required state and do not remain entangled with live outputs.
- For phase-aware substitutions, verify the exact allowed equivalence relation rather than classical truth tables alone.
- Differentially compare pre- and post-optimization circuits at block boundaries.
- Maintain known-answer vectors for the complete algorithm.
- Add resource-regression tests so a correctness-preserving change cannot silently explode width or native 2Q cost.
- Validate locally/static-first; reserve metered hardware runs for the complete intended workload.
