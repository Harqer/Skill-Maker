# SHA-256 optimization objective

Primary objective: push the exact implementation toward the lowest achievable Pareto frontier of:

1. peak live qubits / physical width;
2. native two-qubit count;
3. native two-qubit depth;
4. total native depth.

Do not optimize one metric in isolation. A width-reducing recomputation is useful only if the resulting depth/count remains within the hardware/runtime envelope; a gate-count reduction is not useful if it increases width beyond the target QPU.

Track resource deltas after every major transformation so regressions are attributable.
