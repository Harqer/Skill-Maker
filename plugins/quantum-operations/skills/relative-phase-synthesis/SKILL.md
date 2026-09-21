---
name: relative-phase-synthesis
description: Reduce cost in Toffoli/conjunction-heavy reversible circuits using relative-phase constructions and temporary-AND patterns when phase semantics permit. Use only after proving that introduced relative phases are unobservable or correctly canceled.
---

# Relative-Phase Synthesis

1. Mark every conjunction/Toffoli region with its phase contract.
2. Replace exact Toffolis with lower-cost relative-phase variants only when the surrounding compute/use/uncompute structure makes the phase irrelevant or guarantees cancellation.
3. Consider temporary-AND constructions for values that are computed, consumed, and erased rather than exposed as persistent logical outputs.
4. Prefer paired compute/uncompute templates that cancel phase artifacts by construction.
5. Do not use a relative-phase replacement when the temporary participates in interference where the phase is observable.
6. After substitution, verify unitary equivalence up to the explicitly permitted phase relation and then remeasure native 2Q cost/depth.

Never apply this skill mechanically to every CCX.
