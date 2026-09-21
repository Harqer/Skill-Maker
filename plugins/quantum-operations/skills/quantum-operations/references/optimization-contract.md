# Optimization contract

Every candidate transformation must identify:

- semantic preconditions;
- whether relative phase is observable at that point;
- ancilla assumptions (clean, dirty, borrowed, measurement-assisted);
- asymptotic and concrete width effect;
- logical gate effect;
- target-native 2Q count/depth effect after lowering;
- routing/topology effect;
- exact verification method.

Reject transformations that improve an intermediate metric but worsen the final native objective without an explicit reason.

Never compare candidates under different compiler settings, basis gates, coupling maps, optimization levels, or measurement conventions.
