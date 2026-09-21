# Adder selection checklist

Evaluate each candidate on:

- input/output register contract;
- clean/dirty ancilla requirement;
- peak live qubits;
- forward and inverse cost;
- critical-path depth;
- number and locality of nonlinear operations;
- constant-specialization opportunities;
- target-native routing cost.

For a chain of several additions, evaluate the **whole chain** rather than multiplying the cost of an isolated adder.
