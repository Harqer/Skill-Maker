---
name: boolean-fusion
description: Optimize reversible Boolean networks by fusing XOR/AND expressions, sharing nonlinear terms, eliminating duplicate parity work, and synthesizing whole Boolean regions instead of isolated gates. Use for cryptographic Ch/Maj/Sigma layers and other XOR/AND-heavy logic.
---

# Boolean Fusion

- Convert the target region into an explicit Boolean representation (ANF/XOR-AND graph, truth-table fragment, or equivalent IR) before gate decomposition when tractable.
- Canonicalize XOR terms so duplicates cancel modulo 2.
- Identify common AND/product terms and decide whether to compute once, reuse, then uncompute versus recompute locally.
- Fuse neighboring expressions that consume the same source bits; optimize the combined network, not each named function independently.
- Search for output-linear transformations that can be absorbed into surrounding CNOT/parity networks.
- Exploit known constants and mutually exclusive terms.
- Keep rotations/index permutations virtual when possible so the Boolean optimizer sees the true dependency pattern rather than SWAP noise.
- Compare multiplicative complexity/nonlinear-operation count as an intermediate metric, then validate native 2Q count and depth after synthesis.
