---
name: hardware-native-lowering
description: Lower and route optimized quantum circuits for the actual target QPU using its native gates, connectivity, directionality, calibration constraints, and dynamic-circuit capabilities. Use before making final width/count/depth claims or submitting hardware jobs.
---

# Hardware-Native Lowering

1. Query or load the real target backend description; do not assume a generic all-to-all architecture.
2. Freeze a reproducible calibration/topology snapshot for comparisons when possible.
3. Rebase to the actual native gate family before final cost claims.
4. Perform placement with interaction frequency and critical paths in mind, then route.
5. Re-run cancellation/peephole passes after routing because inserted movement exposes new simplifications.
6. Measure physical width, native 2Q count, native 2Q depth, and total depth.
7. Compare alternate mappings/seeds where nondeterministic routing materially changes the result.
8. Do not spend QPU credits merely to validate compilation; use local/static compilation and provider dry-run/resource tooling when available.

Read `references/backend-checklist.md` before declaring a circuit hardware-feasible.
