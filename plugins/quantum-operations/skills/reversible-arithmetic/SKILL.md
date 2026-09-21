---
name: reversible-arithmetic
description: Optimize exact reversible arithmetic for quantum circuits. Use for adders, multi-operand sums, modular arithmetic, carry networks, constant additions, carry-save representations, or arithmetic-heavy cryptographic circuits.
---

# Reversible Arithmetic

Choose arithmetic structure from the workload rather than defaulting to a familiar adder.

1. Count operands and identify where carry propagation is truly required.
2. For multi-operand sums, evaluate carry-save / compressor structures so intermediate additions do not repeatedly propagate carries.
3. Delay the final carry-propagating addition until the representation must return to ordinary binary.
4. Specialize additions by known constants; remove impossible carries and constant-controlled gates.
5. Compare ripple, lookahead/prefix, carry-save, in-place, out-of-place, measurement-assisted, and phase-based constructions under the **actual target cost model**.
6. Prefer in-place arithmetic when it reduces width without causing excessive recomputation or native 2Q depth.
7. Uncompute carry/work registers as soon as their information is no longer required.
8. Do not assume a lower Toffoli or T count implies a lower superconducting-hardware cost; lower and route before deciding.

Read `references/adder-selection.md` when choosing between arithmetic families.
