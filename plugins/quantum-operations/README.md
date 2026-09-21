# Quantum Operations

A skills-first plugin that gives ChatGPT, Codex, and compatible Claude environments reusable context for **exact quantum-circuit implementation and aggressive resource reduction across different hardware targets**.

The plugin focuses on transferable quantum-operations knowledge rather than provider-specific execution wrappers. It has no MCP dependency in v0.2.0.

## Core objective

Minimize, jointly:

- peak live qubits / circuit width;
- target-native two-qubit count;
- target-native two-qubit depth;
- total depth;

while preserving the requested computation exactly unless approximation is explicitly allowed.

## Skills

- `quantum-operations` — top-level router.
- `quantum-cost-baseline` — reproducible resource accounting.
- `semantic-gate-reduction` — optimize before lowering.
- `reversible-arithmetic` — adders, carry-save, constant arithmetic.
- `ancilla-lifetime` — compute/use/uncompute, pooling, recomputation, pebbling.
- `boolean-fusion` — XOR/AND sharing and nonlinear-network fusion.
- `relative-phase-synthesis` — phase-safe Toffoli/conjunction reductions.
- `pyzx-optimization` — ZX-calculus and phase-polynomial optimization.
- `pytket-optimization` — pass pipelines, rebasing, placement, routing, cleanup.
- `zx-tket-optimization` — chooses/sequences PyZX and pytket rather than blindly chaining them.
- `hardware-native-lowering` — generic target-native lowering, not provider-specific guidance.
- `fire-opal` — Fire Opal validation/error-suppressed real-hardware execution boundaries.
- `quantum-verification` — exactness, phase, ancilla, and resource regression checks.
- `sha256-quantum-optimization` — specialized exact SHA-256 optimization workflow retained from the original research.

## Design rule

The router loads only the relevant skills. Detailed references live under each skill so routine requests do not inject the entire plugin into context.

## Compatibility

- Portable Agent Plugins manifest: `plugin.json`
- OpenAI/Codex compatibility manifest: `.codex-plugin/plugin.json`
- Claude Code compatibility manifest: `.claude-plugin/plugin.json`

## Why no provider-specific skills?

Hardware-specific provider APIs, backend names, credentials, and availability change quickly and would make the plugin stale. The plugin instead teaches the model how to reason about target-native gates, topology, routing, calibration constraints, and execution quality in a provider-neutral way. Provider facts should be retrieved from current documentation when needed.
