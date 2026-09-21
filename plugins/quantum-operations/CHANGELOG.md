# Changelog

## 0.2.0
- Added dedicated `fire-opal` skill with execution/support boundaries.
- Added dedicated `pyzx-optimization` skill and API/failure-mode reference.
- Added dedicated `pytket-optimization` skill and pass-selection reference.
- Converted `zx-tket-optimization` into an orchestration skill instead of conflating both toolchains.
- Updated the router so Fire Opal is treated as validation/error-suppressed execution, not a width-reduction substitute.
- Added `.codex-plugin/plugin.json` for broader OpenAI/Codex compatibility.
- Kept provider-specific hardware integrations out of the plugin; `hardware-native-lowering` remains generic and cross-hardware.

## 0.1.0
- Initial skills-first quantum-operations plugin.
