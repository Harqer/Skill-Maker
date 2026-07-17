"""
skillopt_integration.py — Bridges Skill Maker ↔ SkillOpt v0.2.0

Key responsibilities:
  1. register_skill_for_skillopt()
       Called by worker.py after each skill generation run.
       - Creates a `skill_card` custom environment (not searchqa)
       - Builds real training items from:
           a) scraped documentation markdown (via scraper.scrape_docs_to_temp_store)
           b) historical evaluations from Databricks (when available)
       - Writes a Gemini-compatible SkillOpt YAML config
  2. reingest_optimized_skill()
       Called after `skillopt train` completes.
       - Reads best_skill.md and pushes it back into:
           a) .agents/skills/<name>/SKILL.md  (live skill)
           b) Databricks `skills` table (versioned)
           c) Redis vector store (semantic search index)

Secrets are injected via Infisical — no .env usage (public repo).
"""

import json
import uuid
import os
import textwrap
from typing import Optional

import config  # noqa — runs Infisical SDK bootstrap
from config import SKILLOPT_ROOT as _SKILLOPT_ROOT_CFG

# ── Resolve SKILLOPT_ROOT ─────────────────────────────────────────────────────

SKILLOPT_ROOT = _SKILLOPT_ROOT_CFG
if not SKILLOPT_ROOT:
    try:
        import skillopt
        SKILLOPT_ROOT = os.path.dirname(os.path.dirname(skillopt.__file__))
    except ImportError:
        SKILLOPT_ROOT = ""

_AGENTS_SKILLS_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    ".agents", "skills"
)

_MAX_SCRAPED_CHARS = 40_000   # cap to avoid token overflow in training items
_SKILL_CARD_ENV    = "skill_card"


# ── Item builders ─────────────────────────────────────────────────────────────

def _build_items_from_scraped_docs(
    prompt: str,
    target_url: str,
    scraped_markdown: str,
) -> list[dict]:
    """
    Build SkillOpt training items from scraped documentation.

    Each item is a (question, context, answers) triple where:
      - question  = the user's original skill-creation prompt
      - context   = a chunk of the scraped documentation (capped at 4 000 chars)
      - answers   = [the best skill_content we have now] — SkillOpt will improve it

    We split the scraped markdown into chunks so SkillOpt sees multiple facets
    of the documentation, giving the optimizer more gradient signal per epoch.
    """
    if not scraped_markdown:
        return []

    # Trim total length to avoid LLM token overflow
    trimmed = scraped_markdown[:_MAX_SCRAPED_CHARS]

    # Split into sections at markdown '---' dividers or ## headers
    raw_sections = []
    for chunk in trimmed.split("\n\n---\n\n"):
        raw_sections.extend(chunk.split("\n## "))

    # Keep max 10 meaningful sections, each up to 4 000 chars
    sections = [s.strip() for s in raw_sections if len(s.strip()) > 100][:10]

    if not sections:
        sections = [trimmed[:4000]]  # fallback: single large item

    items = []
    for section in sections:
        items.append({
            "id": str(uuid.uuid4()),
            "question": prompt,
            "context": section[:4000],
            "answers": [section[:4000]],  # gold = the doc section itself
            "source_url": target_url,
        })
    return items


def _build_items_from_databricks(skill_id: int, limit: int = 20) -> list[dict]:
    """
    Pull historical evaluation pairs from Databricks for richer training signal.
    Falls back silently if Databricks is unavailable.
    """
    try:
        from databricks_store import get_store as get_databricks_store
        store = get_databricks_store()
        rows = store.list_evaluations(skill_id=str(skill_id), limit=limit)
        items = []
        for row in rows:
            items.append({
                "id": str(uuid.uuid4()),
                "question":  row.get("prompt", ""),
                "context":   row.get("guided_output", "")[:4000],
                "answers":   [row.get("guided_output", "")[:4000]],
                "source_url": row.get("target_url", ""),
            })
        return items
    except Exception as exc:
        print(f"[skillopt] Databricks items unavailable (non-fatal): {exc}")
        return []


# ── Main registration function ────────────────────────────────────────────────

