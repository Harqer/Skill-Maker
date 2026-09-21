---
name: fire-opal
description: Use Q-CTRL Fire Opal correctly as a hardware-execution, validation, compilation, error-suppression, and mitigation layer when the selected backend is supported. Use when deciding whether Fire Opal belongs in a real-QPU workflow or when integrating its validate/execute/job-result semantics without confusing it with generic circuit synthesis.
---

# Fire Opal

Treat Fire Opal as an **optional real-hardware performance layer**, not as a substitute for semantic circuit design, width reduction, reversible synthesis, PyZX, pytket, or backend-independent verification.

## Place in the pipeline

Preferred conceptual order:

`algorithm semantics -> reversible/semantic optimization -> PyZX/pytket where useful -> candidate native feasibility -> Fire Opal validation/execution`

Fire Opal may perform its own hardware-aware compilation/error-suppression workflow at execution time. Avoid double-transpiling into a representation that prevents Fire Opal from doing its intended work unless its current documentation explicitly calls for that representation.

## Use Fire Opal when

- the workload targets a currently supported real-hardware path;
- the circuit already fits the target's width/connectivity/coherence envelope closely enough to be executable;
- error suppression and measurement-error mitigation can improve hardware-result fidelity;
- `validate` can prevent an infeasible or wasteful QPU submission;
- the user wants Fire Opal's managed execution/results rather than only compiler-side resource reduction.

## Do not use Fire Opal to claim

- that an over-wide logical circuit now fits a smaller QPU;
- that semantic gate/ancilla optimization is unnecessary;
- support for an arbitrary provider merely because Fire Opal describes its method as hardware-agnostic;
- simulator support: current Fire Opal documentation states that simulators are not supported;
- provider support that is not present in the current supported-hardware documentation.

## Current support must be checked

Fire Opal support changes over time. Before generating provider-specific integration code, verify Q-CTRL's current supported-hardware page. As of the documentation used to build this skill, general Fire Opal error-suppression access covers IBM Quantum Platform devices and IonQ devices through Amazon Braket, with some native/dedicated integrations documented separately.

## Execution discipline

- Prefer `validate` before metered execution when it provides the required feasibility checks.
- Retrieve results through Fire Opal's result path so post-processing is retained; do not substitute raw provider results when the objective is Fire Opal-enhanced output.
- Track asynchronous Fire Opal job/action identifiers when using nonblocking execution.
- Keep Fire Opal output quality metrics separate from structural metrics such as logical width, native 2Q count, and depth.

Read `references/fire-opal-boundaries.md` before using Fire Opal in a provider-specific workflow.
