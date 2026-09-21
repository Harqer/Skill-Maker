# Fire Opal boundaries

Fire Opal's role is hardware execution quality, including automated hardware-aware compilation/error suppression/mitigation. It is not a general replacement for circuit synthesis or width optimization.

Current documented behavior to remember:

- `execute` runs circuits through Fire Opal's managed error-suppression workflow.
- `validate` can detect circuit/hardware feasibility problems before execution.
- Fire Opal jobs/actions can be asynchronous.
- Fire Opal recommends retrieving results through its own result path so its post-processing is preserved.
- Simulators are not currently supported.
- Supported providers must be checked at use time rather than inferred from the phrase "hardware agnostic".

Primary documentation:
- https://docs.q-ctrl.com/fire-opal/discover/adopt/fire-opal-overview
- https://docs.q-ctrl.com/fire-opal/discover/hardware-providers/supported-hardware-providers
- https://docs.q-ctrl.com/fire-opal/frequently-asked-questions