def register_skill_for_skillopt(
    db_id: int,
    skill_content: str,
    prompt: str,
    target_url: str = "",
    scraped_markdown: str = "",
):
    """
    Called by worker.py after each skill generation run.

    Sets up a SkillOpt `skill_card` environment so the optimizer can
    iteratively improve the generated SKILL.md using real training data
    derived from scraped documentation.

    Args:
        db_id:            Database ID of the skill run (used as the skill name)
        skill_content:    The generated SKILL.md content (initial skill document)
        prompt:           Original user prompt (becomes the SkillOpt "question")
        target_url:       The URL that was scraped (used for richer item context)
        scraped_markdown: The raw scraped markdown from scraper.scrape_docs_to_temp_store()
    """
    if not SKILLOPT_ROOT:
        print("[skillopt] SKILLOPT_ROOT not found — skipping registration.")
        return

    skill_name = f"skill_{db_id}"
    print(f"[skillopt] Registering {skill_name} (url={target_url or 'N/A'})")

    # ── 1. Write initial skill document ──────────────────────────────────────
    skill_dir = os.path.join(SKILLOPT_ROOT, "skillopt", "envs", _SKILL_CARD_ENV, "skills", skill_name)
    os.makedirs(skill_dir, exist_ok=True)

    initial_md_path = os.path.join(skill_dir, "initial.md")
    with open(initial_md_path, "w") as f:
        f.write(skill_content)

    # ── 2. Build training items from scraped docs + Databricks history ────────
    scraped_items = _build_items_from_scraped_docs(prompt, target_url, scraped_markdown)
    db_items      = _build_items_from_databricks(db_id, limit=20)

    # Merge: Databricks items take priority (real evals), docs fill the rest
    all_items = db_items + scraped_items
    if not all_items:
        # Minimal fallback so SkillOpt doesn't error on empty split
        all_items = [{
            "id": str(uuid.uuid4()),
            "question": prompt,
            "context":  skill_content[:2000],
            "answers":  [skill_content[:2000]],
            "source_url": target_url,
        }]

    # Train/val/test split: 60% / 20% / 20% (min 1 per split)
    n = len(all_items)
    n_val  = max(1, int(n * 0.20))
    n_test = max(1, int(n * 0.20))
    n_train = max(1, n - n_val - n_test)

    train_items = all_items[:n_train]
    val_items   = all_items[n_train:n_train + n_val]
    test_items  = all_items[n_train + n_val:]

    data_dir = os.path.join(SKILLOPT_ROOT, "data", f"{skill_name}_split")
    for split_name, split_items in [
        ("train", train_items),
        ("val",   val_items),
        ("test",  test_items),
    ]:
        split_dir = os.path.join(data_dir, split_name)
        os.makedirs(split_dir, exist_ok=True)
        with open(os.path.join(split_dir, "items.json"), "w") as f:
            json.dump(split_items, f, indent=2)

    print(f"[skillopt] Data split: train={len(train_items)} val={len(val_items)} test={len(test_items)}")

    # ── 3. Write Gemini-compatible SkillOpt YAML config ───────────────────────
    config_dir = os.path.join(SKILLOPT_ROOT, "configs", skill_name)
    os.makedirs(config_dir, exist_ok=True)
    config_path = os.path.join(config_dir, "default.yaml")

    # Recommended hyperparameters from SkillOpt docs:
    # - learning_rate: 4  (moderate beats high/low)
    # - lr_scheduler: cosine  (beats constant)
    # - num_epochs: 3  (skills converge in 2–4 epochs)
    # - slow_update + meta_skill: on (curb forgetting, improve reflection)
    config_yaml = textwrap.dedent(f"""\
        _base_: ../_base_/default.yaml

        model:
          # Use Gemini via OpenAI-compatible endpoint or google backend
          # when SkillOpt adds native Google support.
          # Until then, point to an OpenAI-compatible proxy for Gemini.
          optimizer_model: gemini-2.0-flash
          target_model: gemini-2.0-flash
          reasoning_effort: medium

        train:
          train_size: {len(train_items)}
          batch_size: {min(5, len(train_items))}
          accumulation: 1
          num_epochs: 3

        gradient:
          minibatch_size: {min(5, len(train_items))}
          merge_batch_size: {min(5, len(train_items))}

        optimizer:
          learning_rate: 4
          lr_scheduler: cosine

        evaluation:
          sel_env_num: {len(val_items)}
          test_env_num: {len(test_items)}

        env:
          name: {_SKILL_CARD_ENV}
          skill_init: skillopt/envs/{_SKILL_CARD_ENV}/skills/{skill_name}/initial.md
          split_mode: split_dir
          split_dir: data/{skill_name}_split
          max_turns: 2
          max_completion_tokens: 4096
          workers: 2

        slow_update:
          enabled: true
          force_inject: false   # selection-gated

        meta_skill:
          enabled: true
    """)

    with open(config_path, "w") as f:
        f.write(config_yaml)

    print(f"[skillopt] Environment registered for {skill_name} "
          f"({len(all_items)} training items, env={_SKILL_CARD_ENV})")


# ── Post-training reingestion ─────────────────────────────────────────────────

def reingest_optimized_skill(skill_name: str, db_id: Optional[int] = None):
    """
    Called after `skillopt train` completes to push best_skill.md back into:
      1. .agents/skills/<skill_name>/SKILL.md  — live skill directory
      2. Databricks `skills` table             — versioned storage
      3. Redis vector store                    — semantic search index

    This closes the loop: optimized skill → production use → more evals → better opt.
    """
    if not SKILLOPT_ROOT:
        print("[skillopt] SKILLOPT_ROOT not set — cannot reingest.")
        return

    best_skill_path = os.path.join(
        SKILLOPT_ROOT, "outputs", skill_name, "best_skill.md"
    )
    if not os.path.exists(best_skill_path):
        print(f"[skillopt] best_skill.md not found at {best_skill_path} — skipping reingest.")
        return

    with open(best_skill_path) as f:
        content = f.read()

    # 1. Update live skill file
    skill_dir = os.path.join(_AGENTS_SKILLS_DIR, skill_name)
    os.makedirs(skill_dir, exist_ok=True)
    live_path = os.path.join(skill_dir, "SKILL.md")
    with open(live_path, "w") as f:
        f.write(content)
    print(f"[skillopt] Live skill updated: {live_path}")

    # 2. Upsert to Databricks
    try:
        from databricks_store import SkillRecord, get_store as get_databricks_store
        import datetime
        store = get_databricks_store()
        store.write_skill(SkillRecord(
            skill_id=str(db_id) if db_id else skill_name,
            skill_content=content,
            target_url="",
            created_at=datetime.datetime.utcnow().isoformat(),
            version=f"skillopt_best",
        ))
        print(f"[skillopt] Databricks updated for {skill_name}")
    except Exception as exc:
        print(f"[skillopt] Databricks reingest failed (non-fatal): {exc}")

    # 3. Update Redis vector store
    try:
        from skill_store import SkillVectorStore
        store = SkillVectorStore()
        skill_id = str(db_id) if db_id else skill_name
        n = store.ingest(skill_id=skill_id, markdown=content)
        print(f"[skillopt] Redis vector store updated: {n} chunks for {skill_id}")
    except Exception as exc:
        print(f"[skillopt] Redis vector store reingest failed (non-fatal): {exc}")

    print(f"[skillopt] Reingest complete for {skill_name}")
